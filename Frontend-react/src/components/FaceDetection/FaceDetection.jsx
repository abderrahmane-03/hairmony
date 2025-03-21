"use client"

import { useState, useRef, useCallback } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function UploadImage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [faceData, setFaceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const { userId } = useAuth()
  const [showPaymentModal, setShowPaymentModal] = useState(false) // <-- controls popup

  const navigate = useNavigate()

  // Called when user selects a file
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setFaceData(null) // Reset previous results
      setError("")
    }
  }

  // Drag & drop
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } })
    }
  }

  /**
   * Check usage before analyzing
   * e.g. GET /usage/check?feature=upload&userId=123
   */
  const checkUsage = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8443/usage/check", {
        params: { feature: "upload", userId },
      })
      return res.data.status === "OK"
    } catch (err) {
      console.error("Usage check error:", err)
      return false
    }
  }, [userId])

  // "Analyze Face" button
  const handleAnalyzeClick = async () => {
    // 1) Check usage first
    const canUse = await checkUsage()
    if (!canUse) {
      setShowPaymentModal(true)
      return
    }
    handleUpload()
  }

  async function handleUpload() {
    if (!image) {
      alert("Please upload an image first!")
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      // 1) Get original dimensions
      const { originalWidth, originalHeight } = await getImageDimensions(image)

      // 2) Resize to 600x600
      const { blob: resizedBlob, width: resizedWidth, height: resizedHeight } = await resizeImage(image, 600, 600)
      const resizedFile = new File([resizedBlob], "resized.jpg", {
        type: resizedBlob.type,
      })

      // 3) Send to backend
      const formData = new FormData()
      formData.append("file", resizedFile)

      const response = await axios.post("http://localhost:8443/AI/analyze-face", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })

      // 4) Parse response
      const { shape, hairstyles, faceRect, landmarks, foreheadTip } = response.data
      setFaceData({ shape, hairstyles, faceRect, landmarks, foreheadTip })

      // 5) Draw shape on the overlaid <canvas>
      drawDiamond(landmarks, foreheadTip, {
        originalWidth,
        originalHeight,
        resizedWidth,
        resizedHeight,
      })
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Failed to analyze face")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setUploadProgress(0)
      }, 2000)
    }
  }

  // Helper: get image dimensions
  function getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ originalWidth: img.width, originalHeight: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Helper: resize image
  function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"))
              return
            }
            resolve({ blob, width, height })
          },
          file.type,
          0.9,
        )
      }

      img.onerror = (err) => reject(err)
      img.src = URL.createObjectURL(file)
    })
  }

  // Draw diamond shape: leftCheek -> foreheadTip -> rightCheek -> chin
  function drawDiamond(landmarks, foreheadTip, { originalWidth, originalHeight, resizedWidth, resizedHeight }) {
    if (!landmarks || !foreheadTip) return
    const CHIN_INDEX = 8
    const LEFT_CHEEK_INDEX = 1
    const RIGHT_CHEEK_INDEX = 15

    const chin = landmarks[CHIN_INDEX]
    const leftCheek = landmarks[LEFT_CHEEK_INDEX]
    const rightCheek = landmarks[RIGHT_CHEEK_INDEX]

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.src = preview

    // Calculate scaling factors
    const scaleX = originalWidth / resizedWidth
    const scaleY = originalHeight / resizedHeight

    img.onload = () => {
      canvas.width = img.width // Original width
      canvas.height = img.height // Original height
      ctx.drawImage(img, 0, 0)

      // Scale the coordinates
      const scaledForeheadTip = {
        x: foreheadTip.x * scaleX,
        y: foreheadTip.y * scaleY,
      }
      const scaledLeftCheek = {
        x: leftCheek.x * scaleX,
        y: leftCheek.y * scaleY,
      }
      const scaledRightCheek = {
        x: rightCheek.x * scaleX,
        y: rightCheek.y * scaleY,
      }
      const scaledChin = {
        x: chin.x * scaleX,
        y: chin.y * scaleY,
      }

      // Draw diamond
      ctx.strokeStyle = "#4f46e5" 
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(scaledLeftCheek.x, scaledLeftCheek.y)
      ctx.lineTo(scaledForeheadTip.x, scaledForeheadTip.y)
      ctx.lineTo(scaledRightCheek.x, scaledRightCheek.y)
      ctx.lineTo(scaledChin.x, scaledChin.y)
      ctx.closePath()
      ctx.stroke();

      [chin, leftCheek, rightCheek, foreheadTip].forEach((point) => {
        ctx.fillStyle = "#ef4444" // red-500
        ctx.beginPath()
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    }
  }

  return (
    <div
      className="pt-24 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800  pb-12 px-4"
      onDragEnter={handleDrag}
    >
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Payment Required</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              You must pay $2 or have unlimited access to use picture face shape detection.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => navigate("/pay")}
              >
                Pay Now
              </button>
              <button
                className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
                onClick={() => setShowPaymentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="text-2xl font-semibold mb-6 animate-pulse">Analyzing facial features...</div>
          <div className="w-80 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-4 text-gray-300 text-sm">This will just take a moment</p>
          <div className="absolute w-46 h-40 bottom-0 right-0 z-50 " style={{ width: '12rem', height: '12rem', overflow: 'hidden'}}>
            <img
             
              src="/src/assets/loading.png"
              alt="cropped view"
              style={{
                position: 'absolute',
                clipPath: 'inset(0 35px 0 30px)', // crops 20px from left and 40px from right
              }}
            />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Face Shape <span className="text-indigo-600 dark:text-indigo-400">Detection</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your photo to discover your face shape and get personalized hairstyle recommendations.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
              onClick={() => navigate("/pay")}
            >
              Pay Now
            </button>
          </div>
        )}

        {/* Drag & Drop Container */}
        <div
          className={`relative border-3 border-dashed rounded-2xl p-10 transition-all duration-300 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-lg"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 shadow-md"
          }`}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Upload UI */}
          {!preview ? (
            <div className="space-y-6 text-center">
              <div
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-colors ${
                  dragActive ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <svg
                  className={`h-12 w-12 transition-colors ${
                    dragActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dragActive ? "Drop to upload!" : "Upload your photo"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">Drag and drop your photo here, or click to browse</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400">Supported formats: PNG, JPG, JPEG (Max 10MB)</p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Select Photo
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview + Canvas */}
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setPreview(null)
                      setImage(null)
                      setFaceData(null)
                    }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700 dark:text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <img
                  id="preview-image"
                  src={preview || "/placeholder.svg"}
                  alt="Selected"
                  className="w-full max-h-[500px] object-contain rounded-md"
                />
                <canvas ref={canvasRef} className="absolute top-0 right-40 w-38 h-full pointer-events-none" />
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyzeClick}
                  disabled={loading}
                  className={`inline-flex items-center px-8 py-4 text-lg font-medium rounded-xl shadow-lg transition-all duration-300 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transform hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                      Analyze Face
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Face Data Results */}
        {faceData && !loading && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Results</h2>
                  <p className="text-gray-500 dark:text-gray-400">Based on your facial features</p>
                </div>
              </div>
              <div className="inline-flex items-center px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                  Face Shape: <span className="ml-1 text-indigo-900 dark:text-indigo-100">{faceData.shape}</span>
                </span>
              </div>
            </div>

            {/* Hairstyle recommendations */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recommended Hairstyles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(faceData.hairstyles || []).map((style, index) => (
                  <div
                    key={index}
                    className="group relative p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl 
                              hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 
                              border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900
                              hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 
                                  rounded-xl flex items-center justify-center shadow-md group-hover:shadow-indigo-500/20 transition-all"
                      >
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01
                              M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{style}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                          Perfect match for your {faceData.shape.toLowerCase()} face shape
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Examples
                          </button>
                          <Link
                            to="/reservation"
                            state={{
                              faceShape: faceData.shape,
                              recommendedHairstyleNames: Array.isArray(faceData.hairstyles) ? faceData.hairstyles : [],
                              selectedHairstyleName: style // Pass the clicked hairstyle name
                            }}
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                          >
                            Book Appointment
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Want to try another photo or get more recommendations?
              </p>
              <button
                onClick={() => {
                  setPreview(null)
                  setImage(null)
                  setFaceData(null)
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Another Photor Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Webcam from "react-webcam"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function LiveFaceShape() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)

  const [faceData, setFaceData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [authorized, setAuthorized] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false) // <-- controls popup

  const { userId } = useAuth()
  const navigate = useNavigate()

  // 1) Check usage
  const checkUsage = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8443/usage/check", {
        params: { feature: "live", userId },
      })
      return res.data.status === "OK"
    } catch (err) {
      console.error("Usage check error:", err)
      return false
    }
  }, [userId])

  // 2) dataURL to Blob helper
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(",")
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  // 3) Draw shape on the canvas
  const drawShape = useCallback((data) => {
    if (!canvasRef.current || !webcamRef.current?.video) return

    const ctx = canvasRef.current.getContext("2d")
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    if (!data?.landmarks?.length || !data?.foreheadTip) return

    try {
      const video = webcamRef.current.video
      canvasRef.current.width = video.videoWidth
      canvasRef.current.height = video.videoHeight

      const chin = data.landmarks[8]
      const leftCheek = data.landmarks[1]
      const rightCheek = data.landmarks[15]
      const foreheadTip = data.foreheadTip
      if (!chin || !leftCheek || !rightCheek || !foreheadTip) return

      ctx.strokeStyle = "#4f46e5" // Tailwind's indigo-600
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(leftCheek.x, leftCheek.y)
      ctx.lineTo(foreheadTip.x, foreheadTip.y)
      ctx.lineTo(rightCheek.x, rightCheek.y)
      ctx.lineTo(chin.x, chin.y)
      ctx.closePath()
      ctx.stroke();

      // Draw points
      [chin, leftCheek, rightCheek, foreheadTip].forEach((point) => {
        ctx.fillStyle = "#ef4444" // red-500
        ctx.beginPath()
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    } catch (err) {
      console.error("Drawing error:", err)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  // 4) Start capturing frames
  const processFrame = useCallback(async () => {
    if (!webcamRef.current) return
    try {
      setIsLoading(true)
      const screenshot = webcamRef.current.getScreenshot()
      if (!screenshot) return

      const blob = dataURLtoBlob(screenshot)
      const formData = new FormData()
      formData.append("file", blob, "frame.jpg")

      const response = await axios.post("http://localhost:8443/AI/analyze-face", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setFaceData((prev) => (JSON.stringify(prev) === JSON.stringify(response.data) ? prev : response.data))
      drawShape(response.data)
      setError(null)
    } catch (err) {
      setError("Failed to analyze frame. Please try again.")
      console.error("Error detecting face shape:", err)
    } finally {
      setIsLoading(false)
    }
  }, [drawShape])

  // 5) On mount, check usage & either start detection or show modal
  useEffect(() => {
    let isMounted = true
    const intervalRef = { current: null }

    const startInterval = () => {
      // capture frame every ~1.5s
      intervalRef.current = setInterval(() => {
        if (isMounted) processFrame()
      }, 500)
    }

    checkUsage().then((ok) => {
      if (!isMounted) return
      if (ok) {
        setAuthorized(true)
        startInterval()
      } else {
        setAuthorized(false)
        setShowPaymentModal(true) // <-- show popup if not authorized
      }
    })

    return () => {
      isMounted = false
      clearInterval(intervalRef.current)
    }
  }, [checkUsage, processFrame])

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-12 px-4">
      {/* Payment Modal */}
      {showPaymentModal && !authorized && (
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
              You must pay $3 or have unlimited access to use Live Face Detection.
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
                onClick={() => navigate("/")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Live Face <span className="text-indigo-600 dark:text-indigo-400">Detection</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Real-time face shape analysis and personalized hairstyle recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Webcam */}
          <div className="lg:col-span-3">
            <div className="relative bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-1 rounded-2xl shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl"></div>

              <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                {/* Webcam status indicator */}
                <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">LIVE</span>
                </div>

                <div className="relative w-full h-full">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user",
                    }}
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute bottom-1 right-18 w-22 h-18"
                    style={{ pointerEvents: "none" }}
                  />
                </div>

                {/* Overlay instructions */}
                {!faceData && !isLoading && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-center p-6 bg-black/60 rounded-xl backdrop-blur-sm max-w-md">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Position Your Face</h3>
                      <p className="text-gray-200">
                        Center your face in the frame and look directly at the camera for best results
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute w-46 h-40 bottom-0 right-0 z-50 " style={{ width: '12rem', height: '12rem', overflow: 'hidden'}}>
                  <img
                   
                    src="/src/assets/loading.png"
                    alt="cropped view"
                    style={{
                      position: 'absolute',
                      clipPath: 'inset(0 35px 0 30px)',
                    }}
                  />
                </div>
                )}
              </div>

              {/* Camera controls */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={processFrame}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Capture Frame</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-full">
              <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Results</h2>
              </div>

              {error && authorized && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center">
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
              )}

              {!faceData && !isLoading && !error && authorized && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Waiting for Analysis</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                    Position your face in the camera frame to begin analysis
                  </p>
                </div>
              )}

              {faceData && authorized && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Face Shape Card */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Detected Face Shape</h3>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                          {faceData.shape}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Recommended Hairstyles
                    </h3>

                    <div className="space-y-3">
                      {(faceData?.hairstyles || []).map((style, index) => (
                        <div
                          key={index}
                          className="group relative p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl 
                                    hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 
                                    border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900
                                    hover:shadow-md transform hover:-translate-y-1"
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 
                                          rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-indigo-500/20 transition-all"
                            >
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{style}</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                                Perfect match for your {faceData.shape.toLowerCase()} face shape
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button className="inline-flex items-center px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                  className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xs font-medium transition-colors shadow-sm hover:shadow-md"
                                  state={{
                                    faceShape: faceData.shape,
                                    recommendedHairstyleNames: Array.isArray(faceData.hairstyles) ? faceData.hairstyles : [],
                                    selectedHairstyleName: style // Pass the clicked hairstyle name
                                  }}>
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                            
                                    
                                  Book Appointment
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Pro Tip</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          For the most accurate results, ensure good lighting and face the camera directly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


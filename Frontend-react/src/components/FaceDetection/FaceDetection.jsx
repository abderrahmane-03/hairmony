import { useState, useRef } from "react";
import axios from "axios";
import {Link} from "react-router-dom"

export default function UploadImage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

 

  // Called when user selects a file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setFaceData(null); // Reset previous results
    }
  };

  // Drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  /**
   * Resizes an image client-side using an offscreen canvas
   */
  async function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            resolve({ blob, width, height });
          },
          file.type,
          0.9
        );
      };

      img.onerror = (err) => reject(err);
      img.src = URL.createObjectURL(file);
    });
  }

  // "Analyze Face" button
  const handleUpload = async () => {
    if (!image) {
      alert("Please upload an image first!");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // 1) Original dimensions
      const img = new Image();
      const dimensionsPromise = new Promise((resolve) => {
        img.onload = () =>
          resolve({ originalWidth: img.width, originalHeight: img.height });
        img.src = URL.createObjectURL(image);
      });
      const { originalWidth, originalHeight } = await dimensionsPromise;

      // 2) Resize to 600x600
      const { blob: resizedBlob, width: resizedWidth, height: resizedHeight } =
        await resizeImage(image, 600, 600);
      const resizedFile = new File([resizedBlob], "resized.jpg", {
        type: resizedBlob.type,
      });

      // 3) Send to backend
      const formData = new FormData();
      formData.append("file", resizedFile);

      const response = await axios.post(
        "http://localhost:8443/public/analyze-face",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      // 4) Parse response
      const { shape, hairstyles, faceRect, landmarks, foreheadTip } =
        response.data;
      setFaceData({ shape, hairstyles, faceRect, landmarks, foreheadTip });

      // 5) Draw shape on the overlaid <canvas>
      drawDiamond(landmarks, foreheadTip, {
        originalWidth,
        originalHeight,
        resizedWidth,
        resizedHeight,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      // Keep overlay for at least 3s
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 3000);
    }
  };

  // Draw diamond shape: leftCheek -> foreheadTip -> rightCheek -> chin
  function drawDiamond(
    landmarks,
    foreheadTip,
    { originalWidth, originalHeight, resizedWidth, resizedHeight }
  ) {
    const CHIN_INDEX = 8;
    const LEFT_CHEEK_INDEX = 1;
    const RIGHT_CHEEK_INDEX = 15;

    const chin = landmarks[CHIN_INDEX];
    const leftCheek = landmarks[LEFT_CHEEK_INDEX];
    const rightCheek = landmarks[RIGHT_CHEEK_INDEX];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = preview;

    // Calculate scaling factors
    const scaleX = originalWidth / resizedWidth;
    const scaleY = originalHeight / resizedHeight;

    img.onload = () => {
      canvas.width = img.width; // Original width
      canvas.height = img.height; // Original height
      ctx.drawImage(img, 0, 0);

      // Scale the coordinates
      const scaledForeheadTip = {
        x: foreheadTip.x * scaleX,
        y: foreheadTip.y * scaleY,
      };
      const scaledLeftCheek = {
        x: leftCheek.x * scaleX,
        y: leftCheek.y * scaleY,
      };
      const scaledRightCheek = {
        x: rightCheek.x * scaleX,
        y: rightCheek.y * scaleY,
      };
      const scaledChin = {
        x: chin.x * scaleX,
        y: chin.y * scaleY,
      };

      // Draw diamond
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaledLeftCheek.x, scaledLeftCheek.y);
      ctx.lineTo(scaledForeheadTip.x, scaledForeheadTip.y);
      ctx.lineTo(scaledRightCheek.x, scaledRightCheek.y);
      ctx.lineTo(scaledChin.x, scaledChin.y);
      ctx.closePath();
      ctx.stroke();
    };
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20"
      onDragEnter={handleDrag}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col items-center justify-center text-white">
          <div className="animate-pulse text-xl mb-4">
            Analyzing facial features...
          </div>
          <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Drag & Drop Container */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          }`}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Upload UI */}
          {!loading && (
            <div className="space-y-6 text-center">
              <svg
                className={`mx-auto h-16 w-16 transition-colors ${
                  dragActive ? "text-indigo-600" : "text-gray-400"
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
              <div className="space-y-2">
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {dragActive ? "Drop to analyze!" : "Upload your photo"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: PNG, JPG, JPEG (Max 10MB)
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  Drag and drop your photo
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse files
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Select File
              </label>

              {/* Analyze Button */}
              <button
                onClick={handleUpload}
                disabled={!preview}
                className={`mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors duration-200 ${
                  preview
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Analyze Face
              </button>
            </div>
          )}
        </div>

        {/* Preview + Canvas */}
        {preview && (
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden p-4 mt-8">
            {/* The actual image */}
            <img
              id="preview-image"
              src={preview}
              alt="Selected"
              className="w-full max-h-96 object-contain rounded-md border"
            />

            {/* The canvas on top */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        )}

        {/* Face Data Results */}
        {faceData && !loading && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Detected Face Shape:{" "}
                <span className="font-semibold">{faceData.shape}</span>
              </span>
            </div>

            {/* Hairstyle suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(faceData.hairstyles || []).map((style, index) => (
                <div
                  key={index}
                  className="group relative p-6 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-all duration-200 border border-transparent hover:border-indigo-100 dark:hover:border-gray-500"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
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
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {style}
                      </h3>
                      <button className="mt-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-500 transition-colors">
                        View Examples →
                      </button>
                      <Link  to="/reservation" state={{ 
    faceShape: faceData.shape,
    recommendedHairstyles: faceData.hairstyles 
  }} 
                         className="text-green-600 dark:text-green-400 text-sm font-medium hover:text-green-700 dark:hover:text-green-300 flex items-center">
                        Book Appointment
                        <svg className="w-4 h-4 ml-1"  />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

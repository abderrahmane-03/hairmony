import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

export default function LiveFaceShape() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceData, setFaceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { 
    let isMounted = true;
    setIsLoading(true);

    async function captureFrame() {
      if (!webcamRef.current || !isMounted) return;
      
      try {
        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) return;

        const blob = dataURLtoBlob(screenshot);
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const response = await axios.post(
          "http://localhost:8443/public/analyze-face",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (isMounted) {
          setFaceData(response.data);
          drawShape(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError("Failed to analyze frame. Please try again.");
        console.error("Error detecting face shape:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const id = setInterval(captureFrame, 1000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  const drawShape = (data) => {
    if (!canvasRef.current || !webcamRef.current || !data?.landmarks?.length || !data?.foreheadTip) {
      // Clear canvas if no valid data
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }
  
    try {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
      const video = webcamRef.current.video;
canvasRef.current.width = video.videoWidth;
canvasRef.current.height = video.videoHeight;

  
      // Ensure canvas matches video dimensions
    //   if (canvasRef.current.width !== videoWidth || canvasRef.current.height !== videoHeight) {
    //     canvasRef.current.width = videoWidth;
    //     canvasRef.current.height = videoHeight;
    //   }
  
      // Safe landmark access with optional chaining
      const chin = data.landmarks[8];
      const leftCheek = data.landmarks[1];
      const rightCheek = data.landmarks[15];
      const foreheadTip = data.foreheadTip;
  
      // Validate all required points exist
      if (!chin || !leftCheek || !rightCheek || !foreheadTip) return;
  
      // Drawing logic
      ctx.strokeStyle = "#4f46e5"; // Using Tailwind's indigo-600
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftCheek.x, leftCheek.y);
      ctx.lineTo(foreheadTip.x, foreheadTip.y);
      ctx.lineTo(rightCheek.x, rightCheek.y);
      ctx.lineTo(chin.x, chin.y);
      ctx.closePath();
      ctx.stroke();
  
      // Draw landmark points
      [chin, leftCheek, rightCheek, foreheadTip].forEach(point => {
        ctx.fillStyle = "#ef4444"; // Tailwind's red-500
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
  
    } catch (err) {
      console.error("Drawing error:", err);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Webcam Section */}
        <div style={{ position: "relative" }} className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden aspect-video">
  <Webcam
    audio={false}
    ref={webcamRef}
    screenshotFormat="image/jpeg"
    style={{
      // Just let it size to 640×480 or the camera's dimension
      display: "block",
    }}
  />
  <canvas
    ref={canvasRef}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
    }}
  />
</div>


        {/* Results Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Live Face Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time face shape detection and hairstyle recommendations
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-8 space-x-2 text-indigo-600 dark:text-indigo-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing frame...</span>
            </div>
          )}

          {faceData && (
            <div className="space-y-6 animate-fade-in">
              {/* Face Shape Card */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
                <div className="flex items-center space-x-4">
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detected Face Shape
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {faceData.shape}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recommended Hairstyles
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {(faceData.hairstyles || []).map((style, index) => (
                    <div
                      key={index}
                      className="group flex items-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-md flex items-center justify-center mr-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <svg
                          className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
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
                      </div>
                      <span className="text-gray-700 dark:text-gray-200">
                        {style}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!faceData && !isLoading && !error && (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              <p>Position your face in the camera frame to begin analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

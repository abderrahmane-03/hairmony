import { useState, useRef } from "react";
import axios from "axios";

const UploadImage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const canvasRef = useRef(null);

  // Called when user selects a file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  /**
 * Resizes an image client-side using an offscreen canvas
 * @param {File} file - the original File object from <input type="file" />
 * @param {number} maxWidth - desired max width
 * @param {number} maxHeight - desired max height
 * @returns {Promise<Blob>} a Promise that resolves to the resized image blob
 */
function resizeImage(file, maxWidth, maxHeight) {
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
          // Resolve with both the blob and the dimensions
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
  const handleUpload = async () => {
    if (!image) {
      alert("Please upload an image!");
      return;
    }
  
    try {
      // Get original image dimensions
      const img = new Image();
      const dimensionsPromise = new Promise((resolve) => {
        img.onload = () => resolve({ originalWidth: img.width, originalHeight: img.height });
        img.src = URL.createObjectURL(image);
      });
      const { originalWidth, originalHeight } = await dimensionsPromise;
  
      // Resize the image
      const { blob: resizedBlob, width: resizedWidth, height: resizedHeight } = await resizeImage(image, 600, 600);
      const resizedFile = new File([resizedBlob], "resized.jpg", { type: resizedBlob.type });
  
      const formData = new FormData();
      formData.append("file", resizedFile);
  
      const response = await axios.post(
        "http://localhost:8443/public/analyze-face",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      const { shape, hairstyles, faceRect, landmarks, foreheadTip } = response.data;
      setFaceData({ shape, hairstyles, faceRect, landmarks, foreheadTip });
  
      // Draw the diamond, passing scaling factors
      drawDiamond(landmarks, foreheadTip, {
        originalWidth,
        originalHeight,
        resizedWidth,
        resizedHeight,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to detect face shape!");
    }
  };

  function drawDiamond(landmarks, foreheadTip, { originalWidth, originalHeight, resizedWidth, resizedHeight }) {
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
      canvas.width = img.width;  // Original width
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
            Discover Your Perfect Hairstyle
          </h2>
          
          {/* Custom File Upload */}
          <div className="flex flex-col items-center space-y-4">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              id="file-upload"
              className="hidden"
            />
            <label 
              htmlFor="file-upload"
              className="w-full flex flex-col items-center px-6 py-8 bg-gray-50 dark:bg-gray-700 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg 
                className="w-12 h-12 text-gray-400 mb-4" 
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
              <span className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Click to upload a photo
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                PNG, JPG, or JPEG (MAX. 5MB)
              </span>
            </label>
            
            <button 
              onClick={handleUpload}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              disabled={!preview}
            >
              <svg 
                className="w-5 h-5" 
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
              <span>Analyze Face Shape</span>
            </button>
          </div>
        </div>
  
        {/* Preview Section */}
        {preview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <canvas 
              ref={canvasRef}
              className="w-full h-auto max-h-96 object-contain p-4"
            />
          </div>
        )}
  
        {/* Results Section */}
        {faceData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Face Shape: 
                <span className="text-indigo-600 dark:text-indigo-400 ml-2">
                  {faceData.shape}
                </span>
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Based on our analysis, here are personalized recommendations:
              </p>
            </div>
  
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recommended Hairstyles
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(faceData.hairstyles || []).map((style, index) => (
                  <li 
                    key={index}
                    className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <svg 
                      className="flex-shrink-0 w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3"
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-200">{style}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadImage;
from flask import Flask, request, jsonify
import cv2
import mediapipe as mp
import numpy as np
import base64
import math

app = Flask(__name__)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)

def detect_forehead_tip(image_bytes):
    # Decode bytes to image
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        return None, None

    h, w, _ = img.shape  # Should be 600x600

    # Convert to RGB for MediaPipe
    results = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    if not results.multi_face_landmarks:
        return None, None

    face_landmarks = results.multi_face_landmarks[0].landmark

    # Get the 10th and 151st landmarks
    lm10 = face_landmarks[9]   # Forehead center
    lm151 = face_landmarks[150] # Nose bridge

    # Calculate Euclidean distance in normalized coordinates
    dist_normalized = math.sqrt((lm10.x - lm151.x)**2 + (lm10.y - lm151.y)**2)
    dist_pixels = dist_normalized * h

    # Adjust multiplier to place tip closer to lm10
    forehead_height_factor = 0.5  # Move halfway from lm10 toward the top
    extended_dist_normalized = forehead_height_factor * dist_normalized

    # Force forehead tip x to align with lm10 (no lateral shift)
    forehead_tip_x = lm10.x
    # Move upward only (negative y in normalized space = up)
    forehead_tip_y = lm10.y - extended_dist_normalized  # Subtract to move up

    # Convert to pixel coordinates, cap within [0, 600]
    forehead_x = max(0, min(600, int(forehead_tip_x * w)))
    forehead_y = max(0, min(600, int(forehead_tip_y * h)))

    # Debugging output
    print(f"lm10: ({lm10.x*w:.2f}, {lm10.y*h:.2f}), lm151: ({lm151.x*w:.2f}, {lm151.y*h:.2f})")
    print(f"Distance (pixels): {dist_pixels:.2f}, Extended: {extended_dist_normalized*h:.2f}")
    print(f"Forehead tip: ({forehead_x}, {forehead_y})")

    return forehead_x, forehead_y

@app.route("/detect-forehead", methods=["POST"])
def detect_forehead():
    data = request.json
    base64_img = data.get("image_base64")
    if not base64_img:
        return jsonify({"error": "No image_base64 found"}), 400

    image_bytes = base64.b64decode(base64_img)
    fx, fy = detect_forehead_tip(image_bytes)
    if fx is None:
        return jsonify({"error": "No face detected"}), 200

    return jsonify({
        "forehead_x": fx,
        "forehead_y": fy
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
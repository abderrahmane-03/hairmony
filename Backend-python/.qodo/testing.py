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
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        return None, None

    h, w, _ = img.shape  # 600x600

    # Convert to RGB for MediaPipe
    results = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    if not results.multi_face_landmarks:
        return None, None

    face_landmarks = results.multi_face_landmarks[0].landmark

    lm10 = face_landmarks[9] 
    lm151 = face_landmarks[150]

    dist_normalized = math.sqrt((lm10.x - lm151.x)**2 + (lm10.y - lm151.y)**2)
    dist_pixels = dist_normalized * h

    forehead_height_factor = 0.5
    extended_dist_normalized = forehead_height_factor * dist_normalized

    forehead_tip_x = lm10.x
    forehead_tip_y = lm10.y - extended_dist_normalized 

    forehead_x = max(0, min(600, int(forehead_tip_x * w)))
    forehead_y = max(0, min(600, int(forehead_tip_y * h)))

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
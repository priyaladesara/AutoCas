# server.py - Flask server to connect your frontend and backend
from flask import Flask, Response, render_template, jsonify
import cv2
import os
import numpy as np
from deepface import DeepFace
from gfpgan import GFPGANer
import threading
import time
import json

app = Flask(__name__, static_folder='.', static_url_path='')

# --- CONFIG ---
DATASET_DIR = "dataset"
MODEL_NAME = "ArcFace"
DETECTOR_BACKEND = "mtcnn"
DISTANCE_METRIC = "cosine"
DB_PATH = DATASET_DIR

# Global variables
output_frame = None
lock = threading.Lock()
attendance_data = []
cap = None
processing_active = False

def initialize_models():
    """Initialize GFPGAN and representation database"""
    global gfpganer
    
    # Initialize GFPGAN
    gfpganer = GFPGANer(
        model_path='experiments/pretrained_models/GFPGANv1.3.pth',
        upscale=1,
        arch='clean',
        channel_multiplier=2,
        bg_upsampler=None
    )
    
    # Build representation database if needed
    print("Building representation database...")
    try:
        first_person_dir = os.path.join(DATASET_DIR, os.listdir(DATASET_DIR)[0])
        first_image = os.path.join(first_person_dir, os.listdir(first_person_dir)[0])
        
        DeepFace.find(
            img_path=first_image,
            db_path=DB_PATH,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            distance_metric=DISTANCE_METRIC,
            enforce_detection=False
        )
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")

def face_recognition_loop():
    """Main processing loop for face recognition"""
    global output_frame, lock, attendance_data, cap, processing_active
    
    frame_count = 0
    
    while processing_active:
        ret, frame = cap.read()
        if not ret:
            break
        
        processed_frame = frame.copy()
        recognized_faces = []
        
        try:
            # Extract faces using DeepFace
            faces = DeepFace.extract_faces(
                img_path=frame,
                detector_backend=DETECTOR_BACKEND,
                enforce_detection=False,
                align=False
            )
            
            # Process each detected face
            for face_info in faces:
                region = face_info['facial_area']
                x, y, w, h = region['x'], region['y'], region['w'], region['h']
                face_crop = frame[y:y+h, x:x+w]
                
                # Restore with GFPGAN
                _, _, restored_face = gfpganer.enhance(
                    face_crop, has_aligned=False, only_center_face=False, paste_back=True
                )
                
                # Recognize face
                result = DeepFace.find(
                    img_path=restored_face,
                    db_path=DB_PATH,
                    model_name=MODEL_NAME,
                    detector_backend=DETECTOR_BACKEND,
                    distance_metric=DISTANCE_METRIC,
                    enforce_detection=False
                )
                
                # Process recognition results
                if len(result) > 0 and len(result[0]) > 0:
                    identity = result[0].iloc[0]['identity']
                    label = os.path.basename(os.path.dirname(identity))
                    distance = result[0].iloc[0]['distance']
                    confidence = 1 - distance  # Convert distance to confidence
                    
                    # Add to recognized faces list
                    recognized_faces.append({
                        'name': label,
                        'confidence': round(confidence * 100, 1),
                        'x': int(x),
                        'y': int(y),
                        'width': int(w),
                        'height': int(h)
                    })
                    
                    # Draw annotation on frame
                    cv2.rectangle(processed_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    cv2.putText(
                        processed_frame, 
                        f"{label} ({confidence:.2f})", 
                        (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2
                    )
                    
                    # Record attendance (avoiding duplicates)
                    current_time = time.strftime("%H:%M:%S")
                    
                    # Check if this person is already in attendance data
                    person_exists = False
                    for entry in attendance_data:
                        if entry['name'] == label:
                            person_exists = True
                            break
                    
                    if not person_exists:
                        attendance_data.append({
                            'id': len(attendance_data) + 1,
                            'name': label,
                            'status': 'Present',
                            'time': current_time
                        })
        
        except Exception as e:
            print(f"Error in face recognition: {e}")
        
        # Update the output frame
        with lock:
            output_frame = processed_frame.copy()
            
        frame_count += 1
        
        # Rate limiting to not overload the system
        time.sleep(0.03)  # ~30fps processing

def generate_frames():
    """Generator function for streaming video frames"""
    global output_frame, lock
    
    while True:
        with lock:
            if output_frame is None:
                continue
                
            # Encode the frame in JPEG format
            (flag, encoded_image) = cv2.imencode(".jpg", output_frame)
            
            if not flag:
                continue
                
        # Yield the output frame in byte format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + 
               bytearray(encoded_image) + b'\r\n')

@app.route('/')
def index():
    """Serve the main HTML page"""
    return app.send_static_file('index.html')

@app.route('/video_feed')
def video_feed():
    """Route for streaming video feed"""
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/start_detection')
def start_detection():
    """Start the face detection process"""
    global cap, processing_active
    
    if processing_active:
        return jsonify({'status': 'already_running'})
    
    try:
        # Initialize camera
        cap = cv2.VideoCapture(0)  # Use webcam
        processing_active = True
        
        # Start processing thread
        detection_thread = threading.Thread(target=face_recognition_loop)
        detection_thread.daemon = True
        detection_thread.start()
        
        return jsonify({'status': 'started'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/stop_detection')
def stop_detection():
    """Stop the face detection process"""
    global processing_active, cap
    
    processing_active = False
    if cap is not None:
        cap.release()
        cap = None
    
    return jsonify({'status': 'stopped'})

@app.route('/get_attendance')
def get_attendance():
    """Return current attendance data"""
    global attendance_data
    return jsonify(attendance_data)

@app.route('/reset_attendance')
def reset_attendance():
    """Reset attendance data"""
    global attendance_data
    attendance_data = []
    return jsonify({'status': 'reset'})

if __name__ == '__main__':
    # Initialize models before starting the server
    initialize_models()
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, threaded=True)
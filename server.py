# # OLDER VERSIONNN
    
# # server.py - Flask server to connect your frontend and backend
# from flask import Flask, Response, render_template, jsonify
# import cv2
# import os
# import numpy as np
# from deepface import DeepFace
# from gfpgan import GFPGANer
# import threading
# import time
# import json

# app = Flask(__name__, static_folder='.', static_url_path='')

# # --- CONFIG ---
# DATASET_DIR = "dataset"
# MODEL_NAME = "ArcFace"
# DETECTOR_BACKEND = "mtcnn"
# DISTANCE_METRIC = "cosine"
# DB_PATH = DATASET_DIR

# # Global variables
# output_frame = None
# lock = threading.Lock()
# attendance_data = []
# cap = None
# processing_active = False

# def initialize_models():
#     """Initialize GFPGAN and representation database"""
#     global gfpganer
    
#     # Initialize GFPGAN
#     gfpganer = GFPGANer(
#         model_path='experiments/pretrained_models/GFPGANv1.3.pth',
#         upscale=1,
#         arch='clean',
#         channel_multiplier=2,
#         bg_upsampler=None
#     )
    
#     # Build representation database if needed
#     print("Building representation database...")
#     try:
#         first_person_dir = os.path.join(DATASET_DIR, os.listdir(DATASET_DIR)[0])
#         first_image = os.path.join(first_person_dir, os.listdir(first_person_dir)[0])
        
#         DeepFace.find(
#             img_path=first_image,
#             db_path=DB_PATH,
#             model_name=MODEL_NAME,
#             detector_backend=DETECTOR_BACKEND,
#             distance_metric=DISTANCE_METRIC,
#             enforce_detection=False
#         )
#         print("Database initialized successfully")
#     except Exception as e:
#         print(f"Error initializing database: {e}")

# def face_recognition_loop():
#     """Main processing loop for face recognition"""
#     global output_frame, lock, attendance_data, cap, processing_active
    
#     frame_count = 0
    
#     while processing_active:
#         ret, frame = cap.read()
#         if not ret:
#             break
        
#         processed_frame = frame.copy()
#         recognized_faces = []
        
#         try:
#             # Extract faces using DeepFace
#             faces = DeepFace.extract_faces(
#                 img_path=frame,
#                 detector_backend=DETECTOR_BACKEND,
#                 enforce_detection=False,
#                 align=False
#             )
            
#             # Process each detected face
#             for face_info in faces:
#                 region = face_info['facial_area']
#                 x, y, w, h = region['x'], region['y'], region['w'], region['h']
#                 face_crop = frame[y:y+h, x:x+w]
                
#                 # Restore with GFPGAN
#                 _, _, restored_face = gfpganer.enhance(
#                     face_crop, has_aligned=False, only_center_face=False, paste_back=True
#                 )
                
#                 # Recognize face
#                 result = DeepFace.find(
#                     img_path=restored_face,
#                     db_path=DB_PATH,
#                     model_name=MODEL_NAME,
#                     detector_backend=DETECTOR_BACKEND,
#                     distance_metric=DISTANCE_METRIC,
#                     enforce_detection=False
#                 )
                
#                 # Process recognition results
#                 if len(result) > 0 and len(result[0]) > 0:
#                     identity = result[0].iloc[0]['identity']
#                     label = os.path.basename(os.path.dirname(identity))
#                     distance = result[0].iloc[0]['distance']
#                     confidence = 1 - distance  # Convert distance to confidence
                    
#                     # Add to recognized faces list
#                     recognized_faces.append({
#                         'name': label,
#                         'confidence': round(confidence * 100, 1),
#                         'x': int(x),
#                         'y': int(y),
#                         'width': int(w),
#                         'height': int(h)
#                     })
                    
#                     # Draw annotation on frame
#                     cv2.rectangle(processed_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
#                     cv2.putText(
#                         processed_frame, 
#                         f"{label} ({confidence:.2f})", 
#                         (x, y-10),
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2
#                     )
                    
#                     # Record attendance (avoiding duplicates)
#                     current_time = time.strftime("%H:%M:%S")
                    
#                     # Check if this person is already in attendance data
#                     person_exists = False
#                     for entry in attendance_data:
#                         if entry['name'] == label:
#                             person_exists = True
#                             break
                    
#                     if not person_exists:
#                         attendance_data.append({
#                             'id': len(attendance_data) + 1,
#                             'name': label,
#                             'status': 'Present',
#                             'time': current_time
#                         })
        
#         except Exception as e:
#             print(f"Error in face recognition: {e}")
        
#         # Update the output frame
#         with lock:
#             output_frame = processed_frame.copy()
            
#         frame_count += 1
        
#         # Rate limiting to not overload the system
#         time.sleep(0.03)  # ~30fps processing

# def generate_frames():
#     """Generator function for streaming video frames"""
#     global output_frame, lock
    
#     while True:
#         with lock:
#             if output_frame is None:
#                 continue
                
#             # Encode the frame in JPEG format
#             (flag, encoded_image) = cv2.imencode(".jpg", output_frame)
            
#             if not flag:
#                 continue
                
#         # Yield the output frame in byte format
#         yield (b'--frame\r\n'
#                b'Content-Type: image/jpeg\r\n\r\n' + 
#                bytearray(encoded_image) + b'\r\n')

# @app.route('/')
# def index():
#     """Serve the main HTML page"""
#     return app.send_static_file('index.html')

# @app.route('/video_feed')
# def video_feed():
#     """Route for streaming video feed"""
#     return Response(
#         generate_frames(),
#         mimetype='multipart/x-mixed-replace; boundary=frame'
#     )

# @app.route('/start_detection')
# def start_detection():
#     """Start the face detection process"""
#     global cap, processing_active
    
#     if processing_active:
#         return jsonify({'status': 'already_running'})
    
#     try:
#         # Initialize camera
#         cap = cv2.VideoCapture(0)  # Use webcam
#         processing_active = True
        
#         # Start processing thread
#         detection_thread = threading.Thread(target=face_recognition_loop)
#         detection_thread.daemon = True
#         detection_thread.start()
        
#         return jsonify({'status': 'started'})
#     except Exception as e:
#         return jsonify({'status': 'error', 'message': str(e)})

# @app.route('/stop_detection')
# def stop_detection():
#     """Stop the face detection process"""
#     global processing_active, cap
    
#     processing_active = False
#     if cap is not None:
#         cap.release()
#         cap = None
    
#     return jsonify({'status': 'stopped'})

# @app.route('/get_attendance')
# def get_attendance():
#     """Return current attendance data"""
#     global attendance_data
#     return jsonify(attendance_data)

# @app.route('/reset_attendance')
# def reset_attendance():
#     """Reset attendance data"""
#     global attendance_data
#     attendance_data = []
#     return jsonify({'status': 'reset'})

# if __name__ == '__main__':
#     # Initialize models before starting the server
#     initialize_models()
    
#     # Start Flask server
#     app.run(host='0.0.0.0', port=5500, threaded=True)


# NEWER VERSIONN------------------------------------------------------------------------
from flask import Flask, Response, render_template, jsonify
import cv2
import os
import numpy as np
from deepface import DeepFace
from gfpgan import GFPGANer
import threading
import time
import json
from collections import deque
from scipy import spatial

app = Flask(__name__, static_folder='.', static_url_path='')

# --- CONFIG ---
DATASET_DIR = "dataset"
MODEL_NAME = "ArcFace"
DETECTOR_BACKEND = "mtcnn"
DISTANCE_METRIC = "cosine"
DB_PATH = DATASET_DIR

# Performance tuning settings
PROCESS_EVERY_N_FRAMES = 3  # Process only every 3rd frame
CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence to consider a match valid
RECOGNITION_COOLDOWN = 5    # Seconds to wait before recognizing same person again

# Global variables
output_frame = None
lock = threading.Lock()
attendance_data = []
cap = None
processing_active = False
detected_faces_cache = {}   # Cache for recently detected faces
last_detection_times = {}   # Track when each person was last detected

def initialize_models():
    """Initialize GFPGAN and representation database"""
    global gfpganer, representations
    
    # Initialize GFPGAN with a smaller model if possible
    gfpganer = GFPGANer(
        model_path='experiments/pretrained_models/GFPGANv1.3.pth',
        upscale=1,
        arch='clean',
        channel_multiplier=2,
        bg_upsampler=None
    )
    
    # Pre-load representation database
    print("Building representation database...")
    try:
        # Preload representations into memory to speed up recognition
        representations = {}
        for person_folder in os.listdir(DATASET_DIR):
            person_path = os.path.join(DATASET_DIR, person_folder)
            if os.path.isdir(person_path):
                for img_file in os.listdir(person_path):
                    if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                        img_path = os.path.join(person_path, img_file)
                        try:
                            embedding = DeepFace.represent(
                                img_path=img_path,
                                model_name=MODEL_NAME,
                                detector_backend=DETECTOR_BACKEND,
                                enforce_detection=False
                            )
                            if person_folder not in representations:
                                representations[person_folder] = []
                            representations[person_folder].append(embedding)
                        except Exception as e:
                            print(f"Error processing {img_path}: {e}")
        
        print(f"Database initialized with {len(representations)} people")
    except Exception as e:
        print(f"Error initializing database: {e}")
        # Fallback to traditional method
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
        print("Database initialized with traditional method")

def compare_embeddings(embedding, threshold=CONFIDENCE_THRESHOLD):
    """Compare face embedding with preloaded database"""
    best_match = None
    best_confidence = 0
    
    for person, person_embeddings in representations.items():
        for ref_embedding in person_embeddings:
            # Calculate cosine similarity
            similarity = 1 - spatial.distance.cosine(
                embedding[0]["embedding"], 
                ref_embedding[0]["embedding"]
            )
            
            if similarity > threshold and similarity > best_confidence:
                best_confidence = similarity
                best_match = (person, similarity)
    
    return best_match

def face_recognition_loop():
    """Main processing loop for face recognition"""
    global output_frame, lock, attendance_data, cap, processing_active
    
    frame_count = 0
    frame_buffer = deque(maxlen=10)  # Buffer to hold recent frames
    detection_frame = None
    
    while processing_active:
        ret, frame = cap.read()
        if not ret:
            continue
        
        # Always add current frame to buffer
        frame_buffer.append(frame.copy())
        
        # Process only every N frames for detection
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            detection_frame = frame.copy()
            
            try:
                # Use a smaller resize factor for detection phase
                detection_frame_small = cv2.resize(detection_frame, (0, 0), fx=0.5, fy=0.5)
                
                # Extract faces using DeepFace
                faces = DeepFace.extract_faces(
                    img_path=detection_frame_small,
                    detector_backend=DETECTOR_BACKEND,
                    enforce_detection=False,
                    align=False
                )
                
                processed_frame = frame.copy()
                
                # Process each detected face
                for face_info in faces:
                    # Scale coordinates back to original size
                    region = face_info['facial_area']
                    x, y, w, h = region['x']*2, region['y']*2, region['w']*2, region['h']*2
                    
                    # Skip if face too small
                    if w < 60 or h < 60:
                        continue
                    
                    # Ensure coordinates are within frame boundaries
                    x = max(0, x)
                    y = max(0, y)
                    w = min(w, processed_frame.shape[1] - x)
                    h = min(h, processed_frame.shape[0] - y)
                    
                    # Extract face from original resolution frame
                    face_crop = processed_frame[y:y+h, x:x+w]
                    if face_crop.size == 0:
                        continue
                    
                    # Skip GFPGAN for speed, but use it if needed for difficult faces
                    use_restoration = False
                    if use_restoration:
                        _, _, restored_face = gfpganer.enhance(
                            face_crop, has_aligned=False, only_center_face=False, paste_back=True
                        )
                    else:
                        restored_face = face_crop
                    
                    # Get face embedding
                    embedding = DeepFace.represent(
                        img_path=restored_face,
                        model_name=MODEL_NAME,
                        detector_backend=DETECTOR_BACKEND,
                        enforce_detection=False
                    )
                    
                    # Compare with database
                    match = compare_embeddings(embedding)
                    
                    if match:
                        label, confidence = match
                        
                        # Check cooldown period to avoid duplicate detections
                        current_time = time.time()
                        if label in last_detection_times:
                            elapsed = current_time - last_detection_times[label]
                            if elapsed < RECOGNITION_COOLDOWN:
                                # Still in cooldown, just draw box without updating attendance
                                cv2.rectangle(processed_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                                cv2.putText(
                                    processed_frame, 
                                    f"{label} ({confidence:.2f})", 
                                    (x, y-10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2
                                )
                                continue
                        
                        # Update last detection time
                        last_detection_times[label] = current_time
                        
                        # Draw annotation
                        cv2.rectangle(processed_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(
                            processed_frame, 
                            f"{label} ({confidence:.2f})", 
                            (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2
                        )
                        
                        # Record attendance (avoiding duplicates)
                        current_time_str = time.strftime("%H:%M:%S")
                        
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
                                'time': current_time_str
                            })
            
            except Exception as e:
                print(f"Error in face recognition: {e}")
            
            # Update the output frame (with atomic swap)
            with lock:
                output_frame = processed_frame
        else:
            # For non-processing frames, just update with the latest frame
            # but keep any annotations from previous processing
            if output_frame is not None:
                with lock:
                    # Combine current frame with previous annotations
                    # This is a simplified approach - you might want to improve this
                    current_frame = frame_buffer[-1].copy()
                    output_frame = current_frame
        
        frame_count += 1
        
        # Adaptive sleep time based on system performance
        # This helps prevent CPU overload while maintaining responsiveness
        time.sleep(0.01)  # Reduced sleep time for more responsiveness

def generate_frames():
    """Generator function for streaming video frames"""
    global output_frame, lock
    
    while True:
        with lock:
            if output_frame is None:
                continue
            
            # Create a copy to avoid modifying the frame used by the processing thread
            frame_to_encode = output_frame.copy()
        
        # Resize for network efficiency if needed
        height, width = frame_to_encode.shape[:2]
        if width > 640:  # Only resize if larger than 640px
            scale_factor = 640 / width
            frame_to_encode = cv2.resize(
                frame_to_encode, 
                (0, 0), 
                fx=scale_factor, 
                fy=scale_factor
            )
        
        # Use more efficient JPEG encoding parameters
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 80]  # Adjust quality (0-100)
        (flag, encoded_image) = cv2.imencode(".jpg", frame_to_encode, encode_params)
        
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
        # Initialize camera with specific settings for performance
        cap = cv2.VideoCapture(0)
        
        # Set lower resolution for better performance
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # Cap the framerate to reduce CPU usage
        cap.set(cv2.CAP_PROP_FPS, 15)
        
        # Set buffer size
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)
        
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
    
    # Ensure proper camera cleanup
    if cap is not None:
        # Small delay to let threads finish
        time.sleep(0.2)
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
    global attendance_data, last_detection_times
    attendance_data = []
    last_detection_times = {}  # Reset detection cooldowns
    return jsonify({'status': 'reset'})

if __name__ == '__main__':
    # Initialize models before starting the server
    initialize_models()
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, threaded=True)
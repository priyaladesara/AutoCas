import cv2
import os
import numpy as np
from deepface import DeepFace
from gfpgan import GFPGANer

# --- CONFIG ---
DATASET_DIR = "dataset"
MODEL_NAME = "ArcFace"
DETECTOR_BACKEND = "mtcnn"
DISTANCE_METRIC = "cosine"
DB_PATH = DATASET_DIR
SOURCE = 0  # webcam or video file

# --- INIT GFPGAN ---
gfpganer = GFPGANer(
    model_path='experiments/pretrained_models/GFPGANv1.3.pth',
    upscale=1,
    arch='clean',
    channel_multiplier=2,
    bg_upsampler=None
)

# --- BUILD REPRESENTATION DATABASE (optional if already built) ---
print("Building representation database...")
DeepFace.find(
    img_path=os.path.join(DATASET_DIR, os.listdir(DATASET_DIR)[0], os.listdir(os.path.join(DATASET_DIR, os.listdir(DATASET_DIR)[0]))[0]),
    db_path=DB_PATH,
    model_name=MODEL_NAME,
    detector_backend=DETECTOR_BACKEND,
    distance_metric=DISTANCE_METRIC,
    enforce_detection=False
)

# --- CAMERA/VIDEO LOOP ---
cap = cv2.VideoCapture(SOURCE)
frame_count = 0
last_frame = None

while cap.isOpened() and frame_count < 1:
# while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    last_frame = frame.copy()  # to draw bounding boxes later

    # Step 1: Extract faces using DeepFace
    faces = DeepFace.extract_faces(
        img_path=frame,
        detector_backend=DETECTOR_BACKEND,
        enforce_detection=False,
        align=False
    )

    for i, face_info in enumerate(faces):
        region = face_info['facial_area']
        x, y, w, h = region['x'], region['y'], region['w'], region['h']
        face_crop = frame[y:y + h, x:x + w]
        print(h,'\n',w)

        try:
            # Step 2: Restore with GFPGAN
            # Scale the face crop by 2.5x while preserving aspect ratio
            face_resized = cv2.resize(face_crop, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)

            cv2.imshow("original face", face_resized)
            _, _, restored_face = gfpganer.enhance(face_crop, has_aligned=False, only_center_face=False, paste_back=True)
            restored_face_resized = cv2.resize(restored_face, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)
            cv2.imshow("Restored Face", restored_face)
           
            result = DeepFace.find(
                img_path=restored_face,
                db_path=DB_PATH,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR_BACKEND,
                distance_metric=DISTANCE_METRIC,
                enforce_detection=False
            )
  
            if len(result) > 0:
                identity = result[0].iloc[0]['identity']
                label = os.path.basename(os.path.dirname(identity))
                distance = result[0].iloc[0]['distance']

                # Step 4: Annotate original image
                cv2.rectangle(last_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(last_frame, f"{label} ({distance:.2f})", (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        except Exception as e:
            print(f"Error restoring/recognizing face {i}: {e}")

cap.release()

# --- DISPLAY OUTPUT ---
if last_frame is not None:
    cv2.imshow("Final Processed Frame", last_frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
else:
    print("No frame was processed.")
    
'''
The representation database (the .pkl file with embeddings) is built the first time DeepFace.find() is called — if it doesn't already exist.

When you add new images, DeepFace detects a mismatch between:

the existing .pkl file contents, and
the actual current state of the folder.

if mismatch is detected then the .pkl file is rebuilt.
'''

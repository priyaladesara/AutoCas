import cv2
import os
import time
from ultralytics import YOLO

# === CONFIG ===
person_name = input("Enter the name of Student :")
save_dir = f"dataset/{person_name}"
video_path = 0  # ← Path to your video file
capture_interval = 2  # seconds
max_images = 10
padding_ratio = 0.15  # 15% padding around the face

# === SETUP ===
os.makedirs(save_dir, exist_ok=True)
cap = cv2.VideoCapture(video_path)
model = YOLO("yolov8m-face-lindevs.pt")

fps = cap.get(cv2.CAP_PROP_FPS)
interval_frames = int(capture_interval * fps)
frame_count = 0
img_count = 0

print(f"[INFO] Collecting data for '{person_name}' from video every {capture_interval}s")

while img_count < max_images and cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    if frame_count % interval_frames == 0:
        results = model.predict(source=frame, conf=0.5, verbose=False)
        faces = results[0].boxes.xyxy.cpu().numpy()

        if len(faces) > 0:
            # Get largest face
            largest_face = max(faces, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
            x1, y1, x2, y2 = map(int, largest_face[:4])

            # Add padding
            w, h = x2 - x1, y2 - y1
            pad_w, pad_h = int(w * padding_ratio), int(h * padding_ratio)
            x1_p = max(x1 - pad_w, 0)
            y1_p = max(y1 - pad_h, 0)
            x2_p = min(x2 + pad_w, frame.shape[1])
            y2_p = min(y2 + pad_h, frame.shape[0])

            face_crop = frame[y1_p:y2_p, x1_p:x2_p]

            if face_crop.size > 0:
                img_path = os.path.join(save_dir, f"{person_name}_{img_count+1}.jpg")
                cv2.imwrite(img_path, face_crop)
                print(f"[{img_count+1}/{max_images}] Saved: {img_path}")
                img_count += 1

    # Display for feedback
    for box in faces if 'faces' in locals() else []:
        x1, y1, x2, y2 = map(int, box[:4])
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    cv2.imshow("Face Dataset Capture", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("[INFO] Capture interrupted by user.")
        break

    frame_count += 1

cap.release()
cv2.destroyAllWindows()
print("Dataset capture complete.")











































# import cv2
# import os
# import time
# from ultralytics import YOLO

# # === CONFIG ===
# person_name = "Priyal"
# save_dir = f"dataset/{person_name}"
# capture_interval = 2  
# max_images = 10
# countdown = 3  # seconds before capture starts
# padding_ratio = 0.15  # 15% padding around the face

# # === SETUP ===
# os.makedirs(save_dir, exist_ok=True)
# cap = cv2.VideoCapture(0)
# model = YOLO("yolov8m-face-lindevs.pt")

# print(f"[INFO] Collecting data for '{person_name}' in {save_dir}")
# print(f"[INFO] Starting in {countdown} seconds...")


# # Countdown
# start_time = time.time()
# while time.time() - start_time < countdown:
#     ret, frame = cap.read()
#     if not ret:
#         continue
#     seconds_left = int(countdown - (time.time() - start_time))
#     cv2.putText(frame, f"Starting in {seconds_left}s", (50, 50), cv2.FONT_HERSHEY_SIMPLEX,
#                 1.2, (0, 0, 255), 2)
#     cv2.imshow("Face Dataset Capture", frame)
#     cv2.waitKey(1)

# print("[INFO] Starting capture...")

# # Capture loop
# img_count = 0
# last_capture_time = time.time()

# while img_count < max_images:
#     ret, frame = cap.read()
#     if not ret:
#         break

#     results = model.predict(source=frame, conf=0.5, verbose=False)
#     faces = results[0].boxes.xyxy.cpu().numpy()

#     # Draw bounding boxes
#     for box in faces:
#         x1, y1, x2, y2 = map(int, box[:4])
#         cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

#     cv2.imshow("Face Dataset Capture", frame)

#     if time.time() - last_capture_time >= capture_interval and len(faces) > 0:
#         # Get largest face
#         largest_face = max(faces, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
#         x1, y1, x2, y2 = map(int, largest_face[:4])

#         # Add padding
#         w, h = x2 - x1, y2 - y1
#         pad_w, pad_h = int(w * padding_ratio), int(h * padding_ratio)

#         x1_p = max(x1 - pad_w, 0)
#         y1_p = max(y1 - pad_h, 0)
#         x2_p = min(x2 + pad_w, frame.shape[1])
#         y2_p = min(y2 + pad_h, frame.shape[0])

#         face_crop = frame[y1_p:y2_p, x1_p:x2_p]

#         if face_crop.size > 0:
#             img_path = os.path.join(save_dir, f"{person_name}_{img_count+1}.jpg")
#             cv2.imwrite(img_path, face_crop)
#             print(f"[{img_count+1}/{max_images}] Saved: {img_path}")
#             img_count += 1
#             last_capture_time = time.time()

#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         print("[INFO] Capture interrupted by user.")
#         break

# cap.release()
# cv2.destroyAllWindows()
# print("Dataset capture complete.")

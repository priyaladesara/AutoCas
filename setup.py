import os
import sys
import subprocess
import shutil

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import flask
        import cv2
        import numpy
        from deepface import DeepFace
        
        try:
            from gfpgan import GFPGANer
            print("✅ All dependencies are installed")
            return True
        except ImportError:
            print("❌ GFPGAN not installed correctly")
            return False
    except ImportError as e:
        print(f"❌ Missing dependency: {str(e)}")
        return False

def setup_project_structure():
    """Ensure the project directory structure is correct"""
    # Create dataset directory if it doesn't exist
    if not os.path.exists("dataset"):
        os.makedirs("dataset")
        print("✅ Created dataset directory")
    
    # Check for required model files
    model_dir = "experiments/pretrained_models"
    if not os.path.exists(model_dir):
        os.makedirs(model_dir, exist_ok=True)
        print(f"✅ Created {model_dir} directory")
    
    gfpgan_model = os.path.join(model_dir, "GFPGANv1.3.pth")
    if not os.path.exists(gfpgan_model):
        print(f"❓ GFPGAN model not found at {gfpgan_model}")
        print("   You need to download the model file from:")
        print("   https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth")
        print("   and place it in the experiments/pretrained_models directory")
    
    yolo_model = "yolov8m-face-lindevs.pt"
    if not os.path.exists(yolo_model):
        print(f"❓ YOLO face detection model not found at {yolo_model}")
        print("   You may need to download it from:")
        print("   https://github.com/akanametov/yolov8-face")
    
    # Check if static files are in place
    for file in ["index.html", "script.js", "style.css"]:
        if not os.path.exists(file):
            print(f"❌ Missing static file: {file}")
            print("   Please ensure all web files are in the project root")

def install_dependencies():
    """Install required packages from requirements.txt"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Successfully installed required packages")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install required packages")
        return False

def main():
    print("=== Attendance System Setup ===")
    
    # Check if dependencies are installed
    if not check_dependencies():
        print("\nAttempting to install required dependencies...")
        if not install_dependencies():
            print("\n⚠️ Please install the required packages manually:")
            print("   pip install -r requirements.txt")
            return
    
    # Setup project structure
    setup_project_structure()
    
    print("\n=== Setup Complete ===")
    print("\nTo run the application:")
    print("1. Ensure all model files are in place")
    print("2. Run 'python server.py' to start the Flask server")
    print("3. Open a web browser and go to http://localhost:5000")

if __name__ == "__main__":
    main()
<p align="center">
  <img src="https://github.com/user-attachments/assets/40f71f92-046a-416c-bbf7-822ff0fbc5a5" alt="AutoCAS Logo" width="150" />
</p>

<h1 align="center" id="title">AutoCAS – Automated Classroom Attendance System Using Computer Vision</h1>

<h2>📋 Table of Contents</h2>

- [About AutoCAS](#about-autocas)
- [Features](#features)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Project Pipeline](#project-pipeline)
- [Results](#results)
- [License](#license)


---

## 🧠 About AutoCAS

Manual attendance processes in classrooms are slow, prone to errors, and not scalable. **AutoCAS** solves this by using AI-based face recognition and computer vision to automatically mark attendance from classroom images. This approach saves time, improves accuracy, and ensures secure and scalable recordkeeping for institutions.

---

## 🧐 Features

- 🎯 **Accuracy** – Correctly identifies multiple students from a single classroom image.
- ⚡ **Detection** – Processes image and marks attendance in under 3 seconds.
- 📥 **Export Capability** – Attendance can be exported instantly to Excel.
- 📉 **Real-Time Stats** – Automatically updates the dashboard with attendance rate, present count, and absentees.


---

## 💻 Built With

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV">
  <img src="https://img.shields.io/badge/GFPGAN-AI-orange?style=for-the-badge" alt="GFPGAN">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</p>


---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Git
- pip / conda
- Webcam / image dataset of students
- Code editor (e.g., VSCode)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/autocas.git

# Navigate to the project directory
cd autocas

# (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Linux/Mac
venv\Scripts\activate     # On Windows

# Install all required dependencies
pip install -r requirements.txt

# Run initial setup
python setup.py install

# Generate student embedding dataset
python dataset_Gen.py

# Start the server
python server.py
```

### Project Pipeline

![Picture1](https://github.com/user-attachments/assets/83562cfc-8d8f-42f1-9600-f5723183c32b)

## 📊 Results

AutoCAS has been tested in real classroom conditions with real-time face detection and attendance tracking. The system demonstrates:

### 📸 Sample Dashboard States

<p align="center">
  <img src="https://github.com/user-attachments/assets/c44a47f4-1712-4329-9279-e44c16cb845a" width="800"/>
</p>
<p align="center"><i>Initial dashboard view before detection is triggered.</i></p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/8a55a111-5848-4abd-8f12-371ba7b255f5" width="800"/>
</p>
<p align="center"><i>Successful face recognition and live attendance logging in progress.</i></p>


## License

This project is licensed under a proprietary license. All rights are reserved by the Autocas Members.









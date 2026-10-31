# DermaAI – AI-Powered Skin Analysis & Dermatology Clinic Locator

**DermaAI** is an AI-powered healthcare platform designed to help users understand common skin-related concerns through image-based analysis and connect with nearby dermatology clinics.

The project combines web development, artificial intelligence, image processing, data analysis, and location-based services to create an accessible digital healthcare experience.

---

## 🌟 Project Overview

Skin-related problems are common, but accessing preliminary information and finding suitable dermatology services can sometimes be difficult.

DermaAI aims to make this process easier by providing an interactive platform where users can:

- Upload a skin image for AI-powered analysis.
- Receive preliminary information about possible skin concerns.
- Interact with an AI-powered assistant.
- Find nearby dermatology clinics using location services.
- Access a simple and user-friendly interface.

The project also includes Python-based image processing and data analysis modules that demonstrate how computer vision and data science techniques can be applied to healthcare-related applications.

## 🎯 Project Objectives

1. Develop an accessible AI-powered skin analysis platform.
2. Apply artificial intelligence to preliminary skin image analysis.
3. Explore image processing techniques using Python and OpenCV.
4. Analyze structured data using Pandas and NumPy.
5. Visualize data using Matplotlib.
6. Help users locate nearby dermatology clinics.
7. Combine frontend and backend technologies to build a functional web application.

---

## ✨ Key Features

### 1. AI-Powered Skin Analysis
- Upload skin images for analysis.
- Generate AI-powered preliminary insights.
- Display analysis results through an interactive interface.
- Provide information about possible skin-related concerns.

### 2. AI Assistant
- Interactive AI-powered assistance.
- Text-based interaction for skin-related queries.
- Easy-to-understand responses.

### 3. Dermatology Clinic Locator
- Location-based clinic discovery.
- Integration with Google Maps API.
- Helps users identify nearby dermatology services.

### 4. User Interface
- Responsive web interface.
- Simple navigation and accessible design.
- Organized analysis and results sections.

### 5. Python Image Processing
- Image loading and validation.
- Image resizing and color conversion.
- Grayscale conversion.
- Gaussian blur and image preprocessing.
- Basic image quality evaluation.

### 6. Data Analysis and Visualization
- CSV dataset processing.
- Statistical calculations.
- Analysis of reported skin concerns.
- Data visualization through charts.
- Export of summary statistics.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Programming Languages | Python, JavaScript |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| AI Integration | AI-powered analysis and text processing |
| Image Processing | Python, OpenCV, Pillow |
| Numerical Computing | NumPy |
| Data Analysis | Pandas |
| Data Visualization | Matplotlib |
| Location Services | Google Maps API |
| Authentication & Analytics | Firebase |
| Deployment | Vercel |

### How Python Is Used

Python is used in the project's image processing and data analysis components.

The Python modules demonstrate:

- Computer vision operations using OpenCV.
- Numerical image operations using NumPy.
- Dataset processing using Pandas.
- Statistical analysis and visualization using Matplotlib.
- Image quality measurements and feature extraction.

The live web application uses a Node.js and Express.js backend. The Python modules are maintained separately as part of the project's broader implementation.

---

## 🐍 Python Modules

The project contains a dedicated `python/` directory with the following modules.

| Module | Description |
|---|---|
| `image_preprocessing.py` | Loads, validates, resizes, and processes images. |
| `image_quality_check.py` | Evaluates image resolution, brightness, and sharpness. |
| `image_feature_analysis.py` | Extracts basic color, contrast, and image statistics. |
| `scan_data_analysis.py` | Processes scan datasets and generates visualizations. |
| `run_demo.py` | Runs the complete Python demonstration pipeline. |

### Image Preprocessing

Uses OpenCV and NumPy to perform:

- Image loading and validation.
- Resizing to 224 × 224 pixels.
- RGB and grayscale conversion.
- Gaussian smoothing.
- Saving processed images.

### Image Quality Analysis

Evaluates basic image properties:

- Image dimensions.
- Average brightness.
- Sharpness estimation using Laplacian variance.
- Underexposure and overexposure measurements.

### Image Feature Analysis

Extracts descriptive image statistics:

- Mean Hue.
- Mean Saturation.
- Mean Brightness.
- Grayscale intensity.
- Standard deviation.
- Image dimensions and aspect ratio.

### Scan Data Analysis

Uses Pandas and Matplotlib to:

- Read CSV datasets.
- Calculate category distributions.
- Analyze reported concerns.
- Calculate confidence-score statistics.
- Generate charts and summary CSV files.

---

## 📁 Python Project Structure

```text
python/
│
├── README.md
├── requirements.txt
├── run_demo.bat
├── run_demo.ps1
├── run_demo.sh
├── dermai_academic_demo.ipynb
│
├── sample_data/
│   ├── sample_scans.csv
│   └── sample_images/
│       ├── normal_skin_patch.png
│       ├── pigmented_mole_patch.png
│       ├── erythema_rash_patch.png
│       ├── blurry_capture_sample.png
│       └── glare_overexposed_sample.png
│
├── dermai_python/
│   ├── __init__.py
│   ├── image_preprocessing.py
│   ├── image_quality_check.py
│   ├── image_feature_analysis.py
│   ├── scan_data_analysis.py
│   └── run_demo.py
│
└── tests/
    └── test_modules.py
```

---

## ⚙️ Installation and Setup

### Requirements

- Python 3.10 or later
- Node.js and npm
- Visual Studio Code (recommended)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/shreyaskhakal/dermai.git
```

Navigate to the project directory:

```bash
cd dermai
```

### 2. Set Up the Python Environment

Navigate to the Python directory:

```bash
cd python
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Python Demonstration

Run the complete image processing and data analysis pipeline:

```bash
python -m dermai_python.run_demo
```

Run the demonstration with a custom image:

```bash
python -m dermai_python.run_demo --image path/to/image.jpg
```

Run it with a custom CSV dataset:

```bash
python -m dermai_python.run_demo --csv sample_data/sample_scans.csv
```

### 5. Run Python Unit Tests

```bash
python -m unittest discover -s tests -p "test_*.py"
```

### 6. Run the Web Application

Return to the root project directory and install the Node.js dependencies:

```bash
npm install
```

Configure the required environment variables according to the project configuration and start the application using its available development script.

---

## 📊 Demonstration and Outputs

The Python modules demonstrate different stages of image processing and data analysis.

| Demonstration | Output |
|---|---|
| Image preprocessing | Resized and processed images |
| Image quality analysis | Brightness and sharpness report |
| Feature extraction | HSV and grayscale statistics |
| Dataset analysis | Statistical summaries |
| Data visualization | Bar charts and pie charts |
| Data export | Summary CSV files |

The sample dataset contains 25 illustrative synthetic scan records. It is intended for demonstrating data analysis and visualization workflows.

---

## 🧪 Testing

The Python project includes a unit testing suite to verify the functionality of its modules.

Testing covers:

- Image processing operations.
- Image dimensions and validation.
- Image quality calculations.
- Statistical calculations.
- Data analysis functions.
- Error handling.

Run the tests using:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

---

## 🔮 Future Scope

The project can be extended with several additional features:

1. Integration of dedicated dermatology image classification models.
2. Improved image preprocessing and quality assessment.
3. Support for larger dermatology image datasets.
4. Advanced statistical analysis and visualization.
5. Multilingual AI assistance.
6. Appointment booking and clinic management.
7. User health history and report management.
8. Integration with additional healthcare services.

---

## ⚠️ Important Note

DermaAI provides preliminary AI-generated information and is not a substitute for professional medical evaluation. Its outputs should not be treated as confirmed diagnoses or treatment recommendations. Users should consult qualified healthcare professionals for medical concerns.

The Python sample dataset and illustrative images are synthetic demonstration data and do not represent actual patients or clinical outcomes.

---

## 👨‍💻 Project Information

**Project Name:** DermaAI

**Domain:** Artificial Intelligence, Healthcare Technology, Computer Vision and Data Science

**Repository:** [GitHub – DermaAI](https://github.com/shreyaskhakal/dermai)

**Live Application:** [DermaAI](https://dermai2.vercel.app/)

---

## 📜 Conclusion

DermaAI demonstrates how modern web technologies, artificial intelligence, Python programming, computer vision, and data analytics can be combined to develop a healthcare-focused application.

The project brings together practical software development and data science concepts to explore how technology can improve access to preliminary health information and dermatology services.


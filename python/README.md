# DermaAI — Supplementary Academic Python Demonstration Suite 🔬📊

> [!IMPORTANT]
> **STRICT ACADEMIC & PRODUCTION ISOLATION NOTICE:**  
> The Python modules in this directory (`python/`) are **strictly supplementary academic demonstrations** created for educational, research, and algorithmic analysis purposes.  
> 
> They are **completely decoupled** from the live production application. They are **not** imported by, connected to, or deployed alongside:
> - The live production frontend (HTML / CSS / JavaScript)
> - The Node.js / Express backend server (`backend/server.js`)
> - The live Google Gemini AI multimodal analysis integration
> - Google Maps clinic locator integration
> - Firebase authentication and regional analytics
> - The Vercel serverless deployment (`vercel.json`)
> - Any production build scripts or environment variables

---

## 1. Project Overview

**DermaAI** is an AI-powered dermatological wellness and clinic locator platform designed for the **Google Solution Challenge**, addressing **UN Sustainable Development Goal 3: Good Health and Well-being**. The production application provides rapid preliminary assessments via the Google Gemini API and connects users with nearby dermatologists via Google Maps.

This supplementary Python module demonstrates how standard computer vision and data science methodologies operate under the hood in dermatological informatics workflows—from raw pixel pre-filtering to statistical population-level scan analytics.

---

## 2. Why Python in Dermatological Health Informatics?

While lightweight web technologies (JavaScript, HTML5 canvas) and serverless cloud APIs (Gemini) power the interactive production client, **Python** is the global lingua franca of medical computer vision, data science, and biomedical research:

1. **Standardized Deep Learning Preprocessing:** Benchmark dermatology datasets (such as the ISIC / International Skin Imaging Collaboration archive) standardize images to fixed matrices (e.g., $224 \times 224$ pixels) for deep convolutional neural networks (ResNet, EfficientNet, MobileNet).
2. **Quality Gating & Artifact Detection:** Upstream quality controls—such as blur estimation via the Laplacian operator and exposure bounds—prevent degraded captures from causing false negatives.
3. **Colorimetric & Morphological Feature Extraction:** Transforming images into specialized color representations (e.g., HSV) allows researchers to separate illumination from chromatic pigment information (erythema, melanin clustering).
4. **Epidemiological & Telehealth Exploratory Data Analysis (EDA):** Aggregating and visualizing patient-reported concerns, intake modalities, and model certainty scores enables continuous auditing of healthcare AI systems.

---

## 3. Technology Stack

| Technology | Role & Educational Scope |
| :--- | :--- |
| **Python 3.10+** | Core programming language |
| **OpenCV (`opencv-python`)** | Matrix-based image loading, resizing, color conversions (BGR $\to$ RGB, Grayscale, HSV), Gaussian smoothing, and Laplacian second-derivative filtering |
| **NumPy** | Array computations, statistical variance, pixel clipping ratios, and array broadcasting |
| **Pandas** | Tabular scan dataset ingestion, schema validation, grouping, and statistical distribution computations |
| **Matplotlib** | Headless (`Agg` backend) data visualization: horizontal bar charts, modality pie charts, and confidence distribution plots |
| **Pillow (PIL)** | Image format encoding and verification fallback |
| **unittest** | Native Python automated test suite verifying edge cases, matrix dimensions, and analytical functions |

---

## 4. Directory & File Structure

```text
python/
├── README.md                      # Comprehensive academic documentation (this file)
├── requirements.txt               # Standalone Python dependencies (isolated from package.json)
├── .gitignore                     # Ignores .venv, bytecode, and demo_output artifacts
├── sample_data/
│   └── sample_scans.csv           # 25 synthetic illustrative scan records (non-PHI)
├── dermai_python/
│   ├── __init__.py                # Package initialization with PEP 562 lazy loading
│   ├── image_preprocessing.py     # OpenCV pipeline: load, validate, resize (224x224), blur, save
│   ├── image_quality_check.py     # Heuristics: resolution, brightness, blur/sharpness, exposure
│   ├── image_feature_analysis.py  # Colorimetric (HSV) and contrast/dynamic range statistics
│   ├── scan_data_analysis.py      # Pandas & Matplotlib EDA, bar/pie charts, CSV export
│   └── run_demo.py                # Central CLI runner coordinating all modules
└── tests/
    └── test_modules.py            # Automated unit test suite (27 unit tests)
```

---

## 5. Module Descriptions & Technical Methodology

### A. `image_preprocessing.py`
Provides standard computer vision pre-processing transformations required before feeding dermoscopic imagery into convolutional neural networks:
- **Image Validation:** Verifies array validity, non-empty buffers, positive dimensions, and channels.
- **Dimensional Standardization:** Resizes inputs to $224 \times 224$ pixels via area interpolation (`cv2.INTER_AREA`), the canonical resolution for CNN transfer learning.
- **Color Space Normalization:** Converts OpenCV's native BGR layout to standard RGB.
- **Grayscale Conversion:** Isolates luminance signals for structural and texture gradient analysis.
- **Gaussian Smoothing:** Suppresses high-frequency camera noise and skin hair artifacts using a 2D Gaussian kernel ($5 \times 5$).
- **Safe Persistence:** Encodes and writes processed matrices using Unicode-safe file streams.

### B. `image_quality_check.py`
Implements basic pre-flight heuristics to evaluate whether an image is optically suitable for analysis:
- **Resolution Gate:** Confirms pixel width and height meet minimum thresholds ($\ge 150 \times 150$).
- **Luminance Calculation:** Computes the arithmetic mean intensity across pixels ($0.0$ to $255.0$).
- **Sharpness Estimation via Laplacian Variance:**
  $$\text{Score} = \text{Var}\left(\nabla^2 I\right) = \text{Var}\left(\frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}\right)$$
  Images with sharp edges yield high variance; out-of-focus or motion-blurred captures yield low variance ($\text{Score} < 100.0$).
- **Exposure Anomaly Detection:** Calculates the percentage of underexposed shadow-clipped pixels ($\le 10$) and overexposed specular-glare pixels ($\ge 245$).

### C. `image_feature_analysis.py`
Extracts objective, descriptive statistical metrics from color and grayscale representations:
- **HSV Colorimetric Profiling:** Decomposes images into **Hue** (dominant spectral wavelength, $0\text{--}179$), **Saturation** (chromatic purity, $0\text{--}255$), and **Value** (brightness, $0\text{--}255$).
- **Contrast & Dispersion:** Computes standard deviation of pixel intensities $\sigma_I$ and dynamic range ($\text{Max} - \text{Min}$).
- **Spatial Geometry:** Reports width, height, channel count, and aspect ratio.

### D. `scan_data_analysis.py`
Performs exploratory data analysis on synthetic telehealth scan logs:
- **Schema Validation:** Verifies presence and data types of required columns (`scan_id`, `age_group`, `input_type`, `reported_concern`, `analysis_status`, `confidence_score`).
- **Modality Distributions:** Calculates frequency counts and percentages for capture types (`photo_upload`, `camera_capture`, `symptom_description`).
- **Condition Prevalence:** Summarizes user-reported conditions (e.g., Acne Vulgaris, Eczema, Psoriasis).
- **Statistical Aggregation:** Computes mean and standard deviation of model confidence scores grouped by condition.
- **Chart Generation:** Saves high-resolution ($300\text{ DPI}$) visual figures (`reported_concerns_distribution.png`, `input_types_distribution.png`, `confidence_by_concern.png`).
- **Data Export:** Exports summary metrics to `scan_summary_statistics.csv`.

### E. `run_demo.py`
Central interactive command-line interface that orchestrates all four modules into a unified educational pipeline. Supports custom arguments, custom image paths, and synthetic test patch generation.

---

## 6. Installation & Environment Setup

It is strongly recommended to execute these modules in an isolated Python virtual environment (`.venv`):

### 1. Open Terminal and Navigate to the `python/` Directory
```bash
cd python
```

### 2. Create and Activate a Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt `cmd`):**
```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Requirements
```bash
pip install -r requirements.txt
```

---

## 7. Execution Guide

### Option 1: Run Full End-to-End Demonstration (Recommended)
Automatically runs dataset analytics, creates a synthetic dermoscopic patch, and performs image preprocessing, quality checks, and feature extraction:
```bash
python -m dermai_python.run_demo
```

### Option 2: Run Demonstration with Your Own Skin Image
```bash
python -m dermai_python.run_demo --image path/to/your_skin_photo.jpg
```

### Option 3: Run Demonstration with a Custom CSV Dataset
```bash
python -m dermai_python.run_demo --csv sample_data/sample_scans.csv
```

### Option 4: Custom Output Directory
```bash
python -m dermai_python.run_demo --output-dir custom_demo_output
```

---

## 8. Running Individual Modules Independently

Each module is fully self-contained and executable as a standalone script:

```bash
# 1. Preprocessing (loads or generates a test patch, resizes to 224x224, applies blur)
python -m dermai_python.image_preprocessing

# 2. Quality Check (computes brightness, Laplacian variance sharpness, and exposure)
python -m dermai_python.image_quality_check

# 3. Descriptive Feature Extraction (extracts HSV color values, contrast, and dimensions)
python -m dermai_python.image_feature_analysis

# 4. Scan Data Analysis (loads CSV, computes distributions, exports charts and summary CSV)
python -m dermai_python.scan_data_analysis
```

---

## 9. Running the Unit Test Suite

An automated unit test suite (`tests/test_modules.py`) verifies matrix shapes, math accuracy, and error handling across 27 distinct test cases:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

Expected output:
```text
----------------------------------------------------------------------
Ran 27 tests in 4.775s

OK
```

---

## 10. Sample Demonstration Output

```text
====================================================================
            DERMAAI PYTHON ACADEMIC DEMONSTRATION SUITE             
====================================================================
Welcome to the DermaAI supplementary educational computer vision suite.
This suite illustrates data science and image processing techniques
applied in automated dermatology and medical informatics workflows.

>> Working Output Directory: C:\Users\user5\Downloads\DERMAI\python\demo_output

--------------------------------------------------------------------
  STEP 1: EXPLORATORY SCAN DATASET ANALYSIS (PANDAS & MATPLOTLIB)   
--------------------------------------------------------------------
Loading scan records from: sample_scans.csv

[OK] Successfully loaded 25 scan records.
Columns in dataset: scan_id, age_group, input_type, reported_concern, analysis_status, confidence_score

--- REPORTED CONCERNS DISTRIBUTION ---
  * Acne Vulgaris           :  4 scans ( 16.0%)
  * Contact Dermatitis      :  4 scans ( 16.0%)
  * Eczema                  :  3 scans ( 12.0%)
  * Psoriasis               :  3 scans ( 12.0%)
  * Benign Mole (Nevus)     :  3 scans ( 12.0%)

--- INPUT MODALITY DISTRIBUTION ---
  * photo_upload            : 13 scans ( 52.0%)
  * camera_capture          :  9 scans ( 36.0%)
  * symptom_description     :  3 scans ( 12.0%)

--- MODEL CONFIDENCE METRICS (ILLUSTRATIVE) ---
  Mean: 0.852 | Median: 0.870 | Min: 0.680 | Max: 0.950 | Std: 0.072

--- GENERATED VISUALIZATIONS & ARTIFACTS ---
  [Chart] reported_concerns_bar     : reported_concerns_distribution.png
  [Chart] input_types_pie           : input_types_distribution.png
  [Chart] confidence_by_concern_bar : confidence_by_concern.png
  [CSV]   Statistical Summary       : scan_summary_statistics.csv

--------------------------------------------------------------------
  STEP 2: COMPUTER VISION IMAGE ANALYSIS PIPELINE (OPENCV & NUMPY)  
--------------------------------------------------------------------
Generating illustrative synthetic dermoscopic test image at: synthetic_dermoscopic_patch.png

>> [2.1] Executing Image Preprocessing...
  - Original Dimensions : (320, 320, 3)
  - Resized (Target)    : (224, 224, 3) (224x224 RGB)
  - Preprocessing saved : ['resized', 'grayscale', 'blurred']

>> [2.2] Evaluating Optical Quality Heuristics...
============================================================
          DERMAI IMAGE QUALITY EVALUATION REPORT            
============================================================
Image Resolution      : 224 x 224 (3 channels)
Resolution Gate       : PASS (Req: >= 150x150)
Average Brightness    : 190.73 / 255.0
Sharpness Score       : 8.31 (Blur Threshold: 100.0)
Blur Classification   : POTENTIALLY BLURRY
Exposure Status       : BALANCED_EXPOSURE
  - Dark Pixels <= 10 : 0.0%
  - Glare Pixels >=245: 0.08%
------------------------------------------------------------
Overall Quality Gate  : SUBOPTIMAL_QUALITY_DETECTED
============================================================
>> NOTICE: These generic heuristics measure basic optical sharpness, exposure, and pixel dimensions. They DO NOT evaluate diagnostic validity or dermatological suitability.
============================================================

>> [2.3] Extracting Descriptive Colorimetric & Contrast Features...
============================================================
        DERMAI DESCRIPTIVE IMAGE FEATURE REPORT             
============================================================
1. Spatial Geometry & Dimensions:
   - Width x Height      : 224 x 224 px
   - Aspect Ratio        : 1.0
   - Color Channels      : 3
   - Total Pixels        : 50,176

2. Color Space Characteristics (HSV):
   - Mean Hue (0-179)    : 9.47 (Std: 1.39)
   - Mean Saturation     : 72.94 / 255.0 (Std: 21.07)
   - Mean Value/Brightness: 221.87 / 255.0 (Std: 33.49)

3. Intensity & Contrast Metrics (Grayscale):
   - Mean Intensity      : 190.73 / 255.0
   - Standard Deviation  : 36.27 (Contrast dispersion)
   - Dynamic Range       : 69.0 to 255.0 (Span: 186.0)
============================================================
>> NOTICE: The extracted features are generic statistical computer vision metrics. They do NOT constitute clinical biomarkers or medical diagnoses.
============================================================

====================================================================
                       DEMONSTRATION COMPLETE                       
====================================================================
All supplementary academic modules executed successfully.
Generated artifacts and visualizations saved under:
  --> C:\Users\user5\Downloads\DERMAI\python\demo_output
```

---

## 11. Academic Learning Outcomes

By studying and running this supplementary suite, students and researchers explore:
1. **Pipeline Decoupling in Healthtech:** Structuring algorithmic experiments in separate, non-intrusive modules while preserving production web app stability.
2. **Matrix Preprocessing for Medical Imaging:** Understanding why neural network backbones require fixed dimensions, channel conversions, and smoothing.
3. **Signal Quality Gating:** Using classical computer vision (Laplacian second derivatives and histogram clipping) to catch poor captures before model inference.
4. **Colorimetric Decomposition:** Learning why HSV representations facilitate erythema and lesion boundary analysis more effectively than raw RGB values.
5. **Exploratory Telehealth Analytics:** Visualizing intake modalities and confidence distributions across demographic cohorts to monitor AI system behavior.

---

## 12. Limitations & Medical Disclaimer

> [!CAUTION]
> **STRICT MEDICAL DISCLAIMER:**  
> The algorithms, scripts, heuristics, and statistical metrics contained in this Python module are **purely academic demonstrations** of computational techniques.
> 
> - They **do NOT** constitute medical advice, clinical diagnoses, treatment plans, or medical devices.
> - They **must NOT** be used to screen, diagnose, or manage any skin condition, lesion, melanoma, or dermatological disease.
> - The sample dataset is **100% synthetic** and does not represent real patients or actual clinical outcomes.
> - Always consult a board-certified dermatologist or qualified healthcare professional for medical concerns.

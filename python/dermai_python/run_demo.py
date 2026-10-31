"""
Central Academic Demonstration CLI Runner for DermaAI.
======================================================

This script serves as the unified entry point for demonstrating the Python
academic modules developed for the DermaAI ecosystem:
1. Scan Data Exploratory Analysis (Pandas, Matplotlib)
2. Image Preprocessing Pipeline (OpenCV)
3. Image Quality & Sharpness Verification (OpenCV, NumPy)
4. Descriptive Color & Contrast Feature Extraction (OpenCV, NumPy)

Usage Examples:
    # Run full demonstration with default sample dataset & synthetic image
    python -m dermai_python.run_demo

    # Run demonstration with custom image
    python -m dermai_python.run_demo --image path/to/skin_photo.jpg

    # Run demonstration with custom CSV dataset
    python -m dermai_python.run_demo --csv sample_data/sample_scans.csv

    # Run demonstration specifying custom output directory
    python -m dermai_python.run_demo --output-dir my_analysis_results

CRITICAL ACADEMIC & CLINICAL DISCLAIMER:
This demonstration is designed exclusively for educational, research, and
pedagogical purposes. It does not provide medical diagnoses or replace
consultation with certified healthcare professionals.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

# Ensure dermai_python is importable when executed directly
current_dir = Path(__file__).resolve().parent
python_root = current_dir.parent
if str(python_root) not in sys.path:
    sys.path.insert(0, str(python_root))

from dermai_python.image_feature_analysis import (
    extract_all_features,
    format_feature_report,
)
from dermai_python.image_preprocessing import (
    preprocess_pipeline,
    save_processed_image,
)
from dermai_python.image_quality_check import (
    evaluate_quality,
    format_quality_report,
)
from dermai_python.scan_data_analysis import (
    run_full_analysis,
)

# Configure clean logging
logging.basicConfig(level=logging.WARNING, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("dermai_demo")


def print_banner(title: str, character: str = "=") -> None:
    """Print an eye-catching section divider with a centered title."""
    width = 68
    print("\n" + character * width)
    print(f" {title.upper()} ".center(width, " "))
    print(character * width)


def create_illustrative_test_image(output_path: Path) -> Path:
    """Generate a realistic, synthetic skin lesion patch for academic testing.

    Creates a 300x300 image simulating skin tone background with a pigmented
    circular lesion featuring subtle color gradients, mimicking an illustrative
    dermoscopic patch without using any actual patient data.

    Args:
        output_path: Destination path on disk.

    Returns:
        Path: Path to the generated PNG image.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Base skin tone in OpenCV BGR format (approximate Caucasian / Fitzpatrick type II-III skin)
    patch = np.full((320, 320, 3), (175, 195, 235), dtype=np.uint8)

    # Add gentle skin texture variation
    noise = np.random.RandomState(42).normal(0, 4, patch.shape).astype(np.int16)
    patch = np.clip(patch.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Draw simulated asymmetric circular pigmented lesion (central core + periphery)
    cv2.circle(patch, (160, 160), 65, (75, 90, 145), -1)  # Erythema / border
    cv2.circle(patch, (155, 165), 35, (45, 55, 105), -1)  # Central darker pigmentation

    # Soften transition borders with Gaussian blur
    patch = cv2.GaussianBlur(patch, (17, 17), 6)

    # Add dermoscopic calibration markings
    cv2.line(patch, (20, 20), (70, 20), (255, 255, 255), 2)
    cv2.putText(
        patch,
        "5mm",
        (25, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.4,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )

    save_processed_image(patch, output_path)
    return output_path


def run_demonstration(
    csv_path: Optional[str] = None,
    image_path: Optional[str] = None,
    output_dir: str = "demo_output",
    auto_generate_image: bool = True,
) -> int:
    """Execute the full end-to-end DermaAI academic demonstration.

    Args:
        csv_path: Path to CSV dataset (defaults to sample_data/sample_scans.csv).
        image_path: Path to skin image (optional).
        output_dir: Directory to save generated outputs.
        auto_generate_image: If True and no image is passed, creates a test image.

    Returns:
        int: 0 on success, non-zero on failure.
    """
    out_dir_path = Path(output_dir).resolve()
    out_dir_path.mkdir(parents=True, exist_ok=True)

    print_banner("DermaAI Python Academic Demonstration Suite", "=")
    print("Welcome to the DermaAI supplementary educational computer vision suite.")
    print("This suite illustrates data science and image processing techniques")
    print("applied in automated dermatology and medical informatics workflows.\n")
    print(f">> Working Output Directory: {out_dir_path}")

    # =========================================================================
    # STEP 1: TABULAR DATASET EXPLORATORY ANALYSIS
    # =========================================================================
    print_banner("Step 1: Exploratory Scan Dataset Analysis (Pandas & Matplotlib)", "-")

    if csv_path:
        target_csv = Path(csv_path).resolve()
    else:
        target_csv = python_root / "sample_data" / "sample_scans.csv"

    print(f"Loading scan records from: {target_csv.name}")

    try:
        data_results = run_full_analysis(target_csv, output_dir=out_dir_path / "data_analysis")
        overview = data_results["overview"]
        distributions = data_results["distributions"]

        print(f"\n[OK] Successfully loaded {data_results['total_records']} scan records.")
        print(f"Columns in dataset: {', '.join(overview['columns'])}")

        print("\n--- SAMPLE RECORDS (First 3) ---")
        for i, row in enumerate(overview["first_five_records"][:3], start=1):
            print(
                f"  [{i}] ID: {row['scan_id']} | Age: {row['age_group']:<5} | "
                f"Type: {row['input_type']:<18} | Concern: {row['reported_concern']:<22} | "
                f"Conf: {row['confidence_score']:.2f}"
            )

        print("\n--- REPORTED CONCERNS DISTRIBUTION ---")
        concerns = distributions["reported_concern_distribution"]
        for concern, count in list(concerns["counts"].items())[:5]:
            pct = concerns["percentages"][concern]
            print(f"  * {concern:<24}: {count:>2} scans ({pct:>5.1f}%)")

        print("\n--- INPUT MODALITY DISTRIBUTION ---")
        inputs = distributions["input_type_distribution"]
        for modality, count in inputs["counts"].items():
            pct = inputs["percentages"][modality]
            print(f"  * {modality:<24}: {count:>2} scans ({pct:>5.1f}%)")

        conf = distributions["confidence_statistics"]
        print("\n--- MODEL CONFIDENCE METRICS (ILLUSTRATIVE) ---")
        print(
            f"  Mean: {conf['mean']:.3f} | Median: {conf['median']:.3f} | "
            f"Min: {conf['min']:.3f} | Max: {conf['max']:.3f} | Std: {conf['std']:.3f}"
        )

        print("\n--- GENERATED VISUALIZATIONS & ARTIFACTS ---")
        for name, path_str in data_results["generated_charts"].items():
            print(f"  [Chart] {name:<26}: {Path(path_str).name}")
        print(f"  [CSV]   Statistical Summary       : {Path(data_results['exported_csv']).name}")

    except Exception as exc:
        print(f"[ERROR] Failed during dataset analysis: {exc}", file=sys.stderr)
        return 1

    # =========================================================================
    # STEP 2: IMAGE PREPROCESSING & COMPUTER VISION PIPELINE
    # =========================================================================
    print_banner("Step 2: Computer Vision Image Analysis Pipeline (OpenCV & NumPy)", "-")

    resolved_image_path: Optional[Path] = None
    if image_path:
        img_candidate = Path(image_path).resolve()
        if img_candidate.is_file():
            resolved_image_path = img_candidate
            print(f"Using provided user skin image: {resolved_image_path.name}")
        else:
            print(f"[WARNING] Specified image file not found: {img_candidate}")

    if resolved_image_path is None:
        if auto_generate_image:
            test_img_path = out_dir_path / "synthetic_dermoscopic_patch.png"
            print(f"Generating illustrative synthetic dermoscopic test image at: {test_img_path.name}")
            resolved_image_path = create_illustrative_test_image(test_img_path)
        else:
            print("[INFO] No image provided and auto-generation disabled. Skipping image analysis steps.")
            return 0

    try:
        # A. Preprocessing
        print("\n>> [2.1] Executing Image Preprocessing...")
        prep_out_dir = out_dir_path / "preprocessed_images"
        prep_results = preprocess_pipeline(resolved_image_path, output_dir=prep_out_dir)

        print(f"  - Original Dimensions : {prep_results['original_shape']}")
        print(f"  - Resized (Target)    : {prep_results['processed_shape']} (224x224 RGB)")
        print(f"  - Preprocessing saved : {list(prep_results['saved_files'].keys())}")

        # B. Quality Check
        print("\n>> [2.2] Evaluating Optical Quality Heuristics...")
        quality_results = evaluate_quality(prep_results["resized_bgr"])
        print(format_quality_report(quality_results))

        # C. Descriptive Feature Analysis
        print("\n>> [2.3] Extracting Descriptive Colorimetric & Contrast Features...")
        features = extract_all_features(prep_results["resized_bgr"])
        print(format_feature_report(features))

    except Exception as exc:
        print(f"[ERROR] Failed during image processing pipeline: {exc}", file=sys.stderr)
        return 1

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print_banner("Demonstration Complete", "=")
    print("All supplementary academic modules executed successfully.")
    print(f"Generated artifacts and visualizations saved under:")
    print(f"  --> {out_dir_path}\n")
    print("ACADEMIC NOTE:")
    print("These demonstration modules are strictly supplementary educational tools")
    print("and are completely decoupled from the production Next.js/Express application.\n")
    return 0


def main() -> None:
    """CLI entry point parsing command-line flags."""
    parser = argparse.ArgumentParser(
        description="DermaAI Supplementary Python Academic Demonstration Suite",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--csv",
        type=str,
        default=None,
        help="Path to CSV dataset of skin scans (default: python/sample_data/sample_scans.csv)",
    )
    parser.add_argument(
        "--image",
        type=str,
        default=None,
        help="Path to target skin image for preprocessing, quality check, and feature extraction",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="demo_output",
        help="Directory to save generated charts, processed images, and CSV reports",
    )
    parser.add_argument(
        "--no-synthetic-image",
        action="store_true",
        help="Do not auto-generate a synthetic skin test image if --image is omitted",
    )

    args = parser.parse_args()

    exit_code = run_demonstration(
        csv_path=args.csv,
        image_path=args.image,
        output_dir=args.output_dir,
        auto_generate_image=not args.no_synthetic_image,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

"""
Image Quality Check Module for DermaAI Academic Demonstration.
==============================================================

In clinical and automated dermatology research, poor image quality
(e.g., severe blurriness, extreme underexposure, low resolution) is a primary
source of false negatives and false positives in computer vision pipelines.

This module provides basic, generic computer vision quality heuristics:
1. Dimensionality extraction (height, width, color channels)
2. Minimum resolution validation
3. Average luminance / brightness calculation
4. Sharpness estimation via Laplacian variance
5. Exposure anomaly checks (underexposure / overexposure / clipped pixels)
6. Structured dictionary quality report generation

CRITICAL ACADEMIC & MEDICAL DISCLAIMER:
These algorithmic heuristics evaluate basic optical and signal quality only.
They do NOT assess clinical adequacy, dermatological diagnostic suitability,
or histological validity. They must never be used as a medical quality gate.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Union

import cv2
import numpy as np

# Configure logger
logger = logging.getLogger(__name__)


def get_image_dimensions(image: np.ndarray) -> Dict[str, int]:
    """Extract spatial dimensions and channel count from an image array.

    Args:
        image: Input image array (2D grayscale or 3D color).

    Returns:
        dict: Dictionary containing 'height', 'width', and 'channels'.

    Raises:
        ValueError: If input is not a valid NumPy array.
    """
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Invalid image array provided for dimension extraction.")

    height, width = image.shape[:2]
    channels = 1 if image.ndim == 2 else image.shape[2]
    return {
        "height": int(height),
        "width": int(width),
        "channels": int(channels),
        "total_pixels": int(height * width),
    }


def validate_resolution(
    image: np.ndarray,
    min_width: int = 150,
    min_height: int = 150,
) -> Dict[str, Any]:
    """Verify that an image meets minimum resolution requirements for feature extraction.

    Args:
        image: Input image array.
        min_width: Minimum acceptable pixel width. Defaults to 150.
        min_height: Minimum acceptable pixel height. Defaults to 150.

    Returns:
        dict: Resolution validation results with status and details.
    """
    dims = get_image_dimensions(image)
    passed = dims["width"] >= min_width and dims["height"] >= min_height

    return {
        "passed": bool(passed),
        "width": dims["width"],
        "height": dims["height"],
        "min_width_required": min_width,
        "min_height_required": min_height,
        "status": "PASS" if passed else "FAIL_INSUFFICIENT_RESOLUTION",
    }


def calculate_brightness(image: np.ndarray) -> float:
    """Compute the average luminance / brightness across the entire image.

    For color images, the image is converted to grayscale to compute the
    mean intensity value on a scale from 0.0 (pitch black) to 255.0 (pure white).

    Args:
        image: Color or grayscale image array.

    Returns:
        float: Mean pixel brightness in the range [0.0, 255.0].
    """
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Invalid image array provided for brightness calculation.")

    if image.ndim == 3:
        # Standard luminance formula conversion via OpenCV
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    mean_brightness = float(np.mean(gray))
    return round(mean_brightness, 2)


def estimate_sharpness(image: np.ndarray) -> float:
    """Estimate image sharpness using the variance of the Laplacian operator.

    The Laplacian operator highlights regions of rapid intensity change (edges).
    If an image has high variance in its second derivative, it indicates sharp,
    well-defined edges. Low variance indicates blurriness or out-of-focus capture.

    Reference: Pech-Pacheco et al., "Diatom autofocusing in brightfield microscopy:
    a comparative study", ICPR 2000.

    Args:
        image: Color or grayscale image array.

    Returns:
        float: Sharpness score (Laplacian variance). Higher values indicate sharper focus.
    """
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Invalid image array provided for sharpness estimation.")

    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # Compute the Laplacian using 64-bit float to prevent overflow
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = float(laplacian.var())
    return round(variance, 2)


def check_exposure(
    image: np.ndarray,
    dark_threshold: float = 40.0,
    bright_threshold: float = 215.0,
    clip_ratio_threshold: float = 0.05,
) -> Dict[str, Any]:
    """Perform basic exposure analysis to detect underexposed or overexposed captures.

    Checks:
    - Global mean intensity against low and high limits
    - Percentage of near-black clipped pixels (< 10)
    - Percentage of saturated/blown-out clipped pixels (> 245)

    Args:
        image: Color or grayscale image array.
        dark_threshold: Average brightness floor below which image is underexposed.
        bright_threshold: Average brightness ceiling above which image is overexposed.
        clip_ratio_threshold: Fraction of saturated pixels triggering a warning.

    Returns:
        dict: Detailed exposure report.
    """
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Invalid image array provided for exposure check.")

    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    total_pixels = float(gray.size)
    mean_val = float(np.mean(gray))

    # Fraction of clipped dark and bright pixels
    shadow_clipped_ratio = float(np.count_nonzero(gray <= 10) / total_pixels)
    highlight_clipped_ratio = float(np.count_nonzero(gray >= 245) / total_pixels)

    is_underexposed = (
        mean_val < dark_threshold or shadow_clipped_ratio > clip_ratio_threshold
    )
    is_overexposed = (
        mean_val > bright_threshold or highlight_clipped_ratio > clip_ratio_threshold
    )

    if is_underexposed and is_overexposed:
        assessment = "EXTREME_CONTRAST_ANOMALY"
    elif is_underexposed:
        assessment = "UNDEREXPOSED (Too Dark / Shadow Clipping)"
    elif is_overexposed:
        assessment = "OVEREXPOSED (Too Bright / Glare Clipping)"
    else:
        assessment = "BALANCED_EXPOSURE"

    return {
        "assessment": assessment,
        "mean_brightness": round(mean_val, 2),
        "shadow_clipped_percentage": round(shadow_clipped_ratio * 100, 2),
        "highlight_clipped_percentage": round(highlight_clipped_ratio * 100, 2),
        "is_underexposed": bool(is_underexposed),
        "is_overexposed": bool(is_overexposed),
    }


def evaluate_quality(
    image: np.ndarray,
    min_width: int = 150,
    min_height: int = 150,
    blur_threshold: float = 100.0,
) -> Dict[str, Any]:
    """Execute complete image quality assessment and return a structured dictionary.

    Args:
        image: Target image array (BGR or grayscale).
        min_width: Minimum width threshold.
        min_height: Minimum height threshold.
        blur_threshold: Laplacian variance threshold below which image is flagged blurry.

    Returns:
        dict: Complete quality metrics dictionary with academic disclaimer.
    """
    dims = get_image_dimensions(image)
    res_check = validate_resolution(image, min_width=min_width, min_height=min_height)
    brightness = calculate_brightness(image)
    sharpness = estimate_sharpness(image)
    exposure = check_exposure(image)

    is_blurry = sharpness < blur_threshold
    passes_all = bool(
        res_check["passed"]
        and not is_blurry
        and not exposure["is_underexposed"]
        and not exposure["is_overexposed"]
    )

    report: Dict[str, Any] = {
        "dimensions": dims,
        "resolution_check": res_check,
        "brightness": brightness,
        "sharpness_score": sharpness,
        "blur_threshold": blur_threshold,
        "is_blurry": bool(is_blurry),
        "exposure_check": exposure,
        "overall_quality_passed": passes_all,
        "summary": "ACCEPTABLE_FOR_DEMO" if passes_all else "SUBOPTIMAL_QUALITY_DETECTED",
        "academic_disclaimer": (
            "NOTICE: These generic heuristics measure basic optical sharpness, "
            "exposure, and pixel dimensions. They DO NOT evaluate diagnostic validity "
            "or dermatological suitability."
        ),
    }
    return report


def format_quality_report(quality_dict: Dict[str, Any]) -> str:
    """Format the quality evaluation results into a human-readable text report.

    Args:
        quality_dict: Dictionary returned by evaluate_quality().

    Returns:
        str: Formatted multiline string report.
    """
    dims = quality_dict["dimensions"]
    res = quality_dict["resolution_check"]
    exp = quality_dict["exposure_check"]

    lines = [
        "============================================================",
        "          DERMAI IMAGE QUALITY EVALUATION REPORT            ",
        "============================================================",
        f"Image Resolution      : {dims['width']} x {dims['height']} ({dims['channels']} channels)",
        f"Resolution Gate       : {res['status']} (Req: >= {res['min_width_required']}x{res['min_height_required']})",
        f"Average Brightness    : {quality_dict['brightness']:.2f} / 255.0",
        f"Sharpness Score       : {quality_dict['sharpness_score']:.2f} (Blur Threshold: {quality_dict['blur_threshold']})",
        f"Blur Classification   : {'POTENTIALLY BLURRY' if quality_dict['is_blurry'] else 'SHARP / IN FOCUS'}",
        f"Exposure Status       : {exp['assessment']}",
        f"  - Dark Pixels <= 10 : {exp['shadow_clipped_percentage']}%",
        f"  - Glare Pixels >=245: {exp['highlight_clipped_percentage']}%",
        "------------------------------------------------------------",
        f"Overall Quality Gate  : {quality_dict['summary']}",
        "============================================================",
        f">> {quality_dict['academic_disclaimer']}",
        "============================================================",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    print("=== DermaAI Academic Image Quality Check Demonstration ===")
    if len(sys.argv) > 1:
        path = sys.argv[1]
        try:
            raw = np.fromfile(path, dtype=np.uint8)
            img = cv2.imdecode(raw, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Could not decode image.")
        except Exception as e:
            print(f"Error loading image '{path}': {e}")
            sys.exit(1)
    else:
        # Create an illustrative test image
        img = np.full((300, 300, 3), (180, 200, 240), dtype=np.uint8)
        cv2.circle(img, (150, 150), 60, (60, 75, 130), -1)
        cv2.putText(img, "DermAI Test", (60, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40, 40, 40), 2)
        print("Using synthetic skin image for demonstration.")

    results = evaluate_quality(img)
    print(format_quality_report(results))


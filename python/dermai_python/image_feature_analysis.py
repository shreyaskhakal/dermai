"""
Image Descriptive Feature Analysis Module for DermaAI Academic Demonstration.
=============================================================================

In quantitative image processing, descriptive statistical features describe
the global color distribution, illumination, and contrast characteristics of an
image. In dermatological computer vision research, understanding color spaces
(such as HSV - Hue, Saturation, Value) is foundational for pigment analysis,
erythema detection, and skin segmentation.

Extracted Generic Features:
1. Mean Hue: Angular position in color space (dominant color tone)
2. Mean Saturation: Color purity / vibrancy
3. Mean Value / Brightness: Color lightness / illumination level
4. Grayscale Mean: Overall average pixel intensity
5. Grayscale Standard Deviation: Global contrast / intensity dispersion
6. Contrast Dynamic Range: Difference between brightest and darkest pixel
7. Spatial Dimensions: Height, width, channel count, and aspect ratio

CRITICAL ACADEMIC & MEDICAL DISCLAIMER:
These features represent global mathematical and colorimetric statistics of
the image signal. They are NOT biological markers, diagnostic indicators, or
clinical criteria (such as ABCDE melanoma criteria). They must never be used
for clinical evaluation or diagnostic decision making.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Union

import cv2
import numpy as np

# Configure logger
logger = logging.getLogger(__name__)


def extract_color_features(image: np.ndarray) -> Dict[str, float]:
    """Extract descriptive color statistics in the HSV color space.

    Hue (H): Represents the dominant color wavelength (OpenCV range [0, 179]).
    Saturation (S): Represents the colorfulness / purity (OpenCV range [0, 255]).
    Value (V): Represents the luminance / brightness (OpenCV range [0, 255]).

    Args:
        image: Color image array in OpenCV BGR format.

    Returns:
        dict: Mean and standard deviation of Hue, Saturation, and Value channels.

    Raises:
        ValueError: If the image is not a valid 3-channel color array.
    """
    if not isinstance(image, np.ndarray) or image.ndim != 3 or image.shape[2] != 3:
        raise ValueError("Color feature extraction requires a 3-channel color image array.")

    # Convert BGR to HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h_channel = hsv[:, :, 0]
    s_channel = hsv[:, :, 1]
    v_channel = hsv[:, :, 2]

    return {
        "mean_hue": round(float(np.mean(h_channel)), 2),
        "std_hue": round(float(np.std(h_channel)), 2),
        "mean_saturation": round(float(np.mean(s_channel)), 2),
        "std_saturation": round(float(np.std(s_channel)), 2),
        "mean_value_brightness": round(float(np.mean(v_channel)), 2),
        "std_value_brightness": round(float(np.std(v_channel)), 2),
    }


def extract_texture_contrast_features(image: np.ndarray) -> Dict[str, float]:
    """Extract generic statistical contrast and intensity metrics from grayscale.

    Args:
        image: Color (BGR) or grayscale image array.

    Returns:
        dict: Grayscale mean, standard deviation, min, max, and dynamic range.
    """
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Invalid image array provided for contrast extraction.")

    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    min_intensity = float(np.min(gray))
    max_intensity = float(np.max(gray))
    contrast_range = max_intensity - min_intensity
    gray_mean = float(np.mean(gray))
    gray_std = float(np.std(gray))

    return {
        "grayscale_mean": round(gray_mean, 2),
        "grayscale_std": round(gray_std, 2),
        "min_intensity": round(min_intensity, 2),
        "max_intensity": round(max_intensity, 2),
        "contrast_range": round(contrast_range, 2),
    }


def extract_all_features(image: np.ndarray) -> Dict[str, Any]:
    """Extract complete descriptive feature profile from an image array.

    Args:
        image: Input image array (BGR or grayscale).

    Returns:
        dict: Full descriptive feature dictionary.
    """
    if not isinstance(image, np.ndarray) or image.size == 0:
        raise ValueError("Invalid image array provided for feature extraction.")

    height, width = image.shape[:2]
    channels = 1 if image.ndim == 2 else image.shape[2]
    aspect_ratio = round(width / float(height), 3) if height > 0 else 0.0

    contrast_metrics = extract_texture_contrast_features(image)

    # Color features only apply to multi-channel color images
    if channels == 3:
        color_metrics = extract_color_features(image)
    else:
        color_metrics = {
            "mean_hue": 0.0,
            "std_hue": 0.0,
            "mean_saturation": 0.0,
            "std_saturation": 0.0,
            "mean_value_brightness": contrast_metrics["grayscale_mean"],
            "std_value_brightness": contrast_metrics["grayscale_std"],
        }

    report: Dict[str, Any] = {
        "dimensions": {
            "height": int(height),
            "width": int(width),
            "channels": int(channels),
            "aspect_ratio": aspect_ratio,
            "total_pixels": int(height * width),
        },
        "color_space_hsv": color_metrics,
        "contrast_and_intensity": contrast_metrics,
        "academic_disclaimer": (
            "NOTICE: The extracted features are generic statistical computer vision "
            "metrics. They do NOT constitute clinical biomarkers or medical diagnoses."
        ),
    }
    return report


def format_feature_report(features: Dict[str, Any]) -> str:
    """Format feature extraction results into an organized, readable terminal report.

    Args:
        features: Dictionary produced by extract_all_features().

    Returns:
        str: Formatted string report.
    """
    dims = features["dimensions"]
    color = features["color_space_hsv"]
    contrast = features["contrast_and_intensity"]

    lines = [
        "============================================================",
        "        DERMAI DESCRIPTIVE IMAGE FEATURE REPORT             ",
        "============================================================",
        "1. Spatial Geometry & Dimensions:",
        f"   - Width x Height      : {dims['width']} x {dims['height']} px",
        f"   - Aspect Ratio        : {dims['aspect_ratio']}",
        f"   - Color Channels      : {dims['channels']}",
        f"   - Total Pixels        : {dims['total_pixels']:,}",
        "",
        "2. Color Space Characteristics (HSV):",
        f"   - Mean Hue (0-179)    : {color['mean_hue']} (Std: {color['std_hue']})",
        f"   - Mean Saturation     : {color['mean_saturation']} / 255.0 (Std: {color['std_saturation']})",
        f"   - Mean Value/Brightness: {color['mean_value_brightness']} / 255.0 (Std: {color['std_value_brightness']})",
        "",
        "3. Intensity & Contrast Metrics (Grayscale):",
        f"   - Mean Intensity      : {contrast['grayscale_mean']} / 255.0",
        f"   - Standard Deviation  : {contrast['grayscale_std']} (Contrast dispersion)",
        f"   - Dynamic Range       : {contrast['min_intensity']} to {contrast['max_intensity']} (Span: {contrast['contrast_range']})",
        "============================================================",
        f">> {features['academic_disclaimer']}",
        "============================================================",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    print("=== DermaAI Academic Descriptive Feature Extraction ===")
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        raw_bytes = np.fromfile(img_path, dtype=np.uint8)
        img = cv2.imdecode(raw_bytes, cv2.IMREAD_COLOR)
        if img is None:
            print(f"Error: Unable to decode image from '{img_path}'")
            sys.exit(1)
    else:
        # Generate an illustrative skin lesion pattern
        img = np.full((250, 250, 3), (170, 190, 230), dtype=np.uint8)  # Skin background
        cv2.circle(img, (125, 125), 45, (80, 90, 150), -1)  # Erythema / pigment
        cv2.circle(img, (125, 125), 20, (50, 60, 110), -1)  # Central core
        print("Using synthetic sample skin lesion patch for demonstration.")

    results = extract_all_features(img)
    print(format_feature_report(results))

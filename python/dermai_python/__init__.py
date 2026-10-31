"""
DermaAI Supplementary Python Academic Demonstration Suite.
==========================================================

This package contains supplementary, academic Python demonstration modules
designed for educational exploration of computer vision and tabular data
analysis within dermatological health contexts.

Modules included:
- image_preprocessing: OpenCV-based pipeline for resizing, color conversion, and blur.
- image_quality_check: Computer vision metrics for brightness, sharpness, and exposure.
- image_feature_analysis: Descriptive statistics and HSV color space extraction.
- scan_data_analysis: Pandas and Matplotlib exploration of illustrative scan metadata.
- run_demo: Central CLI runner executing all demonstration workflows.

CRITICAL DISCLAIMER:
These modules are strictly for academic demonstration and exploratory research.
They are NOT intended for medical diagnosis, clinical decision support, or treatment.
"""

from __future__ import annotations

import importlib
from typing import Any

__version__ = "1.0.0"
__author__ = "DermaAI Academic Team"

__all__ = [
    # image_preprocessing
    "load_image",
    "validate_image",
    "resize_image",
    "convert_bgr_to_rgb",
    "convert_to_grayscale",
    "apply_gaussian_blur",
    "save_processed_image",
    "preprocess_pipeline",
    # image_quality_check
    "get_image_dimensions",
    "validate_resolution",
    "calculate_brightness",
    "estimate_sharpness",
    "check_exposure",
    "evaluate_quality",
    "format_quality_report",
    # image_feature_analysis
    "extract_color_features",
    "extract_texture_contrast_features",
    "extract_all_features",
    "format_feature_report",
    # scan_data_analysis
    "load_scan_dataset",
    "get_dataset_overview",
    "compute_distributions",
    "compute_grouped_statistics",
    "generate_distribution_charts",
    "export_summary_csv",
    "run_full_analysis",
]

_MEMBER_MAP = {
    # image_preprocessing
    "load_image": "image_preprocessing",
    "validate_image": "image_preprocessing",
    "resize_image": "image_preprocessing",
    "convert_bgr_to_rgb": "image_preprocessing",
    "convert_to_grayscale": "image_preprocessing",
    "apply_gaussian_blur": "image_preprocessing",
    "save_processed_image": "image_preprocessing",
    "preprocess_pipeline": "image_preprocessing",
    # image_quality_check
    "get_image_dimensions": "image_quality_check",
    "validate_resolution": "image_quality_check",
    "calculate_brightness": "image_quality_check",
    "estimate_sharpness": "image_quality_check",
    "check_exposure": "image_quality_check",
    "evaluate_quality": "image_quality_check",
    "format_quality_report": "image_quality_check",
    # image_feature_analysis
    "extract_color_features": "image_feature_analysis",
    "extract_texture_contrast_features": "image_feature_analysis",
    "extract_all_features": "image_feature_analysis",
    "format_feature_report": "image_feature_analysis",
    # scan_data_analysis
    "load_scan_dataset": "scan_data_analysis",
    "get_dataset_overview": "scan_data_analysis",
    "compute_distributions": "scan_data_analysis",
    "compute_grouped_statistics": "scan_data_analysis",
    "generate_distribution_charts": "scan_data_analysis",
    "export_summary_csv": "scan_data_analysis",
    "run_full_analysis": "scan_data_analysis",
}


def __getattr__(name: str) -> Any:
    """Implement PEP 562 lazy loading for package-level symbols."""
    if name in _MEMBER_MAP:
        module_name = f".{_MEMBER_MAP[name]}"
        module = importlib.import_module(module_name, __package__)
        val = getattr(module, name)
        globals()[name] = val
        return val
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

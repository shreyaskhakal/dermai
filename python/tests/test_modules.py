"""
Unit Test Suite for DermaAI Academic Python Modules.
====================================================

Tests cover:
- Image preprocessing (loading, validation, resizing, color conversions, blur, saving)
- Image quality metrics (resolution check, brightness, Laplacian sharpness, exposure)
- Descriptive feature extraction (HSV color space, contrast, dynamic range)
- Scan data analysis (dataset loading, schema validation, distribution calculations, plotting)
- Command-line runner resilience and error handling
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import cv2
import numpy as np
import pandas as pd

from dermai_python.image_preprocessing import (
    apply_gaussian_blur,
    convert_bgr_to_rgb,
    convert_to_grayscale,
    load_image,
    preprocess_pipeline,
    resize_image,
    save_processed_image,
    validate_image,
)
from dermai_python.image_quality_check import (
    calculate_brightness,
    check_exposure,
    estimate_sharpness,
    evaluate_quality,
    get_image_dimensions,
    validate_resolution,
)
from dermai_python.image_feature_analysis import (
    extract_all_features,
    extract_color_features,
    extract_texture_contrast_features,
)
from dermai_python.scan_data_analysis import (
    compute_distributions,
    compute_grouped_statistics,
    export_summary_csv,
    generate_distribution_charts,
    get_dataset_overview,
    load_scan_dataset,
)
from dermai_python.run_demo import create_illustrative_test_image, run_demonstration


class TestImagePreprocessing(unittest.TestCase):
    """Test suite for image preprocessing module."""

    def setUp(self) -> None:
        # Create a synthetic 100x100 BGR color test image
        self.test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        self.test_img[:, :] = (120, 150, 200)  # Skin tone in BGR
        cv2.circle(self.test_img, (50, 50), 20, (40, 50, 100), -1)

    def test_validate_image_valid(self) -> None:
        self.assertTrue(validate_image(self.test_img))

    def test_validate_image_invalid(self) -> None:
        self.assertFalse(validate_image(None))
        self.assertFalse(validate_image(np.array([])))
        self.assertFalse(validate_image("not an array"))

    def test_resize_image(self) -> None:
        resized = resize_image(self.test_img, target_size=(224, 224))
        self.assertEqual(resized.shape, (224, 224, 3))

    def test_resize_image_invalid_dimensions(self) -> None:
        with self.assertRaises(ValueError):
            resize_image(self.test_img, target_size=(0, 224))

    def test_convert_bgr_to_rgb(self) -> None:
        rgb = convert_bgr_to_rgb(self.test_img)
        self.assertEqual(rgb.shape, self.test_img.shape)
        # Check channel swap: BGR (120, 150, 200) -> RGB (200, 150, 120)
        self.assertEqual(rgb[0, 0, 0], 200)
        self.assertEqual(rgb[0, 0, 1], 150)
        self.assertEqual(rgb[0, 0, 2], 120)

    def test_convert_to_grayscale(self) -> None:
        gray = convert_to_grayscale(self.test_img)
        self.assertEqual(gray.ndim, 2)
        self.assertEqual(gray.shape, (100, 100))

    def test_apply_gaussian_blur(self) -> None:
        blurred = apply_gaussian_blur(self.test_img, kernel_size=(5, 5))
        self.assertEqual(blurred.shape, self.test_img.shape)

    def test_apply_gaussian_blur_invalid_kernel(self) -> None:
        with self.assertRaises(ValueError):
            apply_gaussian_blur(self.test_img, kernel_size=(4, 4))  # Even numbers invalid

    def test_save_and_load_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            file_path = Path(tmpdir) / "saved_test.png"
            saved_path = save_processed_image(self.test_img, file_path)
            self.assertTrue(saved_path.is_file())

            loaded = load_image(saved_path)
            self.assertEqual(loaded.shape, self.test_img.shape)

    def test_load_image_file_not_found(self) -> None:
        with self.assertRaises(FileNotFoundError):
            load_image("non_existent_file_path_12345.jpg")

    def test_preprocess_pipeline(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            file_path = Path(tmpdir) / "pipeline_test.png"
            save_processed_image(self.test_img, file_path)

            results = preprocess_pipeline(file_path, output_dir=tmpdir)
            self.assertEqual(results["processed_shape"], (224, 224, 3))
            self.assertIn("resized", results["saved_files"])
            self.assertIn("grayscale", results["saved_files"])
            self.assertIn("blurred", results["saved_files"])


class TestImageQualityCheck(unittest.TestCase):
    """Test suite for image quality checks."""

    def setUp(self) -> None:
        self.sharp_img = np.zeros((200, 200, 3), dtype=np.uint8)
        # Add high-contrast checkerboard pattern for sharpness
        self.sharp_img[::20, :] = 255
        self.sharp_img[:, ::20] = 255

        # Blurry image
        self.blurry_img = cv2.GaussianBlur(self.sharp_img, (31, 31), 10)

    def test_get_image_dimensions(self) -> None:
        dims = get_image_dimensions(self.sharp_img)
        self.assertEqual(dims["height"], 200)
        self.assertEqual(dims["width"], 200)
        self.assertEqual(dims["channels"], 3)
        self.assertEqual(dims["total_pixels"], 40000)

    def test_validate_resolution(self) -> None:
        pass_res = validate_resolution(self.sharp_img, min_width=150, min_height=150)
        self.assertTrue(pass_res["passed"])

        fail_res = validate_resolution(self.sharp_img, min_width=300, min_height=300)
        self.assertFalse(fail_res["passed"])

    def test_calculate_brightness(self) -> None:
        dark_img = np.full((100, 100), 20, dtype=np.uint8)
        bright_img = np.full((100, 100), 230, dtype=np.uint8)

        self.assertAlmostEqual(calculate_brightness(dark_img), 20.0, places=1)
        self.assertAlmostEqual(calculate_brightness(bright_img), 230.0, places=1)

    def test_estimate_sharpness(self) -> None:
        sharpness_sharp = estimate_sharpness(self.sharp_img)
        sharpness_blurry = estimate_sharpness(self.blurry_img)
        self.assertGreater(sharpness_sharp, sharpness_blurry)

    def test_check_exposure(self) -> None:
        dark_img = np.full((100, 100, 3), 15, dtype=np.uint8)
        exp_dark = check_exposure(dark_img)
        self.assertTrue(exp_dark["is_underexposed"])

        bright_img = np.full((100, 100, 3), 240, dtype=np.uint8)
        exp_bright = check_exposure(bright_img)
        self.assertTrue(exp_bright["is_overexposed"])

    def test_evaluate_quality(self) -> None:
        results = evaluate_quality(self.sharp_img, min_width=100, min_height=100)
        self.assertIn("overall_quality_passed", results)
        self.assertIn("academic_disclaimer", results)


class TestImageFeatureAnalysis(unittest.TestCase):
    """Test suite for descriptive feature extraction."""

    def setUp(self) -> None:
        self.img = np.full((150, 150, 3), (100, 150, 200), dtype=np.uint8)

    def test_extract_color_features(self) -> None:
        feats = extract_color_features(self.img)
        self.assertIn("mean_hue", feats)
        self.assertIn("mean_saturation", feats)
        self.assertIn("mean_value_brightness", feats)
        self.assertGreaterEqual(feats["mean_hue"], 0.0)

    def test_extract_texture_contrast_features(self) -> None:
        feats = extract_texture_contrast_features(self.img)
        self.assertIn("grayscale_mean", feats)
        self.assertIn("contrast_range", feats)
        self.assertEqual(feats["contrast_range"], 0.0)  # Uniform image

    def test_extract_all_features(self) -> None:
        all_feats = extract_all_features(self.img)
        self.assertIn("dimensions", all_feats)
        self.assertIn("color_space_hsv", all_feats)
        self.assertIn("contrast_and_intensity", all_feats)
        self.assertIn("academic_disclaimer", all_feats)


class TestScanDataAnalysis(unittest.TestCase):
    """Test suite for tabular scan data exploration."""

    def setUp(self) -> None:
        self.sample_csv = Path(__file__).resolve().parent.parent / "sample_data" / "sample_scans.csv"

    def test_load_scan_dataset(self) -> None:
        df = load_scan_dataset(self.sample_csv)
        self.assertIsInstance(df, pd.DataFrame)
        self.assertGreaterEqual(len(df), 20)

    def test_dataset_overview(self) -> None:
        df = load_scan_dataset(self.sample_csv)
        overview = get_dataset_overview(df)
        self.assertEqual(overview["total_records"], len(df))
        self.assertEqual(len(overview["first_five_records"]), 5)

    def test_compute_distributions(self) -> None:
        df = load_scan_dataset(self.sample_csv)
        dist = compute_distributions(df)
        self.assertIn("input_type_distribution", dist)
        self.assertIn("reported_concern_distribution", dist)
        self.assertIn("confidence_statistics", dist)
        self.assertGreater(dist["confidence_statistics"]["mean"], 0.0)

    def test_compute_grouped_statistics(self) -> None:
        df = load_scan_dataset(self.sample_csv)
        grouped = compute_grouped_statistics(df)
        self.assertIn("reported_concern", grouped.columns)
        self.assertIn("mean_confidence", grouped.columns)
        self.assertIn("total_cases", grouped.columns)

    def test_generate_charts_and_csv_export(self) -> None:
        df = load_scan_dataset(self.sample_csv)
        with tempfile.TemporaryDirectory() as tmpdir:
            charts = generate_distribution_charts(df, output_dir=tmpdir)
            self.assertIn("reported_concerns_bar", charts)
            self.assertIn("input_types_pie", charts)
            self.assertTrue(Path(charts["reported_concerns_bar"]).is_file())
            self.assertTrue(Path(charts["input_types_pie"]).is_file())

            csv_path = export_summary_csv(df, output_path=Path(tmpdir) / "summary.csv")
            self.assertTrue(csv_path.is_file())


class TestRunDemoIntegration(unittest.TestCase):
    """Integration test suite for the CLI runner."""

    def test_create_illustrative_test_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            target = Path(tmpdir) / "test_patch.png"
            path = create_illustrative_test_image(target)
            self.assertTrue(path.is_file())

    def test_run_demonstration_end_to_end(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            ret = run_demonstration(output_dir=tmpdir, auto_generate_image=True)
            self.assertEqual(ret, 0)


class TestSampleImagesEvaluation(unittest.TestCase):
    """Test suite validating heuristics against pre-generated illustrative test images."""

    def setUp(self) -> None:
        self.img_dir = Path(__file__).resolve().parent.parent / "sample_data" / "sample_images"

    def test_sample_images_exist(self) -> None:
        expected = [
            "normal_skin_patch.png",
            "pigmented_mole_patch.png",
            "erythema_rash_patch.png",
            "blurry_capture_sample.png",
            "glare_overexposed_sample.png",
        ]
        for name in expected:
            self.assertTrue((self.img_dir / name).is_file(), f"Missing sample image: {name}")

    def test_blurry_sample_detected(self) -> None:
        blurry_path = self.img_dir / "blurry_capture_sample.png"
        img = load_image(blurry_path)
        eval_res = evaluate_quality(img, blur_threshold=100.0)
        self.assertTrue(eval_res["is_blurry"])
        self.assertFalse(eval_res["overall_quality_passed"])

    def test_glare_overexposed_sample_detected(self) -> None:
        glare_path = self.img_dir / "glare_overexposed_sample.png"
        img = load_image(glare_path)
        eval_res = evaluate_quality(img)
        self.assertTrue(eval_res["exposure_check"]["is_overexposed"])
        self.assertFalse(eval_res["overall_quality_passed"])

    def test_pigmented_mole_sample_features(self) -> None:
        mole_path = self.img_dir / "pigmented_mole_patch.png"
        img = load_image(mole_path)
        feats = extract_all_features(img)
        self.assertEqual(feats["dimensions"]["width"], 300)
        self.assertEqual(feats["dimensions"]["height"], 300)
        self.assertGreater(feats["contrast_and_intensity"]["contrast_range"], 0)


if __name__ == "__main__":
    unittest.main()


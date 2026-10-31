"""
Image Preprocessing Module for DermaAI Academic Demonstration.
=============================================================

This module provides standard computer vision preprocessing operations
typically applied to dermatological images before feeding them into deep
learning neural networks or machine learning classification pipelines.

Operations:
- Image loading with integrity validation
- Dimensionality and data type validation
- Standardized resizing to 224x224 (e.g., standard input size for ResNet/MobileNet)
- Color space conversion (OpenCV BGR to RGB)
- Grayscale luminance transformation
- Gaussian smoothing (noise and high-frequency artifact suppression)
- Safe saving of intermediate and preprocessed representations

ACADEMIC DISCLAIMER:
This module is strictly an academic demonstration of computer vision
preprocessing steps and is NOT certified for medical diagnostics.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Tuple, Union

import cv2
import numpy as np

# Configure module-level logger
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def load_image(image_path: Union[str, Path]) -> np.ndarray:
    """Load an image from disk using OpenCV with comprehensive error checking.

    Args:
        image_path: Path to the target image file.

    Returns:
        np.ndarray: Loaded image in OpenCV BGR format.

    Raises:
        FileNotFoundError: If the specified file does not exist.
        ValueError: If the file exists but cannot be decoded as an image.
    """
    path = Path(image_path)
    if not path.is_file():
        raise FileNotFoundError(f"Image file not found: {path.resolve()}")

    # cv2.imread loads the image in BGR format
    # Using cv2.imdecode with np.fromfile to safely handle Windows Unicode paths
    try:
        image_data = np.fromfile(str(path), dtype=np.uint8)
        image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise ValueError(f"Failed to read image byte stream from {path}: {exc}") from exc

    if image is None or image.size == 0:
        raise ValueError(
            f"File '{path.name}' is corrupted or not a recognized image format."
        )

    logger.info(f"Loaded image '{path.name}' with shape {image.shape} (H x W x C)")
    return image


def validate_image(image: Any) -> bool:
    """Validate whether an object is a valid, non-empty NumPy image array.

    Args:
        image: Object to validate.

    Returns:
        bool: True if valid, False otherwise.
    """
    if not isinstance(image, np.ndarray):
        logger.error("Validation failed: input is not a NumPy array.")
        return False

    if image.size == 0:
        logger.error("Validation failed: NumPy array is empty.")
        return False

    if image.ndim not in (2, 3):
        logger.error(f"Validation failed: expected 2D or 3D array, got {image.ndim}D.")
        return False

    h, w = image.shape[:2]
    if h <= 0 or w <= 0:
        logger.error(f"Validation failed: non-positive dimensions ({h}x{w}).")
        return False

    return True


def resize_image(
    image: np.ndarray,
    target_size: Tuple[int, int] = (224, 224),
    interpolation: int = cv2.INTER_AREA,
) -> np.ndarray:
    """Resize an image to standardized dimensions (width, height).

    224x224 pixels is the canonical input resolution for popular computer
    vision architectures used in academic skin lesion benchmarks (such as
    ISIC challenges utilizing ResNet-50, EfficientNet, or MobileNet).

    Args:
        image: Source image array.
        target_size: Tuple of (target_width, target_height). Defaults to (224, 224).
        interpolation: OpenCV interpolation algorithm flag.

    Returns:
        np.ndarray: Resized image array.

    Raises:
        ValueError: If input image is invalid or target sizes are non-positive.
    """
    if not validate_image(image):
        raise ValueError("Cannot resize an invalid image array.")

    width, height = target_size
    if width <= 0 or height <= 0:
        raise ValueError(f"Invalid target dimensions: {target_size}. Must be positive.")

    resized = cv2.resize(image, (width, height), interpolation=interpolation)
    logger.info(f"Resized image from {image.shape[:2]} to target {(height, width)}")
    return resized


def convert_bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """Convert an OpenCV BGR image to RGB channel ordering.

    OpenCV reads color images in BGR format by default. Deep learning libraries
    (PyTorch, TensorFlow) and plotting libraries (Matplotlib, PIL) require RGB.

    Args:
        image: BGR image array with 3 channels.

    Returns:
        np.ndarray: RGB image array.

    Raises:
        ValueError: If image is invalid or not 3-channel.
    """
    if not validate_image(image):
        raise ValueError("Invalid image array provided for BGR to RGB conversion.")

    if image.ndim != 3 or image.shape[2] != 3:
        raise ValueError(
            f"BGR to RGB requires 3-channel image. Received shape {image.shape}."
        )

    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def convert_to_grayscale(image: np.ndarray) -> np.ndarray:
    """Convert a color image (BGR or RGB) to a single-channel grayscale representation.

    Grayscale conversion simplifies luminance and texture gradient computation
    and isolates intensity variations across skin lesions.

    Args:
        image: Color image array (2D or 3D).

    Returns:
        np.ndarray: Single-channel grayscale image array (uint8).

    Raises:
        ValueError: If the input image is invalid.
    """
    if not validate_image(image):
        raise ValueError("Invalid image array provided for grayscale conversion.")

    if image.ndim == 2:
        # Already single channel
        return image.copy()

    if image.shape[2] == 1:
        return image[:, :, 0].copy()

    if image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if image.shape[2] == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)

    raise ValueError(f"Unsupported number of channels: {image.shape[2]}")


def apply_gaussian_blur(
    image: np.ndarray,
    kernel_size: Tuple[int, int] = (5, 5),
    sigma_x: float = 0.0,
) -> np.ndarray:
    """Apply Gaussian blur filter to smooth high-frequency noise and dermoscopic artifacts.

    Args:
        image: Input image array.
        kernel_size: Tuple representing kernel width and height (must be positive odd integers).
        sigma_x: Gaussian kernel standard deviation in X direction.

    Returns:
        np.ndarray: Blurred image array.

    Raises:
        ValueError: If image is invalid or kernel dimensions are not positive odd integers.
    """
    if not validate_image(image):
        raise ValueError("Invalid image array provided for Gaussian blur.")

    kw, kh = kernel_size
    if kw <= 0 or kh <= 0 or kw % 2 == 0 or kh % 2 == 0:
        raise ValueError(
            f"Kernel size dimensions must be positive odd integers, received: {kernel_size}"
        )

    blurred = cv2.GaussianBlur(image, (kw, kh), sigmaX=sigma_x)
    return blurred


def save_processed_image(
    image: np.ndarray,
    output_path: Union[str, Path],
) -> Path:
    """Save a processed image array to disk safely.

    Args:
        image: Image array to write.
        output_path: Target file path on disk.

    Returns:
        Path: Resolved absolute path to the saved image file.

    Raises:
        ValueError: If image is invalid.
        IOError: If OpenCV fails to encode and write the file.
    """
    if not validate_image(image):
        raise ValueError("Cannot save an invalid image array.")

    path = Path(output_path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)

    # Encode and save with support for Windows path formats
    ext = path.suffix.lower() if path.suffix else ".png"
    success, buffer = cv2.imencode(ext, image)
    if not success:
        raise IOError(f"Failed to encode image to format '{ext}'")

    try:
        buffer.tofile(str(path))
    except Exception as exc:
        raise IOError(f"Failed to write image file to '{path}': {exc}") from exc

    logger.info(f"Saved processed image to: {path}")
    return path


def preprocess_pipeline(
    image_path: Union[str, Path],
    output_dir: Union[str, Path, None] = None,
) -> dict[str, Any]:
    """Execute the complete academic preprocessing pipeline on a skin image.

    Pipeline stages:
    1. Image loading and validation
    2. Standardization / Resizing to (224, 224)
    3. Color space conversion (BGR -> RGB)
    4. Grayscale luminance transformation
    5. Gaussian noise smoothing
    6. Optional persistence of intermediate representations

    Args:
        image_path: Path to source image.
        output_dir: Optional directory to store artifacts.

    Returns:
        dict: Dictionary containing processed arrays, metadata, and saved paths.
    """
    original_bgr = load_image(image_path)
    resized_bgr = resize_image(original_bgr, target_size=(224, 224))
    rgb_image = convert_bgr_to_rgb(resized_bgr)
    grayscale = convert_to_grayscale(resized_bgr)
    blurred = apply_gaussian_blur(resized_bgr, kernel_size=(5, 5))

    results: dict[str, Any] = {
        "original_shape": original_bgr.shape,
        "processed_shape": resized_bgr.shape,
        "resized_bgr": resized_bgr,
        "rgb_image": rgb_image,
        "grayscale": grayscale,
        "blurred": blurred,
        "saved_files": {},
    }

    if output_dir:
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        base = Path(image_path).stem

        results["saved_files"]["resized"] = str(
            save_processed_image(resized_bgr, out / f"{base}_preprocessed_224.png")
        )
        results["saved_files"]["grayscale"] = str(
            save_processed_image(grayscale, out / f"{base}_grayscale.png")
        )
        results["saved_files"]["blurred"] = str(
            save_processed_image(blurred, out / f"{base}_blurred.png")
        )

    return results


if __name__ == "__main__":
    import sys

    print("=== DermaAI Academic Preprocessing Demonstration ===")
    if len(sys.argv) > 1:
        test_path = sys.argv[1]
    else:
        # Create an illustrative synthetic skin lesion patch for standalone testing
        synthetic_path = Path("demo_output/synthetic_skin_sample.png")
        synthetic_path.parent.mkdir(parents=True, exist_ok=True)

        # Generate a synthetic 300x300 skin patch with a circular pigmented lesion
        patch = np.full((300, 300, 3), (175, 195, 235), dtype=np.uint8)  # Skin tone in BGR
        cv2.circle(patch, (150, 150), 55, (70, 85, 140), -1)  # Lesion center
        cv2.GaussianBlur(patch, (15, 15), 5, dst=patch)
        save_processed_image(patch, synthetic_path)
        test_path = str(synthetic_path)
        print(f"Created illustrative test skin patch at: {synthetic_path}")

    res = preprocess_pipeline(test_path, output_dir="demo_output/preprocessing_demo")
    print(f"Pipeline executed successfully.")
    print(f"- Original Dimensions: {res['original_shape']}")
    print(f"- Standardized Resized: {res['processed_shape']}")
    print(f"- Artifacts saved: {list(res['saved_files'].keys())}")

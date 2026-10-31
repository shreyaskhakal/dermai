"""
Scan Data Analysis Module for DermaAI Academic Demonstration.
=============================================================

This module provides exploratory data analysis (EDA) and summary statistics
on illustrative, synthetic skin scan logs. In digital health platforms,
analyzing scan metadata, capture modalities, and model certainty scores
is essential for monitoring pipeline health, identifying underrepresented
skin concerns, and detecting potential bias across demographics.

Analyses Implemented:
1. Dataset loading and schema validation
2. Tabular inspection (first 5 records, data types, nulls)
3. Total scan counts and modality distributions (upload vs camera vs symptoms)
4. Reported dermatological concern prevalence
5. Model confidence score statistical profile (mean, median, std, min, max)
6. Grouped aggregated statistics (confidence by concern and capture mode)
7. Automated generation and export of publication-grade charts (bar and pie)
8. CSV statistical summary export to demo_output

CRITICAL ACADEMIC & PRIVACY DISCLAIMER:
The dataset analyzed by this module is completely synthetic and illustrative.
It does NOT contain real patient protected health information (PHI), clinical records,
or data from the production DermaAI service.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Union

# Set headless backend for Matplotlib before importing pyplot
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

# Configure logger
logger = logging.getLogger(__name__)

# Expected schema definition
REQUIRED_COLUMNS: List[str] = [
    "scan_id",
    "age_group",
    "input_type",
    "reported_concern",
    "analysis_status",
    "confidence_score",
]


def load_scan_dataset(csv_path: Union[str, Path]) -> pd.DataFrame:
    """Load and validate the synthetic scan records CSV dataset.

    Args:
        csv_path: Path to the target CSV file.

    Returns:
        pd.DataFrame: Validated Pandas DataFrame.

    Raises:
        FileNotFoundError: If the specified CSV does not exist.
        ValueError: If required columns are missing or the file is empty.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Scan dataset CSV not found at: {path.resolve()}")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise ValueError(f"Failed to parse CSV file '{path.name}': {exc}") from exc

    if df.empty:
        raise ValueError(f"Dataset in '{path.name}' is empty.")

    # Validate schema
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing required columns: {missing}. Expected: {REQUIRED_COLUMNS}"
        )

    # Clean whitespace in string/object columns
    str_cols = df.select_dtypes(include=["object", "string"]).columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()

    # Ensure confidence_score is float
    df["confidence_score"] = pd.to_numeric(df["confidence_score"], errors="coerce")

    logger.info(f"Loaded {len(df)} scan records from {path.name}")
    return df


def get_dataset_overview(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate structural and summary overview of the scan dataset.

    Args:
        df: Loaded DataFrame.

    Returns:
        dict: Overview metrics including record counts, null counts, and head records.
    """
    return {
        "total_records": int(len(df)),
        "columns": list(df.columns),
        "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "null_counts": {col: int(cnt) for col, cnt in df.isnull().sum().items()},
        "first_five_records": df.head(5).to_dict(orient="records"),
    }


def compute_distributions(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute frequency and percentage distributions of categorical fields.

    Args:
        df: Loaded DataFrame.

    Returns:
        dict: Categorical distributions and continuous confidence statistics.
    """
    total = len(df)
    input_counts = df["input_type"].value_counts().to_dict()
    input_pct = {k: round((v / total) * 100, 2) for k, v in input_counts.items()}

    concern_counts = df["reported_concern"].value_counts().to_dict()
    concern_pct = {k: round((v / total) * 100, 2) for k, v in concern_counts.items()}

    status_counts = df["analysis_status"].value_counts().to_dict()
    status_pct = {k: round((v / total) * 100, 2) for k, v in status_counts.items()}

    scores = df["confidence_score"].dropna()
    confidence_stats = {
        "mean": round(float(scores.mean()), 4) if not scores.empty else 0.0,
        "median": round(float(scores.median()), 4) if not scores.empty else 0.0,
        "std": round(float(scores.std()), 4) if not scores.empty else 0.0,
        "min": round(float(scores.min()), 4) if not scores.empty else 0.0,
        "max": round(float(scores.max()), 4) if not scores.empty else 0.0,
    }

    return {
        "total_scans": total,
        "input_type_distribution": {"counts": input_counts, "percentages": input_pct},
        "reported_concern_distribution": {"counts": concern_counts, "percentages": concern_pct},
        "analysis_status_distribution": {"counts": status_counts, "percentages": status_pct},
        "confidence_statistics": confidence_stats,
    }


def compute_grouped_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """Compute aggregated summary statistics grouped by reported concern.

    Args:
        df: Loaded DataFrame.

    Returns:
        pd.DataFrame: Summary table of record counts, mean confidence, and status counts.
    """
    grouped = (
        df.groupby("reported_concern")
        .agg(
            total_cases=("scan_id", "count"),
            mean_confidence=("confidence_score", "mean"),
            std_confidence=("confidence_score", "std"),
            min_confidence=("confidence_score", "min"),
            max_confidence=("confidence_score", "max"),
        )
        .reset_index()
    )

    # Round numerical metrics
    grouped["mean_confidence"] = grouped["mean_confidence"].round(3)
    grouped["std_confidence"] = grouped["std_confidence"].fillna(0.0).round(3)
    grouped["min_confidence"] = grouped["min_confidence"].round(3)
    grouped["max_confidence"] = grouped["max_confidence"].round(3)

    return grouped.sort_values(by="total_cases", ascending=False)


def generate_distribution_charts(
    df: pd.DataFrame,
    output_dir: Union[str, Path] = "demo_output",
) -> Dict[str, Path]:
    """Generate and save publication-grade distribution plots (bar chart and pie chart).

    Args:
        df: Loaded DataFrame.
        output_dir: Destination directory for saved PNG visual plots.

    Returns:
        dict: Mapping of plot names to resolved file paths.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    generated_charts: Dict[str, Path] = {}

    # 1. Bar Chart: Reported Concern Distribution
    concern_counts = df["reported_concern"].value_counts()
    plt.figure(figsize=(10, 6))
    bars = plt.barh(
        concern_counts.index[::-1],
        concern_counts.values[::-1],
        color="#2b6cb0",
        edgecolor="#1a365d",
    )
    plt.title("DermaAI Demonstration: Reported Skin Concern Distribution", fontsize=14, weight="bold")
    plt.xlabel("Number of Scans", fontsize=12)
    plt.ylabel("Reported Dermatological Concern", fontsize=12)
    plt.grid(axis="x", linestyle="--", alpha=0.5)

    # Annotate bar values
    for bar in bars:
        width = bar.get_width()
        plt.text(
            width + 0.1,
            bar.get_y() + bar.get_height() / 2,
            f"{int(width)}",
            ha="left",
            va="center",
            fontsize=10,
            weight="bold",
        )

    plt.tight_layout()
    bar_path = out_dir / "reported_concerns_distribution.png"
    plt.savefig(bar_path, dpi=300)
    plt.close()
    generated_charts["reported_concerns_bar"] = bar_path.resolve()

    # 2. Pie Chart: Input-Type Distribution
    input_counts = df["input_type"].value_counts()
    colors = ["#4299e1", "#48bb78", "#ed8936", "#9f7aea"][: len(input_counts)]
    explode = [0.03] * len(input_counts)

    plt.figure(figsize=(8, 7))
    plt.pie(
        input_counts.values,
        labels=[k.replace("_", " ").title() for k in input_counts.index],
        autopct="%1.1f%%",
        startangle=140,
        colors=colors,
        explode=explode,
        shadow=False,
        textprops={"fontsize": 11, "weight": "bold"},
    )
    plt.title("DermaAI Demonstration: Input Modality Distribution", fontsize=14, weight="bold")
    plt.tight_layout()
    pie_path = out_dir / "input_types_distribution.png"
    plt.savefig(pie_path, dpi=300)
    plt.close()
    generated_charts["input_types_pie"] = pie_path.resolve()

    # 3. Confidence Comparison Chart: Mean Confidence by Reported Concern
    grouped = compute_grouped_statistics(df)
    plt.figure(figsize=(10, 6))
    plt.bar(
        grouped["reported_concern"],
        grouped["mean_confidence"],
        color="#319795",
        edgecolor="#234e52",
    )
    plt.title("DermaAI Demonstration: Mean Model Confidence by Skin Concern", fontsize=14, weight="bold")
    plt.xlabel("Reported Concern", fontsize=12)
    plt.ylabel("Mean Confidence Score (0.0 - 1.0)", fontsize=12)
    plt.ylim(0.0, 1.05)
    plt.xticks(rotation=40, ha="right", fontsize=10)
    plt.grid(axis="y", linestyle="--", alpha=0.5)

    for i, val in enumerate(grouped["mean_confidence"]):
        plt.text(i, val + 0.02, f"{val:.2f}", ha="center", fontsize=9, weight="bold")

    plt.tight_layout()
    conf_path = out_dir / "confidence_by_concern.png"
    plt.savefig(conf_path, dpi=300)
    plt.close()
    generated_charts["confidence_by_concern_bar"] = conf_path.resolve()

    logger.info(f"Generated {len(generated_charts)} charts in {out_dir}")
    return generated_charts


def export_summary_csv(
    df: pd.DataFrame,
    output_path: Union[str, Path] = "demo_output/scan_summary_statistics.csv",
) -> Path:
    """Export aggregated statistical metrics to a clean CSV summary report.

    Args:
        df: Loaded DataFrame.
        output_path: Destination path for exported CSV.

    Returns:
        Path: Resolved absolute path to exported CSV.
    """
    path = Path(output_path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)

    summary_df = compute_grouped_statistics(df)
    summary_df.to_csv(path, index=False)
    logger.info(f"Exported summary statistics CSV to: {path}")
    return path


def run_full_analysis(
    csv_path: Union[str, Path],
    output_dir: Union[str, Path] = "demo_output",
) -> Dict[str, Any]:
    """Execute complete end-to-end dataset analysis pipeline.

    Args:
        csv_path: Path to input CSV dataset.
        output_dir: Directory where plots and CSV export will be stored.

    Returns:
        dict: Complete structured analysis summary and generated file locations.
    """
    df = load_scan_dataset(csv_path)
    overview = get_dataset_overview(df)
    distributions = compute_distributions(df)
    grouped_df = compute_grouped_statistics(df)
    charts = generate_distribution_charts(df, output_dir=output_dir)
    csv_export = export_summary_csv(df, output_path=Path(output_dir) / "scan_summary_statistics.csv")

    return {
        "overview": overview,
        "distributions": distributions,
        "grouped_statistics": grouped_df.to_dict(orient="records"),
        "generated_charts": {k: str(v) for k, v in charts.items()},
        "exported_csv": str(csv_export),
        "total_records": len(df),
    }


if __name__ == "__main__":
    import sys

    print("=== DermaAI Academic Scan Data Analysis Demonstration ===")
    default_csv = Path(__file__).resolve().parent.parent / "sample_data" / "sample_scans.csv"

    if len(sys.argv) > 1:
        target_csv = Path(sys.argv[1])
    else:
        target_csv = default_csv

    if not target_csv.exists():
        print(f"Error: Target dataset not found at '{target_csv}'")
        sys.exit(1)

    results = run_full_analysis(target_csv, output_dir="demo_output/data_analysis_demo")

    print("\n--- DATASET OVERVIEW ---")
    print(f"Total Scans Analyzed: {results['total_records']}")
    print(f"Average Illustrative Confidence Score: {results['distributions']['confidence_statistics']['mean']:.4f}")

    print("\n--- REPORTED CONCERN BREAKDOWN ---")
    for concern, count in results["distributions"]["reported_concern_distribution"]["counts"].items():
        pct = results["distributions"]["reported_concern_distribution"]["percentages"][concern]
        print(f"  * {concern:<24}: {count:>2} scans ({pct:>5.1f}%)")

    print("\n--- INPUT MODALITY BREAKDOWN ---")
    for modality, count in results["distributions"]["input_type_distribution"]["counts"].items():
        pct = results["distributions"]["input_type_distribution"]["percentages"][modality]
        print(f"  * {modality:<24}: {count:>2} scans ({pct:>5.1f}%)")

    print("\n--- GENERATED ARTIFACTS ---")
    for name, path in results["generated_charts"].items():
        print(f"  [Chart] {name}: {path}")
    print(f"  [CSV]   Summary: {results['exported_csv']}")

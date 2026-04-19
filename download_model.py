import argparse
from pathlib import Path

from transformers import AutoImageProcessor, AutoModelForImageClassification


DEFAULT_MODEL_ID = "LaurianeMD/vit-skin-disease"
DEFAULT_OUTPUT_DIR = Path("models/lauriane-vit-skin-disease")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download a skin-disease model to local files.")
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID, help="Hugging Face model id to download.")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Local directory to save the model.")
    parser.add_argument("--force", action="store_true", help="Overwrite the local directory if it already exists.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)

    if output_dir.exists() and any(output_dir.iterdir()) and not args.force:
        print(f"Local model already exists at {output_dir}. Use --force to re-download.")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    processor = AutoImageProcessor.from_pretrained(args.model_id)
    model = AutoModelForImageClassification.from_pretrained(args.model_id)

    processor.save_pretrained(output_dir)
    model.save_pretrained(output_dir)

    print(f"Saved {args.model_id} to {output_dir}")


if __name__ == "__main__":
    main()
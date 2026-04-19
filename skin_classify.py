import argparse
import os
from transformers import pipeline


DEFAULT_MODEL_ID = "LaurianeMD/vit-skin-disease"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run skin-condition inference with a Hugging Face model.")
    parser.add_argument("--image", default="skin.jpg", help="Path to input skin image.")
    parser.add_argument("--model", default=DEFAULT_MODEL_ID, help="Hugging Face model id.")
    parser.add_argument("--top-k", type=int, default=5, help="How many predictions to print.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not os.path.exists(args.image):
        raise FileNotFoundError(f"Image not found: {args.image}")

    classifier = pipeline("image-classification", model=args.model)
    predictions = classifier(args.image, top_k=args.top_k)

    print(f"Model: {args.model}")
    print(f"Image: {args.image}")
    print("Predictions:")
    for pred in predictions:
        label = pred.get("label", "unknown")
        score = pred.get("score", 0.0)
        print(f"{label}: {score:.4f}")


if __name__ == "__main__":
    main()
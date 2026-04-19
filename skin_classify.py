import argparse
import os
from transformers import pipeline


REMOTE_MODEL_ID = "LaurianeMD/vit-skin-disease"
LOCAL_MODEL_DIR = "models/lauriane-vit-skin-disease"

_classifier = None


def _resolve_model(model_ref: str) -> str:
    if model_ref == LOCAL_MODEL_DIR and not os.path.isdir(model_ref):
        return REMOTE_MODEL_ID
    return model_ref


def classify(image_path, top_k: int = 5, model: str = LOCAL_MODEL_DIR) -> dict:
    global _classifier
    if _classifier is None:
        _classifier = pipeline("image-classification", model=_resolve_model(model))
    predictions = _classifier(str(image_path), top_k=top_k)
    return {p["label"]: float(p["score"]) for p in predictions}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run skin-condition inference with a Hugging Face model.")
    parser.add_argument("--image", default="skin.jpg", help="Path to input skin image.")
    parser.add_argument(
        "--model",
        default=LOCAL_MODEL_DIR,
        help="Local model directory or Hugging Face model id.",
    )
    parser.add_argument("--top-k", type=int, default=5, help="How many predictions to print.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not os.path.exists(args.image):
        raise FileNotFoundError(f"Image not found: {args.image}")

    model_ref = args.model
    # If default local path is missing, fallback to remote HF model id.
    if model_ref == LOCAL_MODEL_DIR and not os.path.isdir(model_ref):
        model_ref = REMOTE_MODEL_ID

    classifier = pipeline("image-classification", model=model_ref)
    predictions = classifier(args.image, top_k=args.top_k)

    print(f"Model: {model_ref}")
    print(f"Image: {args.image}")
    print("Predictions:")
    for pred in predictions:
        label = pred.get("label", "unknown")
        score = pred.get("score", 0.0)
        print(f"{label}: {score:.4f}")


if __name__ == "__main__":
    main()
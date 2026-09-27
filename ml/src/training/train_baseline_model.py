from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import (
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC


@dataclass(frozen=True)
class TrainingConfig:
    test_size: float = 0.2
    random_state: int = 42
    positive_label: str = "ai_generated"


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "ml" / "data"
FEATURES_PATH = DATA_DIR / "features" / "tabular" / "audio_features.csv"
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
REPORTS_DIR = PROJECT_ROOT / "ml" / "reports"
MODEL_PATH = MODELS_DIR / "baseline_model.joblib"
LABEL_ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"
METRICS_PATH = REPORTS_DIR / "baseline_metrics.csv"
MODEL_COMPARISON_PATH = REPORTS_DIR / "model_comparison.csv"
CLASSIFICATION_REPORT_PATH = REPORTS_DIR / "classification_report.txt"
CONFUSION_MATRIX_PATH = REPORTS_DIR / "confusion_matrix.csv"
TRAINING_SUMMARY_PATH = REPORTS_DIR / "training_summary.json"

NON_FEATURE_COLUMNS = {
    "chunk_id",
    "parent_sample_id",
    "label",
    "chunk_path",
}


def get_feature_columns(features: pd.DataFrame) -> list[str]:
    return [
        column
        for column in features.columns
        if column not in NON_FEATURE_COLUMNS and pd.api.types.is_numeric_dtype(features[column])
    ]


def build_models(random_state: int) -> dict[str, Pipeline]:
    rf = RandomForestClassifier(
        class_weight="balanced",
        n_estimators=400,
        max_depth=12,
        random_state=random_state,
    )
    gb = GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=5,
        random_state=random_state,
    )
    et = ExtraTreesClassifier(
        class_weight="balanced",
        n_estimators=400,
        max_depth=12,
        random_state=random_state,
    )
    lr = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=random_state,
    )
    svm = SVC(
        class_weight="balanced",
        kernel="rbf",
        probability=True,
        random_state=random_state,
    )

    voting = VotingClassifier(
        estimators=[
            ("rf", rf),
            ("gb", gb),
            ("et", et),
            ("lr", Pipeline([("scaler", StandardScaler()), ("lr", lr)])),
            ("svm", Pipeline([("scaler", StandardScaler()), ("svm", svm)])),
        ],
        voting="soft",
    )

    return {
        "voting_ensemble": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("classifier", voting),
            ]
        ),
        "random_forest": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("classifier", rf),
            ]
        ),
        "gradient_boosting": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("classifier", gb),
            ]
        ),
        "extra_trees": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("classifier", et),
            ]
        ),
    }


def split_dataset(
    features: pd.DataFrame,
    config: TrainingConfig,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=config.test_size,
        random_state=config.random_state,
    )
    train_index, test_index = next(
        splitter.split(
            features,
            groups=features["parent_sample_id"],
        )
    )
    return features.iloc[train_index].copy(), features.iloc[test_index].copy()


def calculate_metrics(
    model_name: str,
    y_true: pd.Series,
    y_pred: pd.Series,
    positive_label: int,
) -> dict[str, object]:
    return {
        "model": model_name,
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, pos_label=positive_label, zero_division=0),
        "recall": recall_score(y_true, y_pred, pos_label=positive_label, zero_division=0),
        "f1": f1_score(y_true, y_pred, pos_label=positive_label, zero_division=0),
    }


def calculate_class_balance(features: pd.DataFrame) -> dict[str, int]:
    return {
        str(label): int(count)
        for label, count in features.groupby("label").size().sort_index().items()
    }


def train_baseline_models(config: TrainingConfig | None = None) -> dict[str, object]:
    config = config or TrainingConfig()
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    features = pd.read_csv(FEATURES_PATH)
    feature_columns = get_feature_columns(features)
    train_df, test_df = split_dataset(features, config)

    label_encoder = LabelEncoder()
    y_train = label_encoder.fit_transform(train_df["label"])
    y_test = label_encoder.transform(test_df["label"])
    positive_label = int(label_encoder.transform([config.positive_label])[0])

    x_train = train_df[feature_columns]
    x_test = test_df[feature_columns]

    comparison_rows: list[dict[str, object]] = []
    trained_models: dict[str, Pipeline] = {}

    for model_name, model in build_models(config.random_state).items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        comparison_rows.append(
            calculate_metrics(model_name, y_test, predictions, positive_label)
        )
        trained_models[model_name] = model

    comparison = pd.DataFrame(comparison_rows).sort_values(
        by=["f1", "recall", "accuracy"],
        ascending=False,
    )
    best_model_name = str(comparison.iloc[0]["model"])
    best_model = trained_models[best_model_name]
    best_predictions = best_model.predict(x_test)

    joblib.dump(
        {
            "model": best_model,
            "feature_columns": feature_columns,
            "label_encoder": label_encoder,
            "model_name": best_model_name,
            "positive_label": config.positive_label,
            "ai_chunk_threshold": 0.50,
            "overall_warning_threshold": 0.55,
            "training_rows": int(len(train_df)),
            "test_rows": int(len(test_df)),
            "class_balance": calculate_class_balance(features),
        },
        MODEL_PATH,
    )
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)

    comparison.to_csv(MODEL_COMPARISON_PATH, index=False)
    comparison.head(1).to_csv(METRICS_PATH, index=False)

    report = classification_report(
        y_test,
        best_predictions,
        target_names=label_encoder.classes_,
        zero_division=0,
    )
    CLASSIFICATION_REPORT_PATH.write_text(report, encoding="utf-8")

    confusion = pd.DataFrame(
        confusion_matrix(y_test, best_predictions),
        index=[f"actual_{label}" for label in label_encoder.classes_],
        columns=[f"predicted_{label}" for label in label_encoder.classes_],
    )
    confusion.to_csv(CONFUSION_MATRIX_PATH)

    summary = {
        "best_model_name": best_model_name,
        "model_path": str(MODEL_PATH),
        "feature_count": len(feature_columns),
        "total_rows": int(len(features)),
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "class_balance": calculate_class_balance(features),
        "positive_label": config.positive_label,
        "ai_chunk_threshold": 0.50,
        "overall_warning_threshold": 0.55,
        "best_model_metrics": comparison.iloc[0].to_dict(),
        "all_model_metrics": comparison.to_dict(orient="records"),
    }
    TRAINING_SUMMARY_PATH.write_text(
        json.dumps(summary, indent=2),
        encoding="utf-8",
    )

    return {
        "best_model_name": best_model_name,
        "model_path": MODEL_PATH,
        "label_encoder_path": LABEL_ENCODER_PATH,
        "feature_count": len(feature_columns),
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "comparison": comparison,
        "summary_path": TRAINING_SUMMARY_PATH,
    }


if __name__ == "__main__":
    result = train_baseline_models()
    print(f"Best model: {result['best_model_name']}")
    print(f"Train rows: {result['train_rows']}")
    print(f"Test rows: {result['test_rows']}")
    print(f"Feature count: {result['feature_count']}")
    print(f"Saved model: {result['model_path']}")
    print(f"Comparison:\n{result['comparison']}")

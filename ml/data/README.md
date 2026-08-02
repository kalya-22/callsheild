# Dataset

This folder contains the complete dataset lifecycle for CallShield.

## Folder Stages

- `raw/`: original audio exactly as collected. Do not edit these files.
- `processed/`: cleaned audio after resampling, normalization, and silence removal.
- `chunks/`: fixed-length audio segments created from processed audio.
- `features/`: extracted numerical features used by machine learning models.

## Labels

CallShield starts with two labels:

- `human`: real human speech.
- `ai_generated`: synthetic or AI-generated speech.

Use the same label names everywhere: folder names, metadata files, model labels, and API responses.

## Required Metadata Files

- `metadata_samples.csv`: one row per original audio sample.
- `metadata_chunks.csv`: one row per chunk created from a sample.

Metadata is mandatory because it prevents confusion later during training, evaluation, and final report writing.

## Important Rule

When splitting data into train, validation, and test sets, split by `speaker_id` or `source_id`, not by individual chunks. If chunks from the same speaker appear in both training and testing, the model score can look falsely high.


# CallShield Dataset Guide

## Goal

Build a balanced dataset for detecting whether speech is human or AI-generated.

## Recommended Dataset Balance

Start small, but keep both classes balanced.

Example first milestone:

- 50 human audio samples
- 50 AI-generated audio samples
- 3 to 5 seconds per chunk
- Same preprocessing for both classes

## File Naming Convention

Use lowercase names with underscores.

```text
<label>_<source>_<speaker_id>_<sample_id>.<extension>
```

Examples:

```text
human_librispeech_spk0001_0001.flac
ai_generated_tts_spk0001_0001.wav
```

## Folder Layout

```text
raw/
  human/
  ai_generated/
processed/
  human/
  ai_generated/
chunks/
  human/
  ai_generated/
features/
  tabular/
  summaries/
```

## Metadata Rules

Every original audio file must be listed in `metadata_samples.csv`.

Every generated chunk must be listed in `metadata_chunks.csv`.

Do not rely only on folder names. The metadata files are the source of truth for training and evaluation.

## Data Leakage Prevention

Avoid putting audio from the same speaker or generated voice in both training and testing.

Correct:

```text
Speaker A -> train only
Speaker B -> test only
```

Incorrect:

```text
Speaker A chunk 1 -> train
Speaker A chunk 2 -> test
```

## Suggested Audio Standards

- Sample rate: 16000 Hz
- Channels: mono
- Format after preprocessing: `.wav`
- Chunk length: 3 to 5 seconds
- Normalization: enabled
- Silence removal: enabled


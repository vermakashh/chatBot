import argparse
import torch
import soundfile as sf
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

def load_model(config_path, checkpoint_dir):
    config = XttsConfig()
    config.load_json(config_path)
    model = Xtts.init_from_config(config)
    model.load_checkpoint(config, checkpoint_dir=checkpoint_dir, eval=True)
    model.to("cuda" if torch.cuda.is_available() else "cpu")
    return model, config

def synthesize_speech(model, config, text, speaker_wav, output_path, language):
    outputs = model.synthesize(
        text=text,
        config=config,
        speaker_wav=speaker_wav,
        language=language
    )
    sf.write(output_path, outputs["wav"], 24000)
    print(f"✅ Speech saved to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate speech using XTTS model.")
    parser.add_argument("--config", type=str, required=True, help="Path to config.json")
    parser.add_argument("--checkpoint", type=str, required=True, help="Path to checkpoint directory")
    parser.add_argument("--text", type=str, required=True, help="Text to synthesize")
    parser.add_argument("--ref_audio", type=str, required=True, help="Path to reference speaker audio")
    parser.add_argument("--output", type=str, default="output.wav", help="Path to save output audio")
    parser.add_argument("--language", type=str, default="en", help="Language code (e.g., 'hi', 'en')")
    args = parser.parse_args()

    model, config = load_model(args.config, args.checkpoint)
    synthesize_speech(model, config, args.text, args.ref_audio, args.output, args.language)

if __name__ == "__main__":
    main()

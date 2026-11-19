# Open-weight neural TTS for natural Spanish (Latin American preferred) with commercial-use licenses — state as of 19 Nov 2026

## Q1. Which models produce the most natural Spanish today, and which actually support Spanish?

### Takeaway
The most human-sounding open-weight Spanish in Nov 2026 comes from the 2026 generation of LLM/diffusion "zero-shot + voice-design" models: Qwen3-TTS (Jan 2026), VoxCPM2 (Apr 2026), Chatterbox Multilingual V3 with its dedicated "Latam Spanish" fine-tune, IndexTTS-2.5 (Aug 2026), Fun-CosyVoice 3, MOSS-TTS v1.5 and Fish Audio S2-Pro/Drama 3. All publish Spanish WER/speaker-similarity close to ElevenLabs/MiniMax, but none publishes a Spanish MOS. Small CPU-class models with Spanish (Kyutai Pocket TTS, Supertonic 3, MOSS-TTS-Nano, NeuTTS-Nano-Spanish, Kani-TTS-400m-es) and older ones (Kokoro, Piper, MeloTTS, Bark) are faster but less expressive. Zonos, Spark-TTS and Kyutai's DSM TTS (en/fr) have no Spanish, and VibeVoice's Spanish is explicitly experimental.

### Cited Findings

#### Tier A: 2026 large models with official Spanish support
- **Qwen3-TTS** (Alibaba Qwen, released 2026-01-22; 0.6B and 1.7B) covers 10 languages including Spanish. Variants: 1.7B-VoiceDesign ("voice design based on user-provided descriptions"), 1.7B/0.6B-CustomVoice (9 premium timbres plus instruction control), and 1.7B/0.6B-Base ("3-second rapid voice clone") — [Qwen3-TTS README](https://github.com/QwenLM/Qwen3-TTS); [qwen-tts on PyPI](https://pypi.org/project/qwen-tts/)
- Qwen3-TTS weights card (12Hz-0.6B-Base): license apache-2.0, languages zh/en/ja/ko/de/fr/ru/pt/es/it, not gated — [HF card](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base)
- Qwen3-TTS multilingual test set, **Spanish** (lower WER is better, higher similarity is better):

  | System | WER | Speaker similarity |
  |---|---|---|
  | 12Hz-1.7B-Base | 1.126 | 0.814 |
  | 12Hz-0.6B-Base | 1.491 | 0.812 |
  | MiniMax | 1.029 | 0.762 |
  | ElevenLabs | 1.084 | 0.615 |

  Source: [Qwen3-TTS README](https://github.com/QwenLM/Qwen3-TTS)
- The Qwen3-TTS technical report calls Spanish performance "highly competitive… comparable to the state-of-the-art", though Qwen3-TTS is not the lowest-WER system for Spanish — [Qwen3-TTS Technical Report, arXiv 2601.15621](https://arxiv.org/html/2601.15621v1) (via search summary)
- Two secondary guides report that Qwen3-TTS Spanish output **defaults to a Latin American accent**, controllable via prompt — [texttolab review](https://texttolab.com/blog/qwen3-tts-review); [Medium guide](https://medium.com/@zh.milo/qwen3-tts-the-complete-2026-guide-to-open-source-voice-cloning-and-ai-speech-generation-1a2efca05cd6). These are secondary and not independently verified.
- **VoxCPM2** (OpenBMB, released 2026-04): 2B parameters, ">2 million hours" of training data, 30 languages including Spanish. Features: Voice Design from a natural-language description, controllable cloning, "ultimate cloning" with a transcript, and 48 kHz output — [VoxCPM README](https://github.com/OpenBMB/VoxCPM); [voxcpm on PyPI](https://pypi.org/project/voxcpm/)
- MiniMax multilingual test, **Spanish** (published in the VoxCPM README):

  | System | WER | Similarity |
  |---|---|---|
  | MiniMax | 1.029 | 76.2 |
  | ElevenLabs | 1.084 | 61.5 |
  | Qwen3-TTS | 1.126 | 81.4 |
  | Fish Audio S2 | **0.910** | 77.6 |
  | VoxCPM2 | 1.438 | **83.1** |

  Source: [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- CV3-eval Spanish WER: CosyVoice3-1.5B 4.47, Fish Audio S2 2.00, VoxCPM2 3.80 — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- **Chatterbox Multilingual V3** (Resemble AI): 0.5B parameters, 23 languages including Spanish, with "reduced hallucination" and "more natural, conversational speech" versus V2. A "Single Language Pack" adds dedicated fine-tunes, including "Latam Spanish" (`ResembleAI/Chatterbox-Multilingual-es-mx-latam`) and "Spain Spanish" (`…-es-es`) — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
- The LatAm pack card is tagged license mit, language es, not gated, last modified 2026-06-10 — [HF card](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-mx-latam). A search summary says the card lists locale es-419 / es-MX — [same card, via search](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-mx-latam).
- Resemble reports Spanish CER of **0.46 for the LatAm pack** and 0.62 for the Spain pack, versus 2.89% for the base multilingual model. These are vendor figures — [Resemble V3 post (via search summary)](https://www.resemble.ai/resources/chatterbox-multilingual-v3-tts-with-embedded-watermarking-for-25-languages)
- "As of August 2026, Chatterbox is retired research and is no longer maintained." The code stays public under MIT with no support or updates — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
- **IndexTTS-2.5** (bilibili, released 2026-08-10) supports Chinese, English, Japanese, Spanish and Arabic, with emotion control, speed control (`duration_factor` 0.5x–2.0x) and faster inference than IndexTTS-2 — [IndexTTS README](https://github.com/index-tts/index-tts)
- **Fun-CosyVoice 3.0** (`Fun-CosyVoice3-0.5B-2512`) covers 9 languages including Spanish, plus 18+ Chinese dialects. It does multilingual and cross-lingual zero-shot cloning and supports instructions for "languages, dialects, emotions, speed, volume" — [CosyVoice README](https://github.com/FunAudioLLM/CosyVoice)
- **MOSS-TTS v1.5** (2026-05-26) and MOSS-TTS-Local-Transformer-v1.5 (4B, 2026-06-18) support 31 languages including Spanish, with language tags and `[pause X.Ys]` control. **MOSS-TTSD v1.0** (2026-02-10), a multi-speaker dialogue model, lists Spanish — [MOSS-TTS README](https://github.com/OpenMOSS/MOSS-TTS); [MOSS-TTSD README](https://github.com/OpenMOSS/MOSS-TTSD)
- **Fish Audio** ships Drama 3 (35B-A3B MoE, 3B active per token) and S2-Pro (4B). The README claims Drama 3 has the best WER in "11 of 24 languages" and the best SIM in "17 of 24" on the MiniMax multilingual testset — [fish-speech README](https://github.com/fishaudio/fish-speech)
- **NVIDIA MagpieTTS v2602** (2026-03, `magpie_tts_multilingual_357m`) supports 9 languages (En, Es, De, Fr, Vi, It, Zh, Hi, Ja) — [NeMo README on PyPI](https://pypi.org/project/nemo-toolkit/)

#### Tier B: small or CPU-oriented models with Spanish (2026)
- **Kyutai Pocket TTS** (Jan 2026, ~100M parameters) supports English, French, German, Portuguese, Italian, Spanish and Dutch. Non-English languages also have 24-layer variants that are "higher quality but slower". The pre-made catalog includes a Spanish voice, "lola", built from a Common Voice Spanish clip — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
- The Pocket TTS weights card lists languages en/fr/de/pt/it/es — [HF card](https://huggingface.co/kyutai/pocket-tts)
- **Supertonic 3** (Supertone, 2026-04-29; 99M parameters) supports 31 languages including Spanish (`--lang es`) — [supertonic on PyPI](https://pypi.org/project/supertonic/); [Supertonic README](https://github.com/supertone-inc/supertonic)
- **MOSS-TTS-Nano** (2026-04-10; 0.1B) supports 20 languages including Spanish — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
- **NeuTTS-Nano-Spanish** (Neuphonic) is part of the NeuTTS-Nano Multilingual Collection (Spanish, German, French). It is a cloning model and ships a Spanish sample reference, "mateo" — [NeuTTS README](https://github.com/neuphonic/neutts)
- **Kani-TTS**: `kani-tts-400m-es` (Spanish) and `kani-tts-370m` multilingual (EN, ES, ZH, DE, KO, AR). The README notes it is "Primarily optimized for English" and has "Limited emotional expressivity without fine-tuning" — [Kani-TTS README](https://github.com/nineninesix-ai/kani-tts)

#### Tier C: older Spanish-capable models (pre-2026 information marked)
- **Kokoro-82M** uses Spanish lang code `'e'` (alias `'es'`), routed to espeak-ng language `es` — [Kokoro pipeline.py](https://github.com/hexgrad/kokoro/blob/main/kokoro/pipeline.py); [Kokoro README](https://github.com/hexgrad/kokoro)
- Kokoro's VOICES.md lists Spanish as "1F 2M" (ef_dora, em_alex, em_santa) and warns: "Support for non-English languages may be absent or thin due to weak G2P and/or lack of training data." The last `kokoro` PyPI release is 0.9.4, from **2025-04-05** — [Kokoro VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md); [kokoro on PyPI](https://pypi.org/project/kokoro/)
- **Piper** Spanish voices:
  - es_AR: daniela-high
  - es_ES: carlfm-x_low, davefx-medium, mls_10246-low, mls_9972-low, sharvard-medium
  - es_MX: ald-medium, claude-high

  Source: [Piper VOICES.md](https://github.com/rhasspy/piper/blob/master/VOICES.md); [piper1-gpl docs/VOICES.md](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md)
- **MeloTTS** has one Spanish model, `language='ES'`, with a single `speaker_ids['ES']` — [MeloTTS install docs](https://github.com/myshell-ai/MeloTTS/blob/main/docs/install.md). Its PyPI package (`melotts` 0.1.1) dates from **2024-02-29** — [melotts on PyPI](https://pypi.org/project/melotts/)
- **XTTS-v2** supports Spanish ("17 languages" in the maintained idiap fork) — [idiap XTTS docs](https://github.com/idiap/coqui-ai-TTS/blob/main/docs/source/models/xtts.md)
- **F5-Spanish** (jpgallegoar) is an F5-TTS Base model trained on "Voxpopuli & Crowdsourced & TEDx, 218 hours" — [F5-TTS SHARED.md](https://github.com/SWivid/F5-TTS/blob/main/src/f5_tts/infer/SHARED.md)
- Fish Speech 1.5 / OpenAudio S1 (2025 README) supported Spanish among 8 languages — [fish-speech 0.1.0 on PyPI](https://pypi.org/project/fish-speech/)
- **Bark** (2023) supports Spanish (✅) with speaker presets — [suno-bark on PyPI](https://pypi.org/project/suno-bark/)
- **Orpheus** multilingual "research release" (April 2025) offers "7 pairs of pretrained and finetuned models" on a Llama-3B backbone — [Orpheus README](https://github.com/canopyai/Orpheus-TTS). The Spanish/Italian fine-tunes are described as "research artifacts" — [theaibench](https://theaibench-site.pages.dev/models/orpheus-tts/)

#### No Spanish, or Spanish only experimental (drop)
- **Zonos-v0.1** "supports English, Japanese, Chinese, French, and German" (eSpeak phonemization) — [Zonos README](https://github.com/Zyphra/Zonos)
- **Spark-TTS**: "Supports both Chinese and English" — [Spark-TTS README](https://github.com/SparkAudio/Spark-TTS)
- **Kyutai DSM TTS**: the checkpoint is `tts-1.6b-en_fr` (English/French). Kyutai's Spanish path is Pocket TTS — [HF card (via search)](https://huggingface.co/kyutai/tts-1.6b-en_fr)
- **VibeVoice-Realtime-0.5B** added "experimental speakers… multilingual voices in nine languages (… ES)" on 2025-12-16, but "The model is currently intended for English speech only; other languages may produce unpredictable results" — [VibeVoice README](https://github.com/microsoft/VibeVoice); [VibeVoice-Realtime doc](https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-realtime-0.5b.md)
- **Chatterbox-Turbo** (350M) and **Chatterbox-Nano** (110M) are English only — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
- **Higgs Audio v3** (4B) claims "100+ languages" but is non-commercial (see Q2). Spanish support for Higgs Audio v2 is not documented in the sources reached — [higgs-audio README](https://github.com/boson-ai/higgs-audio)

### Inferences
- **Likely naturalness ranking for Spanish.** This is my synthesis from 2026 benchmarks and architecture, not a measured MOS:
  1. Fish S2-Pro/Drama 3 ≈ Qwen3-TTS-1.7B ≈ VoxCPM2 ≈ Chatterbox V3 LatAm pack
  2. IndexTTS-2.5 ≈ CosyVoice 3 ≈ MOSS-TTS v1.5
  3. Pocket TTS (24-layer Spanish) ≈ Qwen3-TTS-0.6B ≈ MOSS-TTS-Nano ≈ NeuTTS-Nano-Spanish ≈ Supertonic 3
  4. Kokoro ≈ Kani ≈ MeloTTS ≈ Piper (closest to the current "obviously synthetic" sound)

  WER/CER/SIM measure intelligibility and timbre similarity, not prosodic naturalness, so the ordering within tiers is uncertain.
- **Latin American accent.**
  - Only Chatterbox ships a dedicated LatAm (es-MX/es-419) checkpoint.
  - For Qwen3-TTS, VoxCPM2, CosyVoice, IndexTTS, Pocket TTS, NeuTTS and MOSS, the accent follows the reference clip (cloning) or the text description (voice design). Qwen3-TTS reportedly defaults to LatAm.
  - Kokoro passes espeak-ng `es`, not `es-419`, so it likely produces Castilian phonemization (for example /θ/ for "c/z"). That would sound Spanish-from-Spain for a Mexican-style character and needs a listening test. espeak-ng does ship an `es-419` variant — [espeak-ng es-419 data file (mirror)](https://huggingface.co/spaces/brightening-eyes/tts/blob/8d55a79c9125ba95310a85e67249aa0d1f89bc2c/espeak-ng-data/lang/roa/es-419). A custom G2P could in principle be swapped in, but this is untested.

### Gaps
- No Spanish MOS/CMOS or blind listening test was found for any open model. No TTS-Arena-style leaderboard with a Spanish track was found. Reddit was not reachable from this sandbox, and searches returned no Reddit threads.
- Kokoro VOICES.md per-voice grades for ef_dora, em_alex and em_santa were not captured. A third-party site rates em_alex "C" — [OfflineTTS](https://offlinetts.com/voice/em-alex/).
- No Spanish-specific evaluations were found for Pocket TTS, Supertonic 3, MOSS-TTS-Nano, NeuTTS-Nano-Spanish or Kani-es.
- The language lists for Parler-TTS multilingual and OuteTTS 1.0 could not be verified, because their Hugging Face cards were blocked during most of the research.
- No 2026 TTS from Mistral ("Voxtral TTS") or other labs was confirmed in the sources reached.

## Q2. Code vs. weights licenses: can the generated audio be used in monetized videos?

### Takeaway
- **Safe for a monetized channel (permissive code and weights):** Qwen3-TTS (Apache-2.0, confirmed on the HF card), VoxCPM2 (Apache-2.0), Kokoro (Apache-2.0), MeloTTS (MIT), the MOSS-TTS family including Nano (Apache-2.0), Chatterbox including the LatAm pack (MIT, confirmed on the HF card), Bark (MIT), and Pocket TTS (MIT code, CC-BY-4.0 weights confirmed on the HF card, so attribution is needed).
- **Usable with use restrictions:** Supertonic 3 (MIT code, OpenRAIL-M weights; the repository is archived).
- **Allowed for a small creator, with conditions:** NeuTTS-Nano (commercial use allowed below USD 5M annual revenue), Fish Audio Drama 3 (below USD 500k revenue, plus "Built with Fish Audio" attribution) and IndexTTS (bilibili license; only very large companies need a separate license).
- **Non-commercial or research-only (exclude):** XTTS-v2 (CPML, and Coqui no longer exists), F5-TTS base weights (CC-BY-NC-4.0), Fish S2-Pro (Research License), Fish Speech 1.5 / OpenAudio S1-mini (CC-BY-NC-SA-4.0), Higgs Audio v3, and VibeVoice ("research and development purposes only").
- **Piper:** the code is GPL, and voice licenses are per voice. Only three Spain-Spanish voices are listed as commercially usable; the Latin American ones are not.

### Cited Findings

#### Permissive (code and weights)
- **Qwen3-TTS:** repo LICENSE is Apache 2.0 ("Copyright 2026 Alibaba Cloud"), the PyPI license is Apache-2.0, and the weights card says apache-2.0 — [Qwen3-TTS LICENSE](https://github.com/QwenLM/Qwen3-TTS/blob/main/LICENSE); [qwen-tts on PyPI](https://pypi.org/project/qwen-tts/); [HF card](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base). A roundup calls it the strongest permissive choice for cloning — [AssemblyAI roundup](https://www.assemblyai.com/blog/free-open-source-text-to-speech)
- **VoxCPM2:** "Weights and code released under the Apache-2.0 license, free for commercial use" — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- **Kokoro:** "With Apache-licensed weights, Kokoro can be deployed anywhere from production environments to personal projects"; the repo LICENSE is Apache 2.0 — [Kokoro README](https://github.com/hexgrad/kokoro). kokoro-onnx states "kokoro model: Apache 2.0" — [kokoro-onnx README](https://github.com/thewh1teagle/kokoro-onnx)
- **MeloTTS:** "under MIT License, which means it is free for both commercial and non-commercial use" (LICENSE © 2024 MyShell.ai) — [MeloTTS README](https://github.com/myshell-ai/MeloTTS)
- **MOSS-TTS family:**
  - "Models in MOSS-TTS Family are licensed under the Apache License 2.0" — [MOSS-TTS README](https://github.com/OpenMOSS/MOSS-TTS)
  - MOSS-TTSD is "released under the Apache 2.0 license" — [MOSS-TTSD README](https://github.com/OpenMOSS/MOSS-TTSD)
  - The MOSS-TTS-Nano repo LICENSE is Apache 2.0 — [MOSS-TTS-Nano LICENSE](https://github.com/OpenMOSS/MOSS-TTS-Nano/blob/main/LICENSE)
- **Chatterbox:**
  - Code is MIT and "stays public as an archive under the MIT license" — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
  - The LatAm pack weights card says license mit — [HF card](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-mx-latam)
  - Resemble's archive page also says the models "remain open and free to build on under Voice AI Research" but are no longer commercial products. A search summary noted this sits awkwardly next to the MIT FAQ on the same site — [Resemble Chatterbox page (via search)](https://www.resemble.ai/chatterbox/?id=ChatterboxTTS)
  - Every output carries an imperceptible PerTh watermark — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
- **Bark:** "now licensed under the MIT License, meaning it's now available for commercial use" — [suno-bark on PyPI](https://pypi.org/project/suno-bark/)
- **Pocket TTS:**
  - Code LICENSE is MIT text — [Pocket TTS LICENSE](https://github.com/kyutai-labs/pocket-tts/blob/main/LICENSE)
  - The weights card says license cc-by-4.0 and gated "auto" (you must accept terms on Hugging Face) — [HF card](https://huggingface.co/kyutai/pocket-tts). Mirrors agree on CC-BY-4.0 — [EryriLabs GGUF](https://huggingface.co/EryriLabs/pocket-tts-GGUF); [OpenVoiceOS phoonnx](https://huggingface.co/OpenVoiceOS/phoonnx-pocket-tts)
  - Each built-in voice has its own license, listed on the tts-voices page — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - Do not confuse it with Gradium's "Phonon" derivative, whose Spanish model is **CC BY-NC 4.0** — [gradium/phonon-40m-es](https://huggingface.co/gradium/phonon-40m-es)
- **Supertonic:**
  - "Code: MIT License; Model: OpenRAIL-M License" — [supertonic on PyPI](https://pypi.org/project/supertonic/)
  - The repository is archived: "Development and support have ended." Weights moved to the `supertone-oss-archive` Hugging Face namespace, and "This archive does not include hosted demos or Voice Builder services" — [Supertonic README](https://github.com/supertone-inc/supertonic)
  - OpenRAIL-M reportedly prohibits misuse categories such as voice impersonation without consent (secondary) — [mer.vin summary](https://mer.vin/medium/supertonic-3-99m-on-device-tts-with-onnx-31-languages-and-1200-chars-sec-medium/)
- **CosyVoice:**
  - Repo LICENSE is Apache 2.0 — [CosyVoice LICENSE](https://github.com/FunAudioLLM/CosyVoice/blob/main/LICENSE)
  - The PyPI package named `cosyvoice` is an unofficial **GPL-3.0** fork (home: lucasjinreal/CosyVoice) — [cosyvoice on PyPI](https://pypi.org/project/cosyvoice/)
- **Kani-TTS:**
  - The repo is "Apache 2" — [Kani-TTS README](https://github.com/nineninesix-ai/kani-tts)
  - Its audio codec (NVIDIA NeMo NanoCodec) is under the NVIDIA Open Model License — [Kani-TTS README](https://github.com/nineninesix-ai/kani-tts)
- **Magpie TTS Multilingual:**
  - Reported to be under the NVIDIA Open Model License — [neura.market news](https://www.neura.market/news/nvidia-magpie-multilingual-tts-open-weight-voice-model)
  - An unofficial mirror card says it is "ready for commercial use" — [mirror card](https://huggingface.co/aoiandroid/magpie_tts_multilingual_357m)
- **Orpheus:**
  - Repo LICENSE is Apache 2.0 — [Orpheus LICENSE](https://github.com/canopyai/Orpheus-TTS/blob/main/LICENSE)
  - For the weights, one aggregator says they carry the Llama 3.2 Community license — [theaibench](https://theaibench-site.pages.dev/models/orpheus-tts/); Hackster calls Orpheus "permissively licensed" — [Hackster](https://www.hackster.io/news/canopy-labs-releases-orpheus-a-permissively-licensed-llm-for-convincing-text-to-speech-afc64416767d). These conflict for the es_it research checkpoint.

#### Commercial use allowed with conditions (thresholds or attribution)
- **NeuTTS:**
  - NeuTTS-Air is Apache 2.0. The NeuTTS-Nano models (including Spanish) and NeuTTS-2E are under the "NeuTTS Open License 1.0" — [NeuTTS README](https://github.com/neuphonic/neutts)
  - That license (last updated 11 Dec 2025) says: "The rights granted under this License for Commercial Use of the Work, Derivative Works, or **Outputs** are conditioned upon You or Your Legal Entity not exceeding the Threshold". The Threshold is "annual revenue of 5 million United States dollars ($5,000,000) or more" — [NeuTTS LICENSE](https://github.com/neuphonic/neutts/blob/main/LICENSE)
  - Outputs carry a Perth watermark by default — [NeuTTS README](https://github.com/neuphonic/neutts)
- **Fish Audio Community License v1.0** (13 Oct 2026; covers the code and Drama 3) — [Fish Audio Community License](https://github.com/fishaudio/fish-speech/blob/main/LICENSE):
  - Free for research and non-commercial use.
  - Commercial use is allowed "only while Your Annual Revenue is less than USD 500,000".
  - Generating speech "for content that You create… (for example, narration, dubbing, game or app characters…)" is explicitly *not* a Hosted Service.
  - You must "prominently display 'Built with Fish Audio'".
  - You may not imitate an identifiable person without consent, remove the watermark, or use outputs to train other speech models.
  - "You own any outputs generated."
- The **S2-Pro** weights "remain under the Fish Audio Research License" — [fish-speech README](https://github.com/fishaudio/fish-speech)
- **IndexTTS (bilibili Model Use License)** — [IndexTTS LICENSE](https://github.com/index-tts/index-tts/blob/main/LICENSE):
  - Worldwide and royalty-free.
  - A separate license is needed only if you have ">100 million monthly active users" or "annual revenue… exceeded RMB 1 billion".
  - You may not use the model or its outputs "to improve any AI model" except itself or non-commercial models.
  - The text names the model "bilibili indextts2"; whether the 2.5 weights use the same text was not verified.

#### Non-commercial or research-only (exclude for monetized videos)
- **XTTS-v2:**
  - "This model is licensed under Coqui Public Model License" — [coqui XTTS docs](https://github.com/coqui-ai/TTS/blob/main/docs/source/models/xtts.md); [idiap XTTS docs](https://github.com/idiap/coqui-ai-TTS/blob/main/docs/source/models/xtts.md)
  - Coqui shut down (Dec 2023 / Jan 2024) and no commercial license can be obtained — [HF discussion "Is XTTS absolutely dead?"](https://huggingface.co/coqui/XTTS-v2/discussions/65); [coqui-ai/TTS discussion #4145](https://github.com/coqui-ai/TTS/discussions/4145) (via search summary)
  - Only the code (`coqui-tts` 0.28.0, Oct 2026) is MPL-2.0 — [coqui-tts on PyPI](https://pypi.org/project/coqui-tts/)
- **F5-TTS:** code is MIT, but "The pre-trained models are licensed under the CC-BY-NC license due to the training data Emilia" — [f5-tts on PyPI](https://pypi.org/project/f5-tts/). F5TTS_v1_Base is cc-by-nc-4.0 — [F5-TTS SHARED.md](https://github.com/SWivid/F5-TTS/blob/main/src/f5_tts/infer/SHARED.md)
- **F5-Spanish:** listed as **cc0-1.0** in F5's community-model list — [F5-TTS SHARED.md](https://github.com/SWivid/F5-TTS/blob/main/src/f5_tts/infer/SHARED.md). But the Spanish-F5 GitHub README still says "The pre-trained models are licensed under the CC-BY-NC license" — [Spanish-F5 README](https://github.com/jpgallegoar/Spanish-F5). **Conflicting.**
- **Fish Speech 1.5 / OpenAudio S1-mini** (2025): "all model weights are released under CC-BY-NC-SA-4.0" — [fish-speech 0.1.0 on PyPI](https://pypi.org/project/fish-speech/)
- **Higgs Audio v3:** "released under the Boson Higgs Audio v3 Research and Non-Commercial License. Production / hosted / revenue-generating use requires a separate commercial license" — [higgs-audio README](https://github.com/boson-ai/higgs-audio)
- **VibeVoice:** LICENSE is MIT (© 2025 Microsoft) — [VibeVoice LICENSE](https://github.com/microsoft/VibeVoice/blob/main/LICENSE). But the README says: "We do not recommend using VibeVoice in commercial or real-world applications… intended for research and development purposes only" — [VibeVoice README](https://github.com/microsoft/VibeVoice)

#### Piper (special case: GPL code, per-voice licenses)
- The `piper-tts` package (1.8.0, 2026-09-04) is **GPL-3.0-or-later** (OHF-Voice/piper1-gpl) — [piper-tts on PyPI](https://pypi.org/project/piper-tts/)
- Piper's own commercial-use guidance — [Piper COMMERCIAL_USE.md](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md):
  - "The Piper project grants no license over voice models."
  - A voice counts as commercially usable only when "every dataset in its chain permits commercial use".
  - Voices descended from the lessac or ryan base voices are excluded.
  - Voices "retrained in late 2026" qualify only in their new version: "A copy downloaded before the retrain is the old version and does not qualify."
- **Spanish verdicts** in the same document — [Piper COMMERCIAL_USE.md](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md):
  - *Listed as commercially usable:* es_ES-davefx-medium (fine-tuned from rdh), es_ES-sharvard-medium (from hifi_tts_92), es_ES-carlfm-x_low (trained from scratch).
  - *Excluded:* es_MX-ald-medium ("rights uncertain"; labeled Unlicense, but the document questions whether the uploader holds the speaker's rights).
  - *Not listed:* es_AR-daniela-high and es_MX-claude-high are "base undocumented… ask the trainer".
  - There are no es_419 voices.
- Piper "takes no position" on whether a trained model is a derivative work of its recordings — [Piper COMMERCIAL_USE.md](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md)
- A third-party mirror claims es_MX-claude-high is Apache-2.0 and es_MX-ald-medium is Unlicense — [PYTHAI/voaice](https://huggingface.co/PYTHAI/voaice). This is secondary; Piper's own guidance takes precedence.

### Inferences
- The code license (GPL for Piper, MPL for coqui-tts) does not restrict generated audio. The binding constraint is the **weights license** and, for Piper, the dataset chain behind each voice.
- For a creator under USD 500k revenue, the commercially usable Spanish options are:
  - Qwen3-TTS, VoxCPM2, Kokoro, MeloTTS, MOSS-TTS/MOSS-TTS-Nano, Chatterbox (including the LatAm pack), Pocket TTS (credit Kyutai, check the chosen voice's license, accept the gated terms), Supertonic 3 (respect OpenRAIL-M restrictions), NeuTTS-Nano-Spanish, IndexTTS-2.5 and Bark.
  - Fish Drama 3 is legally usable with attribution but impractical on CPU.
  - Piper es_ES voices qualify only in their late-2026 retrains, and they have a Spain accent.
- For "Nico" and "Kori", the safest path is invented voices: Qwen3-TTS VoiceDesign, VoxCPM2 Voice Design, preset voices, or the creator's own or consenting recordings. Cloning a real person without consent is prohibited by the Fish license and OpenRAIL-M, and is ethically risky everywhere.
- Watermarked outputs (Chatterbox, NeuTTS; Fish forbids removing its watermark) are inaudible, but they make the audio detectable as AI by provenance tools. That is relevant to a "doesn't sound/look like AI" goal and to platform AI-labeling.

### Gaps
- huggingface.co was blocked for most of this research and became reachable only at the end. Only three weight cards were confirmed directly: Qwen3-TTS (apache-2.0), the Chatterbox LatAm pack (mit) and Pocket TTS (cc-by-4.0).
- The following remain unconfirmed on their HF cards: Supertonic 3 (OpenRAIL-M full text), Fun-CosyVoice3-0.5B, Kani-TTS-400m-es, Magpie (NVIDIA Open Model License terms), Orpheus es_it, NeuTTS-Nano-Spanish, F5-Spanish, IndexTTS-2.5, MeloTTS-Spanish, VoxCPM2 (the README says Apache-2.0), MOSS-TTS-Nano weights, Higgs Audio v2, Parler multilingual and OuteTTS 1.0.
- The Fish Audio Research License text (for S2-Pro) was not read.
- YouTube, Instagram and TikTok AI-disclosure and monetization rules for synthetic voices were not researched.

## Q3. Fixed built-in voices vs. zero-shot cloning vs. voice design and embedding blending

### Takeaway
- **Fixed preset voices with no reference needed:** Kokoro (ef_dora, em_alex, em_santa), Piper and MeloTTS (one voice per model), Supertonic 3 (10 language-agnostic voices), Qwen3-TTS CustomVoice (9 timbres, none native Spanish), Pocket TTS (a catalog including the Spanish "lola"), MOSS-TTS-Nano, Bark and Magpie.
- **Reference clip required (zero-shot cloning):** Chatterbox (including the LatAm pack), Qwen3-TTS Base, VoxCPM2, CosyVoice 3, IndexTTS-2.5, NeuTTS, Fish and OuteTTS.
- **Invented voice from a text description:** Qwen3-TTS-1.7B-VoiceDesign and VoxCPM2 Voice Design.
- **Documented embedding blending:** only Kokoro (it averages comma-separated voicepacks).

### Cited Findings

#### Fixed preset voices
- **Kokoro:**
  - Spanish voicepacks ef_dora (F), em_alex (M), em_santa (M) — "1F 2M" — [Kokoro VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)
  - Third-party descriptors: dora "clear", alex "natural", santa "warm" — [ttsforge voices](https://ttsforge.readthedocs.io/en/latest/voices.html)
  - VOICES.md also says voices perform best in a "goldilocks range" of 100–200 tokens, with "Weakness on short utterances, especially less than 10-20 tokens" — [Kokoro VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)
- **MeloTTS:** a single Spanish speaker, `speaker_ids['ES']` — [MeloTTS install docs](https://github.com/myshell-ai/MeloTTS/blob/main/docs/install.md). An AI Indigo tutorial claims Mexican/Argentinian speakers such as "es_MX-Dalia"; the official docs do not support this, so treat it as unreliable — [AI Indigo tutorial](https://aiindigo.com/tutorials/getting-started-with-melotts-spanish-generate-natural-spanish-voiceovers)
- **Supertonic 3:**
  - "10 built-in voices: M1–M5, F1–F5". Custom voices came only as JSON exports from the hosted Voice Builder — [supertonic on PyPI](https://pypi.org/project/supertonic/)
  - The archive "does not include hosted demos or Voice Builder services" — [Supertonic README](https://github.com/supertone-inc/supertonic)
- **Qwen3-TTS CustomVoice** has 9 speakers: Vivian, Serena, Uncle_Fu, Dylan, Eric (Chinese natives); Ryan ("Dynamic male voice with strong rhythmic drive"), Aiden ("Sunny American male voice") (English); Ono_Anna (Japanese); Sohee (Korean). The README says: "We recommend using each speaker's native language for the best quality… each speaker can speak any language supported by the model" — [Qwen3-TTS README](https://github.com/QwenLM/Qwen3-TTS)
- **Pocket TTS:**
  - A "small catalog of voices" of precomputed embeddings, including "lola (es)" — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - The pre-made voices are "embeddings precomputed with our released weights" — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
- **MOSS-TTS-Nano:** "supports direct reference audio input, built-in voices, and Realtime Streaming Decode" — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
- **NeuTTS:**
  - Cloning models with pre-encoded sample references, including Spanish "mateo" — [NeuTTS README](https://github.com/neuphonic/neutts)
  - NeuTTS-2E has 4 fixed English speakers and 6 emotions plus neutral — [NeuTTS README](https://github.com/neuphonic/neutts)
- **Bark:** "100+ speaker presets" including Spanish, and it can generate random voices, but "Bark does not currently support custom voice cloning" — [suno-bark on PyPI](https://pypi.org/project/suno-bark/)
- **VibeVoice-Realtime:** "voice prompts are provided in an embedded format. For users requiring voice customization, please reach out to our team" — [VibeVoice-Realtime doc](https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-realtime-0.5b.md)
- **Magpie:** five speakers, each able to speak nine languages including Spanish (unofficial mirror card) — [mirror card](https://huggingface.co/aoiandroid/magpie_tts_multilingual_357m)

#### Zero-shot cloning (reference clip)
- **Chatterbox:**
  - Requires a reference: `audio_prompt_path="your_10s_ref_clip.wav"` — [chatterbox-tts on PyPI](https://pypi.org/project/chatterbox-tts/)
  - "Ensure that the reference clip matches the specified language tag. Otherwise, language transfer outputs may inherit the accent of the reference clip's language. To mitigate this, set `cfg_weight` to `0`" — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
  - Expressiveness controls: `exaggeration` (for example 0.7) and `cfg_weight` (for example 0.3) for "Expressive or Dramatic Speech" — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
- **Qwen3-TTS Base:** takes `ref_audio` plus `ref_text`. With `x_vector_only_mode=True`, "only the speaker embedding is used so ref_text is not required, but cloning quality may be reduced" — [Qwen3-TTS README](https://github.com/QwenLM/Qwen3-TTS)
- **VoxCPM2:** "Controllable Cloning" with style guidance such as `"(slightly faster, cheerful tone)…"`, and "Ultimate Cloning" with reference audio plus transcript — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- **IndexTTS:** "clones a voice from a single reference audio clip", with emotion control — [IndexTTS README](https://github.com/index-tts/index-tts)
- **NeuTTS:** "create your own speaker with as little as 3 seconds of audio" — [NeuTTS README](https://github.com/neuphonic/neutts)
- **Pocket TTS:** `--voice` accepts a wav for cloning, and `export-voice` saves a fast-loading safetensors embedding — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
- **OuteTTS:** "designed to be used with a speaker reference. Without one, it generates random vocal characteristics, often leading to lower-quality outputs… inherits the referenced speaker's emotion, style, and accent" — [OuteTTS README](https://github.com/edwko/OuteTTS)

#### Voice design (invent a voice with no recording)
- **Qwen3-TTS-12Hz-1.7B-VoiceDesign:** `generate_voice_design` takes a natural-language `instruct` — [Qwen3-TTS README](https://github.com/QwenLM/Qwen3-TTS)
- **VoxCPM2:** "Create a brand-new voice from a natural-language description alone (gender, age, tone, emotion, pace …), no reference audio required" (CLI `voxcpm design`) — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- **MOSS-VoiceGenerator:** "can generate diverse voices and speaking styles directly from text prompts". Language coverage was not verified — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
- **CosyVoice 3:** instructions for "languages, dialects, emotions, speed, volume" (style, not new identities) — [CosyVoice README](https://github.com/FunAudioLLM/CosyVoice)

#### Blending speaker embeddings
- **Kokoro** `load_voice` splits the voice string on a delimiter (default comma) and computes `torch.mean(torch.stack(packs), dim=0)`, so for example `"em_alex,em_santa"` produces an averaged, invented voice. It also accepts a raw FloatTensor, which allows custom weighted mixes — [Kokoro pipeline.py](https://github.com/hexgrad/kokoro/blob/main/kokoro/pipeline.py)
- **Pocket TTS** voice embeddings are safetensors files, and **Supertonic** voice styles are JSON files. Neither documents a blending API — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts); [supertonic on PyPI](https://pypi.org/project/supertonic/)

### Inferences
- **Voice consistency across episodes.** Preset models give the same timbre every run. Cloning and design models drift between generations. The practical workflow is to design or record once, keep the best 5–15 s take as the canonical reference (or exported embedding), and always clone from it with fixed settings and seed.
  - **Nico (≈19-year-old Latin American man).** Candidate pipelines:
    - (a) Qwen3-TTS VoiceDesign (1.7B) with a Spanish description, then clone that take with Qwen3-TTS 0.6B Base. Apache-2.0 end to end; feasible on CPU, slowly.
    - (b) Clone the same designed reference with the Chatterbox LatAm pack (MIT, dialect-tuned).
    - (c) Pocket TTS Spanish cloning from that reference (fast on CPU; CC-BY attribution).
    - (d) Kokoro em_alex/em_santa or a blend of them (fixed and fast, but probably Castilian G2P and less natural).
  - **Kori (cute small robot).** Any natural, bright, youthful designed voice (Qwen3/VoxCPM2 design), a Supertonic F-voice, or a Kokoro blend such as ef_dora with another voice, followed by robotic post-processing. Post-FX also masks residual TTS artifacts, so a mid-tier CPU model may be enough for Kori.
- Kokoro's averaging is the only zero-risk, documented way to "mix" an invented fixed voice. With only one Spanish female and two Spanish male packs, the space of Spanish blends is small, and cross-language packs would bring foreign accents (inferred, not tested).

### Gaps
- Run-to-run determinism of each model (Kokoro, Supertonic, Pocket TTS presets) was not verified.
- Pocket TTS lists only one Spanish preset ("lola"); whether a Spanish male preset exists was not found. The per-voice licenses on kyutai/tts-voices were not read.
- Whether the Chatterbox LatAm pack ships default reference voices was not verified.
- MOSS-TTS-Nano's built-in voice list was not checked for a Spanish male voice.

## Q4. CPU-only feasibility (4 cores, 15 GB RAM, no GPU), model size and install path

### Takeaway
- **Comfortably faster than real time on CPU:** Supertonic 3 (99M, ONNX), Kokoro (82M), Pocket TTS (~100M; about 2.3–2.5x faster than real time on a 4-vCPU x86 VM), MOSS-TTS-Nano (0.1B, streams on 4 cores), NeuTTS-Nano (GGUF), MeloTTS and Piper.
- **Slower than real time but usable for offline batch rendering of short lines:** Qwen3-TTS 0.6B (about 0.3x real time int8 on a 4-vCPU box; a C++ port reports RTF about 1.94 on 4 threads with about 3 GB RAM).
- **No published CPU numbers; GPU-oriented:** Chatterbox Multilingual (0.5B), CosyVoice 3 (0.5B), IndexTTS-2.5 and VoxCPM2 (2B, about 8 GB VRAM).
- **Impractical on this machine:** Fish Drama 3 (35B MoE), MOSS-TTS 8B, Orpheus 3B and Higgs.

### Cited Findings
**RTF conventions differ between sources.** Supertonic uses "RTF = compute time / audio duration" (lower is better); Pocket TTS and ocdevel quote speed multiples (higher is faster).

- **Supertonic 3:**
  - 99M parameters, ONNX runtime — [supertonic on PyPI](https://pypi.org/project/supertonic/)
  - RTF on an Apple M4 Pro **CPU** with 2 inference steps: 0.015 / 0.013 / 0.012 (59 / 152 / 266-character texts); with 5 steps, 0.023 / 0.019 / 0.018 — [supertonic on PyPI](https://pypi.org/project/supertonic/)
  - Install: `pip install supertonic` (1.3.1, 2026-05-18, includes `supertonic serve` with an OpenAI-compatible endpoint). Weights: `supertone-oss-archive/supertonic-3` on Hugging Face — [supertonic on PyPI](https://pypi.org/project/supertonic/); [Supertonic README](https://github.com/supertone-inc/supertonic)
  - An npm package `supertonic` 0.0.1 (2025-12-11, MIT) exists — [npm supertonic](https://www.npmjs.com/package/supertonic)
- **Kokoro:**
  - In the same M4 Pro CPU benchmark (ONNX), Kokoro RTF is 0.144 / 0.124 / 0.126 and throughput 104–117 characters/s. NeuTTS Air (Q8 GGUF) has RTF 0.390 / 0.338 / 0.343 — [supertonic on PyPI](https://pypi.org/project/supertonic/)
  - Install: `pip install kokoro` (0.9.4, Python >=3.10,<3.13) plus the `espeak-ng` system package, "used for English OOD fallback and some non-English languages" — [kokoro on PyPI](https://pypi.org/project/kokoro/); [Kokoro README](https://github.com/hexgrad/kokoro)
  - ONNX alternative: `kokoro-onnx` 0.6.1 (2026-08-19, Python 3.10–3.13), using `kokoro-v1.0.onnx` and `voices-v1.0.bin` from GitHub releases; marked "CPU supported" — [kokoro-onnx README](https://github.com/thewh1teagle/kokoro-onnx); [kokoro-onnx on PyPI](https://pypi.org/project/kokoro-onnx/)
  - Node: `kokoro-js` 1.2.1 (2025-05-03, Apache-2.0) — [npm kokoro-js](https://www.npmjs.com/package/kokoro-js)
- **Pocket TTS:**
  - About 100M parameters; "~6x real-time on a CPU of MacBook Air M4"; "Uses only 2 CPU cores" — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - On a "cloud x86 VM (4 vCPUs)", RTF is about 2.3–2.5x on CPU (that is, faster than real time) — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - The Spanish 24-layer variant is "higher quality but slower" — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - Install: `pip install pocket-tts --extra-index-url https://download.pytorch.org/whl/cpu`. This avoids about 3 GB of CUDA wheels (versus about 200 MB) — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - Standalone binaries need no Python: x86 requires AVX2, with `-v2` builds for SSE4.2 — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts)
  - PyPI version: `pocket-tts` 4.0.1 (2026-10-21) — [pocket-tts on PyPI](https://pypi.org/project/pocket-tts/)
  - An npm package `pocket-tts` 1.0.0 (2026-10-11, MIT) describes cloud mode and a local ONNX mode; its publisher was not verified — [npm pocket-tts](https://www.npmjs.com/package/pocket-tts)
  - sherpa-onnx also runs Pocket TTS, with bindings for 12 programming languages — [Pocket TTS README](https://github.com/kyutai-labs/pocket-tts); `sherpa-onnx` / `sherpa-onnx-node` 2.0.2 (2026-11-19, Apache-2.0) — [npm sherpa-onnx](https://www.npmjs.com/package/sherpa-onnx)
- **MOSS-TTS-Nano:**
  - "only 0.1B parameters… can run directly on CPU without a GPU"; "streaming generation can run on a 4-core CPU" — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
  - The ONNX CPU path has "No PyTorch dependency during inference" — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
  - "on a MacBook Air M4, we observed smooth inference with only 1 CPU core" — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
  - Install from GitHub; weights at `OpenMOSS-Team/MOSS-TTS-Nano` — [MOSS-TTS-Nano README](https://github.com/OpenMOSS/MOSS-TTS-Nano)
- **NeuTTS-Nano:**
  - About 120M active parameters (about 229M including embeddings), versus about 360M (552M) for Air — [NeuTTS README](https://github.com/neuphonic/neutts)
  - Q4 GGUF CPU throughput, NeuTTS-Nano: 221 tokens/s on an AMD Ryzen 9 HX 370 (CPU only; 16 decode threads), 195 tokens/s on an iMac M4, 45 tokens/s on a Galaxy A25. Measured with 500 prefill and 250 output tokens — [NeuTTS README](https://github.com/neuphonic/neutts)
  - Codec: "50hz neural audio codec" — [NeuTTS README](https://github.com/neuphonic/neutts)
  - Install: `pip install neutts` (1.4.1, 2026-07-22), with `llama-cpp-python` (OpenBLAS on Linux) for GGUF — [neutts on PyPI](https://pypi.org/project/neutts/)
- **Piper:** "A fast and local neural text-to-speech engine that embeds espeak-ng" — [piper1-gpl README](https://github.com/OHF-Voice/piper1-gpl). Install: `pip install piper-tts` (1.8.0) — [piper-tts on PyPI](https://pypi.org/project/piper-tts/). Browser/Node options: `@mintplex-labs/piper-tts-web` 1.0.5 (2026-08-11, MIT) — [npm](https://www.npmjs.com/package/@mintplex-labs/piper-tts-web); `piper-tts-web` 1.1.2 (2025-07-08, MIT) — [npm](https://www.npmjs.com/package/piper-tts-web)
- **MeloTTS:** "Fast enough for CPU real-time inference" — [MeloTTS README](https://github.com/myshell-ai/MeloTTS). Installed from GitHub per the docs — [MeloTTS install docs](https://github.com/myshell-ai/MeloTTS/blob/main/docs/install.md)
- **Qwen3-TTS (0.6B / 1.7B):**
  - 0.6B int8 on a shared 4-vCPU box runs at about 0.33x real time (RTF 3.07); int4 is about 0.31x (RTF 3.26), so it is not faster — [ocdevel quantized CPU TTS](https://ocdevel.com/blog/20260711-quantized-cpu-tts) (via search summary)
  - qwen3-tts.cpp reports RTF 1.94x on a Ryzen 5 3600 with 4 threads and about 3 GB RAM — [ocdevel](https://ocdevel.com/blog/20260711-quantized-cpu-tts) (via search summary)
  - The official FAQ says to "Use 0.6B model for reasonable performance" on CPU and to "Expect 10-50x slower than GPU" — [Qwen3-TTS FAQ](https://www.mintlify.com/QwenLM/Qwen3-TTS/resources/faq) (via search summary)
  - Install: `pip install qwen-tts` (0.1.1, 2026-02-06, Python >=3.9); weights on Hugging Face or ModelScope — [qwen-tts on PyPI](https://pypi.org/project/qwen-tts/)
- **Chatterbox Multilingual V3:**
  - 500M parameters, loaded with `ChatterboxMultilingualTTS.from_pretrained(device=…, t3_model="v3")` — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
  - No official CPU figures. Only the English-only Nano (110M) is advertised as "3x faster than realtime on 8 CPU cores" — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
  - Install: `pip install chatterbox-tts` (0.1.7, 2026-03-26, Python >=3.10) — [chatterbox-tts on PyPI](https://pypi.org/project/chatterbox-tts/)
- **VoxCPM2:**
  - 2B backbone, about 8 GB VRAM, RTF about 0.30 on an RTX 4090 — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
  - Community CPU ports exist (VoxCPM.cpp for GGML/GGUF, and VoxCPM-ONNX), but no CPU RTF is published — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
  - Install: `pip install voxcpm` (2.0.3, 2026-05-11) — [voxcpm on PyPI](https://pypi.org/project/voxcpm/)
- **CosyVoice 3:** 0.5B, installed from GitHub with `snapshot_download('FunAudioLLM/Fun-CosyVoice3-0.5B-2512')`. No CPU numbers — [CosyVoice README](https://github.com/FunAudioLLM/CosyVoice)
- **IndexTTS-2.5:** production deployment via vLLM — [IndexTTS README](https://github.com/index-tts/index-tts). IndexTTS2 is 1.5B — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- **Kani-TTS:** 370M–400M models; requires a "CUDA-capable GPU (recommended) or CPU"; `pip install kani-tts` (1.0.1, 2026-01-21) — [kani-tts on PyPI](https://pypi.org/project/kani-tts/)
- **Magpie TTS Multilingual:** 357M, run via NeMo (`nemo-toolkit` 3.0.0, Aug 2026, Apache-2.0; "PyTorch 2.7 or above (CPU, CUDA, etc.)") — [nemo-toolkit on PyPI](https://pypi.org/project/nemo-toolkit/)
- **Heavy models (impractical here):**
  - Fish Drama 3 is "35B-A3B" and S2-Pro is 4B — [fish-speech README](https://github.com/fishaudio/fish-speech)
  - MOSS-TTS (8B Delay checkpoint; "Now 8B model fits onto 8GB GPUs" via llama.cpp) — [MOSS-TTS README](https://github.com/OpenMOSS/MOSS-TTS)
  - Orpheus is built "on the Llama-3b backbone" — [Orpheus README](https://github.com/canopyai/Orpheus-TTS)
  - Higgs v3 is 4B — [higgs-audio README](https://github.com/boson-ai/higgs-audio)
  - VibeVoice recommends an NVIDIA Docker container — [VibeVoice-Realtime doc](https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-realtime-0.5b.md)
- **Bark:** "On older GPUs, default colab, or CPU, inference time might be significantly slower"; a smaller model option exists — [suno-bark on PyPI](https://pypi.org/project/suno-bark/)

### Inferences
- **Speed is not a hard constraint here.** For short-form videos rendered offline, a 20–30 s line at RTF about 3 (Qwen3-TTS 0.6B int8 on 4 vCPU) takes about 1–1.5 minutes, which is acceptable for a daily workflow. The 1.7B VoiceDesign model would be slower on CPU, but it is only needed once to create each character's reference.
- **Memory.** By parameter count, 0.6B–2B models fit in 15 GB RAM at fp32 or bf16 (2B × 4 bytes ≈ 8 GB). Drama 3 (35B MoE) and MOSS-TTS 8B do not fit in a practical way.
- **Expect slower results than published.** The Supertonic and Kokoro figures were measured on an Apple M4 Pro, which is much stronger than a generic 4-core x86. Pocket TTS's own 4-vCPU x86 figure (2.3–2.5x faster than real time) is the most representative published number for this machine.

### Gaps
- No measured CPU RTF on a 4-core x86 machine for Spanish specifically, for any model.
- No CPU numbers for Chatterbox Multilingual or its LatAm pack, CosyVoice 3, IndexTTS-2.5, VoxCPM2 (CPU ports), Kani or Magpie.
- Whether `kokoro-js` supports Spanish was not verified.

## Q5. Benchmark and community evidence of Spanish naturalness, and known problems

### Takeaway
Published Spanish evidence is almost entirely objective (ASR WER/CER and speaker similarity), and much of it is self-reported by vendors:
- Fish S2 has the lowest Spanish WER.
- Qwen3-TTS matches ElevenLabs/MiniMax-level intelligibility with much higher similarity.
- VoxCPM2 has the highest Spanish similarity.
- Chatterbox's LatAm pack cuts Spanish CER from 2.89 to 0.46 (vendor figures).

No independent Spanish MOS or blind test exists in the sources found. The known problems are:
- accent leakage from reference clips (Chatterbox, OuteTTS, cross-lingual Qwen3);
- hallucination and repetition in older multilingual models;
- weak G2P and short-utterance weakness in Kokoro;
- "dull and robotic" MeloTTS Spanish;
- unpredictable output from VibeVoice outside English;
- English-centric behaviour in Kani.

### Cited Findings
- **Spanish WER and similarity figures:** see Q1 for the Qwen3-TTS (versus MiniMax and ElevenLabs), MiniMax-test (VoxCPM2, Fish S2, Qwen3) and CV3-eval tables — [Qwen3-TTS README](https://github.com/QwenLM/Qwen3-TTS); [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
- **Chatterbox:**
  - LatAm pack CER 0.46, Spain pack 0.62, base Spanish 2.89% (vendor) — [Resemble V3 post (via search summary)](https://www.resemble.ai/resources/chatterbox-multilingual-v3-tts-with-embedded-watermarking-for-25-languages)
  - V3 is "optimized to reduce unwanted continuation, repetition, and off-prompt speech, especially in cases where earlier multilingual models were less stable" — [Chatterbox README](https://github.com/resemble-ai/chatterbox)
  - A review notes "accent bleed" across languages — [Oakgen review (via search summary)](https://oakgen.ai/blog/chatterbox-tts-open-source-review)
- **Qwen3-TTS vs Chatterbox (blog cloning test):** average speaker similarity 0.913 versus 0.891, "a near tie". Qwen3-TTS "drifts toward English" on cross-lingual accent — [VoiceCreator comparison (via search summary)](https://voicecreator.pro/blog/qwen3-vs-omnivoice-vs-chatterbox-voice-cloning)
- **Robustness on hard sentences (Seed-TTS test-Hard, Chinese) — not Spanish, but indicative:**
  - Higgs Audio v2 CER 55.07 and OpenAudio-s1-mini 23.37, versus Qwen3-TTS 6.76, CosyVoice3 5.83–6.08 and VoxCPM2 8.13 — [VoxCPM README](https://github.com/OpenBMB/VoxCPM)
  - Fun-CosyVoice3-0.5B-2512 (RL) on the hard set: 5.44 — [CosyVoice README](https://github.com/FunAudioLLM/CosyVoice)
- **Kokoro:**
  - "Support for non-English languages may be absent or thin due to weak G2P and/or lack of training data"; "Weakness on short utterances, especially less than 10-20 tokens" — [Kokoro VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)
  - Third-party grade "C" for em_alex — [OfflineTTS](https://offlinetts.com/voice/em-alex/)
  - Spanish runs through espeak `es` — [Kokoro pipeline.py](https://github.com/hexgrad/kokoro/blob/main/kokoro/pipeline.py)
- **MeloTTS Spanish:** a Hugging Face discussion asks whether emotion is supported because "it sounds dull and robotic" — [MeloTTS-Spanish discussions](https://huggingface.co/myshell-ai/MeloTTS-Spanish/discussions). An aggregator rates it 4/5 (vendor-adjacent, low weight) — [tts.ai MeloTTS Spanish](https://tts.ai/voices/melotts-spanish/?lang=as)
- **VibeVoice:** non-English languages "have not been extensively tested; use with caution" — [VibeVoice-Realtime doc](https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-realtime-0.5b.md)
- **OuteTTS:** accent and style follow the reference ("if you use a Japanese speaker and continue speech in English, the model may tend to use a Japanese accent"); recommended temperature 0.4 — [OuteTTS README](https://github.com/edwko/OuteTTS)
- **Kani-TTS:** "Primarily optimized for English", "Performance degrades with inputs >1000 tokens", "Limited emotional expressivity without fine-tuning" — [Kani-TTS README](https://github.com/nineninesix-ai/kani-tts)
- **Industry roundups (2026):**
  - Qwen3-TTS is the most cited option for Spanish — [AssemblyAI roundup](https://www.assemblyai.com/blog/free-open-source-text-to-speech)
  - Magpie lists Spanish and allows commercial use — [micdrop roundup](https://micdrop.dev/blog/top-open-source-text-to-speech-models)
  - XTTS-v2's CPML limits commercial use — [Hyperstack](https://www.hyperstack.cloud/blog/case-study/popular-open-source-text-to-speech-models); [Eden AI](https://www.edenai.co/post/top-free-text-to-speech-tools-apis-and-open-source-models)

### Inferences
- The strongest evidence-backed choices for "doesn't sound like AI" Spanish with commercial rights are:
  - **Qwen3-TTS** (Apache-2.0; LatAm default reported; near-ElevenLabs Spanish metrics; CPU-feasible at 0.6B for batch rendering);
  - **Chatterbox V3 LatAm pack** (MIT; dialect-specific; but retired and watermarked);
  - **VoxCPM2** (Apache-2.0; best Spanish similarity; heavy on CPU).
- **Pocket TTS** (CC-BY-4.0) is the best-documented CPU-fast option with Spanish and cloning.
- Kokoro, Piper and MeloTTS are likely to remain "clean but recognizably synthetic" in Spanish, which matches the user's complaint about current voices. They are best kept as fallbacks, or for Kori, where robotic FX will be applied anyway.
- Robustness matters for short dialogue lines: Kokoro is weak on utterances under 10–20 tokens, and LLM-based models can hallucinate on very short or odd prompts. In practice, render whole dialogue turns rather than single words, and review takes before publishing.

### Gaps
- No independent Spanish MOS, CMOS or preference tests; no TTS Arena Spanish leaderboard; no Reddit or GitHub threads with Spanish A/B comparisons were retrieved, because reddit.com was unreachable from the sandbox and search returned none.
- The Latin American accent quality of Qwen3-TTS, VoxCPM2, Pocket TTS and MOSS-TTS-Nano is not documented beyond secondary blog claims.
- A third-party Hugging Face mirror reports that Supertone Inc. resolved to dissolve on 2026-07-15. This is unverified; only the archived status is confirmed by the official README — [Supertonic README](https://github.com/supertone-inc/supertonic).
- Practical next step for the report writer: the source set itself suggests the decision should rest on a short listening test of 3–4 shortlisted models on the actual Nico/Kori scripts.

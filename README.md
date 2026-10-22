# Model Atlas · 模型结构图谱

看图理解模型，沿源码深入。

A source-grounded, visual guide to model architecture. Chinese explanations retain exact English model and operator names.

## Local development

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the printed URL with the `/model-atlas/` base path.

```sh
npm test
npm run build
node scripts/check-links.mjs
npm run preview
```

## Content

- Llama 2 7B (vLLM v0.8.0): 32Q / 32KV MHA, pre-norm residual blocks and dense SwiGLU.
- MHA, GQA and MQA concepts: shared head-pairing diagram, formulas, cache-size reasoning and model links.

- Qwen2 (vLLM v0.8.0): source-specific decoder, QKV/RoPE, fused residual RMSNorm, and dense SwiGLU.
- Drama 3, YuE2, MiniMax Music3, Qwen3-TTS and Qwen-Image-2.1: component paths, layer maps and operator details.
- MiniMax-H3: joint audio/video diffusion, packed multimodal tokens and DiT details.
- Qwen3-Omni: Thinker, Talker, code predictor and Code2Wav.
- Decoder-only Transformer: an explicitly illustrative pre-norm / RoPE / SwiGLU baseline.
- Shared concepts, exercises, source links and architecture-first model pages.

Content and metadata live in `src/data/catalog.mjs`; architecture figures in `public/figures/`. The catalog, search, sidebar, theme toggle and tooltip reuse React components from vLLM Recipes, rendered as Astro islands. See `src/vendor/recipes/UPSTREAM.md` for the pinned revision and adaptations. Fonts are bundled locally.

## GitHub Pages

Site: https://fayespica.github.io/model-atlas/

The workflow builds pull requests and deploys `main` with GitHub Actions. Repository Settings → Pages must use **GitHub Actions** as its build source. `astro.config.mjs` sets both the owner site and project base path; update these when forking. The site has no backend or external runtime API dependency.

## Provenance

Model pages distinguish checkpoint defaults, implementation behavior and teaching schematics. Implementation URLs pin the inspected commit; the site does not claim untested performance. The H3 figure was authored for this project, with a restrained SVG visual style inspired by vLLM blog figures. UI source and licenses are retained under `src/vendor/recipes/`. Provider logos retain their owners’ marks. No vLLM affiliation is claimed. See CONTRIBUTING.md before adding content.

Qwen2 operator diagram regeneration: run `python3 scripts/figures/qwen2_layers.py`. SVG, draw.io and JSON are published together.

Multimodal diagrams: run `python3 scripts/figures/omni_layers.py`. The source is `scripts/figures/omni_models.json`; outputs include matching SVG, draw.io and layout JSON. Model explanations are in `src/data/omni-models.mjs`, with inspected checkpoint configs in `src/data/checkpoints/`. Parameter labels state the counted component; stored weight bytes are not runtime memory.

Figures publish automatic (`.svg`), light (`.light.svg`) and dark (`.dark.svg`) palettes. Model pages inline a single SVG and recolor it through the Recipes theme toggle, without swapping image resources. A head script restores the saved theme before first paint; standalone automatic SVGs follow `prefers-color-scheme`. Geometry is shared across all palettes; draw.io keeps editable light-palette colors.

Head-sharing concept figure: `python3 scripts/figures/attention_heads.py`. Llama 2 7B figure: `python3 scripts/figures/omni_layers.py llama2-7b`. Source provenance and parameter-count derivation are recorded in `src/data/checkpoints/llama2-7b-evidence.json`.

FastH3 Omni BF16: `python3 scripts/figures/omni_layers.py fasth3-omni`. VSA mechanism: `python3 scripts/figures/vsa.py`. Pinned checkpoint configuration and inference contract: `src/data/checkpoints/fasth3-omni-evidence.json`.

Mamba-1 concept diagram: `python3 scripts/figures/mamba.py`; pinned mixer source and paper links are in `src/data/mamba.mjs`.

AI Infra Lab: `/map/` is an original Three.js room with six stations, concept inspection and three suggested learning paths. Knowledge assignments and paths are in `src/data/infra-map.mjs`; scene geometry is in `src/components/infra/scene.js`. The navigation remains available without WebGL, and `/concepts/` remains the text index.

Provider logos: Fish Audio and Meta assets follow the vLLM Recipes provider mapping (49f6a34e6add11d62d4c3379ad8a308b12de0169), fetched from its deployed `/providers/` assets. FastVideo, MAP and Recursive use their official Hugging Face organization avatars. These are stored locally in `public/providers/` and shared by sidebar, provider and model views.

Model Explorer: `/model/?m=qwen2` provides a source-grounded Three.js tensor viewer for Qwen2, Qwen2.5-VL, Qwen3-TTS, Qwen3-Omni and MiniMax-H3. Component overviews, repeated layer selection, operator/weight shapes, residual paths and MoE expert drill-down are driven by `src/data/model-explorer.mjs`. Codec and specialized encoder components explicitly retain their boundary when no operator expansion is supplied. Cell grids are schematic; no checkpoint weights are loaded and the guided traversal is not numerical inference. Bycroft attribution and MIT notice are retained under `src/vendor/bycroft/`.

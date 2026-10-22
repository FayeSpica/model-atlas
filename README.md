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

- MiniMax-H3: joint audio/video diffusion, packed multimodal tokens and DiT details.
- Qwen3-Omni: Thinker, Talker, code predictor and Code2Wav.
- Decoder-only Transformer: an explicitly illustrative pre-norm / RoPE / SwiGLU baseline.
- Shared concepts, exercises, source links and click/keyboard-controlled data-flow player.

Content and metadata live in `src/data/catalog.mjs`; reusable diagrams in `src/components/Flow.astro`; detailed exportable figures in `public/figures/`. The first version uses validated JavaScript content objects and Astro templates; MDX can be added when articles need richer authored layouts.

## GitHub Pages

Site: https://fayespica.github.io/model-atlas/

The workflow builds pull requests and deploys `main` with GitHub Actions. Repository Settings → Pages must use **GitHub Actions** as its build source. `astro.config.mjs` sets both the owner site and project base path; update these when forking. The site has no backend or external runtime API dependency.

## Provenance

Model pages distinguish checkpoint defaults, implementation behavior and teaching schematics. Implementation URLs pin the inspected commit; the site does not claim untested performance. The H3 figure was authored for this project, with a restrained SVG visual style inspired by vLLM blog figures. No vLLM logo or affiliation is claimed. See CONTRIBUTING.md before adding content.

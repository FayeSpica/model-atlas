// Modified for Model Atlas: Astro imports, routing and catalog metadata.
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const PROVIDERS = {
  FastVideo: { display_name: "FastVideo", logo: `${base}providers/FastVideo.webp` },
  "meta-llama": { display_name: "Meta", logo: `${base}providers/meta-llama.webp` },
  fishaudio: { display_name: "Fish Audio", logo: `${base}providers/fishaudio.webp` },
  "m-a-p": { display_name: "Multimodal Art Projection", logo: `${base}providers/m-a-p.webp` },
  RecursiveSI: { display_name: "Recursive", logo: `${base}providers/RecursiveSI.webp` },
  Qwen: { display_name: "Qwen", logo: `${base}providers/Qwen.webp` },
  MiniMaxAI: { display_name: "MiniMax", logo: `${base}providers/MiniMaxAI.webp` },
  Fundamentals: { display_name: "基础结构", logo: null },
};

export function getProviderLogo(hfOrg) {
  return PROVIDERS[hfOrg]?.logo || null;
}

// Monochrome logos (e.g. OpenAI's pure-black mark) disappear on dark backgrounds.
// Flip them to white via `dark:invert` for those providers.
export function getProviderLogoClass(hfOrg) {
  return PROVIDERS[hfOrg]?.invertInDark ? "dark:invert" : "";
}

export function getProviderDisplayName(hfOrg) {
  return PROVIDERS[hfOrg]?.display_name || hfOrg;
}

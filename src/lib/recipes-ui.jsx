import { forwardRef } from 'react';
import { models, checked } from '../data/catalog.mjs';
import { providers } from '../data/providers.mjs';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function atlasHref(href) {
  if (href.startsWith('https:') || href.startsWith('http:') || href.startsWith('#')) return href;
  const [path, query] = href.split('?');
  let target;
  if (path === '/browse') {
    target = `${base}browse/`;
  } else if (path === '/') {
    target = base;
  } else {
    const provider = providers.find(entry => `/${entry.organization}` === path);
    const model = recipes.find(entry => `/${entry.hf_id}` === path);
    if (provider) {
      target = `${base}providers/${provider.id}/`;
    } else if (model) {
      target = `${base}models/${model.slug}/`;
    } else {
      throw new Error(`Unknown catalog route: ${path}`);
    }
  }
  return query ? `${target}?${query}` : target;
}

export const Link = forwardRef(function Link({ href, children, ...props }, ref) {
  return <a ref={ref} href={atlasHref(href)} {...props}>{children}</a>;
});

export function useRouter() {
  return { push: href => window.location.assign(atlasHref(href)) };
}

export const recipes = models.map((model) => {
  const provider = providers.find(entry => entry.name === model.family);
  return {
    hf_org: provider.organization,
    hf_repo: model.name,
    hf_id: `${provider.organization}/${model.slug}`,
    slug: model.slug,
    meta: { title: model.name, provider: model.family, description: model.lead, date_added: checked, tasks: [({ 文本生成: 'text', 视觉理解: 'multimodal', 语音生成: 'speech', 音乐生成: 'music', 图像生成: 'image', 视频与音频: 'video' })[model.category] || 'omni'] },
    model: { architecture: model.architecture || model.kind, parameter_count: model.parameterCount || '', active_parameters: model.activeParameterCount || '' },
    variants: {},
  };
});

export function compareRecipesByDateAdded(a, b) {
  return b.meta.date_added.localeCompare(a.meta.date_added);
}

export function recipeHref(recipe) {
  return `/${recipe.hf_id}`;
}

export function primaryRecipeTask(recipe) {
  return recipe.meta.tasks[0];
}

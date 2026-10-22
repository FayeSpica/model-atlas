# vLLM Recipes UI

Source: https://github.com/vllm-project/recipes
Revision: 49fcd5aa11fce16e809e9e9278f226e22ebcf535
License: Apache-2.0; full text in LICENSE. Original notices are retained.

Adaptations: Next.js imports use local Astro-compatible navigation adapters. Local model metadata supplies catalog entries and provider logos. Chinese labels replace recipe deployment copy; architecture badges replace unknown parameter counts. Sidebar identifies the current provider from the Atlas route. Recipes CSS and Tailwind classes are retained. Fonts use locally bundled Inter and JetBrains Mono. No analytics, deployment command builder, hardware profiles or vLLM branding are included.

Provider page header and ModelRows.astro use the corresponding markup and Tailwind classes from src/app/[org]/page.js, adapted to Atlas metadata. Provider avatars were retrieved from recipes.vllm.ai/providers and retain their owners’ marks.

The model-detail header and Guide.astro preserve the model-page header and native details/summary Accordion markup and Tailwind classes. Deployment-only metadata is omitted when the model catalog has no verified value.

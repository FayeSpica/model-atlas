# Adding a model

1. Add an entry to `src/data/catalog.mjs` using an existing model's shape.
2. State the precise checkpoint or implementation scope and excluded variants.
3. Trace inputs, branches, joins, output and repeated execution in primary source code.
4. Pin code links to a full commit SHA. Record the check date. Do not turn default values into claims about all variants.
5. Write five data-flow steps with shapes, mechanism explanations and a self-test answer. Distinguish logical components from deployment stages.
6. Link concepts that are actually relevant. Keep SVG text selectable, arrows meaningful, and colors stable by role.
7. Run `npm test`, `npm run build` and `node scripts/check-links.mjs`.
8. Review desktop and narrow layouts, keyboard controls, search, category filtering and flow playback.

Keep public text modest and source-backed. Performance claims require their own reproducible evidence. Diagrams should explain how a mechanism works, not merely list component names.

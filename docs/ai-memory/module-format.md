# Module format

Every package under `packages/` ships ESM only (`"type": "module"`).

- Do not add `tsconfig.cjs.json`, a `cjs/` build, a `main` field, or a `require` export condition.
- `module` and `types` point at `esm/`.
- Packages that dropped CommonJS follow `packages/ai-model-metadata`: each `exports` entry lists `types`, then `import`, then `default`.
- `require()` loads those packages on Node.js 22.12 or newer. Do not use top-level await.
- `scripts/build-all.mjs` emits ESM only. There is no `scripts/mark-cjs-directory.mjs`.
- `scripts/install-packages-to.mjs` has no `--cjs` flag.

Versions that dropped the CommonJS build:

| Package | Version |
| --- | --- |
| `@hangxingliu/ai-utils` | 2.0.0 |
| `@hangxingliu/cli-utils` | 7.0.0 |
| `@hangxingliu/common-utils` | 3.0.0 |
| `@hangxingliu/template` | 0.1.0 |

`@hangxingliu/ai-model-metadata` (`1.0.0`) and `@hangxingliu/repl` (`4.1.0`) were already ESM only.
`@hangxingliu/repl` export entries list `import` and `types`.

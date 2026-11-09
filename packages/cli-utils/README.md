# `@hangxingliu/cli-utils`

CLI helpers for colors, argument parsing, environment files, and process utilities.
The `yaml` export is a separate entry and needs the optional `yaml` peer dependency.

## ESM only

This package ships ESM only (`"type": "module"`). It does not include a CommonJS build.
`require()` works on Node.js 22.12 or newer, which can load an ESM module from `require()`.
The package does not use top-level await.

## Migrating to 7.0

7.0.0 removes the CommonJS build (`cjs/` and the `require` export condition).
Load this package with `import`, or with `require()` on Node.js 22.12 or newer.
The `yaml` entry remains at `@hangxingliu/cli-utils/yaml`.

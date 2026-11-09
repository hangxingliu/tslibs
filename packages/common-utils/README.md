# `@hangxingliu/common-utils`

Shared utilities for data structures, JSON schema, strings, errors, and timing.

## ESM only

This package ships ESM only (`"type": "module"`). It does not include a CommonJS build.
`require()` works on Node.js 22.12 or newer, which can load an ESM module from `require()`.
The package does not use top-level await.

## Migrating to 3.0

3.0.0 removes the CommonJS build (`cjs/` and the `require` export condition).
Load this package with `import`, or with `require()` on Node.js 22.12 or newer.

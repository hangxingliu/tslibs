# TypeScript version

`typescript` in the root `package.json` (`devDependencies`) is pinned to `=6` (TypeScript 6.x) instead of upgrading to TypeScript 7.0.

## Reason

`typescript-eslint` (`^8.72.1`) does not support TypeScript 7.0:

> typescript-eslint does not support TS 7.0.
> Please see https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0 to run typescript-eslint using the TS 6 API.
> See also https://github.com/typescript-eslint/typescript-eslint/issues/10940 for tracking typescript-eslint's support for TS >=7.1

## Guidelines

- Keep `"typescript": "=6"` in `package.json` so dependency updates stay on the latest TypeScript 6.x release without upgrading to 7.x.
- Do not upgrade `typescript` to `>=7.0.0` until `typescript-eslint` supports TypeScript `>=7.1` (tracked in [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)) or the repository is configured to run `typescript-eslint` side-by-side with the TypeScript 6 API.

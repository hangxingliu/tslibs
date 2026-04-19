---
updated_at: 2026-03-16 23:18:46
reference: https://agents.md/
descrption: A simple, open format for guiding coding agents
author: hangxingliu
---
For detailed instructions, architectural context, and specific code-writing considerations, refer to the documentation located in the `docs/ai-memory/**.md` and `docs/coding-guidelines/**.md`. All developers and AI assistants are expected to understand and follow the practices outlined in these documents.

## Repository Purpose

This monorepo contains a comprehensive suite of utility modules designed for rapid integration and reusability across multiple projects.

## Development Prerequisites

1. Node.js: `>= v22.x`
2. Bun: `>= v1.3.x`

## Building and Testing

``` bash
# at the root of this monorepo
bun install
```

Type checking:

``` bash
# at the root OR at the directory of sub-package directory
bun run build
```

Find and Fix problems by ESLint:

``` bash
bun run lint --fix
```

Run a specific Typescript file:

```
bun run /path/to/file.ts
```

Run a specific Bun.js test file:

``` bash
bun test /path/to/file.spec.ts
```

Run all test files:

``` bash
# at the root of this monorepo
bun test
```

## Coding Guidelines

### Code Quality Principles

1. **Readability & Maintainability**: Minimize complexity and code duplication
2. **Single Responsibility Principle**: All functions and classes must adhere to SRP
3. **TypeScript Strict Mode**: All code must satisfy TypeScript strict mode requirements
4. **Security**: Be mindful of prototype pollution; use `Map` or `Object.create(null)`
5. **Code Reuse**: To maintain a clean codebase and adhere to (**Don't Repeat Yourself**) principles:
  - **Check Existing Utilities**: Before writing any new utility functions or classes, always review the adjacent or relevant `*utils*.ts` files.

### Common Naming Conventions

To ensure developers do not misunderstand, correctly name variables related to file names and file paths. 
For example, if a variable represents a path, avoid naming it `fileName`; instead, it should be named `filePath`, `fileRelativePath`, or `fileAbsPath`.

### TypeScript Conventions

**Naming**:

- Enums: PascalCase for enum names, CONSTANT_CASE for properties
  - Example: `enum CustomDataType { UNKNOWN = 0, STRING = 1 }`
- Constants: CONSTANT_CASE for global immutable values
  - Example: `const DEFAULT_CONFIG = { enabled: true } as const;`

**Imports**:

- Use `node:` prefix for Node.js built-in modules
  - Example: `import { resolve } from 'node:path'`
- Add `.js` suffix for local file imports
  - Example: `import { ... } from '../utils/index.js'`
- Avoid wildcard imports except for specific cases like TypeScript
  - ❌ `import * as fs from 'fs'`
  - ✅ `import { readFileSync } from 'node:fs'`

**Type Safety**:

- Use `Readonly` types for function parameters when possible
- Handle `null` and `undefined` strictly
- Never access properties on nullable objects without null checks

### Unit Testing

**Bun standard**: https://bun.com/docs/test

``` typescript
// example.spec.ts
import { expect, test } from "bun:test";
test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});
```

- Test files must be named using the `.spec.ts` extension (e.g., `transform-utils.spec.ts`)
- Templates and References: Use the nearest `__template.spec.ts` file as a blueprint when creating new tests. If a template is not available, refer to other existing `.spec.ts` files within the same directory for context on structure and mocking conventions.

### Documentation

**JSDoc Comments**:

- Use JSDoc style for functions and classes
- Avoid redundant comments
- Add context for non-self-explanatory variables
- Example:
  ```typescript
  /** These internal IDs are UUIDs and differ from the IDs displayed on the UI.
   * They come from the internal function {@see createInternalFileId} */
  internalFileIds: string[]
  ```

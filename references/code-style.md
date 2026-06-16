# Code Style

`@tuomashatakka/eslint-config` for JavaScript/TypeScript + Semantic Nodes for CSS.

## JavaScript / TypeScript

Strictly conform to `@tuomashatakka/eslint-config`. Always run `eslint --fix`
before delivering code.

- **No semicolons** at statement ends.
- **Two-space indent**.
- **Trailing commas** on multi-line arrays/objects.
- **Single quotes** for strings; backticks for template literals; double quotes
  only inside JSX attributes (which this skill never produces).
- **`function` keyword** for pure top-level utilities; arrow functions inside
  factories and as callbacks.
- **No `any`** — use `unknown` + narrowing, or a discriminated union.

## TypeScript Specifics

- Union types and `as const` over `enum` for closed sets; `enum` only for
  non-TS interop.
- `Map` / `Set` over plain objects for keyed collections with churn.
- Discriminated unions over optional-prop overloading.
- Branded types for IDs (`type InstanceId = number & { __brand: 'instance' }`).
- Every public factory exposes a typed options object as its single argument
  with defaults destructured in the signature.

```ts
type GrassFieldOptions = {
  count: number
  radius: number
  seed?: number
}

export function createGrassField ({
  count, radius, seed = 1,
}: GrassFieldOptions) { /* … */ }
```

## File Header

Every JavaScript module begins with a one-line path comment:

```js
// scene/grass-field/index.js
```

## Imports

- Third-party first, alphabetized.
- Blank line.
- Local imports, alphabetized.
- No barrel files (`index.js` re-exports) — they kill tree-shaking and break
  jump-to-definition.

```js
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

import { mulberry32 } from '../utils/math/rng.js'
import { createBillboardMaterial } from './material.js'
```

## CSS — Semantic Nodes Style Guide

The 3D canvas overlay UI lives in a single global stylesheet entrypoint that
imports tokens, base elements, and feature stylesheets.

- **HTML5 landmark elements**: `header`, `main`, `nav`, `dialog`, `article`,
  `section`, `aside`, `footer`. Avoid div-soup.
- **Tag selectors over class selectors**: style `button`, `h1`, `nav a`
  directly. Use classes only for variants that can't be modeled with
  attributes.
- **CSS custom-property tokens** for every value that might repeat. Define in
  `:root` under a single `@layer tokens`.
- **`@layer`** for cascade discipline: `@layer reset, tokens, base, layout,
  components, utilities;`.
- **CSS nesting** (native, not Sass) wherever it improves readability.
- **`@property`** for animated custom properties so they can be transitioned.
- **Mobile-first media queries**: base styles target small screens, scale up
  with `@media (min-width: …)`.
- **Use `block` / `inline-block`** before reaching for flex/grid. Flex/grid
  are powerful but most layouts don't need them.

## Forbidden

- **Tailwind**
- **Shadcn / Radix**
- **CSS Modules**
- **styled-components / emotion / vanilla-extract / any CSS-in-JS**
- **Inline `style=""` attributes** (except for transform values that must be
  set per-frame from JS — and even then, prefer custom properties)
- **`className` as a styling prop in React** — if React is involved at all,
  the canvas mount is the only React surface and it has zero classNames

## Example Token File

```css
/* style/tokens.css */
@layer tokens {
  :root {
    /* color */
    --color-bg:          oklch(8% 0.02 270);
    --color-fg:          oklch(95% 0.01 270);
    --color-accent:      oklch(72% 0.18 175);
    --color-accent-alt:  oklch(72% 0.16 290);

    /* typography */
    --font-display: 'Montserrat', system-ui, sans-serif;
    --font-body:    'Poppins', system-ui, sans-serif;
    --font-mono:    'JetBrains Mono', monospace;

    /* space */
    --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
    --space-4: 16px; --space-6: 24px; --space-8: 32px;

    /* surfaces */
    --surface-glass: oklch(20% 0.03 270 / 0.6);
    --surface-line:  oklch(40% 0.02 270 / 0.4);

    /* motion */
    --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
    --duration-fast:  120ms;
    --duration-med:   280ms;
    --duration-slow:  680ms;
  }
}
```

## Example Base File

```css
/* style/base.css */
@layer base {
  html, body { margin: 0; height: 100%; background: var(--color-bg); color: var(--color-fg); font-family: var(--font-body) }
  canvas    { display: block; width: 100%; height: 100%; touch-action: none }
  h1, h2, h3 { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em }
  button    { background: transparent; color: inherit; font: inherit; border: 1px solid var(--surface-line); padding: var(--space-2) var(--space-4); cursor: pointer }
  button:hover { border-color: var(--color-accent) }
}
```

## React Three Fiber

Forbidden. This skill is vanilla three.js only. If a React app needs three.js,
mount it imperatively inside `useEffect` and let three own the loop.

## Tests

- Unit tests next to the file under test as `<name>.test.js`.
- Pure math, RNG, and geometry-array builders are easy to test — write
  assertions for shape, count, and bounds.
- Skip tests for shader strings (compile-check in a node script instead).
- Skip tests for entire scenes — write smoke tests that import the scene
  factory without throwing.

## Naming Conventions

- **`kebab-case.js`** for all source files.
- **`camelCase`** for variables, function names, factory outputs.
- **`PascalCase`** for classes only.
- **`UPPER_SNAKE_CASE`** for module-level constants.
- **`u<Name>`** prefix for shader uniform names (`uTime`, `uIntensity`).
- **`a<Name>`** prefix for shader attribute names (`aPhase`, `aColor`).
- **`v<Name>`** prefix for shader varying names (`vUv`, `vNormal`).

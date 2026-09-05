---
id: "install"
title: "Create the project"
summary: "Start from an ordinary TypeScript application and install only the runtime packages."
order: 1
---

Use any TypeScript build tool that supports native ESM. Vite keeps the first run short,
but Typed does not require Vite. The application depends on Effect for its runtime, @typed/fx for
reactive state, and @typed/template for rendering. These versions match Typed beta.6 and Effect
4.0.0-rc.112; keep the Typed packages and Effect prerelease compatible when updating.

### terminal

```sh file="terminal"
npm create vite@latest typed-counter -- --template vanilla-ts
cd typed-counter
npm install effect@4.0.0-rc.112 @typed/fx@2.0.0-beta.6 @typed/template@1.0.0-beta.6
npm run dev
```

### package.json

```json file="package.json"
{
  "type": "module",
  "dependencies": {
    "@typed/fx": "2.0.0-beta.6",
    "@typed/template": "1.0.0-beta.6",
    "effect": "4.0.0-rc.112"
  }
}
```

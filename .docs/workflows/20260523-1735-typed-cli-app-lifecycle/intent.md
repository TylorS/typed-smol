# Intent

Typed application authors should be able to use `typed` as the last CLI they need for normal web app work.

The app-facing script contract should be:

```json
{
  "scripts": {
    "dev": "typed dev",
    "build": "typed build",
    "preview": "typed preview",
    "check": "typed check",
    "test": "typed test"
  }
}
```

`vmc` and raw Vite commands should remain implementation details for normal app authors.


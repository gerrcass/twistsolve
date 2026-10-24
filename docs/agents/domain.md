# Domain Docs

How engineering skills consume this repo's domain documentation.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root.
- **`docs/adr/`**: read the ADRs that touch the area you are about to work in.

If a file does not exist, proceed silently. The `/domain-modeling` skill creates these lazily when terms or decisions are resolved.

## File structure

Single-context repo:

```text
/
├── GLOSSARY.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept (issue title, test name, refactor proposal), use the term as defined in `GLOSSARY.md`. Do not drift to synonyms the glossary explicitly avoids.

If a concept is missing, note it for `/domain-modeling` rather than inventing a parallel vocabulary.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly instead of silently overriding it.

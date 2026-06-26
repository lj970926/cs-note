# AGENTS.md

Guidance for AI agents and human collaborators working in this repository.

## Project Overview

This repository is a Quartz v5 site for publishing notes as a digital garden.
The site content lives mostly under `content/`, while the Quartz engine and
components live under `quartz/`.

The active publishing branch is `quartz`. Pushes to `origin/quartz` trigger the
GitHub Pages workflow in `.github/workflows/deploy-github-pages.yaml`.

## Repository Layout

- `content/`: Markdown notes, images, Obsidian metadata, Excalidraw files, and
  other site content.
- `quartz.config.yaml`: Main site configuration. This file controls the base URL,
  theme, enabled plugins, and layout behavior.
- `quartz.config.default.yaml`: Upstream/default Quartz configuration. Treat it
  as reference material unless the task explicitly needs default changes.
- `quartz/`: Quartz source code, plugins, components, styles, processors, and
  tests.
- `public/`: Generated site output. Do not hand-edit generated files.
- `.github/workflows/deploy-github-pages.yaml`: GitHub Pages deployment for the
  `quartz` branch.

## Common Commands

Use the npm scripts from `package.json`:

```bash
npm run docs
npm run check
npm run format
npm test
npx quartz build
```

Notes:

- Use Node.js 22 or newer locally. The GitHub Pages workflow currently builds
  with Node.js 24.
- `npm run docs` runs a local Quartz build server against `docs`.
- `npm run check` runs TypeScript checking and Prettier verification.
- `npm test` runs the TypeScript test suite through `tsx --test`.
- `npx quartz build` writes the built site to `public/`.

## Editing Guidelines

- Prefer small, scoped changes that match the existing Quartz v5 patterns.
- Do not manually edit `public/`; regenerate it with Quartz build commands.
- Keep `quartz.config.yaml` changes intentional because they affect publishing,
  routing, plugins, analytics, and site layout.
- Preserve Chinese filenames and directory names in `content/`.
- When editing notes, keep Obsidian-friendly Markdown intact, including
  wikilinks, callouts, tags, frontmatter, Excalidraw files, and embedded images.
- Avoid broad formatting of all Markdown notes unless the task explicitly asks
  for it.
- Do not remove `.obsidian`, `.claude`, or other tool metadata from `content/`
  unless the task explicitly calls for cleanup.
- If changing shared Quartz code under `quartz/`, add or update focused tests
  where behavior can regress.

## Publishing Notes

The deployed site is configured with:

```yaml
baseUrl: lj970926.github.io/cs-note
```

Deployment flow:

1. Commit changes on the local `quartz` branch.
2. Push to `origin quartz`.
3. GitHub Actions builds the site with `npx quartz build`.
4. The generated `public/` artifact is deployed to GitHub Pages.

Before pushing code changes, prefer running:

```bash
npm run check
npm test
```

For content-only edits, a local build is usually enough:

```bash
npx quartz build
```

## Git Hygiene

- Check `git status --short --branch` before and after making changes.
- Do not revert or overwrite unrelated user changes.
- Keep commit messages concise and conventional when possible, for example:
  `chore: update quartz config` or `docs: add note about tmux`.
- When an AI assistant creates or materially edits a commit, include an
  appropriate co-author trailer in the commit message. Use the agent's
  configured or official Git identity when available, and do not invent human
  co-authors. Examples:

  ```text
  Co-authored-by: OpenAI Codex <codex@openai.com>
  Co-authored-by: Claude <configured-claude-email>
  Co-authored-by: Gemini <configured-gemini-email>
  Co-authored-by: Cursor Agent <configured-cursor-email>
  Co-authored-by: <Agent Name> <configured-agent-email>
  ```

  If the specific agent identity is unknown, use a clear machine identity such
  as `Co-authored-by: AI Assistant <ai-assistant@example.invalid>` or omit the
  trailer and mention the assistance in the PR/body instead.

- Push deployable changes to `origin/quartz` unless the user asks for a different
  remote or branch.

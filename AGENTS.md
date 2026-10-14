# Agent guidance

## Project context

This repository contains Tagum Food Finder, a food-discovery product for Tagum City. Keep changes focused on the user's current request. Do not invent product requirements, business rules, or technical constraints that have not been agreed with the user.

Do not use the globally installed `pickletagum-web-standards` skill in this repository. It belongs to an unrelated project. Apply standards selected specifically for Tagum Food Finder instead.

## Obsidian vault

The repository root is the Obsidian vault. Do not create a separate `docs/vault/` structure. Shared session notes live in `.vault/sessions/`.

- At the start of a session, check `.vault/sessions/` for the latest note, if one exists.
- At the end of a session, create or update `.vault/sessions/[YYYY-MM-DD].md` using `.vault/session-template.md`, and commit it alongside the related repository changes when a commit is requested or appropriate.
- Keep session notes concise: record the goal, meaningful progress, unresolved blockers, and the next useful action.
- Do not store credentials, tokens, connection strings, customer personal data, or private client material in `.vault/`.

## General principles

- Prefer concise, focused solutions and follow established project patterns.
- Review relevant existing files before changing or refactoring them.
- Create a todo list for multi-step work.
- Run major scope, architecture, dependency, data-model, or visual-direction changes by the user before implementing them.
- Watch for over-engineering, oversized files, mismatched style or syntax, and obvious bugs.
- Keep code comments to one line. Do not use emojis or decorative characters in comments.
- Use kebab-case names for new Markdown files.
- For product documents requested under `docs/`, complete the relevant discovery interview and resolve its material decisions before creating the document. Do not use the final document as a scratchpad for unanswered questions.

## Code quality

- Use data structures and algorithms appropriate to the problem.
- Apply least privilege; do not expose data, endpoints, or permissions unnecessarily.
- Use the project's dependency and lock files to determine package versions. Do not guess versions.
- Avoid redundancy unless it materially improves usability, clarity, or reliability.
- Verify changes with the most relevant available checks before reporting completion.

## Taste skill suite

The Taste skill suite is installed locally under `.agents/skills/` and must be used for user-facing system design and frontend implementation.

- Before designing or implementing public-facing web pages, read and apply `.agents/skills/design-taste-frontend/SKILL.md`. Begin with its required design read and explicit design, motion, and density dials, then run its pre-flight checks before delivery.
- Apply the skill contextually. It is intended for landing pages, public discovery pages, and visual redesigns, not dense dashboards, data tables, or multi-step product flows.
- For those excluded surfaces, use established accessible product-UI patterns and apply only the Taste rules that remain relevant, such as coherent tokens, responsive layouts, interaction states, contrast, reduced motion, and anti-template quality checks.
- Use the other installed Taste skills only when their descriptions match the task. Examples include `imagegen-frontend-mobile` for mobile screen concepts, `imagegen-frontend-web` or `image-to-code` for image-led web direction, and `redesign-existing-projects` for an existing interface redesign.
- Do not combine stylistic skills blindly. User requirements, accessibility, performance, and product usability take precedence over ornamental effects.
- Before implementing or materially redesigning any user-facing page, create and show the user a visual mockup or design image for that page. Include mobile and desktop variants when the layouts differ materially. Wait for explicit user approval or requested revisions before writing the page's UI code. Nonvisual maintenance that does not change the page design is exempt.

## Version control

- Commit after every significant repository change.
- Keep each commit focused and atomic, and use a clear commit message.
- Include the corresponding `.vault/sessions/[YYYY-MM-DD].md` update in the same commit.
- Never automatically push a branch.
- Preserve unrelated user changes in the working tree.

## AI restrictions

- Do not process or add customer personal data unless the user explicitly approves an exemption.
- Never expose, request, commit, or log credentials, including passwords, API keys, tokens, and connection strings.

## Superpowers is opt-in

Use the Superpowers plugin, its skills, and its workflow requirements only when the current user prompt contains the exact phrase `use superpowers` (case-insensitive). Do not activate Superpowers from inferred task types or its own automatic triggers.

## AITmpl skills

AITmpl is an on-demand catalog of independent skills. Install a specific catalog skill from the repository root with:

```bash
npx claude-code-templates@latest --skill <category/skill-name> --directory . --yes
```

This writes the skill to `.claude/skills/`, which is local agent tooling rather than project source.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

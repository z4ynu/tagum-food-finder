# Agent guidance

## Project context

This repository contains Tagum Food Finder, a food-discovery product for Tagum City. Keep changes focused on the user's current request. Do not invent product requirements, business rules, or technical constraints that have not been agreed with the user.

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

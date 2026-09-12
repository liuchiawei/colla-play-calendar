# CollaPlay Calendar — Claude Code

Project conventions and Vercel platform guidance live in the imported files. Follow them; do not duplicate or drift from them here.

@.cursorrules
@AGENTS.md

## Claude Code

- Package manager is `pnpm`, never npm.
- User-facing copy, form errors, and comments: Traditional Chinese.
- Do not hand-edit `lib/generated/prisma/`. After schema changes run `pnpm exec prisma generate`.
- When conventions conflict, `.cursorrules` wins for this repo; `AGENTS.md` is Vercel platform defaults.
- Keep this file thin. Put shared rules in `.cursorrules` or `AGENTS.md`, Claude-only notes below this heading.

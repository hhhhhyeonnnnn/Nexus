# Nexus Agent Guidelines

## Project
- Nexus is a Student Council Operating System.
- Use Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui and Lucide.
- Do not introduce another backend framework without explicit approval.
- The initial foundation is complete. Implement only the next domain or setup task the user authorizes.
- Supabase setup does not include login UI, organization CRUD, live AI, RAG or deployment.

## Architecture
- Preserve the existing project structure and separate features by domain.
- Keep UI and business logic reasonably separated; reuse shared components and utilities.
- Prefer simple MVP implementations. Avoid unrelated refactoring and unnecessary abstractions.
- `src/app` owns routes; `src/features` owns domain code; `src/lib` owns shared infrastructure.

## Design
- Figma is the UI source of truth: https://www.figma.com/design/aGiZ5xJjFH21tDgvJLALi0/?node-id=3-2
- Match existing layout, spacing, typography, colors and component patterns.
- Reuse existing components before creating new ones; prefer shadcn/ui and Lucide icons.
- Use tokens from `src/app/globals.css`. Do not redesign existing screens without instruction.
- Clearly distinguish unimplemented features and disconnected data from real information.

## Git
- Never work directly on main or push directly to main. Do not use develop.
- Use `feature/*`, `fix/*`, `docs/*` or `chore/*` branches.
- One GitHub Issue should generally correspond to one focused PR.
- Use conventional commit prefixes such as `feat:`, `fix:`, `docs:` and `chore:`.
- Do not include unrelated changes. Review before merge.

## Code
- Use TypeScript strict types and avoid `any`.
- Keep server credentials and privileged logic out of client components.
- Use npm and commit package-lock.json; use `npm ci` for reproducible installs.
- Consult installed Next.js documentation before relying on version-sensitive APIs.

## Database
- All database changes go through `supabase/migrations` and require documentation updates.
- Organization-owned data must contain `organization_id` where appropriate.
- Preserve tenant-safe composite foreign keys. Never silently change schemas.
- Use Supabase RLS for organization-level access control.
- The initial migration permits member-scoped reads only; write policies and onboarding are separate work.

## Security
- Never commit secrets or .env files; `.env.example` contains blank placeholders only.
- Never expose OpenAI or Supabase service-role keys to client code.
- Never use a service-role client as a shortcut around user authorization or RLS.

## AI
- Schema-validate structured AI output. Never trust model output directly.
- Do not automatically persist generated Tasks or Decisions.
- Require user review and explicit confirmation before database insertion.
- Unknown assignees, dates and facts must remain unknown instead of being guessed.

## Quality
Before completing a task:
1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Run `npm run build` when changing the app or configuration.
4. Test the modified flow; run `npm run test:db` for database changes.
   Run `npm run test:config` for Supabase configuration changes and `npm run db:check` when connecting a development project.
5. Ensure no unrelated files or secrets were changed.
6. Update documentation when APIs, schemas or architecture change.

## Communication
Report what changed, files changed, important decisions, known limitations and the recommended next step.
Do not change important project policies without explicit user instruction.

# Agent Duel Arena — Design Workspace Handoff

Use `main` as your base.

Your job is to execute the frontend design pass for Agent Duel Arena without changing the core product rules.

Read first:
- `docs/agent-duel-arena/ux-spec.md`
- `docs/agent-duel-arena/design-pass.md`
- `docs/agent-duel-arena/todo.md`

Context:
- website-first product
- arena broadcast aesthetic
- Pokemon-style duel framing
- sports-transmission energy
- transcript-first layout
- trusted vs untrusted players shown through color treatment
- `Player 1 VS Player 2` banner is a key visual asset
- mobile-safe, not mobile-first

Current implementation already has working:
- `/`
- `/play`
- `/agent`
- `/lobby`
- trusted/untrusted onboarding
- runner token issuance and registration
- lobby create/join flow

Your scope:
- turn the current screens into a real product UI
- establish the visual system that `/match/[id]` will inherit
- avoid generic SaaS/admin styling
- keep readability high

Do not spend time on:
- backend redesign
- changing match rules
- spectator market implementation
- World ID protocol changes

Success condition:
- one screenshot of the app should already look judge-demo ready

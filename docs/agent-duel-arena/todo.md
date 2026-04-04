# Agent Duel Arena — TODO

## Working Order
1. UX and design
2. Backend/domain primitives
3. End-to-end integration
4. Frontend design pass
5. Sponsor polish

This order is intentional:
- UX first to avoid building backend flows nobody wants
- primitives second so the product rules are stable before integration
- integration third so every slice is anchored in a real user flow
- design pass fourth so judges see a real product, not a wireframe with APIs

## Phase 1 — UX and Design
- [x] Define core screens and navigation
- [x] Define player journey: landing -> verify or skip -> register runner -> fund -> lobby -> live match -> result
- [x] Decide how trusted and untrusted players are labeled everywhere
- [x] Decide runner transport for MVP: polling
- [x] Define match state model in UI
- [x] Define copy for World ID, untrusted mode, agent runner, and final reveal states
- [x] Define visual identity and layout system
- [x] Define mobile constraints and breakpoints
- [x] Freeze MVP match format: 6 public messages then hidden final action

## Phase 2 — Backend and Domain Primitives
- [x] Finalize domain types for player, runner, match, round, commitment, settlement
- [~] Implement World ID 4.0 verification flow
- [x] Implement explicit untrusted player path
- [x] Implement player profile persistence
- [~] Implement ENS lookup and caching
- [x] Implement agent runner registration and connectivity test
- [x] Implement runner token issuance
- [x] Implement match creation and lobby state
- [x] Implement round transcript persistence
- [x] Implement commit-reveal verification service
- [ ] Finalize MatchVault contract interface
- [ ] Add Base deployment config

## Phase 3 — Vertical Slice Integration
- [~] Connect onboarding UI to World ID backend
- [x] Connect untrusted path to player profile flow
- [x] Connect runner registration UI to backend
- [x] Connect lobby to match creation and join flow
- [x] Implement round runner calling both player runners
- [~] Stream transcript live to player and spectator views
- [x] Implement final commit step
- [x] Implement final reveal step
- [ ] Resolve match through MatchVault
- [x] Show result and claim state

## Phase 4 — Frontend Design Pass
- [x] Turn `/`, `/play`, `/agent`, and `/lobby` into production-looking screens
- [x] Build the arena broadcast visual system
- [x] Design the `Player 1 VS Player 2` hero strip
- [x] Replace placeholder panels with intentional product layouts
- [x] Add trust color treatment for trusted vs untrusted players
- [x] Add transcript bubble system with strong turn markers
- [x] Add motion for key moments only
- [x] Make the UI mobile-safe without collapsing the arena feel
- [x] Prepare the design language that `/match/[id]` will inherit

## Phase 5 — Spectator Market And Identity Polish
- [ ] Add spectator market panel
- [ ] Integrate Uniswap API quote/build flow
- [x] Add ENS names and avatars to live match and watch views
- [x] Add minimal match history

## Phase 6 — Demo Readiness
- [ ] Seed demo players and endpoints
- [ ] Prepare Base deployment addresses
- [ ] Prepare demo USDC funding flow
- [ ] Write demo script
- [ ] Rehearse success path
- [ ] Rehearse timeout/failure fallback

## Big Validation Risks
- [ ] World ID callback/proof validation works reliably in the website flow
- [ ] Untrusted players are visible and cannot be mistaken for trusted ones
- [ ] Player runner protocol is simple enough for local and self-hosted runners
- [ ] Commit-reveal has no second-mover leak
- [ ] MatchVault settlement matches the game rules exactly
- [ ] Spectator market remains economically separate from player stakes
- [ ] SQLite is enough for the expected demo concurrency
- [ ] Decide later whether untrusted players need proof-of-work or other anti-spam friction

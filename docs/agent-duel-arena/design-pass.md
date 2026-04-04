# Agent Duel Arena — Frontend Design Pass

## Purpose
Make the product visually memorable enough to impress judges.

The goal is not generic polish.
The goal is to make the app feel like a live competitive arena.

## Design Thesis
- arena broadcast aesthetic
- Pokemon-style duel framing
- sports transmission energy
- transcript-first composition
- high readability under tension

## Screens In Scope
- `/`
- `/play`
- `/agent`
- `/lobby`
- design language prep for `/match/[id]`

## What Must Be Visibly True
- this is a game, not an admin dashboard
- the conversation is the main event
- both sides feel like contestants entering an arena
- trust status changes the mood of the presentation
- the product is watchable even before spectators are fully implemented

## Core Visual Elements

### 1. Arena Broadcast Header
- strong title treatment
- live feeling
- persistent phase/timer region
- visible watcher count styling

### 2. VS Banner
- `Player 1 VS Player 2`
- should feel theatrical
- should work as the visual centerpiece of the duel flow
- must survive on mobile without becoming tiny or cluttered

### 3. Trust Styling
- trusted: cleaner, sharper, more prestigious
- untrusted: slightly suspect, ironic, visibly different
- do not rely on a small neutral badge alone

### 4. Transcript System
- super-readable chat bubbles
- explicit turn markers
- current speaker emphasis
- enough personality to feel like a duel, not a support chat

### 5. Motion
Use only a few high-value animations:
- page-load staging
- VS reveal
- phase transition

Avoid:
- constant micro-animations everywhere
- motion that obscures readability

## Anti-Goals
- no generic SaaS dashboard feeling
- no default AI app look
- no purple-on-white safety design
- no flat, lifeless forms
- no over-designed clutter that hurts match readability

## Practical Constraints
- mobile-safe, not mobile-first
- must remain readable with real text content
- should not require exotic libraries just for aesthetics
- should reuse a clear component language across screens

## Judge Test
The design pass succeeds if:
- someone can glance at one screenshot and understand this is a live duel product
- the UI looks intentional and memorable
- the app feels demo-ready before the full duel engine is done

## Implementation Advice
- establish reusable color tokens first
- establish typography and spacing system second
- build the VS hero strip early
- then restyle forms and panels around that system
- do not restyle each page independently

---
name: business-flow-upgrade-design
description: Design spec for a phased business-flow upgrade roadmap based on current code state and upgrade.txt
metadata:
  type: project
---

# Business Flow Upgrade Design

## Context

`upgrade.txt` already defines the desired business journey:

`guest → auth → profile → assessment → recommendation → booking → messaging/follow-up → mentor/admin handling`

However, the current repository state is uneven. Some surfaces already exist and are usable, while others are only partially wired or still absent. This design therefore turns the upgrade into a **state-driven roadmap** rather than a strict file-by-file implementation order.

## Goal

Create a realistic roadmap that upgrades the app into a coherent business flow without forcing work in the wrong order.

## Core principle

Prioritize the **next missing business link** in the user journey, not the next phase number in the original plan.

That means:
- keep existing flow pieces intact,
- tighten gate conditions where users can fall through,
- then connect the missing transition to the next meaningful state.

## Current-state assessment

### Already present / strong
- Auth bootstrap and session handling exist.
- Assessment has template, submit, latest attempt, and history endpoints.
- Result page already shows matched majors, recommendations, and fallback empty states.
- Booking routes, booking history UI, booking status badges, and realtime invalidation listener already exist.

### Partially present
- Profile completeness logic and route gating are not yet clearly enforced as a business rule.
- Assessment result is visible, but the handoff to booking/discovery is not yet a tight business bridge.
- Booking lifecycle is visible, but history/realtime/admin sync still needs tightening.

### Still open
- Chat/follow-up loop as a business retention path.
- Mentor/admin operational separation.
- Global UX safety states and QA/demo readiness.

## Proposed roadmap

### 1. Lock the onboarding gate

Make profile completeness an explicit prerequisite for downstream actions.

Focus:
- authenticated user state
- profile completeness decision
- routing/guard behavior
- visible “can continue / must complete profile” feedback

Why first:
- this is the earliest place where the business flow can silently break.
- all later business actions depend on it.

### 2. Strengthen assessment → recommendation → booking bridge

Make assessment output a business transition, not just a score page.

Focus:
- keep result page actionable
- ensure recommendation points to the next step
- preserve latest attempt/history
- add soft fallback when match confidence is weak

Why second:
- assessment already exists, so this is the highest-leverage bridge to the next business stage.

### 3. Finish booking as an actual lifecycle

Turn booking into a visible state machine with history and sync.

Focus:
- normalize booking states
- show booking history for both sides
- connect realtime updates reliably
- align UI copy for user and mentor

Why third:
- booking is the operational core of the thesis story.
- it must feel like a live workflow, not a static list.

### 4. Build the messaging + follow-up loop

Use booking context to make chat meaningful and recurring.

Focus:
- conversation tied to booking/follow-up context
- visible notification path
- post-booking follow-up prompts

Why fourth:
- this closes the retention loop after booking.
- it turns one-time use into a continuing product flow.

### 5. Separate mentor/admin operations

Make mentor work operational and admin work supervisory.

Focus:
- mentor availability and bookings
- admin moderation and oversight
- audit visibility for high-impact actions

Why fifth:
- these are important, but they are downstream from the user journey.
- they should support the platform story, not block the main flow.

### 6. Remove dead ends and add QA readiness

Make sure every important page gives the user a next step.

Focus:
- loading, empty, error, not-found states
- recovery actions
- manual QA checklist
- seeded demo path

Why last:
- this is polish and proof-of-quality.
- it becomes valuable once the main flow exists.

## Delivery order

1. Lock onboarding gate
2. Strengthen assessment bridge
3. Finish booking lifecycle
4. Build messaging/follow-up loop
5. Separate mentor/admin operations
6. Remove dead ends and prepare QA/demo

## Success criteria

The upgrade is successful when:
- a user can enter from the homepage and reach a meaningful next state without dead ends,
- assessment leads to a visible next action,
- booking status is understandable to both user and mentor,
- follow-up continues the journey,
- mentor/admin pages look like real operational surfaces,
- no important page leaves the user stuck.

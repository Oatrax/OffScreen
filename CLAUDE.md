# Project: OffScreen (Android)

## Core Concept
A personal productivity, day-planning, and behavioral app-blocker for Android. Users select distracting apps on their phone (e.g., Instagram, TikTok) to lock. OffScreen generates an internal random password/PIN hidden from the user, blocking access to chosen apps until the user completes their pre-determined daily tasks (e.g., working out, studying).

## Technical Constraints & Architecture
- **Platform:** Android (must eventually be buildable into a standard `.apk` / `.aab` for potential Google Play release).
- **Tech Stack:** Choose the optimal language, UI framework, and local storage solution best suited for reliable Android background app-interception and fast, maintainable development.
- **Data Storage:** 100% local-first (no cloud backend or user accounts for MVP). Securely store the hidden unlock password/PIN so the user cannot easily bypass or read it prematurely.

## Core Functional Requirements
1. **Installed App Picker:** Fetch and display user-installed apps on the device (filtering out core system apps) with toggles to mark them as "Locked".
2. **App Interception & Lock Mechanism:** 
   - Detect when a locked app is opened.
   - Immediately block access with an un-dismissible lock screen/overlay.
   - Generate a random password/PIN known only to OffScreen when locks are active.
3. **Task-Gated Unlocking:**
   - Users define daily tasks/routines (e.g., study blocks, workouts).
   - Completing all required daily tasks either automatically unlocks the apps or reveals the hidden password/PIN to the user.
4. **Permissions Handling:** Smoothly guide the user through granting required Android system permissions (e.g., Usage Access, Draw Over Other Apps, or Accessibility).

## UI & Navigation Layout
- **Left Sliding Drawer (Navigation Drawer):** Accessible via top-left menu icon or edge swipe. Contains:
  - **Profile:** User summary, current streak, discipline stats.
  - **Stats:** Screen time saved, tasks completed vs. missed.
  - **Settings:** App preferences, strictness rules, permission status checker.
- **Bottom Navigation Bar:**
  - **Today:** Active daily tasks, completion progress toward unlocking apps, current lock status.
  - **App Lock:** List of installed apps with lock toggles and PIN/lock status.
  - **Planner:** Create/edit daily tasks and recurring routines.

## Execution & Coding Rules
- Be concise. Output code and architectural decisions directly without conversational filler.
- Propose your chosen tech stack and folder structure briefly first, then implement in clean, modular phases.
- Separate background app-blocking logic cleanly from UI and data layers.
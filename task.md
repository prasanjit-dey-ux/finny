# Task: Fix multiple issues

## Issues to fix:
1. **Remove email from auth** — user doesn't want email, just name + password (or even simpler)
2. **Persist session** — if user has completed onboarding, skip to home on next launch. Currently always shows onboarding.
3. **Drag-to-delete not working** — the card isn't actually deleting when dragged to dustbin. Debug the PanResponder logic.
4. **Plus button as FAB above the AI button** — floating action button on wishes screen, positioned above the tab bar's AI button
5. **Audit onboarding animation** — check if the onboarding slider animations are smooth and well-crafted

## Root causes:
- **No session persistence**: `index.tsx` (onboarding) always shows first. There's no check for existing profile. Need to add a splash/redirect that checks AsyncStorage for completed onboarding.
- **Email required**: Auth flow uses email+password. Can simplify to just name+PIN or remove auth entirely since it's local-only.
- **Drag-to-delete**: PanResponder on web might have coordinate issues. Need to debug.
- **FAB**: Need a floating Plus button on wishes.tsx, positioned above tab bar.

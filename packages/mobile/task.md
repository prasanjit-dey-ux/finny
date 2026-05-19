# Finny App - Task Progress

## Completed
- [x] Auth flow: Name + Email + Password (Create Account), Email + Password (Sign In)
- [x] Real local auth with SHA-256 hashed passwords (expo-crypto)
- [x] AI chat onboarding: 4 questions (Income → Savings → Big Goal → Top 3 Categories)
- [x] All currency switched to INR (₹) everywhere:
  - store.ts formatINR with en-IN locale
  - home.tsx all $ → ₹, en-US → en-IN, CurrencyDollar → ₹ text, USD → INR
  - welcome.tsx chat messages ₹
  - spends.tsx & wishes.tsx formatUSD → formatINR
  - finny.tsx example prompt ₹500
  - API system prompt: INR ₹ with Indian formatting
- [x] Legacy profile data migration (clears stale "Prasanjit" profile if no credentials exist)
- [x] store.ts: bigGoal, topCategories fields added

## Remaining
- [ ] Rewrite spends.tsx - white bg, design system, no emojis, Phosphor icons
- [ ] Rewrite wishes.tsx - white bg, design system, no emojis, Phosphor icons  
- [ ] Remove any remaining emojis
- [ ] Add zero-checks to math calculations

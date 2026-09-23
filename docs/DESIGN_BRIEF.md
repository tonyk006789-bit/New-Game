# Visual direction | mobile-first professional arcade
Original dark navy player surfaces, restrained cyan/violet accents and warm gold highlights. Preserve the energetic genre without copied JUWA brands, crowded menus, fake popularity indicators or duplicated game tiles. Admin uses calmer neutral surfaces, readable data and one clear action hierarchy.

## Screen inventory
Player: invite/login, zero-credit welcome, lobby/categories/favorites, rules, slot, keno, fish room list/table, round history, credit history, settings, disconnect/recovery and account-session takeover. The empty state is 'No credits available. Contact your administrator.' No Claim, Buy, Daily Reward or Auto Refill screens.

Admin: privileged login/MFA, organization tree, branch overview, agents/players, wallet detail, Add Credits, Remove Credits, adjustment receipts, optional disabled transfer placeholders, audit, round detail and session/device management. The root role is called Main Admin, not an unexplained extra Owner tier.

## Adjustment interaction
Always show exact account identity, branch and available/reserved balance. Add is distinct from Remove. Require amount and reason; preview before/after and confirm. A successful operation has a transaction ID, not just a toast. A stale preview asks the admin to refresh; an insufficient-balance error never silently reduces the requested amount. Do not combine Remove and Delete Account.

## Mobile composition
Use a responsive logical play area, not a stretched screenshot. Native safe areas and aspect ratios are part of layout. Keep primary game action reachable in landscape, touch targets large (proposed >=44 CSS px, reviewed on devices), and balances/paytables readable. DOM UI for forms/rules/history complements the canvas. Match platform back/close behavior and preserve session state on rotation.

No large-win celebration for a payout below the stake. Show gross payout and net change clearly. Audio has separate music/effects controls; respect mute and reduced-motion settings. Limited auto-action modes are out of initial scope unless approved; never continue creating paid attempts while backgrounded.

## Art and consistency
Working names: Temple Lights, Orchard Numbers, Reef Party; final branding still open. Original symbols, fish sprites/animations, UI frame/icon language and licensed sound are required. Record source, creator, license, attribution and file hash for each external asset. User screenshots remain private references and never become app assets.

## Quality evidence
Screenshot/recording reviews on both actual OS families; visible loading/error/zero-credit/reconnect states; no clipped numbers or controls under safe areas; durable balance consistency across admin/player. Performance and first-playable targets must be measured on recorded device/network/cache settings. Stable interactions, original assets and correct recovery are as important as visual polish.

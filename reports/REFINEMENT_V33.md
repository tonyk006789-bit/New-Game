# V33 — win-frequency clarity, HD/QHD display and five music collections

## Delivered behavior

- The owner's clarification confirms the existing global 5%–50% slot/keno paying-round probability. Turning it down makes credit returns less frequent; every winning result still uses the same published award. The operator explanation now states this directly. No multiplier, hidden adjustment, per-player targeting, probability value or database change was introduced. Accepted rounds, fish and blackjack remain unchanged.
- Game Settings and the in-game toolbar offer 720p (1280×720), 1080p (1920×1080), and 2K/QHD (2560×1440). Default is 1080p and valid preferences persist locally. Twenty-five games remain landscape 16:9; Sapphire Crown, Aurora Vault, Midnight Express, Clockwork Vault and Celestial Wilds remain portrait 9:16, with the output dimensions reversed. Frames fit the available screen without stretching; no 4:3 tablet preset is used.
- Resolution sets maximum presentation size and fish canvas backing density (1×, 1.5×, 2×). DOM/vector content remains browser-native. On smaller screens every setting fits the available viewport; selecting QHD does not enlarge the device's physical display. Fish simulation and aiming coordinates stay unchanged. Classic three-reel cabinet backgrounds now fill their landscape frame.
- Five selectable music collections contain ten new original compositions: Neon Drive, Brass & Lights, Tropical Rush, Velvet Room and Cosmic Arcade. Each collection has two distinct arrangements, melodies and grooves using the existing original instrument bank. The existing 31 scene themes remain available under Game themes / Auto. Collection and track controls preserve independent music/effects settings, background suspension and a single scheduler.

## Changed files

- Operator explanation: `apps/admin/src/GamePolicyPanel.vue`; payout-identity test: `tests/unit/game-policy.test.ts`.
- Display: player `game-screen.ts`, `display-preferences.ts`, `ResolutionControl.vue`, `GameViewport.vue`, `App.vue`, `FishScene.vue`, `screen-v32.css`.
- Music/settings: player `music-collections.ts`, `music-score.ts`, `audio.ts`, `SettingsPanel.vue`.
- Tests/evidence: `tests/unit/audio-lifecycle.test.ts`, `tests/unit/display-music-v33.test.ts`, owner notes, asset-manifest generator/output and this report.

## Acceptance evidence

- `pnpm test:unit` — 199 tests passed in 30 files. New checks cover equal winning outcomes and rewards at 5% versus 50% for every slot/keno game; all resolution dimensions, fits and density factors; ten distinct melodic/rhythmic fingerprints; finite valid score events through 64 bars; collection switching and a single audio scheduler.
- `pnpm typecheck` and `pnpm lint` — passed.
- `pnpm test:integration` — 23 passed.
- `node scripts/asset-manifest.mjs` — 120 registered asset entries.
- `pnpm build:vercel` and `pnpm build:vercel-operator` — passed. Player entry `index-BqVvXRQJ.js`, CSS `index-rrXwT0m4.css`; operator entry `index-DxOr_CSE.js`.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` — seven passed, including API limits, fail-closed configuration and player/operator separation.
- `pnpm --dir apps/mobile exec cap copy` — copied web assets into both native projects. This is not native compilation or physical-device certification. The previously recorded Android Java/JAVA_HOME and iOS macOS/Xcode toolchain blocks remain; no native source was changed in V33.
- Browser: 720p produces a 1280×720 frame within a 1920×1080 viewport; 1080p fills 1920×1080; QHD fills 2560×1440, with no document overflow. At 844×390, Neon Sevens fits 693.33×390. Midnight Express retains a 390×693.33 portrait frame at a 390×844 viewport.
- Fish canvas at unchanged CSS dimensions of 1274×589 produced backing buffers of 1274×589, 1911×884 and 2548×1178 for the three settings. No paid hit was submitted. Music collection selection, track switching and ready status were checked through the real UI. Narrow settings overflow was found and corrected.
- Local screenshots are saved under ignored `reports/screenshots/v33/`: `music-settings.png`, `neon-phone.png`, `midnight-portrait.png`, `reef-quality.png`. HD/QHD measurements use DOM bounds because the browser screenshot surface may be smaller than the emulated viewport.

## Migration, rollback and limits

No database migration, rate-setting update, balance mutation, credential change or receipt rewrite is needed. Revert V33 presentation/audio files or redeploy the prior build to roll back; retain all existing database migrations and accepted history. Invalid saved quality/music selections fall back safely. The existing native/device release gates and two unapproved blackjack variant previews remain unchanged.

## Publication

Pending the existing authorized player/operator Vercel test-site deployment and read-only live verification.

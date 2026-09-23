# Research addendum | iteration 2
Research date: 17 September 2026. New research focused on mobile packaging, lifecycle, distribution, signing and explicit changes to the v1 plan. No authenticated JUWA calls, live keys or third-party packages were executed. The original code references remain potential dependencies; their presence in the index is not a security or asset-rights approval.

## Technical decision
Retain the proposed Vue/PixiJS client, NestJS/PostgreSQL services and Colyseus rooms. Add Capacitor, whose project documents cross-platform native packaging and whose root license is MIT [M01-M03]. This is the most direct incremental route from the earlier web-based architecture, not a claim it will meet fish-game performance without testing. Physical-device proof is a Sprint 0 gate.

No new open-source casino script is needed merely to add main-admin credit removal. That logic must be built and tested in our ledger and role model. The prior source candidates (Engine math SDK, vFair/Keno Server references, admin template, rendering/audio/testing libraries) remain subject to commit-specific license/security review. Do not import unverified fish assets or any implementation that changes player odds according to balance/identity.

## Mobile facts that affect the plan
Android and iOS project generation does not itself create a signed distributable app [M02,M13]. iOS build access requires macOS/Xcode [M02]. Android APKs differ from AAB publishing packages [M05]. TestFlight builds have a 90-day testing window [M06]. Unlisted iOS distribution is an approval-based possibility, not guaranteed and not private membership enforcement [M07]. App-review, age disclosures and native functionality must be considered even for a non-money social game [M08-M10]. Android alternative-install routes need current verification checks [M04,M12].

## Sources
Items S01-S24 are carried forward from the v1 register and must be rechecked before integration. Items M01-M14 were consulted for this iteration. The kit bundles no third-party implementation. Access dates are not release/version pins.

### S01 | PixiJS
Source: https://github.com/pixijs/pixijs
Status: MIT. Selected rendering dependency; 2D rendering, assets and input. Not game math.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S02 | Colyseus
Source: https://github.com/colyseus/colyseus
Status: MIT. Selected room/state synchronization foundation. Custom settlement and fish rules still required.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S03 | vue-pure-admin
Source: https://github.com/pure-admin/vue-pure-admin
Status: MIT. Selected administration-template candidate. Re-skin and replace demo authorization.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S04 | NestJS
Source: https://github.com/nestjs/nest
Status: MIT. Selected application framework; our domain services remain custom.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S05 | Engine math SDK
Source: https://github.com/engineio/math-sdk
Status: MIT. Offline slot math, simulations and distribution tooling. Not a full operator platform.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S06 | Engine web SDK
Source: https://github.com/engineio/web-sdk
Status: Root package declares MIT. Reference for event-driven slot presentation; Svelte-based, not our Vue shell.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S07 | vFair Games
Source: https://github.com/vfairgames/vfair-games
Status: Apache-2.0. Additional research lead: Keno, game-math and verification infrastructure. Not security-audited here.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S08 | vFair license
Source: https://raw.githubusercontent.com/vfairgames/vfair-games/main/LICENSE
Status: Apache-2.0. Root license text inspected. Review individual files, assets and notices before reuse.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S09 | Keno Server
Source: https://github.com/charliegdev/keno-server
Status: MIT. Small Express/AngularJS reference with a separate keno-math module. Do not adopt its old stack or branded paytable unchanged.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S10 | Keno Server license
Source: https://raw.githubusercontent.com/charliegdev/keno-server/master/LICENSE
Status: MIT. Root license text inspected.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S11 | Keno Plus
Source: https://github.com/kewlinnn/keno-plus
Status: Not established. Vue simulation and interaction reference only. No root license established; do not import code.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S12 | dwg255/fish
Source: https://github.com/dwg255/fish
Status: README claims MIT; unresolved. Fish-game reference only. Linked root license could not be verified; no approval for reuse.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S13 | Slotopol
Source: https://github.com/slotopol/server
Status: MIT. Research only; documented user-specific RTP and bank-dependent outcome skipping excluded from this project.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S14 | Howler.js
Source: https://github.com/goldfire/howler.js
Status: MIT. Optional audio dependency; audio assets need separate provenance.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S15 | Playwright
Source: https://github.com/microsoft/playwright
Status: Apache-2.0. Browser end-to-end and screenshot testing.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S16 | Kenney asset licensing
Source: https://kenney.nl/support
Status: CC0 asset pages. Starter asset source; confirm the included license of each downloaded pack.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S17 | Hypergeometric distribution
Source: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.hypergeom.html
Status: Documentation. Primary technical reference for exact keno match probabilities.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S18 | Node cryptography
Source: https://nodejs.org/api/crypto.html
Status: Documentation. crypto.randomInt provides unbiased integer sampling; production RNG is server-only.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S19 | PostgreSQL explicit locking
Source: https://www.postgresql.org/docs/current/explicit-locking.html
Status: Documentation. Row locking and transaction coordination for credit mutations.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S20 | OWASP authorization
Source: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
Status: Documentation. Deny by default and enforce authorization on every request.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S21 | OWASP WebSocket security
Source: https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html
Status: Documentation. Handshake/message authorization, origin checks, limits, and logging.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S22 | Codex getting started
Source: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
Status: Official OpenAI. Codex clients, account sign-in and product entry points.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S23 | Codex AGENTS.md
Source: https://developers.openai.com/codex/guides/agents-md/
Status: Official OpenAI documentation redirect. Repository instructions loaded by Codex; scope rules and testing expectations.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### S24 | Phaser
Source: https://github.com/phaserjs/phaser
Status: MIT. Alternative full client engine. Not added alongside PixiJS in the proposed v1.
Verification: Carried from the v1 source register, not re-audited in v2; recheck the chosen commit and all assets in S0.

### M01 | Capacitor cross-platform runtime
Source: https://capacitorjs.com/
Status: Official project. Shared web application packaged for Android/iOS; proposed addition to the v1 stack.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M02 | Capacitor environment setup
Source: https://capacitorjs.com/docs/getting-started/environment-setup
Status: Official documentation. macOS/Xcode for iOS; Android Studio/SDK for Android; pin exact compatible tooling in S0.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M03 | Capacitor source and MIT license
Source: https://raw.githubusercontent.com/ionic-team/capacitor/main/LICENSE
Status: MIT. Root license verified for research; preserve notices and recheck at selected revision.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M04 | Android alternative distribution
Source: https://developer.android.com/distribute/marketing-tools/alternative-distribution
Status: Official Android documentation. Direct APK and marketplace options; route needs owner approval.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M05 | Android bundle FAQ and signing
Source: https://developer.android.com/guide/app-bundle/faq
Status: Official Android documentation. APK installable versus AAB publishing format; signing requirements referenced separately.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M06 | TestFlight overview
Source: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
Status: Official Apple documentation. 90-day build test duration; review and tester distribution.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M07 | Unlisted app distribution
Source: https://developer.apple.com/support/unlisted-app-distribution/
Status: Official Apple documentation. Approved limited-audience distribution candidate; link discoverability is not login authorization.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M08 | Apple App Review Guidelines
Source: https://developer.apple.com/app-store/review/guidelines/
Status: Official Apple documentation. Original app-like functionality, truthful metadata/review access and policy review; no acceptance guarantee.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M09 | Apple age ratings
Source: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
Status: Official Apple documentation. Disclose simulated gambling accurately; country and rating review before release.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M10 | Capacitor privacy manifest
Source: https://capacitorjs.com/docs/ios/privacy-manifest
Status: Official project documentation. Review used APIs/plugins and required reasons; not a claim all plugins need the same manifest.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M11 | Capacitor app lifecycle API
Source: https://capacitorjs.com/docs/apis/app
Status: Official project documentation. Lifecycle events for background/resume; durable game recovery remains application work.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M12 | Android developer verification
Source: https://developer.android.com/developer-verification/guides/android-developer-console
Status: Official Android documentation. Current identity/package registration guidance for out-of-Play distribution; review rollout and applicable region.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M13 | Android signing
Source: https://developer.android.com/studio/publish/app-signing
Status: Official Android documentation. Signed release APKs/AABs and protection of release keys.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

### M14 | Codex repository instructions
Source: https://developers.openai.com/codex/guides/agents-md/
Status: Official OpenAI documentation. AGENTS.md workflow; official address currently redirects to ChatGPT Learn.
Verification: Official documentation consulted for iteration 2; no SDK execution or device validation performed.

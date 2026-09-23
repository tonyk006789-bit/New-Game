# Android + iOS delivery plan
## Proposed approach
Keep the existing proposed TypeScript/Vue/PixiJS game client and add Capacitor Android/iOS projects. This packages shared web-rendered gameplay in installable native apps; it is not a fully native renderer [M01-M03]. Keep the operator console a separate responsive web app. Supporting both OS families does not mean rewriting the backend twice.

Sprint 0 must exercise representative slot/keno scenes and a dense moving fish scene on an actual Android phone and iPhone. Define minimum devices/OS from the real group before setting support promises. Runtime minimum OS support is not proof of acceptable game performance. Pin the major version and compatible plugins rather than using 'latest' in unreviewed build scripts.

## Build requirements and artifacts
Capacitor iOS builds require macOS/Xcode (local Mac or a suitable macOS runner); Android requires Android Studio/SDK tooling. Current exact toolchain requirements must be pinned in S0 [M02]. Keep signing secrets in approved secure storage. No passwords, certificates or keys in chat, repo or downloadable handoff.

Android: debug/dev artifacts for engineering; signed APK for an approved direct-install beta, or signed AAB for Play submission. APKs are installable; AABs are publishing artifacts [M04-M05]. iOS: Xcode project, signed archive and App Store Connect/TestFlight distribution with the owner's approved account. Building project files is not evidence a distributable signed app exists.

## Distribution choices
TestFlight is an iOS beta route; each build is testable for up to 90 days and external testing may involve review [M06]. It is not an indefinite private-release workaround. For a limited audience, investigate Apple's unlisted App Store distribution; it requires review/approval and a direct link is not an authentication boundary [M07]. App login/invitations enforce private membership regardless of discoverability. Do not assume consumer-friend distribution qualifies for enterprise internal deployment.

Android permits direct APK distribution and store distribution [M04]. Review the current developer verification/package-registration requirements and applicable regional rollout before release [M12]; do not promise frictionless sideloading. Final route, countries and long-term maintenance are owner decisions.

No-money status does not remove the need for accurate simulated-gambling/age-rating answers, privacy information, functioning review access and an original app-like experience [M08-M10]. Store acceptance is not guaranteed by using Capacitor or by this plan. Keep review notes explicit: credits are nonpurchasable/nonredeemable, added by an administrator, with no money/prizes/external payment links.

## Mobile UX and lifecycle
Portrait lobby; landscape games with safe-area-aware HUD and a clear rotate treatment. Support touch, different aspect ratios, Android back and platform dismissal patterns. Use native lifecycle events to suspend input and resynchronize on resume [M11]. Persist only presentation/session metadata locally; credit truth and accepted results stay on the server. No fresh game action is accepted offline.

A phone call, lock screen, app background, killed process or dropped connection must not duplicate a stake or hide a committed result. Audio resumes only in a valid user-controlled state. On reentry fetch the authoritative wallet revision and last/unsettled round before enabling play. A second device must follow the approved session-takeover rule, with pending rounds still recoverable.

## Physical-device acceptance, proposed
Record at least one low-end Android, one current mid-range Android, the oldest supported iPhone, and one current iPhone; add tablet layout checks before claiming tablet support. Establish exact models/OS in S0. Run sustained fish play and repeated scene transitions for at least 20 minutes, collect frame timing/memory/crash and reconnection evidence. Aim for stable 60fps on reference devices and usable 30fps with reduced effects on the agreed floor; these are targets, not achieved measurements.

Inspect notches/home indicators, keno target legibility, balance truncation, mute/reduced motion, keyboard focus, cold start, Wi-Fi/mobile switching, update/reinstall and server-version mismatch. Browser tests complement rather than replace native tests. Signing, TestFlight/Play submission, account enrollment and third-party review times are explicit external dependencies.

# Deferred native device evidence

**Status: not run.** Owner confirmed no Android/iPhone devices currently available and deferred hands-on testing until the MVP. This does not certify Capacitor performance or lifecycle behavior.

The prototype includes a 20/40/80/120-fish PixiJS scene and an FPS display. Desktop test screenshots use Chromium software rendering. Do not report that FPS as phone performance.

When devices are available, record model, RAM, OS, refresh rate, app commit/build ID, device temperature, power mode, scene density, motion mode, network, and elapsed duration. Test one agreed minimum Android and iPhone plus current devices. Confirm the deployment floors before claiming compatibility.

1. Install actual native builds and check cold start, safe areas, back/dismissal and portrait/landscape layouts.
2. Run each game preview and repeated scene transitions. Run 80/120-fish scenes for at least 20 minutes; collect frame percentiles, memory trends, thermal behavior and crashes using platform tooling.
3. Background/lock/receive a call, resume, lose/regain network, and kill/relaunch the app. New actions must stop; later authenticated MVP tests must recover committed outcomes from the server without replaying touches.
4. Exercise reduced motion, actual sound interruptions once audio exists, large text, keyboard focus and keno touch targets.
5. Once sessions/ledger exist, test same-account Android-to-iOS recovery and the approved takeover policy, ensuring accepted rounds still settle.

Capture device recordings and instrumentation results. If the agreed renderer gate fails after a bounded optimization pass, report the measurements before proposing an engine change.

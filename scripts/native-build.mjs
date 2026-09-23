import { spawnSync } from 'node:child_process';
const platform = process.argv[2];
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.bat') });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  process.exit(result.status ?? 1);
}
if (platform === 'android') {
  run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['assembleDebug'], 'apps/mobile/android');
} else if (platform === 'ios') {
  if (process.platform !== 'darwin') { console.error('BLOCKED: iOS compilation requires macOS and Xcode 26+. Project generation is not a native build.'); process.exit(1); }
  run('xcodebuild', ['-project', 'App.xcodeproj', '-scheme', 'App', '-configuration', 'Debug', '-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator', 'CODE_SIGNING_ALLOWED=NO', 'build'], 'apps/mobile/ios/App');
} else { console.error('Usage: node scripts/native-build.mjs android|ios'); process.exit(1); }

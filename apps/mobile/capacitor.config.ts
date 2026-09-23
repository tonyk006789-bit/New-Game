import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.newgame.arcade',
  appName: 'New Game',
  webDir: '../player/dist',
  backgroundColor: '#0b101b',
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' }
};
export default config;

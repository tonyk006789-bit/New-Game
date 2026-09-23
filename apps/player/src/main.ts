import { createApp } from 'vue';
import App from './App.vue';
import '@new-game/ui/theme.css';
import './style.css';
import './games-v3.css';
import './arcade-v4.css';
import './staging-v5.css';
import './arcade-v6.css';
import './arcade-v7.css';
import './arcade-v8.css';
import './arcade-v9.css';
import './arcade-v10.css';
// Shared test links use HTTPS. Never render a sign-in form on a remote HTTP origin.
if(location.protocol==='http:'&&!['127.0.0.1','localhost'].includes(location.hostname))location.replace(`https://${location.host}${location.pathname}${location.search}`);
else createApp(App).mount('#app');

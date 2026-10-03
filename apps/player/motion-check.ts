// Separate development entry; Vite's production build includes index.html only.
import {createApp} from 'vue';
import MotionCheck from '../../tests/browser/MotionCheck.vue';
import './src/style.css';
import './src/games-v3.css';
import './src/arcade-v4.css';
import './src/arcade-v16.css';
import './src/arcade-v19.css';
createApp(MotionCheck).mount('#app');

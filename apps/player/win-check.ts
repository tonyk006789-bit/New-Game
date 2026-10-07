// Development visual acceptance only; production has one index.html entry.
import {createApp} from 'vue';
import Check from '../../tests/browser/WinEffectsCheck.vue';
import './src/arcade-v24.css';
import './src/arcade-v26.css';
createApp(Check).mount('#app');

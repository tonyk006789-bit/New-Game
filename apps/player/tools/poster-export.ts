// Local authoring surface only. Not an entry point in the player build.
import {createApp,h} from 'vue';
import {catalog} from '@new-game/contracts';
import PosterSource from './PosterSource.vue';
import './poster-styles';
if(import.meta.env.DEV){
 const style=document.createElement('style');style.textContent='html,body,#app{margin:0;padding:0;width:2400px;max-width:none;background:#100c1d}#app{display:grid;grid-template-columns:repeat(5,480px)}.export-tile{width:480px;height:480px;position:relative;container-type:inline-size;overflow:hidden}.export-tile>.rich-poster{position:absolute;inset:0;width:100%;height:100%;border-radius:0}';document.head.append(style);
 createApp({render:()=>catalog.map(game=>h('div',{class:'export-tile','data-game':game.id},[h(PosterSource,{game:game.id,name:game.name})]))}).mount('#app');
}

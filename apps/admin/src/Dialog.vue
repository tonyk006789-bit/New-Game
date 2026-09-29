<script setup lang="ts">
import {onMounted,ref,useId} from 'vue';
const props=defineProps<{title:string;busy?:boolean}>();
const emit=defineEmits<{close:[]}>();
const dialog=ref<HTMLDialogElement>();
const titleId=useId();
onMounted(()=>dialog.value?.showModal());
function cancel(event:Event){event.preventDefault();if(!props.busy)emit('close');}
</script>
<template><dialog ref="dialog" class="dialog" :aria-labelledby="titleId" @cancel="cancel"><header><h2 :id="titleId">{{title}}</h2><button type="button" class="close" aria-label="Close dialog" :disabled="busy" @click="emit('close')">×</button></header><slot/></dialog></template>

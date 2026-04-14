<script setup>
import {onMounted, ref} from "vue";
import FlyerPlayer from "./FlyerPlayer.vue";

const flyerPlay = ref()
onMounted(() => {
  const url = '/api/hls/Charlie1001/index.m3u8'
  flyerPlay.value.play(url)
})
</script>

<template>
  <div style="position: relative;z-index: 999;width:50%;height: 80%;">
    <FlyerPlayer ref="flyerPlay"></FlyerPlayer>
  </div>
</template>

<style scoped>

</style>
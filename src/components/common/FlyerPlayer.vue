<script setup>
import {ref} from "vue";

const videoRef = ref()
const controls = ref(true)

const play = (videoPath) => {
  videoRef.value.src = videoPath
  videoRef.value.play()
}
const stop = () => {
  videoRef.value.pause()
}
defineExpose({play, stop})
</script>

<template>
  <div style="position: relative;z-index: 999;width:100%;height: 100%;">
    <video ref="videoRef" :controls="controls" style="background: black;width:100%;height:100%;" @mouseover="()=> controls = true" @mouseleave="()=> controls = false">
    </video>
  </div>
</template>

<style scoped>

</style>
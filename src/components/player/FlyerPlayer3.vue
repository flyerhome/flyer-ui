<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
const dataList = ref([])
// hls实例（用于销毁，防止内存泄漏）
const videoRef = ref()

const controls = ref(true)
const widthRate = ref(90)
const url = ref('http://localhost:8888/api/video/Charlie1002/20260406A0002.mp4')
const playNow = () => {
  const video = videoRef.value;
  video.src = url.value
  video.play()
}
</script>

<template>

<div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">
  <div :style="{width: widthRate + '%'}" >
    <a-input v-model:value="url" style="width: calc(80% - 10px); margin-right: 10px;"></a-input>
    <a-button style="width: 20%" type="primary" @click="playNow()">播放</a-button>
  </div>
  <video ref="videoRef" :controls="controls" style="background: black;height:calc(100% - 80px);margin-top: 10px;" :style="{width: widthRate + '%'}" >
    <source :src="url">
  </video>

</div>
</template>

<style scoped>

</style>
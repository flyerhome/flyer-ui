<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
const dataList = ref([])
// hls实例（用于销毁，防止内存泄漏）
const videoRef = ref()

const controls = ref(true)
const widthRate = ref(90)
const url = import.meta.env.VITE_APP_API_URL + '/tmp/20260402/坚持学英语口语第12天/坚持学英语口语第12天.mp4'
</script>

<template>
<div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">
  <video ref="videoRef" :controls="controls" style="background: black;height:calc(99% - 60px);" :style="{width: widthRate + '%'}" >
    <source :src="url">
  </video>

</div>
</template>

<style scoped>

</style>
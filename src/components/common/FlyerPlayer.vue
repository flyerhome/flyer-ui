<script setup>
import {ref} from "vue";

const videoRef = ref()
const videoId = ref()
const controls = ref(true)
const emits = defineEmits(["timeUpdate"])
defineProps({
  width:{
    type: String,
    default:'100%'
  },
  height:{
    type: String,
    default:'100%'
  }
})
const play = (vid, videoPath) => {
  videoId.value = vid
  videoRef.value.src = videoPath
  videoRef.value.play()
}
const restart = (time) => {
  videoRef.value.currentTime = time
  videoRef.value.play()
}
const stop = () => {
  videoRef.value.pause()
}
const currentTime = (val) => {
  if (val !== undefined) {
    videoRef.value.currentTime = val;
  }
  return videoRef.value.currentTime
}

const currentSpeed = () => {
  return videoRef.value.playbackRate;
}

defineExpose({play, stop, currentTime, restart, currentSpeed})

// 恢复播放进度
const resumePlayTime = () => {
  const video = videoRef.value
  if (!video) return
  if (videoId.value.startsWith('TED')) {
    return;
  }
  const lastTime = localStorage.getItem('video_last_time_' + videoId.value)
  if (lastTime && !isNaN(lastTime)) {
    video.currentTime = Number(lastTime)
  }
}

window.addEventListener('beforeunload', () => {
  localStorage.setItem('video_last_time_' + videoId.value, currentTime())
})
const skip = (seconds) => {
  const video = videoRef.value;
  video.currentTime += seconds;
}
const togglePlay = () => {
  const video = videoRef.value;
  video.paused ? video.play() : video.pause();
}

const volume = (value) => {
  const video = videoRef.value;
  if (video.volume*100 + value <= 0) {
    video.volume = 0
    return;
  }
  if (video.volume*100 + value >= 100) {
    video.volume = 1
    return;
  }
  video.volume = parseFloat((video.volume*100 + value)/100)
}

document.addEventListener('keydown', (e) => {
  console.log("keydown", e.key, e.code)
  if (e.key === 'ArrowLeft') skip(-2);
  if (e.key === 'ArrowRight') skip(2);
  if (e.key === 'ArrowUp') volume(2);
  if (e.key === 'ArrowDown') volume(-2);
})
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    togglePlay()
  }
})
const timeupdate = (event) => {
  emits('timeUpdate', event.target.currentTime)
}
</script>

<template>
    <video ref="videoRef" @loadedmetadata="resumePlayTime" @timeupdate="timeupdate" :controls="controls" style="display: block;background: lightblue;" :style="{width:width, height:height}" @mouseover="()=> controls = true" @mouseleave="()=> controls = false">
    </video>
</template>

<style scoped>

</style>
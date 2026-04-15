<script setup>
import {ref} from "vue";

const videoRef = ref()
const videoId = ref()
const controls = ref(true)

const play = (vid, videoPath) => {
  videoId.value = vid
  videoRef.value.src = videoPath
  videoRef.value.play()
}
const stop = () => {
  videoRef.value.pause()
}
const currentTime = () => {
  return videoRef.value.currentTime
}
defineExpose({play, stop, currentTime})

// 恢复播放进度
const resumePlayTime = () => {
  const video = videoRef.value
  if (!video) return

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

</script>

<template>
  <div style="position: relative;z-index: 999;width:100%;height: 100%;">
    <video ref="videoRef" @loadedmetadata="resumePlayTime" :controls="controls" style="background: black;width:100%;height:100%;" @mouseover="()=> controls = true" @mouseleave="()=> controls = false">
    </video>
  </div>
</template>

<style scoped>

</style>
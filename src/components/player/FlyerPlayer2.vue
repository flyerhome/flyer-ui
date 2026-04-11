<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
import {aget, apost} from "../../utils/Http.js";
import {message} from "ant-design-vue";
const dataList = ref([])
// hls实例（用于销毁，防止内存泄漏）
let hlsInstance = null
const videoRef = ref()

const controls = ref(false)

function skip(seconds) {
  const video = videoRef.value;
  video.currentTime += seconds;
}
const playState = ref(0);
function togglePlay() {
  const video = videoRef.value;
  video.paused ? video.play() : video.pause();

}
function play() {
  const video = videoRef.value;
  video.play()
}
function stop() {
  const video = videoRef.value;
  video.pause()
}
function setSpeed(rate) {
  const video = videoRef.value;
  video.playbackRate = rate;
}

function setVolumn(e, val1, val2) {
  const video = videoRef.value;
  console.log("change volumn", volumnVal.value)
  video.volume = volumnVal.value/100
}
document.addEventListener('keydown', (e) => {
  console.log("keydown", e.key, e.code)
  if (e.key === 'ArrowLeft') skip(-2);
  if (e.key === 'ArrowRight') skip(2);
})
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    togglePlay()
  }
})

// 组件挂载后初始化播放器
onMounted(() => {
})

// 销毁实例：组件卸载时清理，防止内存泄漏
const destroyHls = () => {
  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }
}

// 组件卸载前销毁播放器
onBeforeUnmount(() => {
  destroyHls()
})
const speedVal = ref(1)
const volumnVal = ref(10)
const movieItem = ref()


window.addEventListener('beforeunload', () => {
  console.log("检测到unload")
  const video = videoRef.value
  if (video) {
    localStorage.setItem('video_last_time_' + movieItem.value, video.currentTime)
  }
})
// 恢复播放进度
function resumePlayTime() {
  const video = videoRef.value
  if (!video) return

  const lastTime = localStorage.getItem('video_last_time_' + movieItem.value)
  if (lastTime && !isNaN(lastTime)) {
    video.currentTime = Number(lastTime)
  }
}
const cutVideo = () => {
  const hide = message.loading('请耐心等候...', 0);
  apost('/player2/video-edit', {
    video_path: url.value,
    start_time: startValue.value,
    end_time: endValue.value,
    save_name:editName.value
  }, res => {
    editVideoList.value = []
    hide()
    message.success("已截取成功")
    viewNote()
  }, err => {
    hide()
    message.error("截取失败" + err)
  })
}
const cutAudio = () => {
  const hide = message.loading('请耐心等候...', 0);
  apost('/player2/video-edit', {
    video_path: url.value,
    start_time: startValue.value,
    end_time: endValue.value,
    save_name:editName.value,
    cut_audio:1
  }, res => {
    editVideoList.value = []
    hide()
    message.success("已截取成功")
    viewNote()
  }, err => {
    hide()
    message.error("截取失败：" + err)
  })
}
const viewNote = () => {
  stop()
  queryEditVideoList(movieItem.value)
  visible.value = true

}
function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}
const widthRate = ref(90)
const startValue = ref('00:00:00')
const endValue = ref('00:00:00')
const markStart = () => {
  const video = videoRef.value
  startValue.value = formatTime(video.currentTime)
}
const markEnd = () => {
  const video = videoRef.value
  endValue.value = formatTime(video.currentTime)
}
const editVideoList = ref([])

const queryEditVideoList = (vid) => {
  aget('/player2/edit/list', (res) => {
    editVideoList.value = res.data
  }, err => {

  })
}
const visible = ref(false)
const apiPref = import.meta.env.VITE_APP_API_URL
const editName = ref('')
const url = ref('http://localhost:8888/api/hls/Charlie1001/index.m3u8')
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
    <video ref="videoRef" @loadedmetadata="resumePlayTime" :controls="controls" style="background: black;height:calc(69% - 60px);margin-top: 10px" :style="{width: widthRate + '%'}"  @mouseover="()=> controls = true" @mouseleave="()=> controls = false">
    </video>
    <div :style="{width: widthRate + '%',marginTop: '10px'}">
      <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markStart">标记起点</a-button>
      <a-input v-model:value="startValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
      <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markEnd">标记终点</a-button>
      <a-input v-model:value="endValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
      <a-input v-if="false" v-model:value="editName" style="width: calc(15% - 10px);margin-right:10px;" placeholder="文件命名"></a-input>
      <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="cutVideo">开始截取视频</a-button>
      <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="cutAudio">开始截取音频</a-button>
      <a-button type="primary" :style="{width: '10%'}" @click="viewNote">查看记录</a-button>
    </div>
  </div>

  <a-drawer
      v-model:open="visible"
      class="custom-class"
      title="历史剪辑"
      placement="right"
  >
    <div v-for="file in editVideoList">
      <figure>
        <figcaption><a :href="apiPref + file.url" :download="file.name">{{file.name}}</a></figcaption>
        <figcaption>{{file.time}}</figcaption>
        <video v-if="file.url.endsWith('.mp4')" style="width: 90%" controls :src="apiPref + file.url"></video>
        <audio v-if="file.url.endsWith('.mp3')" style="width: 90%" controls :src="apiPref + file.url"></audio>
        <audio v-if="file.url.endsWith('.m4a')" style="width: 90%" controls :src="apiPref + file.url"></audio>
        <audio v-if="file.url.endsWith('.wav')" style="width: 90%" controls :src="apiPref + file.url"></audio>
      </figure>
    </div>
  </a-drawer>
</template>

<style scoped>

</style>
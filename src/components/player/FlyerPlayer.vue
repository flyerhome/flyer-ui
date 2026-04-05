<script setup>
import Hls from 'hls.js'
import {onBeforeUnmount, onMounted, ref} from "vue";
import {aget, apost} from "../../utils/Http.js";
import {message} from "ant-design-vue";
const dataList = ref([])
// hls实例（用于销毁，防止内存泄漏）
let hlsInstance = null
const videoRef = ref()

const controls = ref(false)

const queryList = (call) => {
  dataList.value = []
  aget('/player/list', (res)=> {
    console.log('查询结果', res)
    if (res.success) {
      dataList.value = res.data
      if (!!call) {
        call()
      }
    }
  }, (e) => {

  })
}

const loadVideo = (vid) => {
  const data = dataList.value.find(item => item.vid === vid)
  if (!!!data) {
    return
  }
  const url = import.meta.env.VITE_APP_API_URL + data.url
  const videoElement = videoRef.value
  if (hlsInstance) {
    hlsInstance.loadSource(url)
    return;
  }

  if (!videoElement) return

  // 1. 检测浏览器是否支持hls.js
  if (Hls.isSupported()) {
    // 初始化hls实例
    hlsInstance = new Hls({
      // 基础配置，可根据需求调整
      enableWorker: true, // 开启web worker提升性能
      lowLatencyMode: false // 关闭低延迟模式（点播场景使用）
    })

    // 绑定视频源
    hlsInstance.loadSource(url)
    hlsInstance.attachMedia(videoElement)

    // 监听资源解析完成事件
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('HLS视频解析成功，可播放')
      // 如需自动播放，浏览器限制必须静音或用户交互后触发
      videoElement.play()
      playState.value = 1
      webSpeech()
    })

    // 监听错误事件
    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS播放错误：', data)
      // 网络错误自动重试
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('网络异常，尝试恢复')
            hlsInstance.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('媒体解码异常，尝试恢复')
            hlsInstance.recoverMediaError()
            break
          default:
            // 无法恢复，销毁实例
            destroyHls()
            break
        }
      }
    })
  }
  // 兼容Safari原生HLS支持
  else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = url
    videoElement.play()
    playState.value = 1
    webSpeech()
  }
}
let recognition = null;
const webSpeech = () => {
  const video = videoRef.value;
  video.captureStream()
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true; // 连续识别
  recognition.interimResults = true; // 返回临时结果
  recognition.lang = 'zh-CN'; // 中文识别

  recognition.onresult = (e) => {
    const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
    console.log('实时台词：', text); // 渲染到页面
  };
  recognition.onerror = (e) => console.error('识别失败：', e.error);
}
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
  queryList(() => {
    const item = dataList.value[0]
    movieItem.value = item.vid
    loadVideo(item.vid)
  });
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
const videoEdit = () => {
  const data = dataList.value.find(item => item.vid === movieItem.value)
  if (!!!data) {
    return
  }
  apost('/player/video-edit', {
    video_path: data.url,
    start_time: startValue.value,
    end_time: endValue.value,
  }, res => {
    message.success("剪辑成功")
  }, err => {

  })
}
const viewVideo = () => {
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
  editVideoList.value = []
  aget('/player/edit/list?vid='+vid, (res) => {
    editVideoList.value = res.data
  }, err => {

  })
}
const visible = ref(false)
const apiPref = import.meta.env.VITE_APP_API_URL
</script>

<template>
<div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">
  <a-select v-model:value="movieItem" @change="(vid) => {loadVideo(vid);}" :style="{width: widthRate + '%',marginBottom: '10px'}" placeholder="选择聚集">
    <a-select-option v-for="item in dataList" :value="item.vid">{{ item.name }}</a-select-option>
  </a-select>
  <video ref="videoRef" @loadedmetadata="resumePlayTime" :controls="controls" style="background: black;height:calc(69% - 60px);" :style="{width: widthRate + '%'}"  @mouseover="()=> controls = true" @mouseleave="()=> controls = false">
  </video>
  <div :style="{width: widthRate + '%',marginTop: '10px'}">
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markStart">标记起点</a-button>
    <a-input v-model:value="startValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markEnd">标记终点</a-button>
    <a-input v-model:value="endValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="videoEdit">开始剪辑</a-button>
    <a-button type="primary" :style="{width: '10%'}" @click="viewVideo">查看剪辑</a-button>
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
        <video style="width: 90%" controls :src="apiPref + file.url"></video>
      </figure>
    </div>
  </a-drawer>
</template>

<style scoped>

</style>
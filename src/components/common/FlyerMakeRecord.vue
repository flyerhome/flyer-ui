<template>
  <video v-show="show" ref="previewRef" autoplay muted playsinline style="display: block;background: lightblue;" :style="{width:width, height:height}"></video>
  <a-drawer :width="720"
      v-model:open="visible"
      class="custom-class"
      title="录音记录"
      placement="right"
  >
    <div v-for="(rec, index) in recordings.slice().reverse()">
      <figure>
        <figcaption><a href="javascript:" @click="downloadRecording(rec.blob, index)">{{ rec.name }}</a></figcaption>
        <figcaption>{{rec.time}}</figcaption>
        <figcaption>{{rec.meta.url + " from " + rec.meta.start + ' to ' + rec.meta.end}}</figcaption>
        <audio :src="rec.url" :controls="true" style="width: 90%"></audio>
      </figure>
    </div>
  </a-drawer>
</template>

<script setup>
import {ref, computed, onUnmounted, watch, reactive, onMounted} from 'vue'
import {message} from "ant-design-vue";

const visible = ref(false)
const previewRef = ref()
// 状态
const isRecording = ref(false)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const startTime = ref(0)
const currentTime = ref(0)
let timerInterval = null
const maxTime = ref(20)

// 录音列表
const recordings = ref([])
const emits = defineEmits(["upload","loaded", "resetVideo"])

defineProps({
  width:{
    type: String,
    default:'100%'
  },
  height:{
    type: String,
    default:'100%'
  },
  show:{
    type:Boolean,
    default: false
  }
})
// 格式化时间
const formattedTime = computed(() => {
  const minutes = Math.floor(currentTime.value / 60)
  const seconds = currentTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 更新计时器
const updateTimer = () => {
  if (currentTime.value >= maxTime.value) {
    stopRecording()
    return;
  }
  currentTime.value = Math.floor((Date.now() - startTime.value) / 1000)

}
const loadRecording = async () => {
  try {
    // const stream = await navigator.mediaDevices.getUserMedia({ audio: true,video:true })
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,    // 关闭回声消除（根据需求）
        noiseSuppression: false,    // 关闭降噪，保留更多声音细节
        autoGainControl: false,     // 关闭自动增益，让声音动态更自然
        sampleRate: 44100,          // 设置采样率为44.1kHz (CD音质标准)
        channelCount: 1,            // 单声道即可，双声道文件会大一倍
      },
      video: true
    })
    previewRef.value.srcObject = stream
    // 2. 设置MediaRecorder时，指定音频比特率
    const mediaRecorderOptions = {
      mimeType: 'video/webm',       // 保持你原来的格式
      audioBitsPerSecond: 128000,   // 关键！设置比特率为128kbps
      // videoBitsPerSecond: 2500000, // 如果需要，也可以设置视频比特率
    };
    mediaRecorder.value = new MediaRecorder(stream, mediaRecorderOptions)

    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      console.log("看看是不是运行" + event.data.size)
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'video/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const timestamp = new Date().toLocaleTimeString()
      const r = {
        url: audioUrl,
        name:`record_${Date.now()}.webm`,
        blob: audioBlob,
        time: timestamp,
        duration: formattedTime.value,
        meta: JSON.parse(JSON.stringify(meta))
      }
      recordings.value.push(r)
      emits("upload", r)
      // 释放麦克风
      stream.getTracks().forEach(track => track.stop())
    }
  } catch (error) {
    console.error('录音失败:', error)
    message.warn('无法访问麦克风，请检查权限')
  }
}
// 开始录音
const startRecording = async () => {
  mediaRecorder.value.start()
  startTime.value = Date.now()
  currentTime.value = 0
  emits("resetVideo")
  timerInterval = setInterval(updateTimer, 1000)
  isRecording.value = true
}
// 停止录音
const stopRecording = (flag) => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop()
    clearInterval(timerInterval)
    isRecording.value = false
    currentTime.value = 0;
    if (!flag) {
      visible.value = true
    }
    loadRecording()
  }
}
const startTest = () => {

}
const showNotes = () => {
  visible.value = true;
}
const updateMaxTime = (max) => {
  maxTime.value = max
}
const meta = reactive({
  url:'',
  vid:'',
  start:'00:00:00',
  end:'00:00:00',
})
const setRecordMeta = (data) => {
  meta.url = data.url
  meta.start = data.start
  meta.end = data.end
}
const getRecording = () => {

}
defineExpose({startRecording, stopRecording,showNotes,updateMaxTime,setRecordMeta})
// 下载录音
const downloadRecording = (blob, index) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `recording_${Date.now()}_${index + 1}.webm`
  a.click()
  URL.revokeObjectURL(url)
}

// 组件卸载时清理
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    currentTime.value = 0;
  }
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop()
  }
})
onMounted(() => {
  loadRecording()
})
// 检查兼容性
if (!navigator.mediaDevices || !window.MediaRecorder) {
  message.warn('您的浏览器不支持录音功能')
}
</script>

<style scoped>
</style>
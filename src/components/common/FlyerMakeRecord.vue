<template>
  <div style="width:100%;height:100%; padding:10px;display: flex; flex-direction: column;flex-wrap: wrap;align-content: center;align-items: center;gap: 10px;">
    <div>
      <a-progress type="circle" :percent="currentTime*100/maxTime" :format="percent => formattedTime" />
    </div>

    <div style="display: flex; flex-direction: row;flex-wrap: wrap;align-content: center;align-items: center;gap: 10px">
      <a-button style="" type="primary" @click="startRecording" :disabled="isRecording">开始录音</a-button>
      <a-button style=""  type="primary" @click="stopRecording" :disabled="!isRecording">停止录音</a-button>
      <a-button @click="visible = true" >录音记录</a-button>
    </div>
    <div style="width: 80%;height: 50%;display: block">
      <video style="width: 1000px;height: 100%" id="preview" autoplay muted playsinline></video>
    </div>
  </div>
  <a-drawer
      v-model:open="visible"
      class="custom-class"
      title="录音记录"
      placement="right"
  >
    <div v-for="(rec, index) in recordings.slice().reverse()">
      <figure>
        <figcaption><a href="javascript:" @click="downloadRecording(rec.blob, index)">录音 {{ index + 1 }}</a></figcaption>
        <figcaption>{{rec.time}}</figcaption>
        <audio :src="rec.url" :controls="true" style="width: 90%"></audio>
      </figure>
    </div>
  </a-drawer>
</template>

<script setup>
import {ref, computed, onUnmounted, watch} from 'vue'
import {message} from "ant-design-vue";

const visible = ref(false)
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

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true,video:true })
    const previewVideo = document.getElementById('preview');
    previewVideo.srcObject = stream; // 在页面上显示预览
    mediaRecorder.value = new MediaRecorder(stream, { mimeType: 'video/webm' })
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

      recordings.value.push({
        url: audioUrl,
        blob: audioBlob,
        time: timestamp,
        duration: formattedTime.value
      })

      // 释放麦克风
      stream.getTracks().forEach(track => track.stop())
      visible.value = true
    }

    mediaRecorder.value.start()
    startTime.value = Date.now()
    currentTime.value = 0
    timerInterval = setInterval(updateTimer, 1000)
    isRecording.value = true

  } catch (error) {
    console.error('录音失败:', error)
    message.warn('无法访问麦克风，请检查权限')
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop()
    clearInterval(timerInterval)
    isRecording.value = false
    currentTime.value = 0;
  }
}

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

// 检查兼容性
if (!navigator.mediaDevices || !window.MediaRecorder) {
  message.warn('您的浏览器不支持录音功能')
}
</script>

<style scoped>
</style>
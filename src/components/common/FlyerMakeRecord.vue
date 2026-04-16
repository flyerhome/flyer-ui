<template>
  <div style="width:100%;height:100%;display: flex; flex-direction: column;flex-wrap: wrap;align-content: center;align-items: center;gap: 10px;">
<!--    <div>
      <a-progress type="circle" :percent="currentTime*100/maxTime" :format="percent => formattedTime" />
    </div>-->

<!--    <div style="display: flex; flex-direction: row;flex-wrap: wrap;align-content: center;align-items: center;gap: 10px">
      <a-button style="" type="primary" @click="startRecording" :disabled="isRecording">开始录音</a-button>
      <a-button style=""  type="primary" @click="stopRecording" :disabled="!isRecording">停止录音</a-button>
      <a-button @click="visible = true" >录音记录</a-button>
    </div>-->
    <video style="width: 1000px;height: 100%" id="preview" autoplay muted playsinline></video>
  </div>
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
import {ref, computed, onUnmounted, watch, reactive} from 'vue'
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
const emits = defineEmits(["upload","loaded", "resetVideo"])
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

    mediaRecorder.value.start()
    startTime.value = Date.now()
    currentTime.value = 0
    emits("resetVideo")
    timerInterval = setInterval(updateTimer, 1000)
    isRecording.value = true

  } catch (error) {
    console.error('录音失败:', error)
    message.warn('无法访问麦克风，请检查权限')
  }
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
  }
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

// 检查兼容性
if (!navigator.mediaDevices || !window.MediaRecorder) {
  message.warn('您的浏览器不支持录音功能')
}
</script>

<style scoped>
</style>
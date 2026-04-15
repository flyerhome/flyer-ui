<script setup>
import {onMounted, ref} from "vue";
import {aget, apost} from "../../utils/Http.js";
import {message} from "ant-design-vue";
import FlyerPlayer from "../common/FlyerPlayer.vue";
const dataList = ref([])

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

// 组件挂载后初始化播放器
onMounted(() => {
  queryList(() => {
    const item = dataList.value[0]
    movieItem.value = item.vid
    selectToPlay(item.vid)
  });
})

const movieItem = ref()



const cutVideo = () => {
  const data = dataList.value.find(item => item.vid === movieItem.value)
  if (!!!data) {
    return
  }
  const hide = message.loading('请耐心等候...', 0);
  apost('/player/video-edit', {
    video_path: data.url,
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
  const data = dataList.value.find(item => item.vid === movieItem.value)
  if (!!!data) {
    return
  }
  const hide = message.loading('请耐心等候...', 0);
  apost('/player/video-edit', {
    video_path: data.url,
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
  flyerPlayerRef.value.stop()
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
  startValue.value = formatTime(flyerPlayerRef.value.currentTime())
}
const markEnd = () => {
  endValue.value = formatTime(flyerPlayerRef.value.currentTime())
}
const editVideoList = ref([])

const queryEditVideoList = (vid) => {
  aget('/player/edit/list?vid='+vid, (res) => {
    editVideoList.value = res.data
  }, err => {

  })
}
const visible = ref(false)
const apiPref = import.meta.env.VITE_APP_API_URL
const editName = ref('')

const flyerPlayerRef = ref()
const selectToPlay = (vid) => {
  const data = dataList.value.find(item => item.vid === vid)
  if (!!!data) {
    return
  }
  const url = import.meta.env.VITE_APP_API_URL + data.url
  flyerPlayerRef.value.play(vid,url)
}
</script>

<template>
<div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">
  <a-select v-model:value="movieItem" @change="(vid) => {selectToPlay(vid);}" :style="{width: widthRate + '%',marginBottom: '10px'}" placeholder="选择聚集">
    <a-select-option v-for="item in dataList" :value="item.vid">{{ item.name }}</a-select-option>
  </a-select>
  <div style="background: black;height:calc(69% - 60px);" :style="{width: widthRate + '%'}" >
    <FlyerPlayer ref="flyerPlayerRef"></FlyerPlayer>
  </div>
<!--  <video ref="videoRef" @loadedmetadata="resumePlayTime" :controls="controls" style="background: black;height:calc(69% - 60px);" :style="{width: widthRate + '%'}"  @mouseover="()=> controls = true" @mouseleave="()=> controls = false">-->
<!--  </video>-->
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
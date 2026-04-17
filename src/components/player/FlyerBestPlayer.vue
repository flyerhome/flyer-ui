<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {aget, apost} from "../../utils/Http.js";
import {message} from "ant-design-vue";
import FlyerPlayer from "../common/FlyerPlayer.vue";
import FlyerMakeRecord from "../common/FlyerMakeRecord.vue";
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
const startValue = ref(0.0)
const endValue = ref(0.0)
const markStart = () => {
  startValue.value = flyerPlayerRef.value.currentTime()
}
const markEnd = () => {
  endValue.value = flyerPlayerRef.value.currentTime()
}
const editVideoList = ref([])
const recordVideoList = ref([])

const queryEditVideoList = (vid) => {
  aget('/player/edit/list?vid='+vid, (res) => {
    editVideoList.value = res.data
  }, err => {

  })
}
const queryRecordVideoList = () => {
  aget('/player/record/list', (res) => {
    recordVideoList.value = res.data
  }, err => {

  })
}
const visible = ref(false)
const apiPref = import.meta.env.VITE_APP_API_URL
const editName = ref('')

const flyerPlayerRef = ref()
const flyerMakeRecordRef = ref()
const startRecordFlag = ref(false)
const recordVisible = ref(false)
const selectToPlay = (vid) => {
  const data = dataList.value.find(item => item.vid === vid)
  if (!!!data) {
    return
  }
  url.value = data.url
  flyerPlayerRef.value.play(vid,apiPref + url.value)
  loadSubtitle(apiPref + url.value)
}
const recordMeta = reactive({
  url:'',
  start:'',
  end:'',
})
const startRecord = () => {
  flyerMakeRecordRef.value.updateMaxTime(60 * 60)
  flyerMakeRecordRef.value.startRecording()
  startRecordFlag.value = true;
}
const uploadRecord = () => {

}
const stopRecord = () => {
  flyerMakeRecordRef.value.setRecordMeta(recordMeta)
  recordMeta.end = formatTime(flyerPlayerRef.value.currentTime())
  flyerMakeRecordRef.value.stopRecording(true)
  flyerPlayerRef.value.stop();
  startRecordFlag.value = false;
  formData = new FormData()
}
const showRecord = () => {
  recordVisible.value = true
  queryRecordVideoList()
}
const mergeRecord = () => {

}
let formData =  new FormData();
const modalHandleOk = async () => {
  modalVisible.value = false
  formData.append('video_voice', videoVoiceValue.value)
  formData.append('record_voice', recordVoiceValue.value)
  try {
    const response = await fetch( apiPref + '/player/record/merge', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    showRecord()
    console.log('上传成功', result);
  } catch (error) {
    console.error('上传失败', error);
  }
}
const recordUpload = async (r) => {
  modalVisible.value = true;

  formData.append('record', r.blob, r.name); // 第三个参数是文件名
  formData.append('video_path', url.value)
  formData.append('video_start', recordStartValue.value)
  formData.append('video_end', recordEndValue.value)
  formData.append('video_speed', flyerPlayerRef.value.currentSpeed())
}

const recordStartValue = ref(0.0)
const recordEndValue = ref(0.0)
const markRecordStart = () => {
  recordStartValue.value = flyerPlayerRef.value.currentTime()
}
const markRecordEnd = () => {
  recordEndValue.value = flyerPlayerRef.value.currentTime()
}

const recordLoaded = () => {
}
let timer = null
const resetVideo = () => {
  flyerPlayerRef.value.restart(recordStartValue.value)
  if (timer == null)
    timer = setInterval(()=> {
      if (flyerPlayerRef.value.currentTime() > recordEndValue.value) {
        stopRecord()
        clearInterval(timer)
        timer = null;
      }
    }, 500)
}
const subtitle = []
const loadSubtitle = async (url) => {
  try {
    const response = await fetch( url.substring(0, url.lastIndexOf('/')) + '/en.vtt', {
      method: 'GET'
    });

    const result = await response.text();
    let subtitleStrs = result.split("\n");
    const regex = /(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/;
    for (let i = 0, len = subtitleStrs.length; i < len; i++) {
      const match = subtitleStrs[i].match(regex);
      if (match && match.length > 0) {
        // console.log("开始时间", match[0], "结束时间", match[1])
        subtitle.push({
          start:match[1],
          end:match[2],
        })
        continue;
      }
      if (subtitle.length > 0) {
        if (!subtitle[subtitle.length - 1].content) {
          subtitle[subtitle.length - 1].content = []
        }
        if (!subtitleStrs[i]) {
          continue;
        }
        subtitle[subtitle.length - 1].content.push(subtitleStrs[i])
      }
    }
  } catch (error) {
    console.error('loadSubtitle失败', error);
  }
}
const showSubtitle = ref([])
const timeUpdate = (currentTime) => {
  const f = formatTime(currentTime)
  for (let i = 0, len = subtitle.length; i < len; i++) {
    if (f >= subtitle[i].start && f < subtitle[i].end) {
      showSubtitle.value = subtitle[i].content
    }
  }
}
const url = ref('')
const playNow = () => {
  let tmpUrl = url.value
  if (!url.value.startsWith('http')) {
    tmpUrl = apiPref + tmpUrl
  }
  const vid = btoa(tmpUrl)
  flyerPlayerRef.value.play(vid,tmpUrl)
}
const videoVoiceValue = ref('-12dB')
const recordVoiceValue = ref('+6dB')

const modalVisible = ref(false)
const confirmLoading = ref(false)

</script>

<template>
<div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">


  <div style="position:relative;display: flex; flex-direction: row;flex-wrap: wrap;align-items: center;align-content: center; justify-content: center; width: 100%;height: 100%;">
    <div style="width: auto;height: 65%;">
      <FlyerPlayer ref="flyerPlayerRef" @timeUpdate="timeUpdate" :width="'auto'"  :height="'100%'"></FlyerPlayer>
      <div style="position: relative;z-index: 99999999;color: #0cdf57;pointer-events: none;left:0;right:0;font-size:26px;bottom:60px;" >
        <div v-for="st in showSubtitle">
          {{st}}
        </div>
      </div>
    </div>
    <div style="width: auto;height: 65%;">
      <FlyerMakeRecord :show="startRecordFlag" ref="flyerMakeRecordRef" :width="'auto'"  :height="'100%'" @upload="recordUpload" @loaded="recordLoaded" @resetVideo="resetVideo"></FlyerMakeRecord>
    </div>

<!--    <div style="position: relative;width: 40%;height: auto;">
      <div style="position: relative;z-index: 99999999;color: #0cdf57;pointer-events: none;left:0;right:0;font-size:18px;" :style="{bottom:30 * showSubtitle.length + 'px'}">
        <div v-for="st in showSubtitle">
          {{st}}
        </div>
      </div>
    </div>
    <div v-show="startRecordFlag" style="position: relative; width: 40%;height:  auto;display: block;">
    </div>-->

<!--    <div style="position: relative;background: red;width:700px;height:700px;" >-->
<!--    </div>-->
<!--    <div v-show="startRecordFlag" style="position: relative;background: blueviolet;width:700px;height:700px;" >-->
<!--    </div>-->
  </div>

  <div style="position: absolute;bottom: 90px;" :style="{width: widthRate + '%'}">
    <a-select v-model:value="movieItem" @change="(vid) => {selectToPlay(vid);}" :style="{width:'calc(25% - 10px)',marginRight: '10px'}" placeholder="选择聚集">
      <a-select-option v-for="item in dataList" :value="item.vid">{{ item.name }}</a-select-option>
    </a-select>
    <a-input placeholder="输入远程视频地址" v-model:value="url" style="width: calc(25% - 10px); margin-right: 10px;"></a-input>
    <a-button style="width: 20%" type="primary" @click="playNow()">播放</a-button>
  </div>
  <div style="position: absolute;bottom: 50px;" :style="{width: widthRate + '%'}">

    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markStart">标记起点</a-button>
    <a-input v-model:value="startValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markEnd">标记终点</a-button>
    <a-input v-model:value="endValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="cutVideo">开始截取视频</a-button>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="cutAudio">开始截取音频</a-button>
    <a-button type="primary" :style="{width: '10%'}" @click="viewNote">查看记录</a-button>
  </div>
  <div style="position: absolute;bottom: 10px;" :style="{width: widthRate + '%'}">
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markRecordStart">录制起点</a-button>
    <a-input v-model:value="recordStartValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="markRecordEnd">录制终点</a-button>
    <a-input v-model:value="recordEndValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>
<!--    <span>视频音量：</span><a-input v-model:value="videoVoiceValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>-->
<!--    <span>录制音量：</span><a-input v-model:value="recordVoiceValue" style="width: calc(10% - 10px);margin-right:10px;"></a-input>-->
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="startRecord">开启录频</a-button>
    <a-button type="primary" :style="{width: 'calc(10% - 10px)',marginRight: '10px'}" @click="stopRecord">完成录频</a-button>
    <a-button type="primary" :style="{width: 'calc(10%)'}" @click="showRecord">查看录频记录</a-button>
  </div>
</div>

  <a-drawer
      :width="50 + '%'"
      v-model:open="visible"
      class="custom-class"
      title="历史剪辑"
      placement="right"
  >
    <div style="display: flex; width: 100%; height: auto;flex-wrap: wrap;flex-direction: column;align-content: center;align-items: center;">

      <figure style="width: 80%;" v-for="file in editVideoList">
        <figcaption><a :href="apiPref + file.url" :download="file.name">{{file.name}}</a></figcaption>
        <figcaption>{{file.time}}</figcaption>
        <video v-if="file.url.endsWith('.webm')" style="width: 100%" controls :src="apiPref + file.url"></video>
        <video v-if="file.url.endsWith('.mp4')" style="width: 100%" controls :src="apiPref + file.url"></video>
        <audio v-if="file.url.endsWith('.mp3')" style="width: 100%" controls :src="apiPref + file.url"></audio>
        <audio v-if="file.url.endsWith('.m4a')" style="width: 100%" controls :src="apiPref + file.url"></audio>
        <audio v-if="file.url.endsWith('.wav')" style="width: 100%" controls :src="apiPref + file.url"></audio>
      </figure>
    </div>
  </a-drawer>

  <a-drawer
      :width="50 + '%'"
      v-model:open="recordVisible"
      class="custom-class"
      title="历史录制"
      placement="right"
  >
    <div style="display: flex; width: 100%; height: auto;flex-wrap: wrap;flex-direction: column;align-content: center;align-items: center;">

        <figure style="width: 80%;" v-for="file in recordVideoList">
          <figcaption><a :href="apiPref + file.url" :download="file.name">{{file.name}}</a></figcaption>
          <figcaption>{{file.time}}</figcaption>
          <video v-if="file.url.endsWith('.webm')" style="width: 100%" controls :src="apiPref + file.url"></video>
          <video v-if="file.url.endsWith('.mp4')" style="width: 100%" controls :src="apiPref + file.url"></video>
          <audio v-if="file.url.endsWith('.mp3')" style="width: 100%" controls :src="apiPref + file.url"></audio>
          <audio v-if="file.url.endsWith('.m4a')" style="width: 100%" controls :src="apiPref + file.url"></audio>
          <audio v-if="file.url.endsWith('.wav')" style="width: 100%" controls :src="apiPref + file.url"></audio>
        </figure>
    </div>
  </a-drawer>

  <a-modal
      v-model:visible="modalVisible"
      title="视频合成前请确认"
      :confirm-loading="confirmLoading"
      @ok="modalHandleOk"
      @cancel="modalHandleOk"
  >
    <a-form-item label="素材视频音量">
      <a-input v-model:value="videoVoiceValue"></a-input>
    </a-form-item>
    <a-form-item label="录制音量">
      <a-input v-model:value="recordVoiceValue"></a-input>
    </a-form-item>
  </a-modal>

</template>

<style scoped>

</style>
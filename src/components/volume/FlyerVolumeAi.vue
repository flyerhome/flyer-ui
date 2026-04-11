<script setup>
import Hls from 'hls.js'
import {onBeforeUnmount, onMounted, ref} from "vue";
import {aget, apost} from "../../utils/Http.js";
import {message} from "ant-design-vue";
const volumeItem = ref()
const output = ref()
const content = ref('')
const dataList = ref([])
const fileList = ref([])
const queryToneList = () => {
  aget('/volume/tone/list', res => {
    if (!!!res) {
      return;
    }
    dataList.value = res
  }, err => {

  })
}
const queryFileList = () => {
  aget('/volume/list', res => {
    if (!!!res) {
      return;
    }
    fileList.value = res.data
  }, err => {

  })
}
const submit = () => {

  const hide = message.loading('请耐心等候...', 0)
    apost('/volume/submit', {
      content:content.value,
      tone: volumeItem.value,
      output: output.value,
      rate:rate.value,pitch:pitch.value,volume:volume.value
    }, res => {
      message.success('已生成语音：' + res.save_name + '.wav')
      queryFileList()
      hide()
    }, err => {
      message.error('异常：' + err)
      hide()
    })
}
onMounted(() => {
  queryToneList()
  queryFileList()
})
const apiPref = import.meta.env.VITE_APP_API_URL
const widthRate = ref(90)
const visible = ref(false)
const historyNote = () => {
  visible.value = true;
}
const rate = ref(0)
const pitch = ref(0)
const volume = ref(0)
</script>

<template>
  <div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">
    <a-select v-model:value="volumeItem" :style="{width: widthRate + '%',marginBottom: '10px'}" placeholder="选择音色" show-search>
      <a-select-option v-for="item in dataList" :value="item.name">{{ item.name + '-' + item.gender + '-' + item.contentCategories }}</a-select-option>
    </a-select>
    <div :style="{width: 'calc(' + widthRate + '%)',marginBottom: '10px'}">
      <a-row>
        <a-col :span="8">
          <a-form-item label="语速">
            <a-input-number  style="width: 100%"  v-model:value="rate"   placeholder="语速（单位%）"></a-input-number>
          </a-form-item>
        </a-col>
        <a-col :span="7" :offset="1">
          <a-form-item label="音调">
            <a-input-number style="width: 100%" v-model:value="pitch"   placeholder="音调（单位赫兹）"></a-input-number>
          </a-form-item>
        </a-col>
        <a-col :span="7" :offset="1">
          <a-form-item label="音量">
            <a-input-number style="width: 100%" v-model:value="volume"   placeholder="音量（单位%）"></a-input-number>
          </a-form-item>
        </a-col>
      </a-row>
    </div>
    <a-input v-model:value="output"  :style="{width: widthRate + '%',marginBottom: '10px'}" placeholder="命名"></a-input>
    <a-textarea v-model:value="content" :auto-size="{ minRows: 3, maxRows: 5 }"  :style="{width: widthRate + '%',marginBottom: '10px',marginTop: '10px', height:'60px'}" placeholder="填写要生成语音的文本内容"></a-textarea>
    <div :style="{width: widthRate + '%'}">
    <a-button type="primary" :style="{width: 'calc(80% - 10px)',marginRight: '10px'}" @click="submit">生成语音</a-button>
    <a-button :style="{width: '20%'}" @click="historyNote">历史记录</a-button>

    </div>
    <div style="position: relative;padding: 10px;z-index: 999;background: #bdedf6;display: flex;flex-wrap: wrap;gap: 10px 10px;align-items: flex-start;" :style="{width: widthRate + '%'}">
      <div v-for="(file,index) in fileList">
        <figure v-if="index <= 11">
          <figcaption><a :href="apiPref + file.url" :download="file.name">{{file.name}}</a></figcaption>
          <figcaption>{{file.time}}</figcaption>
          <audio controls :src="apiPref + file.url"></audio>
        </figure>
      </div>
    </div>
  </div>


  <a-drawer
      v-model:open="visible"
      class="custom-class"
      title="历史记录"
      placement="right"
  >
    <div v-for="file in fileList">
      <figure>
        <figcaption><a :href="apiPref + file.url" :download="file.name">{{file.name}}</a></figcaption>
        <figcaption>{{file.time}}</figcaption>
        <audio style="width: 90%" controls :src="apiPref + file.url"></audio>
      </figure>
    </div>
  </a-drawer>
</template>

<style scoped>

</style>
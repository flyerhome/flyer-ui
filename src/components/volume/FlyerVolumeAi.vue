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
    apost('/volume/submit', {
      content:content.value,
      tone: volumeItem.value,
      output: output.value
    }, res => {
      message.success('已生成语音：' + res.output + '.wav')
      queryFileList()
    }, err => {

    })
}
onMounted(() => {
  queryToneList()
  queryFileList()
})
const src = '/api/volume/testA0001.wav'
</script>

<template>
  <div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column">
    <a-select v-model:value="volumeItem" style="width: calc(65%);margin-bottom: 10px;" placeholder="选择音色">
      <a-select-option v-for="item in dataList" :value="item.name">{{ item.name + '-' + item.gender + '-' + item.contentCategories }}</a-select-option>
    </a-select>
    <a-input v-model:value="output" style="width: calc(65%);margin-bottom: 10px;" placeholder="命名"></a-input>
    <a-textarea v-model:value="content" style="width: calc(65%);margin-bottom: 10px;margin-top: 10px;" placeholder="填写要生成语音的文本内容"></a-textarea>
    <a-button type="primary" style="width: 65%;" @click="submit">生成语音</a-button>
    <div style="position: relative;padding: 10px;z-index: 999;width:65%;height: auto;background: #bdedf6;
    display: flex;flex-wrap: wrap;gap: 10px 10px;align-items: flex-start; /* 关键：让行高紧贴内容，不撑高 */">
      <figure style="width: 180px" v-for="file in fileList">
        <figcaption><a :href="'/api' + file.url">{{file.name}}</a></figcaption>
        <audio style="width: 150px" controls :src="'/api' + file.url"></audio>
      </figure>
    </div>
  </div>
</template>

<style scoped>

</style>
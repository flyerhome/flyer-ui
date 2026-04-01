<script setup>
import {onMounted, reactive, ref} from "vue";
import axios from "axios";
import {message} from "ant-design-vue";

// 获取SVG元素引用
const svgEl = ref();
const svgRef = ref();
const toolData = reactive({
  svgWidth:1000,
  svgHeight:700,
  aiContent:'',
  aiUrl:'',
  apiId:'',
  apiKey:'',
  backgroundFlag:true,
  background:'#fff'
})
const width = ref(2000)
const height = ref(1000)

const saveAiConfig = () => {
  localStorage.setItem('aiConfig', JSON.stringify(toolData))
}

const clearAiConfig = (flag) => {
  toolData.aiUrl = ''
  toolData.apiId = ''
  toolData.apiKey = ''
  if (flag) {
    localStorage.removeItem('aiConfig')
  }

}



const aiDraw = async (e) => {
  const loading = message.loading('正在绘制中请稍等...', 0);
  const apiKey = toolData.apiKey;
  const appId = toolData.apiId
  const url = toolData.aiUrl;
  const data = {
    input: {
      prompt: "我的svg画布的宽为" + svgRef.value.clientWidth + "，高为"+svgRef.value.clientHeight + "，" + toolData.aiContent
    },
    parameters: {},
    debug: {}
  };
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      svgEl.value.innerHTML = `${response.data.output.text}`;
      message.success('已绘制完成')
      loading()
    } else {
      console.log(`request_id=${response.headers['request_id']}`);
      console.log(`code=${response.status}`);
      console.log(`message=${response.data.message}`);
      message.warn('绘制失败' + response.data.message)
      loading()
    }
  } catch (error) {
    console.error(`Error calling DashScope: ${error.message}`);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    message.warn('绘制异常' + error.message)
    loading()
  }

}

const exportPng = (e) => {
  const svgString = new XMLSerializer().serializeToString(svgRef.value);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const image = new Image()
  image.src = svgUrl
  image.crossOrigin = 'anonymous'; // 解决跨域渲染问题;
  image.onload = (e) => {
    let canvas = document.createElement('canvas')
    canvas.width = toolData.svgWidth
    canvas.height = toolData.svgHeight
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'flyerDraw.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 清理临时资源
    URL.revokeObjectURL(svgUrl);
    ctx.clearRect(0,0,canvas.width, canvas.height)
    canvas.getContext = () => null;
    canvas.width = 0
    canvas.height = 0
    canvas = null;
  }

}

onMounted(() => {
  width.value = document.body.clientWidth
  height.value = document.body.clientHeight
  toolData.svgWidth = parseInt(width.value * 0.8)
  toolData.svgHeight = parseInt(height.value * 0.8)
  let itemStr = localStorage.getItem('aiConfig');
  if (itemStr) {
    const aiConfig = JSON.parse(itemStr)
    if (aiConfig) {
      if (aiConfig.aiUrl) {
        toolData.aiUrl = aiConfig.aiUrl
        toolData.apiKey = aiConfig.apiKey
        toolData.apiId = aiConfig.apiId
      }
      if (aiConfig.apiKey) {
        toolData.apiKey = aiConfig.apiKey
      }
      if (aiConfig.apiId) {
        toolData.apiId = aiConfig.apiId
      }
    }
  }
})
window.onresize = () => {
  width.value = document.body.clientWidth
  height.value = document.body.clientHeight
  console.log("resize................", width.value, height.value)
}
const openConfig = () => {
  visible.value = true
}
const visible = ref(false)
const widthRate = ref(90)
</script>

<template>
  <div style="position: relative;padding: 5px;z-index: 999;width:100%;height: 100%;background: #bdedf6;display: flex;justify-content: start;align-items: center;flex-direction: column;">
    <a-textarea v-model:value="toolData.aiContent" :style="{width: widthRate + '%',height:'10%'}" placeholder="请输入需要绘制图形的详细信息，如绘制一个迷宫，有一个小人在迷宫里从入口走到出口"></a-textarea>
    <div :style="{width: widthRate + '%', paddingTop:'10px', paddingBottom:'10px'}">
      <a-button @click="aiDraw" type="primary" style="width: calc(60% - 10px);margin-right: 10px;" >开始AI绘制</a-button>
      <a-button @click="exportPng" style="width: calc(20% - 10px);margin-right: 10px;" >导出PNG</a-button>
      <a-button @click="openConfig" style="width: calc(20%);" >更多操作</a-button>
    </div>
    <div style="position: relative;padding: 0;background: rgba(204,198,198,0.47);margin:0;" :style="{width: widthRate + '%', height:'calc(90% - 60px)'}">
      <svg ref="svgRef" :style="{width:'100%', height:'100%'}">
        <g>
          <rect v-if="toolData.backgroundFlag" :x="0" :y="0" :fill="toolData.background" style="width: 100%;height: 100%"></rect>
        </g>
        <g id="root" ref="svgEl">

        </g>
      </svg>
    </div>
  </div>

  <a-drawer
      v-model:open="visible"
      class="custom-class"
      title="更多操作"
      placement="right"
  >

    <a-form-item
        label="背景色"
    >
      <a-checkbox v-model:checked="toolData.backgroundFlag" style="padding: 5px"/>
      <a-input type="color" v-model:value="toolData.background" style="width: calc(100% - 30px)"></a-input>
    </a-form-item>

    <a-form-item
        label="阿里百炼智能体"
    >
      <a-input type="text" style="width: 100%;" v-model:value="toolData.aiUrl"></a-input>
    </a-form-item>
<!--    <a-form-item
        label="ApiId"
    >
      <a-input type="text" style="width: 100%" v-model:value="toolData.apiId"></a-input>
    </a-form-item>-->
    <a-form-item
        label="ApiKey"
    >
      <a-input type="text" style="width: 100%" v-model:value="toolData.apiKey"></a-input>
    </a-form-item>
    <a-button @click="saveAiConfig">本地缓存</a-button>
    <a-button @click="clearAiConfig(1)" style="margin-left: 5px;">清除缓存</a-button>
    <a-button @click="clearAiConfig(0)" style="margin-left: 5px;">清空重录</a-button>

  </a-drawer>
</template>


<style scoped>
</style>
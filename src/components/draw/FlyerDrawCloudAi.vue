<script setup>
import {onMounted, onUnmounted, reactive, ref} from "vue";
import {aget, apost} from "../../utils/Http.js";
import {message} from "ant-design-vue";

// 获取SVG元素引用
const svgEl = ref();
const svgRef = ref();
const aiOptions = ref([])
const toolData = reactive({
  svgWidth: 1000,
  svgHeight: 700,
  aiContent: '',
  host: '',
  modelName: 'deepseek-v3.1:671b-cloud',
  apiKey: '',
  backgroundFlag: true,
  background: '#fff',
  options:[],
  selection: {
    drawing:false
  }
});
const width = ref(2000);
const height = ref(1000);

// 拖拽相关状态
const dragState = reactive({
  isDragging: false,
  startX: 0,
  startY: 0,
  targetElement: null,
  initialTransform: ''
});

const saveAiConfig = () => {
  localStorage.setItem('cloudAiConfig', JSON.stringify(toolData));
};

const clearAiConfig = (flag) => {
  toolData.aiUrl = '';
  toolData.apiId = '';
  toolData.apiKey = '';
  if (flag) {
    localStorage.removeItem('cloudAiConfig');
  }
};

const selectRect = ref()
const drawRect = (rect) => {
}

const aiDraw = async (e) => {
  const loading = message.loading({
    content: '正在绘制中请稍等...',
    duration: 0,
    style: { 'marginTop': '200px' }
  });
  const modelName = toolData.modelName;

  const content = "我的svg画布的宽为" + svgRef.value.clientWidth + "，高为" + svgRef.value.clientHeight + "，" + toolData.aiContent;
  await apost('/draw/cloud-ai', {
    content: content,
    model: modelName
  }, (res) => {
    const result = res.result;
    svgEl.value.innerHTML = `${result}`;
    message.success('已绘制完成');
    loading();
  }, err => {
    loading();
  });
};

const exportPng = (e) => {
  const svgString = new XMLSerializer().serializeToString(svgRef.value);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.src = svgUrl;
  image.crossOrigin = 'anonymous'; // 解决跨域渲染问题;
  image.onload = (e) => {
    let canvas = document.createElement('canvas');
    canvas.width = toolData.svgWidth;
    canvas.height = toolData.svgHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext = () => null;
    canvas.width = 0;
    canvas.height = 0;
    canvas = null;
  };
};

// 解析transform属性获取当前偏移量
const parseTransform = (transformStr) => {
  if (!transformStr) return { x: 0, y: 0 };
  // 匹配 translate(x, y) 格式
  const match = transformStr.match(/translate\(([^,]+),\s*([^)]+)\)/);
  if (match) {
    return {
      x: parseFloat(match[1]) || 0,
      y: parseFloat(match[2]) || 0
    };
  }
  // 兼容原始的 transform="100,200" 格式
  const simpleMatch = transformStr.match(/(\d+),\s*(\d+)/);
  if (simpleMatch) {
    return {
      x: parseFloat(simpleMatch[1]) || 0,
      y: parseFloat(simpleMatch[2]) || 0
    };
  }
  return { x: 0, y: 0 };
};
const getPt = (e) => {
  const svg = svgRef.value;
  const point = svg.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse())
}
// 鼠标按下事件 - 开始拖拽
const handleMouseDown = (e) => {
  if (pressKey['Control']) {
    console.log('按了CTRL 不进行任何操作');
    let pt = getPt(e);
    toolData.selection = {
      x : pt.x,
      y : pt.y,
      width:0,
      height:0,
      drawing:true
    }
    return;
  }
  toolData.selection = {drawing:false}
  // 只允许拖拽图形元素，排除背景矩形
  const target = e.target;
  const excludeTags = ['svg'];
  // 排除背景矩形（有fill属性且是背景色）
  if (target.tagName === 'rect' && target.getAttribute('fill') === toolData.background) {
    return;
  }

  if (!excludeTags.includes(target.tagName.toLowerCase())) {
    dragState.isDragging = true;
    dragState.targetElement = target;

    // 获取SVG元素的CTM（当前变换矩阵）用于坐标转换
    const svg = svgRef.value;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

    // 记录初始位置和元素当前的transform
    dragState.startX = svgPoint.x;
    dragState.startY = svgPoint.y;
    dragState.initialTransform = target.getAttribute('transform') || '';

    // 添加样式标识选中状态
    target.style.cursor = 'move';
    target.style.stroke = '#ff0000';
    target.style.strokeWidth = '3';

    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();
  }
};

// 鼠标移动事件 - 执行拖拽
const handleMouseMove = (e) => {
  if (pressKey['Control']) {
    if (toolData.selection.drawing) {
      let pt = getPt(e);
      toolData.selection.width = Math.abs(pt.x - toolData.selection.x)
      toolData.selection.height = Math.abs(pt.y - toolData.selection.y)
      console.log('选择框', toolData.selection)
    }
    return;
  }
  if (!dragState.isDragging || !dragState.targetElement) return;

  const svg = svgRef.value;
  const point = svg.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

  // 计算偏移量
  const dx = svgPoint.x - dragState.startX;
  const dy = svgPoint.y - dragState.startY;

  // 获取初始transform的偏移量
  const initialPos = parseTransform(dragState.initialTransform);

  // 设置新的transform
  const newTransform = `translate(${initialPos.x + dx}, ${initialPos.y + dy})`;
  dragState.targetElement.setAttribute('transform', newTransform);

  e.stopPropagation();
  e.preventDefault();
};

// 鼠标松开事件 - 结束拖拽
const handleMouseUp = (e) => {
  if (pressKey['Control']) {
    // 计算多少图形在这个区域内
    toolData.selection.drawing = false;

    return;
  }
  if (dragState.targetElement) {
    // 恢复样式
    dragState.targetElement.style.cursor = '';
    dragState.targetElement.style.stroke = '';
    dragState.targetElement.style.strokeWidth = '';
  }

  // 重置拖拽状态
  dragState.isDragging = false;
  dragState.targetElement = null;
  dragState.startX = 0;
  dragState.startY = 0;
  dragState.initialTransform = '';
};

const loadAiModels = async () => {
  await aget('/draw/ai_models', res=> {
    aiOptions.value = res?.models;
    console.log("什么没效果呢" ,res?.models)
  })
}

onMounted(() => {
  width.value = document.body.clientWidth;
  height.value = document.body.clientHeight;
  toolData.svgWidth = parseInt(width.value * 0.8);
  toolData.svgHeight = parseInt(height.value * 0.8);
  loadAiModels()
  let itemStr = localStorage.getItem('cloudAiConfig');
  if (itemStr) {
    const aiConfig = JSON.parse(itemStr);
    if (aiConfig) {
      if (aiConfig.host) toolData.host = aiConfig.host;
      if (aiConfig.modelName) toolData.modelName = aiConfig.modelName;
      if (aiConfig.apiKey) toolData.apiKey = aiConfig.apiKey;
    }
  }

  // 绑定拖拽事件
  if (svgRef.value) {
    svgRef.value.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
});

// 页面卸载时移除事件监听
onUnmounted(() => {
  if (svgRef.value) {
    svgRef.value.removeEventListener('mousedown', handleMouseDown);
  }
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});

window.onresize = () => {
  width.value = document.body.clientWidth;
  height.value = document.body.clientHeight;
  console.log("resize................", width.value, height.value);
};
const pressKey = reactive({})
document.addEventListener('keydown', (e)=> {
  pressKey[e.key] = true
})
document.addEventListener('keyup', (e)=> {
  pressKey[e.key] = null
})
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
        <g>
          <rect v-if="!!toolData.selection" :x="toolData.selection?.x" :y="toolData.selection?.y" :width="toolData.selection?.width" :height="toolData.selection?.height" fill="lightblue" opacity="0.5" stroke-width="2" stroke="lightblue"></rect>
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
    <a-form-item label="AI模型" name="aiModel">
      <a-select v-model:value="toolData.modelName" style="width: 100%" placeholder="请输入你要连接的AI云模型">
        <a-select-option v-for="opt in aiOptions" :value="opt.value">{{opt.label}}</a-select-option>
      </a-select>
    </a-form-item>
  </a-drawer>
</template>

<style scoped>
/* 为可拖拽元素添加默认光标样式 */
:deep(svg circle),
:deep(svg rect),
:deep(svg path),
:deep(svg ellipse),
:deep(svg polygon) {
  cursor: pointer;
  transition: stroke 0.2s, stroke-width 0.2s;
}
</style>
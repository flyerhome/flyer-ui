import { createWebHashHistory, createRouter } from 'vue-router'
import HelloWorld from "../components/HelloWorld.vue";
import FlyerPlayer from "../components/player/FlyerPlayer.vue";
import FlyerDrawCloudAi from "../components/draw/FlyerDrawCloudAi.vue";
import FlyerDrawAi from "../components/draw/FlyerDrawAi.vue";
import FlyerVolumeAi from "../components/volume/FlyerVolumeAi.vue";


const routes = [
    { path: '/hello-world', component:  HelloWorld},
    { path: '/player', component:  FlyerPlayer},
    { path: '/draw/ai', component:  FlyerDrawAi},
    { path: '/draw/cloud-ai', component:  FlyerDrawCloudAi},
    { path: '/volume/ai', component:  FlyerVolumeAi},
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})
export default router
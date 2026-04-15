import { createWebHashHistory, createRouter } from 'vue-router'
import HelloWorld from "../components/HelloWorld.vue";
import FlyerPlayer from "../components/player/FlyerPlayer.vue";
import FlyerDrawCloudAi from "../components/draw/FlyerDrawCloudAi.vue";
import FlyerDrawAi from "../components/draw/FlyerDrawAi.vue";
import FlyerVolumeAi from "../components/volume/FlyerVolumeAi.vue";
import FlyerPlayerEdit from "../components/player/FlyerPlayerEdit.vue";
import FlyerPlayerTmp from "../components/player/FlyerPlayerTmp.vue";
import FlyerVolumeCloneAi from "../components/volume/FlyerVolumeCloneAi.vue";
import FlyerPlayer2 from "../components/player/FlyerPlayer2.vue";
import FlyerMakeRecord from "../components/common/FlyerMakeRecord.vue";


const routes = [
    { path: '/hello-world', component:  HelloWorld},
    { path: '/player', component:  FlyerPlayer},
    { path: '/best-player', component:  ()=>import('../components/player/FlyerBestPlayer.vue')},
    { path: '/player2', component:  FlyerPlayer2},
    { path: '/player-tmp', component:  FlyerPlayerTmp},
    { path: '/player-edit', component:  FlyerPlayerEdit},
    { path: '/draw/ai', component:  FlyerDrawAi},
    { path: '/draw/cloud-ai', component:  FlyerDrawCloudAi},
    { path: '/volume/ai', component:  FlyerVolumeAi},
    { path: '/volume/ai/clone', component:  FlyerVolumeCloneAi},
    { path: '/volume/record', component:  FlyerMakeRecord},
    { path: '/common/make-record', component:  ()=> import('../components/common/FlyerMakeRecord.vue')},
    { path: '/common/player', component:  ()=> import('../components/common/FlyerPlayer.vue')},
    { path: '/common/test/player', component:  ()=> import('../components/common/FlyerTestPlayer.vue')},
    { path: '/', component:  null, redirect:{path:'/volume/record'}},
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})
export default router
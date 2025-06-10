import { Script } from "laya/components/Script";
import { CameraTrack } from "./CameraTrack";
import { getTimeFromName, IStoryboardActor } from "./IStoryboardActor";


export class Storyboard extends Script{
    startTime:number;
    actors:IStoryboardActor[] = [];
    totalDuration=0;

    onAwake(): void {
        let owner = this.owner;
        //todo遍历所有的子,保存到actors
        for (let child of owner._children) {            
            let camTrackInst = child.getComponent(CameraTrack);
            if(camTrackInst){//可能为空
                camTrackInst.startTime = getTimeFromName(child.name,0);
                this.actors.push(camTrackInst);
                camTrackInst.sb_init();
                this.totalDuration = Math.max(this.totalDuration, camTrackInst.startTime+camTrackInst.totalDuration);
            }
        }
        this.start();
    }

    start(){
        this.startTime = Date.now();
    }

    onUpdate(): void {
        //遍历所有的actors，检查是否开始了，
        let delta = Date.now()-this.startTime;
        let elaps = delta %this.totalDuration;
        for( let actor of this.actors){
            if(elaps<actor.startTime) continue;
            if(elaps>actor.startTime+actor.totalDuration) continue;
            actor.sb_update(elaps);
        }
    }

}
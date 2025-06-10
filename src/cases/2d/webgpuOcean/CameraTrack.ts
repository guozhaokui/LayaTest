import { Script } from "laya/components/Script";
import { Camera } from "laya/d3/core/Camera";
import { Transform3D } from "laya/d3/core/Transform3D";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";

export class CameraTrack extends Script {
    startTm: number = 0;
    paused = false;
    mainCamera: Camera;
    private keyPoints: {pos: Vector3, rot: Quaternion, fov: number, time: number}[] = [];
    private totalDuration: number = 0;
    
    onAwake(): void {
        this.startTm = Date.now();
        let lastTime = 0;
        
        // 收集所有关键点信息并解析时间
        for (let child of this.owner._children) {
            let camera = child as Camera;
            
            let time = 0;
            let p = camera.name.lastIndexOf('_');
            if(p<0) time = 0;
            else{
                let timeStr = camera.name.substring(p+1);
                if (timeStr.startsWith('d')) {
                    // 相对时间模式
                    time = lastTime + parseInt(timeStr.substring(1));
                } else {
                    // 绝对时间模式
                    time = parseInt(timeStr);
                }
                if(isNaN(time))
                    time = 0;
            }
            
            
            lastTime = time;
            this.totalDuration = Math.max(this.totalDuration, time);
            
            let trans = camera.transform;
            this.keyPoints.push({
                pos: trans.position.clone(),
                rot: trans.rotation.clone(),
                fov: camera.fieldOfView,
                time: time
            });
        }
        
        // 按时间排序关键点
        this.keyPoints.sort((a, b) => a.time - b.time);
    }
    
    // 平滑加速函数
    private smoothStep(t: number): number {
        return t * t * (3 - 2 * t);
    }
    
    // 更平滑的加速函数
    private smootherStep(t: number): number {
        return t * t * t * (t * (6 * t - 15) + 10);
    }
    
    // Catmull-Rom样条插值
    private catmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number {
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * ((2 * p1) + 
                     (-p0 + p2) * t + 
                     (2*p0 - 5*p1 + 4*p2 - p3) * t2 + 
                     (-p0 + 3*p1 - 3*p2 + p3) * t3);
    }
    
    onUpdate(): void {
        if (this.paused || this.keyPoints.length < 2) return;
        
        let elapsed = Date.now() - this.startTm;
        let currentTime = elapsed % (this.totalDuration + 1);
        
        // 找到当前时间所在的段
        let segmentIndex = 0;
        for (let i = 0; i < this.keyPoints.length - 1; i++) {
            if (currentTime >= this.keyPoints[i].time && currentTime <= this.keyPoints[i+1].time) {
                segmentIndex = i;
                break;
            }
        }
        
        // 计算当前段的t值(0-1)
        let segmentDuration = this.keyPoints[segmentIndex+1].time - this.keyPoints[segmentIndex].time;
        let rawT = (currentTime - this.keyPoints[segmentIndex].time) / segmentDuration;
        
        // 确保有足够的点进行插值
        let p0 = Math.max(0, segmentIndex - 1);
        let p1 = segmentIndex;
        let p2 = Math.min(segmentIndex + 1, this.keyPoints.length - 1);
        let p3 = Math.min(segmentIndex + 2, this.keyPoints.length - 1);
        
        // 位置插值 - 使用原始t值保持自然曲线
        let pos = new Vector3();
        pos.x = this.catmullRom(rawT, 
            this.keyPoints[p0].pos.x, this.keyPoints[p1].pos.x, 
            this.keyPoints[p2].pos.x, this.keyPoints[p3].pos.x);
        pos.y = this.catmullRom(rawT, 
            this.keyPoints[p0].pos.y, this.keyPoints[p1].pos.y, 
            this.keyPoints[p2].pos.y, this.keyPoints[p3].pos.y);
        pos.z = this.catmullRom(rawT, 
            this.keyPoints[p0].pos.z, this.keyPoints[p1].pos.z, 
            this.keyPoints[p2].pos.z, this.keyPoints[p3].pos.z);
        
        // 旋转插值 - 使用平滑加速函数
        let t = this.smootherStep(rawT);
        let rot = new Quaternion();
        Quaternion.slerp(this.keyPoints[p1].rot, this.keyPoints[p2].rot, t, rot);
        
        // 视角插值 - 保持线性插值
        let fov = this.keyPoints[p1].fov + 
                 (this.keyPoints[p2].fov - this.keyPoints[p1].fov) * rawT;
        
        // 应用到主摄像机
        if (this.mainCamera) {
            this.mainCamera.transform.position = pos;
            this.mainCamera.transform.rotation = rot;
            this.mainCamera.fieldOfView = fov;
        }
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
    }
}
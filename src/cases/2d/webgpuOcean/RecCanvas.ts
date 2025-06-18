import { regClass } from "Decorators";
import { Script } from "laya/components/Script";
import { Browser } from "laya/utils/Browser";
import { HighQualityFrameRecorder } from "./HighQualityFrameRecorder";

@regClass()
export class RecCanvas extends Script {
    recorder: ImageFrameRecorder;//WebCodecsFrameRecorder;// HighQualityFrameRecorder;
    recording = false;
    onAwake(): void {
        let win = window as any;
        let canvas = (Browser.container as HTMLDivElement).children[0] as HTMLCanvasElement;
        // this.recorder = new HighQualityFrameRecorder(canvas, {
        //     bitrate: 20_000_000, // 更高码率
        //     //quality: 1 // 最高质量
        // });

        //this.recorder = new WebCodecsFrameRecorder(canvas,{fps:30});
        this.recorder = new ImageFrameRecorder(canvas);

        win.Rec = () => {
            clkmgr.start();
            this.recording = true;
            this.recorder.start();
        }
        win.StopRec = async () => {
            this.recording = false;

            const videoBlob = await this.recorder.finalize();

            // 下载视频
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recording.webm'; // 注意扩展名改为 .webm
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            clkmgr.stop();
        }
    }

    onUpdate(): void {
        if (this.recording) {
            //clkmgr.tick();
            this.recorder.captureFrame().then(()=>{
                clkmgr.tick();
            });
            //await this.recorder.captureFrame(); // 可以等待任意长时间
            var a = 0;
        }
    }
}
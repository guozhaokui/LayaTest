export class HighQualityFrameRecorder {
    private mediaRecorder: MediaRecorder;
    private stream: MediaStream;
    private chunks: Blob[] = [];
    private canvas: HTMLCanvasElement;
    private videoTrack: any;

    constructor(
        canvas: HTMLCanvasElement,
        options: {
            bitrate?: number;
            mimeType?: string;
        } = {}
    ) {
        this.canvas = canvas;
        
        // 创建 MediaStream，framerate 设为 0 表示手动控制
        this.stream = this.canvas.captureStream(0);
        this.videoTrack = this.stream.getVideoTracks()[0];

        // 创建 MediaRecorder
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: options.mimeType || 'video/webm;codecs=vp9',
            videoBitsPerSecond: options.bitrate || 10_000_000
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.chunks.push(event.data);
            }
        };
    }

    // 开始录制
    public start(): void {
        this.chunks = [];
        this.mediaRecorder.start();
    }

    // 手动捕获一帧（这是关键方法）
    public captureFrame(): void {
        // 手动触发一帧的捕获
        //if (this.videoTrack && this.videoTrack.requestFrame) {
            this.videoTrack.requestFrame();
        //}
    }

    // 结束录制并返回视频文件
    public async finalize(): Promise<Blob> {
        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                const mimeType = this.mediaRecorder.mimeType || 'video/webm';
                const blob = new Blob(this.chunks, { type: mimeType });
                resolve(blob);
            };
            this.mediaRecorder.stop();
        });
    }
}

// 使用示例
async function test() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const recorder = new HighQualityFrameRecorder(canvas, {
        bitrate: 20_000_000, // 高码率
    });

    // 开始录制
    recorder.start();

    // 在你的渲染循环中，每次渲染完成后手动捕获帧
    async function render() {
        // 你的渲染代码...
        // ... 复杂的渲染逻辑，可能耗时很长 ...
        
        // 渲染完成后，手动捕获这一帧
        recorder.captureFrame();
        
        // 可以等待任意时间再渲染下一帧
        // await new Promise(resolve => setTimeout(resolve, 1000)); // 例如等待1秒
    }

    // 模拟多帧渲染
    for (let i = 0; i < 100; i++) {
        await render();
        // 每帧之间可以有任意的时间间隔
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 完成录制
    const videoBlob = await recorder.finalize();

    // 下载视频
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm'; // 注意扩展名改为 .webm
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
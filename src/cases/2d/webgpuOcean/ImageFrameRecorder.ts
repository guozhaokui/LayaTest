export class ImageFrameRecorder {
    private canvas: HTMLCanvasElement;
    private frameCount: number = 0;
    private directoryHandle: FileSystemDirectoryHandle | null = null;
    private isRecording: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    // 开始录制
    public start(): void {
        if(!this.directoryHandle){
            alert('先选择目录，然后重新start')
            this.setSaveDirectory();
            return;
        }
        this.frameCount = 0;
        this.isRecording = true;
    }

    // 设置保存目录
    public async setSaveDirectory(): Promise<void> {
        try {
            this.directoryHandle = await (window as any).showDirectoryPicker();
        } catch (err) {
            console.error('Error selecting directory:', err);
        }
    }

    // 捕获并保存一帧
    public async captureFrame(): Promise<void> {
        if (!this.isRecording || !this.directoryHandle) {
            console.warn('Recording not started or no directory selected');
            return;
        }

        // 修正帧数格式化，使用4位数字
        const frameNumber = this.frameCount.toString().padStart(4, '0');
        const filename = `frame_${frameNumber}.png`;
        
        try {
            // 创建文件句柄
            const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
            // 创建可写流
            const writable = await fileHandle.createWritable();
            
            // 将canvas转为Blob并写入文件
            this.canvas.toBlob(async (blob) => {
                if (blob) {
                    await writable.write(blob);
                    await writable.close();
                    this.frameCount++;
                }
            }, 'image/png');
        } catch (err) {
            console.error('Error saving frame:', err);
        }
    }

    finalize(){
        this.isRecording = false;
    }
}

   // 使用示例
   async function test() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const recorder = new ImageFrameRecorder(canvas);
    
    // 让用户选择保存目录
    await recorder.setSaveDirectory();
    
    // 在渲染循环中捕获帧
    async function render() {
        // 你的渲染代码...
        
        // 捕获这一帧
        await recorder.captureFrame();
    }
    
    // 模拟60帧/秒，持续20秒
    for (let i = 0; i < 1200; i++) {
        await render();
        await new Promise(resolve => setTimeout(resolve, 1000/60));
    }
}
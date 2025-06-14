export class HighQualityFrameRecorder1 {
    private encoder: VideoEncoder;
    private frameIndex: number = 0;
    private chunks: Uint8Array[] = [];
    private canvas: HTMLCanvasElement;
    private options: {
        format: 'image/webp' | 'image/jpeg' | 'image/png';
        quality: number;
        codec: string;
        framerate: number;
        bitrate: number;
    };

    constructor(
        canvas: HTMLCanvasElement,
        options: {
            format?: 'image/webp' | 'image/jpeg' | 'image/png';
            quality?: number;
            codec?: string;
            framerate?: number;
            bitrate?: number;
        } = {}
    ) {
        this.canvas = canvas;
        this.options = {
            format: 'image/webp',
            quality: 0.95,
            codec: 'avc1.42E01E',
            framerate: 30,
            bitrate: 10_000_000, // 10Mbps for high quality
            ...options
        };

        this.encoder = new VideoEncoder({
            output: (chunk) => {
                const data = new Uint8Array(chunk.byteLength);
                chunk.copyTo(data);
                this.chunks.push(data);
            },
            error: (e) => console.error('编码错误:', e)
        });

        this.encoder.configure({
            codec: this.options.codec,
            width: this.canvas.width,
            height: this.canvas.height,
            bitrate: this.options.bitrate,
            framerate: this.options.framerate
        });
    }

    public async captureFrame(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.canvas.toBlob(
                async (blob) => {
                    if (!blob) {
                        resolve();
                        return;
                    }

                    const img = await this.loadImage(blob);
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.canvas.width;
                    tempCanvas.height = this.canvas.height;
                    const ctx = tempCanvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0);

                    const videoFrame = new VideoFrame(tempCanvas, {
                        timestamp: (this.frameIndex * 1_000_000) / this.options.framerate,
                        duration: 1_000_000 / this.options.framerate
                    });

                    this.encoder.encode(videoFrame, { 
                        keyFrame: this.frameIndex % 30 === 0 
                    });
                    videoFrame.close();
                    this.frameIndex++;
                    resolve();
                },
                this.options.format,
                this.options.quality
            );
        });
    }

    public async finalize(): Promise<Blob> {
        await this.encoder.flush();
        this.encoder.close();

        const totalLength = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const videoData = new Uint8Array(totalLength);
        
        let offset = 0;
        for (const chunk of this.chunks) {
            videoData.set(chunk, offset);
            offset += chunk.length;
        }

        return new Blob([videoData], { type: 'video/mp4' });
    }

    private loadImage(blob: Blob): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('图片加载失败'));
            };
            
            img.src = url;
        });
    }
}

async function test() {
    // 初始化
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const recorder = new HighQualityFrameRecorder1(canvas, {
        bitrate: 20_000_000, // 更高码率
        quality: 1 // 最高质量
    });

    // 在渲染循环中（可以间隔很长时间）
    async function render() {
        // 渲染代码...
        await recorder.captureFrame(); // 可以等待任意长时间
    }

    // 完成录制
    async function finish() {
        const videoBlob = await recorder.finalize();
        
        // 创建下载链接
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.mp4';
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }    
}
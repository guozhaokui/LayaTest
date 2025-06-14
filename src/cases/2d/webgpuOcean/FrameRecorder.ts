interface RecorderOptions {
  fps?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
  videoBitrate?: number;
}

interface FrameData {
  blob: Blob;
  frameIndex: number;
}


export class FrameByFrameRecorder {
  private canvas: HTMLCanvasElement;
  private options: Required<RecorderOptions>;
  private frames: FrameData[] = [];
  private isRecording = false;
  private frameCount = 0;
  private maxMemoryFrames = 100;
  private frameDB: FrameDB;
  
  constructor(canvas: HTMLCanvasElement, options: RecorderOptions = {}) {
    this.canvas = canvas;
    this.options = {
      fps: 30,
      quality: 0.9,
      format: 'image/webp',
      videoBitrate: 2_000_000,
      ...options
    };
    this.frameDB = new FrameDB();
  }
  
  public startRecording(): void {
    this.isRecording = true;
    this.frames = [];
    this.frameCount = 0;
    console.log('开始录制');
  }
  
  public async captureFrame(): Promise<void> {
    if (!this.isRecording) return;
  
    return new Promise<void>((resolve) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            this.frames.push({
              blob,
              frameIndex: this.frameCount++
            });
          }
          resolve();
        },
        this.options.format,
        this.options.quality
      );
    });
  }
  
  public async stopRecording(): Promise<void> {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    console.log(`录制完成，共 ${this.frames.length} 帧`);
    
    await this.generateVideo();
  }
  
  private async generateVideo(): Promise<void> {
    const chunks: Uint8Array[] = [];
    let frameIndex = 0;
  
    const encoder = new VideoEncoder({
      output: (chunk) => {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        chunks.push(data);
      },
      error: (error) => {
        console.error('编码错误:', error);
      }
    });
  
    encoder.configure({
      codec: 'avc1.42E01E',
      width: this.canvas.width,
      height: this.canvas.height,
      bitrate: this.options.videoBitrate,
      framerate: this.options.fps
    });
  
    // 创建临时 canvas 用于转换图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const ctx = tempCanvas.getContext('2d')!;
        
    const batchSize = 50; // 每批处理50帧
    
    for (let batchStart = 0; batchStart < this.frameCount; batchStart += batchSize) {
      
        const batchEnd = Math.min(batchStart + batchSize, this.frameCount);
        
        // 处理当前批次
        for (let i = batchStart; i < batchEnd; i++) {
            let videoFrame: VideoFrame;
            
            // 从内存或IndexedDB获取帧
            if (i < this.frames.length) {
                const img = await this.loadImage(this.frames[i].blob);
                ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                ctx.drawImage(img, 0, 0);
                videoFrame = new VideoFrame(tempCanvas, {
                    timestamp: i,
                    duration: 1000000 / this.options.fps
                });
            } else {
                const frameData = await this.frameDB.getFrame(i);
                videoFrame = new VideoFrame(frameData);
            }
    
            encoder.encode(videoFrame, { keyFrame: i % 30 === 0 });
            // 编码完成后立即释放资源
            videoFrame.close();
            
            // 如果是内存中的帧且已经处理过，可以从数组中移除
            if (i < this.frames.length) {
                this.frames[i] = null; // 释放引用
            }
        }
        
        // 可选：等待一帧让主线程有机会处理其他任务
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
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
  
  private createVideoFile(chunks: Uint8Array[]): void {
    // 简单的 H.264 容器封装
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const videoData = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      videoData.set(chunk, offset);
      offset += chunk.length;
    }
  
    const blob = new Blob([videoData], { type: 'video/mp4' });
    this.downloadFile(blob, 'recording.mp4');
  }
  
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  public get recording(): boolean {
    return this.isRecording;
  }
  
  public dispose(): void {
    this.isRecording = false;
    this.frames = [];
    this.frameCount = 0;
  }
}

async function test(){
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const recorder = new FrameByFrameRecorder(canvas, { fps: 60 });

    // 开始录制
    recorder.startRecording();

    // 渲染循环中
    async function render() {
      // 你的渲染代码
      //renderFrame();
      
      // 捕获帧
      if (recorder.recording) {
          await recorder.captureFrame();
      }
      
      requestAnimationFrame(render);
    }

    // 停止录制
    await recorder.stopRecording();    
}

// IndexedDB工具类
class FrameDB {
    private dbName = 'FrameRecorderDB';
    private storeName = 'frames';
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onupgradeneeded = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.db.createObjectStore(this.storeName, { keyPath: 'id' });
            };
            
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
            
            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    async saveFrame(id: string, blob: Blob): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.put({ id, blob });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getFrame(id: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result?.blob);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
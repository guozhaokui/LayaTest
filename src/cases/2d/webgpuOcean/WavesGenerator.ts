import { FFT } from "./FFT";
import { WavesCascade } from "./WavesCascade";

export class WavesGenerator {
    _fft: FFT;
    _startTime:number;
    _cascades:WavesCascade[]=[];

    constructor(size: number, wavesSettings: any) {
        this._fft = new FFT(size);
        this._startTime = new Date().getTime()/1000;
        this._cascades = [
            new WavesCascade(),
            new WavesCascade(),
            new WavesCascade(),
        ]
    }


    async initAsync() {
        await this._fft.initAsync();
        for (let i = 0; i < this._cascades.length; ++i) {
            const cascade = this._cascades[i];
            await cascade.initAsync();
        }
        this.initializeCascades();
    }

    update() {
        const time = (new Date().getTime() / 1000) - this._startTime;
        for (let i = 0; i < this._cascades.length; ++i) {
            this._cascades[i].calculateWavesAtTime(time);
        }
        this._getDisplacementMap();
    }
}
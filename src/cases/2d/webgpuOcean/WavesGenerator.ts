import { Texture2D } from "laya/resource/Texture2D";
import { FFT } from "./FFT";
import { WavesCascade } from "./WavesCascade";
import { WavesSettings } from "./WavesSettings";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";

export class WavesGenerator {
    _fft: FFT;
    _startTime: number;
    _cascades: WavesCascade[] = [];
    lengthScale = [250, 17, 5];
    _wavesSettings:WavesSettings;
    _noise:Texture2D;
    _displacementMap:Uint16Array;

    constructor(size: number, wavesSettings: WavesSettings) {
        this._wavesSettings = wavesSettings;
        this._fft = new FFT(size);
        this._noise = this.genNoiseTex(size);
        this._startTime = new Date().getTime() / 1000;
        this._cascades = [
            new WavesCascade(size, this._fft, this._noise),
            new WavesCascade(size, this._fft, this._noise),
            new WavesCascade(size, this._fft, this._noise),
        ]
    }

    _normalRandom() {
        return Math.cos(2 * Math.PI * Math.random()) * Math.sqrt(-2 * Math.log(Math.random()));
    }

    genNoiseTex(size:number) {
        let channel = 4;
        let data = new Float32Array(size * size * channel);
        let pitch = size*channel;
        for (let i = 0; i < size; ++i) {
            for (let j = 0; j < size; ++j) {
                let cpos = j * pitch + i * channel;
                data[cpos++] = this._normalRandom();
                data[cpos++] = this._normalRandom();
            }
        }

        let tex = new Texture2D(size, size, TextureFormat.R32G32B32A32, {name:'noise'});
        tex.setPixelsData(data, false, false);
        return tex;
    }

    async initAsync() {
        await this._fft.initAsync();
        for (let i = 0; i < this._cascades.length; ++i) {
            const cascade = this._cascades[i];
            await cascade.initAsync();
        }
        this.initializeCascades();
    }

    initializeCascades() {
        let boundary1 = 0.0001;
        for (let i = 0; i < this.lengthScale.length; ++i) {
            let boundary2 = i < this.lengthScale.length - 1 ? 2 * Math.PI / this.lengthScale[i + 1] * 6 : 9999;
            this._cascades[i].calculateInitials(this._wavesSettings, this.lengthScale[i], boundary1, boundary2);
            boundary1 = boundary2;
        }
    }

    update() {
        const time = (new Date().getTime() / 1000) - this._startTime;
        for (let i = 0; i < this._cascades.length; ++i) {
            this._cascades[i].calculateWavesAtTime(time);
        }
        this._getDisplacementMap();
    }

    _getDisplacementMap() {
        /*
        let buffer = this._cascades[0]._displacement.getPixels();
        this._displacementMap = new Uint16Array(buffer.buffer);
        */
    }
}
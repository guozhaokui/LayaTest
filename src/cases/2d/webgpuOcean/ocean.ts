import { Script } from "laya/components/Script";
import { WavesGenerator } from "./WavesGenerator";
import { WavesSettings } from "./WavesSettings";

export class Ocean extends Script{
    _wavesGenerator:WavesGenerator;
    _size = 256;
    _wavesSettings = new WavesSettings();
    async _updateSize(size:number) {
        this._size = size;
        this._wavesGenerator = new WavesGenerator(this._size,this._wavesSettings);//, this._wavesSettings, this._scene, this._rttDebug, noise);
        await this._wavesGenerator.initAsync();
    }

    onUpdate(){
        //主循环
        this._wavesGenerator.update();
    }
}
import { Script } from "laya/components/Script";
import { WavesGenerator } from "./WavesGenerator";
import { WavesSettings } from "./WavesSettings";
import { OceanGeometry } from "./OceanGeometry";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Camera } from "laya/d3/core/Camera";

export class Ocean extends Script{
    _wavesGenerator:WavesGenerator;
    _size = 256;
    _wavesSettings = new WavesSettings();
    _oceanGeometry:OceanGeometry;

    constructor(){
        super();
    }

    onAwake(): void {
        this.createScene();
    }   

    async _updateSize(size:number) {
        this._size = size;
        this._wavesGenerator = new WavesGenerator(this._size,this._wavesSettings);//, this._wavesSettings, this._scene, this._rttDebug, noise);
        await this._wavesGenerator.initAsync();
    }

    async createScene(){
        let scene = this.owner.scene as Scene3D;
        let camera = scene._cameraPool[0] as Camera;
        let oceanGeo = this._oceanGeometry = new OceanGeometry(scene,camera);
        await oceanGeo.initializeMaterials();
        oceanGeo.initializeMeshes();
        this._updateSize(256);

    }

    onUpdate(){
        //主循环
        this._oceanGeometry.update();
        this._wavesGenerator.update();
    }
}
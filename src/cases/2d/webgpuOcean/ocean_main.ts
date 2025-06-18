import { Laya } from "Laya";
import "laya/d3/loaders/Texture3DLoader"
import "laya/d3/loaders/CubemapLoader"      //这里会把.cubemap转成@0.ktx
import { Scene } from "laya/display/Scene";
import "laya/d3/loaders/MeshReader"         //提供了 MeshLoader.v3d
//为了能加载Sprite3D
import 'laya/d3/ModuleDef'
import "./terrain/terrain"
import "./terrain/CameraMove"
import "./terrain/Scene3DSetting"
import "./terrain/SSAOEffect"
import "./CameraTrack"
import "./Storyboard"
import { regClass } from "Decorators";
import { Script } from "laya/components/Script";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Color } from "laya/maths/Color";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Ocean } from "./ocean";
import { Stat } from "laya/utils/Stat";
import "laya/utils/StatUI"
import { AssetDb } from "laya/resource/AssetDb";
import { URL } from "laya/net/URL";

@regClass('U0xFKAGISe-Wc0LmwywMjQ')
class dummyCls extends Script{

}

export async function start_ocean(){
    let packPath = 'res_ocean_terrain'
    URL.basePath = packPath;
    await Laya.loader.loadPackage('');
    //先加载shader，再加载lmat才能正确加载lmat。
    //否则lmat的加载依赖于fileconfig.json, 这里并没有
    //await Laya.loader.load('ocean/Ocean.shader')
    await Laya.loader.load(['ocean/Ocean.lmat']);

    //Stat.show();
    let sceneRoot = await Scene.open(`PiratesIsland/3d/Main_1.ls`,true)
    let scene = sceneRoot._scene3D;
    // let sp3d = createMeshSprite(PrimitiveMesh.createBox(10,20,10),new Color(1,1,1,1));
    // scene.addChild(sp3d);
    // let ocean = sp3d.addComponent(Ocean)
}


function createMeshSprite(mesh:Mesh,color:Color){
    let sp3 = new Sprite3D();
    let mf = sp3.addComponent(MeshFilter);
    mf.sharedMesh = mesh;
    let r = sp3.addComponent(MeshRenderer)
    let mtl = new BlinnPhongMaterial();
    r.material = mtl;
    mtl.albedoColor = color;
    return sp3;
}
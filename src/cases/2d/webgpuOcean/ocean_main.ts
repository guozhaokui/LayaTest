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

@regClass('U0xFKAGISe-Wc0LmwywMjQ')
class dummyCls extends Script{

}

export async function start_ocean(){

    await Laya.loader.loadPackage('res_ocean_terrain');
    //先加载shader，再加载lmat才能正确加载lmat。
    //否则lmat的加载依赖于fileconfig.json, 这里并没有
    await Laya.loader.load('ocean/Ocean.shader')
    await Laya.loader.load(['ocean/Ocean.lmat']);
    await Laya.loader.load(['res_ocean_terrain/PiratesIsland/Skybox/Skybox-Cubemap.shader','res_ocean_terrain/PiratesIsland/Terrain/SplatmapArray.shader'])
    /*
    let sp = new Sprite();
    sp.graphics.clipRect(0, 0, 150, 150);
    sp.graphics.drawPoly(0, 0, [0, 0, 100, 0, 100, 100], 'green', 'yellow', 2)
    sp.pos(100, 100)
    //sp.cacheAs = 'normal'
    //Laya.stage.addChild(sp);

    let width = 256;
    let height=256;
    const maskTexture2d = new Texture2D(width, height, TextureFormat.R8G8B8A8, false, false);
    const pixelData = new Uint8Array(width * height * 4);
    let idx=0;
    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            pixelData[idx++]=0xff;
            pixelData[idx++]=0x00;
            pixelData[idx++]=0xff;
            pixelData[idx++]=0xff;

        }
    }
    maskTexture2d.setPixelsData(pixelData, false, false);


    let imgMask = new Image();
    imgMask.width = 200;  // 设置合适的显示大小
    imgMask.height = 200;
    imgMask.pos(220, 10);
    imgMask.source = new Texture(maskTexture2d);
    Laya.stage.addChild(imgMask);
    */

    let sceneRoot = await Scene.open('res_ocean_terrain/PiratesIsland/3d/Main_debug_2.ls',true)
    let scene = sceneRoot._scene3D;
    let sp3d = createMeshSprite(PrimitiveMesh.createBox(10,20,10),new Color(1,1,1,1));
    scene.addChild(sp3d);
    let ocean = sp3d.addComponent(Ocean)

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
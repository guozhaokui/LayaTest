import { Stage } from "laya/display/Stage";
import { Vector3 } from "laya/maths/Vector3";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Camera } from "laya/d3/core/Camera";

import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Color } from "laya/maths/Color";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stat } from "laya/utils/Stat";
import "laya/utils/StatUI"
import { Laya } from "Laya";

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

async function test() {
    //初始化引擎
    await Laya.init(0, 0);
    Stat.show(0,0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;

    // let sp = new Sprite();
    // sp.graphics.clipRect(0, 0, 150, 150);
    // sp.graphics.drawPoly(0, 0, [0, 0, 100, 0, 100, 100], 'green', 'yellow', 2)
    // sp.pos(100, 100)
    // sp.cacheAs = 'normal'

    // Laya.stage.addChild(sp);


    // 创建 3D 场景
    let scene = Laya.stage.addChild(new Scene3D());
    Laya.stage.addChild(scene);

    // 创建摄像机
    let camera: Camera = <Camera>scene.addChild(new Camera(0, 0.1, 100));
    camera.transform.translate(new Vector3(0, 3, 5));
    camera.transform.rotate(new Vector3(-30, 0, 0), true, false);

    // 创建平行光
    let directlightSprite = new Sprite3D();
    let dircom = directlightSprite.addComponent(DirectionLightCom);
    scene.addChild(directlightSprite);
    //方向光的颜色
    dircom.color.setValue(1, 1, 1, 1);

    // 创建立方体
    for(let i=0;i<3000;i++){
        scene.addChild(createMeshSprite(PrimitiveMesh.createSphere(0.1),new Color(1,0,0,1)));
    }

    // testComputeShader1();
}


test();
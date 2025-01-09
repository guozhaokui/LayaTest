import "laya/ModuleDef";

import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { IK_Chain } from "laya/IK/IK_Chain";
import { IK_Joint } from "laya/IK/IK_Joint";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { IK_Target } from "laya/IK/IK_Pose1";
import { ClsInst, rotationTo } from "laya/IK/IK_Utils";
import { IK_AngleLimit, IK_HingeConstraint } from "laya/IK/IK_Constraint";
import { IK_System } from "laya/IK/IK_System";
import { CameraController1 } from "../../utils/CameraController1";

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

class IKDemo {
    private scene: Scene3D;
    private camera: Camera;
    private iksys:IK_System;
    private chain:IK_Chain;
    private target: Sprite3D;
    private targetPose = new IK_Target(new Vector3(), new Quaternion())

    constructor(scene:Scene3D, camera:Camera) {
        this.scene = scene;
        this.iksys = new IK_System(scene);
        this.iksys.showDbg=true;
        this.camera=camera;
        this.createIKChain();
        this.target = createMeshSprite(PrimitiveMesh.createSphere(0.1),new Color(1,0,0,1));
        scene.addChild(this.target);
        this.iksys.showDbg=true;

        // let O = createMeshSprite(PrimitiveMesh.createSphere(0.2),new Color(0,0,0,1));
        // scene.addChild(O);

        Laya.timer.frameLoop(1, this, this.onUpdate);
    }

    private createIKChain(): void {
        let chain =this.chain= new IK_Chain();
        this.iksys.addChain(chain);

        const numJoints = 5;
        const jointLength = 1;

        let r1 = new Quaternion();
        rotationTo(new Vector3(0,1,0), new Vector3(0,0,1), r1);
        for (let i = 0; i < numJoints; i++) {
            const position = new Vector3(0, i * jointLength, 0);
            const joint = new IK_Joint();
            joint.name = ''+i;
            chain.addJoint(joint, position, true);
        }
        chain.setEndEffector(numJoints-1)
        this.chain.target = this.targetPose;
        this.iksys.buildDbgModel();

        //设置约束
        //chain.joints[2].angleLimit = new IK_AngleLimit( new Vector3(-Math.PI, 0,-Math.PI), new Vector3(Math.PI, 0,Math.PI))
        chain.joints[3].angleLimit = new IK_HingeConstraint(new Vector3(1,0,0),null,-Math.PI/4, Math.PI/4, true);
    }

    private onUpdate(): void {
        // Move target
        const time = Laya.timer.currTimer * 0.0001;
        let targetPos = this.target.transform.position;
        targetPos.setValue(
            Math.sin(time) * 2,
            Math.cos(time * 0.5) * 3 ,
            0//Math.cos(time * 0.5) * 3
        );
        targetPos.setValue(-2,0,0);
        //this.targetPose.pos = this.target.transform.position.clone();
        //DEBUG
        //this.targetPose.pos = new Vector3(0,2,-3);
        //targetPos.setValue(3,3,0)

        //this.target.transform.position = targetPos;
        
        this.iksys.onUpdate();
    }
}

async function test() {
    //初始化引擎
    await Laya.init(0, 0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;

    let scene = new Scene3D();
    Laya.stage.addChild(scene);

    // 创建相机
    let camera = scene.addChild(new Camera(0, 0.1, 100)) as Camera;
    camera.transform.translate(new Vector3(-3, 3, 15));
    camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
    camera.addComponent(CameraController1);
    camera.clearColor = new Color(0.7,0.7,0.7,1);

    // 创建平行光
    let directlightSprite = new Sprite3D();
    let dircom = directlightSprite.addComponent(DirectionLightCom);
    scene.addChild(directlightSprite);
    //方向光的颜色
    dircom.color.setValue(1, 1, 1, 1);
    //设置平行光的方向
    var mat: Matrix4x4 = directlightSprite.transform.worldMatrix;
    mat.setForward(new Vector3(-1.0, -1.0, -1.0));
    directlightSprite.transform.worldMatrix = mat;

    new IKDemo(scene,camera);
}


test();


export async function onfilechange(f: string) {
    try {
        const module = await import(f);
        for(let mem in module){
            ClsInst.upateType(module[mem]);
        }
    } catch (error) {
        console.error('模块导入失败:', error);
    }
    return false;
}


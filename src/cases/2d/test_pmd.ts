import "laya/ModuleDef";

import { Laya, stage } from "Laya";
import { Stage } from "laya/display/Stage";
import { Sprite } from "laya/display/Sprite";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { MeshReader } from "laya/d3/loaders/MeshReader";
import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Vector3 } from "laya/maths/Vector3";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { CameraController1 } from "../../utils/CameraController1"
import { Animator } from "laya/d3/component/Animator/Animator";
import { AnimatorState } from "laya/d3/component/Animator/AnimatorState";
import { AnimatorControllerLayer } from "laya/d3/component/Animator/AnimatorControllerLayer";
import { Color } from "laya/maths/Color";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Quaternion } from "laya/maths/Quaternion";
import { MMDSprite } from "laya/mmd/Loader/mmdToLaya";
import { Event } from "laya/events/Event";
import { Point } from "laya/maths/Point";
import { Vector2 } from "laya/maths/Vector2";
import { Ray } from "laya/d3/math/Ray";
import { pickBone } from "laya/mmd/Loader/mmdLoaderDbg"
import { mmd_rtdebug } from "laya/mmd/Loader/mmd_rtdebug"
import { AnimationClip } from "laya/d3/animation/AnimationClip";
import { Node } from "laya/display/Node";
import { ClsInst } from "laya/IK/IK_Utils";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { RenderState } from "laya/RenderDriver/RenderModuleData/Design/RenderState";
import { IK_Comp } from "laya/IK/IK_Comp";
import { IK_Target } from "laya/IK/IK_Pose1";
import { IK_AngleLimit, IK_HingeConstraint } from "laya/IK/IK_Constraint";

MeshReader; //MeshLoader.v3d 赋值

function createYCylinder(length:number, color: Color) {
    let sp3 = new Sprite3D();
    let mf = sp3.addComponent(MeshFilter);
    mf.sharedMesh = PrimitiveMesh.createCylinder(0.02, length,3);
    let r = sp3.addComponent(MeshRenderer)
    let mtl = new BlinnPhongMaterial();
    r.material = mtl;
    mtl.albedoColor = color;
    return sp3;
}

function createBoneModel(length:number,color:Color=null) {
    const ycylinder = createYCylinder(length, color||new Color(1, 1, 1, 1));
    let Rot = new Quaternion();
    Quaternion.createFromAxisAngle(new Vector3(1,0,0), Math.PI/2,Rot);
    ycylinder.transform.localRotation = Rot;
    ycylinder.transform.localPosition = new Vector3(0, 0, length * 0.5);
    let sp = new Sprite3D('bone Dummy');
    sp.addChild(ycylinder);
    return sp;
}

//HierarchyLoader和MaterialLoader等是通过前面的import完成的
let lm = './pmx/miku_v2/miku_v2.pmd'
async function test(){
    //初始化引擎
    await Laya.init(0,0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;

    let scene =new Scene3D();
    Laya.stage.addChild(scene);
    

    // 创建相机
    let camera = scene.addChild(new Camera(0, 0.1, 100)) as Camera;
    camera.farPlane=200;
    camera.transform.translate(new Vector3(0, 0, 10));
    camera.transform.rotate(new Vector3(0, 0, 0), true, false);
    camera.addComponent(CameraController1);
    camera.clearColor=new Color(0.6,0.6,0.6,1.0);

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

    {
    let visualSp = new PixelLineSprite3D();
    visualSp.maxLineCount=1000;
    let mtl = visualSp._render.material;
    mtl.depthTest= RenderState.DEPTHTEST_ALWAYS;
    visualSp.addLine(new Vector3, new Vector3(100,0,0), Color.RED,Color.RED);
    visualSp.addLine(new Vector3, new Vector3(0,100,0), Color.GREEN,Color.GREEN);
    visualSp.addLine(new Vector3, new Vector3(0,0,100), Color.BLUE,Color.BLUE);
    scene.addChild(visualSp);
    }


    // 加载模型
    let mmdsp = await Laya.loader.load(lm) as MMDSprite;
    
    // 创建MeshSprite3D并应用加载的网格数据
    scene.addChild(mmdsp);

    //显示骨骼
    for (let sp of mmdsp.skeleton.sprites){
        let length = (sp as any).boneLength ||1;
        let color = null;
        let bone = createBoneModel(length, color);
        sp.addChild(bone);
    }
    
    // 调整模型位置和缩放
    mmdsp.transform.position = new Vector3(0, 0, 0);
    mmdsp.transform.setWorldLossyScale(new Vector3(1, 1, 1));
    
    let mtl = new BlinnPhongMaterial();
    mmdsp._render.sharedMaterial = mtl;
    //mmdsp.renderSprite.active=false;
    console.log("Mesh loaded and added to scene");

    let vmd = await Laya.loader.load('./pmx/wavefile_v2.vmd') as AnimationClip;
    //vmd中的节点目前还没有层次结构，要根据实际的结构修改一下
    mmdsp.linkAnim(vmd);

    let animator: Animator = mmdsp.addComponent(Animator);
    let animatorLayer: AnimatorControllerLayer = new AnimatorControllerLayer("AnimatorLayer");
    animator.addControllerLayer(animatorLayer);
    animatorLayer.defaultWeight = 1.0;    
    // 创建动画状态
    let state: AnimatorState = new AnimatorState();
    state.name = "move";
    state.clip = vmd;

    //这时候会查找对象
    animatorLayer.addState(state);

    // 播放动画
    animator.play("move");
    //state.speed=0;
    //animator.getControllerLayer(0).getCurrentPlayState()
    //animatorLayer.getCurrentPlayState().normalizedTime=0.1;
    (window as any).anim = animator;
    (window as any).mmd = mmdsp;

    //设置ik
    let  ikcomp = mmdsp.addComponent(IK_Comp)
    ikcomp.setJointConstraint({
        //脚踝
        "左足首":new IK_HingeConstraint('x',0,120*Math.PI/180),
        "右足首":new IK_HingeConstraint('x',0,120*Math.PI/180),
        //膝
        "左ひざ":new IK_HingeConstraint('x',0,120*Math.PI/180),
        "右ひざ":new IK_HingeConstraint('x',0,120*Math.PI/180),
    });
    //根据骨骼创建ik链。可以多个。
    //左脚尖
    //左つま先,左足首,左ひざ,左足
    //左脚踝
    //chain.appendEndEffector(new Vector3(0,1.5,0))
    ikcomp.setTarget(ikcomp.addChainByBoneName('左足首',3,true), new IK_Target( mmdsp.getBone('左足ＩＫ') ));        
    //ikcomp.setTarget(ikcomp.addChainByBoneName('右足首',3,true), new IK_Target( mmdsp.getBone('右足ＩＫ') ));        

    //根据骨骼名称添加约束

    //左つま先ＩＫ  足尖
    ikcomp.setTarget(ikcomp.addChainByBoneName('左つま先',2,true), new IK_Target( mmdsp.getBone('左つま先ＩＫ') ));
    //ikcomp.setTarget(ikcomp.addChainByBoneName('右つま先',2,true), new IK_Target( mmdsp.getBone('右つま先ＩＫ') ));


    new mmd_rtdebug(mmdsp);
    stage.on(Event.MOUSE_DOWN,(e:Event)=>{

    })

    stage.on(Event.MOUSE_UP, (e:Event)=>{
        let pt = new Vector2(e.stageX, e.stageY);
        let ray = new Ray(new Vector3, new Vector3);
        camera.viewportPointToRay(pt, ray);
        //
        let picks  = [];
        pickBone(ray.origin, ray.direction,0.1,mmdsp.skeleton.sprites, picks);
        for(let b of picks){
            console.log(b.name)
        }
    })

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

export var testConfig={
    capture:false
}

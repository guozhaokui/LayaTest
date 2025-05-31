import "laya/ModuleDef";
import { Laya } from "Laya";
import { Sprite } from "laya/display/Sprite";
import { Stage } from "laya/display/Stage";
import { LayaGL } from "laya/layagl/LayaGL";
import { Vector3 } from "laya/maths/Vector3";
import { EDeviceBufferUsage } from "laya/RenderDriver/DriverDesign/RenderDevice/IDeviceBuffer";
import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { ComputeCommandBuffer } from "laya/RenderDriver/DriverDesign/RenderDevice/ComputeShader/ComputeCommandBuffer"
import { ComputeShader } from "laya/RenderDriver/DriverDesign/RenderDevice/ComputeShader/ComputeShader"
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Camera } from "laya/d3/core/Camera";
import "Laya3D" //这样才能初始化3d


//WebGPU
import { WebGPURender2DProcess } from "laya/RenderDriver/WebGPUDriver/2DRenderPass/WebGPURender2DProcess";
import { WebGPU3DRenderPassFactory } from "laya/RenderDriver/WebGPUDriver/3DRenderPass/WebGPU3DRenderPassFactory";
import { WebGPURenderDeviceFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderDeviceFactory";
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Color } from "laya/maths/Color";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";

function useWebGPU(){
    LayaGL.renderDeviceFactory = new WebGPURenderDeviceFactory();
    LayaGL.render2DRenderPassFactory = new WebGPURender2DProcess();
    Laya3DRender.Render3DPassFactory = new WebGPU3DRenderPassFactory();

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

function testComputeShader1() {
    //创建ComputeShader
    let code = `
            @group(0) @binding(0) var<storage,read_write> data:array<f32>;
            @compute @workgroup_size(1) fn computeDoubleMulData(
                @builtin(global_invocation_id) id: vec3u
            ){
                let i = id.x;
                data[i] = data[i] * 2.0;
            }`

    let uniformCommandMap = LayaGL.renderDeviceFactory.createGlobalUniformMap("changeArray");
    let propertyID = Shader3D.propertyNameToID("data");
    uniformCommandMap.addShaderUniform(propertyID, "data", ShaderDataType.DeviceBuffer);

    let computeshader = ComputeShader.createComputeShader("changeArray", code, [uniformCommandMap]);
    let shaderDefine = LayaGL.unitRenderModuleDataFactory.createDefineDatas();

    //创建ShaderData和StorageBuffer
    let shaderData = LayaGL.renderDeviceFactory.createShaderData();
    let strotageBuffer = LayaGL.renderDeviceFactory.createDeviceBuffer(EDeviceBufferUsage.STORAGE | EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.COPY_SRC);

    let array = new Float32Array([1, 3, 5]);
    strotageBuffer.setDataLength(array.byteLength);
    strotageBuffer.setData(array, 0, 0, array.byteLength);
    shaderData.setDeviceBuffer(propertyID, strotageBuffer);

    let readStrotageBuffer = LayaGL.renderDeviceFactory.createDeviceBuffer(EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.MAP_READ);
    readStrotageBuffer.setDataLength(array.byteLength);

    //创建ComputeCommandBuffer
    let commands = new ComputeCommandBuffer();

    let dispatchParams = new Vector3(array.length, 1, 1);
    commands.addDispatchCommand(computeshader, "computeDoubleMulData", shaderDefine, [shaderData], dispatchParams);
    commands.addBufferToBufferCommand(strotageBuffer, readStrotageBuffer, 0, 0, array.byteLength);
    commands.executeCMDs();

    readStrotageBuffer.readData(array.buffer, 0, 0, array.byteLength).then(() => {
        console.log(array);
    })
}


async function test() {
    //初始化引擎
    useWebGPU();    
    await Laya.init(0, 0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;

    let sp = new Sprite();
    sp.graphics.clipRect(0, 0, 150, 150);
    sp.graphics.drawPoly(0, 0, [0, 0, 100, 0, 100, 100], 'green', 'yellow', 2)
    sp.pos(100, 100)
    sp.cacheAs = 'normal'

    Laya.stage.addChild(sp);


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
    scene.addChild(createMeshSprite(PrimitiveMesh.createSphere(0.1),new Color(1,0,0,1)));

    testComputeShader1();

    function renderloop() {
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}


test();
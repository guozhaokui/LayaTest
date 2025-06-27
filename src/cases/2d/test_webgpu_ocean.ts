import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { LayaGL } from "laya/layagl/LayaGL";
import { Vector3 } from "laya/maths/Vector3";
import { EDeviceBufferUsage } from "laya/RenderDriver/DriverDesign/RenderDevice/IDeviceBuffer";
import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { ComputeCommandBuffer } from "laya/RenderDriver/DriverDesign/RenderDevice/ComputeShader/ComputeCommandBuffer"
import { ComputeShader } from "laya/RenderDriver/DriverDesign/RenderDevice/ComputeShader/ComputeShader"
import { Camera } from "laya/d3/core/Camera";

import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Color } from "laya/maths/Color";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { DepthTextureMode } from "laya/resource/RenderTexture";

import { start_ocean } from "./webgpuOcean/ocean_main";
import { Stat } from "laya/utils/Stat";



// function loadScript(src:string) {
//     return new Promise((resolve, reject) => {
//         const script = document.createElement('script');
//         script.src = src;
//         script.type = 'text/javascript';
        
//         script.onload = () => resolve(script);
//         script.onerror = () => reject(new Error(`加载失败: ${src}`));
        
//         document.head.appendChild(script);
//     });
// }


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

function _normalRandom() {
    return Math.cos(2 * Math.PI * Math.random()) * Math.sqrt(-2 * Math.log(Math.random()));
}

function genNoiseTex() {
    let size = 256;
    let channel = 4;
    let data = new Float32Array(size * size * channel);
    for (let i = 0; i < size; ++i) {
        for (let j = 0; j < size; ++j) {
            data[j * size * 2 + i * 2 + 0] = _normalRandom();
            data[j * size * 2 + i * 2 + 1] = _normalRandom();
        }
    }

    let tex = new Texture2D(size,size,TextureFormat.R32G32B32A32,false,false);
    tex.setPixelsData(data,false,false);
    return tex;
}

function testComputeShader1() {
    //创建ComputeShader
    //texture_storage_2d<rg32float, write>;
    let code = `
    struct Params {
        Size : u32,
        LengthScale : f32,
    };
    @group(0) @binding(0) var<uniform> params : Params;
            @group(0) @binding(1) var<storage,read_write> data:array<f32>;
            @group(0) @binding(2) var readTex:texture_2d<f32>;
            @group(0) @binding(3) var writeTex:texture_storage_2d<rg32float, write>;

            @compute @workgroup_size(1) fn computeDoubleMulData(
                @builtin(global_invocation_id) id: vec3u
            ){
                let i = id.x;
                let coords = id.xy;
                let n =  textureLoad(readTex, coords, 0);                
                data[i] = data[i] * 2.0+/*n.x+*/params.LengthScale;
                textureStore(writeTex,coords,vec4(1,1,1,1));
            }`

    let renderDevFactory = LayaGL.renderDeviceFactory;
    let uniformCommandMap = renderDevFactory.createGlobalUniformMap("changeArray");
    let propertyID = Shader3D.propertyNameToID("data");
    let rtexID = Shader3D.propertyNameToID('readTex');
    let wtexID = Shader3D.propertyNameToID('writeTex');
    let paramsID = Shader3D.propertyNameToID('params');
    let param_size_id = Shader3D.propertyNameToID('Size');
    let param_LengthScale_id = Shader3D.propertyNameToID('LengthScale');

    uniformCommandMap.addShaderUniform(propertyID, "data", ShaderDataType.DeviceBuffer);
    uniformCommandMap.addShaderUniform(rtexID,'readTex',ShaderDataType.Texture2D_float);
    uniformCommandMap.addShaderUniform(wtexID,'writeTex', ShaderDataType.Texture2DStorage,{textureFormat:'rg32float'});
    uniformCommandMap.addShaderUniform(param_size_id, 'Size', ShaderDataType.Int);
    uniformCommandMap.addShaderUniform(param_LengthScale_id,'LengthScale',ShaderDataType.Float)


    let computeshader = ComputeShader.createComputeShader("changeArray", code, [uniformCommandMap]);
    let shaderDefine = LayaGL.unitRenderModuleDataFactory.createDefineDatas();

    //创建ShaderData和StorageBuffer
    let shaderData = renderDevFactory.createShaderData();

    let strotageBuffer = renderDevFactory.createDeviceBuffer(EDeviceBufferUsage.STORAGE | EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.COPY_SRC);
    let array = new Float32Array([1, 3, 5]);
    strotageBuffer.setDataLength(array.byteLength);
    strotageBuffer.setData(array, 0, 0, array.byteLength);
    shaderData.setDeviceBuffer(propertyID, strotageBuffer);

    let paramBuffValue = new Float32Array(2);
    let dv = new DataView(paramBuffValue.buffer);
    dv.setUint32(0,1,true);
    dv.setFloat32(4,2.2,true);

    // let paramBuffer = renderDevFactory.createDeviceBuffer(EDeviceBufferUsage.UNIFORM | EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.COPY_SRC);
    // paramBuffer.setDataLength(paramBuffValue.byteLength);
    // paramBuffer.setData(paramBuffValue, 0, 0, paramBuffValue.byteLength);
    // shaderData.setDeviceBuffer(paramsID, paramBuffer);
    //shaderData.setBuffer(paramsID, paramBuffValue)
    shaderData.setInt(param_size_id,1);
    shaderData.setNumber(param_LengthScale_id,1.3);

    let noiseTex = genNoiseTex();
    shaderData.setTexture(rtexID,noiseTex);
    let tex1 = new Texture2D(256,256,TextureFormat.R32G32,{isStorage:true});
    shaderData.setTexture(wtexID,tex1);

    new Texture2D(256,256,TextureFormat.R32G32,{})
    new Texture2D(256,256,TextureFormat.R16G16B16A16,{})

    let readStrotageBuffer = renderDevFactory.createDeviceBuffer(EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.MAP_READ);
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
    return tex1;
}


function createKeyCamera(time:number|string,pos:Vector3, dir:Vector3, vof:number){
    let camera = new Camera(0, 1, 1000);
    camera.name = 'camera_'+time;
    camera.depthTextureMode = DepthTextureMode.Depth;
    camera.fieldOfView = vof;
    camera.transform.position = pos;
    let target = new Vector3();
    pos.vadd(dir.scale(100,new Vector3()),target);
    camera.transform.lookAt(target,new Vector3(0,1,0));
    camera.active = false;
    return camera;
}

async function test() {
    //初始化引擎
    await Laya.init(0, 0);
    //Stat.show();
    //await loadScript('js/sy.3d.ext_3.3.js')
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;
    await start_ocean();

    // 创建 3D 场景
    //let scene = new Scene3D();
    // Laya.stage.addChild(scene);
    // scene.ambientColor=new Color( 0.23255813953488372,0.23255813953488372,0.23255813953488372,1.0);
    // //scene.enableFog = true;
    // scene.fogColor = new Color( 0.5294118, 0.8941177, 0.9960784,1.0);
    // scene.fogStart = 100;
    // scene.fogEnd = 600;


    // // 创建摄像机
    // let camera: Camera = <Camera>scene.addChild(new Camera(0, 1, 1000));
    // camera.depthTextureMode = DepthTextureMode.Depth;
    // camera.fieldOfView = 45;
    // // camera.transform.translate(new Vector3(0, 5, 0));
    // // camera.transform.rotate(new Vector3(-45, 0, 0), true, false);

    // camera.transform.translate(new Vector3(0, 100, 0));
    // camera.transform.rotate(new Vector3(-90, 0, 0), true, false);

    // // 创建平行光
    // let directlightSprite = new Sprite3D();
    // let dircom = directlightSprite.addComponent(DirectionLightCom);
    // scene.addChild(directlightSprite);
    // //方向光的颜色
    // dircom.color.setValue(1, 1, 1, 1);
    // dircom.intensity = 1.5;
    // dircom.shadowStrength=0.7;
    // dircom.shadowMode = 3;



    // // 创建立方体
    // let sp3d = createMeshSprite(PrimitiveMesh.createBox(10,20,10),new Color(1,1,1,1));
    // scene.addChild(sp3d);
    
    // camera.addComponent(CameraController1)
    // //let t1 = testComputeShader4();
    // //imgMask.source = new Texture(t1);
    // let ocean = sp3d.addComponent(Ocean)
    // //ocean._updateSize(256);

    // let camTrack = new Sprite3D();
    // camTrack.addChild(createKeyCamera(0,new Vector3(0,5,0), new Vector3(0,0,-1), 45));
    // camTrack.addChild(createKeyCamera(1000,new Vector3(10,5,0), new Vector3(0,0,-1), 45));
    // camTrack.addChild(createKeyCamera(2000,new Vector3(10,5,-10), new Vector3(-1,0,0), 45));
    // let camTrackComp = camTrack.addComponent(CameraTrack);
    // camTrackComp.mainCamera = camera;
    // scene.addChild(camTrack);

    function renderloop() {
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}

test();

export var testConfig={capture:false}
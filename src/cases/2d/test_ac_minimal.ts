import { Laya } from "Laya";
import { Config } from "Config";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { LayaGL } from "laya/layagl/LayaGL";
import { WebUnitRenderModuleDataFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/WebUnitRenderModuleDataFactory";
import { WebGLRenderDeviceFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderDeviceFactory";
import { Web3DRenderModuleFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/3D/Web3DRenderModuleFactory";
import { WebGL3DRenderPassFactory } from "laya/RenderDriver/WebGLDriver/3DRenderPass/WebGL3DRenderPassFactory";
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { WebGLEngine } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLEngine";
import { BaseRender } from "laya/d3/core/render/BaseRender";
import { UnlitShaderInit } from "laya/d3/shader/unlit/UnlitShaderInit";
import { BlinnPhongShaderInit } from "laya/d3/shader/blinnphong/BlinnPhongShaderInit";
import { Sprite3DRenderDeclaration } from "laya/d3/core/render/Sprite3DRenderDeclaration";
import { SkyBoxShaderInit } from "laya/d3/shader/sky/SkyBoxShaderInit";
import { SkyProceduralShaderInit } from "laya/d3/shader/sky/SkyProceduralShaderInit";
import { SkyPanoramicShaderInit } from "laya/d3/shader/sky/SkyPanoramicShaderInit";
import { ShaderInit3D } from "laya/d3/shader/ShaderInit3D";

export class MinimalTest {
    constructor() {
        // 基础配置
        Config.useWebGL2 = true;
        Config.isAntialias = true;
        Config._uniformBlock = false;
        Config.matUseUBO = false;
        
        // 初始化渲染引擎
        LayaGL.renderEngine = new WebGLEngine({ 
            stencil: Config.isStencil,
            alpha: Config.isAlpha,
            depth: Config.isDepth,
            antialias: Config.isAntialias,
            failIfMajorPerformanceCaveat: Config.isfailIfMajorPerformanceCaveat,
            premultipliedAlpha: Config.premultipliedAlpha,
            preserveDrawingBuffer: Config.preserveDrawingBuffer,
            powerPreference: Config.powerPreference
        });
        
        // 初始化渲染模块
        LayaGL.unitRenderModuleDataFactory = new WebUnitRenderModuleDataFactory();
        LayaGL.renderDeviceFactory = new WebGLRenderDeviceFactory();
        Laya3DRender.Render3DModuleDataFactory = new Web3DRenderModuleFactory();
        Laya3DRender.Render3DPassFactory = new WebGL3DRenderPassFactory();
        
        // 初始化所有必要的shader
        Shader3D.init();
        ShaderInit3D.__init__();  // 初始化基础shader包含文件
        UnlitShaderInit.init();
        BlinnPhongShaderInit.init();
        SkyBoxShaderInit.init();
        SkyProceduralShaderInit.init();
        SkyPanoramicShaderInit.init();
        
        // 初始化渲染相关类和宏定义
        BaseRender.__init__();
        BaseRender.shaderValueInit();
        
        // 初始化基础的ShaderDefine
        RenderableSprite3D.SHADERDEFINE_RECEIVE_SHADOW = Shader3D.getDefineByName("RECEIVESHADOW");
        RenderableSprite3D.SHADERDEFINE_CAST_SHADOW = Shader3D.getDefineByName("CASTSHADOW");
        RenderableSprite3D.SHADERDEFINE_SHADOW_SPOT = Shader3D.getDefineByName("SHADOW_SPOT");
        RenderableSprite3D.SHADERDEFINE_SHADOW_CASCADE = Shader3D.getDefineByName("SHADOW_CASCADE");
        
        Laya.init(0, 0).then(() => {
            // 创建场景
            const scene = new Scene3D();
            Laya.stage.addChild(scene);
            
            // 创建相机
            const camera = scene.addChild(new Camera()) as Camera;
            camera.transform.translate(new Vector3(0, 0, 5));
            camera.transform.lookAt(new Vector3(0, 0, 0), Vector3.Up);
            
            // 创建立方体
            const box = scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(1, 1, 1))) as MeshSprite3D;
            const material = new BlinnPhongMaterial();
            material.albedoColor = new Color(1, 0, 0, 1);
            box.meshRenderer.material = material;
            
            // 添加简单动画
            Laya.timer.frameLoop(1, this, () => {
                box.transform.rotate(new Vector3(0, 0.01, 0), false);
            });
        });
    }
}

new MinimalTest();

















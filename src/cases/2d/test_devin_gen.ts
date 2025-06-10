import { Laya } from "Laya";  
import { Camera } from "laya/d3/core/Camera";  
import { Scene3D } from "laya/d3/core/scene/Scene3D";  
import { Sprite3D } from "laya/d3/core/Sprite3D";  
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";  
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";  
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";  
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";  
import { Stage } from "laya/display/Stage";  
import { Vector3 } from "laya/maths/Vector3";  
import { Matrix4x4 } from "laya/maths/Matrix4x4";  
import { Color } from "laya/maths/Color";  
import { Stat } from "laya/utils/Stat";  
import { LayaGL } from "laya/layagl/LayaGL";  
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";  
import "Laya3D"
  
// 导入渲染后端工厂类  
import { WebGLRenderDeviceFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderDeviceFactory";  
import { WebGLRender2DProcess } from "laya/RenderDriver/WebGLDriver/2DRenderPass/WebGLRender2DProcess";  
import { WebGL3DRenderPassFactory } from "laya/RenderDriver/WebGLDriver/3DRenderPass/WebGL3DRenderPassFactory";  
import { WebUnitRenderModuleDataFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/WebUnitRenderModuleDataFactory";  
import { Web3DRenderModuleFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/3D/Web3DRenderModuleFactory";  
import { LengencyRenderEngine3DFactory } from "laya/RenderDriver/DriverDesign/3DRenderPass/LengencyRenderEngine3DFactory";  
  
  
export class SimpleBoxDemo {  
    constructor() {  
        // 根据运行环境配置渲染后端  
        this.configureRenderBackend();  
          
        // 初始化引擎  
        Laya.init(0, 0).then(() => {  
            // 设置舞台属性  
            Laya.stage.scaleMode = Stage.SCALE_FULL;  
            Laya.stage.screenMode = Stage.SCREEN_NONE;  
              
            // 显示性能统计  
            //Stat.show();  
              
            // 创建3D场景  
            const scene = new Scene3D();  
            Laya.stage.addChild(scene);  
              
            // 创建并添加相机  
            const camera = new Camera(0, 0.1, 100);  
            scene.addChild(camera);  
            camera.transform.translate(new Vector3(0, 2, 5));  
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);  
            camera.clearColor = new Color(0.2, 0.2, 0.2, 1.0);  
              
            // 创建并添加方向光  
            const directionLight = new Sprite3D();  
            const dirLightComponent = directionLight.addComponent(DirectionLightCom);  
            scene.addChild(directionLight);  
              
            // 设置光照方向  
            const lightMatrix = directionLight.transform.worldMatrix;  
            lightMatrix.setForward(new Vector3(-1.0, -1.0, -1.0));  
            directionLight.transform.worldMatrix = lightMatrix;  
              
            // 设置光照颜色  
            dirLightComponent.color = new Color(1, 1, 1, 1);  
              
            // 创建盒子  
            const box = new MeshSprite3D(PrimitiveMesh.createBox(0.5, 0.5, 0.5));  
            scene.addChild(box);  
            box.transform.position = new Vector3(0, 0, 0);  
              
            // 创建并应用材质到盒子  
            const material = new BlinnPhongMaterial();  
            material.albedoColor = new Color(1, 0, 0, 1); // 红色  
            box.meshRenderer.material = material;  
        });  
    }  
  
    // 配置渲染后端  
    private configureRenderBackend(): void {  
            // 网页环境使用WebGL  
            LayaGL.unitRenderModuleDataFactory = new WebUnitRenderModuleDataFactory();  
            LayaGL.renderDeviceFactory = new WebGLRenderDeviceFactory();  
            Laya3DRender.renderOBJCreate = new LengencyRenderEngine3DFactory();  
            Laya3DRender.Render3DModuleDataFactory = new Web3DRenderModuleFactory();  
            Laya3DRender.Render3DPassFactory = new WebGL3DRenderPassFactory();  
            LayaGL.render2DRenderPassFactory = new WebGLRender2DProcess();  
    }  
}  
  
// 创建示例实例  
new SimpleBoxDemo();

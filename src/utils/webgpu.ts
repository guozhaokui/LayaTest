import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { LayaGL } from "laya/layagl/LayaGL";
import { WebGPURender2DProcess } from "laya/RenderDriver/WebGPUDriver/2DRenderPass/WebGPURender2DProcess";
import { WebGPU3DRenderPassFactory } from "laya/RenderDriver/WebGPUDriver/3DRenderPass/WebGPU3DRenderPassFactory";
import { WebGPURenderDeviceFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderDeviceFactory";
import { LengencyRenderEngine3DFactory } from "laya/RenderDriver/DriverDesign/3DRenderPass/LengencyRenderEngine3DFactory";
import { Web3DRenderModuleFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/3D/Web3DRenderModuleFactory";
import { WebUnitRenderModuleDataFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/WebUnitRenderModuleDataFactory";

function useWebGPU(){
    LayaGL.renderDeviceFactory = new WebGPURenderDeviceFactory();
    LayaGL.render2DRenderPassFactory = new WebGPURender2DProcess();
    Laya3DRender.Render3DPassFactory = new WebGPU3DRenderPassFactory();
    LayaGL.unitRenderModuleDataFactory = new WebUnitRenderModuleDataFactory();
    Laya3DRender.renderOBJCreate = new LengencyRenderEngine3DFactory();
    Laya3DRender.Render3DModuleDataFactory = new Web3DRenderModuleFactory();
}

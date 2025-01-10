
import { LayaGL } from "laya/layagl/LayaGL";
import "laya/d3/RenderObjs/RenderObj/WebGLRenderEngine3DFactory"
import { WebGLRenderEngineFactory } from "laya/RenderEngine/RenderEngine/WebGLEngine/WebGLRenderEngineFactory"
LayaGL.renderOBJCreate = new WebGLRenderEngineFactory();
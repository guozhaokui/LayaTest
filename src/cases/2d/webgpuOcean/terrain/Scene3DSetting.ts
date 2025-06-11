import { property, regClass, runInEditor } from "Decorators";
import { Script } from "laya/components/Script";
import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Vector4 } from "laya/maths/Vector4";
import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { DepthTextureMode } from "laya/resource/RenderTexture";
import { ClassUtils } from "laya/utils/ClassUtils";
import { LayaEnv } from "LayaEnv";

enum ColorSpace {
    Gamma,
    Linear,
}
@regClass('vzimHgZLRHCDC-DiVPuXtg') @runInEditor
export default class Scene3DSetting extends Script {

    @property({ type: ColorSpace, onChange: "onChangeColorSpace" })
    public colorSpace = ColorSpace.Gamma;

    @property({ type: Boolean, onChange: "onChangeCustomSH" })
    public enableCustomSH = false;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHAr", hidden: "!data.enableCustomSH" })
    public SHAr: Vector4;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHAg", hidden: "!data.enableCustomSH" })
    public SHAg: Vector4;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHAb", hidden: "!data.enableCustomSH" })
    public SHAb: Vector4;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHBr", hidden: "!data.enableCustomSH" })
    public SHBr: Vector4;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHBg", hidden: "!data.enableCustomSH" })
    public SHBg: Vector4;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHBb", hidden: "!data.enableCustomSH" })
    public SHBb: Vector4;
    @property({ type: Vector4, fractionDigits: 7, onChange: "onChangeSHC", hidden: "!data.enableCustomSH" })
    public SHC: Vector4;

    public onAwake(): void {
        let camera = this.owner.getChildByName("Controller")?.getChildByName("Controller Camera") as Camera;
        if (camera) {
            camera.opaquePass = true;
            camera.depthTextureMode = DepthTextureMode.Depth;

            // camera.postProcess = camera.postProcess || new Laya.PostProcess();
            // camera.postProcess.clearEffect();

            // let colorGrading = new ColorGrading();
            // colorGrading.postExposure = 0.8; 
            // colorGrading

            // camera.postProcess.addEffect();
        }
    }

    public onStart(): void {
        if (!LayaEnv.isPlaying) (this.owner as any)._shaderValues.addDefine(Shader3D.getDefineByName("EDITOR_ON"));
        this.onChangeColorSpace();
        this.onChangeCustomSH();

        this.SHAr = new Vector4(0.0000000, 0.1081201, 0.0000000, 0.7877415);
        this.SHAg = new Vector4(0.0000000, 0.2183584, 0.0000000, 0.7245546);
        this.SHAb = new Vector4(0.0000000, 0.2391598, 0.0000000, 0.6245860);
        this.SHBr = new Vector4(0.0000000, 0.0000000, 0.0860506, 0.0000000)
        this.SHBg = new Vector4(0.0000000, 0.0000000, 0.0411106, 0.0000000);
        this.SHBb = new Vector4(0.0000000, 0.0000000, 0.0162586, 0.0000000);
        this.SHC = new Vector4(0.0860507, 0.0411106, 0.0162587, 1.0000000);
    }

    private onChangeColorSpace(): void {
        if (this.owner) {
            if (this.colorSpace == ColorSpace.Gamma) {
                (this.owner as any)._shaderValues.addDefine(Shader3D.getDefineByName("COLORSPACE_GAMMA"));
            } else {
                (this.owner as any)._shaderValues.removeDefine(Shader3D.getDefineByName("COLORSPACE_GAMMA"));
            }
        }
    }

    private onChangeCustomSH(): void {
        if (this.enableCustomSH) {
            (this.owner as any)._shaderValues.addDefine(Shader3D.getDefineByName("ENABLECUSTOMSH"));
            const sceneUniformMap = Scene3D.sceneUniformMap as any;
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHAr"), "u_SHAr");
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHAg"), "u_SHAg");
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHAb"), "u_SHAb");
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHBr"), "u_SHBr");
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHBg"), "u_SHBg");
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHBb"), "u_SHBb");
            sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID("u_SHC"), "u_SHC");

            this.onChangeSHAr();
            this.onChangeSHAg();
            this.onChangeSHAb();
            this.onChangeSHBr();
            this.onChangeSHBg();
            this.onChangeSHBb();
            this.onChangeSHC();
        } else {
            (this.owner as any)._shaderValues.removeDefine(Shader3D.getDefineByName("ENABLECUSTOMSH"));
        }
    }

    private onChangeSHAr(): void {
    }

    private onChangeSHAg(): void {
    }

    private onChangeSHAb(): void {
    }

    private onChangeSHBr(): void {
    }

    private onChangeSHBg(): void {
    }

    private onChangeSHBb(): void {
    }

    private onChangeSHC(): void {
    }
}
ClassUtils.regClass("Scene3DSetting", Scene3DSetting);

import SSAOFrag from "./files/SSAOFrag.glsl";
import VertexVS from "./files/VertexDefault.vs";
import Sample14FS from "./files/Sample14.fs";
import BlurFS from "./files/Blur.fs";
import FinalFS from "./files/Final.fs";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { RenderTexture } from "laya/resource/RenderTexture";
import { SubShader } from "laya/RenderEngine/RenderShader/SubShader";
import { RenderState } from "laya/RenderDriver/RenderModuleData/Design/RenderState";
import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { Vector3 } from "laya/maths/Vector3";
import { Texture2D } from "laya/resource/Texture2D";
import { Material } from "laya/resource/Material";
import { Vector2 } from "laya/maths/Vector2";
import { Vector4 } from "laya/maths/Vector4";
import { PostProcess } from "laya/d3/core/render/postProcessBase/PostProcess";
import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { PostProcessRenderContext } from "laya/d3/core/render/postProcessBase/PostProcessRenderContext";
import { PostProcessEffect } from "laya/d3/core/render/postProcessBase/PostProcessEffect";
import { property, regClass } from "Decorators";



enum SSAOSamples {
    Low,
    Medium,
    High
}

@regClass('YeICqnfoRP-t44xPp-gXuw')
export class SSAOEffect extends PostProcessEffect {
    @property({ type: Number })
    public radius = 0.4;
    @property({ type: SSAOSamples })
    public sampleCount = SSAOSamples.Medium;
    @property({ type: Number })
    public occlusionIntensity = 1.5;
    @property({ type: Number })
    public blur = 2;
    @property({ type: Number })
    public downsampling = 2;
    @property({ type: Number })
    public occlusionAttenuation = 1;
    @property({ type: Number })
    public minZ = 1;
    @property({ type: Texture2D })
    public randomTexture: Texture2D = null;

    private mat: Material;

    private farCorner = new Vector3();
    private noiseScale = new Vector2();
    private param = new Vector4();
    private scaleOffset = new Vector4();

    public effectInit(postprocess: PostProcess): void {
        super.effectInit(postprocess);

        Shader3D.addInclude("SSAOFrag.glsl", SSAOFrag)

        let attributeMap: { [name: string]: [number, ShaderDataType] } = {
            "a_PositionTexcoord": [VertexMesh.MESH_POSITION0, ShaderDataType.Vector4]
        };

        let uniformMap = {
            "u_OffsetScale": ShaderDataType.Vector4,
            "u_MainTex": ShaderDataType.Texture2D,
            "u_MainTex_TexelSize": ShaderDataType.Vector4, //x:width,y:height,z:1/width,w:1/height
            "u_RandomTexture": ShaderDataType.Texture2D,
            "u_SSAO": ShaderDataType.Texture2D,
            "u_Params": ShaderDataType.Vector4,
            "u_NoiseScale": ShaderDataType.Vector2,
            "u_TexelOffsetScale": ShaderDataType.Vector4
        };

        let shader = Shader3D.add("SSAO");
        let subShader = new SubShader(attributeMap, uniformMap);
        shader.addSubShader(subShader);
        let shaderPass = subShader.addShaderPass(VertexVS, Sample14FS);
        shaderPass.renderState.depthTest = RenderState.DEPTHTEST_ALWAYS;
        shaderPass.renderState.depthWrite = false;
        shaderPass.renderState.cull = RenderState.CULL_NONE;
        shaderPass.renderState.blend = RenderState.BLEND_DISABLE;

        subShader = new SubShader(attributeMap, uniformMap);
        shader.addSubShader(subShader);
        shaderPass = subShader.addShaderPass(VertexVS, BlurFS);
        shaderPass.renderState.depthTest = RenderState.DEPTHTEST_ALWAYS;
        shaderPass.renderState.depthWrite = false;
        shaderPass.renderState.cull = RenderState.CULL_NONE;
        shaderPass.renderState.blend = RenderState.BLEND_DISABLE;

        subShader = new SubShader(attributeMap, uniformMap);
        shader.addSubShader(subShader);
        shaderPass = subShader.addShaderPass(VertexVS, FinalFS);
        shaderPass.renderState.depthTest = RenderState.DEPTHTEST_ALWAYS;
        shaderPass.renderState.depthWrite = false;
        shaderPass.renderState.cull = RenderState.CULL_NONE;
        shaderPass.renderState.blend = RenderState.BLEND_DISABLE;

        this.mat = new Material();
        this.mat.setShaderName("SSAO");
    }

    public render(context: PostProcessRenderContext): void {
        let cmd = context.command;

        this.mat.setTexture("u_RandomTexture", this.randomTexture);

        this.downsampling = this.clamp(this.downsampling, 1, 6);
        this.radius = this.clamp(this.radius, 0.05, 1.0);
        this.minZ = this.clamp(this.minZ, 0.00001, 0.5);
        this.occlusionIntensity = this.clamp(this.occlusionIntensity, 0.5, 4.0);
        this.occlusionAttenuation = this.clamp(this.occlusionAttenuation, 0.2, 2.0);
        this.blur = this.clamp(this.blur, 0, 4);

        let rtAO = RenderTexture.createFromPool(context.source.width / this.downsampling, context.source.height / this.downsampling, RenderTargetFormat.R8G8B8A8, RenderTargetFormat.None, false);
        let fovY = context.camera.fieldOfView;
        let far = context.camera.farPlane;
        let y = Math.tan(fovY * (Math.PI / 180) * 0.5) * far;
        let x = y * context.camera.aspectRatio;
        this.farCorner.setValue(x, y, far);
        this.mat.setVector3("u_FarCorner", this.farCorner);

        let noiseWidth = 1;
        let noiseHeight = 1;
        if (this.randomTexture) {
            noiseWidth = this.randomTexture.width;
            noiseHeight = this.randomTexture.height;
        }
        this.noiseScale.setValue(rtAO.width / noiseWidth, rtAO.height / noiseHeight);
        this.mat.setVector2("u_NoiseScale", this.noiseScale);

        this.param.setValue(this.radius, this.minZ, 1.0 / this.occlusionAttenuation, this.occlusionIntensity);
        this.mat.setVector4("u_Params", this.param);

        let doBlur = this.blur > 0;

        cmd.blitScreenQuadByMaterial(doBlur ? null : context.source, rtAO, null, this.mat, 0);

        if (doBlur) {
            let rtBlurX = RenderTexture.createFromPool(context.source.width, context.source.height, RenderTargetFormat.R8G8B8A8, RenderTargetFormat.None, false);
            this.scaleOffset.setValue(this.blur / context.source.width, 0, 0, 0);
            // this.mat.setVector4("u_TexelOffsetScale", this.scaleOffset);
            cmd.setShaderDataVector(this.mat.shaderData, Shader3D.propertyNameToID("u_TexelOffsetScale"), this.scaleOffset);
            cmd.setShaderDataTexture(this.mat.shaderData, Shader3D.propertyNameToID("u_SSAO"), rtAO);
            cmd.blitScreenQuadByMaterial(null, rtBlurX, null, this.mat, 1);

            context.deferredReleaseTextures.push(rtAO);

            let rtBlurY = RenderTexture.createFromPool(context.source.width, context.source.height, RenderTargetFormat.R8G8B8A8, RenderTargetFormat.None, false);
            this.scaleOffset.setValue(0, this.blur / context.source.height, 0, 0);
            cmd.setShaderDataVector(this.mat.shaderData, Shader3D.propertyNameToID("u_TexelOffsetScale"), this.scaleOffset);
            // this.mat.setVector4("u_TexelOffsetScale", this.scaleOffset);
            cmd.setShaderDataTexture(this.mat.shaderData, Shader3D.propertyNameToID("u_SSAO"), rtBlurX);
            cmd.blitScreenQuadByMaterial(null, rtBlurY, null, this.mat, 1);

            context.deferredReleaseTextures.push(rtBlurX);
            rtAO = rtBlurY;
        }

        cmd.setShaderDataTexture(this.mat.shaderData, Shader3D.propertyNameToID("u_SSAO"), rtAO);
        cmd.blitScreenQuadByMaterial(context.source, context.destination, null, this.mat, 2);

        context.deferredReleaseTextures.push(rtAO);
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }
}
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
import { Image } from "laya/ui/Image";
import { Texture } from "laya/resource/Texture";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";

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




const initialSpectrumCS = `
const PI : f32 = 3.1415926;

@group(0) @binding(1) var WavesData : texture_storage_2d<rgba32float, write>;
@group(0) @binding(2) var H0K : texture_storage_2d<rg32float, write>;
@group(0) @binding(4) var Noise : texture_2d<f32>;

struct Params {
    Size : u32,
    LengthScale : f32,
    CutoffHigh : f32,
    CutoffLow : f32,
    GravityAcceleration : f32,
    Depth : f32,
};

@group(0) @binding(5) var<uniform> params : Params;

struct SpectrumParameter {
	scale : f32,
	angle : f32,
	spreadBlend : f32,
	swell : f32,
	alpha : f32,
	peakOmega : f32,
	gamma : f32,
	shortWavesFade : f32,
};

struct SpectrumParameters {
    elements : array<SpectrumParameter>,
};

@group(0) @binding(6) var<storage, read> spectrums : SpectrumParameters;

fn frequency(k: f32, g: f32, depth: f32) -> f32
{
	return sqrt(g * k * tanh(min(k * depth, 20.0)));
}

fn frequencyDerivative(k: f32, g: f32, depth: f32) -> f32
{
	let th = tanh(min(k * depth, 20.0));
	let ch = cosh(k * depth);
	return g * (depth * k / ch / ch + th) / frequency(k, g, depth) / 2.0;
}

fn normalisationFactor(s: f32) -> f32
{
	let s2 = s * s;
	let s3 = s2 * s;
	let s4 = s3 * s;
	if (s < 5.0) {
		return -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;
    }
	return -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;
}

fn cosine2s(theta: f32, s: f32) -> f32
{
	return normalisationFactor(s) * pow(abs(cos(0.5 * theta)), 2.0 * s);
}

fn spreadPower(omega: f32, peakOmega: f32) -> f32
{
	if (omega > peakOmega) {
		return 9.77 * pow(abs(omega / peakOmega), -2.5);
	}
	return 6.97 * pow(abs(omega / peakOmega), 5.0);
}

fn directionSpectrum(theta: f32, omega: f32, pars: SpectrumParameter) -> f32
{
	let s = spreadPower(omega, pars.peakOmega) + 16.0 * tanh(min(omega / pars.peakOmega, 20.0)) * pars.swell * pars.swell;
	return mix(2.0 / PI * cos(theta) * cos(theta), cosine2s(theta - pars.angle, s), pars.spreadBlend);
}

fn TMACorrection(omega: f32, g: f32, depth: f32) -> f32
{
	let omegaH = omega * sqrt(depth / g);
	if (omegaH <= 1.0) {
		return 0.5 * omegaH * omegaH;
    }
	if (omegaH < 2.0) {
		return 1.0 - 0.5 * (2.0 - omegaH) * (2.0 - omegaH);
    }
	return 1.0;
}

fn JONSWAP(omega: f32, g: f32, depth: f32, pars: SpectrumParameter) -> f32
{
	var sigma: f32;
	if (omega <= pars.peakOmega) {
		sigma = 0.07;
    } else {
		sigma = 0.09;
    }
	let r = exp(-(omega - pars.peakOmega) * (omega - pars.peakOmega) / 2.0 / sigma / sigma / pars.peakOmega / pars.peakOmega);
	
	let oneOverOmega = 1.0 / omega;
	let peakOmegaOverOmega = pars.peakOmega / omega;

	return pars.scale * TMACorrection(omega, g, depth) * pars.alpha * g * g
		* oneOverOmega * oneOverOmega * oneOverOmega * oneOverOmega * oneOverOmega
		* exp(-1.25 * peakOmegaOverOmega * peakOmegaOverOmega * peakOmegaOverOmega * peakOmegaOverOmega)
		* pow(abs(pars.gamma), r);
}

fn shortWavesFade(kLength: f32, pars: SpectrumParameter) -> f32
{
	return exp(-pars.shortWavesFade * pars.shortWavesFade * kLength * kLength);
}

@compute @workgroup_size(8,8,1)
fn calculateInitialSpectrum(@builtin(global_invocation_id) id : vec3<u32>)
{
	let deltaK = 2.0 * PI / params.LengthScale;
	let nx = f32(id.x) - f32(params.Size) / 2.0;
	let nz = f32(id.y) - f32(params.Size) / 2.0;
	let k = vec2<f32>(nx, nz) * deltaK;
	let kLength = length(k);

	if (kLength <= params.CutoffHigh && kLength >= params.CutoffLow) {
		let omega = frequency(kLength, params.GravityAcceleration, params.Depth);
		textureStore(WavesData, vec2<i32>(id.xy), vec4<f32>(k.x, 1.0 / kLength, k.y, omega));

		let kAngle = atan2(k.y, k.x);
		let dOmegadk = frequencyDerivative(kLength, params.GravityAcceleration, params.Depth);
		var spectrum = JONSWAP(omega, params.GravityAcceleration, params.Depth, spectrums.elements[0]) * directionSpectrum(kAngle, omega, spectrums.elements[0]) * shortWavesFade(kLength, spectrums.elements[0]);
		if (spectrums.elements[1].scale > 0.0) {
			spectrum = spectrum + JONSWAP(omega, params.GravityAcceleration, params.Depth, spectrums.elements[1]) * directionSpectrum(kAngle, omega, spectrums.elements[1]) * shortWavesFade(kLength, spectrums.elements[1]);
        }
        let noise = textureLoad(Noise, vec2<i32>(id.xy), 0).xy;
        textureStore(H0K, vec2<i32>(id.xy), vec4<f32>(noise * sqrt(2.0 * spectrum * abs(dOmegadk) / kLength * deltaK * deltaK), 0., 0.));
	} else {
		textureStore(H0K, vec2<i32>(id.xy), vec4<f32>(0.0));
		textureStore(WavesData, vec2<i32>(id.xy), vec4<f32>(k.x, 1.0, k.y, 0.0));
	}    
}
`

const initialSpectrum2CS = `
@group(0) @binding(0) var H0 : texture_storage_2d<rgba32float, write>;

struct Params {
    Size : u32,
    LengthScale : f32,
    CutoffHigh : f32,
    CutoffLow : f32,
    GravityAcceleration : f32,
    Depth : f32,
};

@group(0) @binding(5) var<uniform> params : Params;

@group(0) @binding(8) var H0K : texture_2d<f32>;

@compute @workgroup_size(8,8,1)
fn calculateConjugatedSpectrum(@builtin(global_invocation_id) id : vec3<u32>)
{
    let h0K = textureLoad(H0K, vec2<i32>(id.xy), 0).xy;
	let h0MinusK = textureLoad(H0K, vec2<i32>(i32(params.Size - id.x) % i32(params.Size), i32(params.Size - id.y) % i32(params.Size)), 0);

    textureStore(H0, vec2<i32>(id.xy), vec4<f32>(h0K.x, h0K.y, h0MinusK.x, -h0MinusK.y));
}
`

const fftPrecomputeCS = `
const PI: f32 = 3.1415926;

@group(0) @binding(0) var PrecomputeBuffer : texture_storage_2d<rgba32float, write>;

struct Params {
    Step : i32,
    Size : i32,
};

@group(0) @binding(1) var<uniform> params : Params;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

fn complexExp(a: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(cos(a.y), sin(a.y)) * exp(a.x);
}

@compute @workgroup_size(1,8,1)
fn precomputeTwiddleFactorsAndInputIndices(@builtin(global_invocation_id) id : vec3<u32>)
{
    let iid = vec3<i32>(id);
	let b = params.Size >> (id.x + 1u);
	let mult = 2.0 * PI * vec2<f32>(0.0, -1.0) / f32(params.Size);
	let i = (2 * b * (iid.y / b) + (iid.y % b)) % params.Size;
	let twiddle = complexExp(mult * vec2<f32>(f32((iid.y / b) * b)));
	
    textureStore(PrecomputeBuffer, iid.xy, vec4<f32>(twiddle.x, twiddle.y, f32(i), f32(i + b)));
	textureStore(PrecomputeBuffer, vec2<i32>(iid.x, iid.y + params.Size / 2), vec4<f32>(-twiddle.x, -twiddle.y, f32(i), f32(i + b)));
}
`

const fftInverseFFTCS = `
struct Params {
    Step : i32,
    Size : i32,
};

@group(0) @binding(1) var<uniform> params : Params;

@group(0) @binding(3) var PrecomputedData : texture_2d<f32>;

@group(0) @binding(5) var InputBuffer : texture_2d<f32>;
@group(0) @binding(6) var OutputBuffer : texture_storage_2d<rg32float, write>;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

@compute @workgroup_size(8,8,1)
fn horizontalStepInverseFFT(@builtin(global_invocation_id) id : vec3<u32>)
{
    let iid = vec3<i32>(id);
    let data = textureLoad(PrecomputedData, vec2<i32>(params.Step, iid.x), 0);
	let inputsIndices = vec2<i32>(data.ba);

    let input0 = textureLoad(InputBuffer, vec2<i32>(inputsIndices.x, iid.y), 0);
    let input1 = textureLoad(InputBuffer, vec2<i32>(inputsIndices.y, iid.y), 0);

    textureStore(OutputBuffer, iid.xy, vec4<f32>(
        input0.xy + complexMult(vec2<f32>(data.r, -data.g), input1.xy), 0., 0.
    ));
}
`

const fftInverseFFT2CS = `
struct Params {
    Step : i32,
    Size : i32,
};

@group(0) @binding(1) var<uniform> params : Params;

@group(0) @binding(3) var PrecomputedData : texture_2d<f32>;

@group(0) @binding(5) var InputBuffer : texture_2d<f32>;
@group(0) @binding(6) var OutputBuffer : texture_storage_2d<rg32float, write>;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

@compute @workgroup_size(8,8,1)
fn verticalStepInverseFFT(@builtin(global_invocation_id) id : vec3<u32>)
{
    let iid = vec3<i32>(id);
    let data = textureLoad(PrecomputedData, vec2<i32>(params.Step, iid.y), 0);
	let inputsIndices = vec2<i32>(data.ba);

    let input0 = textureLoad(InputBuffer, vec2<i32>(iid.x, inputsIndices.x), 0);
    let input1 = textureLoad(InputBuffer, vec2<i32>(iid.x, inputsIndices.y), 0);

    textureStore(OutputBuffer, iid.xy, vec4<f32>(
        input0.xy + complexMult(vec2<f32>(data.r, -data.g), input1.xy), 0., 0.
    ));
}
`

const fftInverseFFT3CS = `
@group(0) @binding(5) var InputBuffer : texture_2d<f32>;
@group(0) @binding(6) var OutputBuffer : texture_storage_2d<rg32float, write>;

@compute @workgroup_size(8,8,1)
fn permute(@builtin(global_invocation_id) id : vec3<u32>)
{
    let iid = vec3<i32>(id);
    let input = textureLoad(InputBuffer, iid.xy, 0);

    textureStore(OutputBuffer, iid.xy, input * (1.0 - 2.0 * f32((iid.x + iid.y) % 2)));
}
`

const timeDependentSpectrumCS = `
@group(0) @binding(1) var H0 : texture_2d<f32>;
@group(0) @binding(3) var WavesData : texture_2d<f32>;

struct Params {
    Time : f32,
};

@group(0) @binding(4) var<uniform> params : Params;

@group(0) @binding(5) var DxDz : texture_storage_2d<rg32float, write>;
@group(0) @binding(6) var DyDxz : texture_storage_2d<rg32float, write>;
@group(0) @binding(7) var DyxDyz : texture_storage_2d<rg32float, write>;
@group(0) @binding(8) var DxxDzz : texture_storage_2d<rg32float, write>;

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32>
{
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

@compute @workgroup_size(8,8,1)
fn calculateAmplitudes(@builtin(global_invocation_id) id : vec3<u32>)
{
    let iid = vec3<i32>(id);
	let wave = textureLoad(WavesData, iid.xy, 0);
	let phase = wave.w * params.Time;
	let exponent = vec2<f32>(cos(phase), sin(phase));
    let h0 = textureLoad(H0, iid.xy, 0);
	let h = complexMult(h0.xy, exponent) + complexMult(h0.zw, vec2<f32>(exponent.x, -exponent.y));
	let ih = vec2<f32>(-h.y, h.x);

	let displacementX = ih * wave.x * wave.y;
	let displacementY = h;
	let displacementZ = ih * wave.z * wave.y;

	let displacementX_dx = -h * wave.x * wave.x * wave.y;
	let displacementY_dx = ih * wave.x;
	let displacementZ_dx = -h * wave.x * wave.z * wave.y;
		 
	let displacementY_dz = ih * wave.z;
	let displacementZ_dz = -h * wave.z * wave.z * wave.y;

	textureStore(DxDz,   iid.xy, vec4<f32>(displacementX.x - displacementZ.y, displacementX.y + displacementZ.x, 0., 0.));
	textureStore(DyDxz,  iid.xy, vec4<f32>(displacementY.x - displacementZ_dx.y, displacementY.y + displacementZ_dx.x, 0., 0.));
	textureStore(DyxDyz, iid.xy, vec4<f32>(displacementY_dx.x - displacementY_dz.y, displacementY_dx.y + displacementY_dz.x, 0., 0.));
	textureStore(DxxDzz, iid.xy, vec4<f32>(displacementX_dx.x - displacementZ_dz.y, displacementX_dx.y + displacementZ_dz.x, 0., 0.));
}
`

const wavesTexturesMergerCS = `
struct Params {
    Lambda : f32,
    DeltaTime : f32,
};

@group(0) @binding(0) var<uniform> params : Params;

@group(0) @binding(1) var Displacement : texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var Derivatives : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var TurbulenceRead : texture_2d<f32>;
@group(0) @binding(4) var TurbulenceWrite : texture_storage_2d<rgba16float, write>;

@group(0) @binding(5) var Dx_Dz : texture_2d<f32>;
@group(0) @binding(6) var Dy_Dxz : texture_2d<f32>;
@group(0) @binding(7) var Dyx_Dyz : texture_2d<f32>;
@group(0) @binding(8) var Dxx_Dzz : texture_2d<f32>;

@compute @workgroup_size(8,8,1)
fn fillResultTextures(@builtin(global_invocation_id) id : vec3<u32>)
{
    let iid = vec3<i32>(id);

	let DxDz = textureLoad(Dx_Dz, iid.xy, 0);
	let DyDxz = textureLoad(Dy_Dxz, iid.xy, 0);
	let DyxDyz = textureLoad(Dyx_Dyz, iid.xy, 0);
	let DxxDzz = textureLoad(Dxx_Dzz, iid.xy, 0);
	
	textureStore(Displacement, iid.xy, vec4<f32>(params.Lambda * DxDz.x, DyDxz.x, params.Lambda * DxDz.y, 0.));
	textureStore(Derivatives, iid.xy, vec4<f32>(DyxDyz.x, DyxDyz.y, DxxDzz.x * params.Lambda, DxxDzz.y * params.Lambda));

	let jacobian = (1.0 + params.Lambda * DxxDzz.x) * (1.0 + params.Lambda * DxxDzz.y) - params.Lambda * params.Lambda * DyDxz.y * DyDxz.y;

    var turbulence = textureLoad(TurbulenceRead, iid.xy, 0).r + params.DeltaTime * 0.5 / max(jacobian, 0.5);
    turbulence = min(jacobian, turbulence);

    textureStore(TurbulenceWrite, iid.xy, vec4<f32>(turbulence, turbulence, turbulence, 1.));
}
`

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
            @group(0) @binding(0) var<storage,read_write> data:array<f32>;
            @group(0) @binding(1) var readTex:texture_2d<f32>;
            //@group(0) @binding(2) var writeTex:texture_2d<f32>;
            @compute @workgroup_size(1) fn computeDoubleMulData(
                @builtin(global_invocation_id) id: vec3u
            ){
                let i = id.x;
                data[i] = data[i] * 2.0;
            }`

    let renderDevFactory = LayaGL.renderDeviceFactory;
    let uniformCommandMap = renderDevFactory.createGlobalUniformMap("changeArray");
    let propertyID = Shader3D.propertyNameToID("data");
    let rtexID = Shader3D.propertyNameToID('readTex');
    let wtexID = Shader3D.propertyNameToID('writeTex');
    uniformCommandMap.addShaderUniform(propertyID, "data", ShaderDataType.DeviceBuffer);
    uniformCommandMap.addShaderUniform(rtexID,'readTex',ShaderDataType.Texture2D);
    //uniformCommandMap.addShaderUniform(wtexID,'writeTex', ShaderDataType.Texture2D);

    let computeshader = ComputeShader.createComputeShader("changeArray", code, [uniformCommandMap]);
    let shaderDefine = LayaGL.unitRenderModuleDataFactory.createDefineDatas();

    //创建ShaderData和StorageBuffer
    let shaderData = renderDevFactory.createShaderData();
    let strotageBuffer = renderDevFactory.createDeviceBuffer(EDeviceBufferUsage.STORAGE | EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.COPY_SRC);

    let array = new Float32Array([1, 3, 5]);
    strotageBuffer.setDataLength(array.byteLength);
    strotageBuffer.setData(array, 0, 0, array.byteLength);
    shaderData.setDeviceBuffer(propertyID, strotageBuffer);
    shaderData.setTexture(rtexID,genNoiseTex());
    let tex1 = new Texture2D(256,256,TextureFormat.R32G32B32A32,false,false);
    //shaderData.setTexture(wtexID,tex1);

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
}


function testOcean(){

    //mtl.setTexture("u_MaskTexture",_maskTexture);

    let commands = new ComputeCommandBuffer();
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

    let width = 256;
    let height=256;
    const maskTexture2d = new Texture2D(width, height, TextureFormat.R8G8B8A8, false, false);
    const pixelData = new Uint8Array(width * height * 4);
    let idx=0;
    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            pixelData[idx++]=0xff;
            pixelData[idx++]=0xff;
            pixelData[idx++]=0xff;
            pixelData[idx++]=0xff;

        }
    }
    maskTexture2d.setPixelsData(pixelData, false, false);


    let imgMask = new Image();
    imgMask.width = 200;  // 设置合适的显示大小
    imgMask.height = 200;
    imgMask.pos(220, 10);
    let maskTexture =new Texture(maskTexture2d); 
    imgMask.source = maskTexture;
    Laya.stage.addChild(imgMask);




    // 创建 3D 场景
    let scene = new Scene3D();
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
    testOcean();

    function renderloop() {
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}


test();
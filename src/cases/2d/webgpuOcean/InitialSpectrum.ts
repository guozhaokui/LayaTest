import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { MyComputeShader } from "./MyComputeShader";
import { WavesSettings } from "./WavesSettings";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { EDeviceBufferUsage, IDeviceBuffer } from "laya/RenderDriver/DriverDesign/RenderDevice/IDeviceBuffer";
import { LayaGL } from "laya/layagl/LayaGL";

const initialSpectrumCS = `
const PI : f32 = 3.1415926;
struct Params {
    Size : u32,
    LengthScale : f32,
    CutoffHigh : f32,
    CutoffLow : f32,
    GravityAcceleration : f32,
    Depth : f32,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var WavesData : texture_storage_2d<rgba32float, write>;
@group(0) @binding(2) var H0K : texture_storage_2d<rg32float, write>;
@group(0) @binding(4) var Noise : texture_2d<f32>;

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

struct Params {
    Size : u32,
    LengthScale : f32,
    CutoffHigh : f32,
    CutoffLow : f32,
    GravityAcceleration : f32,
    Depth : f32,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var H0 : texture_storage_2d<rgba32float, write>;
@group(0) @binding(8) var H0K : texture_2d<f32>;

@compute @workgroup_size(8,8,1)
fn calculateConjugatedSpectrum(@builtin(global_invocation_id) id : vec3<u32>)
{
    let h0K = textureLoad(H0K, vec2<i32>(id.xy), 0).xy;
	let h0MinusK = textureLoad(H0K, vec2<i32>(i32(params.Size - id.x) % i32(params.Size), i32(params.Size - id.y) % i32(params.Size)), 0);

    textureStore(H0, vec2<i32>(id.xy), vec4<f32>(h0K.x, h0K.y, h0MinusK.x, -h0MinusK.y));
}
`

export class InitialSpectrum {
    _textureSize: number;
    _phase1:MyComputeShader;
    _phase2:MyComputeShader;
    _initialSpectrum:Texture2D;
    _precomputedData:Texture2D;
    _buffer:Texture2D;
    _spectrumParameters:IDeviceBuffer;
    _spectrumpBuff:Float32Array;

    constructor(textureSize: number, noise:Texture2D) {
        this._textureSize = textureSize;
        let cs1 = this._phase1 = new MyComputeShader('initialSpectrum', initialSpectrumCS, 'calculateInitialSpectrum',{
            "WavesData": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rgba32float'} },
            "H0K": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rg32float'} },
            "Noise": ShaderDataType.Texture2D,
            "Size" : ShaderDataType.Int,
            "LengthScale" : ShaderDataType.Float,
            "CutoffHigh" : ShaderDataType.Float,
            "CutoffLow" : ShaderDataType.Float,
            "GravityAcceleration" : ShaderDataType.Float,
            "Depth" : ShaderDataType.Float,
            //"params": { group: 0, binding: 5 },
            "spectrums": ShaderDataType.DeviceBuffer
        });
        this._initialSpectrum = new Texture2D(textureSize,textureSize, TextureFormat.R32G32B32A32,{isStorage:true});
        this._precomputedData = new Texture2D(textureSize,textureSize,TextureFormat.R32G32B32A32,{isStorage:true});
        this._buffer = new Texture2D(textureSize,textureSize,TextureFormat.R32G32,{isStorage:true});
        this._spectrumParameters = LayaGL.renderDeviceFactory.createDeviceBuffer(EDeviceBufferUsage.STORAGE | EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.COPY_SRC);
        this._spectrumParameters.setDataLength(8*4*2);
        this._spectrumpBuff = new Float32Array(8*2);
        cs1.setInt('Size',1);
        cs1.setNumber('LengthScale',1);
        cs1.setNumber('CutoffHigh',1);
        cs1.setNumber('CutoffLow',1);
        cs1.setNumber('GravityAcceleration',1);
        cs1.setNumber('Depth',1);
        cs1.setTexture('WavesData',this._precomputedData);
        cs1.setTexture('H0K',this._buffer);
        cs1.setTexture('Noise',noise);
        //cs1.setDeviceBuffer('spectrumParameters',this._spectrumParameters);
        cs1.setDeviceBuffer('spectrums',this._spectrumParameters);

        let cs2 = this._phase2 = new MyComputeShader('initialSpectrum2',initialSpectrum2CS,'calculateConjugatedSpectrum',{
            "Size" : ShaderDataType.Int,
            "LengthScale" : ShaderDataType.Float,
            "CutoffHigh" : ShaderDataType.Float,
            "CutoffLow" : ShaderDataType.Float,
            "GravityAcceleration" : ShaderDataType.Float,
            "Depth" : ShaderDataType.Float,
            "H0":{ type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rgba32float'} },
            "H0K":ShaderDataType.Texture2D,
        });
        cs2.setTexture('H0', this._initialSpectrum);
        cs2.setInt('Size',1);
        cs2.setNumber('LengthScale',1);
        cs2.setNumber('CutoffHigh',1);
        cs2.setNumber('CutoffLow',1);
        cs2.setNumber('GravityAcceleration',1);
        cs2.setNumber('Depth',1);
        cs2.setTexture('H0K', this._buffer);
        
    }

    get initialSpectrum() {
        return this._initialSpectrum;
    }
    get wavesData() {
        return this._precomputedData;
    }    

    async initAsync() {
        //等待shader准备好
    }

    clamp(v:number,min:number,max:number){
        return Math.min(Math.max(v,min),max)
    }

    _JonswapAlpha(g:number, fetch:number, windSpeed:number) {
        return 0.076 * Math.pow(g * fetch / windSpeed / windSpeed, -0.22);
    }

    _JonswapPeakFrequency(g:number, fetch:number, windSpeed:number) {
        return 22 * Math.pow(windSpeed * fetch / g / g, -0.33);
    }    

    generate(wavesSettings:WavesSettings, lengthScale:number, cutoffLow:number, cutoffHigh:number) {
        let cs = this._phase1;
        cs.setInt('Size',this._textureSize);
        cs.setNumber('LengthScale',lengthScale);
        cs.setNumber('CutoffHigh',cutoffHigh);
        cs.setNumber('CutoffLow',cutoffLow);
        cs.setNumber('GravityAcceleration',wavesSettings.g);
        cs.setNumber('Depth',wavesSettings.depth);

        let buff = this._spectrumpBuff;
        let i = 0;
        let display = wavesSettings.local;
        //local 参数
        buff[i++]= display.scale;
        buff[i++]= display.windDirection / 180 * Math.PI;
        buff[i++]= display.spreadBlend;
        buff[i++]= this.clamp(display.swell, 0.01, 1);
        buff[i++]= this._JonswapAlpha(wavesSettings.g, display.fetch, display.windSpeed);
        buff[i++] = this._JonswapPeakFrequency(wavesSettings.g, display.fetch, display.windSpeed);
        buff[i++] = display.peakEnhancement;
        buff[i++] = display.shortWavesFade;     
        
        //swell参数
        display = wavesSettings.swell;
        buff[i++]= display.scale;
        buff[i++]= display.windDirection / 180 * Math.PI;
        buff[i++]= display.spreadBlend;
        buff[i++]= this.clamp(display.swell, 0.01, 1);
        buff[i++]= this._JonswapAlpha(wavesSettings.g, display.fetch, display.windSpeed);
        buff[i++] = this._JonswapPeakFrequency(wavesSettings.g, display.fetch, display.windSpeed);
        buff[i++] = display.peakEnhancement;
        buff[i++] = display.shortWavesFade;     

        this._spectrumParameters.setData(buff.buffer,0,0,buff.byteLength);
        cs.setDeviceBuffer('spectrums',this._spectrumParameters);

        cs.dispatch(this._textureSize,this._textureSize,1);

        cs = this._phase2;
        cs.setInt('Size',this._textureSize);
        cs.setNumber('LengthScale',lengthScale);
        cs.setNumber('CutoffHigh',cutoffHigh);
        cs.setNumber('CutoffLow',cutoffLow);
        cs.setNumber('GravityAcceleration',wavesSettings.g);
        cs.setNumber('Depth',wavesSettings.depth);
        cs.dispatch(this._textureSize,this._textureSize,1);
    }
}
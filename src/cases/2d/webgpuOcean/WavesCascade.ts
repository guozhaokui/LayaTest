import { Texture2D } from "laya/resource/Texture2D";
import { FFT } from "./FFT"
import { InitialSpectrum } from "./InitialSpectrum";
import { WavesSettings } from "./WavesSettings";
import { MyComputeShader } from "./MyComputeShader";
import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { Laya } from "Laya";
import { ILaya } from "ILaya";

const timeDependentSpectrumCS = `
struct Params {
    Time : f32,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var H0 : texture_2d<f32>;
@group(0) @binding(3) var WavesData : texture_2d<f32>;

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

export class WavesCascade {
    _fft: FFT;
    _size: number;
    _initialSpectrum: InitialSpectrum;
    _lambda:number;
    _timeDependentSpectrum:MyComputeShader;
    _buffer:Texture2D;
    _DxDz:Texture2D;
    _DyDxz:Texture2D;
    _DyxDyz:Texture2D;
    _DxxDzz:Texture2D;
    _displacement:Texture2D;
    _derivatives:Texture2D;
    _turbulence:Texture2D;
    _turbulence2:Texture2D;
    _pingPongTurbulence = false;

    _texturesMerger:MyComputeShader;

    constructor(size: number, fft: FFT, noise:Texture2D) {
        this._size = size;
        this._fft = fft;
        this._initialSpectrum = new InitialSpectrum(size,noise);
        let cs = this._timeDependentSpectrum = new MyComputeShader('timeDependentSpectrumCS',timeDependentSpectrumCS,'calculateAmplitudes',{
            "Time":ShaderDataType.Float,
            "H0": ShaderDataType.Texture2D,
            "WavesData": ShaderDataType.Texture2D,
            "DxDz": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rg32float'} },
            "DyDxz": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rg32float'} },
            "DyxDyz": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rg32float'} },
            "DxxDzz": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rg32float'} },
        })

        this._buffer = new Texture2D(this._size,this._size,TextureFormat.R32G32,{isStorage:true});
        this._DxDz   = new Texture2D(this._size,this._size,TextureFormat.R32G32,{isStorage:true});
        this._DyDxz  = new Texture2D(this._size,this._size,TextureFormat.R32G32,{isStorage:true});
        this._DyxDyz = new Texture2D(this._size,this._size,TextureFormat.R32G32,{isStorage:true});
        this._DxxDzz = new Texture2D(this._size,this._size,TextureFormat.R32G32,{isStorage:true});

        cs.setInt('Time',1);
        cs.setTexture('H0',this._initialSpectrum._initialSpectrum);
        cs.setTexture('WavesData',this._initialSpectrum.wavesData);
        cs.setTexture('DxDz',this._DxDz);
        cs.setTexture('DyDxz',this._DyDxz);
        cs.setTexture('DyxDyz',this._DyxDyz);
        cs.setTexture('DxxDzz',this._DxxDzz);

        let cs2 = this._texturesMerger = new MyComputeShader('texturesMerger',wavesTexturesMergerCS,'fillResultTextures',{
            "Lambda": ShaderDataType.Float,
            "DeltaTime":ShaderDataType.Float,
            "Displacement": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rgba16float'} },
            "Derivatives": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rgba16float'} },
            "TurbulenceRead": ShaderDataType.Texture2D,
            "TurbulenceWrite": { type:ShaderDataType.Texture2DStorage, ext:{textureFormat:'rgba16float'} },
            "DxDz": ShaderDataType.Texture2D,
            "DyDxz": ShaderDataType.Texture2D,
            "DyxDyz": ShaderDataType.Texture2D,
            "DxxDzz": ShaderDataType.Texture2D,
        });

        this._displacement = new Texture2D(this._size,this._size,TextureFormat.R16G16B16A16,{isStorage:true});
        this._derivatives = new Texture2D(this._size,this._size,TextureFormat.R16G16B16A16,{isStorage:true});
        this._turbulence = new Texture2D(this._size,this._size,TextureFormat.R16G16B16A16,{isStorage:true});
        this._turbulence2 = new Texture2D(this._size,this._size,TextureFormat.R16G16B16A16,{isStorage:true});
        cs2.setNumber('Lambda',1);
        cs2.setNumber('DeltaTime',1);
        cs2.setTexture('Displacement',this._displacement);
        cs2.setTexture('Derivatives',this._derivatives);
        cs2.setTexture('DxDz',this._DxDz);
        cs2.setTexture('DyDxz',this._DyDxz);
        cs2.setTexture('DyxDyz',this._DyxDyz);
        cs2.setTexture('DxxDzz',this._DxxDzz);

    }

    async initAsync() {
    }

    calculateInitials(wavesSettings:WavesSettings, lengthScale:number, cutoffLow:number, cutoffHigh:number) {
        this._lambda = wavesSettings.lambda;
        this._initialSpectrum.generate(wavesSettings, lengthScale, cutoffLow, cutoffHigh);
    }

    calculateWavesAtTime(time: number) {
        let cs = this._timeDependentSpectrum;
        cs.setNumber('Time',time);
        cs.dispatch(this._size,this._size,1);

        this._fft.IFFT2D(this._DxDz, this._buffer);
        this._fft.IFFT2D(this._DyDxz, this._buffer);
        this._fft.IFFT2D(this._DyxDyz, this._buffer);
        this._fft.IFFT2D(this._DxxDzz, this._buffer);

        let deltaTime = ILaya.timer.delta / 1000;
        if (deltaTime > 0.5) {
            // avoid too big delta time
            deltaTime = 0.5;
        }

        let texMerger = this._texturesMerger;
        texMerger.setNumber('Lambda', 1);
        texMerger.setNumber('DeltaTime', 1);

        this._pingPongTurbulence = !this._pingPongTurbulence;
        texMerger.setTexture('TurbulenceRead',this._pingPongTurbulence?this._turbulence:this._turbulence2);
        //setStorageTexture
        texMerger.setTexture('TurbulenceWrite',this._pingPongTurbulence ? this._turbulence2 : this._turbulence);
        texMerger.dispatch(this._size,this._size,1);
        //TODO 生成mipmap
        //generateMipmaps(this._derivatives.getInternalTexture());
        //generateMipmaps(this._pingPongTurbulence ? this._turbulence2.getInternalTexture() : this._turbulence.getInternalTexture());

    }

}
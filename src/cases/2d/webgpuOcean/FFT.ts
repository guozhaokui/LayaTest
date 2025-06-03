import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { MyComputeShader } from "./MyComputeShader";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";

const fftPrecomputeCS = `
const PI: f32 = 3.1415926;

struct Params {
    Step : i32,
    Size : i32,
    };
    
@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var PrecomputeBuffer : texture_storage_2d<rgba32float, write>;

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

@group(0) @binding(0) var<uniform> params : Params;

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

@group(0) @binding(0) var<uniform> params : Params;

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


export class FFT{
    _size:number;
    _computeTwiddleFactors:MyComputeShader
    _precomputedData:Texture2D;
    _horizontalStepIFFT:MyComputeShader[]=[];
    _verticalStepIFFT:MyComputeShader[]=[];
    _permute:MyComputeShader;

    constructor(size:number) {
        this._size = size;
        const cs = new MyComputeShader('computeTwiddleFactors', fftPrecomputeCS, 'precomputeTwiddleFactorsAndInputIndices',
            {
                'Step':ShaderDataType.Int,
                'Size':ShaderDataType.Int,
                'PrecomputeBuffer':{type:ShaderDataType.Texture2DStorage,ext:{textureFormat:'rgba32float'}},
            }
        )
        this._computeTwiddleFactors = cs;
        const logSize = Math.log2(size) | 0;
        this._precomputedData = new Texture2D(logSize,this._size,TextureFormat.R32G32,{isStorage:true});
        cs.setInt('Step',1);
        cs.setInt('Size',this._size);
        cs.setTexture('PrecomputeBuffer',this._precomputedData)
        this._createComputeShaders();
    }

    _createComputeShaders() {
        for (let i = 0; i < 2; ++i) {
            let cs = this._horizontalStepIFFT[i] = new MyComputeShader('horizontalStepIFFT',
                fftInverseFFTCS,
                'horizontalStepInverseFFT',
                {
                    'Step':ShaderDataType.Int,
                    'Size':ShaderDataType.Int,
                    'PrecomputedData':ShaderDataType.Texture2D,
                    'InputBuffer':ShaderDataType.Texture2D,
                    'OutputBuffer':{type:ShaderDataType.Texture2DStorage,ext:{textureFormat:'rg32float'}},
                });
            cs.setInt('Step',1);
            cs.setInt('Size',256);
            cs.setTexture('PrecomputedData',this._precomputedData);

            let cs1 = this._verticalStepIFFT[i] = new MyComputeShader('verticalStepIFFT',
                fftInverseFFT2CS,
                'verticalStepInverseFFT',
                {
                    'Step':ShaderDataType.Int,
                    'Size':ShaderDataType.Int,
                    'PrecomputedData':ShaderDataType.Texture2D,
                    'InputBuffer':ShaderDataType.Texture2D,
                    'OutputBuffer':{type:ShaderDataType.Texture2DStorage,ext:{textureFormat:'rg32float'}},
                }
            );

            cs1.setInt('Step',1);
            cs1.setInt('Size',256);
            cs1.setTexture('PrecomputedData',this._precomputedData);            
        }

        this._permute = new MyComputeShader('permute',fftInverseFFT3CS,'permute',
            {
                'InputBuffer':ShaderDataType.Texture2D,
                'OutputBuffer':{type:ShaderDataType.Texture2DStorage,ext:{textureFormat:'rg32float'}},
            }
        );

    }

    async initAsync() {
        const logSize = Math.log2(this._size) | 0;
        this._computeTwiddleFactors.dispatch(logSize,this._size/2,1);//原文是DispatchWhenReady
        //下面是检查shader是否都准备好了
        // const allCS = [];
        // this._horizontalStepIFFT.forEach((cs)=>allCS.push(cs));
        // this._verticalStepIFFT.forEach((cs)=>allCS.push(cs));
        // allCS.push(this._permute);
    }

    IFFT2D(input:Texture2D, buffer:Texture2D) {
        const logSize = Math.log2(this._size) | 0;
        let pingPong = false;
        for (let i = 0; i < logSize; ++i) {
            pingPong = !pingPong;
            this._computeTwiddleFactors.setInt('Step',i);
            this._horizontalStepIFFT[0].setInt('Step',i);
            this._horizontalStepIFFT[1].setInt('Step',i);
            this._verticalStepIFFT[0].setInt('Step',i);
            this._verticalStepIFFT[1].setInt('Step',i);
            //this._params.updateInt("Step", i);
            //this._params.update();
            this._horizontalStepIFFT[0].setTexture("InputBuffer", pingPong ? input : buffer);
            //this._horizontalStepIFFT[0].setStorageTexture("OutputBuffer", pingPong ? buffer : input);
            this._horizontalStepIFFT[0].setTexture("OutputBuffer", pingPong ? buffer : input);
            this._horizontalStepIFFT[0].dispatch(this._size, this._size, 1);
            //ComputeHelper.Dispatch(pingPong ? this._horizontalStepIFFT[0] : this._horizontalStepIFFT[1], this._size, this._size, 1);
        }
        for (let i = 0; i < logSize; ++i) {
            pingPong = !pingPong;
            //this._params.updateInt("Step", i);
            //this._params.update();
            this._computeTwiddleFactors.setInt('Step',i);
            this._horizontalStepIFFT[0].setInt('Step',i);
            this._horizontalStepIFFT[1].setInt('Step',i);
            this._verticalStepIFFT[0].setInt('Step',i);
            this._verticalStepIFFT[1].setInt('Step',i);

            this._verticalStepIFFT[0].setTexture("InputBuffer", pingPong ? input : buffer);
            //this._verticalStepIFFT[0].setStorageTexture("OutputBuffer", pingPong ? buffer : input);
            this._verticalStepIFFT[0].setTexture("OutputBuffer", pingPong ? buffer : input);
            this._verticalStepIFFT[0].dispatch(this._size, this._size, 1);
            //ComputeHelper.Dispatch(pingPong ? this._verticalStepIFFT[0] : this._verticalStepIFFT[1], this._size, this._size, 1);
        }
        if (pingPong) {
            ComputeHelper.CopyTexture(buffer, input, this._engine);
        }
        this._permute.setTexture("InputBuffer", input);
        //this._permute.setStorageTexture("OutputBuffer", buffer);
        this._permute.setTexture("OutputBuffer", buffer);
        this._permute.dispatch(this._size,this._size,1);
        ComputeHelper.CopyTexture(buffer, input, this._engine);
    }
}
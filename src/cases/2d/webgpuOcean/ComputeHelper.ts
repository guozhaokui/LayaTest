import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { Texture2D } from "laya/resource/Texture2D";
import { MyComputeShader } from "./MyComputeShader";
import { ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";

export class ComputeHelper {
    static _copyTexture4CS:MyComputeShader;
    static _copyTexture2CS:MyComputeShader;
    static _copyBufferTextureCS:MyComputeShader;
    static _copyTextureBufferCS:MyComputeShader;
    static _clearTextureCS:MyComputeShader;


    static _clearTextureComputeShader = `
        struct Params {
            color : vec4<f32>,
            width : u32,
            height : u32,
        };
        @group(0) @binding(0) var<uniform> params : Params;
        @group(0) @binding(1) var tbuf : texture_storage_2d<rgba32float, write>;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            textureStore(tbuf, vec2<i32>(global_id.xy), params.color);
        }
    `;
    static _copyTexture4ComputeShader = `
        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(0) var<uniform> params : Params;
        @group(0) @binding(1) var dest : texture_storage_2d<rgba32float, write>;
        @group(0) @binding(2) var src : texture_2d<f32>;


        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
            textureStore(dest, vec2<i32>(global_id.xy), pix);
        }
    `;
    static _copyTexture2ComputeShader = `
        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(0) var<uniform> params : Params;
        @group(0) @binding(1) var dest : texture_storage_2d<rg32float, write>;
        @group(0) @binding(2) var src : texture_2d<f32>;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
            textureStore(dest, vec2<i32>(global_id.xy), pix);
        }
    `;
    static _copyBufferTextureComputeShader = `
        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(0) var<uniform> params : Params;

        struct FloatArray {
            elements : array<f32>,
        };

        @group(0) @binding(1) var dest : texture_storage_2d<rgba32float, write>;
        @group(0) @binding(2) var<storage, read> src : FloatArray;

        @compute @workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;
            let pix : vec4<f32> = vec4<f32>(src.elements[offset], src.elements[offset + 1u], src.elements[offset + 2u], src.elements[offset + 3u]);
            textureStore(dest, vec2<i32>(global_id.xy), pix);
        }
    `;
    static _copyTextureBufferComputeShader = `
        struct Params {
            width : u32,
            height : u32,
        };
        @group(0) @binding(0) var<uniform> params : Params;

        struct FloatArray {
            elements : array<f32>,
        };

        @group(0) @binding(1) var src : texture_2d<f32>;
        @group(0) @binding(2) var<storage, write> dest : FloatArray;

        @compute, workgroup_size(8, 8, 1)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if (global_id.x >= params.width || global_id.y >= params.height) {
                return;
            }
            let offset : u32 = global_id.y * params.width * 4u + global_id.x * 4u;
            let pix : vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
            dest.elements[offset] = pix.r;
            dest.elements[offset + 1u] = pix.g;
            dest.elements[offset + 2u] = pix.b;
            dest.elements[offset + 3u] = pix.a;
        }
    `;

    static CopyTexture(source: Texture2D, dest: Texture2D) {
        const numChannels = source.format == TextureFormat.R32G32?2:4;
        if (!ComputeHelper._copyTexture4CS && numChannels === 4 || !ComputeHelper._copyTexture2CS && numChannels === 2) {
            const cs1 = new MyComputeShader(`copyTexture${numChannels}Compute`, numChannels === 4 ? ComputeHelper._copyTexture4ComputeShader : ComputeHelper._copyTexture2ComputeShader,
                'main',{
                    "width":ShaderDataType.Int,
                    "height":ShaderDataType.Int,
                    "dest":{type:ShaderDataType.Texture2DStorage, ext:{textureFormat:numChannels==4?'rgba32float':'rg32float'}},
                    "src":ShaderDataType.Texture2D,
                }
            )

            cs1.setInt('width',source.width);
            cs1.setInt('height', source.height);
            if (numChannels === 4) {
                ComputeHelper._copyTexture4CS = cs1;
            }
            else {
                ComputeHelper._copyTexture2CS = cs1;
            }
        }
        const cs = numChannels === 4 ? ComputeHelper._copyTexture4CS : ComputeHelper._copyTexture2CS;
        cs.setTexture("src", source);
        //cs.setStorageTexture("dest", dest);
        cs.setTexture("dest",dest);
        cs.dispatch(source.width,source.height,1);
    }
}
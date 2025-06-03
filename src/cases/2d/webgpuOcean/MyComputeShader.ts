import { LayaGL } from "laya/layagl/LayaGL";
import { Vector3 } from "laya/maths/Vector3";
import { CommandUniformMap } from "laya/RenderDriver/DriverDesign/RenderDevice/CommandUniformMap";
import { ComputeCommandBuffer } from "laya/RenderDriver/DriverDesign/RenderDevice/ComputeShader/ComputeCommandBuffer";
import { ComputeShader } from "laya/RenderDriver/DriverDesign/RenderDevice/ComputeShader/ComputeShader";
import { EDeviceBufferUsage, IDeviceBuffer } from "laya/RenderDriver/DriverDesign/RenderDevice/IDeviceBuffer";
import { ShaderData, ShaderDataType } from "laya/RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { IDefineDatas } from "laya/RenderDriver/RenderModuleData/Design/IDefineDatas";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Texture2D } from "laya/resource/Texture2D";


export class MyComputeShader {
    threadGroupSizes: Vector3
    commands: ComputeCommandBuffer
    entryPoint: string;
    _name: string;
    _shaderDefine: IDefineDatas;
    _cs: ComputeShader
    _shaderData: ShaderData;

    private _readInputBuffer: IDeviceBuffer = null;
    private readStrotageBuffer: IDeviceBuffer = null;
    private _readBuffer: ArrayBuffer;

    constructor(name: string, code: string, entryPoint: string, uniform_map: { [key: string]: ShaderDataType|{type:ShaderDataType,ext:any} }) {
        this._name = name;
        this.entryPoint = entryPoint;
        this.threadGroupSizes = new Vector3(1,1,1);
        let rx = new RegExp(`workgroup_size\\((\\d+)(?:,(\\d+))?(?:,(\\d+))?\\)\\s*\\n*\\s*fn\\s+${entryPoint}`);        
        const match = code.match(rx);
        if (match) {
            const [_, x, y, z] = match;
            this.threadGroupSizes.setValue(parseInt(x)||1,parseInt(y)||1,parseInt(z)||1);
        }
        this.commands = new ComputeCommandBuffer();
        this._shaderDefine = LayaGL.unitRenderModuleDataFactory.createDefineDatas();

        let uniformMap = LayaGL.renderDeviceFactory.createGlobalUniformMap(name);
        for (let m in uniform_map) {
            if(typeof(uniform_map[m])=='object'){
                uniformMap.addShaderUniform(Shader3D.propertyNameToID(m), m, uniform_map[m].type,uniform_map[m].ext);
            }else{
                uniformMap.addShaderUniform(Shader3D.propertyNameToID(m), m, uniform_map[m]);
            }
        }

        this._cs = ComputeShader.createComputeShader(name, code, [uniformMap]);
        this._shaderData = LayaGL.renderDeviceFactory.createShaderData();
    }

    setTexture(name: string, tex: Texture2D) {
        this._shaderData.setTexture(Shader3D.propertyNameToID(name), tex);
    }

    // setStorageTexture(name:string, tex:Texture2D){
    //     this.setTexture(name,tex);
    // }

    setDeviceBuffer(name: string, buffer: IDeviceBuffer) {
        this._shaderData.setDeviceBuffer(Shader3D.propertyNameToID(name), buffer);
    }

    setNumber(name: string, v: number) {
        this._shaderData.setNumber(Shader3D.propertyNameToID(name), v);
    }

    setInt(name: string, v: number) {
        this._shaderData.setInt(Shader3D.propertyNameToID(name), v);
    }

    dbgReadBuffer(input: IDeviceBuffer) {
        if (!input) {
            if (this.readStrotageBuffer) this.readStrotageBuffer.destroy();
            this.readStrotageBuffer = null;
            this._readInputBuffer = null;
            return;
        }
        this._readInputBuffer = input;
        this.readStrotageBuffer = LayaGL.renderDeviceFactory.createDeviceBuffer(
            EDeviceBufferUsage.COPY_DST | EDeviceBufferUsage.MAP_READ);
        this.readStrotageBuffer.setDataLength(input.getSize());
        this._readBuffer = new ArrayBuffer(input.getSize());
    }

    dispatch(numIterationsX: number, numIterationsY = 1, numIterationsZ = 1) {
        const numGroupsX = Math.ceil(numIterationsX / this.threadGroupSizes.x);
        const numGroupsY = Math.ceil(numIterationsY / this.threadGroupSizes.y);
        const numGroupsZ = Math.ceil(numIterationsZ / this.threadGroupSizes.z);
        let dispatchParams = new Vector3(numGroupsX, numGroupsY, numGroupsZ);
        let commands = this.commands;
        commands.clearCMDs();
        commands.addDispatchCommand(this._cs, this.entryPoint, this._shaderDefine, [this._shaderData], dispatchParams);
        if (this._readInputBuffer) {
            commands.addBufferToBufferCommand(this._readInputBuffer, this.readStrotageBuffer, 0, 0, this._readInputBuffer.getSize());
        }
        commands.executeCMDs();

        if (this.readStrotageBuffer) {
            this.readStrotageBuffer.readData(this._readBuffer, 0, 0, this._readBuffer.byteLength).then(() => {
                console.log(new Float32Array(this._readBuffer));
            })
        }
    }

}
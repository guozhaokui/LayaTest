
import "laya/ModuleDef";
import { Laya } from "Laya";
import { LayaEnv } from "LayaEnv";
let version = LayaEnv.version;
import { Config } from "Config";

//如果要canvas.toBlob必须保留buffer，否则会黑屏
//Config.preserveDrawingBuffer=true;

var captureResult=false;
var load3D = true;
var newAdapter=true;
var useWebGPU = false;

Laya.addInitCallback(()=>{
    //这时候已经初始化完成，这个值不再能控制canvas的属性，但是设置为false可以保证能clear
    Config.preserveDrawingBuffer=false;
})

let testfile = window.location.search.substring(1)||"blur";
async function testf(){
    (window as any).Laya=Laya;
    if(load3D){
        await import('Laya3D')//这样才能初始化3d
    }
    if(useWebGPU){
        await import("./utils/webgpu")
    }else{
        if(version.startsWith('3.1')){
            await import("./utils/utils_3_1");
        }else if(version.startsWith('3.2')){
            await import("./utils/utils_3_2");
        }else if(version.startsWith('3.3')){
            await import("./utils/utils_3_3");
        }
    }

    if(newAdapter){
        await import('./utils/adapters')
    }
    
    //@ts-ignore
    let exp = await import('./cases/2d/'+testfile);
    if(captureResult){
        await import('./result');
    }

    (window as any).curexp = exp;
    (window as any).testEnd=true;
}

testf();
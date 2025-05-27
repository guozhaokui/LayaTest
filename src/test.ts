
import { Laya } from "Laya";
import { LayaEnv } from "LayaEnv";
let version = LayaEnv.version;
//import test from "./simple1"
//import "./utils/utils_3_2"
//import "./utils/utils_3_1"
//import "./utils/utils_3_3"
import { Config } from "Config";

//如果要canvas.toBlob必须保留buffer，否则会黑屏
//Config.preserveDrawingBuffer=true;

Laya.addInitCallback(()=>{
    //这时候已经初始化完成，这个值不再能控制canvas的属性，但是设置为false可以保证能clear
    Config.preserveDrawingBuffer=false;
})

let testfile = window.location.search.substring(1)||"blur";
async function testf(){
    (window as any).Laya=Laya;

    if(version.startsWith('3.1')){
        await import("./utils/utils_3_1");
    }else if(version.startsWith('3.2')){
        await import("./utils/utils_3_2");
    }else if(version.startsWith('3.3')){
        await import("./utils/utils_3_3");
    }
    
    //@ts-ignore
    let exp = await import('./cases/2d/'+testfile);
    if(exp.testConfig && exp.testConfig.capture==false){
        
    }else{
        await import('./result');
    }

    (window as any).curexp = exp;
    (window as any).testEnd=true;
}

testf();
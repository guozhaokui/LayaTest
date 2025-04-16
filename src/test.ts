
import { Laya } from "Laya";
//import test from "./simple1"
//import "./utils/utils_3_2"
//import "./utils/utils_3_1"
import "./utils/utils_3_3"
import { Config } from "Config";

//如果要canvas.toBlob必须保留buffer，否则会黑屏
//Config.preserveDrawingBuffer=true;

Laya.addInitCallback(()=>{
    //这时候已经初始化完成，这个值不再能控制canvas的属性，但是设置为false可以保证能clear
    Config.preserveDrawingBuffer=false;
})


let testfile = window.location.search.substring(1);
async function testf(){
    (window as any).Laya=Laya;
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
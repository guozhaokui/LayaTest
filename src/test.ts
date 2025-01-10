
import { Laya } from "Laya";
//import test from "./simple1"
import "./utils/utils_3_2"
//import "./utils/utils_3_1"

let testfile = window.location.search.substring(1);
async function testf(){
    (window as any).Laya=Laya;
    await import('./result');
    //@ts-ignore
    let exp = await import('./cases/2d/'+testfile);
    (window as any).curexp = exp;
    (window as any).testEnd=true;
}

testf();
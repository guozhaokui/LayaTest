
import { Laya } from "Laya";
//import test from "./simple1"
import { usewebgl } from "./utils/utils"

let testfile = window.location.search.substring(1);
async function testf(){
    usewebgl();
    (window as any).Laya=Laya;
    await import('./result');
    //@ts-ignore
    let exp = await import('./cases/2d/'+testfile);
    (window as any).curexp = exp;
    (window as any).testEnd=true;
}

testf();
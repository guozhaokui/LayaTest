import "laya/d3/core/scene/Scene3D";
import "laya/ModuleDef";
import "laya/ui/ModuleDef";
import "laya/ani/ModuleDef";

import { Laya } from "Laya";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Stage } from "laya/display/Stage";
import { Sprite } from "laya/display/Sprite";

//HierarchyLoader和MaterialLoader等是通过前面的import完成的

let packurl = 'sample-resource/2d'
async function test(){
    //初始化引擎
    await Laya.init(0,0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;
    Shader3D.debugMode = true;

    await Laya.loader.loadPackage(packurl, null, null);
    let sp = new Sprite();
    sp.graphics.drawRect(0,0,400,400,'red');
    sp.pos(100,100);
    Laya.stage.addChild(sp);

    let mask = new Sprite();
    mask.graphics.drawRect(0,0,100,100,'white');
    //mask.anchor(0.5,0.5)
    mask.rotation = 10;
    mask.pos(100,100);
    sp.mask=mask;
    //sp.addChild(mask);
    //Laya.stage.addChild

    let b=true;
    function renderloop(){
        sp.repaint();
        mask.repaint();
        // if(b){
        //     sp.mask=mask;
        // }else{
        //     sp.mask = null;
        // }
        // b = !b;
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}


test();
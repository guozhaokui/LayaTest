import "laya/ModuleDef";

import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Sprite } from "laya/display/Sprite";

//HierarchyLoader和MaterialLoader等是通过前面的import完成的

async function test(){
    //初始化引擎
    await Laya.init(0,0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;

    let sp = new Sprite();
    sp.graphics.drawRoundRect(0,0,5,100,20,20,20,20,'red','green',1)
    sp.pos(100,100)

    Laya.stage.addChild(sp);

    function renderloop(){
        sp.graphics.clear();
        let w = 100*(Math.sin(Date.now()/1000)+1);
        sp.graphics.drawRoundRect(0,0,100,w,20,20,20,20,'red','green',1)
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}


test();
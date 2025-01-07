import "laya/ModuleDef";

import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Sprite } from "laya/display/Sprite";

//HierarchyLoader和MaterialLoader等是通过前面的import完成的
let packurl = 'sample-resource/2d'
async function test(){
    //初始化引擎
    await Laya.init(0,0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;
    await Laya.loader.loadPackage(packurl);
    let tex = await Laya.loader.load('atlas/comp/progress.png')
    let tex1 = await Laya.loader.load('atlas/comp/img_bg5.png')

    let sp = new Sprite();
    sp.scale(3,3);
    sp.graphics.draw9Grid(tex,0,0,100,tex.height,[0,10,0,10])
    sp.pos(100,100)

    Laya.stage.addChild(sp);

    function renderloop(){
        sp.graphics.clear();
        let w = 100*(Math.sin(Date.now()/1000)+1);
        sp.graphics.draw9Grid(tex,0,0,w,tex.height,[0,10,0,20])
        sp.graphics.draw9Grid(tex1,0,20,tex1.width,w,[8,0,18,0])
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}


test();
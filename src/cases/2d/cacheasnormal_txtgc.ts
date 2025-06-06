import "laya/ModuleDef";
import "laya/ani/ModuleDef";
import "laya/d3/ModuleDef";
import "laya/d3/core/scene/Scene3D";
import "laya/d3/physics/ModuleDef";
import "laya/gltf/glTFLoader";
import "laya/spine/ModuleDef";
import "laya/ui/ModuleDef";

import { Laya } from "Laya";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Stage } from "laya/display/Stage";
import { RenderSprite } from "laya/renders/RenderSprite";
import { Sprite } from "laya/display/Sprite";
import { TextRender } from "laya/webgl/text/TextRender";

//HierarchyLoader和MaterialLoader等是通过前面的import完成的
let packurl = 'sample-resource/2d'
async function test() {
    //初始化引擎
    await Laya.init(0, 0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;
    Shader3D.debugMode = true;

    TextRender.destroyAtlasDt = 1;
    RenderSprite;
    await Laya.loader.loadPackage(packurl, null, null);
    let spbk = new Sprite();
    Laya.stage.addChild(spbk);
    spbk.graphics.drawRect(0,0,400,400,'gray');

    let spp = new Sprite();
    spp.name='parent'
    Laya.stage.addChild(spp);

    let sp = new Sprite();
    sp.name='child cache'
    sp.graphics.fillText('Abc文字', 100, 100, '36px Arial', 'red', "left");
    sp.cacheAs = 'normal';
    spp.addChild(sp);
    setTimeout(() => {
        spp.visible = false;
    }, 300);
    setTimeout(() => {
        TextRender.textRenderInst.GC();
    }, 600);
    setTimeout(() => {
        spp.visible = true;
    }, 1000);

}


test();
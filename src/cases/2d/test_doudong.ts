import "laya/ModuleDef";
import "laya/ui/ModuleDef";
import "laya/ani/ModuleDef";

import { Laya } from "Laya";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Stage } from "laya/display/Stage";
import { Sprite } from "laya/display/Sprite";
import { Label } from "laya/ui/Label";
import { Text } from "laya/display/Text";
import { Render } from "laya/renders/Render";

//HierarchyLoader和MaterialLoader等是通过前面的import完成的

let packurl = 'sample-resource/2d'
async function test(){
    //初始化引擎
    await Laya.init(0,0);
    Laya.stage.scaleMode = Stage.SCALE_FULL;
    Laya.stage.screenMode = Stage.SCREEN_NONE;
    Shader3D.debugMode = true;

    await Laya.loader.loadPackage(packurl, null, null);
    let tex = await Laya.loader.load('atlas/comp/image.png')
    // let sp = new Sprite();
    // sp.graphics.drawTexture(tex,100,100,null,null,null);
    // sp.graphics.fillText('Abc文字',100,100,'36px Arial','red',"left");
    // sp.graphics.drawTexture(tex,100,300,null,null,null);
    // sp.graphics.drawRect(150,190,300,100,'white')
    // sp.graphics.fillText('Abc文字一个',200,200,'36px Arial','#bbbbbb',"left");
    // sp.graphics.fillText('Abc文字一个',200,230,'36px Arial','white',"left");
    // Laya.stage.addChild(sp);

    let txt = new Text();
    txt.color='white';
    //txt.singleCharRender=true;
    txt.fontSize=40;
    txt.text = '这是一个公告 123456';
    txt.pos(400,400);
    Laya.stage.addChild(txt);

    let speed = 300;


    function renderloop(){
        txt.x = (Render.vsyncTime()/1000*speed)%600;
        //txt.x+=4;

        if(txt.x>600)txt.x=0;
        requestAnimationFrame(renderloop);
    }
    requestAnimationFrame(renderloop)
}


test();
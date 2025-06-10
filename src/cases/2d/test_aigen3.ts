import { Laya } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Script } from "laya/components/Script";
import { Vector3 } from "laya/maths/Vector3";
import { Color } from "laya/maths/Color";
import { Loader } from "laya/net/Loader";
import { Texture2D } from "laya/resource/Texture2D";
import { Button } from "laya/ui/Button";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { PhysicsCollider } from "laya/d3/physics/PhysicsCollider";
import { Rigidbody3D } from "laya/d3/physics/Rigidbody3D";
import { BoxColliderShape } from "laya/d3/physics/shape/BoxColliderShape";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Matrix4x4 } from "laya/maths/Matrix4x4";

export class PhysicsDemo {
    private scene: Scene3D;
    private camera: Camera;
    private _directionalLight1: Sprite3D;

    constructor() {
        //初始化引擎
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            //显示性能面板
            Stat.show();
            this.createScene();
            this.createCamera();
            this.addPlane();
            this.addDirectionLight1();
            this.addUIs();
        });
    }

    createScene(): void {
        this.scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));
        this.scene.ambientColor = new Color(0.5, 0.5, 0.5);
    }

    createCamera(): void {
        var camera: Camera = (this.camera = new Camera(0, 0.1, 100));
        this.scene.addChild(camera);
        camera.transform.translate(new Vector3(0, 2, 4));
        camera.clearFlag = CameraClearFlags.SolidColor;
        camera.addComponent(CameraMoveScript);
    }


    addDirectionLight1(): void {
        this._directionalLight1 = new Sprite3D();
        let dircom = this._directionalLight1.addComponent(DirectionLightCom);
        this.scene.addChild(this._directionalLight1);

        dircom.color.setValue(1, 1, 1, 1);
        //设置平行光的方向
        var mat: Matrix4x4 = this._directionalLight1.transform.worldMatrix;
        mat.setForward(new Vector3(-1.0, -1.0, -1.0));
        this._directionalLight1.transform.worldMatrix = mat;
    }
    addPlane(): void {
        var plane: MeshSprite3D = <MeshSprite3D>this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createPlane(10, 10, 10, 10)));
        var meshRenderer = plane.meshRenderer;
        meshRenderer.material = Texture2D.load("res/threeDimen/Physics/grass.png");
        plane.transform.rotate(new Vector3(-90, 0, 0), true, false);

        let rigidbody: Rigidbody3D = plane.addComponent(Rigidbody3D);
        let boxShape: BoxColliderShape = new BoxColliderShape(10, 0, 10);
        let collider: PhysicsCollider = plane.addComponent(PhysicsCollider);
        collider.colliderShape = boxShape;
        rigidbody.isKinematic = true;
    }
    addUIs(){
        Laya.loader.load(["res/threeDimen/ui/button.png"], Handler.create(this, function (): void {
            var uiButton: Button = Laya.stage.addChild(new Button("res/threeDimen/ui/button.png", "返回"));
            uiButton.labelBold = true;
            uiButton.size(160, 40);
            uiButton.labelSize = 30;
            uiButton.labelPadding = "0,0,0,0";
            uiButton.sizeGrid = "4,4,4,4";
            uiButton.scale(Browser.pixelRatio, Browser.pixelRatio);
            uiButton.pos(Laya.stage.width / 2 - uiButton.width * Browser.pixelRatio / 2, Laya.stage.height - 60 * Browser.pixelRatio);

            uiButton.on("click", this, function (): void {
                if(Client.instance.stage){
                    Client.instance.stage.removeChild(Client.physicsDemo);
                    Client.physicsDemo = null;
                }

                Laya.timer.frameOnce(1, this, function () {
                    Laya.stage.removeChild(uiButton);
                });
            });
        }));
    }
}

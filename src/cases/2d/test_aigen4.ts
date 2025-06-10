import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Loader } from "laya/net/Loader";
import { Event } from "laya/events/Event";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { InputManager } from "laya/events/InputManager";
//import { KeyBoardEvent } from "laya/events/KeyBoardEvent";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import Client from "../../Client";
import { PhysicsColliderComponent } from "laya/d3/physics/PhysicsColliderComponent"
import { Rigidbody3D } from "laya/d3/physics/Rigidbody3D";
import { Keyboard } from "laya/events/Keyboard";
import { BoxColliderShape } from "laya/d3/physics/shape/BoxColliderShape";

export class PhysicsDemo {
    private _scene: Scene3D;
    private _camera: Camera;

    constructor() {

        //初始化引擎
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            //显示性能面板
            Stat.show();

            this._scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            this._camera = (<Camera>this._scene.addChild(new Camera(0, 0.1, 100)));
            this._camera.transform.translate(new Vector3(0, 5, 10));
            this._camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            let directionLight = new Sprite3D();
            let dircom = directionLight.addComponent(DirectionLightCom);

            this._scene.addChild(directionLight);

            dircom.color.setValue(1, 1, 1, 1);
            directionLight.transform.rotate(new Vector3(-Math.PI / 3, 0, 0));

            var mat: BlinnPhongMaterial = new BlinnPhongMaterial();
            Texture2D.load("res/threeDimen/Physics/grass.png", Handler.create(this, function (tex: Texture2D): void {
                mat.albedoTexture = tex;
            }));
            //加载地面
            var plane: MeshSprite3D = (<MeshSprite3D>this._scene.addChild(new MeshSprite3D(PrimitiveMesh.createPlane(20, 20, 10, 10))));
            var groundMat: BlinnPhongMaterial = new BlinnPhongMaterial();
            Texture2D.load("res/threeDimen/Physics/ground.jpg", Handler.create(this, function (tex: Texture2D): void {
                groundMat.albedoTexture = tex;
            }));

            //设置材质颜色
            groundMat.albedoColor = new Color(0.6, 0.6, 0.6, 1);
            plane.meshRenderer.material = groundMat;
            plane.meshRenderer.castShadow = false;

            //添加地面刚体
            var rigidBodyGround: Rigidbody3D = plane.getComponent(Rigidbody3D);
            if (!rigidBodyGround) {
                rigidBodyGround = plane.addComponent(Rigidbody3D);
            }
            rigidBodyGround.isKinematic = true; //地面保持静止

            for (var i: number = -4; i < 5; i++) {
                for (var j: number = -4; j < 5; j++) {
                    var box: MeshSprite3D = (<MeshSprite3D>this._scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(1, 1, 1))));

                    box.meshRenderer.material = mat;
                    box.transform.position = new Vector3(i * 2 + 1, 0.5, j * 2 + 1);

                    var rigidBody: Rigidbody3D = box.addComponent(Rigidbody3D);
                    rigidBody.mass = 10;
                    rigidBody.linearDamping = 0.5;
                    rigidBody.angularDamping = 0.5;
                    var collider: PhysicsColliderComponent = box.addComponent(PhysicsColliderComponent);
                    var shape: BoxColliderShape = new BoxColliderShape(1, 1, 1);
                    collider.colliderShape = shape;
                }
            }

            var player: MeshSprite3D = (<MeshSprite3D>this._scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(1, 1, 1))));

            player.meshRenderer.material = mat;
            player.transform.position = new Vector3(0, 1, 0);
            var rigidBodyPlayer: Rigidbody3D = player.addComponent(Rigidbody3D);
            rigidBodyPlayer.mass = 10;
            rigidBodyPlayer.linearDamping = 0.5;
            rigidBodyPlayer.angularDamping = 0.5;
            var colliderPlayer: PhysicsColliderComponent = player.addComponent(PhysicsColliderComponent);
            var shapePlayer: BoxColliderShape = new BoxColliderShape(1, 1, 1);
            colliderPlayer.colliderShape = shapePlayer;

            InputManager.addKeyDownListener(Keyboard.W, this, () => {
                player.transform.translate(new Vector3(0, 0, -0.1));
            });
            InputManager.addKeyDownListener(KeyBoardEvent.A, this, () => {
                player.transform.translate(new Vector3(-0.1, 0, 0));
            });
            InputManager.addKeyDownListener(KeyBoardEvent.D, this, () => {
                player.transform.translate(new Vector3(0.1, 0, 0));
            });
            InputManager.addKeyDownListener(KeyBoardEvent.S, this, () => {
                player.transform.translate(new Vector3(0, 0, 0.1));
            });

            Laya.timer.frameLoop(1, this, this.animate);
        });
    }


    animate(): void {
        var t: number = Laya.timer.currTimer * 0.001;
        this._camera.transform.rotationEulerY = Math.sin(t) * 30;
    }

    dispose(){
        Laya.loader.clearRes("res/threeDimen/Physics/grass.png");
        Laya.loader.clearRes("res/threeDimen/Physics/ground.jpg");

        InputManager.removeKeyDownListener(KeyBoardEvent.W, this, () => {});
        InputManager.removeKeyDownListener(KeyBoardEvent.A, this, () => {});
        InputManager.removeKeyDownListener(KeyBoardEvent.D, this, () => {});
        InputManager.removeKeyDownListener(KeyBoardEvent.S, this, () => {});

        Laya.timer.clear(this,this.animate);
    }
}
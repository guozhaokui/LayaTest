import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Vector3 } from "laya/maths/Vector3";
//import { PhysicsColliderComponent } from "laya/physics/PhysicsColliderComponent";
import { PhysicsColliderComponent } from "laya/d3/physics/PhysicsColliderComponent";
//import { Rigidbody3D } from "laya/physics/Rigidbody3D";
import { Rigidbody3D } from "laya/d3/physics/Rigidbody3D";
import { BoxColliderShape } from "laya/d3/physics/shape/BoxColliderShape";
//import { MeshSprite3D } from "laya/resource/models/MeshSprite3D";
import { Stat } from "laya/utils/Stat";
import { Handler } from "laya/utils/Handler";
import { InputManager } from "laya/events/InputManager";
import { Keyboard } from "laya/events/Keyboard";

export class Physics_Box {
        private scene: Scene3D;
        private camera: Camera;

        constructor() {

                Laya.init(0, 0).then(() => {
                        Stat.show();
                        Laya.stage.scaleMode = Stage.SCALE_FULL;
                        Laya.stage.screenMode = Stage.SCREEN_NONE;
                        this.scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

                        var camera: Camera = (<Camera>this.scene.addChild(new Camera(0, 0.1, 100)));
                        camera.transform.translate(new Vector3(0, 2, 5));
                        camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
                        this.camera = camera;

                        var spritePlane: MeshSprite3D = (<MeshSprite3D>Sprite3D.instantiate(this.createGround()));
                        spritePlane.transform.position = new Vector3(0, -0.5, 0);

                        for (var i: number = 0; i < 4; i++) {
                                var box: MeshSprite3D = (<MeshSprite3D>Sprite3D.instantiate(this.createBox()));
                                box.transform.position = new Vector3((i - 1) * 1.5, 0, 0);
                                box.transform.localScale = new Vector3(0.8, 0.8, 0.8);
                                this.scene.addChild(box);
                        }

                        var boxControl: MeshSprite3D = (<MeshSprite3D>Sprite3D.instantiate(this.createBox()));
                        boxControl.transform.position = new Vector3(0, 0, 0);
                        boxControl.transform.localScale = new Vector3(0.6, 0.6, 0.6);
                        this.scene.addChild(boxControl);

                        Laya.timer.frameLoop(1, this, this.onUpdate);
                });
        }


        private createBox(): MeshSprite3D {
                var meshBox: MeshSprite3D = (<MeshSprite3D>(MeshSprite3D.load("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh")));
                var rigidBody: Rigidbody3D = meshBox.addComponent(Rigidbody3D);
                rigidBody.mass = 1;
                var colliderShape: BoxColliderShape = new BoxColliderShape(0.5, 0.5, 0.5);
                var physicsCom: PhysicsColliderComponent = meshBox.addComponent(PhysicsColliderComponent);
                physicsCom.colliderShape = colliderShape;
                return meshBox;
        }

        private createGround(): MeshSprite3D {
                var plane: MeshSprite3D = (<MeshSprite3D>MeshSprite3D.load("res/threeDimen/staticModel/plane/plane.lm"));
                var rigidBody: Rigidbody3D = plane.addComponent(Rigidbody3D);
                rigidBody.isKinematic = true;
                return plane;
        }


        private onUpdate(): void {
                var boxControl: MeshSprite3D = this.scene.getChildByName("Box");
                if (boxControl != null) {
                        var rigidBody: Rigidbody3D = boxControl.getComponent(Rigidbody3D);
                        var velocity: Vector3 = rigidBody.getVelocity();

                        if (InputManager.hasKeyDown(Keyboard.W)) {
                                velocity.z -= 0.1;
                        }
                        else if (InputManager.hasKeyDown(Keyboard.S)) {
                                velocity.z += 0.1;
                        }
                        else {
                                velocity.z *= 0.9;
                        }

                        if (InputManager.hasKeyDown(Keyboard.A)) {
                                velocity.x -= 0.1;
                        }
                        else if (InputManager.hasKeyDown(Keyboard.D)) {
                                velocity.x += 0.1;
                        }
                        else {
                                velocity.x *= 0.9;
                        }

                        rigidBody.setVelocity(velocity);
                }
        }
}
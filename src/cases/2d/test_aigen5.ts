import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { RenderBitFlag } from "laya/d3/core/render/BaseRender";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { PhysicsCollider } from "laya/d3/physics/PhysicsCollider";
import { BoxColliderShape } from "laya/d3/physics/shape/BoxColliderShape";
import { CapsuleColliderShape } from "laya/d3/physics/shape/CapsuleColliderShape";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";

export class PhysicsTest {
        private scene: Scene3D;
        private camera: Camera;

        constructor() {
                Laya.init(0, 0).then(() => {
                        Laya.stage.scaleMode = Stage.SCALE_FULL;
                        Laya.stage.screenMode = Stage.SCREEN_NONE;
                        Stat.show();
                        this.scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

                        this.camera = (<Camera>this.scene.addChild(new Camera(0, 0.1, 100)));
                        this.camera.transform.translate(new Vector3(0, 2, 5));
                        this.camera.transform.rotate(new Vector3(-15, 0, 0), true, false);

                        var plane: MeshSprite3D = (<MeshSprite3D>this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createPlane(20, 20, 10, 10))));
                        var planeMat: BlinnPhongMaterial = new BlinnPhongMaterial();
                        Texture2D.load("res/threeDimen/texture/grid.jpg", Handler.create(this, function (tex: Texture2D): void {
                                planeMat.albedoTexture = tex;
                        }));
                        planeMat.tilingOffset = new Vector4(10, 10, 0, 0);
                        plane.meshRenderer.material = planeMat;
                        //设置为静态对象
                        //plane.meshRenderer.setRenderbitFlag(RenderBitFlag.RenderBitFlag_Static, true);

                        //添加平面刚体
                        var rigidBodyCom = plane.addComponent(PhysicsCollider);
                        rigidBodyCom.colliderShape = new BoxColliderShape(20, 0, 20);
                        rigidBodyCom.friction = 0.8;

                        for (var i: number = 0; i < 6; i++) {
                                for (var j: number = 0; j < 6; j++) {
                                        var box: MeshSprite3D = (<MeshSprite3D>this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(0.5, 0.5, 0.5))));

                                        box.transform.position.setValue((i - 2) * 1.2, 0.25, (j - 2) * 1.2);

                                        //设置为动态对象
                                        //box.meshRenderer.setRenderbitFlag(RenderBitFlag.RenderBitFlag_Dynamic, true);

                                        //添加盒子刚体
                                        var rigidBodyCom: PhysicsCollider = box.addComponent(PhysicsCollider);
                                        rigidBodyCom.colliderShape = new BoxColliderShape(1, 1, 1);
                                        rigidBodyCom.friction = 0.8;

                                        if (i == 2 && j == 2) {//第四个方块可移动
                                                //设置为可移动物体
                                                //box.meshRenderer.setRenderbitFlag(RenderBitFlag.RenderBitFlag_MovableObject, true);

                                                //设置颜色
                                                //box.meshRenderer.sharedMaterial.albedoColor = new Color(Math.random(), Math.random(), Math.random(), 1.0);

                                                //设置位置
                                                box.transform.position.setValue(0, 0.25, 0);

                                                //设置旋转
                                                var matrix: Matrix4x4 = box.transform.worldMatrix;
                                                matrix.setPosition(new Vector3(0, 0.25, 0));
                                                box.transform.worldMatrix = matrix;

                                                //设置初始速度
                                                rigidBodyCom.linearVelocity = new Vector3(0, 0, 0);
                                        }
                                }
                        }

                        Laya.timer.frameLoop(1, this, this.onKeyDown);
                });
        }

        onKeyDown(): void {
                var boxs: any[] = [];
                this.scene.getChildByNameArray(boxs);
                var key: string = null;
                if (Laya.event.keyCode == 87)//W
                        key = 'forward';
                else if (Laya.event.keyCode == 83)//S
                        key = 'backward';
                else if (Laya.event.keyCode == 65)//A
                        key = 'left';
                else if (Laya.event.keyCode == 68)//D
                        key = 'right';

                if (key != null)
                        boxs[0].rigidBody.applyImpulse(key == 'forward' ? new Vector3(0, 0, 10) : key == 'backward' ? new Vector3(0, 0, -10) :
                                key == 'left' ? new Vector3(10, 0, 0) : new Vector3(-10, 0, 0));
        }
}


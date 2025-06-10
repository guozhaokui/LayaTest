import "laya/d3/core/scene/Scene3D";
import "laya/ModuleDef";
import "laya/ui/ModuleDef";
import "laya/ani/ModuleDef";

import { Laya } from "Laya";
import { Config } from "Config";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Color } from "laya/maths/Color";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { PhysicsCollider } from "laya/d3/physics/PhysicsCollider";
import { Rigidbody3D } from "laya/d3/physics/Rigidbody3D";
import { BoxColliderShape } from "laya/d3/physics/shape/BoxColliderShape";
import { SphereColliderShape } from "laya/d3/physics/shape/SphereColliderShape";
import { Stage } from "laya/display/Stage";
import { Stat } from "laya/utils/Stat";
import { StatUI } from "laya/utils/StatUI";
import { Vector3 } from "laya/maths/Vector3";
import { Laya3D } from "Laya3D";
import { btPhysicsCreateUtil } from "laya/Physics3D/Bullet/btPhysicsCreateUtil";

export class PhysicsDemo {
    private scene: Scene3D;
    private camera: Camera;

    constructor() {
        // 在初始化之前设置所有相关的 WebGL 配置
        Config.useWebGL2 = true;  // 使用 WebGL 2.0
        Config.isAntialias = true;  // 开启抗锯齿
        Config._uniformBlock = true;  // 启用 uniform block
        Config.matUseUBO = true;  // 启用材质 UBO
        
        // 初始化物理引擎
        Laya3D.PhysicsCreateUtil = new btPhysicsCreateUtil();
        
        // 初始化引擎
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            
            // 设置StatUI类
            Stat._statUIClass = StatUI;
            Stat.show();
            
            // 创建场景
            this.scene = new Scene3D();
            
            // 确保场景被正确添加到舞台
            if (!Laya.stage.getChildByName("Scene3D")) {
                Laya.stage.addChild(this.scene);
            }
            
            // 设置物理引擎
            this.scene.physicsSimulation.gravity = new Vector3(0, -9.81, 0);

            // 创建相机
            this.camera = this.scene.addChild(new Camera()) as Camera;
            this.camera.transform.translate(new Vector3(0, 6, 10));
            this.camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            this.camera.clearFlag = CameraClearFlags.SolidColor;
            this.camera.clearColor = new Color(0.3, 0.3, 0.3, 1);
            this.camera.fieldOfView = 60;
            this.camera.nearPlane = 0.1;
            this.camera.farPlane = 100;

            // 创建方向光
            let directionLight = this.scene.addChild(new Sprite3D()) as Sprite3D;
            let dirLight = directionLight.addComponent(DirectionLightCom);
            dirLight.color = new Color(1, 1, 1, 1);
            dirLight.intensity = 1;
            directionLight.transform.worldMatrix.setForward(new Vector3(-0.3, -1.0, -0.3));

            // 等待场景初始化完成
            Laya.timer.frameOnce(2, this, () => {
                // 创建场景对象
                this.createGround();
                this.createTestObjects();

                // 定时生成物理物体
                Laya.timer.loop(1000, this, this.dropRandomShape);
            });
        });
    }

    private createGround(): void {
        // 创建地面
        let ground = this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createPlane(20, 20))) as MeshSprite3D;
        let groundMaterial = new BlinnPhongMaterial();
        
        // 设置材质属性
        groundMaterial.albedoColor = new Color(0.6, 0.6, 0.6, 1.0);
        groundMaterial.shininess = 0.1;
        
        // 确保材质初始化完成
        groundMaterial.once('loaded', () => {
            ground.meshRenderer.material = groundMaterial;
        });
        
        ground.transform.position = new Vector3(0, 0, 0);
        
        // 添加物理碰撞器
        let groundCollider = ground.addComponent(PhysicsCollider);
        let groundShape = new BoxColliderShape(20, 0.1, 20);
        groundCollider.colliderShape = groundShape;
        groundCollider.friction = 0.6;
        groundCollider.restitution = 0.3;
    }

    private createTestObjects(): void {
        // 创建一个红色方块
        let box = this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(1, 1, 1))) as MeshSprite3D;
        let boxMaterial = new BlinnPhongMaterial();
        boxMaterial.albedoColor = new Color(1, 0, 0, 1);
        
        // 确保材质初始化完成
        boxMaterial.once('loaded', () => {
            box.meshRenderer.material = boxMaterial;
        });
        
        box.transform.position = new Vector3(0, 5, 0);
        
        let rigidBody = box.addComponent(Rigidbody3D);
        let boxShape = new BoxColliderShape(1, 1, 1);
        rigidBody.colliderShape = boxShape;
        rigidBody.mass = 1;
        rigidBody.friction = 0.5;
        rigidBody.restitution = 0.5;

        // 创建一个蓝色球体
        let sphere = this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createSphere(0.5))) as MeshSprite3D;
        let sphereMaterial = new BlinnPhongMaterial();
        sphereMaterial.albedoColor = new Color(0, 0, 1, 1);
        sphere.meshRenderer.material = sphereMaterial;
        sphere.transform.position = new Vector3(2, 8, 0);

        let sphereRigidBody = sphere.addComponent(Rigidbody3D);
        let sphereShape = new SphereColliderShape(0.5);
        sphereRigidBody.colliderShape = sphereShape;
        sphereRigidBody.mass = 1;
        sphereRigidBody.friction = 0.5;
        sphereRigidBody.restitution = 0.5;
    }

    private dropRandomShape(): void {
        let shape: MeshSprite3D;
        let colliderShape;
        
        // 随机选择形状：盒子或球体
        if (Math.random() > 0.5) {
            // 随机盒子大小
            let sX = Math.random() * 0.75 + 0.25;
            let sY = Math.random() * 0.75 + 0.25;
            let sZ = Math.random() * 0.75 + 0.25;
            shape = new MeshSprite3D(PrimitiveMesh.createBox(sX, sY, sZ));
            colliderShape = new BoxColliderShape(sX, sY, sZ);
        } else {
            // 随机球体半径
            let radius = Math.random() * 0.2 + 0.2;
            shape = new MeshSprite3D(PrimitiveMesh.createSphere(radius));
            colliderShape = new SphereColliderShape(radius);
        }

        // 随机位置
        let x = Math.random() * 4 - 2;
        let z = Math.random() * 4 - 2;
        shape.transform.position = new Vector3(x, 10, z);

        // 随机旋转
        shape.transform.rotationEuler = new Vector3(
            Math.random() * 360, 
            Math.random() * 360, 
            Math.random() * 360
        );

        // 随机材质颜色
        let material = new BlinnPhongMaterial();
        material.albedoColor = new Color(Math.random(), Math.random(), Math.random(), 1);
        shape.meshRenderer.material = material;

        // 添加刚体
        let rigidBody = shape.addComponent(Rigidbody3D);
        rigidBody.colliderShape = colliderShape;
        rigidBody.mass = 1;
        rigidBody.friction = 0.5;
        rigidBody.restitution = 0.5;

        this.scene.addChild(shape);
    }
}

// 创建实例
new PhysicsDemo();

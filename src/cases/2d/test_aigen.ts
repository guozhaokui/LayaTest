import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { PBRStandardMaterial } from "laya/d3/core/material/PBRStandardMaterial";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Transform3D } from "laya/d3/core/Transform3D";
import { PhysicsCollider } from "laya/d3/physics/PhysicsCollider";
import { PhysicsColliderComponent } from "laya/d3/physics/PhysicsColliderComponent";
import { PhysicsSettings } from "laya/d3/physics/PhysicsSettings";
import { Rigidbody3D } from "laya/d3/physics/Rigidbody3D";
import { BoxColliderShape } from "laya/d3/physics/shape/BoxColliderShape";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Scene } from "laya/display/Scene";
import { Sprite } from "laya/display/Sprite";
import { Stage } from "laya/display/Stage";
import { Event } from "laya/events/Event";
import { InputManager } from "laya/events/InputManager";
import { Keyboard } from "laya/events/Keyboard";
import { ColorFilter } from "laya/filters/ColorFilter";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { Loader } from "laya/net/Loader";
import { RigidBody } from "laya/physics/RigidBody";
import { ICharacterController } from "laya/Physics3D/interface/ICharacterController";
import { IDynamicCollider } from "laya/Physics3D/interface/IDynamicCollider";
import { IPhysicsCreateUtil } from "laya/Physics3D/interface/IPhysicsCreateUtil";
import { IPhysicsManager } from "laya/Physics3D/interface/IPhysicsManager";
import { IStaticCollider } from "laya/Physics3D/interface/IStaticCollider";
import { ID6Joint } from "laya/Physics3D/interface/Joint/ID6Joint";
import { IFixedJoint } from "laya/Physics3D/interface/Joint/IFixedJoint";
import { IHingeJoint } from "laya/Physics3D/interface/Joint/IHingeJoint";
import { ISpringJoint } from "laya/Physics3D/interface/Joint/ISpringJoint";
import { IBoxColliderShape } from "laya/Physics3D/interface/Shape/IBoxColliderShape";
import { ICapsuleColliderShape } from "laya/Physics3D/interface/Shape/ICapsuleColliderShape";
import { IConeColliderShape } from "laya/Physics3D/interface/Shape/IConeColliderShape";
import { ICylinderColliderShape } from "laya/Physics3D/interface/Shape/ICylinderColliderShape";
import { IHeightFieldShape } from "laya/Physics3D/interface/Shape/IHeightFieldShape";
import { IMeshColliderShape } from "laya/Physics3D/interface/Shape/IMeshColliderShape";
import { IPlaneColliderShape } from "laya/Physics3D/interface/Shape/IPlaneColliderShape";
import { ISphereColliderShape } from "laya/Physics3D/interface/Shape/ISphereColliderShape";
import { EPhysicsCapable } from "laya/Physics3D/physicsEnum/EPhycisCapable";
import { Material } from "laya/resource/Material";
import { Laya3D } from "Laya3D";
import { btPhysicsCreateUtil } from "laya/Physics3D/Bullet/btPhysicsCreateUtil";

  
Laya3D.PhysicsCreateUtil = new btPhysicsCreateUtil()

export class PhysicsScene {
    private scene: Scene3D;
    private camera: Camera;
    private playerBox: MeshSprite3D;
    private moveSpeed: number = 0.1;

    constructor() {
        // 初始化引擎
        Laya.init(1024, 768).then(() => {
            // 设置背景色
            Laya.stage.bgColor = "#DCDCDC";
            
            // 创建场景
            this.createScene();
            
            // 创建地面
            this.createGround();
            
            // 创建一些随机的物理盒子
            this.createRandomBoxes(10);
            
            // 创建玩家控制的盒子
            this.createPlayerBox();
            
            // 添加键盘监听
            Laya.stage.on(Event.KEY_DOWN, this, this.onKeyDown);
            
            // 添加帧循环
            Laya.timer.frameLoop(1, this, this.onUpdate);
        });
    }

    private createScene(): void {
        // 创建场景
        this.scene = new Scene3D();
        Laya.stage.addChild(this.scene);
        
        // 创建相机
        this.camera = this.scene.addChild(new Camera(0, 0.1, 100)) as Camera;
        this.camera.transform.translate(new Vector3(0, 6, 10));
        this.camera.transform.rotate(new Vector3(-30, 0, 0), true, false);
        this.camera.clearColor = new Color(0.2, 0.2, 0.2, 1.0);
        
        // 创建方向光
        let directionLightSp = new Sprite3D();
        let directionLight:DirectionLightCom = directionLightSp.addComponent(DirectionLightCom)
        this.scene.addChild(directionLightSp);
        directionLightSp.transform.worldMatrix.setForward(new Vector3(-1, -1, -1));
        directionLight.color = new Color(1, 1, 1);
    }

    private createGround(): void {
        // 创建地面
        let ground = this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createPlane(20, 20, 10, 10))) as MeshSprite3D;
        
        // 设置地面材质
        let groundMaterial = new BlinnPhongMaterial();
        groundMaterial.albedoColor = new Color(0.1, 0.6, 0.3, 1.0);
        ground.meshRenderer.material = groundMaterial;
        
        // 添加物理碰撞器
        let groundCollider = ground.addComponent(PhysicsCollider) as PhysicsCollider;
        let groundShape = new BoxColliderShape(20, 0.1, 20);
        groundCollider.colliderShape = groundShape;
        
        // 设置地面位置
        ground.transform.position = new Vector3(0, 0, 0);
    }

    private createRandomBoxes(num: number): void {
        for (let i = 0; i < num; i++) {
            // 创建盒子
            let box = this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(1, 1, 1))) as MeshSprite3D;
            
            // 设置随机位置
            let posX = (Math.random() * 2 - 1) * 8;
            let posZ = (Math.random() * 2 - 1) * 8;
            box.transform.position = new Vector3(posX, 3 + i * 0.5, posZ);
            
            // 设置随机旋转
            box.transform.rotationEuler = new Vector3(Math.random() * 360, Math.random() * 360, Math.random() * 360);
            
            // 设置随机颜色
            let boxMaterial = new BlinnPhongMaterial();
            boxMaterial.albedoColor = new Color(Math.random(), Math.random(), Math.random(), 1);
            box.meshRenderer.material = boxMaterial;
            
            // 添加刚体
            let rigidBody = box.addComponent(Rigidbody3D) as Rigidbody3D;
            rigidBody.mass = 1;
            rigidBody.friction = 0.5;
            rigidBody.restitution = 0.5;
            
            // 添加碰撞体形状
            let boxShape = new BoxColliderShape(1, 1, 1);
            rigidBody.colliderShape = boxShape;
        }
    }

    private createPlayerBox(): void {
        // 创建玩家盒子
        this.playerBox = this.scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(1, 1, 1))) as MeshSprite3D;
        this.playerBox.transform.position = new Vector3(0, 1, 0);
        
        // 设置玩家盒子材质
        let playerMaterial = new BlinnPhongMaterial();
        playerMaterial.albedoColor = new Color(1, 0, 0, 1);
        this.playerBox.meshRenderer.material = playerMaterial;
        
        // 添加刚体
        let rigidBody = this.playerBox.addComponent(Rigidbody3D) as Rigidbody3D;
        rigidBody.mass = 2;
        rigidBody.friction = 0.5;
        rigidBody.restitution = 0.2;
        rigidBody.angularFactor = new Vector3(0, 0, 0); // 防止旋转
        
        // 添加碰撞体形状
        let boxShape = new BoxColliderShape(1, 1, 1);
        rigidBody.colliderShape = boxShape;
    }

    private onKeyDown(e: any): void {
        // 键盘事件已在onUpdate中处理
    }

    private onUpdate(): void {
        if (!this.playerBox) return;
        
        let rigidBody = this.playerBox.getComponent(Rigidbody3D) as Rigidbody3D;
        
        // 当前线性速度
        let currentVelocity = rigidBody.linearVelocity;
        
        // 水平方向的移动力
        let moveForce = new Vector3(0, 0, 0);
        
        // 根据键盘输入添加力
        if (InputManager.hasKeyDown(Keyboard.W)) {
            moveForce.z -= this.moveSpeed;
        }
        if (InputManager.hasKeyDown(Keyboard.S)) {
            moveForce.z += this.moveSpeed;
        }
        if (InputManager.hasKeyDown(Keyboard.A)) {
            moveForce.x -= this.moveSpeed;
        }
        if (InputManager.hasKeyDown(Keyboard.D)) {
            moveForce.x += this.moveSpeed;
        }
        
        // 应用力
        if (moveForce.x !== 0 || moveForce.z !== 0) {
            // 保持y方向的速度不变
            rigidBody.linearVelocity = new Vector3(moveForce.x * 5, currentVelocity.y, moveForce.z * 5);
        }
        
        // 移动摄像机
        let playerPos = this.playerBox.transform.position;
        this.camera.transform.position = new Vector3(playerPos.x, 6 + playerPos.y, playerPos.z + 10);
        this.camera.transform.lookAt(playerPos, new Vector3(0, 1, 0));
    }
}

// 创建场景
new PhysicsScene();




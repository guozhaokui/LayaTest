
import { property, regClass } from "Decorators";
import { Laya } from "Laya";
import { Script } from "laya/components/Script";
import { BaseCamera } from "laya/d3/core/BaseCamera";
import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Event } from "laya/events/Event";
import { InputManager } from "laya/events/InputManager";
import { Keyboard } from "laya/events/Keyboard";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";

@regClass('KMHo2Y87RvCulnnA9_fP2g')
export class CameraMove extends Script {
    declare owner: Sprite3D;

    @property(String)
    public text: string = "";

    private out: Vector3 = new Vector3();

    /** @private */
    protected _tempVector3: Vector3 = new Vector3();
    protected lastMouseX: number;
    protected lastMouseY: number;
    protected yawPitchRoll: Vector3 = new Vector3();
    protected resultRotation: Quaternion = new Quaternion();
    protected tempRotationZ: Quaternion = new Quaternion();
    protected tempRotationX: Quaternion = new Quaternion();
    protected tempRotationY: Quaternion = new Quaternion();
    protected isMouseDown: boolean;
    protected rotaionSpeed: number = 0.00006;
    protected camera: BaseCamera;
    protected scene: Scene3D;

    speed: number = 0.06;

    constructor() {
        super();
    }

    /**
     * @private
     */
    protected _updateRotation(): void {
        if (Math.abs(this.yawPitchRoll.y) < 1.50) {
            Quaternion.createFromYawPitchRoll(this.yawPitchRoll.x, this.yawPitchRoll.y, this.yawPitchRoll.z, this.tempRotationZ);
            this.tempRotationZ.cloneTo(this.camera.transform.localRotation);
            this.camera.transform.localRotation = this.camera.transform.localRotation;
        }
    }

    /**
     * @inheritDoc
     */
    onAwake(): void {
        Laya.stage.on(Event.RIGHT_MOUSE_DOWN, this, this.mouseDown);
        Laya.stage.on(Event.RIGHT_MOUSE_UP, this, this.mouseUp);
        this.camera = (<Camera>this.owner);
    }

    /**
     * @inheritDoc
     */
    onUpdate(): void {
        var elapsedTime: number = Laya.timer.delta;
        if (!isNaN(this.lastMouseX) && !isNaN(this.lastMouseY) && (this.isMouseDown || InputManager.hasKeyDown(Keyboard.SPACE))) {
            var scene = this.owner.scene;
            InputManager.hasKeyDown(87) && this.moveForward(-this.speed * elapsedTime);//W
            InputManager.hasKeyDown(83) && this.moveForward(this.speed * elapsedTime);//S
            InputManager.hasKeyDown(65) && this.moveRight(-this.speed * elapsedTime);//A
            InputManager.hasKeyDown(68) && this.moveRight(this.speed * elapsedTime);//D
            InputManager.hasKeyDown(81) && this.moveVertical(this.speed * elapsedTime);//Q
            InputManager.hasKeyDown(69) && this.moveVertical(-this.speed * elapsedTime);//E

            var offsetX: number = Laya.stage.mouseX - this.lastMouseX;
            var offsetY: number = Laya.stage.mouseY - this.lastMouseY;

            var yprElem: Vector3 = this.yawPitchRoll;
            yprElem.x -= offsetX * this.rotaionSpeed * elapsedTime;
            yprElem.y -= offsetY * this.rotaionSpeed * elapsedTime;
            this._updateRotation();
        }
        this.lastMouseX = Laya.stage.mouseX;
        this.lastMouseY = Laya.stage.mouseY;
    }

    /**
     * @inheritDoc
     */
    onDestroy(): void {
        Laya.stage.off(Event.RIGHT_MOUSE_DOWN, this, this.mouseDown);
        Laya.stage.off(Event.RIGHT_MOUSE_UP, this, this.mouseUp);
    }

    protected mouseDown(e: Event): void {
        this.camera.transform.localRotation.getYawPitchRoll(this.yawPitchRoll);

        this.lastMouseX = Laya.stage.mouseX;
        this.lastMouseY = Laya.stage.mouseY;
        this.isMouseDown = true;
    }

    protected mouseUp(e: Event): void {
        this.isMouseDown = false;
    }

    protected mouseOut(e: Event): void {
        this.isMouseDown = false;
    }

    /**
     * 向前移动。
     * @param distance 移动距离。
     */
    moveForward(distance: number): void {
        this._tempVector3.x = this._tempVector3.y = 0;
        this._tempVector3.z = distance;
        this.camera.transform.translate(this._tempVector3);
    }

    /**
     * 向右移动。
     * @param distance 移动距离。
     */
    moveRight(distance: number): void {
        this._tempVector3.y = this._tempVector3.z = 0;
        this._tempVector3.x = distance;
        this.camera.transform.translate(this._tempVector3);
    }

    /**
     * 向上移动。
     * @param distance 移动距离。
     */
    moveVertical(distance: number): void {
        this._tempVector3.x = this._tempVector3.z = 0;
        this._tempVector3.y = distance;
        this.camera.transform.translate(this._tempVector3, false);
    }
}
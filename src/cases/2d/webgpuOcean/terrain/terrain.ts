import { Script } from "laya/components/Script";
import { regClass, property } from "Decorators";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Texture2DArray } from "laya/resource/Texture2DArray";

@regClass('8ORyZYeWT1WEtkW4AeCwOg')
export class Terrain extends Script {
    @property(Texture2DArray)
    public splat: Texture2DArray;

    @property(Texture2DArray)
    public diffuse: Texture2DArray;

    @property(Texture2DArray)
    public normal: Texture2DArray;    
    onAwake() {
      const mat = this.owner.getComponent(MeshRenderer).sharedMaterial;
      mat.setTexture("u_SplatArr", this.splat);
      mat.setTexture("u_DiffuseArr", this.diffuse);
      mat.setTexture("u_NormalArr", this.normal);
    }
  }
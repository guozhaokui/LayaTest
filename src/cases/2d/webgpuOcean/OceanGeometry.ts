import { Camera } from "laya/d3/core/Camera";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Vector3 } from "laya/maths/Vector3";
import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { Material } from "laya/resource/Material";
import { clamp } from "./Utils";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Quaternion } from "laya/maths/Quaternion";
import { Laya } from "Laya";
import { Transform3D } from "laya/d3/core/Transform3D";
import { WavesGenerator } from "./WavesGenerator";
import { FilterMode } from "laya/RenderEngine/RenderEnum/FilterMode";
import { Color } from "laya/maths/Color";
import { Vector4 } from "laya/maths/Vector4";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { Bounds } from "laya/d3/math/Bounds";
import { WrapMode } from "laya/RenderEngine/RenderEnum/WrapMode";

enum Seams {
    None = 0,   // 无边缘
    Left = 1,   // 左侧边缘
    Right = 2,  // 右侧边缘
    Top = 4,    // 顶部边缘
    Bottom = 8,  // 底部边缘
    All = 15    // 所有边缘(1+2+4+8)
}

var UP = new Vector3(0, 1, 0);

class TSR{
    constructor(
    public position:Vector3|null,
    public rotation:Quaternion|null,
    public scale:Vector3|null){
    }
}
function transformPoint(p:Vector3, transform:TSR){
    if(!transform)return ;
    if(transform.rotation) Vector3.transformQuat(p,transform.rotation,p);
    if(transform.scale) Vector3.multiply(p,transform.scale,p);
    if(transform.position) p.vadd(transform.position,p);
    return p;
}
function transformNormal(p:Vector3, transform:TSR){
    if(!transform)return p;
    if(transform.rotation) Vector3.transformQuat(p,transform.rotation,p);
    return p;
}
/**
 * @en Merges multiple meshes into one mesh with transforms applied
 * @zh 合并多个网格到一个网格，并应用对应的变换矩阵
 * @param meshes 要合并的网格数组
 * @param transforms 对应的变换矩阵数组
 * @return 合并后的网格实例
 */
function _mergeMesh(meshes: Mesh[], transforms: TSR[]): Mesh {
    if (meshes.length === 0) {
        throw new Error("meshes array cannot be empty");
    }
    if (meshes.length !== transforms.length) {
        throw new Error("meshes and transforms arrays must have same length");
    }

    // 获取第一个网格的顶点声明
    const vertexDeclaration = meshes[0]._vertexBuffer.vertexDeclaration;

    // 计算总顶点数和索引数
    let totalVertices = 0;
    let totalIndices = 0;
    for (const mesh of meshes) {
        totalVertices += mesh._vertexCount;
        totalIndices += mesh._indexBuffer.indexCount;
    }

    // 创建合并后的顶点和索引数组
    const mergedVertices = new Float32Array(totalVertices * vertexDeclaration.vertexStride / 4);
    const mergedIndices = new Uint16Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;
    let vertexCountOffset = 0;

    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        const transform = transforms[i];

        // 获取原始顶点数据
        const vertices = new Float32Array(mesh._vertexCount * vertexDeclaration.vertexStride / 4);
        vertices.set(mesh._vertexBuffer._float32Reader);    //clone

        // 应用变换到顶点位置和法线
        const position = new Vector3();
        const normal = new Vector3();
        const stride = vertexDeclaration.vertexStride / 4;

        for (let v = 0; v < mesh._vertexCount; v++) {
            const base = v * stride;

            // 获取位置并应用变换
            position.set(vertices[base], vertices[base + 1], vertices[base + 2]);
            transformPoint(position,transform);
            mergedVertices[vertexOffset + base] = position.x;
            mergedVertices[vertexOffset + base + 1] = position.y;
            mergedVertices[vertexOffset + base + 2] = position.z;

            // 获取法线并应用变换
            normal.set(vertices[base + 3], vertices[base + 4], vertices[base + 5]);
            transformNormal(normal,transform);
            mergedVertices[vertexOffset + base + 3] = normal.x;
            mergedVertices[vertexOffset + base + 4] = normal.y;
            mergedVertices[vertexOffset + base + 5] = normal.z;

            // 复制UV和其他属性
            for (let a = 6; a < stride; a++) {
                mergedVertices[vertexOffset + base + a] = vertices[base + a];
            }
        }

        // 获取原始索引数据并调整偏移
        const indices = mesh._indexBuffer._buffer;

        for (let idx = 0; idx < indices.length; idx++) {
            mergedIndices[indexOffset + idx] = indices[idx] + vertexCountOffset;
        }

        vertexOffset += mesh._vertexCount * stride;
        indexOffset += indices.length;
        vertexCountOffset += mesh._vertexCount;
    }

    return PrimitiveMesh._createMesh(vertexDeclaration, mergedVertices, mergedIndices);
}


export class OceanGeometry {
    lengthScale = 15; // float
    vertexDensity = 30; // 1-40 int
    clipLevels = 8; // 0-8 int
    skirtSize = 10; // 0-100 float
    useSkirt = false;// true;
    _scene: Scene3D;
    _camera: Camera;
    _root: Sprite3D;
    _center: Sprite3D;
    _materials: Material[] = [null, null, null];
    _rings: Sprite3D[] = [];
    _trims: Sprite3D[] = [];
    _skirt: Sprite3D;
    _wavesGenerator:WavesGenerator;
    _trimRotations: Quaternion[] = [new Quaternion(), new Quaternion(), new Quaternion(), new Quaternion()];
    _foamTexture:Texture2D;
    //_lightDir= (new Vector3(0,-1,1)).normalize();
    _lightDir = new Vector3(0,-1,0);


    constructor(scene: Scene3D, camera: Camera) {
        Quaternion.createFromAxisAngle(UP, Math.PI, this._trimRotations[0]);
        Quaternion.createFromAxisAngle(UP, Math.PI/2, this._trimRotations[1]);
        Quaternion.createFromAxisAngle(UP, Math.PI*1.5, this._trimRotations[2]);
        this._scene = scene;
        this._camera = camera;
        this._root = new Sprite3D('ocean');
        scene.addChild(this._root);
    }

    get _gridSize() {
        return 4 * this.vertexDensity + 1;
    }

    async initializeMaterials(wavesGen:WavesGenerator) {
        this._wavesGenerator = wavesGen;
        await Laya.loader.load('ocean/Ocean.shader')
        let mtl:Material = await Laya.loader.load('ocean/Ocean.lmat');
        this._foamTexture = await Laya.loader.load('ocean/waterFoam_circular_mask.png') as Texture2D;
        // this._foamTexture.filterMode = FilterMode.Bilinear;
        this._foamTexture.wrapModeU = WrapMode.Repeat;
        this._foamTexture.wrapModeV = WrapMode.Repeat;
        
        mtl.setTexture('u_Displacement_c0',wavesGen._cascades[0]._displacement);
        mtl.setTexture('u_Displacement_c1',wavesGen._cascades[1]._displacement);
        mtl.setTexture('u_Displacement_c2',wavesGen._cascades[2]._displacement);
        mtl.setFloat('u_LOD_scale',7.13);
        mtl.setFloat('u_LengthScale0',wavesGen.lengthScale[0]);
        mtl.setFloat('u_LengthScale1',wavesGen.lengthScale[1]);
        mtl.setFloat('u_LengthScale2',wavesGen.lengthScale[2]);
        mtl.setColor('_Color', new Color(0x21/255, 0x45/255, 0x59/255,1.0));
        mtl.setFloat('_SSSBase',-0.261);
        mtl.setFloat('_SSSStrength',0.15);
        mtl.setFloat('_SSSScale',4.7);
        mtl.setColor('_SSSColor', new Color(0.1541919, 0.8857628, 0.990566,1.0));

        mtl.setTexture('_Derivatives_c0', wavesGen._cascades[0]._derivatives);
        mtl.setTexture('_Derivatives_c1', wavesGen._cascades[1]._derivatives);
        mtl.setTexture('_Derivatives_c2', wavesGen._cascades[2]._derivatives);

        mtl.setTexture('_Turbulence_c0', wavesGen._cascades[0]._turbulence);
        mtl.setTexture('_Turbulence_c1', wavesGen._cascades[1]._turbulence);
        mtl.setTexture('_Turbulence_c2', wavesGen._cascades[2]._turbulence);

        mtl.setFloat('_FoamBiasLOD0',0.84);
        mtl.setFloat('_FoamBiasLOD1',1.83);
        mtl.setFloat('_FoamBiasLOD2',2.72);

        mtl.setFloat('_FoamScale',2.4);
        mtl.setColor('_FoamColor', new Color(1,1,1,1));

        mtl.setFloat('_ContactFoam',1);
        mtl.setFloat('_MaxGloss',0.9);
        mtl.setFloat('_RoughnessScale',0.0044);

        //mtl.setTexture('_FoamTexture', this._foamTexture);
        
        //mtl.setTexture('_CameraDepthTexture',tmpTex);
        mtl.setVector4('_CameraData', new Vector4(1,1000,1000-1,0));    //camera.minz,maxz,max-min,0
        mtl.setFloat('_Time',0);
        mtl.setVector3('_WorldSpaceCameraPos',this._camera.transform.position);
        mtl.setVector3('lightDirection',this._lightDir);

        this._materials=[mtl,mtl,mtl];
    }

    initializeMeshes() {
        //释放之前的
        this._instantiateMeshes();
    }

    _instantiateMeshes() {
        const k = this._gridSize;
        this._center = this._instantiateElement("Center", this._createPlaneMesh(2 * k, 2 * k, 1, Seams.All), this._materials[this._materials.length - 1]);
        const ring = this._createRingMesh(k, 1);
        const trim = this._createTrimMesh(k, 1);
        for (let i = 0; i < this.clipLevels; ++i) {
            this._rings.push(this._instantiateElement("Ring " + i, ring, this._materials[this._materials.length - 1], i > 0));
            this._trims.push(this._instantiateElement("Trim " + i, trim, this._materials[this._materials.length - 1], i > 0));
        }
        if (this.useSkirt) {
            this._skirt = this._instantiateElement("Skirt", this._createSkirtMesh(k, this.skirtSize), this._materials[this._materials.length - 1]);
        }
    }

    _instantiateElement(name: string, mesh: Mesh, mat: Material, clone = false) {
        mesh.name = name;
        var sp3d = new Sprite3D(name);

        let boxrender = sp3d.addComponent(MeshRenderer);
        let boxfilter = sp3d.addComponent(MeshFilter);
        boxfilter.sharedMesh = mesh;
        this._root.addChild(sp3d);
        boxrender.sharedMaterial = mat;
        let v = 10000,nv=-10000;
        boxrender.geometryBounds = new Bounds(new Vector3(nv,nv,nv),new Vector3(v,v,v));
        boxrender.receiveShadow = true;
        //mesh.receiveShadows = true;
        return sp3d;
    }

    _createPlaneMesh(width: number, height: number, lengthScale: number, seams = Seams.None, trianglesShift = 0) {
        const vertices = [];
        const triangles = [];
        const normals = [];
        const uvs = [];

        // 生成顶点数据
        for (let i = 0; i < height + 1; ++i) {
            for (let j = 0; j < width + 1; ++j) {
                let x = j, z = i;
                if (i === 0 && (seams & Seams.Bottom) || i === height && (seams & Seams.Top)) {
                    //接缝处理，把奇数的挪到偶数上
                    x = x & ~1;
                }
                if (j === 0 && (seams & Seams.Left) || j === width && (seams & Seams.Right)) {
                    z = z & ~1;
                }

                // 顶点坐标
                vertices.push(x * lengthScale, 0 * lengthScale, z * lengthScale);

                // 法线向量 (Y轴向上)
                normals.push(0, 1, 0);
                uvs.push(j,i);
            }
        }

        // 生成三角形索引
        for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                const k = j + i * (width + 1);
                if ((i + j + trianglesShift) % 2 === 0) {
                    triangles.push(k, k + width + 2, k + width + 1);
                    triangles.push(k, k + 1, k + width + 2);
                } else {
                    triangles.push(k, k + 1, k + width + 1);
                    triangles.push(k + 1, k + width + 2, k + width + 1);
                }
            }
        }

        // 设置顶点数据
        const vertexDeclaration = VertexMesh.getVertexDeclaration("POSITION,NORMAL,UV");
        const vertexBuffer = new Float32Array(vertices.length + normals.length +uvs.length);

        // 交错存储顶点位置和法线数据
        for (let i = 0; i < vertices.length / 3; i++) {
            const index = i * 8;
            const vertIndex = i * 3;

            // 位置
            vertexBuffer[index] = vertices[vertIndex];
            vertexBuffer[index + 1] = vertices[vertIndex + 1];
            vertexBuffer[index + 2] = vertices[vertIndex + 2];

            // 法线
            vertexBuffer[index + 3] = normals[vertIndex];
            vertexBuffer[index + 4] = normals[vertIndex + 1];
            vertexBuffer[index + 5] = normals[vertIndex + 2];

            //uv
            vertexBuffer[index+6] = uvs[i*2];
            vertexBuffer[index+7] = uvs[i*2+1];
        }

        let mesh = PrimitiveMesh._createMesh(vertexDeclaration, vertexBuffer, new Uint16Array(triangles))
        return mesh;
    }

    _createRingMesh(k: number, lengthScale: number) {
        const m1 = this._createPlaneMesh(2 * k, (k - 1) >> 1, lengthScale, Seams.Bottom | Seams.Right | Seams.Left);
        const t1:TSR = null;
        const m2 = this._createPlaneMesh(2 * k, (k - 1) >> 1, lengthScale, Seams.Top | Seams.Right | Seams.Left);
        const t2 = new TSR(new Vector3(0, 0, (k + 1 + ((k - 1) >> 1)) * lengthScale),null,null);
        const m3 = this._createPlaneMesh((k - 1) >> 1, k + 1, lengthScale, Seams.Left);
        const t3 = new TSR(new Vector3(0, 0, ((k - 1) >> 1) * lengthScale),null,null);
        const m4 = this._createPlaneMesh((k - 1) >> 1, k + 1, lengthScale, Seams.Right);
        const t4 = new TSR(new Vector3((k + 1 + ((k - 1) >> 1)) * lengthScale, 0, ((k - 1) >> 1) * lengthScale),null,null);
        return _mergeMesh([m1,m2,m3,m4],[t1,t2,t3,t4]);
    }

    _createTrimMesh(k: number, lengthScale: number) {
        const m1 = this._createPlaneMesh(k + 1, 1, lengthScale, Seams.None, 1);
        const t1 = new TSR(new Vector3((-k - 1) * lengthScale, 0, -1 * lengthScale), null, null);
        const m2 = this._createPlaneMesh(1, k, lengthScale, Seams.None, 1);
        const t2 = new TSR(new Vector3(-1 * lengthScale, 0, (-k - 1) * lengthScale), null, null);
        return _mergeMesh([m1,m2],[t1,t2]);
    }

    _createSkirtMesh(k: number, outerBorderScale: number):Mesh {
        const quad = this._createPlaneMesh(1, 1, 1);
        const hStrip = this._createPlaneMesh(k, 1, 1);
        const vStrip = this._createPlaneMesh(1, k, 1);
        const cornerQuadScale = new Vector3(outerBorderScale, 1, outerBorderScale);
        const midQuadScaleVert = new Vector3(1 / k, 1, outerBorderScale);
        const midQuadScaleHor = new Vector3(outerBorderScale, 1, 1 / k);
        const m1 = quad.clone();
        // m1.scaling.copyFrom(cornerQuadScale);
        const m2 = hStrip.clone();
        // m2.scaling.copyFrom(midQuadScaleVert);
        // m2.position.x = outerBorderScale;
        const m3 = quad.clone();
        // m3.scaling.copyFrom(cornerQuadScale);
        // m3.position.x = outerBorderScale + 1;
        const m4 = vStrip.clone();
        // m4.scaling.copyFrom(midQuadScaleHor);
        // m4.position.z = outerBorderScale;
        const m5 = vStrip.clone();
        // m5.scaling.copyFrom(midQuadScaleHor);
        // m5.position.x = outerBorderScale + 1;
        // m5.position.z = outerBorderScale;
        const m6 = quad.clone();
        // m6.scaling.copyFrom(cornerQuadScale);
        // m6.position.z = outerBorderScale + 1;
        const m7 = hStrip.clone();
        // m7.scaling.copyFrom(midQuadScaleVert);
        // m7.position.x = outerBorderScale;
        // m7.position.z = outerBorderScale + 1;
        const m8 = quad.clone();
        // m8.scaling.copyFrom(cornerQuadScale);
        // m8.position.x = outerBorderScale + 1;
        // m8.position.z = outerBorderScale + 1;
        // quad.dispose(true, false);
        // hStrip.dispose(true, false);
        // vStrip.dispose(true, false);
        // return BABYLON.Mesh.MergeMeshes([m1, m2, m3, m4, m5, m6, m7, m8], true, true);
        return null;
    }

    //计算当前的lod等级，只要取摄像机的y就行
    get _activeLodLevels() {
        let camH = this._camera.transform.position.y;
        return this.clipLevels - clamp(Math.floor(Math.log2((1.7 * Math.abs(camH) + 1) / this.lengthScale)), 0, this.clipLevels);
    }

    update() {
        this._updatePositions();
        this._updateMaterials();
    }

    _snap(coords: Vector3, scale: number) {
        if (coords.x >= 0) {
            coords.x = Math.floor(coords.x / scale) * scale;
        }
        else {
            coords.x = Math.ceil((coords.x - scale + 1) / scale) * scale;
        }
        if (coords.z < 0) {
            coords.z = Math.floor(coords.z / scale) * scale;
        }
        else {
            coords.z = Math.ceil((coords.z - scale + 1) / scale) * scale;
        }
        coords.y = 0;
    }

    _clipLevelScale(level: number, activeLevels: number) {
        return this.lengthScale / this._gridSize * Math.pow(2, this.clipLevels - activeLevels + level + 1);
    }
    _offsetFromCenter(level: number, activeLevels: number, result: Vector3) {
        const k = this._gridSize;
        const v = ((1 << this.clipLevels) + OceanGeometry._GeometricProgressionSum(2, 2, this.clipLevels - activeLevels + level + 1, this.clipLevels - 1)) * this.lengthScale / k * (k - 1) / 2;
        result.setValue(-v, 0, -v);
    }
    static _GeometricProgressionSum(b0: number, q: number, n1: number, n2: number) {
        return b0 / (1 - q) * (Math.pow(q, n2) - Math.pow(q, n1));
    }

    _updatePositions() {
        const k = this._gridSize;
        let previousSnappedPosition = this._camera.transform.position.clone();
        const centerOffset = new Vector3();
        const snappedPosition = new Vector3();
        const trimPosition = new Vector3();

        const activeLevels = this._activeLodLevels;
        let scale = this._clipLevelScale(-1, activeLevels);
        this._snap(previousSnappedPosition, scale * 2);
        this._offsetFromCenter(-1, activeLevels, centerOffset);

        if(!this._center)
            return;

        //center的移动和缩放
        let curPos = this._center.transform.position;
        previousSnappedPosition.cloneTo(curPos);
        curPos.vadd(centerOffset, curPos);
        this._center.transform.position = curPos;
        this._center.transform.localScale = new Vector3(scale, 1, scale);

        //外面的环的移动和缩放
        for (let i = 0; i < this.clipLevels; i++) {
            let curRing = this._rings[i];
            // activeLevels 为0的时候，所有的环都不显示
            curRing.active = i < activeLevels;
            let curTrim = this._trims[i];
            curTrim.active = i < activeLevels;
            if (i > activeLevels)
                break;
            scale = this._clipLevelScale(i, activeLevels);
            this._camera.transform.position.cloneTo(snappedPosition);
            this._snap(snappedPosition, scale * 2);
            this._offsetFromCenter(i, activeLevels, centerOffset);

            snappedPosition.cloneTo(trimPosition);
            trimPosition.vadd(centerOffset, trimPosition);
            trimPosition.x += scale * (k - 1) / 2;
            trimPosition.z += scale * (k - 1) / 2;
            const shiftX = (previousSnappedPosition.x - snappedPosition.x) <= 0 ? 1 : 0;
            const shiftZ = (previousSnappedPosition.z - snappedPosition.z) <= 0 ? 1 : 0;
            trimPosition.x += shiftX * (k + 1) * scale;
            trimPosition.z += shiftZ * (k + 1) * scale;
            curTrim.transform.position = trimPosition.clone();
            curTrim.transform.rotation = this._trimRotations[shiftX + 2 * shiftZ].clone();
            curTrim.transform.localScale = new Vector3(scale, 1, scale);

            let pos = snappedPosition.clone();
            pos.vadd(centerOffset,pos);
            curRing.transform.position = pos;
            curRing.transform.localScale = new Vector3(scale, 1, scale);

            snappedPosition.cloneTo(previousSnappedPosition);
        }

        //skirt的移动和缩放
        if (this.useSkirt) {
            scale = this.lengthScale * 2 * Math.pow(2, this.clipLevels);
            let pos = previousSnappedPosition.clone();
            pos.x+=-scale * (this.skirtSize + 0.5 - 0.5 / k);
            pos.z+=-scale * (this.skirtSize + 0.5 - 0.5 / k);
            this._skirt.transform.position = pos;

            this._skirt.transform.localScale = new Vector3(scale,1,scale);
        }
    }

    _startTime = Date.now();
    _updateMaterials() {
        const activeLevels = this._activeLodLevels;
        const time = (Date.now() - this._startTime) /1000;
        //更新center,ring,trims,skirt的材质，可以先不更新
        let mtl = this._materials[0];
        if(!mtl)
            return;

        let wavesGen = this._wavesGenerator;
        wavesGen._cascades[0]._derivatives.genMipmap();
        wavesGen._cascades[1]._derivatives.genMipmap();
        wavesGen._cascades[2]._derivatives.genMipmap();
        wavesGen._cascades[0]._turbulence.genMipmap();
        wavesGen._cascades[1]._turbulence.genMipmap();
        wavesGen._cascades[2]._turbulence.genMipmap();        

        mtl.setFloat('_Time',time);
        mtl.setVector3('_WorldSpaceCameraPos',this._camera.transform.position);
        mtl.setFloat('_ContactFoam',(window as any).FFF||100);
        
    }
}

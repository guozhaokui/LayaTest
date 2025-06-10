struct PixelParams {
    positionWS: vec3<f32>,
    normalWS: vec3<f32>,
    tangentWS: vec3<f32>,
    biNormalWS: vec3<f32>,
    TBN: mat3x3<f32>,
    uv0_: vec2<f32>,
}

struct DirectionLight {
    color: vec3<f32>,
    direction: vec3<f32>,
    attenuation: f32,
    lightMode: i32,
}

struct Light {
    color: vec3<f32>,
    dir: vec3<f32>,
    attenuation: f32,
}

struct LightParams {
    l: vec3<f32>,
    h: vec3<f32>,
    NoL: f32,
    NoH: f32,
    LoH: f32,
    VoH: f32,
}

struct PixelInfo {
    positionWS: vec3<f32>,
    vertexNormalWS: vec3<f32>,
    normalWS: vec3<f32>,
    tangentWS: vec3<f32>,
    biNormalWS: vec3<f32>,
    viewDir: vec3<f32>,
    NoV: f32,
    dfg: vec3<f32>,
    energyCompensation: vec3<f32>,
}

struct Surface {
    diffuseColor: vec3<f32>,
    alpha: f32,
    f0_: vec3<f32>,
    f90_: vec3<f32>,
    roughness: f32,
    perceptualRoughness: f32,
    occlusion: f32,
    normalTS: vec3<f32>,
    ior: f32,
}

struct SurfaceInputs {
    diffuseColor: vec3<f32>,
    alpha: f32,
    alphaTest: f32,
    metallic: f32,
    smoothness: f32,
    occlusion: f32,
    emissionColor: vec3<f32>,
    normalTS: vec3<f32>,
}

struct ReflectionProbe {
    u_AmbientColor: vec4<f32>,
    u_IblSH: array<vec3<f32>, 9>,
    u_IBLRoughnessLevel: f32,
    u_AmbientIntensity: f32,
    u_ReflectionIntensity: f32,
    u_SpecCubeProbePosition: vec3<f32>,
    u_SpecCubeBoxMax: vec3<f32>,
    u_SpecCubeBoxMin: vec3<f32>,
}

struct BaseCamera {
    u_CameraPos: vec3<f32>,
    u_View: mat4x4<f32>,
    u_Projection: mat4x4<f32>,
    u_ViewProjection: mat4x4<f32>,
    u_CameraDirection: vec3<f32>,
    u_CameraUp: vec3<f32>,
    u_Viewport: vec4<f32>,
    u_ProjectionParams: vec4<f32>,
    u_OpaqueTextureParams: vec4<f32>,
    u_ZBufferParams: vec4<f32>,
}

struct Scene3D {
    u_Time: f32,
    u_FogParams: vec4<f32>,
    u_FogColor: vec4<f32>,
    u_GIRotate: f32,
    u_DirationLightCount: i32,
}

struct Material {
    u_AlphaTestValue: f32,
    u_TilingOffset: vec4<f32>,
    u_NormalScale: f32,
    u_Metallic: f32,
    u_Smoothness: f32,
    u_OcclusionStrength: f32,
    u_EmissionColor: vec4<f32>,
    u_EmissionIntensity: f32,
    _Color: vec4<f32>,
    u_LOD_scale: f32,
    u_LengthScale0_: f32,
    u_LengthScale1_: f32,
    u_LengthScale2_: f32,
    _SSSBase: f32,
    _SSSScale: f32,
    _SSSColor: vec4<f32>,
    _SSSStrength: f32,
    _FoamBiasLOD0_: f32,
    _FoamBiasLOD1_: f32,
    _FoamBiasLOD2_: f32,
    _FoamScale: f32,
    _FoamColor: vec4<f32>,
    _ContactFoam: f32,
    _MaxGloss: f32,
    _RoughnessScale: f32,
    _CameraData: vec4<f32>,
    _Time: f32,
    _WorldSpaceCameraPos: vec3<f32>,
    lightDirection: vec3<f32>,
}

struct Shadow {
    u_ShadowLightDirection: vec3<f32>,
    u_ShadowBias: vec4<f32>,
    u_ShadowSplitSpheres: array<vec4<f32>, 4>,
    u_ShadowMatrices: array<mat4x4<f32>, 4>,
    u_ShadowMapSize: vec4<f32>,
    u_ShadowParams: vec4<f32>,
    u_SpotShadowMapSize: vec4<f32>,
    u_SpotViewProjectMatrix: mat4x4<f32>,
}

struct Sprite3D {
    u_WorldMat: mat4x4<f32>,
    u_WorldInvertFront: vec4<f32>,
    u_MorphParams: vec4<f32>,
    u_MorphAttrOffset: vec4<f32>,
    u_MorphActiveTargets: array<vec4<f32>, 32>,
    u_MorphTargetActiveCount: i32,
    u_LightmapScaleOffset: vec4<f32>,
    u_PickColor: vec3<f32>,
    u_ReflectCubeHDRParams: vec4<f32>,
    u_AmbientSHAr: vec4<f32>,
    u_AmbientSHAg: vec4<f32>,
    u_AmbientSHAb: vec4<f32>,
    u_AmbientSHBr: vec4<f32>,
    u_AmbientSHBg: vec4<f32>,
    u_AmbientSHBb: vec4<f32>,
    u_AmbientSHC: vec4<f32>,
}

var<private> v_PositionWS_1: vec3<f32>;
var<private> gl_FrontFacing_1: bool;
var<private> v_NormalWS_1: vec3<f32>;
var<private> v_TangentWS_1: vec3<f32>;
var<private> v_BiNormalWS_1: vec3<f32>;
var<private> v_Texcoord0_1: vec2<f32>;
@group(0) @binding(1) 
var u_LightBuffer_Texture: texture_2d<f32>;
@group(0) @binding(2) 
var u_LightBuffer_Sampler: sampler;
@group(3) @binding(17) 
var u_IBLDFG_Texture: texture_2d<f32>;
@group(3) @binding(18) 
var u_IBLDFG_Sampler: sampler;
@group(2) @binding(1) 
var<uniform> unnamed: ReflectionProbe;
@group(1) @binding(0) 
var<uniform> unnamed_1: BaseCamera;
@group(0) @binding(0) 
var<uniform> unnamed_2: Scene3D;
@group(3) @binding(0) 
var<uniform> unnamed_3: Material;
@group(3) @binding(3) 
var _Derivatives_c0_Texture: texture_2d<f32>;
@group(3) @binding(4) 
var _Derivatives_c0_Sampler: sampler;
var<private> vUVCoords_c0_1: vec2<f32>;
@group(3) @binding(5) 
var _Derivatives_c1_Texture: texture_2d<f32>;
@group(3) @binding(6) 
var _Derivatives_c1_Sampler: sampler;
var<private> vUVCoords_c1_1: vec2<f32>;
var<private> vLodScales_1: vec4<f32>;
@group(3) @binding(7) 
var _Derivatives_c2_Texture: texture_2d<f32>;
@group(3) @binding(8) 
var _Derivatives_c2_Sampler: sampler;
var<private> vUVCoords_c2_1: vec2<f32>;
@group(3) @binding(9) 
var _Turbulence_c0_Texture: texture_2d<f32>;
@group(3) @binding(10) 
var _Turbulence_c0_Sampler: sampler;
@group(3) @binding(11) 
var _Turbulence_c1_Texture: texture_2d<f32>;
@group(3) @binding(12) 
var _Turbulence_c1_Sampler: sampler;
var<private> vClipCoords_1: vec4<f32>;
@group(3) @binding(15) 
var _CameraDepthTexture_Texture: texture_2d<f32>;
@group(3) @binding(16) 
var _CameraDepthTexture_Sampler: sampler;
var<private> vMetric_1: f32;
@group(3) @binding(13) 
var _FoamTexture_Texture: texture_2d<f32>;
@group(3) @binding(14) 
var _FoamTexture_Sampler: sampler;
var<private> vWorldUV_1: vec2<f32>;
var<private> vViewVector_1: vec3<f32>;
var<private> pc_fragColor: vec4<f32>;
@group(0) @binding(3) 
var u_LightClusterBuffer_Texture: texture_2d<f32>;
@group(0) @binding(4) 
var u_LightClusterBuffer_Sampler: sampler;
@group(0) @binding(5) 
var<uniform> unnamed_4: Shadow;
@group(0) @binding(6) 
var u_ShadowMap_Texture: texture_2d<f32>;
@group(0) @binding(7) 
var u_ShadowMap_Sampler: sampler;
@group(0) @binding(8) 
var u_SpotShadowMap_Texture: texture_2d<f32>;
@group(0) @binding(9) 
var u_SpotShadowMap_Sampler: sampler;
@group(1) @binding(1) 
var u_CameraDepthTexture_Texture: texture_2d<f32>;
@group(1) @binding(2) 
var u_CameraDepthTexture_Sampler: sampler;
@group(1) @binding(3) 
var u_CameraDepthNormalsTexture_Texture: texture_2d<f32>;
@group(1) @binding(4) 
var u_CameraDepthNormalsTexture_Sampler: sampler;
@group(1) @binding(5) 
var u_CameraOpaqueTexture_Texture: texture_2d<f32>;
@group(1) @binding(6) 
var u_CameraOpaqueTexture_Sampler: sampler;
@group(2) @binding(0) 
var<uniform> unnamed_5: Sprite3D;
@group(3) @binding(1) 
var u_Displacement_c0_Texture: texture_2d<f32>;
@group(3) @binding(2) 
var u_Displacement_c0_Sampler: sampler;

fn outputTransformvf4_(color: ptr<function, vec4<f32>>) -> vec4<f32> {
    let _e108: vec4<f32> = (*color);
    return _e108;
}

fn diffuseIrradiancevf3_(normalWS: ptr<function, vec3<f32>>) -> vec3<f32> {
    let _e109: vec4<f32> = unnamed.u_AmbientColor;
    let _e112: f32 = unnamed.u_AmbientIntensity;
    return (_e109.xyz * _e112);
}

fn diffuseIrradiancevf3vf3vf3_(normalWS_1: ptr<function, vec3<f32>>, positionWS: ptr<function, vec3<f32>>, viewDir: ptr<function, vec3<f32>>) -> vec3<f32> {
    var param: vec3<f32>;

    let _e111: vec3<f32> = (*normalWS_1);
    param = _e111;
    let _e112: vec3<f32> = diffuseIrradiancevf3_((&param));
    return _e112;
}

fn specularRadiancevf3f1_(r: ptr<function, vec3<f32>>, perceptualRoughness: ptr<function, f32>) -> vec3<f32> {
    let _e110: vec4<f32> = unnamed.u_AmbientColor;
    let _e113: f32 = unnamed.u_ReflectionIntensity;
    return (_e110.xyz * _e113);
}

fn getReflectedVectorvf3vf3vf3_(n: vec3<f32>, v: vec3<f32>, positionWS_1: vec3<f32>) -> vec3<f32> {
    var r_1: vec3<f32>;

    r_1 = reflect(-(v), n);
    let _e113: vec3<f32> = r_1;
    return _e113;
}

fn baseIBLstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31vf3vf3vf3_(surface: Surface, info: PixelInfo, E: ptr<function, vec3<f32>>, Fd: ptr<function, vec3<f32>>, Fr: ptr<function, vec3<f32>>) {
    var dfg: vec3<f32>;
    var NoV: f32;
    var n_1: vec3<f32>;
    var v_1: vec3<f32>;
    var positionWS_2: vec3<f32>;
    var diffuseColor: vec3<f32>;
    var roughness: f32;
    var occlusion: f32;
    var r_2: vec3<f32>;
    var indirectSpecular: vec3<f32>;
    var param_1: vec3<f32>;
    var param_2: f32;
    var specularAO: f32;
    var irradiance: vec3<f32>;
    var param_3: vec3<f32>;
    var param_4: vec3<f32>;
    var param_5: vec3<f32>;

    dfg = info.dfg;
    NoV = info.NoV;
    n_1 = info.normalWS;
    v_1 = info.viewDir;
    positionWS_2 = info.positionWS;
    diffuseColor = surface.diffuseColor;
    roughness = surface.perceptualRoughness;
    occlusion = surface.occlusion;
    let _e137: vec3<f32> = n_1;
    let _e138: vec3<f32> = v_1;
    let _e139: vec3<f32> = positionWS_2;
    let _e140: vec3<f32> = getReflectedVectorvf3vf3vf3_(_e137, _e138, _e139);
    r_2 = _e140;
    let _e141: vec3<f32> = r_2;
    param_1 = _e141;
    let _e142: f32 = roughness;
    param_2 = _e142;
    let _e143: vec3<f32> = specularRadiancevf3f1_((&param_1), (&param_2));
    indirectSpecular = _e143;
    let _e144: f32 = occlusion;
    specularAO = _e144;
    let _e145: vec3<f32> = (*E);
    let _e146: vec3<f32> = indirectSpecular;
    let _e148: f32 = specularAO;
    let _e152: vec3<f32> = (*Fr);
    (*Fr) = (_e152 + (((_e145 * _e146) * _e148) * info.energyCompensation));
    let _e154: vec3<f32> = n_1;
    param_3 = _e154;
    let _e155: vec3<f32> = positionWS_2;
    param_4 = _e155;
    param_5 = info.viewDir;
    let _e157: vec3<f32> = diffuseIrradiancevf3vf3vf3_((&param_3), (&param_4), (&param_5));
    irradiance = _e157;
    let _e158: vec3<f32> = diffuseColor;
    let _e159: vec3<f32> = irradiance;
    let _e161: vec3<f32> = (*E);
    let _e165: f32 = occlusion;
    let _e167: vec3<f32> = (*Fd);
    (*Fd) = (_e167 + (((_e158 * _e159) * (vec3(1f) - _e161)) * _e165));
    return;
}

fn getEstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31_(surface_1: Surface, info_1: PixelInfo) -> vec3<f32> {
    var dfg_1: vec3<f32>;
    var f0_: vec3<f32>;
    var f90_: vec3<f32>;
    var E_1: vec3<f32>;

    dfg_1 = info_1.dfg;
    f0_ = surface_1.f0_;
    f90_ = surface_1.f90_;
    let _e116: vec3<f32> = f90_;
    let _e117: vec3<f32> = f0_;
    let _e120: f32 = dfg_1[0u];
    let _e122: vec3<f32> = f0_;
    let _e124: f32 = dfg_1[1u];
    E_1 = (((_e116 - _e117) * _e120) + (_e122 * _e124));
    let _e127: vec3<f32> = E_1;
    return _e127;
}

fn PBRGIstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31_(surface_2: Surface, info_2: PixelInfo) -> vec3<f32> {
    var Fd_1: vec3<f32>;
    var Fr_1: vec3<f32>;
    var E_2: vec3<f32>;
    var param_6: vec3<f32>;
    var param_7: vec3<f32>;
    var param_8: vec3<f32>;
    var gi: vec3<f32>;

    Fd_1 = vec3<f32>(0f, 0f, 0f);
    Fr_1 = vec3<f32>(0f, 0f, 0f);
    let _e116: vec3<f32> = getEstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31_(surface_2, info_2);
    E_2 = _e116;
    let _e117: vec3<f32> = E_2;
    param_6 = _e117;
    let _e118: vec3<f32> = Fd_1;
    param_7 = _e118;
    let _e119: vec3<f32> = Fr_1;
    param_8 = _e119;
    baseIBLstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31vf3vf3vf3_(surface_2, info_2, (&param_6), (&param_7), (&param_8));
    let _e120: vec3<f32> = param_7;
    Fd_1 = _e120;
    let _e121: vec3<f32> = param_8;
    Fr_1 = _e121;
    let _e122: vec3<f32> = Fd_1;
    let _e123: vec3<f32> = Fr_1;
    gi = (_e122 + _e123);
    let _e125: vec3<f32> = gi;
    return _e125;
}

fn pow5f1_(x: ptr<function, f32>) -> f32 {
    var x2_: f32;

    let _e109: f32 = (*x);
    let _e110: f32 = (*x);
    x2_ = (_e109 * _e110);
    let _e112: f32 = x2_;
    let _e113: f32 = x2_;
    let _e115: f32 = (*x);
    return ((_e112 * _e113) * _e115);
}

fn F_Schlickvf3vf3f1_(f0_1: ptr<function, vec3<f32>>, f90_1: ptr<function, vec3<f32>>, VoH: ptr<function, f32>) -> vec3<f32> {
    var param_9: f32;

    let _e111: vec3<f32> = (*f0_1);
    let _e112: vec3<f32> = (*f90_1);
    let _e113: vec3<f32> = (*f0_1);
    let _e115: f32 = (*VoH);
    param_9 = (1f - _e115);
    let _e117: f32 = pow5f1_((&param_9));
    return (_e111 + ((_e112 - _e113) * _e117));
}

fn fresnelvf3vf3f1_(f0_2: ptr<function, vec3<f32>>, f90_2: ptr<function, vec3<f32>>, LoH: ptr<function, f32>) -> vec3<f32> {
    var param_10: vec3<f32>;
    var param_11: vec3<f32>;
    var param_12: f32;

    let _e113: vec3<f32> = (*f0_2);
    param_10 = _e113;
    let _e114: vec3<f32> = (*f90_2);
    param_11 = _e114;
    let _e115: f32 = (*LoH);
    param_12 = _e115;
    let _e116: vec3<f32> = F_Schlickvf3vf3f1_((&param_10), (&param_11), (&param_12));
    return _e116;
}

fn V_SmithGGXCorrelatedf1f1f1_(roughness_1: ptr<function, f32>, NoV_1: ptr<function, f32>, NoL: ptr<function, f32>) -> f32 {
    var a2_: f32;
    var lambdaV: f32;
    var lambdaL: f32;
    var v_2: f32;

    let _e114: f32 = (*roughness_1);
    let _e115: f32 = (*roughness_1);
    a2_ = (_e114 * _e115);
    let _e117: f32 = (*NoL);
    let _e118: f32 = (*NoV_1);
    let _e119: f32 = a2_;
    let _e120: f32 = (*NoV_1);
    let _e123: f32 = (*NoV_1);
    let _e125: f32 = a2_;
    lambdaV = (_e117 * sqrt((((_e118 - (_e119 * _e120)) * _e123) + _e125)));
    let _e129: f32 = (*NoV_1);
    let _e130: f32 = (*NoL);
    let _e131: f32 = a2_;
    let _e132: f32 = (*NoL);
    let _e135: f32 = (*NoL);
    let _e137: f32 = a2_;
    lambdaL = (_e129 * sqrt((((_e130 - (_e131 * _e132)) * _e135) + _e137)));
    let _e141: f32 = lambdaV;
    let _e142: f32 = lambdaL;
    v_2 = (0.5f / (_e141 + _e142));
    let _e145: f32 = v_2;
    return _e145;
}

fn visibilityf1f1f1_(roughness_2: ptr<function, f32>, NoV_2: ptr<function, f32>, NoL_1: ptr<function, f32>) -> f32 {
    var param_13: f32;
    var param_14: f32;
    var param_15: f32;

    let _e113: f32 = (*roughness_2);
    param_13 = _e113;
    let _e114: f32 = (*NoV_2);
    param_14 = _e114;
    let _e115: f32 = (*NoL_1);
    param_15 = _e115;
    let _e116: f32 = V_SmithGGXCorrelatedf1f1f1_((&param_13), (&param_14), (&param_15));
    return _e116;
}

fn D_GGXf1f1vf3vf3_(roughness_3: ptr<function, f32>, NoH: ptr<function, f32>, h: ptr<function, vec3<f32>>, n_2: ptr<function, vec3<f32>>) -> f32 {
    var oneMinusNoHSquared: f32;
    var a: f32;
    var k: f32;
    var d: f32;

    let _e115: f32 = (*NoH);
    let _e116: f32 = (*NoH);
    oneMinusNoHSquared = (1f - (_e115 * _e116));
    let _e119: f32 = (*NoH);
    let _e120: f32 = (*roughness_3);
    a = (_e119 * _e120);
    let _e122: f32 = (*roughness_3);
    let _e123: f32 = oneMinusNoHSquared;
    let _e124: f32 = a;
    let _e125: f32 = a;
    k = (_e122 / (_e123 + (_e124 * _e125)));
    let _e129: f32 = k;
    let _e130: f32 = k;
    d = ((_e129 * _e130) * 0.31830987f);
    let _e133: f32 = d;
    return _e133;
}

fn distributionf1f1vf3vf3_(roughness_4: ptr<function, f32>, NoH_1: ptr<function, f32>, h_1: ptr<function, vec3<f32>>, n_3: ptr<function, vec3<f32>>) -> f32 {
    var param_16: f32;
    var param_17: f32;
    var param_18: vec3<f32>;
    var param_19: vec3<f32>;

    let _e115: f32 = (*roughness_4);
    param_16 = _e115;
    let _e116: f32 = (*NoH_1);
    param_17 = _e116;
    let _e117: vec3<f32> = (*h_1);
    param_18 = _e117;
    let _e118: vec3<f32> = (*n_3);
    param_19 = _e118;
    let _e119: f32 = D_GGXf1f1vf3vf3_((&param_16), (&param_17), (&param_18), (&param_19));
    return _e119;
}

fn specularLobestructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightParamsvf3vf3f1f1f1f11_(surface_3: Surface, pixel: PixelInfo, lightParams: LightParams) -> vec3<f32> {
    var roughness_5: f32;
    var D: f32;
    var param_20: f32;
    var param_21: f32;
    var param_22: vec3<f32>;
    var param_23: vec3<f32>;
    var V: f32;
    var param_24: f32;
    var param_25: f32;
    var param_26: f32;
    var F: vec3<f32>;
    var param_27: vec3<f32>;
    var param_28: vec3<f32>;
    var param_29: f32;

    roughness_5 = surface_3.roughness;
    let _e125: f32 = roughness_5;
    param_20 = _e125;
    param_21 = lightParams.NoH;
    param_22 = lightParams.h;
    param_23 = pixel.normalWS;
    let _e129: f32 = distributionf1f1vf3vf3_((&param_20), (&param_21), (&param_22), (&param_23));
    D = _e129;
    let _e130: f32 = roughness_5;
    param_24 = _e130;
    param_25 = pixel.NoV;
    param_26 = lightParams.NoL;
    let _e133: f32 = visibilityf1f1f1_((&param_24), (&param_25), (&param_26));
    V = _e133;
    param_27 = surface_3.f0_;
    param_28 = surface_3.f90_;
    param_29 = lightParams.LoH;
    let _e137: vec3<f32> = fresnelvf3vf3f1_((&param_27), (&param_28), (&param_29));
    F = _e137;
    let _e138: f32 = D;
    let _e139: f32 = V;
    let _e141: vec3<f32> = F;
    return (_e141 * (_e138 * _e139));
}

fn Fd_Lambert() -> f32 {
    return 1f;
}

fn diffuseLobestructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightParamsvf3vf3f1f1f1f11_(surface_4: ptr<function, Surface>, pixel_1: PixelInfo, lightParams_1: LightParams) -> vec3<f32> {
    let _e111: vec3<f32> = (*surface_4).diffuseColor;
    let _e112: f32 = Fd_Lambert();
    return (_e111 * _e112);
}

fn SafeNormalizevf3_(inVec: ptr<function, vec3<f32>>) -> vec3<f32> {
    var dp3_: f32;

    let _e109: vec3<f32> = (*inVec);
    let _e110: vec3<f32> = (*inVec);
    dp3_ = max(0.001f, dot(_e109, _e110));
    let _e113: vec3<f32> = (*inVec);
    let _e114: f32 = dp3_;
    return (_e113 * inverseSqrt(_e114));
}

fn initLightParamsstructLightParamsvf3vf3f1f1f1f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightvf3vf3f11_(params: ptr<function, LightParams>, pixel_2: PixelInfo, light: Light) {
    var v_3: vec3<f32>;
    var n_4: vec3<f32>;
    var l: vec3<f32>;
    var h_2: vec3<f32>;
    var param_30: vec3<f32>;

    v_3 = pixel_2.viewDir;
    n_4 = pixel_2.normalWS;
    l = normalize(-(light.dir));
    let _e120: vec3<f32> = l;
    (*params).l = _e120;
    let _e122: vec3<f32> = v_3;
    let _e123: vec3<f32> = l;
    param_30 = (_e122 + _e123);
    let _e125: vec3<f32> = SafeNormalizevf3_((&param_30));
    h_2 = _e125;
    let _e126: vec3<f32> = h_2;
    (*params).h = _e126;
    let _e128: vec3<f32> = n_4;
    let _e129: vec3<f32> = l;
    (*params).NoL = clamp(dot(_e128, _e129), 0f, 1f);
    let _e133: vec3<f32> = n_4;
    let _e134: vec3<f32> = h_2;
    (*params).NoH = clamp(dot(_e133, _e134), 0f, 1f);
    let _e138: vec3<f32> = l;
    let _e139: vec3<f32> = h_2;
    (*params).LoH = clamp(dot(_e138, _e139), 0f, 1f);
    let _e143: vec3<f32> = v_3;
    let _e144: vec3<f32> = h_2;
    (*params).VoH = clamp(dot(_e143, _e144), 0f, 1f);
    return;
}

fn PBRLightingstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightvf3vf3f11_(surface_5: Surface, pixel_3: PixelInfo, light_1: Light) -> vec3<f32> {
    var lightParams_2: LightParams;
    var param_31: LightParams;
    var NoL_2: f32;
    var Fd_2: vec3<f32>;
    var param_32: Surface;
    var Fr_2: vec3<f32>;
    var shading: vec3<f32>;

    let _e117: LightParams = lightParams_2;
    param_31 = _e117;
    initLightParamsstructLightParamsvf3vf3f1f1f1f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightvf3vf3f11_((&param_31), pixel_3, light_1);
    let _e118: LightParams = param_31;
    lightParams_2 = _e118;
    let _e120: f32 = lightParams_2.NoL;
    NoL_2 = _e120;
    let _e121: LightParams = lightParams_2;
    param_32 = surface_5;
    let _e122: vec3<f32> = diffuseLobestructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightParamsvf3vf3f1f1f1f11_((&param_32), pixel_3, _e121);
    Fd_2 = _e122;
    let _e123: LightParams = lightParams_2;
    let _e124: vec3<f32> = specularLobestructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightParamsvf3vf3f1f1f1f11_(surface_5, pixel_3, _e123);
    Fr_2 = _e124;
    let _e125: vec3<f32> = Fd_2;
    let _e126: vec3<f32> = Fr_2;
    shading = (_e125 + (_e126 * pixel_3.energyCompensation));
    let _e130: vec3<f32> = shading;
    let _e133: f32 = NoL_2;
    return ((_e130 * light_1.color) * _e133);
}

fn getLightstructDirectionLightvf3vf3f1i11_(directionLight: ptr<function, DirectionLight>) -> Light {
    var light_2: Light;

    let _e110: vec3<f32> = (*directionLight).color;
    light_2.color = _e110;
    let _e113: vec3<f32> = (*directionLight).direction;
    light_2.dir = _e113;
    let _e116: f32 = (*directionLight).attenuation;
    light_2.attenuation = _e116;
    let _e118: Light = light_2;
    return _e118;
}

fn getAttenuationByModef1_(lightMapMode: ptr<function, f32>) -> i32 {
    return 1i;
}

fn getDirectionLighti1vf3_(index: ptr<function, i32>, positionWS_3: ptr<function, vec3<f32>>) -> DirectionLight {
    var v_4: f32;
    var p1_: vec4<f32>;
    var p2_: vec4<f32>;
    var light_3: DirectionLight;
    var param_33: f32;

    let _e114: i32 = (*index);
    v_4 = ((f32(_e114) + 0.5f) / 32f);
    let _e118: f32 = v_4;
    let _e120: vec4<f32> = textureSample(u_LightBuffer_Texture, u_LightBuffer_Sampler, vec2<f32>(0.125f, _e118));
    p1_ = _e120;
    let _e121: f32 = v_4;
    let _e123: vec4<f32> = textureSample(u_LightBuffer_Texture, u_LightBuffer_Sampler, vec2<f32>(0.375f, _e121));
    p2_ = _e123;
    let _e124: vec4<f32> = p1_;
    light_3.color = _e124.xyz;
    let _e127: vec4<f32> = p2_;
    light_3.direction = _e127.xyz;
    light_3.attenuation = 1f;
    let _e132: f32 = p1_[3u];
    param_33 = _e132;
    let _e133: i32 = getAttenuationByModef1_((&param_33));
    light_3.lightMode = _e133;
    let _e135: DirectionLight = light_3;
    return _e135;
}

fn PBRLightingstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31_(surface_6: Surface, info_3: PixelInfo) -> vec3<f32> {
    var lightColor: vec3<f32>;
    var i: i32;
    var directionLight_1: DirectionLight;
    var param_34: i32;
    var param_35: vec3<f32>;
    var light_4: Light;
    var param_36: DirectionLight;
    var giColor: vec3<f32>;
    var color_1: vec3<f32>;

    lightColor = vec3<f32>(0f, 0f, 0f);
    i = 0i;
    loop {
        let _e118: i32 = i;
        if (_e118 < 32i) {
            let _e120: i32 = i;
            let _e122: i32 = unnamed_2.u_DirationLightCount;
            if (_e120 >= _e122) {
                break;
            }
            let _e124: i32 = i;
            param_34 = _e124;
            param_35 = info_3.positionWS;
            let _e126: DirectionLight = getDirectionLighti1vf3_((&param_34), (&param_35));
            directionLight_1 = _e126;
            let _e128: i32 = directionLight_1.lightMode;
            if (_e128 != 0i) {
                let _e130: DirectionLight = directionLight_1;
                param_36 = _e130;
                let _e131: Light = getLightstructDirectionLightvf3vf3f1i11_((&param_36));
                light_4 = _e131;
                let _e132: Light = light_4;
                let _e133: vec3<f32> = PBRLightingstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structLightvf3vf3f11_(surface_6, info_3, _e132);
                let _e135: f32 = light_4.attenuation;
                let _e137: vec3<f32> = lightColor;
                lightColor = (_e137 + (_e133 * _e135));
            }
            continue;
        } else {
            break;
        }
        continuing {
            let _e139: i32 = i;
            i = (_e139 + 1i);
        }
    }
    let _e141: vec3<f32> = PBRGIstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31_(surface_6, info_3);
    giColor = _e141;
    let _e142: vec3<f32> = lightColor;
    let _e143: vec3<f32> = giColor;
    color_1 = (_e142 + _e143);
    let _e145: vec3<f32> = color_1;
    return _e145;
}

fn decodeRGBDvf4_(rgbd: ptr<function, vec4<f32>>) -> vec3<f32> {
    var color_2: vec3<f32>;

    let _e109: vec4<f32> = (*rgbd);
    let _e112: f32 = (*rgbd)[3u];
    color_2 = (_e109.xyz * (1f / _e112));
    let _e115: vec3<f32> = color_2;
    return _e115;
}

fn prefilteredDFG_LUTf1f1_(roughness_6: ptr<function, f32>, NoV_3: ptr<function, f32>) -> vec3<f32> {
    var samplePoint: vec2<f32>;
    var param_37: vec4<f32>;

    let _e111: f32 = (*NoV_3);
    let _e112: f32 = (*roughness_6);
    samplePoint = clamp(vec2<f32>(_e111, _e112), vec2<f32>(0f, 0f), vec2<f32>(1f, 1f));
    let _e116: f32 = samplePoint[1u];
    samplePoint[1u] = (1f - _e116);
    let _e119: vec2<f32> = samplePoint;
    let _e120: vec4<f32> = textureSample(u_IBLDFG_Texture, u_IBLDFG_Sampler, _e119);
    param_37 = _e120;
    let _e121: vec3<f32> = decodeRGBDvf4_((&param_37));
    return _e121;
}

fn getPixelInfostructPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21structSurfacevf3f1vf3vf3f1f1f1vf3f11_(info_4: ptr<function, PixelInfo>, pixel_4: PixelParams, surface_7: Surface) {
    var param_38: f32;
    var param_39: f32;

    (*info_4).positionWS = pixel_4.positionWS;
    (*info_4).vertexNormalWS = pixel_4.normalWS;
    (*info_4).normalWS = pixel_4.normalWS;
    (*info_4).tangentWS = pixel_4.tangentWS;
    (*info_4).biNormalWS = pixel_4.biNormalWS;
    let _e123: vec3<f32> = unnamed_1.u_CameraPos;
    let _e125: vec3<f32> = (*info_4).positionWS;
    (*info_4).viewDir = normalize((_e123 - _e125));
    let _e130: vec3<f32> = (*info_4).normalWS;
    let _e132: vec3<f32> = (*info_4).viewDir;
    (*info_4).NoV = min(max(dot(_e130, _e132), 0.0001f), 1f);
    param_38 = surface_7.perceptualRoughness;
    let _e139: f32 = (*info_4).NoV;
    param_39 = _e139;
    let _e140: vec3<f32> = prefilteredDFG_LUTf1f1_((&param_38), (&param_39));
    (*info_4).dfg = _e140;
    let _e145: f32 = (*info_4).dfg[1u];
    (*info_4).energyCompensation = (vec3(1f) + (surface_7.f0_ * ((1f / _e145) - 1f)));
    return;
}

fn computeF90vf3_(f0_3: ptr<function, vec3<f32>>) -> vec3<f32> {
    let _e108: vec3<f32> = (*f0_3);
    return vec3(clamp(dot(_e108, vec3<f32>(16.5f, 16.5f, 16.5f)), 0f, 1f));
}

fn computeF0vf3vf3f1_(f0_4: ptr<function, vec3<f32>>, baseColor: ptr<function, vec3<f32>>, metallic: ptr<function, f32>) -> vec3<f32> {
    let _e110: vec3<f32> = (*f0_4);
    let _e111: vec3<f32> = (*baseColor);
    let _e112: f32 = (*metallic);
    return mix(_e110, _e111, vec3(_e112));
}

fn computeDiffusevf3f1_(baseColor_1: ptr<function, vec3<f32>>, metallic_1: ptr<function, f32>) -> vec3<f32> {
    let _e109: f32 = (*metallic_1);
    let _e111: vec3<f32> = (*baseColor_1);
    return (_e111 * (1f - _e109));
}

fn initSurfacestructSurfacevf3f1vf3vf3f1f1f1vf3f11structSurfaceInputsvf3f1f1f1f1f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21_(surface_8: ptr<function, Surface>, inputs: SurfaceInputs, pixel_5: PixelParams) {
    var baseColor_2: vec3<f32>;
    var metallic_2: f32;
    var perceptualRoughness_1: f32;
    var ior: f32;
    var f0_5: vec3<f32>;
    var param_40: vec3<f32>;
    var param_41: f32;
    var param_42: vec3<f32>;
    var param_43: vec3<f32>;
    var param_44: f32;
    var param_45: vec3<f32>;

    (*surface_8).alpha = inputs.alpha;
    (*surface_8).normalTS = inputs.normalTS;
    baseColor_2 = inputs.diffuseColor;
    metallic_2 = inputs.metallic;
    perceptualRoughness_1 = (1f - inputs.smoothness);
    ior = 1.5f;
    (*surface_8).ior = 1.5f;
    f0_5 = vec3<f32>(0.04f, 0.04f, 0.04f);
    let _e130: f32 = perceptualRoughness_1;
    (*surface_8).perceptualRoughness = clamp(_e130, 0.045f, 1f);
    let _e134: f32 = (*surface_8).perceptualRoughness;
    let _e136: f32 = (*surface_8).perceptualRoughness;
    (*surface_8).roughness = (_e134 * _e136);
    let _e139: vec3<f32> = baseColor_2;
    param_40 = _e139;
    let _e140: f32 = metallic_2;
    param_41 = _e140;
    let _e141: vec3<f32> = computeDiffusevf3f1_((&param_40), (&param_41));
    (*surface_8).diffuseColor = _e141;
    let _e143: vec3<f32> = f0_5;
    param_42 = _e143;
    let _e144: vec3<f32> = baseColor_2;
    param_43 = _e144;
    let _e145: f32 = metallic_2;
    param_44 = _e145;
    let _e146: vec3<f32> = computeF0vf3vf3f1_((&param_42), (&param_43), (&param_44));
    (*surface_8).f0_ = _e146;
    let _e149: vec3<f32> = (*surface_8).f0_;
    param_45 = _e149;
    let _e150: vec3<f32> = computeF90vf3_((&param_45));
    (*surface_8).f90_ = _e150;
    (*surface_8).occlusion = inputs.occlusion;
    return;
}

fn PBR_Metallic_FlowstructSurfaceInputsvf3f1f1f1f1f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21_(inputs_1: SurfaceInputs, pixel_6: ptr<function, PixelParams>) -> vec4<f32> {
    var surface_9: Surface;
    var param_46: Surface;
    var info_5: PixelInfo;
    var param_47: PixelInfo;
    var surfaceColor: vec3<f32>;

    let _e114: PixelParams = (*pixel_6);
    let _e115: Surface = surface_9;
    param_46 = _e115;
    initSurfacestructSurfacevf3f1vf3vf3f1f1f1vf3f11structSurfaceInputsvf3f1f1f1f1f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21_((&param_46), inputs_1, _e114);
    let _e116: Surface = param_46;
    surface_9 = _e116;
    let _e117: PixelParams = (*pixel_6);
    let _e118: Surface = surface_9;
    let _e119: PixelInfo = info_5;
    param_47 = _e119;
    getPixelInfostructPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21structSurfacevf3f1vf3vf3f1f1f1vf3f11_((&param_47), _e117, _e118);
    let _e120: PixelInfo = param_47;
    info_5 = _e120;
    surfaceColor = vec3<f32>(0f, 0f, 0f);
    let _e121: Surface = surface_9;
    let _e122: PixelInfo = info_5;
    let _e123: vec3<f32> = PBRLightingstructSurfacevf3f1vf3vf3f1f1f1vf3f11structPixelInfovf3vf3vf3vf3vf3vf3f1vf3vf31_(_e121, _e122);
    let _e124: vec3<f32> = surfaceColor;
    surfaceColor = (_e124 + _e123);
    let _e126: vec3<f32> = surfaceColor;
    let _e128: f32 = surface_9.alpha;
    return vec4<f32>(_e126.x, _e126.y, _e126.z, _e128);
}

fn initSurfaceInputsstructSurfaceInputsvf3f1f1f1f1f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21_(inputs_2: ptr<function, SurfaceInputs>, pixel_7: ptr<function, PixelParams>) {
    let _e110: f32 = unnamed_3.u_AlphaTestValue;
    (*inputs_2).alphaTest = _e110;
    (*inputs_2).normalTS = vec3<f32>(0f, 0f, 1f);
    let _e114: f32 = unnamed_3.u_Metallic;
    (*inputs_2).metallic = _e114;
    let _e117: f32 = unnamed_3.u_Smoothness;
    (*inputs_2).smoothness = _e117;
    (*inputs_2).occlusion = 1f;
    (*inputs_2).emissionColor = vec3<f32>(0f, 0f, 0f);
    return;
}

fn getPixelParamsstructPixelParamsvf3vf3vf3vf3mf33vf21_(params_1: ptr<function, PixelParams>) {
    var invertN: f32;

    let _e109: vec3<f32> = v_PositionWS_1;
    (*params_1).positionWS = _e109;
    let _e111: bool = gl_FrontFacing_1;
    invertN = ((select(0f, 1f, _e111) * 2f) - 1f);
    let _e115: vec3<f32> = v_NormalWS_1;
    let _e116: f32 = invertN;
    (*params_1).normalWS = normalize((_e115 * _e116));
    let _e120: vec3<f32> = v_TangentWS_1;
    let _e121: f32 = invertN;
    (*params_1).tangentWS = normalize((_e120 * _e121));
    let _e125: vec3<f32> = v_BiNormalWS_1;
    let _e126: f32 = invertN;
    (*params_1).biNormalWS = normalize((_e125 * _e126));
    let _e131: vec3<f32> = (*params_1).tangentWS;
    let _e133: vec3<f32> = (*params_1).biNormalWS;
    let _e135: vec3<f32> = (*params_1).normalWS;
    (*params_1).TBN = mat3x3<f32>(vec3<f32>(_e131.x, _e131.y, _e131.z), vec3<f32>(_e133.x, _e133.y, _e133.z), vec3<f32>(_e135.x, _e135.y, _e135.z));
    let _e150: vec2<f32> = v_Texcoord0_1;
    (*params_1).uv0_ = _e150;
    return;
}

fn main_1() {
    var pixel_8: PixelParams;
    var param_48: PixelParams;
    var derivatives: vec4<f32>;
    var slope: vec2<f32>;
    var jacobian: f32;
    var screenUV: vec2<f32>;
    var backgroundDepth: f32;
    var surfaceDepth: f32;
    var depthDifference: f32;
    var foam: f32;
    var surfaceAlbedo: vec3<f32>;
    var viewDir_1: vec3<f32>;
    var H: vec3<f32>;
    var ViewDotH: f32;
    var param_49: f32;
    var color_3: vec3<f32>;
    var fresnel: f32;
    var param_50: f32;
    var inputs_3: SurfaceInputs;
    var param_51: SurfaceInputs;
    var param_52: PixelParams;
    var distanceGloss: f32;
    var finalEmissive: vec3<f32>;
    var surfaceColor_1: vec4<f32>;
    var param_53: PixelParams;
    var param_54: vec4<f32>;
    var fuv: vec2<f32>;
    var thick: f32;
    var phi_1264_: bool;

    let _e135: PixelParams = pixel_8;
    param_48 = _e135;
    getPixelParamsstructPixelParamsvf3vf3vf3vf3mf33vf21_((&param_48));
    let _e136: PixelParams = param_48;
    pixel_8 = _e136;
    let _e137: vec2<f32> = vUVCoords_c0_1;
    let _e138: vec4<f32> = textureSample(_Derivatives_c0_Texture, _Derivatives_c0_Sampler, _e137);
    derivatives = _e138;
    let _e139: vec2<f32> = vUVCoords_c1_1;
    let _e140: vec4<f32> = textureSample(_Derivatives_c1_Texture, _Derivatives_c1_Sampler, _e139);
    let _e142: f32 = vLodScales_1[1u];
    let _e144: vec4<f32> = derivatives;
    derivatives = (_e144 + (_e140 * _e142));
    let _e146: vec2<f32> = vUVCoords_c2_1;
    let _e147: vec4<f32> = textureSample(_Derivatives_c2_Texture, _Derivatives_c2_Sampler, _e146);
    let _e149: f32 = vLodScales_1[2u];
    let _e151: vec4<f32> = derivatives;
    derivatives = (_e151 + (_e147 * _e149));
    let _e154: f32 = derivatives[0u];
    let _e156: f32 = derivatives[2u];
    let _e160: f32 = derivatives[1u];
    let _e162: f32 = derivatives[3u];
    slope = vec2<f32>((_e154 / (1f + _e156)), (_e160 / (1f + _e162)));
    let _e167: f32 = slope[0u];
    let _e170: f32 = slope[1u];
    pixel_8.normalWS = normalize(vec3<f32>(-(_e167), 1f, -(_e170)));
    let _e175: vec2<f32> = vUVCoords_c0_1;
    let _e176: vec4<f32> = textureSample(_Turbulence_c0_Texture, _Turbulence_c0_Sampler, _e175);
    let _e178: vec2<f32> = vUVCoords_c1_1;
    let _e179: vec4<f32> = textureSample(_Turbulence_c1_Texture, _Turbulence_c1_Sampler, _e178);
    jacobian = (_e176.x + _e179.x);
    let _e182: f32 = jacobian;
    let _e185: f32 = unnamed_3._FoamBiasLOD1_;
    let _e188: f32 = unnamed_3._FoamScale;
    jacobian = min(1f, max(0f, ((-(_e182) + _e185) * _e188)));
    let _e192: vec4<f32> = vClipCoords_1;
    let _e195: f32 = vClipCoords_1[3u];
    screenUV = (_e192.xy / vec2(_e195));
    let _e198: vec2<f32> = screenUV;
    screenUV = ((_e198 * 0.5f) + vec2(0.5f));
    let _e202: vec2<f32> = screenUV;
    let _e203: vec4<f32> = textureSample(_CameraDepthTexture_Texture, _CameraDepthTexture_Sampler, _e202);
    let _e207: f32 = unnamed_3._CameraData[1u];
    backgroundDepth = (_e203.x * _e207);
    let _e209: f32 = vMetric_1;
    surfaceDepth = _e209;
    let _e210: f32 = backgroundDepth;
    let _e211: f32 = surfaceDepth;
    depthDifference = max(0f, ((_e210 - _e211) - 0.5f));
    let _e215: vec2<f32> = vWorldUV_1;
    let _e218: f32 = unnamed_3._Time;
    let _e222: vec4<f32> = textureSample(_FoamTexture_Texture, _FoamTexture_Sampler, ((_e215 * 0.5f) + vec2((_e218 * 2f))));
    foam = _e222.x;
    let _e225: f32 = unnamed_3._ContactFoam;
    let _e226: f32 = foam;
    let _e227: f32 = depthDifference;
    let _e234: f32 = jacobian;
    jacobian = (_e234 + ((_e225 * clamp((max(0f, (_e226 - _e227)) * 5f), 0f, 1f)) * 0.9f));
    let _e237: vec4<f32> = unnamed_3._FoamColor;
    let _e239: f32 = jacobian;
    surfaceAlbedo = mix(vec3<f32>(0f, 0f, 0f), _e237.xyz, vec3(_e239));
    let _e242: vec3<f32> = vViewVector_1;
    viewDir_1 = normalize(_e242);
    let _e245: vec3<f32> = pixel_8.normalWS;
    let _e248: vec3<f32> = unnamed_3.lightDirection;
    H = normalize((-(_e245) + _e248));
    let _e251: vec3<f32> = viewDir_1;
    let _e252: vec3<f32> = H;
    param_49 = clamp(dot(_e251, -(_e252)), 0f, 1f);
    let _e256: f32 = pow5f1_((&param_49));
    let _e259: f32 = unnamed_3._SSSStrength;
    ViewDotH = ((_e256 * 30f) * _e259);
    let _e262: vec4<f32> = unnamed_3._Color;
    let _e265: vec4<f32> = unnamed_3._Color;
    let _e268: vec4<f32> = unnamed_3._SSSColor;
    let _e270: f32 = ViewDotH;
    let _e273: f32 = vLodScales_1[3u];
    let _e280: f32 = vLodScales_1[2u];
    color_3 = mix(_e262.xyz, clamp((_e265.xyz + ((_e268.xyz * _e270) * _e273)), vec3(0f), vec3(1f)), vec3(_e280));
    let _e284: vec3<f32> = pixel_8.normalWS;
    let _e285: vec3<f32> = viewDir_1;
    fresnel = dot(_e284, _e285);
    let _e287: f32 = fresnel;
    fresnel = clamp((1f - _e287), 0f, 1f);
    let _e290: f32 = fresnel;
    param_50 = _e290;
    let _e291: f32 = pow5f1_((&param_50));
    fresnel = _e291;
    let _e292: SurfaceInputs = inputs_3;
    param_51 = _e292;
    let _e293: PixelParams = pixel_8;
    param_52 = _e293;
    initSurfaceInputsstructSurfaceInputsvf3f1f1f1f1f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21_((&param_51), (&param_52));
    let _e294: SurfaceInputs = param_51;
    inputs_3 = _e294;
    let _e295: PixelParams = param_52;
    pixel_8 = _e295;
    let _e297: f32 = unnamed_3._MaxGloss;
    let _e298: vec3<f32> = vViewVector_1;
    let _e301: f32 = unnamed_3._RoughnessScale;
    distanceGloss = mix(0.5f, _e297, (1f / (1f + (length(_e298) * _e301))));
    let _e306: f32 = distanceGloss;
    let _e307: f32 = jacobian;
    inputs_3.smoothness = mix(_e306, 0f, _e307);
    let _e310: vec3<f32> = color_3;
    let _e311: f32 = fresnel;
    let _e314: f32 = jacobian;
    finalEmissive = mix((_e310 * (1f - _e311)), vec3<f32>(0f, 0f, 0f), vec3(_e314));
    let _e317: vec3<f32> = surfaceAlbedo;
    inputs_3.diffuseColor = _e317;
    inputs_3.alpha = 1f;
    let _e320: SurfaceInputs = inputs_3;
    let _e321: PixelParams = pixel_8;
    param_53 = _e321;
    let _e322: vec4<f32> = PBR_Metallic_FlowstructSurfaceInputsvf3f1f1f1f1f1vf3vf31structPixelParamsvf3vf3vf3vf3mf33vf21_(_e320, (&param_53));
    surfaceColor_1 = _e322;
    let _e323: vec3<f32> = finalEmissive;
    let _e324: vec4<f32> = surfaceColor_1;
    let _e326: vec3<f32> = (_e324.xyz + _e323);
    surfaceColor_1[0u] = _e326.x;
    surfaceColor_1[1u] = _e326.y;
    surfaceColor_1[2u] = _e326.z;
    let _e333: vec4<f32> = surfaceColor_1;
    pc_fragColor = _e333;
    let _e334: vec4<f32> = pc_fragColor;
    param_54 = _e334;
    let _e335: vec4<f32> = outputTransformvf4_((&param_54));
    pc_fragColor = _e335;
    let _e337: vec2<f32> = pixel_8.uv0_;
    fuv = fract(_e337);
    thick = 0.1f;
    let _e340: f32 = fuv[0u];
    let _e341: f32 = thick;
    let _e342: bool = (_e340 < _e341);
    phi_1264_ = _e342;
    if !(_e342) {
        let _e345: f32 = fuv[1u];
        let _e346: f32 = thick;
        phi_1264_ = (_e345 < _e346);
    }
    let _e349: bool = phi_1264_;
    if _e349 {
    }
    let _e350: f32 = foam;
    let _e351: vec3<f32> = vec3(_e350);
    pc_fragColor = vec4<f32>(_e351.x, _e351.y, _e351.z, 1f);
    return;
}

@fragment 
fn main(
    @builtin(front_facing) gl_FrontFacing: bool, 
    @location(0) v_PositionWS: vec3<f32>, 
    @location(1) v_NormalWS: vec3<f32>, 
    @location(2) v_TangentWS: vec3<f32>, 
    @location(3) v_BiNormalWS: vec3<f32>, 
    @location(4) v_Texcoord0_: vec2<f32>, 
    @location(5) vWorldUV: vec2<f32>, 
    @location(6) vUVCoords_c0_: vec2<f32>, 
    @location(7) vUVCoords_c1_: vec2<f32>, 
    @location(8) vUVCoords_c2_: vec2<f32>, 
    @location(9) vViewVector: vec3<f32>) -> 
    @location(10) vLodScales: vec4<f32>, 
    @location(11) vClipCoords: vec4<f32>, 
    @location(12) vMetric: f32, 
    @location(0) vec4<f32> {
    v_PositionWS_1 = v_PositionWS;
    gl_FrontFacing_1 = gl_FrontFacing;
    v_NormalWS_1 = v_NormalWS;
    v_TangentWS_1 = v_TangentWS;
    v_BiNormalWS_1 = v_BiNormalWS;
    v_Texcoord0_1 = v_Texcoord0_;
    vUVCoords_c0_1 = vUVCoords_c0_;
    vUVCoords_c1_1 = vUVCoords_c1_;
    vLodScales_1 = vLodScales;
    vUVCoords_c2_1 = vUVCoords_c2_;
    vClipCoords_1 = vClipCoords;
    vMetric_1 = vMetric;
    vWorldUV_1 = vWorldUV;
    vViewVector_1 = vViewVector;
    main_1();
    let _e29: vec4<f32> = pc_fragColor;
    return _e29;
}
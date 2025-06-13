Shader3D Start
{
    type:Shader3D
    name:Ocean
    enableInstancing:true,
    supportReflectionProbe:true,
    uniformMap:{
        u_AlphaTestValue: { type: Float, default: 0.5, range: [0.0, 1.0] },

        u_TilingOffset: { type: Vector4, default: [1, 1, 0, 0] },
        u_NormalScale: { type: Float, default: 1.0, range: [0.0, 2.0] },

        u_Metallic: { type: Float, default: 0.0, range: [0.0, 1.0] },
        u_Smoothness: { type: Float, default: 0.0, range: [0.0, 1.0] },
        //u_MetallicGlossTexture: { type: Texture2D, options: { define: "METALLICGLOSSTEXTURE" } },

        //u_OcclusionTexture: { type: Texture2D, options: { define: "OCCLUSIONTEXTURE" } },
        u_OcclusionStrength: { type: Float, default: 1.0 },

        u_EmissionColor: { type: Color, default: [0, 0, 0, 0] },
        u_EmissionIntensity: { type: Float, default: 1.0 },
        //u_EmissionTexture: { type: Texture2D, options: { define: "EMISSIONTEXTURE" } },

        _Color:{type:Color},
        u_LOD_scale:{type:Float, default:7.13},
        u_LengthScale0:{type:Float},
        u_LengthScale1:{type:Float},
        u_LengthScale2:{type:Float},
        u_Displacement_c0: {type:Texture2D},
        u_Displacement_c1: {type:Texture2D},
        u_Displacement_c2: {type:Texture2D},
        _SSSBase:{type:Float},
        _SSSScale:{type:Float},
        _SSSColor:{type:Color},
        _SSSStrength:{type:Float},

        _Derivatives_c0:{type:Texture2D},
        _Derivatives_c1:{type:Texture2D},
        _Derivatives_c2:{type:Texture2D},

        _Turbulence_c0:{type:Texture2D},
        _Turbulence_c1:{type:Texture2D},
        _Turbulence_c2:{type:Texture2D},

        _FoamBiasLOD0:{type:Float},
        _FoamBiasLOD1:{type:Float},
        _FoamBiasLOD2:{type:Float},

        _FoamScale:{type:Float},
        _FoamColor:{type:Color},

        _ContactFoam:{type:Float},
        _MaxGloss:{type:Float},

        _RoughnessScale:{type:Float},
        //_FoamTexture:{type:Texture2D},
        _CameraData:{type:Vector4},
        _Time:{type:Float},
        _WorldSpaceCameraPos:{type:Vector3},
        lightDirection:{type:Vector3},
        
    },
    defines: {
        EMISSION: { type: bool, default: false },
        ENABLEVERTEXCOLOR: { type: bool, default: false }
    }
    shaderPass:[
        {
            pipeline:Forward,
            VS:LitVS,
            FS:LitFS
        }
    ]
}
Shader3D End

GLSL Start
#defineGLSL LitVS
    #define SHADER_NAME Ocean

    #include "Math.glsl";

    #include "Scene.glsl";
    #include "SceneFogInput.glsl"

    #include "Camera.glsl";
    #include "Sprite3DVertex.glsl";

    #include "VertexCommon.glsl";
    #include "DepthNormalUtil.glsl";
    #include "PBRVertex.glsl";

    varying vec2 vWorldUV;
    varying vec2 vUVCoords_c0;
    varying vec2 vUVCoords_c1;
    varying vec2 vUVCoords_c2;
    varying vec3 vViewVector;
    varying vec4 vLodScales;
    varying vec4 vClipCoords;
    varying float vMetric;
    varying float vvv;

    void main()
    {
        Vertex vertex;
        getVertexParams(vertex);

        PixelParams pixel;
        initPixelParams(pixel, vertex);

        vec3 worldPos = pixel.positionWS;
        vWorldUV = worldPos.xz;
        vViewVector = _WorldSpaceCameraPos - worldPos.xyz;
        float viewDist = length(vViewVector);
    
        float lod_c0 = min(u_LOD_scale * u_LengthScale0 / viewDist, 1.0);
        float lod_c1 = min(u_LOD_scale * u_LengthScale1 / viewDist, 1.0);
        float lod_c2 = min(u_LOD_scale * u_LengthScale2 / viewDist, 1.0);

        vec3 displacement = vec3(0.);
        float largeWavesBias = 0.;
        vUVCoords_c0 = vWorldUV / u_LengthScale0;
        vUVCoords_c1 = vWorldUV / u_LengthScale1;
        vUVCoords_c2 = vWorldUV / u_LengthScale2;       

        displacement += texture2D(u_Displacement_c0, vUVCoords_c0).xyz ;//* lod_c0;
        largeWavesBias = displacement.y;

        displacement += texture2D(u_Displacement_c1, vUVCoords_c1).xyz * lod_c1;
        displacement += texture2D(u_Displacement_c2, vUVCoords_c2).xyz * lod_c2;

        worldPos.y += 30.0;
        vec4 wPos0 = remapPositionZ(getPositionCS(worldPos));
        vec2 screenUV = wPos0.xy / wPos0.w;
        screenUV = screenUV * 0.5 + 0.5;
        float depth = SAMPLE_DEPTH_TEXTURE(u_CameraDepthTexture, screenUV);
        float backgroundDepth =max(0,min(LinearEyeDepth(depth,u_ZBufferParams)-wPos0.y,10.0))/10.0;
        vvv = (LinearEyeDepth(depth,u_ZBufferParams).r-wPos0.z)/10.0;
        vvv = max(0.5, min(vvv,1.0));

        worldPos.xyz += displacement*vec3(1.0,vvv,1.0);
        vLodScales = vec4(lod_c0, lod_c1, lod_c2, max(displacement.y - largeWavesBias * 0.8 - _SSSBase, 0) / _SSSScale);

        vec4 wPos = getPositionCS(worldPos);
        gl_Position = remapPositionZ(wPos);

        vClipCoords = gl_Position;
        vMetric = gl_Position.z;
        
    #ifdef FOG
        FogHandle(gl_Position.z);
    #endif // FOG 
    }
#endGLSL

#defineGLSL LitFS
    #define SHADER_NAME Ocean

    #include "Color.glsl";

    #include "Scene.glsl";
    #include "SceneFog.glsl";

    #include "Camera.glsl";
    #include "Sprite3DFrag.glsl";

    #include "PBRMetallicFrag.glsl";
    #include "DepthNormalUtil.glsl";

    varying vec2 vWorldUV;
    varying vec2 vUVCoords_c0;
    varying vec2 vUVCoords_c1;
    varying vec2 vUVCoords_c2;
    varying vec3 vViewVector;
    varying vec4 vLodScales;
    varying vec4 vClipCoords;
    varying float vMetric;    
    varying float vvv;

    void initSurfaceInputs(inout SurfaceInputs inputs, inout PixelParams pixel)
    {
        inputs.alphaTest = u_AlphaTestValue;
        // inputs.diffuseColor = u_AlbedoColor.rgb;
        // inputs.alpha = u_AlbedoColor.a;

        inputs.normalTS = vec3(0.0, 0.0, 1.0);

        inputs.metallic = u_Metallic;
        inputs.smoothness = u_Smoothness;

        inputs.occlusion = 1.0;
        inputs.emissionColor = vec3(0.0);
    }

    void main()
    {
        PixelParams pixel;
        getPixelParams(pixel);
        SurfaceInputs inputs;

        vec4 derivatives = texture2D(_Derivatives_c0, vUVCoords_c0);
        derivatives += texture2D(_Derivatives_c1, vUVCoords_c1) * vLodScales.y;
        derivatives += texture2D(_Derivatives_c2, vUVCoords_c2) * vLodScales.z;

        vec2 slope = vec2(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
        pixel.normalWS = normalize(vec3(-slope.x, 1.0, -slope.y));

        //这个会导致贴图超了16个
        float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x + texture2D(_Turbulence_c1, vUVCoords_c1).x + texture2D(_Turbulence_c2, vUVCoords_c2).x;
        jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD2) * _FoamScale));

        //float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x + texture2D(_Turbulence_c1, vUVCoords_c1).x;
        //jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD1) * _FoamScale));

        vec2 screenUV = vClipCoords.xy / vClipCoords.w;
        screenUV = screenUV * 0.5 + 0.5;
        float depth = SAMPLE_DEPTH_TEXTURE(u_CameraDepthTexture, screenUV);
        //depth =Linear01Depth(depth,u_ZBufferParams);
        float backgroundDepth =LinearEyeDepth(depth,u_ZBufferParams);

        float surfaceDepth = vMetric;
        float depthDifference = max(0.0, (backgroundDepth - surfaceDepth) - .5);
        //float foam = texture2D(_FoamTexture, fract(vWorldUV * 0.5 + _Time * 2.)).r;
        //float foam = texture2D(_FoamTexture, fract(vWorldUV /50.0+_Time/100.0 )).r;
        jacobian += _ContactFoam * saturate(max(0.0, 0.0 - depthDifference*depthDifference) * 5.0) * 0.9;

        vec3 surfaceAlbedo = mix(vec3(0.0), _FoamColor.rgb, jacobian);

        vec3 viewDir = normalize(vViewVector);
        vec3 H = normalize(-pixel.normalWS + lightDirection);
        float ViewDotH = pow5(saturate(dot(viewDir, -H))) * 30.0 * _SSSStrength;
        vec3 color = mix(_Color.rgb, saturate(_Color.rgb + _SSSColor.rgb * ViewDotH * vLodScales.w), vLodScales.z);

        float fresnel = dot(pixel.normalWS, viewDir);
        fresnel = saturate(1.0 - fresnel);
        fresnel = pow5(fresnel);

        initSurfaceInputs(inputs, pixel);
        //...
        float distanceGloss = mix(1.0 - 0.5/*metallicRoughness.g*/, _MaxGloss, 1.0 / (1.0 + length(vViewVector) * _RoughnessScale));
        //metallicRoughness.g = 1.0 - mix(distanceGloss, 0.0, jacobian);
        inputs.smoothness = mix(distanceGloss, 0.0, jacobian);
        //...
        vec3 finalEmissive = mix(color * (1.0 - fresnel), vec3(0.0), jacobian);
        
        
        inputs.diffuseColor = surfaceAlbedo.rgb;
        inputs.alpha = 1.0;

        vec4 surfaceColor = PBR_Metallic_Flow(inputs, pixel);
        surfaceColor.rgb += finalEmissive;
        
     #ifdef FOG
         surfaceColor.rgb = sceneLitFog(surfaceColor.rgb);
     #endif // FOG

        gl_FragColor = surfaceColor;
        float dd = saturate(depthDifference*depthDifference);
        gl_FragColor.a = dd;
        //gl_FragColor = vec4(vec3(texture2D(_FoamTexture, fract(vWorldUV /100.0+_Time/2.0 )).r),1.0);
        //gl_FragColor = vec4(vec3(texture2D(u_CameraDepthTexture, screenUV).x),1.0);
        //gl_FragColor = vec4(vec3((backgroundDepth - surfaceDepth)/10.0),1.0);
        //gl_FragColor = vec4(vec3(vvv),1.0);
        //由于127变成187了，所以先转到gamma空间，后面可能有反转gamma
        // 在ide环境下，这样要去掉，不知道为什么
        //gl_FragColor.rgb = pow(gl_FragColor.rgb,vec3(1/2.2));
    }
#endGLSL

GLSL End

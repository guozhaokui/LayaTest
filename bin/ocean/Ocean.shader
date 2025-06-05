Shader3D Start
{
    type:Shader3D
    name:Ocean
    enableInstancing:true,
    supportReflectionProbe:true,
    uniformMap:{
        u_AlphaTestValue: { type: Float, default: 0.5, range: [0.0, 1.0] },

        u_TilingOffset: { type: Vector4, default: [1, 1, 0, 0] },

        u_AlbedoColor: { type: Color, default: [1, 1, 1, 1] },
        //u_AlbedoTexture: { type: Texture2D, options: { define: "ALBEDOTEXTURE" } },

        //u_NormalTexture: { type: Texture2D, options: { define: "NORMALTEXTURE" } },
        u_NormalScale: { type: Float, default: 1.0, range: [0.0, 2.0] },

        u_Metallic: { type: Float, default: 0.0, range: [0.0, 1.0] },
        u_Smoothness: { type: Float, default: 0.0, range: [0.0, 1.0] },
        //u_MetallicGlossTexture: { type: Texture2D, options: { define: "METALLICGLOSSTEXTURE" } },

        //u_OcclusionTexture: { type: Texture2D, options: { define: "OCCLUSIONTEXTURE" } },
        u_OcclusionStrength: { type: Float, default: 1.0 },

        u_EmissionColor: { type: Color, default: [0, 0, 0, 0] },
        u_EmissionIntensity: { type: Float, default: 1.0 },
        //u_EmissionTexture: { type: Texture2D, options: { define: "EMISSIONTEXTURE" } },

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

    #include "PBRVertex.glsl";
    varying vec2 vWorldUV;
    varying vec2 vUVCoords_c0;
    varying vec2 vUVCoords_c1;
    varying vec2 vUVCoords_c2;
    varying vec3 vViewVector;
    varying vec4 vLodScales;
    varying vec4 vClipCoords;
    varying float vMetric;

    void main()
    {
        Vertex vertex;
        getVertexParams(vertex);

        PixelParams pixel;
        initPixelParams(pixel, vertex);

        vec3 worldPos = pixel.positionWS;
        vWorldUV = worldPos.xz;
        vViewVector = u_CameraPos - worldPos.xyz;
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

        worldPos.xyz += displacement;
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

    varying vec2 vWorldUV;
    varying vec2 vUVCoords_c0;
    varying vec2 vUVCoords_c1;
    varying vec2 vUVCoords_c2;
    varying vec3 vViewVector;
    varying vec4 vLodScales;
    varying vec4 vClipCoords;
    varying float vMetric;    

    void initSurfaceInputs(inout SurfaceInputs inputs, inout PixelParams pixel)
    {
        inputs.alphaTest = u_AlphaTestValue;

    #ifdef UV
        vec2 uv = transformUV(pixel.uv0, u_TilingOffset);
    #else // UV
        vec2 uv = vec2(0.0);
    #endif // UV

        inputs.diffuseColor = u_AlbedoColor.rgb;
        inputs.alpha = u_AlbedoColor.a;

    #ifdef COLOR
        #ifdef ENABLEVERTEXCOLOR
        inputs.diffuseColor *= pixel.vertexColor.xyz;
        inputs.alpha *= pixel.vertexColor.a;
        #endif // ENABLEVERTEXCOLOR
    #endif // COLOR

    #ifdef ALBEDOTEXTURE
        vec4 albedoSampler = texture2D(u_AlbedoTexture, uv);
        #ifdef Gamma_u_AlbedoTexture
        albedoSampler = gammaToLinear(albedoSampler);
        #endif // Gamma_u_AlbedoTexture
        inputs.diffuseColor *= albedoSampler.rgb;
        inputs.alpha *= albedoSampler.a;
    #endif // ALBEDOTEXTURE

        inputs.normalTS = vec3(0.0, 0.0, 1.0);
    #ifdef NORMALTEXTURE
         vec3 normalSampler = texture2D(u_NormalTexture, uv).rgb;
        normalSampler = normalize(normalSampler * 2.0 - 1.0);
        normalSampler.y *= -1.0;
        inputs.normalTS = normalScale(normalSampler, u_NormalScale);
    #endif

        inputs.metallic = u_Metallic;
        inputs.smoothness = u_Smoothness;

    #ifdef METALLICGLOSSTEXTURE
        vec4 metallicSampler = texture2D(u_MetallicGlossTexture, uv);
        inputs.metallic = metallicSampler.x;
        inputs.smoothness = (metallicSampler.a * u_Smoothness);
    #endif // METALLICGLOSSTEXTURE

        inputs.occlusion = 1.0;
    #ifdef OCCLUSIONTEXTURE
        vec4 occlusionSampler = texture2D(u_OcclusionTexture, uv);
        float occlusion = occlusionSampler.g;
        inputs.occlusion = (1.0 - u_OcclusionStrength) + occlusion * u_OcclusionStrength;
    #endif // OCCLUSIONTEXTURE

        inputs.emissionColor = vec3(0.0);
    #ifdef EMISSION
        inputs.emissionColor = u_EmissionColor.rgb * u_EmissionIntensity;
        #ifdef EMISSIONTEXTURE
        vec4 emissionSampler = texture2D(u_EmissionTexture, uv);
        #ifdef Gamma_u_EmissionTexture
        emissionSampler = gammaToLinear(emissionSampler);
        #endif // Gamma_u_EmissionTexture
        inputs.emissionColor *= emissionSampler.rgb;
        #endif // EMISSIONTEXTURE
    #endif // EMISSION
    }

    void main()
    {
        PixelParams pixel;
        getPixelParams(pixel);

        vec4 derivatives = texture2D(_Derivatives_c0, vUVCoords_c0);
        derivatives += texture2D(_Derivatives_c1, vUVCoords_c1) * vLodScales.y;
        derivatives += texture2D(_Derivatives_c2, vUVCoords_c2) * vLodScales.z;

        vec2 slope = vec2(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
        pixel.normalWS = normalize(vec3(-slope.x, 1.0, -slope.y));

        //这个会导致贴图超了16个
        // float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x + texture2D(_Turbulence_c1, vUVCoords_c1).x + texture2D(_Turbulence_c2, vUVCoords_c2).x;
        // jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD2) * _FoamScale));

        float jacobian = texture2D(_Turbulence_c0, vUVCoords_c0).x + texture2D(_Turbulence_c1, vUVCoords_c1).x;
        jacobian = min(1.0, max(0.0, (-jacobian + _FoamBiasLOD1) * _FoamScale));

        SurfaceInputs inputs;
        initSurfaceInputs(inputs, pixel);

        vec4 surfaceColor = PBR_Metallic_Flow(inputs, pixel);
        
    #ifdef FOG
        surfaceColor.rgb = sceneLitFog(surfaceColor.rgb);
    #endif // FOG

        gl_FragColor = surfaceColor;

        gl_FragColor = outputTransform(gl_FragColor);
        vec2 fuv = fract(pixel.uv0);
        float thick = 0.1;
        if(fuv.x<thick||fuv.y<thick){
            //gl_FragColor += vec4(1.0,1.0,1.0,1.0);
        }
        else{
        }
    }
#endGLSL

GLSL End

import { Texture2D } from "laya/resource/Texture2D";

export class ComputeHelper {
    static CopyTexture(source:Texture2D, dest:Texture2D) {
        alert('ni');

        // const numChannels = source.getInternalTexture().format === BABYLON.Constants.TEXTUREFORMAT_RG ? 2 : 4;
        // if (!ComputeHelper._copyTexture4CS && numChannels === 4 || !ComputeHelper._copyTexture2CS && numChannels === 2) {
        //     const engine = source.getScene()?.getEngine() ?? engine_;
        //     const cs1 = new BABYLON.ComputeShader(`copyTexture${numChannels}Compute`, engine, { computeSource: numChannels === 4 ? ComputeHelper._copyTexture4ComputeShader : ComputeHelper._copyTexture2ComputeShader }, {
        //         bindingsMapping: {
        //             "dest": { group: 0, binding: 0 },
        //             "src": { group: 0, binding: 1 },
        //             "params": { group: 0, binding: 2 },
        //         }
        //     });
        //     const uBuffer0 = new BABYLON.UniformBuffer(engine);
        //     uBuffer0.addUniform("width", 1);
        //     uBuffer0.addUniform("height", 1);
        //     cs1.setUniformBuffer("params", uBuffer0);
        //     if (numChannels === 4) {
        //         ComputeHelper._copyTexture4CS = cs1;
        //         ComputeHelper._copyTexture4Params = uBuffer0;
        //     }
        //     else {
        //         ComputeHelper._copyTexture2CS = cs1;
        //         ComputeHelper._copyTexture2Params = uBuffer0;
        //     }
        // }
        // const cs = numChannels === 4 ? ComputeHelper._copyTexture4CS : ComputeHelper._copyTexture2CS;
        // const params = numChannels === 4 ? ComputeHelper._copyTexture4Params : ComputeHelper._copyTexture2Params;
        // cs.setTexture("src", source, false);
        // cs.setStorageTexture("dest", dest);
        // const { width, height } = source.getSize();
        // params.updateInt("width", width);
        // params.updateInt("height", height);
        // params.update();
        // ComputeHelper.Dispatch(cs, width, height, 1);
    }
}
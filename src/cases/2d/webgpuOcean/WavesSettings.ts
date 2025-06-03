export class WavesSettings {
    g = 9.81;
    depth = 3;
    //[Range(0, 1)]
    lambda = 1;
    local = {
        scale: 0.5,
        windSpeed: 1.5,
        windDirection: -29.81,
        fetch: 100000,
        spreadBlend: 1,
        swell: 0.198,
        peakEnhancement: 3.3,
        shortWavesFade: 0.01,
    };
    swell = {
        scale: 0.5,
        windSpeed: 1.5,
        windDirection: 90,
        fetch: 300000,
        spreadBlend: 1,
        swell: 1,
        peakEnhancement: 3.3,
        shortWavesFade: 0.01,
    };
    spectrums = [{
        scale: 0,
        angle: 0,
        spreadBlend: 0,
        swell: 0,
        alpha: 0,
        peakOmega: 0,
        gamma: 0,
        shortWavesFade: 0,
    }, {
        scale: 0,
        angle: 0,
        spreadBlend: 0,
        swell: 0,
        alpha: 0,
        peakOmega: 0,
        gamma: 0,
        shortWavesFade: 0,
    }];
}
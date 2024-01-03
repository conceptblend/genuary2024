import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "set one",
    seed: "hello world",
    width: 540,
    height: 540,
    fps: 30,
    duration: 30 * 10, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: false,
    isAnimated: true,
    renderAsVector: AS_SVG,
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORTVIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION = PARAMS.duration;

function clamp(x: number, min: number, max: number): number {
  return Math.max(Math.min(x, max), min);
}

export const sketch = (p: p5) => {
  let isRecording = false;

  function adjustBrightnessWithHueShift(c: p5.Color, brightnessShiftAmount: number, hueShiftAmount): p5.Color {
    let hue: number = p.hue(c),
      saturation: number = p.saturation(c),
      brightness: number = p.brightness(c);

    brightness = clamp(brightness + brightnessShiftAmount * 100, 0, 100);

    const adjustedColor = p.color(hue, saturation, brightness);
    const hueTargetColor =
      hueShiftAmount > 0.5 ? p.color(60, saturation, brightness) : p.color(280, saturation, brightness);

    return p.lerpColor(adjustedColor, hueTargetColor, hueShiftAmount);
  }

  // function darkenWithHueShift(c: p5.Color, shiftAmount: number): p5.Color {
  //   return adjustBrightnessWithHueShift(c, -Math.abs(shiftAmount), false);
  // }
  // function lightenWithHueShift(c: p5.Color, shiftAmount: number): p5.Color {
  //   return adjustBrightnessWithHueShift(c, Math.abs(shiftAmount));
  // }

  let baseColor,
    baseColorValues = [160, 80, 50];

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.HSB);
    p.noStroke();

    // Dependency: Statically added via HTML
    Math.seedrandom(PARAMS.seed);

    // p.noiseDetail(4, 0.15);
    // p.noiseSeed(Math.random());

    p.frameRate(FPS);

    if (!EXPORTVIDEO && !PARAMS.isAnimated) p.noLoop();
  };

  p.draw = () => {
    p.background(0);

    // DO YOUR DRAWING HERE!
    const gridSize = 54 * 2,
      cellSize = PARAMS.width / gridSize,
      noiseIncrement = 0.025;
    let i = 0,
      j = 0,
      c,
      noiseX = 0,
      noiseY = 0,
      noiseZ = p.frameCount * noiseIncrement;
    for (let y: number = 0; y < PARAMS.height; y += cellSize) {
      noiseX = 0;
      for (let x: number = 0; x < PARAMS.width; x += cellSize) {
        const noiseVal = p.noise(noiseX, noiseY, noiseZ);
        const noiseVal2 = p.noise(noiseX, noiseY, noiseZ + 87594);

        baseColor = p.color(noiseVal * 360, 100, 50);
        c = adjustBrightnessWithHueShift(baseColor, noiseVal, noiseVal);

        p.fill(c);
        p.rect(x, y, cellSize);
        i++;
        noiseX += noiseIncrement;
      }
      j++;
      noiseY += noiseIncrement;
    }

    if (EXPORTVIDEO) {
      if (PARAMS.renderAsVector) throw new Error("Cannot export video when rendering as Vector");
      if (!isRecording) {
        isRecording = true;
        console.log("Recording...[ Not implemented ]");
      }
      // Example to end automatically after 361 frames to get a full loop
      if (p.frameCount > DURATION) {
        p.noLoop();
        saveConfig();
        console.log("Done.");
      }
    }
  };

  function getName() {
    // Encode the parameters into the filename
    return `${PARAMS.name}-${encodeURIComponent(PARAMS.seed)}-${new Date().toISOString()}`;
  }

  function saveImage(ext = "jpg") {
    p.save(`${getName()}.${ext}`);
  }

  function saveConfig() {
    p.saveJSON(PARAMS, `${getName()}-config.json`);
  }

  function downloadOutput() {
    saveImage(PARAMS.renderAsVector ? "svg" : "jpg");
    saveConfig();
  }
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

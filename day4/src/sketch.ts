import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "pixel fire 003",
    seed: "lets find a good one...",
    width: 540,
    height: 540,
    fps: 10,
    durationInFrames: 20 * 10,
    exportVideo: false,
    exportFrames: true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    colorRampItemCount: 17,
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORT_VIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const EXPORT_FRAMES = AS_SVG ? false : PARAMS.exportFrames ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION_IN_FRAMES = PARAMS.durationInFrames;

type ramp = p5.Color[];
let ramps: ramp[] = [];
const RAMP_COUNT: number = 4;

function clamp(x: number, min: number, max: number): number {
  return Math.max(Math.min(x, max), min);
}
function _lerp(a: number, b: number, x: number): number {
  return a + (b - a) * clamp(x, 0, 1);
}
function makeColorRamp(p: p5, baseColor: p5.Color, totalSteps: number): p5.Color[] {
  /**
   * If the totalSteps is even, guess what?! We're going to make it odd so that
   * there are an even number of steps on either side of the base.
   */
  const rampLength = totalSteps % 2 === 0 ? totalSteps + 1 : totalSteps;
  const halfRampLength = (rampLength - 1) * 0.5;

  let rampColors = [baseColor];

  const brightness = p.brightness(baseColor);
  const LIGHT_BRIGHTNESS_TARGET = 95; // out of 100
  const DARK_BRIGHTNESS_TARGET = 5; // out of 100

  // Add the lighter colours
  for (let i = 0; i < halfRampLength; i++) {
    const amount = ((LIGHT_BRIGHTNESS_TARGET - brightness) * ((i + 1) / halfRampLength)) / 100;
    rampColors.push(adjustBrightnessWithHueShift(p, baseColor, amount));
  }
  // Add the darker colours
  for (let i = 0; i < halfRampLength; i++) {
    const amount = ((DARK_BRIGHTNESS_TARGET - brightness) * ((i + 1) / halfRampLength)) / 100;
    rampColors.unshift(adjustBrightnessWithHueShift(p, baseColor, amount));
  }

  return rampColors;
}
function mapUnitToArrayIndex(unitValue: number, arr: any[]): number {
  return clamp(Math.floor(unitValue * arr.length), 0, arr.length - 1);
}
function adjustBrightnessWithHueShift(p: p5, c: p5.Color, brightnessShiftAmount: number): p5.Color {
  const YELLOW_HUE: number = 60,
    PURPLE_HUE: number = 280;
  let hue: number = p.hue(c),
    saturation: number = p.saturation(c),
    brightness: number = p.brightness(c);

  hue = _lerp(hue, brightnessShiftAmount > 0 ? YELLOW_HUE : PURPLE_HUE, clamp(2 * brightnessShiftAmount, 0, 1));
  saturation = clamp(saturation + brightnessShiftAmount * 75, 5, 95);
  brightness = clamp(brightness + brightnessShiftAmount * 100, 15, 95);

  return p.color(hue, saturation, brightness);
}

function drawPixel(p: p5, color: p5.Color, x: number, y: number, rotate: boolean = false): void {
  const LINE_WIDTH = 2;
  const LINE_HEIGHT = 6;
  const r = p.red(color),
    g = p.green(color),
    b = p.blue(color);

  const drawSubpixel = (c: p5.Color, x: number, y: number, rotate: boolean = false): void => {
    p.fill(c);
    if (rotate) {
      p.rect(x + 1, y + 1, LINE_HEIGHT, LINE_WIDTH);
      return;
    }
    p.rect(x + 1, y + 1, LINE_WIDTH, LINE_HEIGHT);
  };

  p.push();
  p.colorMode(p.RGB);

  if (rotate) {
    drawSubpixel(p.color(r, 0, 0), x, y, true);
    drawSubpixel(p.color(0, g, 0), x, y + LINE_WIDTH, true);
    drawSubpixel(p.color(0, 0, b), x, y + 2 * LINE_WIDTH, true);
  } else {
    drawSubpixel(p.color(r, 0, 0), x, y);
    drawSubpixel(p.color(0, g, 0), x + LINE_WIDTH, y);
    drawSubpixel(p.color(0, 0, b), x + 2 * LINE_WIDTH, y);
  }

  p.pop();
}

function drawThingy(
  p: p5,
  colorRamp: p5.Color[],
  gridSize: number = 54,
  frameWidth: number,
  frameHeight: number,
  posX: number = 0,
  posY: number = 0
): void {
  const cellSize = frameWidth / gridSize,
    noiseIncrement = 0.0255;

  let paintColor,
    noiseX = 0,
    noiseY = 0,
    noiseZ = p.frameCount * noiseIncrement;

  for (let y: number = 0; y < frameHeight; y += cellSize) {
    noiseX = 0;
    const cellY = y / cellSize;
    for (let x: number = 0; x < frameWidth; x += cellSize) {
      const noiseVal = p.noise(noiseX, noiseY, noiseZ);

      paintColor = colorRamp[mapUnitToArrayIndex(noiseVal, colorRamp)];

      const cellX = x / cellSize;

      drawPixel(p, paintColor, posX + x, posY + y, (cellX + cellY) % 2 === 0);

      noiseX += noiseIncrement;
    }
    noiseY += noiseIncrement;
  }
}

export const sketch = (p: p5) => {
  let isRecording = false;

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.HSB);
    p.noStroke();

    // Dependency: Statically added via HTML
    Math.seedrandom(PARAMS.seed);

    let baseColor = utils.randBetween(0, 360, true);
    for (let n = 0; n < RAMP_COUNT; n++) {
      const myRamp = makeColorRamp(p, p.color(baseColor, utils.randBetween(40, 60), 60), PARAMS.colorRampItemCount);
      const myRamp2 = makeColorRamp(
        p,
        p.color((baseColor + 180) % 360, utils.randBetween(50, 80), 80),
        PARAMS.colorRampItemCount
      );
      ramps.push([...myRamp, ...myRamp2]);
      baseColor = (baseColor + 60) % 360;
    }

    p.frameRate(FPS);

    if (!EXPORT_VIDEO && !PARAMS.isAnimated) p.noLoop();
  };

  p.draw = () => {
    p.background(280, 20, 20);

    // DO YOUR DRAWING HERE!
    drawThingy(p, ramps[0], 54, PARAMS.width, PARAMS.height, 0, 0);

    if (EXPORT_VIDEO) {
      if (PARAMS.renderAsVector) throw new Error("Cannot export video when rendering as Vector");
      if (!isRecording) {
        isRecording = true;
        console.log("Recording...[ Not implemented ]");
      }
      // Example to end automatically after 361 frames to get a full loop
      if (p.frameCount > DURATION_IN_FRAMES) {
        p.noLoop();
        saveConfig();
        console.log("Done.");
      }
    } else if (EXPORT_FRAMES) {
      if (PARAMS.renderAsVector) throw new Error("Cannot export video when rendering as Vector");
      saveFrameAsImage(p.frameCount);
      // Example to end automatically after 361 frames to get a full loop
      if (p.frameCount > DURATION_IN_FRAMES) {
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

  function saveFrameAsImage(frameNumber: number, ext = "jpg") {
    p.save(`${getName()}_${frameNumber}.${ext}`);
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

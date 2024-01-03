import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "set one",
    seed: "hello world",
    width: 540,
    height: 540,
    fps: 24,
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
  let baseColor;

  function adjustBrightnessWithHueShift(c: p5.Color, brightnessShiftAmount: number): p5.Color {
    const YELLOW_HUE = 60,
      PURPLE_HUE = 280;
    let hue: number = p.hue(c),
      saturation: number = p.saturation(c),
      brightness: number = p.brightness(c);

    hue = p.lerp(hue, brightnessShiftAmount > 0 ? YELLOW_HUE : PURPLE_HUE, 2 * brightnessShiftAmount);
    brightness = clamp(brightness + brightnessShiftAmount * 80, 0, 100);

    return p.color(hue, saturation, brightness);
  }

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

  let minNoise = Infinity,
    maxNoise = -Infinity;
  p.draw = () => {
    p.background(0);

    // DO YOUR DRAWING HERE!
    const gridSize = 54,
      cellSize = PARAMS.width / gridSize,
      noiseIncrement = 0.015;
    const cxy = PARAMS.width * 0.5 - ((PARAMS.width * 0.5) % (cellSize + 1));

    let paintColor,
      noiseX = 0,
      noiseY = 0,
      noiseZ = p.frameCount * noiseIncrement;

    for (let y: number = 0; y < PARAMS.height; y += cellSize) {
      noiseX = 0;
      const dy = cxy - y;
      for (let x: number = 0; x < PARAMS.width; x += cellSize) {
        const noiseVal = p.noise(noiseX, noiseY, noiseZ);
        const sineGoodies =
          0.5 +
          0.5 *
            Math.sin((2 * p.frameCount * Math.PI) / 180) *
            Math.pow(Math.cos((4 * p.frameCount * Math.PI) / 180), 2);
        const noiseVal2 = p.noise(noiseX, noiseY, noiseZ + 87594);

        baseColor = p.color(sineGoodies * 360, 100, noiseVal2 * 100);
        // baseColor = p.color(noiseVal2 * 360, 100, sineGoodies * 100);
        const dx = cxy - x;
        if (dx * dx + dy * dy > cxy * cxy) {
          paintColor = baseColor;
        } else {
          paintColor = adjustBrightnessWithHueShift(baseColor, (noiseVal - 0.5) * 1.5);
        }

        p.fill(paintColor);
        p.rect(x, y, cellSize);

        noiseX += noiseIncrement;
      }
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

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
const DEG_TO_RAD = Math.PI / 180;

export const sketch = (p) => {
  let isRecording = false;

  p.keyReleased = (e) => {
    const KEY_S = 83;
    if (e.which === KEY_S) {
      saveImage("png");
    }
  };

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.HSB, 255);

    p.noStroke();

    p.frameRate(FPS);

    if (!EXPORTVIDEO && !PARAMS.isAnimated) p.noLoop();
  };

  const SAT = 164;
  const LUM = 192;
  const ALPHA = 64;
  const AMPLITUDE = 100;
  const AMP_x_2 = 2 * AMPLITUDE * 0.8;
  p.draw = () => {
    const CX = p.width * 0.5;
    p.background(0);

    const wobble1 = (x: number, t: number) => {
      return 0.5 * (Math.sin(DEG_TO_RAD * (2 * x + 3 * t + 5)) + Math.sin(DEG_TO_RAD * (3 * x + 2 * t + 4)));
    };
    const wobble2 = (x: number, t: number) => {
      return 0.5 * (Math.sin(DEG_TO_RAD * (7 * x + 3 * t + 5)) + Math.sin(DEG_TO_RAD * (2 * x + 4 * t + 2)));
    };

    for (let y = 10; y < p.height - 10; y += 4) {
      const x1 = wobble1(y, p.frameCount);
      const x2 = wobble2(y, p.frameCount);

      p.fill(Math.abs(x1 * 180 + 180), SAT, LUM, ALPHA);

      const X = x1 * AMPLITUDE;
      const Y = (p.height - y) / p.height;
      const DIAMETER = Math.abs(0.5 * AMPLITUDE * (x1 + x2));
      p.circle(CX + (X - AMP_x_2) * Y, y, DIAMETER);
      p.circle(CX + (-X + AMP_x_2) * Y, y, DIAMETER);
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

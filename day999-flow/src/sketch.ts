import * as p5 from "p5";
import * as utils from "./lib/fx-utils";
import * as noisey from "./NoiseMapper";

type ParameterSet = {
  name: string;
  seed: string;
  noiseSeed?: number;
  width: number;
  height: number;
  fps: number;
  duration: number;
  exportVideo: boolean;
  isAnimated: boolean;
  renderAsVector: boolean;
  noiseRangeX: number;
  noiseRangeY: number;
  ringSteps: number;
  useRing: boolean;
  ring: { steps: number; radiusFraction: number };
  useGrid: boolean;
  grid: { steps: number; spacing: number };
};
// PARAMETER SETS
const PARAM_SETS: ParameterSet[] = [
  {
    name: "warble",
    seed: "0000000stripey cask and stuff or whatever!",
    width: 540,
    height: 540,
    fps: 30,
    duration: 30 * 10, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: false,
    isAnimated: false,
    renderAsVector: AS_SVG,
    noiseRangeX: 1,
    noiseRangeY: 1,
    ringSteps: 45,
    useRing: true,
    ring: { steps: 45, radiusFraction: 0.2 },
    useGrid: !true,
    grid: { steps: 8, spacing: 25 },
  },
  {
    name: "warble",
    seed: "stripey cask",
    width: 540,
    height: 540,
    fps: 30,
    duration: 30 * 10, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: false,
    isAnimated: false,
    renderAsVector: AS_SVG,
    noiseRangeX: 4,
    noiseRangeY: 4,
    ringSteps: 90,
    useRing: true,
    ring: { steps: 45, radiusFraction: 0.2 },
    useGrid: !true,
    grid: { steps: 4, spacing: 50 },
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORTVIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION = PARAMS.duration;

const POINTS = [];

export const sketch = (p: p5) => {
  let isRecording = false;

  const nm = new noisey.NoiseMapper(
    p,
    { min: 0, max: PARAMS.width },
    { min: 0, max: PARAMS.height },
    { min: 0, max: PARAMS.noiseRangeX },
    { min: 0, max: PARAMS.noiseRangeY }
  );

  p.keyReleased = (e: KeyboardEvent) => {
    if (e.key === "s") {
      downloadOutput();
    } else if (e.key === "n") {
      PARAMS.noiseSeed = Math.random() * 17;
      p.noiseSeed(PARAMS.noiseSeed);
      p.redraw();
    }
  };

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.RGB, 255);

    // Dependency: Statically added via HTML
    Math.seedrandom(PARAMS.seed);
    // Deterministic random seed :P
    p.noiseSeed(PARAMS.noiseSeed ?? Math.random() * 17);
    // nm.setZ(Math.random());
    // BUG: For some reason, this is non-deterministic...
    // Assumption: in fxutils, Math.random is being assigned before it's augmented, perhaps?
    // nm.randomizeZ();

    p.frameRate(FPS);

    if (!EXPORTVIDEO && !PARAMS.isAnimated) p.noLoop();
  };

  p.draw = () => {
    p.background(0);
    p.noFill();
    p.stroke(180);

    if (PARAMS.useGrid) {
      // Empty the points array... does it need to be a const?!?
      POINTS.splice(0, POINTS.length);
      const STEPS_X = PARAMS.grid.steps;
      const STEPS_Y = PARAMS.grid.steps;
      const GRID_SPACE = PARAMS.grid.spacing;
      for (let y = 0; y < STEPS_Y; y++) {
        for (let x = 0; x < STEPS_X; x++) {
          const px = p.width * 0.5 - STEPS_X * 0.5 * GRID_SPACE + x * GRID_SPACE;
          const py = p.height * 0.5 - STEPS_Y * 0.5 * GRID_SPACE + y * GRID_SPACE;
          POINTS.push({ x: px, y: py });
        }
      }
    }

    if (PARAMS.useRing) {
      // Empty the points array... does it need to be a const?!?
      POINTS.splice(0, POINTS.length);
      const PT_STEPS = PARAMS.ringSteps;
      const PT_STEP_SIZE = 360 / PT_STEPS;
      const PT_RADIUS = p.width * PARAMS.ring.radiusFraction;
      utils.repeat(PT_STEPS, (i) => {
        POINTS.push({
          x: Math.round(Math.cos((i * PT_STEP_SIZE * Math.PI) / 180) * PT_RADIUS) + p.width * 0.5,
          y: Math.round(Math.sin((i * PT_STEP_SIZE * Math.PI) / 180) * PT_RADIUS) + p.height * 0.5,
        });
      });
    }

    /**
     * Start with a uniform grid of points.
     * For I iterations...
     *    Clear the screen
     *    For each Point...
     *      map its {x,y} coords to noise coordinates {nx, ny}
     *      take the noise value at those coordinates
     *      multiply the noise value by 360 to get an angle
     *      move this Point in that direction by N units OR by another noise value * N
     *    Draw the points?
     */

    utils.repeat(40, (i) => {
      p.beginShape();
      POINTS.forEach((pt) => {
        const DIST = 8 * nm.getNoiseAt(2 * pt.x, pt.y);
        const angle = 720 * nm.getNoiseAt(pt.x, pt.y);
        pt.x += DIST * Math.cos((angle * Math.PI) / 180);
        pt.y += DIST * Math.sin((angle * Math.PI) / 180);
        p.vertex(pt.x, pt.y);
      });
      if (PARAMS.useRing) {
        p.endShape(p.CLOSE);
      } else {
        p.endShape();
      }
      nm.updateZ(0.001);
    });

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
    saveImage(PARAMS.renderAsVector ? "svg" : "png");
    saveConfig();
  }
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

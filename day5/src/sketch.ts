import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "VeraMolnar-002",
    seed: "Vera Molnar",
    width: 540,
    height: 540,
    fps: 9,
    durationInFrames: 9 * 4 * 4, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    isAnimated: true,
    exportFrames: true,
    renderAsVector: AS_SVG,
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORT_FRAMES = AS_SVG ? false : PARAMS.exportFrames ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION_IN_FRAMES = PARAMS.durationInFrames;

type SimplePoint = { x: number; y: number };
type RingOptions = {
  color: p5.Color;
  radius: number;
  steps: number;
  angleOffset: number;
};
function drawRing(p: p5, center: SimplePoint, options: RingOptions): void {
  const STEP_SIZE: number = 360 / options.steps;

  p.fill(options.color);
  p.noStroke();
  const focusIndex = Math.floor(options.steps / 3);
  for (let n = 0; n < options.steps; n++) {
    const angle = STEP_SIZE * n - 90;
    const radiansAngle = (angle * Math.PI) / 180;
    const x = center.x + Math.cos(radiansAngle) * options.radius;
    const y = center.y + Math.sin(radiansAngle) * options.radius;

    p.push();
    p.translate(x, y);
    p.rotate(angle + options.angleOffset);
    if (p.frameCount % focusIndex === (options.steps - n) % focusIndex) p.scale(1.2);
    p.rect(0, 0, 76, 14);
    p.pop();
  }
}

function drawSquare(p: p5, center: SimplePoint, size: number) {
  const delta = 6;
  p.push();
  p.translate(center.x, center.y);
  p.rotate(utils.randBetween(-delta, delta));
  p.shearX(utils.randBetween(-delta, delta));
  p.shearY(utils.randBetween(-delta, delta));
  p.rect(0, 0, size);
  p.pop();
}
function drawSquareCell(p: p5, x: number, y: number, cellSize: number) {
  const center: SimplePoint = { x: x + cellSize * 0.5, y: y + cellSize * 0.5 };
  const maxNumberOfSquares = 6;
  const numberOfSquares = utils.randBetween(0.5 * maxNumberOfSquares, maxNumberOfSquares);
  for (let n = 0; n < numberOfSquares; n++) {
    drawSquare(p, center, utils.randBetween(cellSize * 0.1, cellSize));
  }
}
function drawDesOrdres(p: p5, canvasSize: number, gridSize: number = 18) {
  const cellSize = canvasSize / gridSize;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      drawSquareCell(p, x * cellSize, y * cellSize, cellSize);
    }
  }
}

export const sketch = (p: p5) => {
  let isRecording = false;

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.RGB, 255);
    p.rectMode(p.CENTER);

    // Dependency: Statically added via HTML
    Math.seedrandom(PARAMS.seed);

    p.frameRate(FPS);

    if (!PARAMS.isAnimated) p.noLoop();
  };

  const mainColor = p.color("#B11F22");
  p.draw = () => {
    p.background("#F2F0EF");

    /**
     * Draw the background grid inspired by:
     * (Des)Ordres, 1974
     * Vera Molnár
     * https://dam.org/museum/artists_ui/artists/molnar-vera/des-ordres/
     */
    p.push();
    p.stroke(212);
    p.noFill();
    drawDesOrdres(p, p.width, 27);
    p.pop();

    /**
     * Draw the ring of rectangles inspired by:
     * Mouvement giratoire (rouge), 1959
     * Vera Molnár
     * https://ropac.net/artists/231-vera-molnar/works/12825-vera-molnar-mouvement-giratoire-rouge-1959/
     */
    const RADIUS = p.width * 0.4;
    const C: SimplePoint = { x: p.width * 0.5, y: p.height * 0.5 };

    drawRing(p, C, {
      color: mainColor,
      radius: RADIUS,
      steps: PARAMS.fps * 4,
      angleOffset: -18,
    });

    if (EXPORT_FRAMES) {
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

import * as p5 from "p5";
import { randBetween } from "./lib/fx-utils";

export type Range = { min: number; max: number };

export class NoiseMapper {
  private p5: p5;
  private xSrcRange: Range;
  private ySrcRange: Range;
  private xDestRange: Range;
  private yDestRange: Range;
  private xSrcSize: number;
  private ySrcSize: number;
  private xDestSize: number;
  private yDestSize: number;
  private z: number;

  constructor(p5: p5, sourceX: Range, sourceY: Range, destX: Range, destY: Range) {
    this.p5 = p5;
    this.xSrcRange = sourceX;
    this.ySrcRange = sourceY;
    this.xDestRange = destX;
    this.yDestRange = destY;
    this.xSrcSize = Math.abs(sourceX.max - sourceX.min);
    this.ySrcSize = Math.abs(sourceY.max - sourceY.min);
    this.xDestSize = Math.abs(destX.max - destX.min);
    this.yDestSize = Math.abs(destY.max - destY.min);
    this.z = 0;
  }

  getNoiseAt(srcX: number, srcY: number): number {
    const mapX = ((srcX - this.xSrcRange.min) / this.xSrcSize) * this.xDestSize + this.xDestRange.min;
    const mapY = ((srcY - this.ySrcRange.min) / this.ySrcSize) * this.yDestSize + this.yDestRange.min;

    return this.p5.noise(mapX, mapY, this.z);
  }
  setZ(newZ: number): void {
    this.z = newZ;
  }
  randomizeZ(min: number = 0, max: number = 20): void {
    this.z = randBetween(min, max);
  }
  updateZ(amount: number = 0.01): void {
    this.z += amount;
  }
}

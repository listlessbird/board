import { ControlPointManager } from "@/lib/canvas/control-points";
import { BaseObject } from "@/lib/canvas/objects/base";
import {
  Bounds,
  ControlPointType,
  Position,
  Transform,
  Transformable,
} from "@/types";

export class TextObject extends BaseObject implements Transformable {
  private controlPointManager: ControlPointManager;
  content: string;
  font: string;
  color: string;

  constructor(content: string, position: Position) {
    super("text", position);
    this.content = content;
    this.font = "20px Geist Mono";
    this.color = "#ffffff";
    this.controlPointManager = new ControlPointManager();
  }

  getTransform(): Transform {
    return {
      position: { ...this.transform.position },
      rotation: this.transform.rotation,
      scale: this.transform.scale,
    };
  }

  setTransform(transform: Transform): void {
    this.transform = {
      position: { ...transform.position },
      rotation: transform.rotation,
      scale: transform.scale,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.font = this.font;
    ctx.fillStyle = this.selected ? "#0066ff" : this.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(this.transform.position.x, this.transform.position.y);
    ctx.rotate(this.transform.rotation);
    ctx.scale(this.transform.scale, this.transform.scale);

    ctx.fillText(this.content, 0, 0);

    if (this.selected) {
      const bounds = this.getBounds();
      this.drawBoundingBox(ctx, bounds);
      this.controlPointManager.drawControlPoints(
        ctx,
        bounds,
        this.transform.scale
      );
      this.controlPointManager.drawRotationHandle(
        ctx,
        bounds,
        this.transform.scale
      );
    }

    ctx.restore();
  }

  private drawBoundingBox(ctx: CanvasRenderingContext2D, bounds: Bounds): void {
    ctx.strokeStyle = "#1a7fd4";
    ctx.lineWidth = 1 / this.transform.scale;
    ctx.beginPath();

    ctx.rect(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    );

    ctx.stroke();
  }

  getBounds(): Bounds {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = this.font;
    const metrics = ctx.measureText(this.content);

    const height =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const width = metrics.width;

    const padding = 20;

    return {
      left: -width / 2 - padding,
      right: width / 2 + padding,
      top: -height / 2 - padding,
      bottom: height / 2 + padding,
    };
  }

  containsPoint(point: Position): boolean {
    const local = this.transformPointToLocal(point);
    const bounds = this.getBounds();

    return (
      local.x >= bounds.left &&
      local.x <= bounds.right &&
      local.y >= bounds.top &&
      local.y <= bounds.bottom
    );
  }

  // transform point from global to local regardless of scale and rotation
  transformPointToLocal(point: Position): Position {
    const dx = point.x - this.transform.position.x;
    const dy = point.y - this.transform.position.y;

    // rotation

    const cos = Math.cos(-this.transform.rotation);
    const sin = Math.sin(-this.transform.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    return {
      x: rx / this.transform.scale,
      y: ry / this.transform.scale,
    };
  }

  getControlPointAtPosition(point: Position): ControlPointType {
    return this.controlPointManager.getControlPointAtPosition(
      point,
      this.getBounds(),
      this.transform.scale,
      (p) => this.transformPointToLocal(p)
    );
  }
}

import { BaseObject } from "@/lib/canvas/objects/base";
import { Bounds, Postition } from "@/types";

const CONTROL_POINT_SIZE = 10;
const ROTATION_HANDLE_OFFSET = 30;

export class TextObject extends BaseObject {
  content: string;
  font: string;
  color: string;

  constructor(content: string, position: Postition) {
    super("text", position);
    this.content = content;
    this.font = "20px Geist Mono";
    this.color = "#ffffff";
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

      this.drawControlPoints(ctx, bounds);
      this.drawRotationHandle(ctx, bounds);
    }

    ctx.restore();
  }

  private drawControlPoints(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds
  ): void {
    const points = this.getControlPoints(bounds);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#1a7fd4";
    ctx.lineWidth = 1 / this.transform.scale;

    points.forEach((p) => {
      ctx.beginPath();
      ctx.rect(
        p.x - CONTROL_POINT_SIZE / 2 / this.transform.scale,
        p.y - CONTROL_POINT_SIZE / 2 / this.transform.scale,
        CONTROL_POINT_SIZE / this.transform.scale,
        CONTROL_POINT_SIZE / this.transform.scale
      );
      ctx.fill();
      ctx.stroke();
    });
  }

  private drawRotationHandle(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds
  ): void {
    const centerX = 0;
    const centerY = bounds.top;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX,
      centerY - ROTATION_HANDLE_OFFSET / this.transform.scale
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY - ROTATION_HANDLE_OFFSET / this.transform.scale,
      CONTROL_POINT_SIZE / 2 / this.transform.scale,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
  }

  getControlPoints(bounds: Bounds): Postition[] {
    return [
      { x: bounds.left, y: bounds.top }, //Top Left
      { x: (bounds.left + bounds.right) / 2, y: bounds.top }, //Top Middle,
      { x: bounds.right, y: bounds.top }, // Top Right,
      // Middle Right
      { x: bounds.right, y: (bounds.top + bounds.bottom) / 2 },
      // bottom right
      { x: bounds.right, y: bounds.bottom },
      // bottom center
      { x: (bounds.left + bounds.right) / 2, y: bounds.bottom },
      // bottom left
      { x: bounds.left, y: bounds.bottom },
      // middle left
      { x: bounds.left, y: (bounds.top + bounds.bottom) / 2 },
    ];
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

  containsPoint(point: Postition): boolean {
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
  private transformPointToLocal(point: Postition): Postition {
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
}

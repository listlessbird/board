import { BaseObject } from "@/lib/canvas/objects/base";
import { Bounds, Postition } from "@/types";

export class TextObject extends BaseObject {
  content: string;
  font: string;
  color: string;

  constructor(content: string, position: Postition) {
    super("text", position);
    this.content = content;
    this.font = "20px Geist Mono";
    this.color = "#000000";
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
  }

  getBounds(): Bounds {
    const metrics = document
      .createElement("canvas")
      .getContext("2d")!
      .measureText(this.content);

    //   approx for now
    const height = 20;

    const width = metrics.width;

    return {
      top: -height / 2 - 5,
      right: -width / 2 + 5,
      bottom: height / 2 + 5,
      left: -width / 2 - 5,
    };
  }

  containsPoint(point: Postition): boolean {
    const bounds = this.getBounds();
    const local = {
      x: (point.x - this.transform.position.x) / this.transform.scale,
      y: (point.y - this.transform.position.y) / this.transform.scale,
    };

    return (
      local.x >= bounds.left &&
      local.x <= bounds.right &&
      local.y >= bounds.top &&
      local.y <= bounds.bottom
    );
  }
}

import {
  Bounds,
  CanvasObject,
  CanvasObjectType,
  Postition,
  Transform,
} from "@/types";

export abstract class BaseObject implements CanvasObject {
  id: string;
  type: CanvasObjectType;
  transform: Transform;
  selected: boolean;

  constructor(type: CanvasObjectType, position: Postition) {
    this.id = Date.now().toString();
    this.type = type;
    this.transform = {
      position,
      rotation: 0,
      scale: 1,
    };
    this.selected = false;
  }

  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract getBounds(): Bounds;
  abstract containsPoint(point: Postition): boolean;
}

import { BaseObject } from "@/lib/canvas/objects/base";
import { Postition } from "@/types";

export class TransformManager {
  private isDragging: boolean = false;
  private lastMousePos: Postition | null = null;

  startDrag(position: Postition): void {
    this.isDragging = true;
    this.lastMousePos = position;
  }
  endDrag(): void {
    this.isDragging = false;
    this.lastMousePos = null;
  }

  drag(object: BaseObject, currentPos: Postition): void {
    if (!this.isDragging || !this.lastMousePos) return;

    const dx = currentPos.x - this.lastMousePos.x;
    const dy = currentPos.y - this.lastMousePos.y;

    object.transform.position.x += dx;
    object.transform.position.y += dy;

    this.lastMousePos = currentPos;
  }
}

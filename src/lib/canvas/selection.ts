import { Position } from "@/types";
import { BaseObject } from "@/lib/canvas/objects/base";

export class SelectionManager {
  private selectedObjects: Set<BaseObject>;

  constructor() {
    this.selectedObjects = new Set();
  }

  handleClick(objects: BaseObject[], point: Position): BaseObject | null {
    // check from top to bottom
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.containsPoint(point)) {
        this.select(obj);
        return obj;
      }
    }

    this.clearSelection();
    return null;
  }

  select(object: BaseObject): void {
    this.clearSelection();
    object.selected = true;
    this.selectedObjects.add(object);
  }

  clearSelection(): void {
    this.selectedObjects.forEach((o) => (o.selected = false));
    this.selectedObjects.clear();
  }

  getSelectedObjects(): BaseObject[] {
    return Array.from(this.selectedObjects);
  }
}

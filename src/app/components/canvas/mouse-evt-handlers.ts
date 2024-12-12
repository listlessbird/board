import { BaseObject } from "@/lib/canvas/objects/base";
import { SelectionManager } from "@/lib/canvas/selection";
import { TransformManager } from "@/lib/canvas/transform";
import { Postition } from "@/types";
import React from "react";

export class MouseEvtHandlers {
  private canvasRef: React.RefObject<HTMLCanvasElement>;
  private SelectionManager: SelectionManager;
  private transformManager: TransformManager;
  private onObjectsChange: (objects: BaseObject[]) => void;

  constructor(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    SelectionManager: SelectionManager,
    transformManager: TransformManager,
    onObjectsChange: (objects: BaseObject[]) => void
  ) {
    this.canvasRef = canvasRef;
    this.SelectionManager = SelectionManager;
    this.transformManager = transformManager;
    this.onObjectsChange = onObjectsChange;
  }

  private getMousePos(e: React.MouseEvent): Postition {
    const rect = this.canvasRef.current!.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  handleMouseDown(e: React.MouseEvent, objects: BaseObject[]) {
    if (!this.canvasRef.current) return;

    const mousePos = this.getMousePos(e);
    const clickedObject = this.SelectionManager.handleClick(objects, mousePos);

    if (clickedObject) {
      this.transformManager.startDrag(mousePos);
      this.onObjectsChange([...objects]);
    }
  }

  handleMouseMove(e: React.MouseEvent, objects: BaseObject[]) {
    const selectedObjects = this.SelectionManager.getSelectedObjects();
    if (selectedObjects.length === 0) return;

    const mousePos = this.getMousePos(e);
    selectedObjects.forEach((o) => this.transformManager.drag(o, mousePos));

    this.onObjectsChange([...objects]);
  }

  handleMouseUp() {
    this.transformManager.endDrag();
  }

  handleMouseLeave = this.handleMouseUp;

  //   TODO: handle mouse wheel
}

import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { ControlPointType, Editable, Position, Transformable } from "@/types"
import React from "react"

export class MouseEvtHandlers {
  private canvas: React.RefObject<HTMLCanvasElement>
  private SelectionManager: SelectionManager
  private transformManager: TransformManager

  private setObjects: (objects: BaseObject[]) => void
  private activeObject: BaseObject | null = null
  private isHovering: boolean = false
  constructor(
    canvas: React.RefObject<HTMLCanvasElement>,
    SelectionManager: SelectionManager,
    transformManager: TransformManager,
    setObjects: (objects: BaseObject[]) => void
  ) {
    this.canvas = canvas
    this.SelectionManager = SelectionManager
    this.transformManager = transformManager
    this.setObjects = setObjects
  }

  handleMouseDown(e: React.MouseEvent, objects: BaseObject[]) {
    const pos = this.getMousePos(e)

    const selectedObject = this.SelectionManager.getSelectedObjects()[0]

    // control point interaction on selected object
    if (this.isTransformable(selectedObject)) {
      const controlPoint = selectedObject.getControlPointAtPosition(pos)

      if (controlPoint !== ControlPointType.None) {
        this.activeObject = selectedObject
        this.transformManager.startDrag(pos, controlPoint, selectedObject)
        return
      }
    }

    // regular click
    const clickedObject = this.SelectionManager.handleClick(objects, pos)
    if (clickedObject) {
      this.activeObject = clickedObject
      this.transformManager.startDrag(pos, ControlPointType.None, clickedObject)
    }
  }

  handleMouseMove(e: React.MouseEvent, objects: BaseObject[]): void {
    const pos = this.getMousePos(e)

    if (this.activeObject) {
      this.transformManager.drag(this.activeObject, pos)
      this.setObjects([...objects])
      return
    }

    const selected = this.SelectionManager.getSelectedObjects()[0]
    let cursorStyle = "default"

    if (this.isTransformable(selected)) {
      if (selected.containsPoint(pos)) {
        this.isHovering = true
        const controlPoint = selected.getControlPointAtPosition(pos)
        cursorStyle = this.transformManager.getCursorStyle(controlPoint)
      } else {
        this.isHovering = false
      }
    } else {
      for (let i = objects.length - 1; i >= 0; i--) {
        if (objects[i].containsPoint(pos)) {
          cursorStyle = "pointer"
          this.isHovering = true
          break
        }
      }
    }

    this.canvas.current!.style.cursor = cursorStyle
  }

  handleMouseUp() {
    this.activeObject = null
    this.transformManager.endDrag()
    this.updateCursor()
  }

  handleMouseLeave() {
    this.isHovering = false
    this.handleMouseUp()
  }

  handleDoubleClick(e: React.MouseEvent, objects: BaseObject[]): void {
    const pos = this.getMousePos(e)

    const selected = this.SelectionManager.getSelectedObjects()[0]

    if (selected && "isEditing" in selected) {
      const editable = selected as unknown as Editable
      if (editable.isEditing) return

      editable.startEditing()
    }
  }

  //   TODO: handle mouse wheel

  private getMousePos(e: React.MouseEvent): Position {
    const rect = this.canvas.current!.getBoundingClientRect()
    const scaleX = this.canvas.current!.width / rect.width
    const scaleY = this.canvas.current!.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  private isTransformable(object: any): object is Transformable {
    return object && "getControlPointAtPosition" in object
  }

  private updateCursor() {
    this.canvas.current!.style.cursor = this.isHovering ? "pointer" : "default"
  }
}

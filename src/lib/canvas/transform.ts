import { ControlPointManager } from "@/lib/canvas/control-points"
import { BaseObject } from "@/lib/canvas/objects/base"
import { ControlPointType, Position, Transform } from "@/types"

export class TransformManager {
  private isDragging: boolean = false
  private lastMousePos: Position | null = null
  private activeControlPoint: ControlPointType = ControlPointType.None
  private initialTransform: Transform | null = null
  private initialAngle: number | null = null
  private initialDistance: number | null = null
  private controlPointManager: ControlPointManager

  constructor() {
    this.controlPointManager = new ControlPointManager()
  }

  startDrag(
    position: Position,
    controlPoint: ControlPointType,
    object: BaseObject
  ): void {
    this.isDragging = true
    this.lastMousePos = position
    this.activeControlPoint = controlPoint
    this.initialTransform = {
      position: { ...object.transform.position },
      rotation: object.transform.rotation,
      scale: object.transform.scale,
      isFlipped: object.transform.isFlipped,
    }

    if (this.isScaleHandle(controlPoint)) {
      const center = object.transform.position
      this.initialDistance = this.getDistance(center, position)
    }

    if (controlPoint === ControlPointType.Rotation) {
      const center = object.transform.position
      this.initialAngle = this.getAngle(center, position)
    }
  }

  drag(object: BaseObject, currentPos: Position): void {
    if (!this.isDragging || !this.lastMousePos || !this.initialTransform) return

    switch (this.activeControlPoint) {
      case ControlPointType.None:
        this.handleMove(object, currentPos)
        break
      case ControlPointType.Rotation:
        this.handleRotation(object, currentPos)
        break
      case ControlPointType.MiddleLeft:
      case ControlPointType.MiddleRight:
        this.handleFlip(object, currentPos)
        break

      default:
        if (this.isScaleHandle(this.activeControlPoint)) {
          this.handleScale(object, currentPos)
        }
    }

    this.lastMousePos = currentPos
  }

  endDrag(): void {
    this.isDragging = false
    this.lastMousePos = null
    this.activeControlPoint = ControlPointType.None
    this.initialTransform = null
    this.initialAngle = null
    this.initialDistance = null
  }

  private handleMove(object: BaseObject, currentPos: Position): void {
    const dx = currentPos.x - this.lastMousePos!.x
    const dy = currentPos.y - this.lastMousePos!.y

    object.transform.position.x += dx
    object.transform.position.y += dy
  }

  private handleRotation(object: BaseObject, currentPos: Position): void {
    if (!this.initialAngle) return

    const center = object.transform.position
    const currentAngle = this.getAngle(center, currentPos)
    let deltaAngle = currentAngle - this.initialAngle

    // limit angle to -pi to pi
    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI

    const smoothing = 0.5
    object.transform.rotation +=
      this.initialTransform!.rotation + deltaAngle * smoothing
  }

  private handleFlip(object: BaseObject, currentPos: Position): void {
    if (!this.initialTransform || !this.lastMousePos) return

    const center = object.transform.position

    const isHorizontalControl =
      this.activeControlPoint === ControlPointType.MiddleLeft ||
      this.activeControlPoint === ControlPointType.MiddleRight

    if (!isHorizontalControl) return

    const initDir = this.lastMousePos.x - center.x
    const currentDir = currentPos.x - center.x

    if (Math.sign(initDir) !== Math.sign(currentDir)) {
      object.transform.isFlipped = !object.transform.isFlipped
    }
  }

  private handleScale(object: BaseObject, currentPos: Position): void {
    if (!this.initialDistance) return

    const center = object.transform.position
    const currentDistance = this.getDistance(center, currentPos)
    const factor = currentDistance / this.initialDistance

    object.transform.scale = this.initialTransform!.scale * factor
    object.transform.scale = Math.max(0.1, Math.min(5, object.transform.scale))
  }

  private getDistance(p1: Position, p2: Position): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getAngle(center: Position, point: Position): number {
    return Math.atan2(point.y - center.y, point.x - center.x)
  }

  private isScaleHandle(controlPoint: ControlPointType): boolean {
    return (
      controlPoint >= ControlPointType.TopLeft &&
      controlPoint <= ControlPointType.MiddleLeft
    )
  }

  getCursorStyle(controlPoint: ControlPointType): string {
    return this.controlPointManager.getCursorStyle(controlPoint)
  }
}

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
  private rafId: number | null = null
  private renderCallback: (() => void) | null = null
  private onTransformEnd: (() => void) | null = null
  constructor() {
    this.controlPointManager = new ControlPointManager()
  }

  startDrag(
    position: Position,
    controlPoint: ControlPointType,
    object: BaseObject
  ): void {
    console.debug("[TransformManager] Starting drag:", {
      position,
      controlPoint,
      objectId: object.id,
      objectType: object.type,
    })
    this.isDragging = true
    this.lastMousePos = position
    this.activeControlPoint = controlPoint
    this.initialTransform = { ...object.transform }

    if (this.isScaleHandle(controlPoint)) {
      const center = object.transform.position
      this.initialDistance = this.getDistance(center, position)
    }

    if (controlPoint === ControlPointType.Rotation) {
      const center = object.transform.position
      this.initialAngle = this.getAngle(center, position)
    }

    this.requestRender()
  }

  drag(object: BaseObject, currentPos: Position): void {
    if (!this.isDragging || !this.lastMousePos || !this.initialTransform) {
      console.debug("[TransformManager] Drag stopped - not dragging")
      return
    }

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
    this.requestRender()
  }

  endDrag(): void {
    this.cancelRender()

    if (this.isDragging && this.onTransformEnd) {
      this.onTransformEnd()
    }

    this.isDragging = false
    this.lastMousePos = null
    this.activeControlPoint = ControlPointType.None
    this.initialTransform = null
    this.initialAngle = null
    this.initialDistance = null
  }

  setCallbacks(callbacks: {
    onRender: () => void
    onTransformEnd: () => void
  }) {
    this.renderCallback = callbacks.onRender
    this.onTransformEnd = callbacks.onTransformEnd
  }

  private handleMove(object: BaseObject, currentPos: Position): void {
    const dx = currentPos.x - this.lastMousePos!.x
    const dy = currentPos.y - this.lastMousePos!.y

    console.debug("[TransformManager] Moving object:", {
      dx,
      dy,
      objectId: object.id,
      currentPos,
      lastPos: this.lastMousePos,
    })

    object.transform.position.x += dx
    object.transform.position.y += dy
  }

  private requestRender(): void {
    if (this.renderCallback) {
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.rafId = requestAnimationFrame(this.renderCallback)
    }
  }

  private cancelRender(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
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
    object.transform.rotation =
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

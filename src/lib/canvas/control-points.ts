import { ScreenSpaceSystem } from "./core/screen-space"
import {
  Bounds,
  Camera,
  ControlPointStyle,
  ControlPointType,
  Position,
  Transform,
} from "@/types"
import { CANVAS_STYLE } from "@/lib/canvas/style"

export class ControlPointManager {
  private style: ControlPointStyle = {
    size: CANVAS_STYLE.controlPoint.controlPointSize,
    fillStyle: CANVAS_STYLE.controlPoint.fillStyle,
    strokeStyle: CANVAS_STYLE.controlPoint.strokeStyle,
    lineWidth: CANVAS_STYLE.controlPoint.lineWidth,
  }

  private rotationHandleOffset = 20
  private screenSpace: ScreenSpaceSystem

  constructor(customStyle?: Partial<ControlPointStyle>) {
    this.style = { ...this.style, ...customStyle }
    this.screenSpace = new ScreenSpaceSystem()
  }

  drawControlPoints(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): void {
    // Draw in local space - this is correct
    const points = this.getLocalControlPoints(bounds)
    const screenSize = this.style.size / transform.scale.x

    ctx.fillStyle = this.style.fillStyle
    ctx.strokeStyle = this.style.strokeStyle
    ctx.lineWidth = this.style.lineWidth / transform.scale.y

    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, screenSize / 2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    })
  }

  drawRotationHandle(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): void {
    const centerX = (bounds.left + bounds.right) / 2
    const offset = this.rotationHandleOffset / transform.scale.y
    const screenSize = this.style.size / transform.scale.x

    ctx.strokeStyle = this.style.strokeStyle
    ctx.fillStyle = this.style.fillStyle
    ctx.lineWidth = this.style.lineWidth / transform.scale.y

    ctx.beginPath()
    ctx.moveTo(centerX, bounds.top)
    ctx.lineTo(centerX, bounds.top - offset)
    ctx.stroke()

    const handleY = bounds.top - offset
    ctx.beginPath()
    ctx.arc(centerX, handleY, screenSize / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }

  getControlPointAtPosition(
    screenPoint: Position,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): ControlPointType {
    // Convert screen point to local object space before hit testing
    const localPoint = this.screenSpace.screenToLocalSpace(
      screenPoint,
      transform,
      camera
    )

    // Hit test radius should scale with transform
    const hitRadius = (this.style.size * 2) / (transform.scale.y * camera.zoom)

    // Test rotation handle first
    const centerX = (bounds.left + bounds.right) / 2
    const handleY = bounds.top - this.rotationHandleOffset / transform.scale.y

    // Check rotation handle
    if (this.getDistance(localPoint, { x: centerX, y: handleY }) <= hitRadius) {
      return ControlPointType.Rotation
    }

    // Get control points in local space
    const points = this.getLocalControlPoints(bounds)

    // Find the first point within hit radius
    const hitIndex = points.findIndex(
      (p) => this.getDistance(localPoint, p) <= hitRadius
    )

    return hitIndex >= 0 ? hitIndex : ControlPointType.None
  }

  private getLocalControlPoints(bounds: Bounds): Position[] {
    const { left, right, top, bottom } = bounds
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2

    return [
      { x: left, y: top }, // TopLeft
      { x: centerX, y: top }, // TopCenter
      { x: right, y: top }, // TopRight
      { x: right, y: centerY }, // MiddleRight
      { x: right, y: bottom }, // BottomRight
      { x: centerX, y: bottom }, // BottomCenter
      { x: left, y: bottom }, // BottomLeft
      { x: left, y: centerY }, // MiddleLeft
    ]
  }

  private getDistance(p1: Position, p2: Position): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  getCursorStyle(controlPoint: ControlPointType): string {
    switch (controlPoint) {
      case ControlPointType.TopLeft:
      case ControlPointType.BottomRight:
        return "nwse-resize"
      case ControlPointType.TopRight:
      case ControlPointType.BottomLeft:
        return "nesw-resize"
      case ControlPointType.TopCenter:
      case ControlPointType.BottomCenter:
        return "ns-resize"
      case ControlPointType.MiddleLeft:
      case ControlPointType.MiddleRight:
        return "ew-resize"
      case ControlPointType.Rotation:
        return "grab"
      default:
        return "default"
    }
  }
}

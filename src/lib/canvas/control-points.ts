import { ScreenSpaceSystem } from "./core/screen-space"
import {
  Bounds,
  Camera,
  ControlPointStyle,
  ControlPointType,
  Position,
  Transform,
} from "@/types"

export class ControlPointManager {
  private style: ControlPointStyle = {
    size: 10,
    fillStyle: "#ffffff",
    strokeStyle: "#1a7fd4",
    lineWidth: 1,
  }

  private rotationHandleOffset = 20
  private screenSpace: ScreenSpaceSystem

  constructor(customStyle?: Partial<ControlPointStyle>) {
    this.style = { ...this.style, ...customStyle }
    this.screenSpace = new ScreenSpaceSystem()
  }

  /**
   * Get control point positions in local object space
   */
  private getLocalControlPoints(bounds: Bounds): Position[] {
    const { left, right, top, bottom } = bounds
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2

    // Return points in local space, matching ControlPointType enum order
    return [
      { x: left, y: top }, // TopLeft = 0
      { x: centerX, y: top }, // TopCenter = 1
      { x: right, y: top }, // TopRight = 2
      { x: right, y: centerY }, // MiddleRight = 3
      { x: right, y: bottom }, // BottomRight = 4
      { x: centerX, y: bottom }, // BottomCenter = 5
      { x: left, y: bottom }, // BottomLeft = 6
      { x: left, y: centerY }, // MiddleLeft = 7
    ]
  }

  /**
   * Draw control points directly in object space
   */
  drawControlPoints(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): void {
    const points = this.getLocalControlPoints(bounds)
    const screenSize = this.style.size / transform.scale

    ctx.fillStyle = this.style.fillStyle
    ctx.strokeStyle = this.style.strokeStyle
    ctx.lineWidth = this.style.lineWidth / transform.scale

    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, screenSize / 2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    })
  }

  /**
   * Draw rotation handle in object space
   */
  drawRotationHandle(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): void {
    const { left, right, top } = bounds
    const screenSize = this.style.size / transform.scale
    const offset = this.rotationHandleOffset / transform.scale

    const centerX = (left + right) / 2

    ctx.strokeStyle = this.style.strokeStyle
    ctx.fillStyle = this.style.fillStyle
    ctx.lineWidth = this.style.lineWidth / transform.scale

    // Draw connecting line
    ctx.beginPath()
    ctx.moveTo(centerX, top)
    ctx.lineTo(centerX, top - offset)
    ctx.stroke()

    // Draw handle circle
    const handleY = top - offset

    ctx.beginPath()
    ctx.arc(centerX, handleY, screenSize / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Draw rotation indicator
    const indicatorSize = screenSize / 3
    ctx.beginPath()
    ctx.arc(
      centerX,
      handleY,
      indicatorSize,
      -Math.PI * 0.75,
      Math.PI * 0.75,
      false
    )
    ctx.stroke()

    // Add arrow
    const arrowSize = screenSize / 4
    ctx.beginPath()
    ctx.moveTo(centerX + arrowSize, handleY)
    ctx.lineTo(centerX, handleY - arrowSize)
    ctx.lineTo(centerX - arrowSize, handleY)
    ctx.stroke()
  }

  /**
   * Check if screen point hits a control point
   */
  getControlPointAtPosition(
    screenPoint: Position,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): ControlPointType {
    // Convert screen point to local object space
    const localPoint = this.screenSpace.screenToLocalSpace(
      screenPoint,
      transform,
      camera
    )
    const threshold = (this.style.size * 2) / transform.scale

    // Check rotation handle first
    const centerX = (bounds.left + bounds.right) / 2
    const handleY = bounds.top - this.rotationHandleOffset / transform.scale

    if (
      this.isPointNearPosition(
        localPoint,
        { x: centerX, y: handleY },
        threshold
      )
    ) {
      return ControlPointType.Rotation
    }

    // Check other control points in local space
    const controlPoints = this.getLocalControlPoints(bounds)
    const hitPoint = controlPoints.findIndex((cp) =>
      this.isPointNearPosition(localPoint, cp, threshold)
    )

    return hitPoint >= 0 ? hitPoint : ControlPointType.None
  }

  /**
   * Test if a point is near a position in the same coordinate space
   */
  private isPointNearPosition(
    point: Position,
    position: Position,
    threshold: number
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(point.x - position.x, 2) + Math.pow(point.y - position.y, 2)
    )
    return distance < threshold
  }

  /**
   * Get appropriate cursor style for control point
   */
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

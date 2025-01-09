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
   * Get control point positions in screen space
   */
  getControlPoints(
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): Position[] {
    const screenBounds = this.screenSpace.getScreenBounds(
      bounds,
      transform,
      camera
    )
    const { left, right, top, bottom } = screenBounds
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2

    // Return points in order matching ControlPointType enum
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
   * Draw control points in screen space
   */
  drawControlPoints(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): void {
    const points = this.getControlPoints(bounds, transform, camera)
    const screenSize = this.style.size / camera.zoom

    ctx.save()
    ctx.fillStyle = this.style.fillStyle
    ctx.strokeStyle = this.style.strokeStyle
    ctx.lineWidth = this.style.lineWidth / camera.zoom

    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, screenSize / 2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    })

    ctx.restore()
  }

  /**
   * Draw rotation handle in screen space
   */
  drawRotationHandle(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): void {
    const screenBounds = this.screenSpace.getScreenBounds(
      bounds,
      transform,
      camera
    )
    const screenSize = this.style.size / camera.zoom
    const offset = this.rotationHandleOffset / camera.zoom

    ctx.save()
    ctx.strokeStyle = this.style.strokeStyle
    ctx.fillStyle = this.style.fillStyle
    ctx.lineWidth = this.style.lineWidth / camera.zoom

    // Draw connecting line
    const centerX =
      screenBounds.left + (screenBounds.right - screenBounds.left) / 2
    ctx.beginPath()
    ctx.moveTo(centerX, screenBounds.top)
    ctx.lineTo(centerX, screenBounds.top - offset)
    ctx.stroke()

    // Draw handle circle
    const handleY = screenBounds.top - offset

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

    ctx.restore()
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
    const threshold = (this.style.size * 2) / camera.zoom

    // Check rotation handle first
    const screenBounds = this.screenSpace.getScreenBounds(
      bounds,
      transform,
      camera
    )
    const handleX =
      screenBounds.left + (screenBounds.right - screenBounds.left) / 2
    const handleY = screenBounds.top - this.rotationHandleOffset / camera.zoom

    if (
      this.isPointNearPosition(
        screenPoint,
        { x: handleX, y: handleY },
        threshold
      )
    ) {
      return ControlPointType.Rotation
    }

    // Check other control points
    const controlPoints = this.getControlPoints(bounds, transform, camera)
    const hitPoint = controlPoints.findIndex((cp) =>
      this.isPointNearPosition(screenPoint, cp, threshold)
    )

    return hitPoint >= 0 ? hitPoint : ControlPointType.None
  }

  /**
   * Test if a point is near a position in screen space
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

import { Bounds, ControlPointStyle, ControlPointType, Position } from "@/types"

export class ControlPointManager {
  private style: ControlPointStyle = {
    size: 10,
    fillStyle: "#ffffff",
    strokeStyle: "#1a7fd4",
    lineWidth: 1,
  }

  private rotationHandleOffset = 20

  constructor(customStyle?: Partial<ControlPointStyle>) {
    this.style = { ...this.style, ...customStyle }
  }

  drawControlPoints(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    scale: number
  ): void {
    const points = this.getControlPoints(bounds)
    const absScale = Math.abs(scale)

    ctx.save()
    ctx.fillStyle = this.style.fillStyle
    ctx.strokeStyle = this.style.strokeStyle
    ctx.lineWidth = this.style.lineWidth / absScale

    points.forEach((p) => {
      ctx.beginPath()
      ctx.rect(
        p.x - this.style.size / 2 / absScale,
        p.y - this.style.size / 2 / absScale,
        this.style.size / absScale,
        this.style.size / absScale
      )
      ctx.fill()
      ctx.stroke()
    })

    ctx.restore()
  }

  drawRotationHandle(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    scale: number
  ): void {
    const absScale = Math.abs(scale)

    ctx.save()
    ctx.strokeStyle = this.style.strokeStyle
    ctx.fillStyle = this.style.fillStyle
    ctx.lineWidth = this.style.lineWidth / absScale

    const centerY = bounds.top

    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(0, centerY - this.rotationHandleOffset / absScale)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
      0,
      centerY - this.rotationHandleOffset / absScale,
      this.style.size / 2 / absScale,
      0,
      2 * Math.PI
    )
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }

  getControlPoints(bounds: Bounds): Position[] {
    return [
      { x: bounds.left, y: bounds.top }, // TopLeft
      { x: (bounds.left + bounds.right) / 2, y: bounds.top }, // TopCenter
      { x: bounds.right, y: bounds.top }, // TopRight
      { x: bounds.right, y: (bounds.top + bounds.bottom) / 2 }, // MiddleRight
      { x: bounds.right, y: bounds.bottom }, // BottomRight
      { x: (bounds.left + bounds.right) / 2, y: bounds.bottom }, // BottomCenter
      { x: bounds.left, y: bounds.bottom }, // BottomLeft
      { x: bounds.left, y: (bounds.top + bounds.bottom) / 2 }, // MiddleLeft
    ]
  }
  getControlPointAtPosition(
    point: Position,
    bounds: Bounds,
    scale: number,
    transform: (point: Position) => Position
  ): ControlPointType {
    const localPoint = transform(point)

    // rotation handle
    const rotationPoint = {
      x: 0,
      y: bounds.top - this.rotationHandleOffset / scale,
    }

    if (this.isPointNearPosition(localPoint, rotationPoint, scale)) {
      return ControlPointType.Rotation
    }

    const controlPoints = this.getControlPoints(bounds)
    for (let i = 0; i < controlPoints.length; i++) {
      if (this.isPointNearPosition(localPoint, controlPoints[i], scale)) {
        return i
      }
    }

    return ControlPointType.None
  }

  //   hitbox
  private isPointNearPosition(
    point: Position,
    position: Position,
    scale: number
  ): boolean {
    const threshold = this.style.size / scale

    return (
      Math.abs(point.x - position.x) < threshold / 2 &&
      Math.abs(point.y - position.y) < threshold / 2
    )
  }

  getCursorStyle(controlPoint: ControlPointType): string {
    switch (controlPoint) {
      case ControlPointType.TopLeft:
      case ControlPointType.BottomLeft:
        return "nw-resize"
      case ControlPointType.TopRight:
      case ControlPointType.BottomLeft:
        return "ne-resize"
      case ControlPointType.TopCenter:
      case ControlPointType.BottomCenter:
        return "ns-resize"
      case ControlPointType.MiddleLeft:
      case ControlPointType.MiddleRight:
        return "ew-resize"
      case ControlPointType.Rotation:
        return "grab"
      default:
        return "move"
    }
  }
}

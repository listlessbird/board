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
    scale: number,
    isFlipped: boolean = false
  ): void {
    const points = this.getControlPoints(bounds)
    const absScale = Math.abs(scale)

    ctx.save()
    ctx.fillStyle = this.style.fillStyle
    ctx.strokeStyle = this.style.strokeStyle
    ctx.lineWidth = this.style.lineWidth / absScale

    if (isFlipped) {
      points.reverse()
      ctx.scale(-1, 1)
    }

    const size = this.style.size / absScale

    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, size / 2, 0, 2 * Math.PI)
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

    console.debug("[ControlPointManager] Control point check:", {
      point,
      localPoint,
      scale,
      bounds,
      threshold: (this.style.size + 4) / Math.abs(scale),
    })

    // rotation handle
    const rotationPoint = {
      x: 0,
      y: bounds.top - this.rotationHandleOffset / Math.abs(scale),
    }

    if (this.isPointNearPosition(localPoint, rotationPoint, scale)) {
      return ControlPointType.Rotation
    }

    const controlPoints = this.getControlPoints(bounds)

    const padding = 2
    const threshold = ((this.style.size + 8) * padding) / Math.abs(scale)

    for (let i = 0; i < controlPoints.length; i++) {
      const cp = controlPoints[i]

      const distance = Math.sqrt(
        Math.pow(localPoint.x - cp.x, 2) + Math.pow(localPoint.y - cp.y, 2)
      )

      console.debug("[ControlPointManager] Testing control point:", {
        index: i,
        position: cp,
        distance,
        threshold,
        hit: distance < threshold,
      })

      if (distance < threshold) {
        console.debug("[ControlPointManager] Hit control point:", {
          index: i,
          position: cp,
          distance,
          threshold,
        })
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
    const threshold = (this.style.size + 8) / Math.abs(scale)

    const distance = Math.sqrt(
      Math.pow(point.x - position.x, 2) + Math.pow(point.y - position.y, 2)
    )

    return distance < threshold
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

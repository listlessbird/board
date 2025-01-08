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

  /**
   * Gets ordered control points matching ControlPointType enum order
   * @param bounds Object bounds
   * @returns Array of control point positions in enum order
   */
  getControlPoints(bounds: Bounds): Position[] {
    const { left, right, top, bottom } = bounds
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2

    // Order MUST match ControlPointType enum
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

  drawControlPoints(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    objectScale: number,
    cameraZoom: number,
    isFlipped: boolean = false
  ): void {
    const points = this.getControlPoints(bounds)
    const absScale = Math.abs(objectScale)

    const effectiveScale = absScale * cameraZoom

    ctx.save()
    ctx.fillStyle = this.style.fillStyle
    ctx.strokeStyle = this.style.strokeStyle
    ctx.lineWidth = this.style.lineWidth / effectiveScale

    const size = this.style.size / effectiveScale

    points.forEach((p, index) => {
      ctx.beginPath()
      ctx.arc(isFlipped ? -p.x : p.x, p.y, size / 2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    })

    ctx.restore()
  }

  drawRotationHandle(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    objectScale: number,
    cameraZoom: number
  ): void {
    const effectiveScale = Math.abs(objectScale) * cameraZoom
    const size = this.style.size / effectiveScale
    const offset = this.rotationHandleOffset / effectiveScale

    ctx.save()
    ctx.strokeStyle = this.style.strokeStyle
    ctx.fillStyle = this.style.fillStyle
    ctx.lineWidth = this.style.lineWidth / effectiveScale

    // Draw connecting line
    ctx.beginPath()
    ctx.moveTo(0, bounds.top)
    ctx.lineTo(0, bounds.top - offset)
    ctx.stroke()

    // Draw handle circle
    ctx.beginPath()
    ctx.arc(0, bounds.top - offset, size / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Optional: Draw rotation indicator lines for better UX
    const indicatorSize = size / 3
    ctx.beginPath()
    ctx.arc(
      0,
      bounds.top - offset,
      indicatorSize,
      -Math.PI * 0.75, // Start at 10:30 position
      Math.PI * 0.75, // End at 1:30 position
      false
    )
    ctx.stroke()

    // Add small arrow at the end
    const arrowSize = size / 4
    ctx.beginPath()
    ctx.moveTo(arrowSize, bounds.top - offset)
    ctx.lineTo(0, bounds.top - offset - arrowSize)
    ctx.lineTo(-arrowSize, bounds.top - offset)
    ctx.stroke()

    ctx.restore()
  }

  /**
   * Checks if a point is near a control point
   * @param point Point to test
   * @param bounds Object bounds
   * @param objectScale Current scale
   * @param transform Transform function to convert global to local coords
   */
  getControlPointAtPosition(
    point: Position,
    bounds: Bounds,
    objectScale: number,
    cameraZoom: number,
    transform: (point: Position) => Position
  ): ControlPointType {
    console.log("ControlPointManager.getControlPointAtPosition", { cameraZoom })
    const localPoint = transform(point)
    const effectiveScale = Math.abs(objectScale) * cameraZoom

    // Check rotation handle first
    const rotationPoint = {
      x: 0,
      y: bounds.top - this.rotationHandleOffset / effectiveScale,
    }

    if (this.isPointNearPosition(localPoint, rotationPoint, objectScale)) {
      return ControlPointType.Rotation
    }

    // Get control points in enum order
    const controlPoints = this.getControlPoints(bounds)

    // Larger hit area for easier selection
    const threshold = (this.style.size * 2) / effectiveScale

    // Debug info for hit testing
    const hitTestResults = controlPoints.map((cp, index) => {
      const distance = Math.sqrt(
        Math.pow(localPoint.x - cp.x, 2) + Math.pow(localPoint.y - cp.y, 2)
      )
      return { index, distance, threshold, hit: distance < threshold }
    })

    console.debug("[ControlPointManager] Hit test results:", {
      localPoint,
      scale: effectiveScale,
      threshold,
      results: hitTestResults,
    })

    // Find closest point within threshold
    const hit = hitTestResults
      .filter((r) => r.hit)
      .sort((a, b) => a.distance - b.distance)[0]

    return hit ? hit.index : ControlPointType.None
  }

  private isPointNearPosition(
    point: Position,
    position: Position,
    effectiveScale: number
  ): boolean {
    const threshold = (this.style.size * 2) / Math.abs(effectiveScale)
    const distance = Math.sqrt(
      Math.pow(point.x - position.x, 2) + Math.pow(point.y - position.y, 2)
    )
    return distance < threshold
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
        return "move"
    }
  }
}

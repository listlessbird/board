import { CoordinateSystem } from "@/lib/canvas/core/coordinate-system"
import { CANVAS_STYLE } from "@/lib/canvas/style"
import { Camera, GridOptions, ViewPortBounds } from "@/types"

export class InfiniteGrid {
  private coordinateSystem: CoordinateSystem
  private baseGridSize: number
  private primaryInterval: number
  private secondaryInterval: number
  private primaryColor: string
  private secondaryColor: string
  private axisColor: string

  constructor(options: GridOptions = {}) {
    this.coordinateSystem = new CoordinateSystem()
    this.baseGridSize = options.baseGridSize ?? CANVAS_STYLE.baseGridSize
    this.primaryInterval =
      options.primaryInterval ?? CANVAS_STYLE.primaryInterval
    this.secondaryInterval =
      options.secondaryInterval ?? CANVAS_STYLE.secondaryInterval
    this.primaryColor = options.primaryColor ?? CANVAS_STYLE.primaryColor
    this.secondaryColor = options.secondaryColor ?? CANVAS_STYLE.secondaryColor
    this.axisColor = options.axisColor ?? CANVAS_STYLE.axisColor
  }

  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    bounds: ViewPortBounds
  ): void {
    const gridSize = this.coordinateSystem.getGridCellSize(
      camera.zoom,
      this.baseGridSize
    )

    const startX = Math.floor(bounds.left / gridSize) * gridSize
    const startY = Math.floor(bounds.top / gridSize) * gridSize
    const endX = Math.ceil(bounds.right / gridSize) * gridSize
    const endY = Math.ceil(bounds.bottom / gridSize) * gridSize

    ctx.save()

    const lineWidth = 1 / camera.zoom

    // secondary
    this.drawGridLines(
      ctx,
      startX,
      startY,
      endX,
      endY,
      gridSize / this.secondaryInterval,
      this.secondaryColor,
      lineWidth
    )

    // primary
    this.drawGridLines(
      ctx,
      startX,
      startY,
      endX,
      endY,
      gridSize / this.primaryInterval,
      this.primaryColor,
      lineWidth
    )

    this.drawAxes(ctx, bounds, this.axisColor, lineWidth * 2)

    ctx.restore()
  }

  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    spacing: number,
    color: string,
    lineWidth: number
  ): void {
    ctx.beginPath()

    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth

    for (let x = startX; x <= endX; x += spacing) {
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
    }

    for (let y = startY; y <= endY; y += spacing) {
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
    }

    ctx.stroke()
  }

  private drawAxes(
    ctx: CanvasRenderingContext2D,
    bounds: ViewPortBounds,
    color: string,
    lineWidth: number
  ): void {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth

    if (bounds.left <= 0 && bounds.right >= 0) {
      ctx.moveTo(0, bounds.top)
      ctx.lineTo(0, bounds.bottom)
    }

    if (bounds.top <= 0 && bounds.bottom >= 0) {
      ctx.moveTo(bounds.left, 0)
      ctx.lineTo(bounds.right, 0)
    }

    ctx.stroke()
  }
}

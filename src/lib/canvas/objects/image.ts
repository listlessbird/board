import { ControlPointManager } from "@/lib/canvas/control-points"
import { BaseObject } from "@/lib/canvas/objects/base"
import { Bounds, ControlPointType, Position } from "@/types"

export class ImageObject extends BaseObject {
  private image: HTMLImageElement
  private isLoaded: boolean = false
  private natWidth: number = 0
  private natHeight: number = 0
  private controlPointManager: ControlPointManager

  constructor(source: string, position: Position, onLoad?: () => void) {
    super("image", position)
    this.controlPointManager = new ControlPointManager()
    this.image = new Image()

    this.image.onload = () => {
      this.isLoaded = true
      this.natHeight = this.image.naturalHeight
      this.natWidth = this.image.naturalWidth
      onLoad?.()
    }

    this.image.src = source
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded) return

    ctx.save()
    ctx.translate(this.transform.position.x, this.transform.position.y)
    ctx.rotate(this.transform.rotation)
    ctx.scale(
      this.transform.scale * (this.transform.isFlipped ? -1 : 1),
      this.transform.scale
    )

    ctx.drawImage(
      this.image,
      -this.natWidth / 2,
      -this.natHeight / 2,
      this.natWidth,
      this.natHeight
    )

    if (this.selected) {
      const bounds = this.getBounds()
      this.drawBoundingBox(ctx, bounds)
      this.controlPointManager.drawControlPoints(
        ctx,
        bounds,
        this.transform.scale,
        this.transform.isFlipped
      )

      this.controlPointManager.drawRotationHandle(
        ctx,
        bounds,
        this.transform.scale
      )
    }

    ctx.restore()
  }

  private drawBoundingBox(ctx: CanvasRenderingContext2D, bounds: Bounds): void {
    ctx.strokeStyle = "#1a7fd4"
    ctx.lineWidth = 1 / this.transform.scale
    ctx.beginPath()
    ctx.rect(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    )
    ctx.stroke()
  }

  getBounds(): Bounds {
    const padding = this.transform.scale * 10
    const width = this.natWidth
    const height = this.natHeight

    return {
      left: -width / 2 - padding,
      right: width / 2 + padding,
      top: -height / 2 - padding,
      bottom: height / 2 + padding,
    }
  }

  containsPoint(point: Position): boolean {
    const local = this.transformPointToLocal(point)
    const bounds = this.getBounds()

    return (
      local.x >= bounds.left &&
      local.x <= bounds.right &&
      local.y >= bounds.top &&
      local.y <= bounds.bottom
    )
  }

  transformPointToLocal(point: Position): Position {
    const dx = point.x - this.transform.position.x
    const dy = point.y - this.transform.position.y

    const cos = Math.cos(-this.transform.rotation)
    const sin = Math.sin(-this.transform.rotation)
    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos

    const scaleX = this.transform.scale * (this.transform.isFlipped ? -1 : 1)
    const scaleY = this.transform.scale

    return {
      x: rx / scaleX,
      y: ry / scaleY,
    }
  }

  getControlPointAtPosition(point: Position): ControlPointType {
    return this.controlPointManager.getControlPointAtPosition(
      point,
      this.getBounds(),
      this.transform.scale,
      (p) => this.transformPointToLocal(p)
    )
  }
}

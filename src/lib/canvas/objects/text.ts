import { ControlPointManager } from "@/lib/canvas/control-points"
import { BaseObject } from "@/lib/canvas/objects/base"
import {
  Bounds,
  ControlPointType,
  Editable,
  Position,
  Transform,
  Transformable,
} from "@/types"

export class TextObject extends BaseObject implements Transformable, Editable {
  private controlPointManager: ControlPointManager
  content: string
  font: string
  color: string
  isEditing: boolean = false
  private cursorPosition: number = 0
  private selectionStart: number | null = null
  private blinkInterval: number | null = null
  private showCursor: boolean = false
  private reqAnimFrameId: number | null = null
  private lastBlinkTime: number = 0
  private readonly BLINK_INTERVAL = 530
  private onUpdate: (() => void) | null = null

  constructor(content: string, position: Position) {
    super("text", position)
    this.content = content
    this.font = "20px Geist Mono"
    this.color = "#ffffff"
    this.controlPointManager = new ControlPointManager()
  }

  getTransform(): Transform {
    return {
      position: { ...this.transform.position },
      rotation: this.transform.rotation,
      scale: this.transform.scale,
      isFlipped: this.transform.isFlipped,
    }
  }

  setTransform(transform: Transform): void {
    this.transform = {
      position: { ...transform.position },
      rotation: transform.rotation,
      scale: transform.scale,
      isFlipped: transform.isFlipped,
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    ctx.font = this.font
    ctx.fillStyle = this.selected ? "#0066ff" : this.color
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.translate(this.transform.position.x, this.transform.position.y)
    ctx.rotate(this.transform.rotation)
    ctx.scale(
      this.transform.scale * (this.transform.isFlipped ? -1 : 1),
      this.transform.scale
    )

    ctx.fillText(this.content, 0, 0)

    if (this.isEditing) {
      this.renderEditingUI(ctx)
    }

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
    const ctx = document.createElement("canvas").getContext("2d")!
    ctx.font = this.font
    const metrics = ctx.measureText(this.content)

    const height =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

    const width = metrics.width

    const padding = 20

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

  // transform point from global to local regardless of scale and rotation
  transformPointToLocal(point: Position): Position {
    const dx = point.x - this.transform.position.x
    const dy = point.y - this.transform.position.y

    // rotation

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

  // editing methods

  setUpdateCallback(cb: () => void): void {
    this.onUpdate = cb
  }

  startEditing(): void {
    this.isEditing = true
    this.cursorPosition = this.content.length
    this.selectionStart = 0
    this.showCursor = true
    this.lastBlinkTime = 0

    const animateBlink = (timestamp: number) => {
      if (!this.lastBlinkTime) this.lastBlinkTime = timestamp

      const elapsed = timestamp - this.lastBlinkTime

      if (elapsed > this.BLINK_INTERVAL) {
        this.showCursor = !this.showCursor
        if (this.onUpdate) {
          this.onUpdate()
        }
        this.lastBlinkTime = timestamp
      }

      if (this.isEditing) {
        this.reqAnimFrameId = requestAnimationFrame(animateBlink)
      }
    }

    this.reqAnimFrameId = requestAnimationFrame(animateBlink)
  }

  stopEditing(): void {
    this.isEditing = false
    this.selectionStart = null
    if (this.reqAnimFrameId !== null) {
      cancelAnimationFrame(this.reqAnimFrameId)
      this.reqAnimFrameId = null
    }
    this.lastBlinkTime = 0
  }

  // crazy i have to do this myself ☠️
  onKeyDown(e: KeyboardEvent): void {
    if (!this.isEditing) return

    if (e.key === "Escape") {
      this.stopEditing()
      return
    }

    if (e.key === "Enter") {
      this.stopEditing()
      return
    }

    if (e.key === "Backspace") {
      if (this.selectionStart !== null) {
        const start = Math.min(this.selectionStart, this.cursorPosition)
        const end = Math.max(this.selectionStart, this.cursorPosition)
        this.content = this.content.slice(0, start) + this.content.slice(end)

        this.cursorPosition = start
        this.selectionStart = null
      } else if (this.cursorPosition > 0) {
        this.content =
          this.content.slice(0, this.cursorPosition - 1) +
          this.content.slice(this.cursorPosition)
        this.cursorPosition--
      }

      e.preventDefault()
      return
    }

    if (e.key === "ArrowLeft") {
      // shift selection
      if (e.shiftKey && this.selectionStart === null) {
        this.selectionStart = this.cursorPosition
      }

      if (!e.shiftKey) {
        this.selectionStart = null
      }

      if (this.cursorPosition > 0) {
        this.cursorPosition--
      }

      return
    }

    if (e.key === "ArrowRight") {
      if (e.shiftKey && this.selectionStart === null) {
        this.selectionStart = this.cursorPosition
      }

      if (!e.shiftKey) {
        this.selectionStart = null
      }

      if (this.cursorPosition < this.content.length) {
        this.cursorPosition++
      }

      return
    }

    if (e.ctrlKey && e.key === "a") {
      this.selectionStart = 0
      this.cursorPosition = this.content.length
      return
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (this.selectionStart !== null) {
        const start = Math.min(this.selectionStart, this.cursorPosition)
        const end = Math.max(this.selectionStart, this.cursorPosition)
        this.content =
          this.content.slice(0, start) + e.key + this.content.slice(end)

        this.cursorPosition = start + 1
        this.selectionStart = null
      } else {
        this.content =
          this.content.slice(0, this.cursorPosition) +
          e.key +
          this.content.slice(this.cursorPosition)
        this.cursorPosition++
      }
    }
  }

  private renderEditingUI(ctx: CanvasRenderingContext2D): void {
    const metrics = ctx.measureText(this.content)
    const totalWidth = metrics.width
    const charWidth = totalWidth / this.content.length

    // draw selection

    if (this.selectionStart !== null) {
      const start = Math.min(this.selectionStart, this.cursorPosition)
      const end = Math.max(this.selectionStart, this.cursorPosition)

      const startX = -totalWidth / 2 + start * charWidth
      const width = (end - start) * charWidth

      ctx.fillStyle = `rgba(0, 102, 255, 0.3)`
      ctx.fillRect(startX, -10, width, 20)
    }

    if (this.showCursor) {
      const cursorX = -totalWidth / 2 + this.cursorPosition * charWidth
      ctx.strokeStyle = "#ff0000"
      ctx.lineWidth = (1 / this.transform.scale) * 2
      ctx.beginPath()
      ctx.moveTo(cursorX, -10)
      ctx.lineTo(cursorX, 10 / this.transform.scale)
      ctx.stroke()

      // ctx.fillStyle = "#ff0000"
      // ctx.fillRect(cursorX - 0.5, -10, 1, 20 / this.transform.scale)
    }
  }
}

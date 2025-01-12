import { ControlPointManager } from "@/lib/canvas/control-points"
import { BaseObject } from "@/lib/canvas/objects/base"
import { CANVAS_STYLE } from "@/lib/canvas/style"
import {
  Bounds,
  Camera,
  ControlPointType,
  Editable,
  Position,
  StyleRange,
  TextStyle,
  Transform,
  Transformable,
} from "@/types"
import { Style } from "util"

export class TextObject extends BaseObject implements Transformable, Editable {
  private styleRanges: StyleRange[] = []
  private controlPointManager: ControlPointManager
  content: string
  style: TextStyle
  isEditing: boolean = false
  private font: string
  private cursorPosition: number = 0
  private selectionStart: number | null = null
  private showCursor: boolean = false
  private reqAnimFrameId: number | null = null
  private lastBlinkTime: number = 0
  private readonly BLINK_INTERVAL = 530
  private onUpdate: (() => void) | null = null

  constructor(content: string, position: Position, style?: TextStyle) {
    super("text", position)
    this.content = content
    this.controlPointManager = new ControlPointManager()
    this.style = style || {
      font: CANVAS_STYLE.font,
      color: CANVAS_STYLE.color,
      size: CANVAS_STYLE.size,
    }
    this.font = `${this.style.size}px ${this.style.font}`
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

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    ctx.save()

    ctx.translate(this.transform.position.x, this.transform.position.y)
    ctx.rotate(this.transform.rotation)
    ctx.scale(
      this.transform.scale * (this.transform.isFlipped ? -1 : 1),
      this.transform.scale
    )

    let lastEnd = 0

    for (const range of this.styleRanges) {
      if (lastEnd < range.start) {
        this.renderTextSegment(ctx, lastEnd, range.start, this.style)
      }

      this.renderTextSegment(ctx, range.start, range.end, range.style)
      lastEnd = range.end
    }

    if (lastEnd < this.content.length) {
      this.renderTextSegment(ctx, lastEnd, this.content.length, this.style)
    }

    if (this.isEditing) {
      this.renderEditingUI(ctx)
    }

    if (this.selected) {
      const bounds = this.getBounds()
      this.drawBoundingBox(ctx, bounds)
      this.controlPointManager.drawControlPoints(
        ctx,
        bounds,
        this.transform,
        camera
      )
      this.controlPointManager.drawRotationHandle(
        ctx,
        bounds,
        this.transform,
        camera
      )
    }

    ctx.restore()
  }

  private renderTextSegment(
    ctx: CanvasRenderingContext2D,
    start: number,
    end: number,
    style: Partial<TextStyle>
  ): void {
    const segment = this.content.slice(start, end)

    // segment style
    const italic = style.italic ? "italic " : ""
    const weight = style.weight || "normal"
    ctx.font = `${italic}${weight} ${style.size}px ${style.font}`

    ctx.fillStyle = this.selected
      ? CANVAS_STYLE.textSelectionColor
      : style.color || this.style.color

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const totalWidth = this.getTextWidth(ctx)

    const beforeWidth = ctx.measureText(this.content.slice(0, start)).width
    const x = -totalWidth / 2 + beforeWidth + ctx.measureText(segment).width / 2

    ctx.fillText(segment, x, 0)
  }

  private getTextWidth(ctx: CanvasRenderingContext2D): number {
    return ctx.measureText(this.content).width
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

  containsPoint(point: Position, camera: Camera): boolean {
    // const local = this.transformPointToLocal(point)
    // const bounds = this.getBounds()

    // if (this.selected) {
    //   const controlPoint = this.getControlPointAtPosition(point, cameraZoom)
    //   if (controlPoint !== ControlPointType.None) {
    //     return true
    //   }
    // }

    // return (
    //   local.x >= bounds.left &&
    //   local.x <= bounds.right &&
    //   local.y >= bounds.top &&
    //   local.y <= bounds.bottom
    // )
    return super.containsPoint(point, camera)
  }

  // transform point from global to local regardless of scale and rotation
  // transformPointToLocal(point: Position): Position {
  //   // const dx = point.x - this.transform.position.x
  //   // const dy = point.y - this.transform.position.y

  //   // // rotation

  //   // const cos = Math.cos(-this.transform.rotation)
  //   // const sin = Math.sin(-this.transform.rotation)
  //   // const rx = dx * cos - dy * sin
  //   // const ry = dx * sin + dy * cos

  //   // const scaleX = this.transform.scale * (this.transform.isFlipped ? -1 : 1)
  //   // const scaleY = this.transform.scale

  //   // return {
  //   //   x: rx / scaleX,
  //   //   y: ry / scaleY,
  //   // }

  //   return super.transformPointToLocal(point, cameraZoom)
  // }

  getControlPointAtPosition(
    screenPoint: Position,
    camera: Camera
  ): ControlPointType {
    // First, get our bounds in local space
    const localBounds = this.getBounds()

    console.debug("TextObject.getControlPointAtPosition - Local bounds:", {
      localBounds,
      screenPoint,
      transform: this.transform,
      camera,
    })

    return this.controlPointManager.getControlPointAtPosition(
      screenPoint,
      localBounds,
      this.transform,
      camera
    )
  }

  setUpdateCallback(updateFn: () => void): void {
    this.onUpdate = updateFn
  }

  startEditing(): void {
    this.isEditing = true
    this.cursorPosition = this.content.length
    this.selectionStart = 0
    this.showCursor = true
    this.lastBlinkTime = 0

    const animateBlink = (timestamp: number) => {
      if (!this.isEditing) return
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

    if (this.reqAnimFrameId !== null) {
      cancelAnimationFrame(this.reqAnimFrameId)
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

    const textHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

    // 20% taller than the text
    const cursorHeight = textHeight * 1.2
    const cursorYOffset = cursorHeight / 2

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
      ctx.lineWidth = 1 / this.transform.scale
      ctx.beginPath()
      ctx.moveTo(cursorX, -cursorYOffset)
      ctx.lineTo(cursorX, cursorYOffset)
      ctx.stroke()

      // ctx.fillStyle = "#ff0000"
      // ctx.fillRect(cursorX - 0.5, -10, 1, 20 / this.transform.scale)
    }
  }
  private updateFont() {
    const italic = this.style.italic ? "italic " : ""
    const weight = this.style.weight || "normal"
    this.font = `${italic}${weight} ${this.style.size}px ${this.style.font}`
  }

  setStyle(style: Partial<TextStyle>) {
    this.style = { ...this.style, ...style }
    this.updateFont()
  }

  setStyleForSelection(style: Partial<TextStyle>): void {
    if (!this.isEditing || this.selectionStart === null) {
      this.setStyle(style)
      return
    }

    const start = Math.min(this.selectionStart, this.cursorPosition)
    const end = Math.max(this.selectionStart, this.cursorPosition)

    this.styleRanges.push({
      start,
      end,
      style,
    })

    this.normalizeStyleRanges()
  }

  private normalizeStyleRanges() {
    this.styleRanges.sort((a, b) => a.start - b.start)

    for (let i = 0; i < this.styleRanges.length - 1; i++) {
      const current = this.styleRanges[i]
      const next = this.styleRanges[i + 1]

      if (current.end > next.start) {
        current.end = Math.max(current.end, next.end)
        current.style = { ...current.style, ...next.style }
        this.styleRanges.splice(i + 1, 1)
        i--
      }
    }
  }
}

import { CANVAS_STYLE } from "@/lib/canvas/style"
import {
  Camera,
  CropBounds,
  CropHandle,
  CropMode,
  CropResult,
  CropState,
  Position,
} from "@/types"

export class ImageCropper {
  private cropState: CropState<"circular"> | CropState<"rectangular"> | null =
    null
  private image: HTMLImageElement
  private minSize = 20

  constructor(image: HTMLImageElement) {
    this.image = image
  }

  startCrop<T extends CropMode>(mode: T, aspectRatio?: number) {
    if (!mode) {
      throw new Error("Crop mode is required")
    }

    const imgWidth = this.image.naturalWidth
    const imgHeight = this.image.naturalHeight

    if (mode === "rectangular") {
      const w = imgWidth * 0.8
      const h = aspectRatio ? w / aspectRatio : imgHeight * 0.8

      this.cropState = {
        mode: "rectangular" as T,
        aspectRatio,
        bounds: {
          x: (imgWidth - w) / 2,
          y: (imgHeight - h) / 2,
          width: w,
          height: h,
        } as CropState<T>["bounds"],
        isDragging: false,
        activeHandle: null,
      } as CropState<"rectangular">
    } else if (mode === "circular") {
      const r = Math.min(imgWidth, imgHeight) * 0.4

      this.cropState = {
        mode: "circular" as T,
        bounds: {
          centerX: imgWidth / 2,
          centerY: imgHeight / 2,
          radius: r,
        } as CropState<T>["bounds"],
        isDragging: false,
        activeHandle: null,
      } as CropState<"circular">
    }
  }

  handleMouseDown(localPoint: Position, camera: Camera): boolean {
    // god forbid if this happens
    if (!this.cropState) return false

    const handle = this.getHandleAtPosition(localPoint, camera)

    if (handle) {
      this.cropState.isDragging = true
      this.cropState.activeHandle = handle
      this.cropState.initialBounds = { ...this.cropState.bounds }
      return true
    }

    return false
  }

  handleMouseMove(
    localPoint: Position,
    camera: Camera,
    lastPoint: Position
  ): void {
    if (!this.cropState) return

    if (!this.cropState.isDragging || !this.cropState.initialBounds) return

    const dx = localPoint.x - lastPoint.x
    const dy = localPoint.y - lastPoint.y

    if (this.cropState.mode === "rectangular") {
      this.handleRectangularCrop(dx, dy)
    } else if (this.cropState.mode === "circular") {
      this.handleCircularCrop(dx, dy)
    }
  }
  getHandleAtPosition(point: Position, camera: Camera): CropHandle | null {
    if (!this.cropState) return null

    const handleSize = 10 / camera.zoom

    if (this.cropState.mode === "rectangular") {
      const bounds = this.cropState.bounds as CropBounds<"rectangular">
      const handles = this.getRectangularHandles(bounds)

      for (const [handle, pos] of Object.entries(handles)) {
        const dx = point.x - pos.x
        const dy = point.y - pos.y

        const d = Math.sqrt(dx * dx + dy * dy)

        if (d <= handleSize) {
          return handle as CropHandle
        }
      }

      //   is the point withing the crop bounds for move?

      const isWithinBounds =
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height

      if (isWithinBounds) return "move"
    } else if (this.cropState.mode === "circular") {
      const bounds = this.cropState.bounds as CropBounds<"circular">
      const dx = point.x - bounds.centerX
      const dy = point.y - bounds.centerY

      const d = Math.sqrt(dx * dx + dy * dy)

      if (Math.abs(d - bounds.radius) <= handleSize) {
        return "radius"
      }

      if (d <= bounds.radius) {
        return "move"
      }
    }

    return null
  }

  getRectangularHandles(bounds: CropBounds<"rectangular">) {
    const { x, y, width, height } = bounds
    const halfWidth = width / 2
    const halfHeight = height / 2

    return {
      topLeft: { x, y },
      top: { x: x + halfWidth, y },
      topRight: { x: x + width, y },
      right: { x: x + width, y: y + halfHeight },
      bottom: { x: x + halfWidth, y: y + height },
      bottomRight: { x: x + width, y: y + height },
      bottomLeft: { x, y: y + height },
      left: { x, y: y + halfHeight },
      move: { x: x + halfWidth, y: y + halfHeight },
    }
  }

  renderCropOverlay(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.cropState) return

    ctx.save()

    ctx.fillStyle = CANVAS_STYLE.cropOverlay.fillStyle
    ctx.fillRect(0, 0, this.image.naturalWidth, this.image.naturalHeight)

    // clear crop area
    ctx.globalCompositeOperation = "destination-out"

    if (this.cropState.mode === "rectangular") {
      const bounds = this.cropState.bounds as CropBounds<"rectangular">
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    } else if (this.cropState.mode === "circular") {
      const bounds = this.cropState.bounds as CropBounds<"circular">
      ctx.beginPath()
      ctx.arc(bounds.centerX, bounds.centerY, bounds.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalCompositeOperation = "source-over"
    this.drawCropHandles(ctx, camera)

    ctx.restore()
  }

  private drawCropHandles(ctx: CanvasRenderingContext2D, camera: Camera) {
    if (!this.cropState) return

    const handleSize = 10 / camera.zoom

    ctx.fillStyle = CANVAS_STYLE.controlPoint.fillStyle
    ctx.strokeStyle = CANVAS_STYLE.controlPoint.strokeStyle
    ctx.lineWidth = 1 / camera.zoom

    if (this.cropState.mode === "rectangular") {
      const bounds = this.cropState.bounds as CropBounds<"rectangular">
      const handles = this.getRectangularHandles(bounds)

      ctx.strokeStyle = CANVAS_STYLE.controlPoint.strokeStyle
      ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.setLineDash([])

      ctx.strokeStyle = CANVAS_STYLE.controlPoint.strokeStyle

      for (const pos of Object.values(handles)) {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, handleSize / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    } else if (this.cropState.mode === "circular") {
      const bounds = this.cropState.bounds as CropBounds<"circular">

      ctx.strokeStyle = CANVAS_STYLE.controlPoint.strokeStyle
      ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])
      ctx.beginPath()
      ctx.arc(bounds.centerX, bounds.centerY, bounds.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = CANVAS_STYLE.controlPoint.strokeStyle
      const angle = Math.PI / 4
      const handleX = bounds.centerX + bounds.radius * Math.cos(angle)
      const handleY = bounds.centerY + bounds.radius * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(handleX, handleY, handleSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(bounds.centerX, bounds.centerY, handleSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }

  //   TODO: impl handleRectangularCrop, handleCircularCrop

  private handleRectangularCrop(dx: number, dy: number) {
    if (!this.cropState || !this.cropState.initialBounds) return

    const cropState = this.cropState as CropState<"rectangular">
    const initial = cropState.initialBounds as CropBounds<"rectangular">
    const handle = cropState.activeHandle
    const ar = cropState.aspectRatio
    const bounds = cropState.bounds
    const newBounds: CropBounds<"rectangular"> = { ...bounds }

    switch (handle) {
      case "move":
        newBounds.x = Math.max(
          0,
          Math.min(initial.x + dx, this.image.naturalWidth - bounds.width)
        )
        newBounds.y = Math.max(
          0,
          Math.min(initial.y + dy, this.image.naturalHeight - bounds.height)
        )
        break
      case "top":
      case "topLeft":
      case "topRight":
        newBounds.y = Math.max(
          0,
          Math.min(initial.y + dy, initial.y + initial.height - this.minSize)
        )
        newBounds.height = initial.height - (newBounds.y - initial.y)
        if (ar) {
          newBounds.width = newBounds.height * ar
        }
        break
      case "bottom":
      case "bottomLeft":
      case "bottomRight":
        newBounds.height = Math.max(
          this.minSize,
          Math.min(initial.height + dy, this.image.naturalHeight - initial.y)
        )
        if (ar) {
          newBounds.width = newBounds.height * ar
        }
        break
      case "left":
      case "right":
        newBounds.width = Math.max(
          this.minSize,
          Math.min(initial.width + dx, this.image.naturalWidth - initial.x)
        )
        if (ar) {
          newBounds.height = newBounds.width / ar
        }
        break
    }

    this.cropState = {
      ...cropState,
      bounds: newBounds,
    } as CropState<"rectangular">
  }

  private handleCircularCrop(dx: number, dy: number) {
    if (!this.cropState || !this.cropState.initialBounds) return

    const cropState = this.cropState as CropState<"circular">
    const initial = cropState.initialBounds as CropBounds<"circular">
    const handle = cropState.activeHandle
    const bounds = cropState.bounds
    const newBounds: CropBounds<"circular"> = { ...bounds }

    switch (handle) {
      case "move":
        newBounds.centerX = Math.max(
          bounds.radius,
          Math.min(
            initial.centerX + dx,
            this.image.naturalWidth - bounds.radius
          )
        )
        newBounds.centerY = Math.max(
          bounds.radius,
          Math.min(
            initial.centerY + dy,
            this.image.naturalHeight - bounds.radius
          )
        )
        break
      case "radius":
        const dx2 = dx * dx
        const dy2 = dy * dy

        const delta = Math.sqrt(dx2 + dy2) * (dx > 0 ? 1 : -1)

        const maxR = Math.min(
          initial.centerX,
          initial.centerY,
          this.image.naturalWidth - initial.centerX,
          this.image.naturalHeight - initial.centerY
        )

        const newR = Math.max(
          this.minSize,
          Math.min(initial.radius + delta, maxR)
        )

        newBounds.radius = newR
        break
    }

    this.cropState = {
      ...cropState,
      bounds: newBounds,
    } as CropState<"circular">
  }

  handleMouseUp() {
    if (!this.cropState) return

    this.cropState.isDragging = false
    this.cropState.activeHandle = null
    this.cropState.initialBounds = undefined
  }

  getCropState(): typeof this.cropState {
    return this.cropState
  }

  applyCrop<T extends CropMode>(cb: (result: CropResult<T>) => void): void {
    if (!this.cropState) return

    // @ts-expect-error fuck off
    const result: CropResult<T> = {
      mode: this.cropState.mode as T,
      bounds: this.cropState.bounds,
      aspectRatio: this.cropState.aspectRatio,
    }

    cb(result)

    this.cropState = null
  }

  cancelCrop(): void {
    this.cropState = null
  }

  getCursor(handle: CropHandle | null): string {
    if (!handle) return "default"

    const cursors: Record<CropHandle, string> = {
      move: "move",
      radius: "nwse-resize",
      topLeft: "nwse-resize",
      top: "ns-resize",
      topRight: "nesw-resize",
      right: "ew-resize",
      bottomRight: "nwse-resize",
      bottom: "s-resize",
      bottomLeft: "nesw-resize",
      left: "w-resize",
    }

    return cursors[handle] || "default"
  }
}

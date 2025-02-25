import { ControlPointManager } from "@/lib/canvas/control-points"
import { BaseObject } from "@/lib/canvas/objects/base"
import { ImageCropper } from "@/lib/canvas/tools/img-crop"
import {
  Bounds,
  Camera,
  ControlPointType,
  CropBounds,
  CropMode,
  Position,
} from "@/types"

export class ImageObject extends BaseObject {
  private image: HTMLImageElement
  private isLoaded: boolean = false
  private natWidth: number = 0
  private natHeight: number = 0
  private controlPointManager: ControlPointManager
  private cropper: ImageCropper | null = null
  private originalImageData: string | null = null

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
    this.originalImageData = source
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (!this.isLoaded) return

    ctx.save()
    ctx.translate(this.transform.position.x, this.transform.position.y)
    ctx.rotate(this.transform.rotation)
    ctx.scale(
      this.transform.scale.x * (this.transform.isFlipped ? -1 : 1),
      this.transform.scale.y
    )

    ctx.drawImage(
      this.image,
      -this.natWidth / 2,
      -this.natHeight / 2,
      this.natWidth,
      this.natHeight
    )

    if (this.cropper) {
      this.cropper.renderCropOverlay(ctx, camera)
    }

    if (this.selected && !this.cropper) {
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

  private drawBoundingBox(ctx: CanvasRenderingContext2D, bounds: Bounds): void {
    ctx.strokeStyle = "#1a7fd4"
    ctx.lineWidth = 1 / this.transform.scale.y
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
    const padding = this.transform.scale.y * 10
    const width = this.natWidth
    const height = this.natHeight

    return {
      left: -width / 2 - padding,
      right: width / 2 + padding,
      top: -height / 2 - padding,
      bottom: height / 2 + padding,
    }
  }

  startCrop(mode: CropMode, aspectRatio?: number): void {
    if (!this.isLoaded) return

    if (!this.cropper) {
      this.cropper = new ImageCropper(this.image)
    }

    this.cropper.startCrop(mode, aspectRatio)
  }

  isCropping(): boolean {
    console.log({
      cropper: this.cropper,
      cropState: this.cropper?.getCropState(),
    })

    return this.cropper !== null && this.cropper.getCropState() !== null
  }

  cancelCrop() {
    this.cropper = null
  }

  applyCrop(): void {
    if (!this.cropper) return

    if (!this.originalImageData) {
      this.originalImageData = this.getImageData()
    }

    this.cropper?.applyCrop((result) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      if (!ctx) return

      switch (result.mode) {
        case "rectangular": {
          const bounds = result.bounds as CropBounds<"rectangular">
          canvas.width = bounds.width
          canvas.height = bounds.height

          ctx.drawImage(
            this.image,
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            0,
            0,
            bounds.width,
            bounds.height
          )

          break
        }

        case "circular": {
          const bounds = result.bounds as CropBounds<"circular">
          canvas.width = bounds.radius * 2
          canvas.height = bounds.radius * 2

          ctx.beginPath()
          ctx.arc(bounds.radius, bounds.radius, bounds.radius, 0, Math.PI * 2)
          ctx.clip()

          ctx.drawImage(
            this.image,
            bounds.centerX,
            bounds.centerY,
            bounds.radius * 2,
            bounds.radius * 2,
            0,
            0,
            bounds.radius * 2,
            bounds.radius * 2
          )

          break
        }

        default:
          break
      }

      const croppedDataUrl = canvas.toDataURL("image/png")
      this.updateImage(croppedDataUrl)
      canvas.remove()
    })
  }

  updateImage(src: string): void {
    const newImage = new Image()

    newImage.onload = () => {
      this.image = newImage
      this.natWidth = newImage.naturalWidth
      this.natHeight = newImage.naturalHeight
      this.isLoaded = true
    }

    newImage.src = src
  }

  restoreFromData(imageData: string, width: number, height: number): void {
    this.updateImage(imageData)
    this.natWidth = width
    this.natHeight = height
  }

  containsPoint(point: Position, camera: Camera): boolean {
    if (this.cropper) {
      const localPoint = this.screenToLocal(point, camera)
      const handle = this.cropper.getHandleAtPosition(localPoint, camera)
      if (handle) return true
    }

    return super.containsPoint(point, camera)
  }

  getControlPointAtPosition(
    screenPoint: Position,
    camera: Camera
  ): ControlPointType {
    return this.controlPointManager.getControlPointAtPosition(
      screenPoint,
      this.getBounds(),
      this.transform,
      camera
    )
  }

  // crop mouse controls

  handleMouseDown(point: Position, camera: Camera): boolean {
    if (this.cropper) {
      const localPoint = this.screenToLocal(point, camera)
      return this.cropper.handleMouseDown(localPoint, camera)
    }

    return false
  }

  handleMouseMove(point: Position, camera: Camera, lastPoint: Position): void {
    if (this.cropper) {
      const localPoint = this.screenToLocal(point, camera)
      const localLastPoint = this.screenToLocal(lastPoint, camera)
      this.cropper.handleMouseMove(localPoint, camera, localLastPoint)
    }
  }

  handleMouseUp(): void {
    if (this.cropper) {
      this.cropper.handleMouseUp()
    }
  }

  getCursor(point: Position, camera: Camera): string {
    if (this.cropper) {
      const localPoint = this.screenToLocal(point, camera)
      const handle = this.cropper.getHandleAtPosition(localPoint, camera)
      return this.cropper.getCursor(handle)
    }

    return this.selected ? "move" : "pointer"
  }

  // get image data as base64
  getImageData(): string {
    const canvas = document.createElement("canvas")
    canvas.width = this.natWidth
    canvas.height = this.natHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(this.image, 0, 0)
    const imgData = canvas.toDataURL()
    canvas.remove()
    return imgData
  }

  getOriginalSize(): { width: number; height: number } {
    return { width: this.natWidth, height: this.natHeight }
  }

  clone(): ImageObject {
    const cloned = new ImageObject(this.image.src, {
      ...this.transform.position,
    })
    cloned.setTransform({ ...this.transform })
    cloned.isLoaded = this.isLoaded
    cloned.natWidth = this.natWidth
    cloned.natHeight = this.natHeight
    return cloned
  }
}

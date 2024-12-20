import { MouseEvtHandlers } from "@/components/canvas/mouse-evt-handlers"
import { CanvasEventEmitter } from "@/lib/canvas/core/event"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { CANVAS_STYLE } from "@/lib/canvas/style"
import { TransformManager } from "@/lib/canvas/transform"
import {
  Camera,
  CanvasControllerOptions,
  CanvasEvents,
  Dimensions,
  Position,
} from "@/types"

export class CanvasController extends CanvasEventEmitter<CanvasEvents> {
  private context: CanvasRenderingContext2D
  private objects: BaseObject[] = []
  private camera: Camera
  private dimenstions: Dimensions = { width: 0, height: 0 }
  private selectionManger: SelectionManager
  private transformManager: TransformManager
  private mouseManager: MouseEvtHandlers
  private options: Required<CanvasControllerOptions>
  private rafId: number | null = null
  private isDestroyed: boolean = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: CanvasControllerOptions = {}
  ) {
    super()

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get 2d context")
    }

    this.context = ctx
    this.options = {
      initialZoom: 1,
      gridSize: 10,
      cullingMargin: 100,
      minZoom: 0.1,
      maxZoom: 10,
      debug: true,
      ...options,
    }

    this.camera = {
      x: 0,
      y: 0,
      zoom: this.options.initialZoom,
      isDragging: false,
      lastMousePosition: null,
    }

    this.selectionManger = new SelectionManager()
    this.transformManager = new TransformManager()
    // this.mouseManager = new MouseEvtHandlers(
    //   { current: canvas },
    //   this.selectionManger,
    //   this.transformManager,
    //   this.handleObjectsChange,

    // )

    this.selectionManger.subscribe(() => {
      this.emit(
        "selection:change",
        this.selectionManger.getSelectedObjects()[0] || null
      )
    })

    this.startRenderLoop()
  }

  private render(): void {
    if (!this.context || !this.isDestroyed) return

    this.context.clearRect(
      0,
      0,
      this.dimenstions.width,
      this.dimenstions.height
    )

    this.context.save()

    this.context.translate(this.camera.x, this.camera.y)
    this.context.scale(this.camera.zoom, this.camera.zoom)

    this.drawGrid()

    this.objects.forEach((obj) => {
      if (this.isInViewPort(obj)) {
        obj.render(this.context)
      }
    })

    this.context.restore()
    this.emit("render:")
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.render()
      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
  }

  private stopRenderLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private handleObjectsChange(): void {
    this.emit("objects:change", [...this.objects])
    this.render()
  }

  private handleMouseLeave() {
    this.endPan()
    this.mouseManager.handleMouseLeave()
  }

  private handleResize() {
    const rect = this.canvas.getBoundingClientRect()
    this.setDimensions(rect.width, rect.height)
  }

  private handleObjectsChange(): void {
    this.emit("objects:change", [...this.objects])
    this.render()
  }

  private screenToWorld(point: Position): Position {
    return {
      x: (point.x - this.camera.x) / this.camera.zoom,
      y: (point.y - this.camera.y) / this.camera.zoom,
    }
  }

  private worldToScreen(point: Position): Position {
    return {
      x: point.x * this.camera.zoom + this.camera.x,
      y: point.y * this.camera.zoom + this.camera.y,
    }
  }

  private drawGrid(): void {
    const { gridSize } = this.options

    const topLeft = this.screenToWorld({ x: 0, y: 0 })
    const bottomRight = this.screenToWorld({
      x: this.dimenstions.width,
      y: this.dimenstions.height,
    })

    const startX = Math.floor(topLeft.x / gridSize) * gridSize
    const startY = Math.floor(topLeft.y / gridSize) * gridSize
    const endX = Math.ceil(bottomRight.x / gridSize) * gridSize
    const endY = Math.ceil(bottomRight.y / gridSize) * gridSize

    this.context.beginPath()
    this.context.strokeStyle = CANVAS_STYLE.gridStroke
    this.context.lineWidth = 0.5 / this.camera.zoom

    // vertical
    for (let x = startX; x <= endX; x += gridSize) {
      this.context.moveTo(x, startY)
      this.context.lineTo(x, endY)
    }

    // horizontal

    for (let y = startY; y <= endY; y += gridSize) {
      this.context.moveTo(startX, y)
      this.context.lineTo(endX, y)
    }

    this.context.stroke()

    this.drawAxes()
  }

  private drawAxes(): void {
    this.context.beginPath()
    this.context.strokeStyle = CANVAS_STYLE.axesStroke
    this.context.lineWidth = 1 / this.camera.zoom

    this.context.moveTo(-1000000, 0)
    this.context.lineTo(-1000000, 0)

    this.context.moveTo(0, -1000000)
    this.context.lineTo(0, 1000000)

    this.context.stroke()
  }

  private isInViewPort(obj: BaseObject): boolean {
    const bounds = obj.getBounds()
    const { position } = obj.transform
    const { cullingMargin } = this.options

    // get the world coordinates of the viewport
    // convert viewport bounds to world coordinates to see the bounds of world present in the viewport
    const worldLeft = -this.camera.x / this.camera.zoom - cullingMargin
    const worldRight =
      (this.dimenstions.width - this.camera.x) / this.camera.zoom +
      cullingMargin

    const worldTop = -this.camera.y / this.camera.zoom - cullingMargin
    const worldBottom =
      (this.dimenstions.height - this.camera.y) / this.camera.zoom +
      cullingMargin

    return (
      position.x + bounds.right >= worldLeft &&
      position.x + bounds.left <= worldRight &&
      position.y + bounds.bottom >= worldTop &&
      position.y + bounds.top <= worldBottom
    )
  }
}

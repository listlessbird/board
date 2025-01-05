import { CoordinateSystem } from "@/lib/canvas/core/coordinate-system"
import { CanvasEventEmitter } from "@/lib/canvas/core/event"
import { InfiniteGrid } from "@/lib/canvas/core/infinite-grid"
import { ViewportManager } from "@/lib/canvas/core/viewport-manager"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
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
  camera: Camera
  private dimensions: Dimensions = { width: 0, height: 0 }
  private selectionManager: SelectionManager
  private transformManager: TransformManager
  private options: Required<CanvasControllerOptions>
  private rafId: number | null = null
  private isDestroyed: boolean = false

  coordinateSystem: CoordinateSystem
  private viewportManager: ViewportManager
  private infiniteGrid: InfiniteGrid
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private fps: number = 0

  private abortController: AbortController
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
      debug: process.env.NODE_ENV === "development",
      ...options,
    }

    const dpr = window.devicePixelRatio || 1

    this.camera = {
      x: (canvas.width / 2) * dpr,
      y: (canvas.height / 2) * dpr,
      zoom: this.options.initialZoom,
      isDragging: false,
      lastMousePosition: null,
    }

    this.coordinateSystem = new CoordinateSystem()
    this.viewportManager = new ViewportManager({
      cullingMargin: this.options.cullingMargin,
      debug: this.options.debug,
    })
    this.infiniteGrid = new InfiniteGrid({
      baseGridSize: this.options.gridSize,
    })

    this.selectionManager = new SelectionManager()
    this.transformManager = new TransformManager()

    this.selectionManager.subscribe(() => {
      this.emit(
        "selection:change",
        this.selectionManager.getSelectedObjects()[0] || null
      )
    })

    this.abortController = new AbortController()

    this.setupEventListeners()
    this.startRenderLoop()
  }

  render(timestamp: number = 0): void {
    if (!this.context || this.isDestroyed) return

    // get fps
    const frameTime = timestamp - this.lastFrameTime
    this.frameCount++

    if (frameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / frameTime)
      this.frameCount = 0
      this.lastFrameTime = timestamp
    }

    this.context.clearRect(0, 0, this.dimensions.width, this.dimensions.height)

    this.context.save()

    // camera transforms
    this.context.translate(this.camera.x, this.camera.y)
    this.context.scale(this.camera.zoom, this.camera.zoom)

    const bounds = this.viewportManager.updateViewPort(
      this.camera,
      this.dimensions.width,
      this.dimensions.height
    )

    this.infiniteGrid.render(this.context, this.camera, bounds)

    const visibleObjects = this.viewportManager.getVisibleObjects(this.objects)

    visibleObjects.forEach((object) => object.render(this.context))

    this.context.restore()

    this.emit("render:")
    this.emit("viewport:change", bounds)
    this.emit("camera:change", { ...this.camera })

    if (this.options.debug) {
      this.renderDebugInfo()
    }
  }

  private renderDebugInfo(): void {
    const dpr = window.devicePixelRatio || 1
    this.context.save()
    this.context.setTransform(1, 0, 0, 1, 0, 0)

    this.context.font = `${12 * dpr}px monospace`
    this.context.fillStyle = `rgba(255, 255,255,0.5)`

    const debugInfo = [
      `FPS: ${this.fps}`,
      `Zoom: ${this.camera.zoom.toFixed(2)}`,
      `Objects: ${this.objects.length}`,
      `Selected: ${this.selectionManager.getSelectedObjects().length}`,
      `Camera: (${this.camera.x.toFixed(2)}, ${this.camera.y.toFixed(2)})`,
    ]

    debugInfo.forEach((line, index) => {
      this.context.fillText(line, 10 * dpr, 20 * dpr + index * 20 * dpr)
    })

    this.context.restore()
  }

  private startRenderLoop(): void {
    const loop = (timestamp: number) => {
      this.render(timestamp)
      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
  }

  addObject<T extends BaseObject>(object: T): void {
    this.objects.push(object)
    this.emit("objects:change", [...this.objects])
  }

  removeObject<T extends BaseObject>(object: T): void {
    this.objects = this.objects.filter((o) => o.id !== object.id)
    this.emit("objects:change", [...this.objects])
  }

  getObjects(): BaseObject[] {
    return [...this.objects]
  }

  zoomTo(level: number): void {
    this.camera.zoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, level)
    )

    this.emit("zoom:change", this.camera.zoom)
  }

  panTo(x: number, y: number): void {
    this.camera.x = x
    this.camera.y = y

    this.emit("camera:change", { ...this.camera })
  }

  destroy(): void {
    this.isDestroyed = true

    this.abortController.abort()

    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.clear()
  }

  clear(): void {
    this.objects = []
    this.emit("objects:change", [])
  }

  private getMousePosition(e: MouseEvent): Position {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    }
  }
  private setupEventListeners(): void {
    const signal = this.abortController.signal

    if (this.options.debug) {
      console.debug("CanvasController: setting up event listeners")
    }

    this.canvas.addEventListener("wheel", this.handleWheel.bind(this), {
      signal,
    })
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this), {
      signal,
    })
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this), {
      signal,
    })
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this), {
      signal,
    })

    this.canvas.addEventListener(
      "contextmenu",
      this.handleContextMenu.bind(this),
      {
        signal,
      }
    )

    window.addEventListener("resize", this.handleResize.bind(this), { signal })

    this.handleResize()
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault()
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault()

    const mousePos = this.getMousePosition(e)
    const worldPos = this.coordinateSystem.screenToWorld(mousePos, this.camera)

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1

    const newZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.camera.zoom * zoomFactor)
    )

    this.camera.x += worldPos.x * (this.camera.zoom - newZoom)
    this.camera.y += worldPos.y * (this.camera.zoom - newZoom)

    this.camera.zoom = newZoom

    this.emit("zoom:change", this.camera.zoom)
  }

  private getObjectAtPoint(worldPoint: Position): BaseObject | null {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const object = this.objects[i]

      if (object.containsPoint(worldPoint)) {
        return object
      }
    }

    return null
  }

  private handleMouseDown(e: MouseEvent): void {
    const position = this.getMousePosition(e)

    if (e.buttons === 2 || e.button === 2 || (e.buttons === 1 && e.altKey)) {
      e.preventDefault()
      this.camera.isDragging = true
      this.camera.lastMousePosition = position
      this.canvas.style.cursor = "grabbing"
    } else {
      const worldPos = this.coordinateSystem.screenToWorld(
        position,
        this.camera
      )
      // not a drag event, so select object
      const hitObject = this.getObjectAtPoint(worldPos)

      if (hitObject) {
        this.selectionManager.select(hitObject)
      } else {
        this.selectionManager.clearSelection()
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const position = this.getMousePosition(e)

    // handle panning
    if (this.camera.isDragging && this.camera.lastMousePosition) {
      e.preventDefault()
      const dx = position.x - this.camera.lastMousePosition.x
      const dy = position.y - this.camera.lastMousePosition.y

      this.camera.x += dx
      this.camera.y += dy
      this.camera.lastMousePosition = position
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.camera.isDragging) {
      e.preventDefault()
      this.camera.isDragging = false
      this.camera.lastMousePosition = null
      this.canvas.style.cursor = "default"
    }
  }

  private handleResize(): void {
    const dpr = window.devicePixelRatio || 1

    const rect = this.canvas.getBoundingClientRect()

    this.dimensions = {
      width: rect.width * dpr,
      height: rect.height * dpr,
    }

    this.canvas.width = this.dimensions.width
    this.canvas.height = this.dimensions.height

    this.canvas.style.width = `${this.dimensions.width}px`
    this.canvas.style.height = `${this.dimensions.height}px`

    this.coordinateSystem.updateDpr()

    this.context.scale(dpr, dpr)
  }

  setObjects(objects: BaseObject[]): void {
    this.objects = objects
    this.emit("objects:change", objects)
  }
}

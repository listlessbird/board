import { CoordinateSystem } from "@/lib/canvas/core/coordinate-system"
import { CanvasEventEmitter } from "@/lib/canvas/core/event"
import { InfiniteGrid } from "@/lib/canvas/core/infinite-grid"
import { ViewportManager } from "@/lib/canvas/core/viewport-manager"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import {
  Camera,
  CanvasControllerOptions,
  CanvasEvents,
  Dimensions,
  Position,
  ZoomAnimation,
} from "@/types"

export class CanvasController extends CanvasEventEmitter<CanvasEvents> {
  private context: CanvasRenderingContext2D
  private objects: BaseObject[] = []
  camera: Camera
  private dimensions: Dimensions = { width: 0, height: 0 }
  private selectionManager: SelectionManager
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
  private isZooming: boolean = false
  private zoomAnimationFrame: number | null = null
  private animateZoom: boolean
  private zoomAnimationDuration: number
  private currentZoomAnimation: ZoomAnimation | null = null
  private zoomDebounceTimeout: number | null = null
  private _cachedVisibleObjects: BaseObject[] | null = null
  private lastWheelEvent: { deltaY: number; position: Position } | null = null

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
    // @ts-expect-error retarded
    this.options = {
      initialZoom: 1,
      gridSize: 10,
      cullingMargin: 100,
      minZoom: 0.1,
      maxZoom: 10,
      debug: process.env.NODE_ENV === "development",
      animateZoom: true,
      zoomAnimationDuration: 150,
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

    if (!this.options.selectionManager) {
      console.warn("[CanvasController] No selection manager provided")
    }

    this.selectionManager = options.selectionManager ?? new SelectionManager()

    this.selectionManager.subscribe(() => {
      this.emit(
        "selection:change",
        this.selectionManager.getSelectedObjects()[0] || null
      )
    })

    this.animateZoom = options.animateZoom ?? true
    this.zoomAnimationDuration = options.zoomAnimationDuration ?? 150

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

    const dpr = window.devicePixelRatio || 1
    this.context.setTransform(
      this.camera.zoom * dpr,
      0,
      0,
      this.camera.zoom * dpr,
      this.camera.x,
      this.camera.y
    )

    const bounds = this.viewportManager.updateViewPort(
      this.camera,
      this.dimensions.width,
      this.dimensions.height
    )

    // lets not render grids while animating

    const shouldRenderGrid =
      !this.currentZoomAnimation || this.frameCount % 3 === 0

    if (shouldRenderGrid) {
      this.infiniteGrid.render(this.context, this.camera, bounds)
    }

    // use cached while animating

    const visibleObjects = this.currentZoomAnimation
      ? this._cachedVisibleObjects || []
      : this.viewportManager.getVisibleObjects(this.objects)

    if (!this.currentZoomAnimation) {
      this._cachedVisibleObjects = visibleObjects
    }

    visibleObjects.forEach((object) => object.render(this.context, this.camera))

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
    // let lastRender = 0
    // const minRenderInterval = 1000 / 60

    const loop = (timestamp: number) => {
      // const delta = timestamp - lastRender

      // if (delta >= minRenderInterval) {
      //   lastRender = timestamp
      // }
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
      passive: false,
    })
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this), {
      signal,
      passive: true,
    })
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this), {
      passive: true,
      signal,
    })
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this), {
      signal,
      passive: true,
    })

    this.canvas.addEventListener(
      "contextmenu",
      this.handleContextMenu.bind(this),
      {
        signal,
      }
    )

    window.addEventListener("resize", this.handleResize.bind(this), {
      signal,
      passive: true,
    })

    this.handleResize()
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault()
  }
  private handleAnimatedZoom(animation: ZoomAnimation): void {
    if (this.currentZoomAnimation) {
      if (this.zoomAnimationFrame) {
        cancelAnimationFrame(this.zoomAnimationFrame)
        this.zoomAnimationFrame = null
      }
    }

    this.currentZoomAnimation = animation
    this._cachedVisibleObjects = this.viewportManager.getVisibleObjects(
      this.objects
    )

    this.animateZoomFrame()
  }

  private animateZoomFrame() {
    if (!this.currentZoomAnimation) return

    const now = performance.now()
    const elapsed = now - this.currentZoomAnimation.startTime
    const progress = Math.min(elapsed / this.currentZoomAnimation.duration, 1)

    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

    const currentZoom =
      this.currentZoomAnimation.startZoom +
      (this.currentZoomAnimation.targetZoom -
        this.currentZoomAnimation.startZoom) *
        eased

    const newCamera = {
      x:
        this.currentZoomAnimation.startX +
        (this.currentZoomAnimation.targetX - this.currentZoomAnimation.startX) *
          eased,
      y:
        this.currentZoomAnimation.startY +
        (this.currentZoomAnimation.targetY - this.currentZoomAnimation.startY) *
          eased,
      zoom: currentZoom,
      isDragging: this.camera.isDragging,
      lastMousePosition: this.camera.lastMousePosition,
    }

    this.camera = newCamera

    if (progress === 1) {
      this.currentZoomAnimation = null
      this._cachedVisibleObjects = null
      this.emit("zoom:change", currentZoom)
      return
    }

    this.zoomAnimationFrame = requestAnimationFrame(() =>
      this.animateZoomFrame()
    )
  }

  private updateZoomImmediately(zoom: number, center: Position): void {
    this.camera.zoom = zoom
    this.camera.x = center.x
    this.camera.y = center.y
    this.emit("zoom:change", zoom)
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault()

    // throttle wheel
    if (this.currentZoomAnimation) return

    const mousePos = this.getMousePosition(e)
    const worldPos = this.coordinateSystem.screenToWorld(mousePos, this.camera)
    const zoomFactor = Math.exp(-e.deltaY * 0.007)
    const targetZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.camera.zoom * zoomFactor)
    )

    // ignore if zoom is too small
    if (Math.abs(this.camera.zoom - targetZoom) < 0.01) {
      return
    }

    const targetX = this.camera.x + worldPos.x * (this.camera.zoom - targetZoom)
    const targetY = this.camera.y + worldPos.y * (this.camera.zoom - targetZoom)

    if (this.animateZoom) {
      this.handleAnimatedZoom({
        startZoom: this.camera.zoom,
        targetZoom,
        startX: this.camera.x,
        targetX,
        startY: this.camera.y,
        targetY,
        startTime: performance.now(),
        duration: this.options.zoomAnimationDuration,
        worldPos,
      })
    } else {
      this.handleImmediateZoom(e)
    }
  }

  private handleImmediateZoom(e: WheelEvent): void {
    this.lastWheelEvent = {
      deltaY: e.deltaY,
      position: this.getMousePosition(e),
    }

    if (this.isZooming) return

    this.isZooming = true
    this.processImmediateZoom()
  }

  private processImmediateZoom() {
    if (!this.lastWheelEvent) {
      this.isZooming = false
      return
    }

    const { deltaY, position } = this.lastWheelEvent
    this.lastWheelEvent = null

    const worldPos = this.coordinateSystem.screenToWorld(position, this.camera)

    const zoomFactor = Math.exp(-deltaY * 0.001)

    const newZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.camera.zoom * zoomFactor)
    )

    this.camera.x += worldPos.x * (this.camera.zoom - newZoom)
    this.camera.y += worldPos.y * (this.camera.zoom - newZoom)
    this.camera.zoom = newZoom

    this.emit("zoom:change", this.camera.zoom)

    if (this.lastWheelEvent) {
      this.zoomAnimationFrame = requestAnimationFrame(this.processImmediateZoom)
    } else {
      if (this.zoomDebounceTimeout) {
        clearTimeout(this.zoomDebounceTimeout)
      }

      this.zoomDebounceTimeout = window.setTimeout(() => {
        this.isZooming = false
        this.zoomDebounceTimeout = null
      }, 150)
    }
  }

  private getObjectAtPoint(worldPoint: Position): BaseObject | null {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const object = this.objects[i]

      if (object.containsPoint(worldPoint, this.camera)) {
        return object
      }
    }

    return null
  }

  private handleMouseDown(e: MouseEvent): void {
    const position = this.getMousePosition(e)

    if (e.buttons === 2 || e.button === 2 || (e.buttons === 1 && e.altKey)) {
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
      const dx = position.x - this.camera.lastMousePosition.x
      const dy = position.y - this.camera.lastMousePosition.y

      this.camera.x += dx
      this.camera.y += dy
      this.camera.lastMousePosition = position
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.camera.isDragging) {
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

  destroy(): void {
    this.isDestroyed = true

    if (this.zoomAnimationFrame) {
      cancelAnimationFrame(this.zoomAnimationFrame)
    }

    if (this.zoomDebounceTimeout) {
      clearTimeout(this.zoomDebounceTimeout)
    }

    this.currentZoomAnimation = null
    this.abortController.abort()

    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.clear()
  }

  setZoomAnimation(enabled: boolean): void {
    if (!enabled && this.currentZoomAnimation) {
      this.updateZoomImmediately(this.currentZoomAnimation.targetZoom, {
        x: this.currentZoomAnimation.targetX,
        y: this.currentZoomAnimation.targetY,
      })
      this.currentZoomAnimation = null
    }

    this.animateZoom = enabled
  }

  setZoomAnimationDuration(duration: number): void {
    if (duration > 0) {
      this.zoomAnimationDuration = duration
    }
  }
}

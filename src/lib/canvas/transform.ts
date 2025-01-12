import { ScreenSpaceSystem } from "./core/screen-space"
import { ControlPointManager } from "./control-points"
import { BaseObject } from "./objects/base"
import { ControlPointType, Position, Transform, Camera } from "@/types"

export class TransformManager {
  private isDragging: boolean = false
  private lastScreenPos: Position | null = null
  private activeControlPoint: ControlPointType = ControlPointType.None
  private initialTransform: Transform | null = null
  private initialScreenAngle: number | null = null
  private initialScreenDistance: number | null = null

  private screenSpace: ScreenSpaceSystem
  private controlPointManager: ControlPointManager

  private renderCallback: (() => void) | null = null
  private onTransformEnd: (() => void) | null = null
  private rafId: number | null = null

  constructor() {
    this.screenSpace = new ScreenSpaceSystem()
    this.controlPointManager = new ControlPointManager()
  }

  /**
   * Start dragging from screen position
   */
  startDrag(
    screenPosition: Position,
    controlPoint: ControlPointType,
    object: BaseObject,
    camera: Camera
  ): void {
    // Debug for understanding the drag start state
    console.debug("[TransformManager] Starting drag:", {
      screenPosition,
      controlPoint,
      objectId: object.id,
      objectTransform: object.transform,
      camera,
    })

    this.isDragging = true
    this.lastScreenPos = screenPosition
    this.activeControlPoint = controlPoint
    this.initialTransform = { ...object.transform }

    // For scale operations, store initial distance in screen space
    if (this.isScaleHandle(controlPoint)) {
      // Get object center in screen space
      const centerWorld = object.transform.position
      const centerScreen = this.screenSpace.getTransformedPoint(
        centerWorld,
        object.transform,
        camera
      )
      this.initialScreenDistance = this.screenSpace.getScreenDistance(
        centerScreen,
        screenPosition
      )
    }

    // For rotation, store initial angle in screen space
    if (controlPoint === ControlPointType.Rotation) {
      const centerWorld = object.transform.position
      const centerScreen = this.screenSpace.getTransformedPoint(
        centerWorld,
        object.transform,
        camera
      )
      this.initialScreenAngle = this.screenSpace.getScreenAngle(
        centerScreen,
        screenPosition
      )
    }

    this.requestRender()
  }

  /**
   * Handle drag update in screen space
   */
  drag(object: BaseObject, currentScreenPos: Position, camera: Camera): void {
    if (!this.isDragging || !this.lastScreenPos || !this.initialTransform) {
      return
    }

    // console.debug("[TransformManager] Dragging:", {
    //   controlPoint: this.activeControlPoint,
    //   currentScreenPos,
    //   lastScreenPos: this.lastScreenPos,
    //   camera,
    // })

    switch (this.activeControlPoint) {
      case ControlPointType.None:
        this.handleMove(object, currentScreenPos, camera)
        break
      case ControlPointType.Rotation:
        this.handleRotation(object, currentScreenPos, camera)
        break
      case ControlPointType.MiddleLeft:
      case ControlPointType.MiddleRight:
        this.handleScale(object, currentScreenPos, camera)
        this.handleFlip(object, currentScreenPos, camera)
        break
      default:
        if (this.isScaleHandle(this.activeControlPoint)) {
          this.handleScale(object, currentScreenPos, camera)
        }
    }

    this.lastScreenPos = currentScreenPos
    this.requestRender()
  }

  /**
   * Handle object movement in screen space
   */
  private handleMove(
    object: BaseObject,
    currentScreenPos: Position,
    camera: Camera
  ): void {
    if (!this.lastScreenPos) return

    // Calculate delta in screen space
    // const dx = (currentScreenPos.x - this.lastScreenPos.x) / camera.zoom
    // const dy = (currentScreenPos.y - this.lastScreenPos.y) / camera.zoom

    // // Update object position in world space
    // object.transform.position.x += dx
    // object.transform.position.y += dy

    // console.debug("[TransformManager] Moving object:", {
    //   dx,
    //   dy,
    //   objectId: object.id,
    //   newPosition: object.transform.position,
    // })

    const currentWorldPos = {
      x: (currentScreenPos.x - camera.x) / camera.zoom,
      y: (currentScreenPos.y - camera.y) / camera.zoom,
    }

    const lastWorldPos = {
      x: (this.lastScreenPos.x - camera.x) / camera.zoom,
      y: (this.lastScreenPos.y - camera.y) / camera.zoom,
    }

    const dx = currentWorldPos.x - lastWorldPos.x
    const dy = currentWorldPos.y - lastWorldPos.y

    object.transform.position.x += dx
    object.transform.position.y += dy
  }

  /**
   * Handle rotation in screen space
   */
  private handleRotation(
    object: BaseObject,
    currentScreenPos: Position,
    camera: Camera
  ): void {
    if (!this.initialScreenAngle || !this.initialTransform) return

    // Get center in screen space
    const centerWorld = object.transform.position
    const centerScreen = this.screenSpace.getTransformedPoint(
      centerWorld,
      object.transform,
      camera
    )

    // Calculate current angle in screen space
    const currentAngle = this.screenSpace.getScreenAngle(
      centerScreen,
      currentScreenPos
    )
    let deltaAngle = currentAngle - this.initialScreenAngle

    // Normalize angle to -π to π
    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI

    // Apply smoothing for better UX
    const smoothing = 0.5
    object.transform.rotation =
      this.initialTransform.rotation + deltaAngle * smoothing
  }

  /**
   * Handle scaling in screen space
   */
  private handleScale(
    object: BaseObject,
    currentScreenPos: Position,
    camera: Camera
  ): void {
    if (!this.initialScreenDistance || !this.initialTransform) return

    // Get center in screen space
    const centerWorld = object.transform.position
    const centerScreen = this.screenSpace.getTransformedPoint(
      centerWorld,
      object.transform,
      camera
    )

    // Calculate scale factor from screen distances
    const currentDistance = this.screenSpace.getScreenDistance(
      centerScreen,
      currentScreenPos
    )
    const scaleFactor = currentDistance / this.initialScreenDistance

    console.debug("[TransformManager] Scaling:", {
      initialDistance: this.initialScreenDistance,
      currentDistance,
      scaleFactor,
    })

    // Calculate and clamp new scale
    let newScale = this.initialTransform.scale * scaleFactor
    newScale = Math.max(0.1, Math.min(5, newScale))
    object.transform.scale = newScale
  }

  /**
   * Handle flipping in screen space
   */
  private handleFlip(
    object: BaseObject,
    currentScreenPos: Position,
    camera: Camera
  ): void {
    if (!this.initialTransform || !this.lastScreenPos) return

    const isHorizontalControl =
      this.activeControlPoint === ControlPointType.MiddleLeft ||
      this.activeControlPoint === ControlPointType.MiddleRight

    if (!isHorizontalControl) return

    // Get center in screen space
    const centerWorld = object.transform.position
    const centerScreen = this.screenSpace.getTransformedPoint(
      centerWorld,
      object.transform,
      camera
    )

    // Check if we've crossed the center point
    const initDir = this.lastScreenPos.x - centerScreen.x
    const currentDir = currentScreenPos.x - centerScreen.x

    if (Math.sign(initDir) !== Math.sign(currentDir)) {
      object.transform.isFlipped = !object.transform.isFlipped
    }
  }

  endDrag(): void {
    this.cancelRender()

    if (this.isDragging && this.onTransformEnd) {
      this.onTransformEnd()
    }

    this.isDragging = false
    this.lastScreenPos = null
    this.activeControlPoint = ControlPointType.None
    this.initialTransform = null
    this.initialScreenAngle = null
    this.initialScreenDistance = null
  }

  setCallbacks(callbacks: {
    onRender: () => void
    onTransformEnd: () => void
  }) {
    this.renderCallback = callbacks.onRender
    this.onTransformEnd = callbacks.onTransformEnd
  }

  private isScaleHandle(controlPoint: ControlPointType): boolean {
    return [
      ControlPointType.TopLeft,
      ControlPointType.TopCenter,
      ControlPointType.TopRight,
      ControlPointType.MiddleRight,
      ControlPointType.BottomRight,
      ControlPointType.BottomCenter,
      ControlPointType.BottomLeft,
      ControlPointType.MiddleLeft,
    ].includes(controlPoint)
  }

  private requestRender(): void {
    if (this.renderCallback) {
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.rafId = requestAnimationFrame(this.renderCallback)
    }
  }

  private cancelRender(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getCursorStyle(controlPoint: ControlPointType): string {
    return this.controlPointManager.getCursorStyle(controlPoint)
  }
}

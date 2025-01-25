import { ScreenSpaceSystem } from "../core/screen-space"
import {
  Bounds,
  Camera,
  CanvasObject,
  CanvasObjectType,
  ControlPointType,
  Position,
  Transform,
} from "@/types"

export abstract class BaseObject implements CanvasObject {
  id: string
  type: CanvasObjectType
  transform: Transform
  selected: boolean
  protected screenSpace: ScreenSpaceSystem

  protected static MIN_HIT_TARGET_SIZE = 20

  constructor(type: CanvasObjectType, position: Position) {
    this.id = Date.now().toString()
    this.type = type
    this.transform = {
      position,
      rotation: 0,
      // scale: 1,
      scale: { x: 1, y: 1 },
      isFlipped: false,
    }
    this.selected = false
    this.screenSpace = new ScreenSpaceSystem()
  }

  /**
   * Test if a screen coordinate point intersects with this object
   */
  containsPoint(screenPoint: Position, camera: Camera): boolean {
    // If selected, check control points first
    if (this.selected) {
      const controlPoint = this.getControlPointAtPosition(screenPoint, camera)
      if (controlPoint !== ControlPointType.None) {
        return true
      }
    }

    // Convert screen point to local object space
    const localPoint = this.screenSpace.screenToLocalSpace(
      screenPoint,
      this.transform,
      camera
    )

    // Get local bounds
    const bounds = this.getBounds()

    // Handle minimum hit target size
    const objectWidth = bounds.right - bounds.left
    const objectHeight = bounds.bottom - bounds.top
    const minScreenSize = BaseObject.MIN_HIT_TARGET_SIZE / camera.zoom

    if (objectWidth < minScreenSize || objectHeight < minScreenSize) {
      // For small objects, use circular hit area
      const centerX = (bounds.left + bounds.right) / 2
      const centerY = (bounds.top + bounds.bottom) / 2

      const dx = localPoint.x - centerX
      const dy = localPoint.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      const hitRadius = Math.max(
        minScreenSize / 2,
        Math.max(objectWidth, objectHeight) / 2
      )

      return distance <= hitRadius
    }

    // Normal bounds check with padding
    const padding = minScreenSize / 4
    return (
      localPoint.x >= bounds.left - padding &&
      localPoint.x <= bounds.right + padding &&
      localPoint.y >= bounds.top - padding &&
      localPoint.y <= bounds.bottom + padding
    )
  }

  /**
   * Get control point at screen position
   */
  abstract getControlPointAtPosition(
    screenPoint: Position,
    camera: Camera
  ): ControlPointType

  /**
   * Get object bounds in local space
   */
  abstract getBounds(): Bounds

  /**
   * Render object
   */
  abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void

  /**
   * Get world transform
   */
  getTransform(): Transform {
    return {
      position: { ...this.transform.position },
      rotation: this.transform.rotation,
      scale: { ...this.transform.scale },
      isFlipped: this.transform.isFlipped,
    }
  }

  /**
   * Set world transform
   */
  setTransform(transform: Transform): void {
    this.transform = {
      position: { ...transform.position },
      rotation: transform.rotation,
      scale: { ...transform.scale },
      isFlipped: transform.isFlipped,
    }
  }

  /**
   * Helper to convert screen point to local object space
   */
  protected screenToLocal(point: Position, camera: Camera): Position {
    return this.screenSpace.screenToLocalSpace(point, this.transform, camera)
  }

  /**
   * Helper to get screen space bounds
   */
  protected getScreenBounds(camera: Camera): Bounds {
    return this.screenSpace.getScreenBounds(
      this.getBounds(),
      this.transform,
      camera
    )
  }
}

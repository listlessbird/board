/**
 * Manages viewport calculations and object culling for the infinite canvas
 */

import { CoordinateSystem } from "@/lib/canvas/core/coordinate-system"
import { BaseObject } from "@/lib/canvas/objects/base"
import {
  Camera,
  Position,
  ViewPortBounds,
  ViewPortManagerOptions,
} from "@/types"

export class ViewportManager {
  private coordinateSystem: CoordinateSystem
  private cullingMargin: number
  private currentBounds: ViewPortBounds | null = null
  private debug: boolean

  private lastCameraState: {
    x: number
    y: number
    zoom: number
  } | null = null
  private lastDimensions: {
    width: number
    height: number
  } | null = null

  constructor(options: ViewPortManagerOptions = {}) {
    this.coordinateSystem = new CoordinateSystem()
    this.cullingMargin = options.cullingMargin ?? 100
    this.debug = options.debug ?? false
  }

  /**
   * Gets the current visilbe area in world coordinates
   */
  getVisibleArea(
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
  ): ViewPortBounds {
    // Check if camera and dimensions haven't changed
    if (
      this.currentBounds &&
      this.lastCameraState &&
      this.lastDimensions &&
      this.lastCameraState.x === camera.x &&
      this.lastCameraState.y === camera.y &&
      this.lastCameraState.zoom === camera.zoom &&
      this.lastDimensions.width === canvasWidth &&
      this.lastDimensions.height === canvasHeight
    ) {
      if (this.debug) {
        console.debug("[ViewportManager] Skipping update - no changes detected")
      }
      return this.currentBounds
    }

    // Update tracking state
    this.lastCameraState = {
      x: camera.x,
      y: camera.y,
      zoom: camera.zoom,
    }
    this.lastDimensions = {
      width: canvasWidth,
      height: canvasHeight,
    }

    const bounds = this.coordinateSystem.getVisibleBounds(
      camera,
      canvasWidth,
      canvasHeight
    )

    const cullingMarginWorld = this.cullingMargin / camera.zoom

    const extendedBounds = {
      top: bounds.top - cullingMarginWorld,
      left: bounds.left - cullingMarginWorld,
      right: bounds.right + cullingMarginWorld,
      bottom: bounds.bottom + cullingMarginWorld,
      width: bounds.width + cullingMarginWorld * 2,
      height: bounds.height + cullingMarginWorld * 2,
    } satisfies ViewPortBounds

    this.currentBounds = extendedBounds

    if (this.debug) {
      console.debug("ViewportManager: visible area", {
        camera,
        originalBounds: bounds,
        extendedBounds,
        cullingMarginWorld,
      })
    }

    return extendedBounds
  }

  /**
   * Checks if an object is within the current visible area
   */
  isObjectVisible(obj: BaseObject): boolean {
    if (!this.currentBounds) return false

    const bounds = obj.getBounds()
    const { position } = obj.transform

    const worldBounds = {
      left: position.x + bounds.left,
      right: position.x + bounds.right,
      top: position.y + bounds.top,
      bottom: position.y + bounds.bottom,
    }

    const isVisible =
      worldBounds.right >= this.currentBounds.left &&
      worldBounds.left <= this.currentBounds.right &&
      worldBounds.bottom >= this.currentBounds.top &&
      worldBounds.top <= this.currentBounds.bottom

    if (this.debug) {
      // console.debug("[ViewportManager] Object Visibility Check:", {
      //   objectId: obj.id,
      //   worldBounds,
      //   viewportBounds: this.currentBounds,
      //   isVisible,
      // })
    }

    return isVisible
  }

  /**
   * Get the set of objects that need to be rendered
   */
  getVisibleObjects<T extends BaseObject>(objects: T[]): T[] {
    if (!this.currentBounds) return []

    const visible = objects.filter((o) => this.isObjectVisible(o))

    if (this.debug) {
      // console.debug("[ViewportManager] Visible Objects:", {
      //   total: objects.length,
      //   visible: visible.length,
      //   cullRate: (1 - visible.length / objects.length) * 100,
      //   renderRate: (visible.length / objects.length) * 100,
      // })
    }

    return visible
  }

  updateViewPort(
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
  ): ViewPortBounds {
    return this.getVisibleArea(camera, canvasWidth, canvasHeight)
  }

  screenToWorld(point: Position, camera: Camera): Position {
    return this.coordinateSystem.screenToWorld(point, camera)
  }

  worldToScreen(point: Position, camera: Camera): Position {
    return this.coordinateSystem.worldToScreen(point, camera)
  }
}

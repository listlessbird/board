import { Camera, Position, ViewPortBounds } from "@/types"

export class CoordinateSystem {
  private dpr

  constructor() {
    this.dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1
  }

  /**
   * Converts a point from screen coordinates to world coordinates
   * @param point Screen Coordinates
   * @param camera Current camera state
   */
  screenToWorld(point: Position, camera: Camera): Position {
    const dprAdjustedX = point.x * this.dpr
    const dprAdjustedY = point.y * this.dpr

    return {
      x: (dprAdjustedX - camera.x) / camera.zoom,
      y: (dprAdjustedY - camera.y) / camera.zoom,
    }
  }

  /**
   * Converts a point from world coordinates to screen coordinates
   * @param point World Coordinates
   * @param camera Current camera state
   */
  worldToScreen(point: Position, camera: Camera): Position {
    const screenX = point.x * camera.zoom + camera.x
    const screenY = point.y * camera.zoom + camera.y

    return {
      x: screenX / this.dpr,
      y: screenY / this.dpr,
    }
  }

  /**
   * Gets the visible bounds in world coordinates
   * @param camera Current camera state
   * @param canvasWidth Width of the canvas in px
   * @param canvasHeight Height of the canvas in px
   */
  getVisibleBounds(
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
  ): ViewPortBounds {
    const topLeft = this.screenToWorld({ x: 0, y: 0 }, camera)
    const bottomRight = this.screenToWorld(
      { x: canvasWidth, y: canvasHeight },
      camera
    )

    return {
      top: topLeft.y,
      left: topLeft.x,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }

  getGridCellSize(zoom: number, baseGridSize: number = 10): number {
    const scaled = baseGridSize / zoom

    const log10 = Math.log10(scaled)
    const exp = Math.floor(log10)
    const base = Math.pow(10, exp)

    if (scaled < base * 2) return base
    if (scaled < base * 5) return base * 2

    return base * 5
  }

  snapToGrid(point: Position, gridSize: number): Position {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    }
  }

  //   update internal dpr value when window dpr changes
  updateDpr(): void {
    if (typeof window !== "undefined") {
      this.dpr = window.devicePixelRatio || 1
    }
  }

  getDpr(): number {
    return this.dpr
  }
}

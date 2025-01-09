import { Bounds, Camera, Position, Transform } from "@/types"

export class ScreenSpaceSystem {
  /**
   * Converts a point from screen coordinates to canvas space
   * Accounts for DPI scaling
   */
  screenToCanvas(point: Position): Position {
    const dpr = window.devicePixelRatio || 1
    return {
      x: point.x * dpr,
      y: point.y * dpr,
    }
  }

  /**
   * Converts a point from canvas space to screen coordinates
   */
  canvasToScreen(point: Position): Position {
    const dpr = window.devicePixelRatio || 1
    return {
      x: point.x / dpr,
      y: point.y / dpr,
    }
  }

  /**
   * Get the transformed position of a point in screen space
   * This is used for hit testing and control point positioning
   */
  getTransformedPoint(
    point: Position,
    transform: Transform,
    camera: Camera
  ): Position {
    const dx = point.x - transform.position.x
    const dy = point.y - transform.position.y

    const cos = Math.cos(-transform.rotation)
    const sin = Math.sin(-transform.rotation)
    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos

    const sx = rx / (transform.scale * (transform.isFlipped ? -1 : 1))
    const sy = ry / transform.scale

    return {
      x: sx * camera.zoom + camera.x,
      y: sy * camera.zoom + camera.y,
    }
  }

  /**
   * Get screen space bounds for an object
   */
  getScreenBounds(
    bounds: Bounds,
    transform: Transform,
    camera: Camera
  ): Bounds {
    const points = [
      { x: bounds.left, y: bounds.top },
      { x: bounds.right, y: bounds.top },
      { x: bounds.right, y: bounds.bottom },
      { x: bounds.left, y: bounds.bottom },
    ]

    const transformed = points.map((p) =>
      this.getTransformedPoint(p, transform, camera)
    )

    return {
      left: Math.min(...transformed.map((p) => p.x)),
      right: Math.max(...transformed.map((p) => p.x)),
      top: Math.min(...transformed.map((p) => p.y)),
      bottom: Math.max(...transformed.map((p) => p.y)),
    }
  }

  /**
   * Get the distance between two points in screen space
   */
  getScreenDistance(p1: Position, p2: Position): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get angle between two points in screen space
   */
  getScreenAngle(center: Position, point: Position): number {
    return Math.atan2(point.y - center.y, point.x - center.x)
  }

  /**
   * Convert a screen point to local object space
   */
  screenToLocalSpace(
    point: Position,
    transform: Transform,
    camera: Camera
  ): Position {
    const cx = (point.x - camera.x) / camera.zoom
    const cy = (point.y - camera.y) / camera.zoom

    const dx = cx - transform.position.x
    const dy = cy - transform.position.y

    const cos = Math.cos(-transform.rotation)
    const sin = Math.sin(-transform.rotation)
    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos

    return {
      x: rx / (transform.scale * (transform.isFlipped ? -1 : 1)),
      y: ry / transform.scale,
    }
  }
}

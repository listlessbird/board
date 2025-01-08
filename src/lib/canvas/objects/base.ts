import {
  Bounds,
  CanvasObject,
  CanvasObjectType,
  ControlPointType,
  Position,
  Transform,
  Transformable,
} from "@/types"

export abstract class BaseObject implements CanvasObject, Transformable {
  id: string
  type: CanvasObjectType
  transform: Transform
  selected: boolean

  constructor(type: CanvasObjectType, position: Position) {
    this.id = Date.now().toString()
    this.type = type
    this.transform = {
      position,
      rotation: 0,
      scale: 1,
      isFlipped: false,
    }
    this.selected = false
  }

  getTransform(): Transform {
    return {
      position: { ...this.transform.position },
      rotation: this.transform.rotation,
      scale: this.transform.scale,
      isFlipped: this.transform.isFlipped,
    }
  }

  setTransform(transform: Transform): void {
    this.transform = {
      position: { ...transform.position },
      rotation: transform.rotation,
      scale: transform.scale,
      isFlipped: transform.isFlipped,
    }
  }

  transformPointToLocal(point: Position, cameraZoom: number): Position {
    const dx = point.x - this.transform.position.x
    const dy = point.y - this.transform.position.y

    const cos = Math.cos(-this.transform.rotation)
    const sin = Math.sin(-this.transform.rotation)
    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos

    const scaleX =
      this.transform.scale * (this.transform.isFlipped ? -1 : 1) * cameraZoom
    const scaleY = this.transform.scale * cameraZoom

    return {
      x: rx / scaleX,
      y: ry / scaleY,
    }
  }

  protected static MIN_HIT_TARGET_SIZE = 20
  containsPoint(point: Position, cameraZoom: number): boolean {
    console.debug("BaseObject.containsPoint", {
      point,
      cameraZoom,
      transform: this.transform,
      id: this.id,
      type: this.type,
    })
    if (this.selected) {
      const controlPoint = this.getControlPointAtPosition(point, cameraZoom)
      if (controlPoint !== ControlPointType.None) {
        return true
      }
    }

    const local = this.transformPointToLocal(point, cameraZoom)
    console.debug("After transformPointToLocal", {
      local,
      bounds: this.getBounds(),
      id: this.id,
    })

    const bounds = this.getBounds()

    const inBounds =
      local.x >= bounds.left &&
      local.x <= bounds.right &&
      local.y >= bounds.top &&
      local.y <= bounds.bottom

    console.debug("Bounds check result", {
      inBounds,
      local,
      bounds,
      id: this.id,
      checks: {
        left: `${local.x} >= ${bounds.left} = ${local.x >= bounds.left}`,
        right: `${local.x} <= ${bounds.right} = ${local.x <= bounds.right}`,
        top: `${local.y} >= ${bounds.top} = ${local.y >= bounds.top}`,
        bottom: `${local.y} <= ${bounds.bottom} = ${local.y <= bounds.bottom}`,
      },
    })

    if (inBounds) return true

    // what if the smaller? use distance based hit testing

    const objectWidth = bounds.right - bounds.left
    const objectHeight = bounds.bottom - bounds.top

    const minWorldSize = BaseObject.MIN_HIT_TARGET_SIZE / cameraZoom

    if (objectWidth < minWorldSize || objectHeight < minWorldSize) {
      const d = Math.sqrt(Math.pow(local.x, 2) + Math.pow(local.y, 2))

      const hitRadius = Math.max(
        minWorldSize / 2,
        Math.min(objectWidth, objectHeight) / 2
      )

      return d <= hitRadius
    }

    return false
  }

  abstract render(ctx: CanvasRenderingContext2D, cameraZoom: number): void
  abstract getBounds(): Bounds

  abstract getControlPointAtPosition(
    point: Position,
    cameraZoom: number
  ): ControlPointType
}

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

  abstract render(ctx: CanvasRenderingContext2D): void
  abstract getBounds(): Bounds
  abstract containsPoint(point: Position): boolean
  abstract transformPointToLocal(point: Position): Position
  abstract getControlPointAtPosition(point: Position): ControlPointType
}

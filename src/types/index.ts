export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Transform {
  position: Position
  rotation: number
  scale: number
  isFlipped: boolean
}

export interface Bounds {
  top: number
  left: number
  right: number
  bottom: number
}

// for now only support text and image
export type CanvasObjectType = "text" | "image"

export interface CanvasObject {
  id: string
  type: CanvasObjectType
  transform: Transform
  selected: boolean
}

export enum ControlPointType {
  None = -1,
  TopLeft = 0,
  TopCenter = 1,
  TopRight = 2,
  MiddleRight = 3,
  BottomRight = 4,
  BottomCenter = 5,
  BottomLeft = 6,
  MiddleLeft = 7,
  Rotation = 8,
}

export interface ControlPointStyle {
  size: number
  fillStyle: string
  strokeStyle: string
  lineWidth: number
}

export interface Transformable {
  getBounds(): Bounds
  getTransform(): Transform
  setTransform(transform: Transform): void
  transformPointToLocal(point: Position): Position
  getControlPointAtPosition(point: Position): ControlPointType
}

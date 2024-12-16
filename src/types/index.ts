import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"

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

export interface Editable {
  startEditing(): void
  stopEditing(): void
  isEditing: boolean
  onKeyDown(e: KeyboardEvent): void
}

export type TextStyle = {
  font: string
  // valid color name or hex code
  color: string
  // in px
  size: number
  weight?: "normal" | "bold"
  italic?: boolean
}

export type ObjectTypeMap = {
  text: TextObject
  image: never
}

export type ToolbarActionHandler<T extends BaseObject = BaseObject> = (
  obj: T
) => void

export interface ToolbarAction<T extends BaseObject = BaseObject> {
  id: string
  label: string
  icon?: React.ComponentType
  // determines if the action is visible based on the object (e.g. dont need to show font size for image)
  isVisible?: (obj: T) => boolean
  // action is part of a group
  group?: string

  handler: ToolbarActionHandler<T>
  // keyboard shortcut
  shortcut?: string
  // order in group
  order?: number
  // action is global (e.g. add/delete object)
  global?: boolean
}

export interface ToolbarActionGroup {
  id: string
  label: string
  order: number
}

export type ToolbarActionRegistry = {
  global: ToolbarAction[]
  objectSpecific: {
    [K in keyof ObjectTypeMap]: ToolbarAction[]
  }
}

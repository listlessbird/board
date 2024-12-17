import { BaseObject } from "@/lib/canvas/objects/base"
import { ImageObject } from "@/lib/canvas/objects/image"
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
  image: ImageObject
}

interface BaseToolbarAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  // action is part of a group
  group?: string
  order?: number
  // keyboard shortcut
  shortcut?: string
}

export interface GlobalToolbarAction extends BaseToolbarAction {
  global: true
  handler: () => void
}

export interface ObjectToolbarAction<T extends BaseObject = BaseObject>
  extends BaseToolbarAction {
  global?: false
  isVisible?: (obj: T) => boolean
  handler: (obj: T) => void
}

export type ToolbarAction<T extends BaseObject = BaseObject> =
  | GlobalToolbarAction
  | ObjectToolbarAction<T>
export interface ToolbarActionGroup {
  id: string
  label: string
  order: number
}

export type ToolbarActionRegistry = {
  global: GlobalToolbarAction[]
  objectSpecific: {
    [K in keyof ObjectTypeMap]: ObjectToolbarAction[]
  }
}

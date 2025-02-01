import { BaseObject } from "@/lib/canvas/objects/base"
import { ImageObject } from "@/lib/canvas/objects/image"
import { TextObject } from "@/lib/canvas/objects/text"
import { SelectionManager } from "@/lib/canvas/selection"

export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Camera {
  x: number
  y: number
  zoom: number
  isDragging: boolean
  lastMousePosition: Position | null
}

export interface CanvasControllerOptions {
  selectionManager?: SelectionManager
  initialZoom?: number
  gridSize?: number
  /*
    ┌───────────────────────────┐
    │     Culling Margin        │
    │  ┌─────────────────────┐  │
    │  │                     │  │
    │  │    Visible          │  │
    │  │    Viewport         │  │
    │  │                     │  │
    │  └─────────────────────┘  │
    │                           │
    └───────────────────────────┘
*/
  cullingMargin?: number
  minZoom?: number
  maxZoom?: number
  animateZoom?: boolean
  zoomAnimationDuration?: number
  debug?: boolean
}

export interface ViewPortBounds {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export type ViewPortManagerOptions = {
  cullingMargin?: number
  debug?: boolean
}

export interface GridOptions {
  baseGridSize?: number
  primaryInterval?: number
  secondaryInterval?: number
  primaryColor?: string
  secondaryColor?: string
  axisColor?: string
}
export type CanvasEvents = {
  // retarded editor changes render string to normal property
  "render:": () => void
  "objects:change": (objects: BaseObject[]) => void
  "selection:change": (selected: BaseObject | null) => void
  "camera:change": (camera: Camera) => void
  "viewport:change": (bounds: ViewPortBounds) => void
  "zoom:change": (zoom: number) => void
  "error:": (error: Error) => void
}

export interface Transform {
  position: Position
  rotation: number
  // scale: number
  scale: {
    x: number
    y: number
  }
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
  getControlPointAtPosition(
    screenPoint: Position,
    camera: Camera
  ): ControlPointType
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

export type StyleRange = {
  start: number
  end: number
  style: Partial<TextStyle>
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

export interface InteractionState {
  selectedObject: BaseObject | null
  isDragging: boolean
  lastMousePosition: Position | null
  activeControlPoint: ControlPointType
  initialTransform: Transform | null
}

export interface CommandMeta {
  timestamp: number
  debug?: Record<string, unknown>
}

export interface InteractionCommand {
  execute(): void
  undo(): void
  redo(): void
  readonly type: string
  readonly meta: CommandMeta
  readonly targetId: string
}

export interface InteractionCommandProcessorOpts {
  debug?: boolean
  maxUndoStackSize?: number
}

export interface ZoomAnimation {
  // initial zoom
  startZoom: number
  targetZoom: number
  // init camera x
  startX: number
  targetX: number
  startY: number
  targetY: number
  startTime: number
  duration: number
  worldPos: Position
}

export type CropMode = "rectangular" | "circular"

export interface CropBoundsMap {
  rectangular: {
    x: number
    y: number
    width: number
    height: number
  }
  circular: {
    centerX: number
    centerY: number
    radius: number
  }
}

export type CropBounds<T extends CropMode> = CropBoundsMap[T]

export type CropState<T extends CropMode> = {
  mode: T
  bounds: CropBounds<T>
  aspectRatio?: number
  isDragging: boolean
  activeHandle: CropHandle | null
  initialBounds?: CropBounds<T>
}

export type CropHandle =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "topLeft"
  | "topRight"
  | "bottomRight"
  | "bottomLeft"
  | "move"
  | "radius"

export interface CropperOptions {
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: number
  initialMode?: CropMode
}

export interface CropResult<T extends CropMode> {
  mode: T
  bounds: CropBounds<T>
  aspectRatio?: number
}

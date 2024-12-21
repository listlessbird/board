import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import {
  CanvasInteractionHandlerResult,
  ControlPointType,
  InteractionHandler,
  MouseInteractionContext,
} from "@/types"

export class RootTransformInteraction implements InteractionHandler {
  id = "transform"
  priority: number = 3
  isEnabled: boolean = true
  private isDragging: boolean = false

  constructor(
    private transformManager: TransformManager,
    private selectionManager: SelectionManager,
    private onTransformEnd: () => void
  ) {}

  canHandle(obj: BaseObject): boolean {
    return obj instanceof BaseObject && obj.selected
  }

  getCursorStyle(controlPoint: ControlPointType): string {
    if (controlPoint !== ControlPointType.None) {
      return this.transformManager.getCursorStyle(controlPoint)
    }
    return "default"
  }

  handleMouseDown(
    e: MouseEvent,
    obj: BaseObject,
    context: MouseInteractionContext
  ): CanvasInteractionHandlerResult {
    const { position, controlPoint } = context

    if (controlPoint !== ControlPointType.None || obj.containsPoint(position)) {
      this.transformManager.startDrag(position, controlPoint, obj)
      this.isDragging = true
      return { handled: true, stopPropagation: true }
    }

    return { handled: false, stopPropagation: false }
  }

  handleMouseMove(
    e: MouseEvent,
    obj: BaseObject,
    context: MouseInteractionContext
  ): CanvasInteractionHandlerResult {
    const { position } = context

    if (this.isDragging) {
      this.transformManager.drag(obj, position)
      return { handled: true, stopPropagation: true }
    }

    return { handled: false, stopPropagation: false }
  }

  handleMouseUp(e: MouseEvent): CanvasInteractionHandlerResult {
    if (this.isDragging) {
      this.transformManager.endDrag()
      this.onTransformEnd()
      this.isDragging = false
      return { handled: true, stopPropagation: true }
    }
    return { handled: false, stopPropagation: false }
  }

  onDisable(): void {
    if (this.isDragging) {
      this.transformManager.endDrag()
      this.isDragging = false
    }
  }
}

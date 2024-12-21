import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import {
  CanvasInteractionHandlerResult,
  InteractionHandler,
  MouseInteractionContext,
} from "@/types"

export class SelectInteraction implements InteractionHandler {
  id: string = "select"
  priority: number = 1
  isEnabled: boolean = true

  constructor(private selectionManager: SelectionManager) {}

  canHandle(obj: BaseObject): boolean {
    return true
  }

  handleMouseDown(
    e: MouseEvent,
    obj: BaseObject,
    context: MouseInteractionContext
  ): CanvasInteractionHandlerResult {
    const { position } = context

    if (obj.containsPoint(position)) {
      this.selectionManager.select(obj)
      return { handled: true, stopPropagation: false }
    }

    this.selectionManager.clearSelection()
    return { handled: true, stopPropagation: false }
  }

  handleKeyDown(
    e: KeyboardEvent,
    obj: BaseObject | null
  ): CanvasInteractionHandlerResult {
    //   TODO: implement multi select
    return { handled: false, stopPropagation: false }
  }
}

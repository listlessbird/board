import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import {
  CanvasInteractionHandlerResult,
  InteractionHandler,
  MouseInteractionContext,
} from "@/types"

export class SelectInteraction implements InteractionHandler {
  id: string = "select"
  priority: number = 0
  isEnabled: boolean = true

  constructor(private selectionManager: SelectionManager) {}

  canHandle(obj: BaseObject): boolean {
    console.log("[DEBUG] SelectInteraction canHandle:", this.id)
    return true
  }

  handleMouseDown(
    e: MouseEvent,
    obj: BaseObject,
    context: MouseInteractionContext
  ): CanvasInteractionHandlerResult {
    const { position } = context
    console.log("[DEBUG] SelectInteraction handleMouseDown", {
      obj,
      position,
    })
    if (obj.containsPoint(position)) {
      console.log("[DEBUG] SelectInteraction selecting object:", obj.type)

      this.selectionManager.select(obj)
      return { handled: true, stopPropagation: false }
    }
    console.log("[DEBUG] SelectInteraction clearing selection")

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

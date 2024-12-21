import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import {
  CanvasInteractionHandlerResult,
  InteractionHandler,
  KeyCombo,
  MouseInteractionContext,
  ShortcutHandler,
} from "@/types"

export class TextInteraction implements InteractionHandler {
  id: string = "text"
  priority: number = 2
  isEnabled: boolean = true

  private currentlyEditing: TextObject | null = null

  constructor(private onTextChange: () => void) {}

  canHandle(obj: BaseObject): boolean {
    return obj instanceof TextObject
  }

  handleDoubleClick(
    e: MouseEvent,
    obj: BaseObject,
    context: MouseInteractionContext
  ): CanvasInteractionHandlerResult {
    if (!(obj instanceof TextObject)) {
      return { handled: false, stopPropagation: false }
    }

    // another text object is being edited
    if (this.currentlyEditing && this.currentlyEditing !== obj) {
      this.currentlyEditing.stopEditing()
    }

    obj.startEditing()
    this.currentlyEditing = obj
    this.onTextChange()

    return { handled: true, stopPropagation: true }
  }

  shortcuts: ShortcutHandler[] = [
    {
      combo: { key: "b", ctrl: true },
      isEnabled: (obj) => obj instanceof TextObject,
      handle: (obj) => {
        if (!(obj instanceof TextObject)) return

        obj.setStyleForSelection({
          weight: obj.style.weight === "bold" ? "normal" : "bold",
        })
        this.onTextChange()
      },
    },
    {
      combo: { key: "i", ctrl: true },
      isEnabled: (obj) => obj instanceof TextObject,
      handle: (obj) => {
        if (!(obj instanceof TextObject)) return

        obj.setStyleForSelection({
          italic: !obj.style.italic,
        })
        this.onTextChange()
      },
    },
    {
      combo: { key: "Escape" },
      isEnabled: (obj) => obj instanceof TextObject,
      handle: (obj) => {
        if (!(obj instanceof TextObject)) return

        obj.stopEditing()
        this.currentlyEditing = null
        this.onTextChange()
      },
    },
  ]

  handleMouseDown(
    e: MouseEvent,
    obj: BaseObject,
    context: MouseInteractionContext
  ): CanvasInteractionHandlerResult {
    if (!(obj instanceof TextObject)) {
      return { handled: false, stopPropagation: false }
    }

    // clicked outside the text object, so stop editing
    if (this.currentlyEditing && this.currentlyEditing !== obj) {
      this.currentlyEditing.stopEditing()
      this.currentlyEditing = null
      this.onTextChange()
    }

    return { handled: true, stopPropagation: false }
  }

  handleKeyDown(
    e: KeyboardEvent,
    obj: BaseObject | null
  ): CanvasInteractionHandlerResult {
    const shortcut = this.shortcuts.find(
      (s) => this.matchesKeyCombo(e, s.combo) && s.isEnabled(obj)
    )

    if (shortcut) {
      shortcut.handle(obj)
      return { handled: true, stopPropagation: true }
    }

    if (obj instanceof TextObject && obj.isEditing) {
      obj.onKeyDown(e)
      this.onTextChange()
      return { handled: true, stopPropagation: true }
    }

    return { handled: false, stopPropagation: false }
  }
  private matchesKeyCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
    return (
      e.key.toLowerCase() === combo.key.toLowerCase() &&
      !!e.ctrlKey === !!combo.ctrl &&
      !!e.altKey === !!combo.alt &&
      !!e.shiftKey === !!combo.shift &&
      !!e.metaKey === !!combo.meta
    )
  }

  onDisable(): void {
    if (this.currentlyEditing) {
      this.currentlyEditing.stopEditing()
      this.currentlyEditing = null
    }
  }
}

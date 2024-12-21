import { BaseObject } from "@/lib/canvas/objects/base"
import {
  ControlPointType,
  InteractionHandler,
  InteractionState,
  KeyCombo,
  MouseInteractionContext,
  Position,
} from "@/types"

export class InteractionManager {
  private handlers: InteractionHandler[] = []
  private activeHandler: InteractionHandler | null = null
  private state: InteractionState = {
    isDragging: false,
    activeControlPoint: ControlPointType.None,
    initialTransform: null,
    initialAngle: null,
    initialDistance: null,
    lastMousePosition: null,
  }

  constructor(interactionHandlers: InteractionHandler[]) {
    this.handlers = interactionHandlers.sort((a, b) => a.priority - b.priority)
  }

  handleMouseDown(
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    findObjectAtPoint: (pos: Position) => BaseObject | null
  ): void {
    this.handleMouseEvent("handleMouseDown", e, canvas, findObjectAtPoint)
  }

  handleMouseMove(
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    findObjectAtPoint: (pos: Position) => BaseObject | null
  ): void {
    this.handleMouseEvent("handleMouseMove", e, canvas, findObjectAtPoint)
  }

  handleMouseUp(
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    findObjectAtPoint: (pos: Position) => BaseObject | null
  ): void {
    this.handleMouseEvent("handleMouseUp", e, canvas, findObjectAtPoint)
  }

  handleKeyDown(e: KeyboardEvent, selectedObject: BaseObject): void {
    this.handleKeyboardEvent("handleKeyDown", e, selectedObject)
  }

  handleKeyUp(e: KeyboardEvent, selectedObject: BaseObject): void {
    this.handleKeyboardEvent("handleKeyUp", e, selectedObject)
    if (this.activeHandler) {
      this.activeHandler = null
    }
  }

  getCursorStyle(
    obj: BaseObject | null,
    controlPoint: ControlPointType
  ): string {
    if (!obj) return "default"

    if (this.activeHandler?.getCursorStyle) {
      return this.activeHandler.getCursorStyle(controlPoint)
    }

    for (const handler of this.handlers) {
      if (!handler.isEnabled || !handler.canHandle(obj)) continue
      if (handler.getCursorStyle) {
        return handler.getCursorStyle(controlPoint)
      }
    }

    return "default"
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

  private handleKeyboardEvent(
    eventName: keyof Pick<InteractionHandler, "handleKeyDown" | "handleKeyUp">,
    e: KeyboardEvent,
    selectedObject: BaseObject
  ): void {
    console.log(`[DEBUG] Event triggered: ${eventName}`, e)

    if (this.activeHandler) {
      const handle = this.activeHandler[eventName]
      if (handle) {
        console.log(
          `[DEBUG] Active handler found: ${this.activeHandler.constructor.name}`
        )
        const handled = handle.call(this.activeHandler, e, selectedObject)
        console.log(`[DEBUG] Active handler handled event: ${handled}`)
        if (handled) {
          e.preventDefault()
          return
        }
      }
    }

    for (const handler of this.handlers) {
      console.log(`[DEBUG] Checking handler: ${handler.constructor.name}`)
      if (!handler.isEnabled) {
        console.log(
          `[DEBUG] Skipping disabled handler: ${handler.constructor.name}`
        )
        continue
      }

      if (!handler.canHandle(selectedObject)) {
        console.log(
          `[DEBUG] Handler cannot handle selected object: ${handler.constructor.name}`
        )
        continue
      }

      const handlerFn = handler[eventName]
      if (!handlerFn) {
        console.log(
          `[DEBUG] Handler does not have method for event: ${eventName}`
        )
        continue
      }

      const matchesShortcut = handler.shortcuts?.some((shortcutHandler) =>
        this.matchesKeyCombo(e, shortcutHandler.combo)
      )
      console.log(
        `[DEBUG] Shortcut match for handler ${handler.constructor.name}: ${matchesShortcut}`
      )

      if (matchesShortcut) {
        const handled = handlerFn.call(handler, e, selectedObject)
        console.log(`[DEBUG] Handler processed event: ${handled}`)
        if (handled) {
          this.activeHandler = handler
          console.log(
            `[DEBUG] Active handler updated to: ${handler.constructor.name}`
          )
        }
        e.preventDefault()
        break
      }
    }

    console.log(`[DEBUG] Event processing completed: ${eventName}`)
  }
  private handleMouseEvent(
    eventName: keyof Pick<
      InteractionHandler,
      | "handleMouseDown"
      | "handleMouseMove"
      | "handleMouseUp"
      | "handleDoubleClick"
    >,
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    findObjectAtPoint: (pos: Position) => BaseObject | null
  ): void {
    const pos = this.getMousePos(e, canvas)
    // console.log(`[DEBUG] Mouse position:`, pos)

    const hitObject = findObjectAtPoint(pos)

    const controlPoint =
      hitObject?.getControlPointAtPosition(pos) ?? ControlPointType.None

    console.log(`[DEBUG] ${eventName}:`, {
      pos,
      hitObject: hitObject?.id,
      controlPoint,
      activeHandler: this.activeHandler?.id,
    })

    const context: MouseInteractionContext = {
      state: this.state,
      position: pos,
      object: hitObject,
      controlPoint,
    }

    if (eventName === "handleMouseDown") {
      this.activeHandler = null

      if (hitObject) {
        for (const handler of this.handlers) {
          if (!handler.isEnabled || !handler.canHandle(hitObject)) continue

          console.debug(`Trying to handle ${eventName} for ${handler.id}`)

          const handlerFn = handler[eventName]

          if (!handlerFn) continue

          const result = handlerFn.call(handler, e, hitObject, context)
          console.log(`[DEBUG] Handler ${handler.id} result:`, result)

          if (result.handled) {
            this.activeHandler = handler
            console.log(`[DEBUG] Active handler set to: ${handler.id}`)
            if (result.stopPropagation) break
          }
        }
      }
    }
    return
  }

  private getMousePos(e: MouseEvent, canvas: HTMLCanvasElement): Position {
    const rect = canvas.getBoundingClientRect()
    // const scaleX = canvas.width / rect.width
    // const scaleY = canvas.height / rect.height
    const dpr = window.devicePixelRatio || 1
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    }
  }

  private resetState(): void {
    this.state = {
      isDragging: false,
      activeControlPoint: ControlPointType.None,
      initialTransform: null,
      initialAngle: null,
      initialDistance: null,
      lastMousePosition: null,
    }
  }

  destroy(): void {
    this.handlers.forEach((h) => h.onDisable?.())
    this.handlers = []
    this.activeHandler = null
    this.resetState()
  }
}

import { CanvasInteractionCommandProcessor } from "@/lib/canvas/commands/processor"
import { SelectCommand } from "@/lib/canvas/commands/select-command"
import { TextEditCommand } from "@/lib/canvas/commands/text-edit-command"
import { TransformCommand } from "@/lib/canvas/commands/transform-command"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { createLogger } from "@/lib/utils"
import { ControlPointType, Position } from "@/types"

interface InteractionManagerOpts {
  canvas: HTMLCanvasElement
  selectionManager: SelectionManager
  transformManager: TransformManager
  getObjectAtPoint: (point: Position) => BaseObject | null
  onUpdate: () => void
  debug?: boolean
}

/**
 * handles all interactions with the canvas and convert them into commands
 */

export class InteractionManager {
  private commandProcessor: CanvasInteractionCommandProcessor
  private logger = createLogger("InteractionManager")
  private currentTransform: TransformCommand | null = null
  private isDragging: boolean = false
  private lastMousePosition: Position | null = null
  private activeControlPoint: ControlPointType = ControlPointType.None

  private abortController: AbortController
  constructor(private opts: InteractionManagerOpts) {
    this.commandProcessor = new CanvasInteractionCommandProcessor({
      debug: opts.debug,
      maxUndoStackSize: 100,
    })
    this.abortController = new AbortController()

    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleDoubleClick = this.handleDoubleClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)

    this.setupEventListeners()
  }

  getCursorStyle(
    obj: BaseObject | null,
    controlPoint: ControlPointType
  ): string {
    if (!obj) return "default"
    return this.opts.transformManager.getCursorStyle(controlPoint)
  }

  undo(): void {
    if (this.commandProcessor.canUndo()) {
      this.commandProcessor.undo()
      this.opts.onUpdate()
    }
  }

  redo(): void {
    if (this.commandProcessor.canRedo()) {
      this.commandProcessor.redo()
      this.opts.onUpdate()
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const position = this.getMousePosition(e)
    const hitObject = this.opts.getObjectAtPoint(position)

    this.logger.debug("Mouse Down Event", {
      position,
      hitObject: hitObject?.id,
    })

    if (hitObject) {
      const controlPoint = hitObject.getControlPointAtPosition(position)
      this.activeControlPoint = controlPoint

      //   selection
      if (controlPoint === ControlPointType.None) {
        const command = new SelectCommand(
          hitObject,
          this.opts.selectionManager,
          this.opts.debug
        )

        this.commandProcessor.execute(command)
      }

      if (hitObject.selected) {
        this.isDragging = true
        this.lastMousePosition = position
        this.opts.transformManager.startDrag(position, controlPoint, hitObject)

        this.currentTransform = new TransformCommand(
          hitObject,
          this.opts.transformManager,
          this.opts.debug
        )
      } else {
        const command = new SelectCommand(
          null,
          this.opts.selectionManager,
          this.opts.debug
        )

        this.commandProcessor.execute(command)
      }
    }
    this.opts.onUpdate()
  }

  private handleMouseMove(e: MouseEvent): void {
    const position = this.getMousePosition(e)

    if (this.isDragging && this.lastMousePosition) {
      const selectedObject = this.opts.selectionManager.getSelectedObjects()[0]

      if (selectedObject) {
        this.logger.debug("Dragging object", {
          position,
          lastPosition: this.lastMousePosition,
          objectId: selectedObject.id,
          isDragging: this.isDragging,
        })

        this.opts.transformManager.drag(selectedObject, position)
        this.opts.onUpdate()
      }
    }

    this.lastMousePosition = position
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.isDragging && this.currentTransform) {
      this.opts.transformManager.endDrag()
      this.commandProcessor.execute(this.currentTransform)
      this.currentTransform = null
    }

    this.isDragging = false
    this.lastMousePosition = null
    this.activeControlPoint = ControlPointType.None

    this.opts.onUpdate()
  }

  private handleDoubleClick(e: MouseEvent): void {
    const position = this.getMousePosition(e)

    const hitObject = this.opts.getObjectAtPoint(position)

    if (hitObject instanceof TextObject) {
      hitObject.startEditing()
      this.opts.onUpdate()
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        this.redo()
      } else {
        this.undo()
      }
      e.preventDefault()
      return
    }

    const selectedObject = this.opts.selectionManager.getSelectedObjects()[0]

    if (selectedObject instanceof TextObject) {
      selectedObject.onKeyDown(e)

      // create text edit command when done
      if (e.key === "Escape") {
        const command = new TextEditCommand(
          selectedObject,
          selectedObject.content,
          selectedObject.style,
          this.opts.debug
        )
        this.commandProcessor.execute(command)
      }
      this.opts.onUpdate()
    }
  }

  private setupEventListeners(): void {
    const canvas = this.opts.canvas
    const signal = this.abortController.signal

    this.logger.debug("Setting up event listeners")

    canvas.addEventListener("mousedown", this.handleMouseDown, { signal })
    canvas.addEventListener("mousemove", this.handleMouseMove, { signal })
    canvas.addEventListener("mouseup", this.handleMouseUp, { signal })
    canvas.addEventListener("dblclick", this.handleDoubleClick, { signal })
    canvas.addEventListener("keydown", this.handleKeyDown, { signal })

    document.addEventListener("mousemove", this.handleMouseMove, { signal })
    document.addEventListener("mouseup", this.handleMouseUp, { signal })

    if (this.opts.debug) {
      signal.addEventListener(
        "abort",
        () => {
          this.logger.debug("Event listeners aborted")
        },
        { once: true }
      )
    }
  }

  private getMousePosition(e: MouseEvent): Position {
    const rect = this.opts.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    }
  }

  destroy(): void {
    this.logger.debug("Destroying InteractionManager")

    this.abortController.abort()

    this.currentTransform = null
    this.isDragging = false
    this.lastMousePosition = null
    this.activeControlPoint = ControlPointType.None
  }
}

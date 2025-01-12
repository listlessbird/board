import { CanvasInteractionCommandProcessor } from "@/lib/canvas/commands/processor"
import { SelectCommand } from "@/lib/canvas/commands/select-command"
import { TextEditCommand } from "@/lib/canvas/commands/text-edit-command"
import { TransformCommand } from "@/lib/canvas/commands/transform-command"
import { CoordinateSystem } from "@/lib/canvas/core/coordinate-system"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { createLogger } from "@/lib/utils"
import { Camera, ControlPointType, Position } from "@/types"

interface InteractionManagerOpts {
  canvas: HTMLCanvasElement
  getObjects: () => BaseObject[]
  selectionManager: SelectionManager
  transformManager: TransformManager
  getObjectAtPoint: (point: Position) => BaseObject | null
  onUpdate: () => void
  camera: Camera
  debug?: boolean
}

/**
 * handles all interactions with the canvas and convert them into commands
 */

export class InteractionManager {
  commandProcessor: CanvasInteractionCommandProcessor
  private logger = createLogger("InteractionManager")
  private currentTransform: TransformCommand | null = null
  private isDragging: boolean = false
  private lastMousePosition: Position | null = null
  private activeControlPoint: ControlPointType = ControlPointType.None
  private coordinateSystem: CoordinateSystem
  private camera: Camera

  private abortController: AbortController
  constructor(private opts: InteractionManagerOpts) {
    console.log("[DEBUG] InteractionManager created")

    this.commandProcessor = new CanvasInteractionCommandProcessor({
      debug: opts.debug,
      maxUndoStackSize: 100,
    })

    this.camera = opts.camera
    this.coordinateSystem = new CoordinateSystem()

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
    const screenPosition = this.getMousePosition(e)

    const hitObject = this.opts.getObjectAtPoint(screenPosition)

    this.logger.debug("Mouse Down Event", {
      screenPosition,
      hitObject: hitObject?.id,
      selectedObjects: this.opts.selectionManager.getSelectedObjects(),
      zoom: this.camera.zoom,
    })

    if (hitObject) {
      let isSelected = this.opts.selectionManager.isSelected(hitObject)
      // debugger

      const controlPoint = hitObject.getControlPointAtPosition(
        screenPosition,
        this.camera
      )

      this.logger.debug("Control Point Detection", {
        controlPoint,
        isSelected,
        objectId: hitObject.id,
      })

      if (!isSelected) {
        const command = new SelectCommand(
          hitObject,
          this.opts.selectionManager,
          this.opts.debug
        )
        this.commandProcessor.execute(command)
      }

      isSelected = this.opts.selectionManager.isSelected(hitObject)

      this.logger.debug("Hit object eval 2", {
        controlPoint,
        isSelected,
        objectId: hitObject.id,
      })

      if (isSelected && controlPoint !== ControlPointType.None) {
        this.logger.debug("Starting transform interaction", {
          controlPoint,
          objectId: hitObject.id,
          isSelected: hitObject.selected,
        })

        this.isDragging = true
        this.lastMousePosition = screenPosition
        this.activeControlPoint = controlPoint

        this.opts.transformManager.startDrag(
          screenPosition,
          controlPoint,
          hitObject,
          this.camera
        )

        this.currentTransform = new TransformCommand(
          hitObject,
          this.opts.transformManager,
          this.opts.debug
        )

        this.logger.debug("Transform state initialized", {
          controlPoint: this.activeControlPoint,
          isDragging: this.isDragging,
          transformStarted: !!this.currentTransform,
        })
      } else {
        this.logger.debug("Starting regular drag", {
          objectId: hitObject.id,
          isSelected: hitObject.selected,
        })

        this.isDragging = true
        this.lastMousePosition = screenPosition
        this.activeControlPoint = ControlPointType.None

        this.opts.transformManager.startDrag(
          screenPosition,
          ControlPointType.None,
          hitObject,
          this.camera
        )

        this.currentTransform = new TransformCommand(
          hitObject,
          this.opts.transformManager,
          this.opts.debug
        )
      }
    } else {
      this.logger.debug("No object hit, clearing selection")

      const command = new SelectCommand(
        null,
        this.opts.selectionManager,
        this.opts.debug
      )
      this.commandProcessor.execute(command)
    }

    this.opts.onUpdate()
  }
  private handleMouseMove(e: MouseEvent): void {
    const screenPosition = this.getMousePosition(e)

    if (this.isDragging && this.lastMousePosition) {
      const selectedObject = this.opts.selectionManager.getSelectedObjects()[0]

      if (selectedObject) {
        // this.logger.debug("Dragging object", {
        //   screenPosition,
        //   lastPosition: this.lastMousePosition,
        //   objectId: selectedObject.id,
        //   controlPoint: this.activeControlPoint,
        //   isDragging: this.isDragging,
        // })

        // Pass screen coordinates to transform manager
        this.opts.transformManager.drag(
          selectedObject,
          screenPosition,
          this.camera
        )
        this.opts.onUpdate()
      }
    }

    this.lastMousePosition = screenPosition
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
    const screenPosition = this.getMousePosition(e)
    const worldPosition = this.coordinateSystem.screenToWorld(
      screenPosition,
      this.camera
    )

    const hitObject = this.opts.getObjectAtPoint(worldPosition)

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

  updateCamera(camera: Camera): void {
    this.camera = camera
    if (this.opts.debug) {
      this.logger.debug("Updating camera", { camera })
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

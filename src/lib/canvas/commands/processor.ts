import { createLogger } from "@/lib/utils"
import { InteractionCommand, InteractionCommandProcessorOpts } from "@/types"

export class CanvasInteractionCommandProcessor {
  private undoStack: InteractionCommand[] = []
  private redoStack: InteractionCommand[] = []
  private maxUndoStackSize: number
  private logger = createLogger("CanvasInteractionCommandProcessor")
  private debug: boolean

  constructor(opts: InteractionCommandProcessorOpts = {}) {
    this.debug = opts.debug ?? false
    this.maxUndoStackSize = opts.maxUndoStackSize ?? 50
  }

  execute(command: InteractionCommand): void {
    this.logger.debug("Executing command", {
      type: command.type,
      targetId: command.targetId,
    })

    if (this.redoStack.length > 0) {
      this.redoStack = []
    }

    command.execute()
    this.undoStack.push(command)

    if (this.undoStack.length > this.maxUndoStackSize) {
      this.undoStack.shift()
    }

    this.logState()
  }

  undo(): void {
    const command = this.undoStack.pop()

    if (!command) return

    this.logger.debug("Undoing command", {
      type: command.type,
      targetid: command.targetId,
    })

    command.undo()
    this.redoStack.push(command)
    this.logState()
  }

  redo(): void {
    const command = this.redoStack.pop()
    if (!command) return

    this.logger.debug("Redoing command", {
      type: command.type,
      targetid: command.targetId,
    })

    command.execute()
    this.undoStack.push(command)
    this.logState()
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.logState()
  }

  private logState(): void {
    if (!this.debug) return

    this.logger.debug("Command Processor State", {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      last: this.undoStack[this.undoStack.length - 1]?.type,
    })
  }
}

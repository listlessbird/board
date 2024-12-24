import { BaseCommand } from "@/lib/canvas/commands/base"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TransformManager } from "@/lib/canvas/transform"
import { Position, Transform } from "@/types"

interface TransformState {
  position: Position
  rotation: number
  scale: number
  isFlipped: boolean
}

export class TransformCommand extends BaseCommand {
  readonly type = "transform"
  private initialState: TransformState
  private finalState: TransformState | null = null

  constructor(
    private readonly object: BaseObject,
    private readonly transformManager: TransformManager,
    debug: boolean = false
  ) {
    super(object.id, debug)
    const transform = object.getTransform()
    this.initialState = this.getTransformState(transform)
  }

  execute(): void {
    if (!this.finalState) {
      const transform = this.object.getTransform()
      this.finalState = this.getTransformState(transform)
    }
    this.log("Executing Transform Command", {
      initialState: this.initialState,
      finalState: this.finalState,
    })

    this.applyTransformState(this.finalState)

    this.addDebugInfo("transformChange", {
      from: this.initialState,
      to: this.finalState,
    })
  }

  undo(): void {
    this.log("Undoing Transform Command", {
      restoring: this.initialState,
    })

    this.applyTransformState(this.initialState)
  }

  private getTransformState(transform: Transform): TransformState {
    return {
      position: { ...transform.position },
      rotation: transform.rotation,
      scale: transform.scale,
      isFlipped: transform.isFlipped,
    }
  }

  private applyTransformState(state: TransformState): void {
    this.object.setTransform({
      position: { ...state.position },
      rotation: state.rotation,
      scale: state.scale,
      isFlipped: state.isFlipped,
    })
  }
}

import { BaseCommand } from "@/lib/canvas/commands/base"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"

export class SelectCommand extends BaseCommand {
  readonly type = "select"
  private previousSelection: BaseObject | null = null

  constructor(
    private readonly object: BaseObject | null = null,
    private readonly selectionManager: SelectionManager,
    debug: boolean = false
  ) {
    super(object?.id ?? "none", debug)
  }

  execute(): void {
    this.log("Executing Select Command", {
      targetObject: this.object?.id,
      currentSelection: this.selectionManager.getSelectedObjects(),
    })

    this.previousSelection =
      this.selectionManager.getSelectedObjects()[0] || null

    if (this.object) {
      this.selectionManager.select(this.object)
    } else {
      this.selectionManager.clearSelection()
    }

    this.addDebugInfo("previousSelection", this.previousSelection?.id)
    this.addDebugInfo("currentSelection", this.object?.id)
  }

  undo(): void {
    this.log("Undoing Select Command", {
      previousSelection: this.previousSelection?.id,
    })

    if (this.previousSelection) {
      this.selectionManager.select(this.previousSelection)
    } else {
      this.selectionManager.clearSelection()
    }
  }
}

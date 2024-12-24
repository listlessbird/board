import { BaseCommand } from "@/lib/canvas/commands/base"
import { BaseObject } from "@/lib/canvas/objects/base"

export class DeleteCommand extends BaseCommand {
  readonly type = "delete"

  constructor(
    private readonly object: BaseObject,
    private readonly objects: BaseObject[],
    private readonly onUpdate: () => void,
    debug: boolean = false
  ) {
    super(object.id, debug)
  }

  execute(): void {
    this.log("Executing Delete Command", {
      target: this.object.id,
      currentObjects: this.objects.length,
    })

    const index = this.objects.indexOf(this.object)

    if (index !== -1) {
      this.objects.splice(index, 1)
      this.onUpdate()
    }

    this.addDebugInfo("deleted Object", {
      id: this.object.id,
      type: this.object.type,
      index,
    })
  }

  undo(): void {
    this.log("Undoing Delete Command", {
      restoring: this.object.id,
    })
    this.objects.push(this.object)
    this.onUpdate()
  }
}

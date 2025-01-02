import { BaseCommand } from "@/lib/canvas/commands/base"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"

export class DeleteCommand extends BaseCommand {
  readonly type = "delete"
  private wasSelected: boolean
  private objectIndex: number
  private deletedObject: BaseObject
  constructor(
    private readonly object: BaseObject,
    private readonly getObjects: () => BaseObject[],
    private readonly setObjects: (objects: BaseObject[]) => void,
    private readonly selectionManager: SelectionManager,
    private readonly onUpdate: () => void,
    debug: boolean = false
  ) {
    super(object.id, debug)
    this.wasSelected = object.selected
    this.deletedObject = object
    const objects = getObjects()
    this.objectIndex = objects.indexOf(object)

    this.log("Delete Command Created", {
      objectId: object.id,
      wasSelected: this.wasSelected,
      originalIndex: this.objectIndex,
      currentObjectCount: objects.length,
    })
  }

  execute(): void {
    const current = this.getObjects()

    this.log("Executing Delete Command", {
      targetId: this.object.id,
      obj: this.object,
      currentObjectCount: current.length,
    })

    const newObjects = current.filter((obj) => obj.id !== this.object.id)

    if (this.wasSelected) {
      this.selectionManager.clearSelection()
    }

    this.setObjects(newObjects)

    this.onUpdate()

    this.log("Delete Command Executed", {
      targetId: this.object.id,
      obj: this.object,
      currentObjectCount: current.length,
    })
  }

  undo(): void {
    const current = this.getObjects()

    this.log("Undoing Delete Command", {
      restoreTarget: this.deletedObject,
      currentObjectCount: current.length,
    })

    const newObjects = [...current]

    if (this.objectIndex >= 0 && this.objectIndex < newObjects.length) {
      newObjects.splice(this.objectIndex, 0, this.deletedObject)
    } else {
      newObjects.push(this.deletedObject)
    }

    if (this.wasSelected) {
      this.selectionManager.select(this.deletedObject)
    }

    this.setObjects(newObjects)
    this.onUpdate()

    this.log("Delete Command Undone", {
      restoreTarget: this.deletedObject,
      currentObjectCount: current.length,
    })
  }
}

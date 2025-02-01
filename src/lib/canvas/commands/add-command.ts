import { BaseCommand } from "@/lib/canvas/commands/base"
import { BaseObject } from "@/lib/canvas/objects/base"

export class AddCommand extends BaseCommand {
  readonly type: string = "add"
  private addedObejct: BaseObject

  constructor(
    private object: BaseObject,
    private getObjects: () => BaseObject[],
    private setObjects: (objects: BaseObject[]) => void,
    debug: boolean = false
  ) {
    super(object.id, debug)
    this.addedObejct = object
  }

  execute(): void {
    const current = this.getObjects()
    this.setObjects([...current, this.addedObejct])
  }

  undo(): void {
    const current = this.getObjects()
    this.setObjects(current.filter((obj) => obj.id !== this.addedObejct.id))
  }
}

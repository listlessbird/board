import { BaseCommand } from "@/lib/canvas/commands/base"
import { ImageObject } from "@/lib/canvas/objects/image"

export class CropCommand extends BaseCommand {
  readonly type = "crop"
  private previousState: {
    imageData: string
    width: number
    height: number
  }
  private newState: {
    imageData: string | null
    width: number | null
    height: number | null
  } = {
    imageData: null,
    width: null,
    height: null,
  }

  constructor(
    private readonly imageObject: ImageObject,
    debug: boolean = false
  ) {
    super(imageObject.id, debug)

    this.previousState = {
      imageData: imageObject.getImageData(),
      width: imageObject.getOriginalSize().width,
      height: imageObject.getOriginalSize().height,
    }
  }

  execute(): void {
    this.newState = {
      imageData: this.imageObject.getImageData(),
      width: this.imageObject.getOriginalSize().width,
      height: this.imageObject.getOriginalSize().height,
    }

    this.log("Executing Crop Command", {
      previousState: this.previousState,
      newState: this.newState,
    })
  }

  undo(): void {
    this.log("Undoing Crop Command")

    this.imageObject.restoreFromData(
      this.previousState.imageData,
      this.previousState.width,
      this.previousState.height
    )
  }

  redo(): void {
    if (!this.newState.imageData) return

    this.log("Redoing Crop Command")

    this.imageObject.restoreFromData(
      this.newState.imageData,
      this.newState.width!,
      this.newState.height!
    )
  }
}

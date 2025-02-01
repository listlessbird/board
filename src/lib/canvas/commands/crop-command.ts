import { BaseCommand } from "@/lib/canvas/commands/base"
import { ImageObject } from "@/lib/canvas/objects/image"
import { CropMode, CropResult } from "@/types"

export class CropCommand<T extends CropMode> extends BaseCommand {
  readonly type = "crop"

  private previousState: {
    imgData: string
    width: number
    height: number
  }

  constructor(
    private readonly imageObject: ImageObject,
    private readonly cropResult: CropResult<T>,
    debug: boolean = false
  ) {
    super(imageObject.id, debug)

    const size = imageObject.getOriginalSize()

    this.previousState = {
      imgData: imageObject.getImageData(),
      width: size.width,
      height: size.height,
    }

    this.log("CropCommand initialized", {
      objectId: imageObject.id,
      cropResult,
      previousState: this.previousState,
    })
  }

  execute(): void {
    this.log("Executing CropCommand", {
      cropResult: this.cropResult,
    })

    this.imageObject.applyCrop(this.cropResult)
  }

  undo(): void {
    this.log("Undoing CropCommand", {
      previousState: this.previousState,
    })

    this.imageObject.restoreFromData(
      this.previousState.imgData,
      this.previousState.width,
      this.previousState.height
    )
  }
}

import { BaseCommand } from "@/lib/canvas/commands/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { TextStyle } from "@/types"

interface TextState {
  content: string
  style: TextStyle
}

export class TextEditCommand extends BaseCommand {
  readonly type = "text-edit"
  private previousState: TextState
  private newState: TextState

  constructor(
    private readonly textObject: TextObject,
    newContent?: string,
    newStyle?: Partial<TextStyle>,
    debug: boolean = false
  ) {
    super(textObject.id, debug)

    this.previousState = {
      content: textObject.content,
      style: { ...textObject.style },
    }

    this.newState = {
      content: newContent ?? textObject.content,
      style: { ...textObject.style, ...newStyle },
    }
  }

  execute(): void {
    this.log("Executing Text Edit Command", {
      previousState: this.previousState,
      newState: this.newState,
    })

    if (this.newState.content !== this.previousState.content) {
      this.textObject.content = this.newState.content
    }

    if (this.newState.style !== this.previousState.style) {
      this.textObject.setStyle(this.newState.style)
    }

    this.addDebugInfo("textChange", {
      from: this.previousState,
      to: this.newState,
    })
  }

  undo(): void {
    this.log("Undoing Text Edit Command", {
      restoring: this.previousState,
    })
    this.textObject.content = this.previousState.content
    this.textObject.setStyle(this.previousState.style)
  }
}

import { GridOptions } from "@/types"

const defaultGridStyles = {
  baseGridSize: 10,
  primaryInterval: 10,
  secondaryInterval: 5,
  primaryColor: "rgba(0, 0, 0, 0.1)",
  secondaryColor: "rgba(0, 0, 0, 0.05)",
  axisColor: "rgba(0, 0, 0, 0.2)",
} satisfies GridOptions

export const CANVAS_STYLE = {
  ...defaultGridStyles,
}

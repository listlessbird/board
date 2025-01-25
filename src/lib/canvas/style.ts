import { GridOptions } from "@/types"

const defaultGridStyles = {
  baseGridSize: 10,
  primaryInterval: 10,
  secondaryInterval: 5,
  primaryColor: "rgba(0, 0, 0, 0.1)",
  secondaryColor: "rgba(0, 0, 0, 0.05)",
  axisColor: "rgba(0, 0, 0, 0.2)",
} satisfies GridOptions

const defaultTextStyle = {
  font: "Geist Mono",
  color: "#ffffff",
  size: 20,
  weight: "normal",
  italic: false,
  textSelectionColor: "#1a7fd4",
}

const defaultControlPointStyle = {
  controlPointSize: 10,
  fillStyle: "#ffffff",
  strokeStyle: "#1a7fd4",
  lineWidth: 1,
}

export const CANVAS_STYLE = {
  ...defaultGridStyles,
  ...defaultTextStyle,
  controlPoint: defaultControlPointStyle,
}

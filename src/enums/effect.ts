export const Effect = {
NONE: "none",
FILE: "file",
BLUR: "blur",
NULL: "null",
TEXT: "text",
MERGE: "merge",
TRANSFORM: "transform",
OPACITY: "opacity",
COLOR_CORRECT: "color_correct",
EXPORT: "export",

} as const;

// Create a Type from the object so you can use it like an Enum type
export type Effect = (typeof Effect)[keyof typeof Effect];
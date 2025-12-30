export const Effect = {
NONE: "none",
FILE: "file",
BLUR: "blur",

} as const;

// Create a Type from the object so you can use it like an Enum type
export type Effect = (typeof Effect)[keyof typeof Effect];
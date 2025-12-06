// 1. types/custom.d.ts
// Esto le dice a TypeScript que los archivos *.css son módulos válidos.

declare module '*.css' {
  const content: any;
  export default content;
}
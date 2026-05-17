// xlsx-js-style is a drop-in fork of SheetJS that also writes cell styles.
// It ships no types, so reuse the xlsx typings; cell `.s` style is set
// via `any` at the call sites.
declare module 'xlsx-js-style' {
  export * from 'xlsx';
}

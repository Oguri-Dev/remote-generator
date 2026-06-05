// Logger de desarrollo: emite a la consola solo cuando la build NO es de
// producción (import.meta.env.DEV). Evita ensuciar la consola del cliente en
// producción con trazas de depuración, conservando console.error para errores
// reales (que sí queremos ver siempre).

export const debug = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}

export const debugWarn = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(...args)
  }
}

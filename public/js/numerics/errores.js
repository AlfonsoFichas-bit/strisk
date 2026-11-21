/**
 * SIMTELE-RISK — Módulo de Teoría de Errores Transversal
 * Implementa cálculo de error absoluto, relativo (con guarda contra cero), porcentual,
 * residual de funciones y sensibilidad paramétrica.
 */

export const Errores = {
  errorAbsoluto(aprox, ref) {
    if (aprox === null || ref === null || aprox === undefined || ref === undefined) return null;
    return Math.abs(aprox - ref);
  },

  errorRelativo(aprox, ref) {
    if (aprox === null || ref === null || aprox === undefined || ref === undefined) return null;
    const den = Math.abs(ref);
    if (den < 1e-15) return null; // Evitar división por cero
    return Math.abs(aprox - ref) / den;
  },

  errorPorcentual(aprox, ref) {
    const rel = this.errorRelativo(aprox, ref);
    return rel !== null ? rel * 100 : null;
  },

  residual(f, x) {
    try {
      const val = f(x);
      return Array.isArray(val)
        ? Math.max(...val.map(v => Math.abs(v)))
        : Math.abs(val);
    } catch {
      return null;
    }
  },

  sensibilidad(y1, y2, x1, x2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (Math.abs(dx) < 1e-15 || Math.abs(y1) < 1e-15) return 0;
    return (dy / dx) * (x1 / y1);
  }
};

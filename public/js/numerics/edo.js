/**
 * SIMTELE-RISK — Familia de Métodos de Ecuaciones Diferenciales Ordinarias (EDO)
 * Implementa Runge-Kutta 2º orden (variante Heun) y Runge-Kutta 4º orden clásico
 * para sistemas vectoriales de primer orden Y' = F(t, Y).
 */

import { Errores } from "./errores.js";

// Operaciones vectoriales auxiliares
function vecAdd(u, v) {
  return u.map((val, i) => val + v[i]);
}

function vecScale(u, s) {
  return u.map(val => val * s);
}

function toVec(y) {
  return Array.isArray(y) ? y : [y];
}

export const EDO = {
  rk2Heun(F, t0, Y0, tMax, h, { refAnaliticaFn = null } = {}) {
    const startMs = performance.now();
    let t = t0;
    let Y = toVec(Y0);
    const trayectoria = [];
    const iteraciones = [];

    const numPasos = Math.max(1, Math.round((tMax - t0) / h));
    const stepH = (tMax - t0) / numPasos;

    const refIni = refAnaliticaFn ? toVec(refAnaliticaFn(t)) : null;
    const errIni = refIni ? Math.max(...Y.map((v, i) => Math.abs(v - refIni[i]))) : null;
    trayectoria.push({ t, Y: [...Y], error_abs: errIni });

    let maxErrorAbs = errIni || 0;

    for (let k = 1; k <= numPasos; k++) {
      const k1 = toVec(F(t, Y));
      const YPredictor = vecAdd(Y, vecScale(k1, stepH));
      const k2 = toVec(F(t + stepH, YPredictor));

      Y = vecAdd(Y, vecScale(vecAdd(k1, k2), stepH / 2));
      t = t0 + k * stepH;

      let errAbs = null;
      let errRel = null;
      if (refAnaliticaFn) {
        const ref = toVec(refAnaliticaFn(t));
        errAbs = Math.max(...Y.map((v, i) => Math.abs(v - ref[i])));
        errRel = Math.max(...Y.map((v, i) => Errores.errorRelativo(v, ref[i]) || 0));
        if (errAbs > maxErrorAbs) maxErrorAbs = errAbs;
      }

      trayectoria.push({ t, Y: [...Y], error_abs: errAbs });

      // Guardar hasta 20 iteraciones para no saturar memoria/JSON
      if (k <= 10 || k >= numPasos - 10 || k % Math.max(1, Math.floor(numPasos / 20)) === 0) {
        iteraciones.push({
          numero: k,
          aproximacion: { t: Number(t.toFixed(4)), Y: Y.map(v => Number(v.toFixed(6))) },
          residual: errAbs,
          error_abs: errAbs,
          error_rel: errRel
        });
      }
    }

    return {
      metodo: "Runge-Kutta 2º Orden (Heun)",
      paso: stepH,
      t0,
      tMax,
      estado_final: Y,
      trayectoria,
      iteraciones,
      convergio: true,
      metrica_error: { error_abs: maxErrorAbs },
      tiempo_ms: performance.now() - startMs
    };
  },

  rk4Clasico(F, t0, Y0, tMax, h, { refAnaliticaFn = null } = {}) {
    const startMs = performance.now();
    let t = t0;
    let Y = toVec(Y0);
    const trayectoria = [];
    const iteraciones = [];

    const numPasos = Math.max(1, Math.round((tMax - t0) / h));
    const stepH = (tMax - t0) / numPasos;

    const refIni = refAnaliticaFn ? toVec(refAnaliticaFn(t)) : null;
    const errIni = refIni ? Math.max(...Y.map((v, i) => Math.abs(v - refIni[i]))) : null;
    trayectoria.push({ t, Y: [...Y], error_abs: errIni });

    let maxErrorAbs = errIni || 0;

    for (let k = 1; k <= numPasos; k++) {
      const k1 = toVec(F(t, Y));
      const k2 = toVec(F(t + stepH / 2, vecAdd(Y, vecScale(k1, stepH / 2))));
      const k3 = toVec(F(t + stepH / 2, vecAdd(Y, vecScale(k2, stepH / 2))));
      const k4 = toVec(F(t + stepH, vecAdd(Y, vecScale(k3, stepH))));

      const kSuma = vecAdd(vecAdd(k1, vecScale(k2, 2)), vecAdd(vecScale(k3, 2), k4));
      Y = vecAdd(Y, vecScale(kSuma, stepH / 6));
      t = t0 + k * stepH;

      let errAbs = null;
      let errRel = null;
      if (refAnaliticaFn) {
        const ref = toVec(refAnaliticaFn(t));
        errAbs = Math.max(...Y.map((v, i) => Math.abs(v - ref[i])));
        errRel = Math.max(...Y.map((v, i) => Errores.errorRelativo(v, ref[i]) || 0));
        if (errAbs > maxErrorAbs) maxErrorAbs = errAbs;
      }

      trayectoria.push({ t, Y: [...Y], error_abs: errAbs });

      if (k <= 10 || k >= numPasos - 10 || k % Math.max(1, Math.floor(numPasos / 20)) === 0) {
        iteraciones.push({
          numero: k,
          aproximacion: { t: Number(t.toFixed(4)), Y: Y.map(v => Number(v.toFixed(6))) },
          residual: errAbs,
          error_abs: errAbs,
          error_rel: errRel
        });
      }
    }

    return {
      metodo: "Runge-Kutta 4º Orden Clásico",
      paso: stepH,
      t0,
      tMax,
      estado_final: Y,
      trayectoria,
      iteraciones,
      convergio: true,
      metrica_error: { error_abs: maxErrorAbs },
      tiempo_ms: performance.now() - startMs
    };
  }
};

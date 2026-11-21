/**
 * SIMTELE-RISK — Familia de Métodos de Raíces
 * Implementa Bisección, Newton-Raphson y Secante con tablas de iteraciones,
 * criterios de parada, residuales y errores contra referencia analítica.
 */

import { Errores } from "./errores.js";

export const Raices = {
  biseccion(f, a0, b0, { tol = 1e-7, maxIter = 100, refAnalitica = null } = {}) {
    const t0 = performance.now();
    let a = a0;
    let b = b0;
    let fa = f(a);
    let fb = f(b);
    const iteraciones = [];
    let convergio = false;
    let m = a;

    if (fa * fb > 0) {
      return {
        metodo: "Bisección",
        raiz: NaN,
        valor: NaN,
        tolerancia: tol,
        max_iter: maxIter,
        convergio: false,
        iteraciones: [],
        metrica_error: { error_abs: null, error_rel: null, residual: null },
        mensaje: "No hay cambio de signo en el intervalo [a, b]",
        tiempo_ms: performance.now() - t0
      };
    }

    for (let k = 1; k <= maxIter; k++) {
      m = (a + b) / 2;
      const fm = f(m);
      const residual = Math.abs(fm);
      const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(m, refAnalitica) : (b - a) / 2;
      const errRel = refAnalitica !== null ? Errores.errorRelativo(m, refAnalitica) : null;

      iteraciones.push({
        numero: k,
        aproximacion: { x: m, a, b },
        residual,
        error_abs: errAbs,
        error_rel: errRel
      });

      if (residual <= tol || (b - a) / 2 <= tol) {
        convergio = true;
        break;
      }

      if (fa * fm <= 0) {
        b = m;
        fb = fm;
      } else {
        a = m;
        fa = fm;
      }
    }

    const ultimoErrAbs = refAnalitica !== null ? Errores.errorAbsoluto(m, refAnalitica) : (b - a) / 2;
    const ultimoErrRel = refAnalitica !== null ? Errores.errorRelativo(m, refAnalitica) : null;

    return {
      metodo: "Bisección",
      raiz: m,
      valor: m,
      tolerancia: tol,
      max_iter: maxIter,
      convergio,
      iteraciones,
      metrica_error: {
        error_abs: ultimoErrAbs,
        error_rel: ultimoErrRel,
        residual: Math.abs(f(m))
      },
      tiempo_ms: performance.now() - t0
    };
  },

  newtonRaphson(f, df, x0, { tol = 1e-9, maxIter = 100, refAnalitica = null } = {}) {
    const t0 = performance.now();
    let x = x0;
    const iteraciones = [];
    let convergio = false;

    for (let k = 1; k <= maxIter; k++) {
      const fx = f(x);
      const dfx = df(x);
      const residual = Math.abs(fx);
      const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(x, refAnalitica) : null;
      const errRel = refAnalitica !== null ? Errores.errorRelativo(x, refAnalitica) : null;

      iteraciones.push({
        numero: k,
        aproximacion: { x },
        residual,
        error_abs: errAbs,
        error_rel: errRel
      });

      if (residual <= tol) {
        convergio = true;
        break;
      }

      if (Math.abs(dfx) < 1e-14) {
        // Derivada casi nula: parada por mal condicionamiento local
        break;
      }

      const xNext = x - fx / dfx;
      if (Math.abs(xNext - x) <= tol) {
        x = xNext;
        convergio = true;
        break;
      }
      x = xNext;
    }

    const ultimoErrAbs = refAnalitica !== null ? Errores.errorAbsoluto(x, refAnalitica) : null;
    const ultimoErrRel = refAnalitica !== null ? Errores.errorRelativo(x, refAnalitica) : null;

    return {
      metodo: "Newton-Raphson",
      raiz: x,
      valor: x,
      tolerancia: tol,
      max_iter: maxIter,
      convergio,
      iteraciones,
      metrica_error: {
        error_abs: ultimoErrAbs,
        error_rel: ultimoErrRel,
        residual: Math.abs(f(x))
      },
      tiempo_ms: performance.now() - t0
    };
  },

  secante(f, x0, x1, { tol = 1e-9, maxIter = 100, refAnalitica = null } = {}) {
    const t0 = performance.now();
    let p0 = x0;
    let p1 = x1;
    let f0 = f(p0);
    let f1 = f(p1);
    const iteraciones = [];
    let convergio = false;
    let p = p1;

    for (let k = 1; k <= maxIter; k++) {
      const denom = f1 - f0;
      if (Math.abs(denom) < 1e-14) {
        break;
      }

      p = p1 - f1 * (p1 - p0) / denom;
      const fp = f(p);
      const residual = Math.abs(fp);
      const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(p, refAnalitica) : null;
      const errRel = refAnalitica !== null ? Errores.errorRelativo(p, refAnalitica) : null;

      iteraciones.push({
        numero: k,
        aproximacion: { x: p },
        residual,
        error_abs: errAbs,
        error_rel: errRel
      });

      if (residual <= tol || Math.abs(p - p1) <= tol) {
        convergio = true;
        break;
      }

      p0 = p1;
      f0 = f1;
      p1 = p;
      f1 = fp;
    }

    const ultimoErrAbs = refAnalitica !== null ? Errores.errorAbsoluto(p, refAnalitica) : null;
    const ultimoErrRel = refAnalitica !== null ? Errores.errorRelativo(p, refAnalitica) : null;

    return {
      metodo: "Secante",
      raiz: p,
      valor: p,
      tolerancia: tol,
      max_iter: maxIter,
      convergio,
      iteraciones,
      metrica_error: {
        error_abs: ultimoErrAbs,
        error_rel: ultimoErrRel,
        residual: Math.abs(f(p))
      },
      tiempo_ms: performance.now() - t0
    };
  }
};

/**
 * SIMTELE-RISK — Familia de Métodos de Interpolación
 * Implementa Lagrange, Newton (diferencias divididas) y Splines Cúbicos Naturales.
 * Permite evaluar en puntos ocultos para medir el error de reconstrucción real.
 */

import { Errores } from "./errores.js";

export const Interpolacion = {
  lagrange(xs, ys, evalPts = [], { refsAnaliticas = null } = {}) {
    const t0 = performance.now();
    const n = xs.length;

    const evaluar = (x) => {
      let suma = 0;
      for (let i = 0; i < n; i++) {
        let li = 1;
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            const denom = xs[i] - xs[j];
            li *= (x - xs[j]) / (Math.abs(denom) < 1e-15 ? 1e-15 : denom);
          }
        }
        suma += ys[i] * li;
      }
      return suma;
    };

    const predicciones = evalPts.map(evaluar);

    const iteraciones = evalPts.map((t, idx) => {
      const pred = predicciones[idx];
      const ref = refsAnaliticas ? refsAnaliticas[idx] : null;
      const errAbs = ref !== null ? Errores.errorAbsoluto(pred, ref) : null;
      const errRel = ref !== null ? Errores.errorRelativo(pred, ref) : null;
      return {
        numero: idx + 1,
        aproximacion: { t, prediccion: pred, ref },
        residual: errAbs,
        error_abs: errAbs,
        error_rel: errRel
      };
    });

    const maxErr = refsAnaliticas ? Math.max(...predicciones.map((p, i) => Math.abs(p - refsAnaliticas[i]))) : null;

    return {
      metodo: "Lagrange",
      nodos: n,
      evaluar,
      predicciones,
      convergio: true,
      iteraciones,
      metrica_error: { error_max_reconstruccion: maxErr, error_abs: maxErr },
      tiempo_ms: performance.now() - t0
    };
  },

  newton(xs, ys, evalPts = [], { refsAnaliticas = null } = {}) {
    const t0 = performance.now();
    const n = xs.length;

    // Tabla de diferencias divididas
    const dd = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) dd[i][0] = ys[i];

    for (let j = 1; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        const denom = xs[i + j] - xs[i];
        dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / (Math.abs(denom) < 1e-15 ? 1e-15 : denom);
      }
    }

    const coefs = dd[0];

    const evaluar = (x) => {
      let resultado = coefs[n - 1];
      for (let i = n - 2; i >= 0; i--) {
        resultado = coefs[i] + (x - xs[i]) * resultado;
      }
      return resultado;
    };

    const predicciones = evalPts.map(evaluar);

    const iteraciones = evalPts.map((t, idx) => {
      const pred = predicciones[idx];
      const ref = refsAnaliticas ? refsAnaliticas[idx] : null;
      const errAbs = ref !== null ? Errores.errorAbsoluto(pred, ref) : null;
      const errRel = ref !== null ? Errores.errorRelativo(pred, ref) : null;
      return {
        numero: idx + 1,
        aproximacion: { t, prediccion: pred, ref },
        residual: errAbs,
        error_abs: errAbs,
        error_rel: errRel
      };
    });

    const maxErr = refsAnaliticas ? Math.max(...predicciones.map((p, i) => Math.abs(p - refsAnaliticas[i]))) : null;

    return {
      metodo: "Newton (Diferencias Divididas)",
      nodos: n,
      coeficientes: coefs,
      tabla_dd: dd,
      evaluar,
      predicciones,
      convergio: true,
      iteraciones,
      metrica_error: { error_max_reconstruccion: maxErr, error_abs: maxErr },
      tiempo_ms: performance.now() - t0
    };
  },

  splinesCubicos(xs, ys, evalPts = [], { refsAnaliticas = null } = {}) {
    const t0 = performance.now();
    const n = xs.length - 1; // n intervalos, n+1 nodos

    const h = [];
    for (let i = 0; i < n; i++) {
      h.push(xs[i + 1] - xs[i]);
    }

    // Resolver sistema tridiagonal para derivadas segundas M_i (condición natural M_0 = M_n = 0)
    const alpha = Array(n).fill(0);
    for (let i = 1; i < n; i++) {
      alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
    }

    const l = Array(n + 1).fill(0);
    const mu = Array(n + 1).fill(0);
    const z = Array(n + 1).fill(0);

    l[0] = 1;
    mu[0] = 0;
    z[0] = 0;

    for (let i = 1; i < n; i++) {
      l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
      mu[i] = h[i] / l[i];
      z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    l[n] = 1;
    z[n] = 0;

    const c = Array(n + 1).fill(0);
    const b = Array(n).fill(0);
    const d = Array(n).fill(0);
    const a = ys.slice(0, n);

    c[n] = 0;
    for (let j = n - 1; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j + 1];
      b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
      d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    const evaluar = (x) => {
      // Localizar intervalo j
      let j = 0;
      if (x <= xs[0]) j = 0;
      else if (x >= xs[n]) j = n - 1;
      else {
        for (let i = 0; i < n; i++) {
          if (x >= xs[i] && x <= xs[i + 1]) {
            j = i;
            break;
          }
        }
      }
      const dx = x - xs[j];
      return a[j] + b[j] * dx + c[j] * dx * dx + d[j] * dx * dx * dx;
    };

    const predicciones = evalPts.map(evaluar);

    const iteraciones = evalPts.map((t, idx) => {
      const pred = predicciones[idx];
      const ref = refsAnaliticas ? refsAnaliticas[idx] : null;
      const errAbs = ref !== null ? Errores.errorAbsoluto(pred, ref) : null;
      const errRel = ref !== null ? Errores.errorRelativo(pred, ref) : null;
      return {
        numero: idx + 1,
        aproximacion: { t, prediccion: pred, ref },
        residual: errAbs,
        error_abs: errAbs,
        error_rel: errRel
      };
    });

    const maxErr = refsAnaliticas ? Math.max(...predicciones.map((p, i) => Math.abs(p - refsAnaliticas[i]))) : null;

    return {
      metodo: "Splines Cúbicos",
      nodos: xs.length,
      coeficientes: { a, b, c, d },
      evaluar,
      predicciones,
      convergio: true,
      iteraciones,
      metrica_error: { error_max_reconstruccion: maxErr, error_abs: maxErr },
      tiempo_ms: performance.now() - t0
    };
  }
};

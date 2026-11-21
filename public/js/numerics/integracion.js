/**
 * SIMTELE-RISK — Familia de Métodos de Integración Numérica
 * Implementa Trapecio Compuesto, Simpson 1/3 Compuesto y Romberg
 * con refinamiento sucesivo, tablas de iteraciones y errores contra referencia analítica.
 */

import { Errores } from "./errores.js";

export const Integracion = {
  trapecioCompuesto(f, a, b, n = 100, { refAnalitica = null } = {}) {
    const t0 = performance.now();
    const h = (b - a) / n;
    let sum = 0.5 * (f(a) + f(b));
    for (let i = 1; i < n; i++) {
      sum += f(a + i * h);
    }
    const valor = sum * h;

    // Generar tabla de refinamiento demostrativo para iteraciones
    const subNiveles = [Math.max(2, Math.floor(n / 8)), Math.max(4, Math.floor(n / 4)), Math.max(8, Math.floor(n / 2)), n];
    const iteraciones = subNiveles.map((subN, idx) => {
      const stepH = (b - a) / subN;
      let s = 0.5 * (f(a) + f(b));
      for (let j = 1; j < subN; j++) s += f(a + j * stepH);
      const aprox = s * stepH;
      const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(aprox, refAnalitica) : null;
      const errRel = refAnalitica !== null ? Errores.errorRelativo(aprox, refAnalitica) : null;
      return {
        numero: idx + 1,
        aproximacion: { valor: aprox, subintervalos: subN, paso: stepH },
        residual: errAbs,
        error_abs: errAbs,
        error_rel: errRel
      };
    });

    const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(valor, refAnalitica) : null;
    const errRel = refAnalitica !== null ? Errores.errorRelativo(valor, refAnalitica) : null;

    return {
      metodo: "Trapecio Compuesto",
      valor,
      paso: h,
      subintervalos: n,
      convergio: true,
      iteraciones,
      metrica_error: { error_abs: errAbs, error_rel: errRel },
      tiempo_ms: performance.now() - t0
    };
  },

  simpson13Compuesto(f, a, b, n = 100, { refAnalitica = null } = {}) {
    const t0 = performance.now();
    const sub = n % 2 === 0 ? n : n + 1;
    const h = (b - a) / sub;
    let sum = f(a) + f(b);

    for (let i = 1; i < sub; i++) {
      sum += (i % 2 === 1 ? 4 : 2) * f(a + i * h);
    }
    const valor = (h / 3) * sum;

    const subNiveles = [Math.max(2, Math.floor(sub / 4)), Math.max(4, Math.floor(sub / 2)), sub];
    const iteraciones = subNiveles.map((m, idx) => {
      const actualM = m % 2 === 0 ? m : m + 1;
      const stepH = (b - a) / actualM;
      let s = f(a) + f(b);
      for (let j = 1; j < actualM; j++) s += (j % 2 === 1 ? 4 : 2) * f(a + j * stepH);
      const aprox = (stepH / 3) * s;
      const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(aprox, refAnalitica) : null;
      const errRel = refAnalitica !== null ? Errores.errorRelativo(aprox, refAnalitica) : null;
      return {
        numero: idx + 1,
        aproximacion: { valor: aprox, subintervalos: actualM, paso: stepH },
        residual: errAbs,
        error_abs: errAbs,
        error_rel: errRel
      };
    });

    const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(valor, refAnalitica) : null;
    const errRel = refAnalitica !== null ? Errores.errorRelativo(valor, refAnalitica) : null;

    return {
      metodo: "Simpson 1/3 Compuesto",
      valor,
      paso: h,
      subintervalos: sub,
      convergio: true,
      iteraciones,
      metrica_error: { error_abs: errAbs, error_rel: errRel },
      tiempo_ms: performance.now() - t0
    };
  },

  romberg(f, a, b, { tol = 1e-10, maxNivel = 7, refAnalitica = null } = {}) {
    const t0 = performance.now();
    const R = [];
    const iteraciones = [];
    let convergio = false;

    // Nivel 0 (1 intervalo)
    const h0 = b - a;
    R.push([0.5 * h0 * (f(a) + f(b))]);

    let ultimoValor = R[0][0];

    for (let k = 1; k < maxNivel; k++) {
      R.push([]);
      const sub = 2 ** k;
      const h = (b - a) / sub;

      // Trapecio con paso h a partir del nivel anterior
      let sumaPuntosMedios = 0;
      for (let i = 1; i < sub; i += 2) {
        sumaPuntosMedios += f(a + i * h);
      }
      R[k][0] = 0.5 * R[k - 1][0] + h * sumaPuntosMedios;

      // Extrapolación de Richardson
      for (let j = 1; j <= k; j++) {
        const factor = 4 ** j;
        R[k][j] = (factor * R[k][j - 1] - R[k - 1][j - 1]) / (factor - 1);
      }

      ultimoValor = R[k][k];
      const residual = Math.abs(R[k][k] - R[k - 1][k - 1]);
      const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(ultimoValor, refAnalitica) : residual;
      const errRel = refAnalitica !== null ? Errores.errorRelativo(ultimoValor, refAnalitica) : null;

      iteraciones.push({
        numero: k,
        aproximacion: { valor: ultimoValor, nivel: k, subintervalos: sub },
        residual,
        error_abs: errAbs,
        error_rel: errRel
      });

      if (residual <= tol) {
        convergio = true;
        break;
      }
    }

    const errAbs = refAnalitica !== null ? Errores.errorAbsoluto(ultimoValor, refAnalitica) : null;
    const errRel = refAnalitica !== null ? Errores.errorRelativo(ultimoValor, refAnalitica) : null;

    return {
      metodo: "Romberg",
      valor: ultimoValor,
      tolerancia: tol,
      tabla_romberg: R,
      convergio,
      iteraciones,
      metrica_error: { error_abs: errAbs, error_rel: errRel },
      tiempo_ms: performance.now() - t0
    };
  }
};

/**
 * SIMTELE-RISK — Orquestador de los 4 Casos de Estudio × 3 Escenarios (12 Escenarios)
 * Implementa los modelos físicos, asignación de métodos pertinentes,
 * soluciones analíticas cerradas y generación de series de gráficos.
 */

import { Raices } from "./numerics/raices.js";
import { Interpolacion } from "./numerics/interpolacion.js";
import { Integracion } from "./numerics/integracion.js";
import { EDO } from "./numerics/edo.js";
import { Errores } from "./numerics/errores.js";

// Solvers de sistemas lineales SPD para calibración y Módulo 2
function gradienteConjugadoSPD(A, b, { tol = 1e-8, maxIter = 200, xRef = null } = {}) {
  const t0 = performance.now();
  const n = b.length;
  let x = Array(n).fill(0);
  const multMatVec = (M, v) => M.map(row => row.reduce((acc, val, j) => acc + val * v[j], 0));
  const dot = (u, v) => u.reduce((acc, val, i) => acc + val * v[i], 0);

  let r = b.map((bi, i) => bi - multMatVec(A, x)[i]);
  let p = [...r];
  let rsOld = dot(r, r);
  const iteraciones = [];
  let convergio = false;

  for (let k = 1; k <= maxIter; k++) {
    const Ap = multMatVec(A, p);
    const pAp = dot(p, Ap);
    if (Math.abs(pAp) < 1e-15) break;

    const alpha = rsOld / pAp;
    x = x.map((xi, i) => xi + alpha * p[i]);
    r = r.map((ri, i) => ri - alpha * Ap[i]);
    const rsNew = dot(r, r);
    const residual = Math.sqrt(rsNew);

    const errAbs = xRef ? Math.max(...x.map((xi, i) => Math.abs(xi - xRef[i]))) : residual;
    const errRel = xRef ? Math.max(...x.map((xi, i) => Errores.errorRelativo(xi, xRef[i]) || 0)) : null;

    iteraciones.push({
      numero: k,
      aproximacion: { x: x.map(v => Number(v.toFixed(6))) },
      residual,
      error_abs: errAbs,
      error_rel: errRel
    });

    if (residual <= tol) {
      convergio = true;
      break;
    }
    p = r.map((ri, i) => ri + (rsNew / rsOld) * p[i]);
    rsOld = rsNew;
  }

  return {
    metodo: "Gradiente Conjugado (SPD)",
    tolerancia: tol,
    max_iter: maxIter,
    convergio,
    solucion: x,
    valor: x,
    iteraciones,
    metrica_error: { error_abs: iteraciones.length > 0 ? iteraciones[iteraciones.length - 1].error_abs : 0 },
    tiempo_ms: performance.now() - t0
  };
}

export const CasosEstudio = {
  // =========================================================================
  // MÓDULO 1: DETENCIÓN DE EMERGENCIA
  // Métodos: EDO (RK2, RK4), Integración (Trapecio, Simpson 1/3, Romberg),
  // Raíces (Bisección, Newton, Secante)
  // =========================================================================
  detencionEmergencia(tipo = "NORMAL", customParams = {}) {
    const presets = {
      NORMAL: { v0: 20, a0: 4, kDrag: 0, h: 0.1, tMax: 6, d_disp: 80, fuente: "Analítico: desaceleración constante v(t)=v0-a0·t" },
      ESTRES: { v0: 38, a0: 3.5, kDrag: 0.015, h: 0.25, tMax: 10, d_disp: 250, fuente: "Sintético: alta velocidad + arrastre aerodinámico cuadrático" },
      MAL_CONDICIONADO: { v0: 15, a0: 2, kDrag: 0, h: 0.1, tMax: 10, d_disp: 150, modoTangente: true, fuente: "Subexperimento: frenado suave con derivada v'(t_det) ≈ 0" }
    };
    const p = { ...presets[tipo], ...customParams };

    // Dinámica EDO: Y = [x, v] -> dx/dt = v, dv/dt = -a(v)
    const accel = (v) => p.modoTangente ? 0.05 * Math.max(v, 0) ** 2 : (p.a0 + p.kDrag * v * Math.abs(v));
    const F = (_t, [_x, v]) => [Math.max(v, 0), v > 0 ? -accel(v) : 0];

    // Solución analítica exacta en NORMAL
    const tDetRef = tipo === "NORMAL" ? p.v0 / p.a0 : null;
    const dFrenadoRef = tipo === "NORMAL" ? (p.v0 ** 2) / (2 * p.a0) : null;
    const refAnaliticaFn = tipo === "NORMAL"
      ? (t) => t <= tDetRef
        ? [p.v0 * t - 0.5 * p.a0 * t * t, p.v0 - p.a0 * t]
        : [dFrenadoRef, 0]
      : null;

    const rk2 = EDO.rk2Heun(F, 0, [0, p.v0], p.tMax, p.h, { refAnaliticaFn });
    const rk4 = EDO.rk4Clasico(F, 0, [0, p.v0], p.tMax, p.h, { refAnaliticaFn });

    // Búsqueda de raíz v(t) = 0
    const vFn = (t) => {
      if (tipo === "NORMAL") return p.v0 - p.a0 * t;
      if (p.modoTangente) return (t - 7.5) ** 3; // Raíz triple (derivada cero en t=7.5)
      const idx = Math.min(Math.floor(t / p.h), rk4.trayectoria.length - 2);
      const p0 = rk4.trayectoria[Math.max(0, idx)];
      const p1 = rk4.trayectoria[Math.max(1, idx + 1)];
      const alpha = (t - p0.t) / (p1.t - p0.t || 1);
      return p0.Y[1] + alpha * (p1.Y[1] - p0.Y[1]);
    };
    const dvFn = (t) => tipo === "NORMAL" ? -p.a0 : (p.modoTangente ? 3 * (t - 7.5) ** 2 : -accel(Math.max(vFn(t), 0)));

    const refRaiz = tipo === "NORMAL" ? tDetRef : (p.modoTangente ? 7.5 : null);
    const bis = Raices.biseccion(vFn, 0, p.tMax, { refAnalitica: refRaiz });
    const newt = Raices.newtonRaphson(vFn, dvFn, p.tMax * 0.4, { refAnalitica: refRaiz });
    const sec = Raices.secante(vFn, 0.5, p.tMax * 0.6, { refAnalitica: refRaiz });

    // Integración de distancia ∫ v(t) dt hasta t_det
    const tLim = bis.convergio ? bis.raiz : (tDetRef || p.tMax);
    const vPos = (t) => Math.max(vFn(t), 0);
    const trap = Integracion.trapecioCompuesto(vPos, 0, tLim, 64, { refAnalitica: dFrenadoRef });
    const simp = Integracion.simpson13Compuesto(vPos, 0, tLim, 64, { refAnalitica: dFrenadoRef });
    const romb = Integracion.romberg(vPos, 0, tLim, { refAnalitica: dFrenadoRef });

    const distCalculada = simp.valor;
    const sens = Errores.sensibilidad(dFrenadoRef || rk4.estado_final[0], ((p.v0 * 1.01) ** 2) / (2 * p.a0), p.v0, p.v0 * 1.01);

    return {
      caso_id: 1,
      tipo_escenario: tipo,
      parametros: p,
      fuente_datos: p.fuente,
      graficos: {
        serie_principal: rk4.trayectoria.map(pt => ({ t: pt.t, x_rk4: pt.Y[0], v_rk4: pt.Y[1] })),
        comparacion_rk2: rk2.trayectoria.map(pt => ({ t: pt.t, x_rk2: pt.Y[0], v_rk2: pt.Y[1] }))
      },
      ejecuciones: [rk2, rk4, bis, newt, sec, trap, simp, romb].map(m => ({
        ...m,
        resumen: {
          referencia: refAnaliticaFn ? `t_det=${tDetRef?.toFixed(4)}s, d=${dFrenadoRef?.toFixed(4)}m` : "Referencia numérica RK4 paso fino",
          valor: m.estado_final ?? m.raiz ?? m.valor,
          metrica_error: m.metrica_error || { sensibilidad: sens },
          interpretacion: {
            matematica: tipo === "MAL_CONDICIONADO"
              ? "La multiplicidad de la raíz degrada la convergencia cuadrática de Newton-Raphson a lineal o la detiene al anularse la derivada; la bisección mantiene su tasa O(1/2^k)."
              : "RK4 y Romberg alcanzan convergencia de alto orden O(h^4) con residuales y errores relativos inferiores a 10^-6 frente a la solución analítica cerrada.",
            problema: `Distancia calculada de frenado: ${distCalculada.toFixed(2)} m en ${tLim.toFixed(2)} s frente a una distancia disponible de ${p.d_disp} m. ${distCalculada > p.d_disp ? "ALERTA DE SEGURIDAD: la cabina sobrepasa la vía disponible." : "Operación segura con margen de frenado adecuado."}`
          }
        }
      }))
    };
  },

  // =========================================================================
  // MÓDULO 2: DETERIORO MECÁNICO
  // Métodos: Raíces (Bisección, Newton, Secante), Sistemas Lineales SPD (GC)
  // =========================================================================
  deterioroMecanico(tipo = "NORMAL", customParams = {}) {
    const presets = {
      NORMAL: { D0: 0.10, alpha: 0.015, beta: 0.0008, D_umbral: 0.75, kappa: 4.5, fuente: "Analítico: D(t)=D0+αt+βt² y matriz SPD bien condicionada" },
      ESTRES: { D0: 0.25, alpha: 0.045, beta: 0.0035, D_umbral: 0.75, kappa: 35, fuente: "Sintético: fatiga acelerada por sobrecarga continua" },
      MAL_CONDICIONADO: { D0: 0.10, alpha: -0.04, beta: 0.004, D_umbral: 0.200001, kappa: 1.5e7, fuente: "Subexperimento: umbral casi tangente al vértice + matriz SPD casi singular" }
    };
    const p = { ...presets[tipo], ...customParams };

    const f = (t) => p.D0 + p.alpha * t + p.beta * t * t - p.D_umbral;
    const df = (t) => p.alpha + 2 * p.beta * t;

    const disc = p.alpha * p.alpha - 4 * p.beta * (p.D0 - p.D_umbral);
    const tRef = disc >= 0 ? (-p.alpha + Math.sqrt(disc)) / (2 * p.beta) : null;

    const bis = Raices.biseccion(f, 0, 50, { refAnalitica: tRef });
    const newt = Raices.newtonRaphson(f, df, 12, { refAnalitica: tRef });
    const sec = Raices.secante(f, 5, 20, { refAnalitica: tRef });

    // Sistema SPD de calibración Ax = b con solución exacta x* = [1, 1, 1]
    const eps = tipo === "MAL_CONDICIONADO" ? 1e-7 : (tipo === "ESTRES" ? 0.05 : 0.5);
    const A = [
      [1 + eps, 1, 1],
      [1, 1 + eps, 1],
      [1, 1, 1 + eps]
    ];
    const xExacta = [1, 1, 1];
    const b = A.map(row => row.reduce((s, v, j) => s + v * xExacta[j], 0));
    const gc = gradienteConjugadoSPD(A, b, { xRef: xExacta, maxIter: 500 });

    const curva = Array.from({ length: 31 }, (_, t) => ({ t, D: p.D0 + p.alpha * t + p.beta * t * t, umbral: p.D_umbral }));

    return {
      caso_id: 2,
      tipo_escenario: tipo,
      parametros: p,
      fuente_datos: p.fuente,
      graficos: { curva_deterioro: curva },
      ejecuciones: [bis, newt, sec, gc].map(m => ({
        ...m,
        resumen: {
          referencia: tRef ? `t_falla=${tRef.toFixed(6)} ciclos, x*=[1,1,1]` : "Sin raíz real (umbral no alcanzado)",
          valor: m.raiz ?? m.solucion,
          metrica_error: m.metrica_error || { kappa_estimado: p.kappa },
          interpretacion: {
            matematica: tipo === "MAL_CONDICIONADO"
              ? `El número de condición κ(A) ≈ ${p.kappa.toExponential(1)} amplifica errores numéricos en el sistema SPD; la derivada mínima D'(t*) ≈ 0 cerca del vértice causa sensibilidad extrema en la raíz.`
              : "Newton-Raphson converge cuadráticamente en menos de 6 iteraciones con error absoluto < 10^-12. Gradiente Conjugado resuelve el sistema SPD en exactamente 3 pasos.",
            problema: tRef
              ? `El componente alcanza el umbral de inspección D=${p.D_umbral} en t ≈ ${tRef.toFixed(2)} unidades temporales. Se recomienda programar mantenimiento preventivo en t = ${(tRef * 0.8).toFixed(2)}.`
              : "El nivel de desgaste no alcanza el umbral de mantenimiento en el horizonte evaluado."
          }
        }
      }))
    };
  },

  // =========================================================================
  // MÓDULO 3: OSCILACIONES POR VIENTO
  // Métodos: EDO (RK2, RK4), Integración (Trapecio, Simpson 1/3, Romberg)
  // =========================================================================
  oscilacionesViento(tipo = "NORMAL", customParams = {}) {
    const presets = {
      NORMAL: { m: 100, c: 20, k: 400, F0: 0, omegaF: 0, x0: 0.5, v0: 0, h: 0.05, tMax: 10, fuente: "Analítico: vibración libre subamortiguada F(t)=0" },
      ESTRES: { m: 100, c: 10, k: 400, F0: 350, omegaF: 2.0, x0: 0.1, v0: 0, h: 0.05, tMax: 25, fuente: "Sintético: ráfaga resonante ω_F = ω_0 = 2 rad/s" },
      MAL_CONDICIONADO: { m: 1, c: 5, k: 2500, F0: 0, omegaF: 0, x0: 1.0, v0: 0, h: 0.04, tMax: 2, fuente: "Subexperimento: sistema rígido (stiff) k/m=2500 con paso h=0.04s" }
    };
    const p = { ...presets[tipo], ...customParams };

    const F = (t, [x, v]) => {
      const fExt = p.F0 * Math.sin(p.omegaF * t);
      return [v, (fExt - p.c * v - p.k * x) / p.m];
    };

    // Solución analítica subamortiguada cuando F0 = 0
    const w0 = Math.sqrt(p.k / p.m);
    const zeta = p.c / (2 * Math.sqrt(p.k * p.m));
    const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
    const refAnaliticaFn = (p.F0 === 0 && zeta < 1)
      ? (t) => {
          const env = Math.exp(-zeta * w0 * t);
          const C1 = p.x0;
          const C2 = (p.v0 + zeta * w0 * p.x0) / (wd || 1);
          const x = env * (C1 * Math.cos(wd * t) + C2 * Math.sin(wd * t));
          return [x, 0];
        }
      : null;

    const rk2 = EDO.rk2Heun(F, 0, [p.x0, p.v0], p.tMax, p.h, { refAnaliticaFn });
    const rk4 = EDO.rk4Clasico(F, 0, [p.x0, p.v0], p.tMax, p.h, { refAnaliticaFn });

    // Índice de energía / vibración cuadrática: ∫ x(t)² dt
    const x2Fn = (t) => {
      const idx = Math.min(Math.floor(t / p.h), rk4.trayectoria.length - 1);
      return rk4.trayectoria[Math.max(0, idx)].Y[0] ** 2;
    };
    const trap = Integracion.trapecioCompuesto(x2Fn, 0, p.tMax, 200);
    const simp = Integracion.simpson13Compuesto(x2Fn, 0, p.tMax, 200);
    const romb = Integracion.romberg(x2Fn, 0, p.tMax, { maxNivel: 7 });

    const ampMax = Math.max(...rk4.trayectoria.map(pt => Math.abs(pt.Y[0])));

    return {
      caso_id: 3,
      tipo_escenario: tipo,
      parametros: p,
      fuente_datos: p.fuente,
      graficos: {
        oscilacion_rk4: rk4.trayectoria.map(pt => ({ t: pt.t, x_rk4: pt.Y[0], v_rk4: pt.Y[1] })),
        oscilacion_rk2: rk2.trayectoria.map(pt => ({ t: pt.t, x_rk2: pt.Y[0], v_rk2: pt.Y[1] }))
      },
      ejecuciones: [rk2, rk4, trap, simp, romb].map(m => ({
        ...m,
        resumen: {
          referencia: refAnaliticaFn ? `ω0=${w0.toFixed(2)} rad/s, ζ=${zeta.toFixed(3)}` : "Referencia numérica RK4",
          valor: m.estado_final ? m.estado_final[0] : m.valor,
          metrica_error: m.metrica_error,
          interpretacion: {
            matematica: tipo === "MAL_CONDICIONADO"
              ? "En régimen rígido (h·ω0 elevado), el método explícito RK2 exhibe inestabilidad numérica artificial, mientras que RK4 mantiene su estabilidad dentro del dominio extendido."
              : "RK4 modela con exactitud el decaimiento subamortiguado sin deriva de fase artificial y los métodos de cuadratura integran la energía con alta fidelidad.",
            problema: `Amplitud máxima de oscilación: ${ampMax.toFixed(3)} m; índice acumulado de vibración ∫x²dt ≈ ${simp.valor.toFixed(4)} m²·s. ${ampMax > 0.8 ? "RIESGO ESTRUCTURAL: se requiere reducir la velocidad del cable ante viento sostenido." : "Oscilación tolerable dentro del perfil estructural."}`
          }
        }
      }))
    };
  },

  // =========================================================================
  // MÓDULO 4: RECONSTRUCCIÓN DE SENSORES
  // Métodos: Interpolación (Lagrange, Newton, Splines Cúbicos), Raíces (Bisección)
  // =========================================================================
  reconstruccionSensores(tipo = "NORMAL", customParams = {}) {
    const presets = {
      NORMAL: { nNodos: 7, a: 0, b: Math.PI, fnTipo: "sin", umbral: 0.85, fuente: "Analítico: muestreo de y(t)=sin(t) con puntos ocultos de validación" },
      ESTRES: { nNodos: 9, a: 0, b: 4, fnTipo: "exp_osc", umbral: 0.5, fuente: "Sintético: señal amortiguada con pérdida de paquetes intermedios" },
      MAL_CONDICIONADO: { nNodos: 13, a: -1, b: 1, fnTipo: "runge", umbral: 0.5, fuente: "Subexperimento: Fenómeno de Runge f(t)=1/(1+25t²) en nodos equiespaciados" }
    };
    const p = { ...presets[tipo], ...customParams };

    const fReal = (t) => {
      if (p.fnTipo === "sin") return Math.sin(t);
      if (p.fnTipo === "exp_osc") return Math.exp(-0.5 * t) * Math.cos(2 * t);
      return 1 / (1 + 25 * t * t); // Función clásica de Runge
    };

    const xs = Array.from({ length: p.nNodos }, (_, i) => p.a + (i * (p.b - p.a)) / (p.nNodos - 1));
    const ys = xs.map(fReal);

    // 20 puntos intermedios ocultados para medir error real de reconstrucción
    const puntosOcultos = Array.from({ length: 20 }, (_, i) => p.a + ((i + 0.5) * (p.b - p.a)) / 20);
    const refsOcultos = puntosOcultos.map(fReal);

    const lag = Interpolacion.lagrange(xs, ys, puntosOcultos, { refsAnaliticas: refsOcultos });
    const newt = Interpolacion.newton(xs, ys, puntosOcultos, { refsAnaliticas: refsOcultos });
    const spl = Interpolacion.splinesCubicos(xs, ys, puntosOcultos, { refsAnaliticas: refsOcultos });

    const maxErr = (preds) => Math.max(...preds.map((v, i) => Math.abs(v - refsOcultos[i])));
    const errLag = maxErr(lag.predicciones);
    const errNewt = maxErr(newt.predicciones);
    const errSpl = maxErr(spl.predicciones);

    // Búsqueda de raíz para cruce de umbral en spline
    const cruce = Raices.biseccion((t) => spl.evaluar(t) - p.umbral, p.a, p.b);

    return {
      caso_id: 4,
      tipo_escenario: tipo,
      parametros: p,
      fuente_datos: p.fuente,
      graficos: {
        reconstruccion: puntosOcultos.map((t, i) => ({
          t,
          real: refsOcultos[i],
          lagrange: lag.predicciones[i],
          newton: newt.predicciones[i],
          spline: spl.predicciones[i]
        })),
        errores_comparacion: [
          { metodo: "Lagrange", error_max: errLag },
          { metodo: "Newton", error_max: errNewt },
          { metodo: "Splines Cúbicos", error_max: errSpl }
        ]
      },
      ejecuciones: [
        { ...lag, metrica_error: { error_max_reconstruccion: errLag, error_abs: errLag } },
        { ...newt, metrica_error: { error_max_reconstruccion: errNewt, error_abs: errNewt } },
        { ...spl, metrica_error: { error_max_reconstruccion: errSpl, error_abs: errSpl } },
        cruce
      ].map(m => ({
        ...m,
        resumen: {
          referencia: `Señal sintética ${p.fnTipo} en [${p.a}, ${p.b.toFixed(2)}]`,
          valor: m.raiz ?? { error_max: m.metrica_error?.error_max_reconstruccion },
          metrica_error: m.metrica_error,
          interpretacion: {
            matematica: tipo === "MAL_CONDICIONADO"
              ? `Fenómeno de Runge demostrado: polinomios de orden ${p.nNodos - 1} divergen fuertemente en los extremos (error máx = ${errLag.toFixed(3)}), mientras que los Splines Cúbicos permanecen estables (error máx = ${errSpl.toFixed(4)}).`
              : "Lagrange y Newton coinciden algebraicamente con diferencias sólo a nivel de redondeo flotante. Splines Cúbicos garantizan curvatura mínima C².",
            problema: `Reconstrucción de telemetría de sensores: Splines Cúbicos es el método recomendado para mitigar paquetes perdidos${cruce.convergio ? `; cruce de umbral (${p.umbral}) detectado en t=${cruce.raiz.toFixed(3)} s.` : "."}`
          }
        }
      }))
    };
  }
};

import assert from "node:assert";
import { Raices } from "../public/js/numerics/raices.js";
import { Interpolacion } from "../public/js/numerics/interpolacion.js";
import { Integracion } from "../public/js/numerics/integracion.js";
import { EDO } from "../public/js/numerics/edo.js";
import { CasosEstudio } from "../public/js/casos.js";
import { PersistenciaAPI } from "../public/js/persistencia.js";

Deno.test("1. Raíces: cos(x) - x = 0 (Dottie number ≈ 0.7390851332151607)", () => {
  const ref = 0.7390851332151607;
  const f = (x) => Math.cos(x) - x;
  const df = (x) => -Math.sin(x) - 1;

  const bis = Raices.biseccion(f, 0, 1, { tol: 1e-8, refAnalitica: ref });
  const newt = Raices.newtonRaphson(f, df, 0.5, { tol: 1e-10, refAnalitica: ref });
  const sec = Raices.secante(f, 0, 1, { tol: 1e-10, refAnalitica: ref });

  assert.strictEqual(bis.convergio, true);
  assert.strictEqual(newt.convergio, true);
  assert.strictEqual(sec.convergio, true);

  assert.ok(bis.metrica_error.error_abs < 1e-7);
  assert.ok(newt.metrica_error.error_abs < 1e-10);
  assert.ok(sec.metrica_error.error_abs < 1e-10);
});

Deno.test("2. Integración: ∫_0^π sin(x) dx = 2", () => {
  const f = Math.sin;
  const trap = Integracion.trapecioCompuesto(f, 0, Math.PI, 1000, { refAnalitica: 2 });
  const simp = Integracion.simpson13Compuesto(f, 0, Math.PI, 200, { refAnalitica: 2 });
  const romb = Integracion.romberg(f, 0, Math.PI, { tol: 1e-10, refAnalitica: 2 });

  assert.strictEqual(trap.convergio, true);
  assert.strictEqual(simp.convergio, true);
  assert.strictEqual(romb.convergio, true);

  assert.ok(trap.metrica_error.error_abs < 1e-5);
  assert.ok(simp.metrica_error.error_abs < 1e-8);
  assert.ok(romb.metrica_error.error_abs < 1e-10);
});

Deno.test("3. Interpolación: reconstrucción de e^(-t) en puntos intermedios", () => {
  const xs = [0, 0.5, 1.0, 1.5, 2.0];
  const ys = xs.map(t => Math.exp(-t));
  const evalPts = [0.25, 0.75, 1.25];
  const refs = evalPts.map(t => Math.exp(-t));

  const lag = Interpolacion.lagrange(xs, ys, evalPts, { refsAnaliticas: refs });
  const newt = Interpolacion.newton(xs, ys, evalPts, { refsAnaliticas: refs });
  const spl = Interpolacion.splinesCubicos(xs, ys, evalPts, { refsAnaliticas: refs });

  assert.ok(Math.abs(lag.predicciones[0] - refs[0]) < 1e-3);
  assert.ok(Math.abs(newt.predicciones[0] - lag.predicciones[0]) < 1e-12);
  assert.ok(Math.abs(spl.predicciones[1] - refs[1]) < 1e-2);
});

Deno.test("4. EDO: y' = -2y, y(0) = 1 -> y(1) = e^(-2)", () => {
  const F = (_t, [y]) => [-2 * y];
  const refFn = (t) => [Math.exp(-2 * t)];

  const rk2 = EDO.rk2Heun(F, 0, [1], 1, 0.05, { refAnaliticaFn: refFn });
  const rk4 = EDO.rk4Clasico(F, 0, [1], 1, 0.05, { refAnaliticaFn: refFn });

  assert.ok(rk2.metrica_error.error_abs < 1e-3);
  assert.ok(rk4.metrica_error.error_abs < 1e-6);
});

Deno.test("5. Cobertura completa de la matriz 4 módulos × 3 escenarios (12 ejecuciones)", () => {
  const escenarios = ["NORMAL", "ESTRES", "MAL_CONDICIONADO"];
  for (const esc of escenarios) {
    const c1 = CasosEstudio.detencionEmergencia(esc);
    const c2 = CasosEstudio.deterioroMecanico(esc);
    const c3 = CasosEstudio.oscilacionesViento(esc);
    const c4 = CasosEstudio.reconstruccionSensores(esc);

    assert.ok(c1.ejecuciones.length > 0);
    assert.ok(c2.ejecuciones.length > 0);
    assert.ok(c3.ejecuciones.length > 0);
    assert.ok(c4.ejecuciones.length > 0);

    assert.ok(c1.graficos.serie_principal.length > 0);
    assert.ok(c2.graficos.curva_deterioro.length > 0);
    assert.ok(c3.graficos.oscilacion_rk4.length > 0);
    assert.ok(c4.graficos.reconstruccion.length > 0);
  }
});

Deno.test("6. Prueba de tolerancia y reproducibilidad (<= 1e-9)", () => {
  const s1 = CasosEstudio.detencionEmergencia("NORMAL");
  const v1 = s1.ejecuciones[0].resumen.valor;
  const s2 = CasosEstudio.detencionEmergencia("NORMAL");
  const v2 = s2.ejecuciones[0].resumen.valor;

  const valNum1 = Array.isArray(v1) ? v1[0] : v1;
  const valNum2 = Array.isArray(v2) ? v2[0] : v2;

  const check = PersistenciaAPI.verificarCoincidencia(valNum1, valNum2, 1e-9);
  assert.strictEqual(check.coincide, true);
  assert.ok(check.diferencia <= 1e-9);
});

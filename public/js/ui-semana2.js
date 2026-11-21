/**
 * SIMTELE-RISK — Controlador de UI, Gráficos y Persistencia para Semana 2
 * Gestiona la ejecución de los 4 módulos en sus 3 escenarios (12 escenarios),
 * renderiza los dos gráficos interactivos por módulo (Chart.js),
 * las tablas de iteraciones con criterios de parada,
 * las dos conclusiones separadas y la persistencia SQLite con prueba de tolerancia.
 */

import { CasosEstudio } from "./casos.js";
import { PersistenciaAPI } from "./persistencia.js";

let chartPrincipal = null;
let chartErrores = null;
let simulacionActual = null;

export function inicializarPanelSemana2() {
  // 1. Conectar selector y botones del panel unificado S2
  const btnEjecutar = document.getElementById("btn-ejecutar-s2");
  const btnGuardar = document.getElementById("btn-guardar-s2");
  const btnHistorial = document.getElementById("btn-cargar-historial");
  const selectCaso = document.getElementById("select-caso");
  const selectEscenario = document.getElementById("select-escenario");

  if (btnEjecutar) {
    btnEjecutar.addEventListener("click", () => {
      const casoId = Number(selectCaso ? selectCaso.value : 1);
      const tipo = selectEscenario ? selectEscenario.value : "NORMAL";
      ejecutarYRenderizar(casoId, tipo);
    });
  }

  if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
      if (!simulacionActual) {
        alert("Primero ejecuta una simulación antes de guardarla.");
        return;
      }
      btnGuardar.disabled = true;
      btnGuardar.textContent = "Guardando en SQLite...";
      try {
        const resp = await PersistenciaAPI.guardarSimulacion(simulacionActual);
        const modo = resp.modo === "localStorage" ? "Almacenamiento Local (offline)" : "SQLite (db/simtele.db)";
        alert(`¡Simulación guardada con éxito!\nID #${resp.simulacion_id} en ${modo}`);
        await refrescarHistorial();
      } catch (err) {
        alert("Error guardando simulación: " + err.message);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar en Base de Datos";
      }
    });
  }

  if (btnHistorial) {
    btnHistorial.addEventListener("click", refrescarHistorial);
  }

  // 2. Conectar ejecuciones específicas dentro de cada pestaña de módulo
  conectarBotonesModulos();

  // 3. Cargar historial inicial y ejecutar Módulo 1 en NORMAL por defecto
  refrescarHistorial();
  ejecutarYRenderizar(1, "NORMAL");
}

function conectarBotonesModulos() {
  // Módulo 1
  const btnMod1 = document.getElementById("btn-s2-mod1");
  if (btnMod1) {
    btnMod1.addEventListener("click", () => {
      const esc = document.getElementById("escenario-detencion")?.value?.toUpperCase() || "NORMAL";
      const tipo = esc.includes("MAL") ? "MAL_CONDICIONADO" : (esc.includes("ESTRES") ? "ESTRES" : "NORMAL");
      ejecutarYRenderizar(1, tipo);
      document.getElementById("panel-semana2")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Módulo 2
  const btnMod2 = document.getElementById("btn-s2-mod2");
  if (btnMod2) {
    btnMod2.addEventListener("click", () => {
      const esc = document.getElementById("escenario-deterioro")?.value?.toUpperCase() || "NORMAL";
      const tipo = esc.includes("MAL") ? "MAL_CONDICIONADO" : (esc.includes("ESTRES") ? "ESTRES" : "NORMAL");
      ejecutarYRenderizar(2, tipo);
      document.getElementById("panel-semana2")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Módulo 3
  const btnMod3 = document.getElementById("btn-s2-mod3");
  if (btnMod3) {
    btnMod3.addEventListener("click", () => {
      const esc = document.getElementById("escenario-oscilaciones")?.value?.toUpperCase() || "NORMAL";
      const tipo = esc.includes("MAL") ? "MAL_CONDICIONADO" : (esc.includes("ESTRES") ? "ESTRES" : "NORMAL");
      ejecutarYRenderizar(3, tipo);
      document.getElementById("panel-semana2")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Módulo 4
  const btnMod4 = document.getElementById("btn-s2-mod4");
  if (btnMod4) {
    btnMod4.addEventListener("click", () => {
      const esc = document.getElementById("escenario-sensores")?.value?.toUpperCase() || "NORMAL";
      const tipo = esc.includes("MAL") ? "MAL_CONDICIONADO" : (esc.includes("ESTRES") ? "ESTRES" : "NORMAL");
      ejecutarYRenderizar(4, tipo);
      document.getElementById("panel-semana2")?.scrollIntoView({ behavior: "smooth" });
    });
  }
}

export function ejecutarYRenderizar(casoId, tipo) {
  // Sincronizar selectores si existen
  const selCaso = document.getElementById("select-caso");
  const selEsc = document.getElementById("select-escenario");
  if (selCaso) selCaso.value = String(casoId);
  if (selEsc) selEsc.value = tipo;

  const mapaCasos = {
    1: () => CasosEstudio.detencionEmergencia(tipo),
    2: () => CasosEstudio.deterioroMecanico(tipo),
    3: () => CasosEstudio.oscilacionesViento(tipo),
    4: () => CasosEstudio.reconstruccionSensores(tipo)
  };

  simulacionActual = mapaCasos[casoId]();

  // Actualizar indicador de estado en la UI
  const badgeEstado = document.getElementById("badge-simulacion-activa");
  if (badgeEstado) {
    const nombres = ["", "Detención de emergencia", "Deterioro mecánico", "Oscilaciones por viento", "Reconstrucción de sensores"];
    badgeEstado.innerHTML = `<strong>Módulo ${casoId}: ${nombres[casoId]}</strong> · Escenario: <span class="badge ${tipo.toLowerCase()}">${tipo}</span>`;
  }

  renderizarConclusiones(simulacionActual);
  renderizarTablas(simulacionActual);
  renderizarGraficos(simulacionActual);

  return simulacionActual;
}

function renderizarConclusiones(sim) {
  const primerResumen = sim.ejecuciones[0]?.resumen;
  const interp = primerResumen?.interpretacion;
  if (!interp) return;

  const elMat = document.getElementById("conclusion-matematica");
  const elProb = document.getElementById("conclusion-problema");
  const elRef = document.getElementById("referencia-simulacion");

  if (elMat) elMat.textContent = interp.matematica;
  if (elProb) elProb.textContent = interp.problema;
  if (elRef) elRef.textContent = primerResumen.referencia;
}

function renderizarTablas(sim) {
  const contenedor = document.getElementById("contenedor-tablas-s2");
  if (!contenedor) return;

  contenedor.innerHTML = sim.ejecuciones.map((ej, idx) => {
    const iteracionesAMostrar = ej.iteraciones ? ej.iteraciones.slice(0, 15) : [];
    const filas = iteracionesAMostrar.map(it => `
      <tr>
        <td>${it.numero}</td>
        <td><code>${JSON.stringify(it.aproximacion)}</code></td>
        <td>${it.residual !== null && it.residual !== undefined ? (Number(it.residual).toExponential(3)) : "—"}</td>
        <td>${it.error_abs !== null && it.error_abs !== undefined ? (Number(it.error_abs).toExponential(3)) : "—"}</td>
        <td>${it.error_rel !== null && it.error_rel !== undefined ? (Number(it.error_rel * 100).toFixed(4) + " %") : "N/A"}</td>
      </tr>
    `).join("");

    return `
      <details ${idx === 0 ? "open" : ""} class="bloque-metodo panel-interno" style="margin-bottom: 0.8rem;">
        <summary style="cursor: pointer; font-weight: bold; padding: 0.4rem 0;">
          ${ej.metodo} —
          <span class="badge ${ej.convergio ? "exito" : "advertencia"}">
            ${ej.convergio ? "Convergió" : "No convergió"}
          </span>
          <small style="margin-left: 0.5rem; color: #64748b;">(Tiempo: ${ej.tiempo_ms.toFixed(2)} ms${ej.tolerancia ? ` | Tol: ${ej.tolerancia}` : ""}${ej.paso ? ` | Paso h: ${ej.paso}` : ""})</small>
        </summary>
        <p style="margin: 0.3rem 0;"><small><strong>Referencia:</strong> ${ej.resumen?.referencia || "—"}</small></p>
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Iter / Paso</th>
                <th>Aproximación</th>
                <th>Residual</th>
                <th>Error Absoluto</th>
                <th>Error Relativo</th>
              </tr>
            </thead>
            <tbody>
              ${filas.length > 0 ? filas : '<tr><td colspan="5">Sin tabla de iteraciones detallada</td></tr>'}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }).join("");
}

function renderizarGraficos(sim) {
  const canvas1 = document.getElementById("grafico-escenario");
  const canvas2 = document.getElementById("grafico-errores");
  if (!canvas1 || !canvas2 || typeof Chart === "undefined") return;

  const ctx1 = canvas1.getContext("2d");
  const ctx2 = canvas2.getContext("2d");

  if (chartPrincipal) chartPrincipal.destroy();
  if (chartErrores) chartErrores.destroy();

  // Gráfico 1: Dinámica del Escenario / Solución
  let labels = [];
  let datasets1 = [];

  if (sim.caso_id === 1) {
    labels = sim.graficos.serie_principal.map(p => p.t.toFixed(2));
    datasets1 = [
      {
        label: "Posición x(t) RK4 [m]",
        data: sim.graficos.serie_principal.map(p => p.x_rk4),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: false,
        tension: 0.1
      },
      {
        label: "Velocidad v(t) RK4 [m/s]",
        data: sim.graficos.serie_principal.map(p => p.v_rk4),
        borderColor: "#dc2626",
        borderDash: [4, 4],
        fill: false,
        tension: 0.1
      }
    ];
  } else if (sim.caso_id === 2) {
    labels = sim.graficos.curva_deterioro.map(p => String(p.t));
    datasets1 = [
      {
        label: "Deterioro D(t)",
        data: sim.graficos.curva_deterioro.map(p => p.D),
        borderColor: "#d97706",
        fill: false,
        tension: 0.2
      },
      {
        label: `Umbral Crítico (${sim.parametros.D_umbral})`,
        data: sim.graficos.curva_deterioro.map(p => p.umbral),
        borderColor: "#dc2626",
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false
      }
    ];
  } else if (sim.caso_id === 3) {
    labels = sim.graficos.oscilacion_rk4.map(p => p.t.toFixed(2));
    datasets1 = [
      {
        label: "Desplazamiento x(t) RK4 [m]",
        data: sim.graficos.oscilacion_rk4.map(p => p.x_rk4),
        borderColor: "#059669",
        fill: false,
        tension: 0.2
      },
      {
        label: "Desplazamiento x(t) RK2 [m]",
        data: sim.graficos.oscilacion_rk2.map(p => p.x_rk2),
        borderColor: "#9333ea",
        borderDash: [4, 4],
        fill: false,
        tension: 0.2
      }
    ];
  } else {
    labels = sim.graficos.reconstruccion.map(p => p.t.toFixed(2));
    datasets1 = [
      {
        label: "Señal Real",
        data: sim.graficos.reconstruccion.map(p => p.real),
        borderColor: "#111827",
        pointRadius: 0,
        fill: false
      },
      {
        label: "Splines Cúbicos",
        data: sim.graficos.reconstruccion.map(p => p.spline),
        borderColor: "#2563eb",
        fill: false,
        tension: 0.1
      },
      {
        label: "Lagrange",
        data: sim.graficos.reconstruccion.map(p => p.lagrange),
        borderColor: "#dc2626",
        borderDash: [5, 4],
        fill: false
      }
    ];
  }

  chartPrincipal = new Chart(ctx1, {
    type: "line",
    data: { labels, datasets: datasets1 },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Gráfico 1: Solución y Escenario (${sim.tipo_escenario})`
        }
      }
    }
  });

  // Gráfico 2: Error, Convergencia y Comparación
  const metodosConError = sim.ejecuciones.filter(e =>
    Array.isArray(e.iteraciones) && e.iteraciones.some(it => it.error_abs !== null && it.error_abs > 0)
  );

  const colores = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2"];

  if (metodosConError.length > 0 && metodosConError.some(m => m.iteraciones.length > 1)) {
    const maxLen = Math.min(15, Math.max(...metodosConError.map(m => m.iteraciones.length)));
    const iterLabels = Array.from({ length: maxLen }, (_, i) => `It ${i + 1}`);

    chartErrores = new Chart(ctx2, {
      type: "line",
      data: {
        labels: iterLabels,
        datasets: metodosConError.map((m, idx) => ({
          label: `${m.metodo} (Error Abs.)`,
          data: m.iteraciones.slice(0, maxLen).map(it => it.error_abs || 1e-16),
          borderColor: colores[idx % colores.length],
          fill: false,
          tension: 0.1
        }))
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: "logarithmic",
            title: { display: true, text: "Error Absoluto (Escala Log)" }
          }
        },
        plugins: {
          title: {
            display: true,
            text: "Gráfico 2: Convergencia de Error por Método"
          }
        }
      }
    });
  } else {
    // Comparación en barras de error máximo de reconstrucción o error final
    const barLabels = sim.ejecuciones.map(e => e.metodo);
    const barData = sim.ejecuciones.map(e => {
      const err = e.metrica_error?.error_max_reconstruccion || e.metrica_error?.error_abs || 0;
      return Math.max(Number(err), 1e-15);
    });

    chartErrores = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: barLabels,
        datasets: [{
          label: "Error Absoluto Máximo",
          data: barData,
          backgroundColor: colores.slice(0, barLabels.length)
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: "logarithmic",
            title: { display: true, text: "Magnitud del Error (Escala Log)" }
          }
        },
        plugins: {
          title: {
            display: true,
            text: "Gráfico 2: Comparativa de Error entre Métodos"
          }
        }
      }
    });
  }
}

export async function refrescarHistorial() {
  const tbody = document.getElementById("tbody-historial");
  if (!tbody) return;

  try {
    const lista = await PersistenciaAPI.listarHistorial();
    if (!lista || lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No hay simulaciones guardadas aún. Ejecuta una y presiona "Guardar en Base de Datos".</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(row => `
      <tr>
        <td><strong>#${row.id}</strong></td>
        <td>${row.caso_nombre || `Módulo ${row.caso_id}`}</td>
        <td><span class="badge ${(row.escenario_tipo || "").toLowerCase()}">${row.escenario_tipo}</span></td>
        <td><small>${row.fecha}</small></td>
        <td><span class="badge ${row.estado === "COMPLETADA" ? "exito" : "advertencia"}">${row.estado}</span></td>
        <td>
          <button class="boton-pequeno" data-relanzar="${row.id}">Recuperar y Verificar</button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll("button[data-relanzar]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.relanzar);
        try {
          btn.disabled = true;
          btn.textContent = "Verificando...";
          const guardada = await PersistenciaAPI.obtenerSimulacion(id);
          const recalculada = ejecutarYRenderizar(guardada.caso_id, guardada.escenario_tipo);

          const v1 = guardada.ejecuciones?.[0]?.resumen?.valor;
          const v2 = recalculada.ejecuciones?.[0]?.resumen?.valor;
          const valNum1 = Array.isArray(v1) ? v1[0] : (typeof v1 === "object" ? (v1?.error_max ?? v1?.x ?? 0) : v1);
          const valNum2 = Array.isArray(v2) ? v2[0] : (typeof v2 === "object" ? (v2?.error_max ?? v2?.x ?? 0) : v2);

          const check = PersistenciaAPI.verificarCoincidencia(valNum1, valNum2, 1e-9);

          const resultadoMsg =
            `Prueba Oficial de Reproducibilidad (Simulación #${id}):\n\n` +
            `• Módulo: ${guardada.caso_nombre}\n` +
            `• Escenario: ${guardada.escenario_tipo}\n` +
            `• Valor guardado en SQLite: ${valNum1}\n` +
            `• Valor recalculado ahora: ${valNum2}\n` +
            `• Diferencia absoluta: ${check.diferencia.toExponential(4)}\n` +
            `• Criterio de tolerancia (≤ 1e-9): ${check.coincide ? "CUMPLE (REPRODUCIBLE)" : "NO CUMPLE"}`;

          alert(resultadoMsg);
        } catch (err) {
          alert("Error verificando simulación: " + err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = "Recuperar y Verificar";
        }
      });
    });
  } catch (err) {
    console.warn("Error refrescando historial:", err);
  }
}

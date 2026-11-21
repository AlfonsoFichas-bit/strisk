/**
 * SIMTELE-RISK — Persistencia API
 * Conecta con el backend SQLite nativo vía endpoints REST.
 * Si el servidor no está corriendo (p. ej. apertura directa en navegador vía file://),
 * cuenta con fallback a localStorage para que la aplicación nunca se rompa.
 */

export const PersistenciaAPI = {
  servidorDisponible: null,

  async verificarServidor() {
    if (this.servidorDisponible !== null) return this.servidorDisponible;
    try {
      const res = await fetch("/api/simulaciones", { method: "GET" });
      this.servidorDisponible = res.ok;
    } catch {
      this.servidorDisponible = false;
    }
    return this.servidorDisponible;
  },

  async guardarSimulacion(payload) {
    const hayServidor = await this.verificarServidor();
    if (hayServidor) {
      try {
        const res = await fetch("/api/simulaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
      } catch (err) {
        console.warn("Fallo guardado en SQLite, guardando en respaldo local:", err);
      }
    }

    // Fallback localStorage
    const localDb = JSON.parse(localStorage.getItem("simtele_historial_s2") || "[]");
    const nuevoId = localDb.length > 0 ? Math.max(...localDb.map(s => s.id)) + 1 : 1;
    const registro = {
      id: nuevoId,
      caso_id: payload.caso_id,
      caso_nombre: payload.caso_id === 1 ? "Detención de emergencia"
        : payload.caso_id === 2 ? "Deterioro mecánico"
        : payload.caso_id === 3 ? "Oscilaciones por viento"
        : "Reconstrucción de sensores",
      escenario_tipo: payload.tipo_escenario,
      fecha: new Date().toLocaleString(),
      usuario_equipo: payload.usuario_equipo || "Estacion-Local",
      estado: payload.estado || "COMPLETADA",
      parametros: payload.parametros,
      parametros_json: JSON.stringify(payload.parametros),
      fuente_datos: payload.fuente_datos,
      ejecuciones: payload.ejecuciones
    };
    localDb.unshift(registro);
    localStorage.setItem("simtele_historial_s2", JSON.stringify(localDb.slice(0, 50)));
    return { ok: true, simulacion_id: nuevoId, modo: "localStorage" };
  },

  async listarHistorial(filtros = {}) {
    const hayServidor = await this.verificarServidor();
    if (hayServidor) {
      try {
        const params = new URLSearchParams();
        if (filtros.caso_id) params.set("caso_id", filtros.caso_id);
        if (filtros.tipo) params.set("tipo", filtros.tipo);
        const res = await fetch(`/api/simulaciones?${params.toString()}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Error leyendo historial del servidor:", err);
      }
    }

    // Fallback localStorage
    const localDb = JSON.parse(localStorage.getItem("simtele_historial_s2") || "[]");
    return localDb.map(s => ({
      id: s.id,
      fecha: s.fecha,
      usuario_equipo: s.usuario_equipo,
      estado: s.estado,
      escenario_tipo: s.escenario_tipo,
      parametros_json: s.parametros_json,
      caso_id: s.caso_id,
      caso_nombre: s.caso_nombre
    }));
  },

  async obtenerSimulacion(id) {
    const hayServidor = await this.verificarServidor();
    if (hayServidor) {
      try {
        const res = await fetch(`/api/simulaciones/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Error obteniendo simulación del servidor:", err);
      }
    }

    const localDb = JSON.parse(localStorage.getItem("simtele_historial_s2") || "[]");
    const encontrada = localDb.find(s => s.id === Number(id));
    if (!encontrada) throw new Error("Simulación no encontrada en historial");
    return encontrada;
  },

  // Prueba de reproducibilidad exigida en la rúbrica oficial
  verificarCoincidencia(valorGuardado, valorRecalculado, tolerancia = 1e-9) {
    const v1 = Number(valorGuardado);
    const v2 = Number(valorRecalculado);
    if (isNaN(v1) || isNaN(v2)) {
      return { coincide: false, diferencia: NaN, tolerancia };
    }
    const diff = Math.abs(v1 - v2);
    return {
      coincide: diff <= tolerancia,
      diferencia: diff,
      tolerancia
    };
  }
};

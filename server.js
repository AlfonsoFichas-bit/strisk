/**
 * SIMTELE-RISK — Servidor Backend y API REST de Persistencia (Semana 2)
 * Desarrollado para Deno 2 con servidor HTTP Deno.serve y SQLite nativo.
 * Sirve archivos estáticos y gestiona la base de datos SQLite relacional.
 */

import { readFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { DatabaseSync } from "node:sqlite";

// 1. Inicializar SQLite nativo en Deno
mkdirSync("db", { recursive: true });
const db = new DatabaseSync("db/simtele.db");
const schema = readFileSync("db/schema.sql", "utf-8");
db.exec(schema);

// 2. Transacción de guardado de simulación completa
function guardarSimulacion(payload) {
  const { caso_id, tipo_escenario, parametros, fuente_datos, usuario_equipo, estado, ejecuciones } = payload;

  const resEsc = db.prepare(`
    INSERT INTO escenario (caso_id, tipo, parametros_json, fuente_datos)
    VALUES (?, ?, ?, ?)
  `).run(caso_id, tipo_escenario, JSON.stringify(parametros), fuente_datos || "Sintético / Parámetros supuestos");

  const escenarioId = Number(resEsc.lastInsertRowid);

  const resSim = db.prepare(`
    INSERT INTO simulacion (escenario_id, usuario_equipo, estado)
    VALUES (?, ?, ?)
  `).run(escenarioId, usuario_equipo || "Equipo-SIMTELE", estado || "COMPLETADA");

  const simulacionId = Number(resSim.lastInsertRowid);

  const stmtEjec = db.prepare(`
    INSERT INTO ejecucion_metodo (simulacion_id, metodo, tolerancia, paso, max_iter, convergio, tiempo_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtIter = db.prepare(`
    INSERT INTO iteracion_resultado (ejecucion_id, numero, aproximacion_json, residual, error_abs, error_rel)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const stmtRes = db.prepare(`
    INSERT INTO resultado_resumen (ejecucion_id, referencia, valor_json, metrica_error_json, interpretacion)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const ej of ejecuciones) {
    const infoEj = stmtEjec.run(
      simulacionId,
      ej.metodo,
      ej.tolerancia ?? null,
      ej.paso ?? null,
      ej.max_iter ?? null,
      ej.convergio ? 1 : 0,
      ej.tiempo_ms ?? 0
    );
    const ejecucionId = Number(infoEj.lastInsertRowid);

    if (Array.isArray(ej.iteraciones)) {
      for (const it of ej.iteraciones) {
        stmtIter.run(
          ejecucionId,
          it.numero,
          JSON.stringify(it.aproximacion),
          it.residual ?? null,
          it.error_abs ?? null,
          it.error_rel ?? null
        );
      }
    }

    if (ej.resumen) {
      stmtRes.run(
        ejecucionId,
        ej.resumen.referencia || "Referencia numérica",
        JSON.stringify(ej.resumen.valor ?? null),
        JSON.stringify(ej.resumen.metrica_error ?? {}),
        JSON.stringify(ej.resumen.interpretacion ?? {})
      );
    }
  }

  return simulacionId;
}

// 3. Handlers de API REST
async function handleRequest(req) {
  const url = new URL(req.url, "http://localhost:3000");

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // GET /api/simulaciones: listar historial
  if (url.pathname === "/api/simulaciones" && req.method === "GET") {
    const casoId = url.searchParams.get("caso_id");
    const tipo = url.searchParams.get("tipo");

    let query = `
      SELECT s.id, s.fecha, s.usuario_equipo, s.estado,
             e.tipo AS escenario_tipo, e.parametros_json,
             c.id AS caso_id, c.nombre AS caso_nombre
      FROM simulacion s
      JOIN escenario e ON s.escenario_id = e.id
      JOIN caso_estudio c ON e.caso_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (casoId) { query += " AND c.id = ?"; params.push(Number(casoId)); }
    if (tipo)   { query += " AND e.tipo = ?"; params.push(tipo); }
    query += " ORDER BY s.id DESC LIMIT 100";

    const rows = db.prepare(query).all(...params);
    return new Response(JSON.stringify(rows), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // POST /api/simulaciones: guardar nueva simulación
  if (url.pathname === "/api/simulaciones" && req.method === "POST") {
    try {
      const body = await req.json();
      const id = guardarSimulacion(body);
      return new Response(JSON.stringify({ ok: true, simulacion_id: id }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  // GET /api/simulaciones/:id: detalle completo
  const matchDetalle = url.pathname.match(/^\/api\/simulaciones\/(\d+)$/);
  if (matchDetalle && req.method === "GET") {
    const simId = Number(matchDetalle[1]);
    const sim = db.prepare(`
      SELECT s.*, e.caso_id, e.tipo AS escenario_tipo, e.parametros_json, e.fuente_datos, c.nombre AS caso_nombre
      FROM simulacion s
      JOIN escenario e ON s.escenario_id = e.id
      JOIN caso_estudio c ON e.caso_id = c.id
      WHERE s.id = ?
    `).get(simId);

    if (!sim) {
      return new Response(JSON.stringify({ error: "Simulación no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const ejecuciones = db.prepare(`SELECT * FROM ejecucion_metodo WHERE simulacion_id = ?`).all(simId);

    for (const ej of ejecuciones) {
      ej.iteraciones = db.prepare(`
        SELECT numero, aproximacion_json, residual, error_abs, error_rel
        FROM iteracion_resultado WHERE ejecucion_id = ? ORDER BY numero ASC
      `).all(ej.id).map(r => ({ ...r, aproximacion: JSON.parse(r.aproximacion_json) }));

      const res = db.prepare(`SELECT * FROM resultado_resumen WHERE ejecucion_id = ?`).get(ej.id);
      ej.resumen = res ? {
        referencia: res.referencia,
        valor: JSON.parse(res.valor_json),
        metrica_error: JSON.parse(res.metrica_error_json),
        interpretacion: JSON.parse(res.interpretacion)
      } : null;
    }

    sim.parametros = JSON.parse(sim.parametros_json);
    return new Response(JSON.stringify({ ...sim, ejecuciones }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // 4. Servir archivos estáticos desde ./public
  const relPath = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "");
  const candidatePath = join("public", relPath);

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    const content = readFileSync(candidatePath);
    const mimeMap = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml"
    };
    const mime = mimeMap[extname(candidatePath)] || "application/octet-stream";
    return new Response(content, { headers: { "Content-Type": mime } });
  }

  return new Response("Recurso no encontrado", { status: 404 });
}

// 5. Iniciar servidor nativo de Deno
const PORT = 3000;
Deno.serve({ port: PORT }, (req) => handleRequest(req));
console.log(`[SIMTELE-RISK] Servidor Deno activo en http://localhost:${PORT}`);

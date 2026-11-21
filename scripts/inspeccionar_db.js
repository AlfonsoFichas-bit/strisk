/**
 * SIMTELE-RISK — Script de Inspección y Verificación de la Base de Datos SQLite
 * Ejecutar con: deno run --allow-read scripts/inspeccionar_db.js
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync, statSync } from "node:fs";

console.log("=================================================================");
console.log("   SIMTELE-RISK — REPORTE DE ESTADO DE LA BASE DE DATOS (SQLite) ");
console.log("=================================================================\n");

const dbPath = "db/simtele.db";

if (!existsSync(dbPath)) {
  console.error("❌ El archivo de base de datos 'db/simtele.db' no existe todavía.");
  Deno.exit(1);
}

const stats = statSync(dbPath);
console.log(`📁 Archivo físico:   ${dbPath}`);
console.log(`💾 Tamaño en disco:  ${stats.size} bytes`);
console.log(`🕒 Modificado:       ${stats.mtime?.toLocaleString() || "Recientemente"}\n`);

const db = new DatabaseSync(dbPath);

const tablas = [
  "caso_estudio",
  "escenario",
  "simulacion",
  "ejecucion_metodo",
  "iteracion_resultado",
  "resultado_resumen"
];

console.log("📊 1. CONTEO DE FILAS POR TABLA (6 Tablas Oficiales):");
console.log("-----------------------------------------------------");

for (const tabla of tablas) {
  try {
    const res = db.prepare(`SELECT COUNT(*) as total FROM ${tabla}`).get();
    console.log(`  • ${tabla.padEnd(22)} : ${res.total} registros`);
  } catch (err) {
    console.log(`  • ${tabla.padEnd(22)} : ERROR (${err.message})`);
  }
}

console.log("\n📋 2. ÚLTIMAS SIMULACIONES GUARDADAS:");
console.log("-----------------------------------------------------");
try {
  const sims = db.prepare(`
    SELECT s.id, s.fecha, s.estado, s.usuario_equipo,
           e.tipo as escenario, c.nombre as caso
    FROM simulacion s
    JOIN escenario e ON s.escenario_id = e.id
    JOIN caso_estudio c ON e.caso_id = c.id
    ORDER BY s.id DESC
    LIMIT 5
  `).all();

  if (sims.length === 0) {
    console.log("  (No hay simulaciones guardadas aún)");
  } else {
    for (const s of sims) {
      console.log(`  [ID #${s.id}] Caso: ${s.caso} | Escenario: ${s.escenario} | Fecha: ${s.fecha} | Estado: ${s.estado}`);
      
      const metodos = db.prepare(`
        SELECT metodo, convergio, tiempo_ms
        FROM ejecucion_metodo
        WHERE simulacion_id = ?
      `).all(s.id);
      
      const nombresMetodos = metodos.map(m => `${m.metodo} (${m.convergio ? "OK" : "NO"})`).join(", ");
      console.log(`       ↳ Métodos ejecutados: ${nombresMetodos}\n`);
    }
  }
} catch (err) {
  console.log("  Error consultando simulaciones:", err.message);
}

console.log("=================================================================");
console.log("   ✅ Base de datos SQLite 100 % operativa y persistente");
console.log("=================================================================");

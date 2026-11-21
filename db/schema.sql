PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS caso_estudio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    modelo_version TEXT NOT NULL DEFAULT 'v2.0-s2'
);

CREATE TABLE IF NOT EXISTS escenario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caso_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('NORMAL', 'ESTRES', 'MAL_CONDICIONADO')),
    parametros_json TEXT NOT NULL,
    fuente_datos TEXT NOT NULL,
    FOREIGN KEY (caso_id) REFERENCES caso_estudio(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS simulacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escenario_id INTEGER NOT NULL,
    fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    usuario_equipo TEXT DEFAULT 'Estacion-Local',
    estado TEXT NOT NULL CHECK (estado IN ('COMPLETADA', 'CON_ADVERTENCIAS', 'FALLIDA')),
    FOREIGN KEY (escenario_id) REFERENCES escenario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ejecucion_metodo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulacion_id INTEGER NOT NULL,
    metodo TEXT NOT NULL,
    tolerancia REAL,
    paso REAL,
    max_iter INTEGER,
    convergio INTEGER NOT NULL CHECK (convergio IN (0, 1)),
    tiempo_ms REAL NOT NULL,
    FOREIGN KEY (simulacion_id) REFERENCES simulacion(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS iteracion_resultado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ejecucion_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    aproximacion_json TEXT NOT NULL,
    residual REAL,
    error_abs REAL,
    error_rel REAL,
    FOREIGN KEY (ejecucion_id) REFERENCES ejecucion_metodo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resultado_resumen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ejecucion_id INTEGER NOT NULL UNIQUE,
    referencia TEXT NOT NULL,
    valor_json TEXT NOT NULL,
    metrica_error_json TEXT NOT NULL,
    interpretacion TEXT NOT NULL,
    FOREIGN KEY (ejecucion_id) REFERENCES ejecucion_metodo(id) ON DELETE CASCADE
);

-- Índices para optimización de consultas del historial
CREATE INDEX IF NOT EXISTS idx_simulacion_fecha ON simulacion(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_escenario_caso ON escenario(caso_id, tipo);

-- Inserción de los cuatro casos de estudio oficiales
INSERT OR IGNORE INTO caso_estudio (id, nombre, modelo_version) VALUES
(1, 'Detención de emergencia', 'v2.0'),
(2, 'Deterioro mecánico', 'v2.0'),
(3, 'Oscilaciones por viento', 'v2.0'),
(4, 'Reconstrucción de sensores', 'v2.0');

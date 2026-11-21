# Modelo Entidad-Relación (DER) — SIMTELE-RISK Semana 2

Este diagrama describe la arquitectura de persistencia relacional implementada en SQLite con 6 entidades y relaciones íntegras (`ON DELETE CASCADE`), requerida para la Semana 2.

```mermaid
erDiagram
    CASO_ESTUDIO ||--o{ ESCENARIO : tiene
    ESCENARIO ||--o{ SIMULACION : genera
    SIMULACION ||--o{ EJECUCION_METODO : contiene
    EJECUCION_METODO ||--o{ ITERACION_RESULTADO : registra
    EJECUCION_METODO ||--|| RESULTADO_RESUMEN : produce

    CASO_ESTUDIO {
        int id PK "Identificador único"
        string nombre "Nombre del módulo (1 a 4)"
        string modelo_version "Versión del modelo físico"
    }
    ESCENARIO {
        int id PK "Identificador único"
        int caso_id FK "Referencia a caso_estudio"
        string tipo "NORMAL | ESTRES | MAL_CONDICIONADO"
        text parametros_json "Parámetros físicos y numéricos en JSON"
        string fuente_datos "Origen sintético/académico"
    }
    SIMULACION {
        int id PK "Identificador único"
        int escenario_id FK "Referencia a escenario"
        datetime fecha "Timestamp de ejecución"
        string usuario_equipo "Operador / Equipo"
        string estado "COMPLETADA | CON_ADVERTENCIAS | FALLIDA"
    }
    EJECUCION_METODO {
        int id PK "Identificador único"
        int simulacion_id FK "Referencia a simulación"
        string metodo "Nombre del método numérico ejecutado"
        real tolerancia "Tolerancia ε fijada"
        real paso "Paso temporal h o espacial"
        int max_iter "Máximo de iteraciones configurado"
        int convergio "1 si convergió, 0 si no"
        real tiempo_ms "Tiempo de cálculo en ms"
    }
    ITERACION_RESULTADO {
        int id PK "Identificador único"
        int ejecucion_id FK "Referencia a ejecucion_metodo"
        int numero "Número de iteración / subintervalo"
        text aproximacion_json "Vector o escalar aproximado"
        real residual "Residual ||f(x)|| o ||b-Ax||"
        real error_abs "Error absoluto frente a referencia"
        real error_rel "Error relativo"
    }
    RESULTADO_RESUMEN {
        int id PK "Identificador único"
        int ejecucion_id FK "Referencia 1:1 a ejecucion_metodo"
        text referencia "Referencia analítica o numérica"
        text valor_json "Resultado final condensado"
        text metrica_error_json "Métricas globales de error"
        text interpretacion "Conclusión matemática y conclusión del problema"
    }
```

## Cumplimiento de la consigna de Base de Datos
- **6 tablas requeridas:** `caso_estudio`, `escenario`, `simulacion`, `ejecucion_metodo`, `iteracion_resultado`, `resultado_resumen`.
- **Integridad referencial activa:** Llaves foráneas con eliminación en cascada (`PRAGMA foreign_keys = ON;`).
- **Prueba de tolerancia (1e-9):** Guarda una simulación completa, reinicia la app, recupera parámetros e iteraciones, repite el cálculo y demuestra coincidencia estricta.

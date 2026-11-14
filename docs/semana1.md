# SEMANA 1 — Modelos y primeros algoritmos · 6 puntos (de 25)

## Entregable de la Semana 1
- **Avance en PDF** con:
  - Fórmulas de los modelos
  - Ejemplos resueltos a mano
  - Matrices y soluciones de referencia
  - Tablas de error

## Qué se evalúa en la Semana 1 (según la rúbrica)
| Criterio | Puntos S1 |
| --- | --- |
| Modelos integrados de los cuatro casos y supuestos | 2 |
| Teoría de errores transversal y sistemas lineales | 3 |
| Aplicación web, DER, guardado y recuperación (primer avance) | 1 |
| **Total Semana 1** | **6** |

## Tareas concretas a realizar
1. **Plantear los CUATRO casos de estudio** y la relación entre modelos y métodos:
   - Módulo 1: Detención de emergencia de cabinas (EDO + integración + raíces)
   - Módulo 2: Deterioro mecánico y mantenimiento (raíces + sistemas lineales)
   - Módulo 3: Oscilaciones por viento (EDO + integración)
   - Módulo 4: Reconstrucción de señales de sensores (interpolación)
2. **Implementar la teoría de errores TRANSVERSAL**: error absoluto, relativo (si procede),
   porcentual, residual y sensibilidad, aplicable a todos los módulos.
3. **Implementar sistemas lineales** (A·x = b con tamaño ≥ 4):
   - Jacobi
   - Gauss-Seidel
   - Factorización LU
   - Gradiente conjugado (sobre matriz SPD)
   - Solución exacta/directa de referencia
   - Evidencia: residuo, número de condición, iteraciones y errores
4. **Primeras pruebas de los tres escenarios** en AL MENOS UN caso:
   - NORMAL (parámetros nominales)
   - ESTRÉS (condiciones más exigentes)
   - MAL CONDICIONADO (ejemplo matemáticamente sensible, ej. κ(A) elevado)
   - Definir (plantear, sin ejecutar aún) los escenarios de los otros tres casos.
5. **Prototipo web** con los cuatro módulos visibles (pantallas: Inicio, Módulo, Resultados,
   Interpretación, Historial).
6. **DER inicial** (modelo entidad-relación con las entidades: caso_estudio, escenario,
   simulacion, ejecucion_metodo, iteracion_resultado, resultado_resumen).
7. **Repositorio GitHub** con README.

## Recordatorios importantes del docente
- La teoría de errores NO es un módulo aparte: se aplica en todo.
- No confundir mal condicionamiento con riesgo físico o falta de convergencia.
- Usar matriz SPD para el gradiente conjugado.
- Una interfaz bonita NO compensa algoritmos incorrectos.
- Modalidad: individual o grupal (máx. 4 integrantes). Duración total: 3 semanas · 25 puntos.

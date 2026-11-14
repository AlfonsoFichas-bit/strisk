# SIMTELE-RISK — Métodos Numéricos — Semana 1

Prototipo web educativo que aplica métodos numéricos al análisis de riesgos en un sistema de transporte por cable, usando datos sintéticos y sin conexión a equipos reales.

## Integrantes

- Choque Sillo Ronald
- Limachi Mamani Ronal
- Quispe Chino Jose Luis
- Velasquez Gonzales Juan Pablo

## Qué está implementado en S1

- **Cuatro casos de estudio** con modelo, variables, unidades, hipótesis y escenarios definidos: detención de emergencia, deterioro mecánico, oscilaciones por viento y reconstrucción de sensores.
- **Módulo 1 — Detención de emergencia:** referencia analítica de tiempo de detención, distancia de frenado y posición final, con paneles de Resultados e Interpretación.
- **Módulo 2 — Deterioro mecánico:** tres escenarios ejecutables (NORMAL, ESTRÉS y MAL CONDICIONADO) para la raíz positiva de `D(t) = D₀ + αt + βt² = umbral`, con derivada, residual y paneles de Resultados e Interpretación.
- **Análisis de sensibilidad en el Módulo 2:** cálculo de `∂t*/∂α` y `∂t*/∂β` por diferencias centradas (ε = 0.1 % del parámetro), con nota de amplificación para el escenario MAL CONDICIONADO.
- **Teoría de errores transversal:** calculadora de error absoluto, relativo y porcentual, además del concepto de residual y sensibilidad.
- **Sistemas lineales (matriz 4 × 4 SPD):** Jacobi, Gauss-Seidel, factorización LU y gradiente conjugado, con solución de referencia, iteraciones, residual, error absoluto máximo y estado de convergencia.
- **Número de condición:** cálculo de `κ∞(A)` por inversa explícita y `κ₂(A)` por iteración de potencia, con interpretación del condicionamiento de la matriz.
- **DER inicial:** seis entidades (`CASO_ESTUDIO`, `ESCENARIO`, `SIMULACION`, `EJECUCION_METODO`, `ITERACION_RESULTADO`, `RESULTADO_RESUMEN`).
- **Historial local:** el último resultado del Módulo 2 puede guardarse y consultarse mediante `localStorage`.
- **Navegación entre módulos** y paneles de Resultados e Interpretación en los cuatro módulos; los módulos 3 y 4 muestran marcadores de posición para la Semana 2.

## Pendiente para S2/S3

- Solución de EDO con RK2 y RK4 para los módulos 1 y 3.
- Integración numérica: trapecio compuesto, Simpson 1/3 compuesto y Romberg.
- Métodos de raíces: bisección, Newton-Raphson y secante.
- Interpolación: Lagrange, Newton por diferencias divididas y splines cúbicos, con análisis del error de reconstrucción y del efecto de Runge.
- Persistencia completa en base de datos (reemplazo del historial en `localStorage`).
- Población completa de los paneles de Resultados e Interpretación de los módulos 3 y 4.
- Gráficas de convergencia, energía y comparación de escenarios.

## Cómo ejecutar

Abrir `index.html` en un navegador (no requiere servidor, build, ni dependencias).

## Estructura del repositorio

```text
index.html      Interfaz de los cuatro módulos y secciones transversales
principal.js    Cálculos numéricos, paneles e historial local
estilos.css     Estilos del prototipo
docs/           Consigna y criterios de la Semana 1
openspec/       Planificación y especificaciones del cambio
```

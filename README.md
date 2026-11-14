# SIMTELE-RISK — Métodos Numéricos — Semana 1

Prototipo web educativo que aplica métodos numéricos al análisis de riesgos en un sistema de transporte por cable, usando datos sintéticos y sin conexión a equipos reales.

## Integrantes

- Choque Sillo Ronald
- Limachi Mamani Ronal
- Quispe Chino Jose Luis
- Velasquez Gonzales Juan Pablo

## Qué está implementado en S1

- **Cuatro casos de estudio** con ficha de modelo: variables, unidades, hipótesis, alcance, fuente de parámetros y relación modelo–método.
- **Módulo 1 — Detención de emergencia:** referencia analítica con tiempo de reacción, tiempo de frenado, distancia de reacción, distancia de frenado, distancia total, posición final, distancia disponible y margen. Incluye comparación NORMAL/ESTRÉS y un subexperimento MAL CONDICIONADO con desaceleración variable `dv/dt = −(a₀ − kv)` y solución analítica.
- **Módulo 2 — Deterioro mecánico:** tres escenarios ejecutables (NORMAL, ESTRÉS y MAL CONDICIONADO) para la raíz de `D(t) = D₀ + αt + βt² = umbral`, con residual, derivada `D′(t*)`, condición absoluta `1/|D′(t*)|` y paneles de Resultados e Interpretación. Incluye un modelo analítico de mantenimiento retrasado.
- **Sensibilidad en el Módulo 2:** derivadas `∂t*/∂α`, `∂t*/∂β` y `∂t*/∂umbral` por diferencias centrales con paso relativo de 0,1 % (piso `1e−9`), comparadas con las derivadas analíticas. Se reportan elasticidades relativas para distinguir sensibilidad absoluta de relativa.
- **Módulo 3 — Oscilaciones por viento:** referencia analítica de vibración libre, clasificación del régimen de amortiguamiento, amplitud forzada de régimen permanente y sensibilidad `dX/dω`. Los escenarios NORMAL, ESTRÉS y MAL (bajo amortiguamiento cerca de resonancia) están definidos con valores numéricos.
- **Módulo 4 — Reconstrucción de sensores:** escenarios numéricos con nodos, ruido, semilla y puntos ocultos; cálculo de `κ∞(V)` y `κ₂(V)` para la matriz de Vandermonde con nodos equiespaciados y nodos agrupados; cruces de umbral y métodos previstos para S2.
- **Teoría de errores transversal:** calculadora de error absoluto, relativo y porcentual; residual, sensibilidad y condicionamiento aplicados en los cuatro módulos.
- **Sistemas lineales:** Jacobi, Gauss-Seidel, LU sin pivoteo y gradiente conjugado sobre dos sistemas 4×4: `A` (SPD bien condicionada) y `H` (Hilbert 4×4 SPD mal condicionada). Se muestran solución, iteraciones, residual, error absoluto máximo, error relativo máximo y error porcentual.
- **Historial de iteraciones:** primeras y últimas iteraciones de Jacobi, Gauss-Seidel y gradiente conjugado, con residual y errores contra la solución de referencia.
- **Condicionamiento:** `κ∞(A)` por inversa explícita y `κ₂(A)` mediante autovalores de `AᵀA` (Jacobi cíclico), con interpretación y factores `L` y `U`.
- **Prueba de perturbación:** se perturba `b` un ±1 % alternado y se compara la amplificación observada con `κ∞(A)` y su cota teórica.
- **Guardado y recuperación:** `localStorage` guarda ejecuciones completas de sistemas lineales (matriz, tolerancia, máximo de iteraciones, métodos, errores, condición y perturbación) y resúmenes de deterioro. Las ejecuciones guardadas pueden cargarse y repetirse.
- **DER inicial y modelo relacional:** seis entidades (`CASO_ESTUDIO`, `ESCENARIO`, `SIMULACION`, `EJECUCION_METODO`, `ITERACION_RESULTADO`, `RESULTADO_RESUMEN`), incluyendo `tiempo_ms` y usuario/equipo opcional.
- **Navegación entre módulos** y paneles de Resultados e Interpretación en los cuatro módulos.

## Evidencia numérica de referencia

- Sistemas lineales con `A`: Jacobi converge en 20 iteraciones, Gauss-Seidel en 8, LU es exacto y el gradiente conjugado converge en 4. `κ∞(A) ≈ 3,1373` y `κ₂(A) ≈ 2,3597`.
- Hilbert 4×4: `κ∞(H) ≈ 28 375` y `κ₂(H) ≈ 15 513,7`. Jacobi diverge, Gauss-Seidel no alcanza la tolerancia en 100 iteraciones y el gradiente conjugado converge en 4.
- Deterioro: `t* ≈ 12,3607`, `8,2574` y `9,1608` días para NORMAL, ESTRÉS y MAL. En MAL, `1/|D′| ≈ 8 451,5`.
- Detención: NORMAL `d_total ≈ 43,33 m` con margen `36,67 m`; ESTRÉS `d_total = 119 m` con margen `1 m`; MAL `d_total ≈ 440,91 m` con margen `59,09 m`.
- Oscilaciones: NORMAL `X ≈ 0,0624 m`; ESTRÉS `X ≈ 0,6257 m`; MAL `X ≈ 1,0877 m` con `|dX/dω| ≈ 7,12`.
- Sensores: `κ∞(V) ≈ 1 653,33` con nodos equiespaciados y `κ∞(V) ≈ 4,258×10⁷` con nodos agrupados.

## Pendiente para S2/S3

- Solución de EDO con RK2 y RK4 para los módulos 1 y 3.
- Integración numérica: trapecio compuesto, Simpson 1/3 compuesto y Romberg.
- Métodos de raíces: bisección, Newton-Raphson y secante.
- Interpolación: Lagrange, Newton por diferencias divididas y splines cúbicos, con análisis del error de reconstrucción y del efecto de Runge.
- Persistencia completa en base de datos (reemplazo del historial en `localStorage`).
- Generación de ruido y reconstrucción efectiva de la señal en el Módulo 4.
- Gráficas de convergencia, energía y comparación de escenarios.
- Conclusiones finales, video y defensa.

El informe de la Semana 1 se desarrolla aparte en LaTeX. Este repositorio contiene el prototipo web y la evidencia numérica que lo respalda.

## Cómo ejecutar

Abrir `index.html` en un navegador. No requiere servidor, build ni dependencias.

## Estructura del repositorio

```text
index.html      Interfaz de los cuatro módulos y secciones transversales
principal.js    Cálculos numéricos, paneles e historial local
estilos.css     Estilos del prototipo
docs/           Consigna y criterios de la Semana 1
openspec/       Planificación y especificaciones del cambio
```

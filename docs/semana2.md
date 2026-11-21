# SIMTELE-RISK · Semana 2 — Integración matemática y aplicación (9 puntos)

Extracción de la consigna oficial: únicamente lo exigido para el desarrollo y la programación de la Semana 2.

## 1. Implementación de métodos numéricos (obligatoria)

Implementar las familias que faltan (la teoría de errores y los sistemas lineales ya se implementaron en la Semana 1, pero siguen siendo transversales):

| Familia | Métodos obligatorios |
| --- | --- |
| Interpolación | Lagrange; Newton (diferencias divididas); splines cúbicos |
| Raíces | Bisección; Newton-Raphson; secante |
| Integración | Trapecio compuesto; Simpson 1/3 compuesto; Romberg |
| EDO | Runge-Kutta de 2.º orden (variante declarada); Runge-Kutta de 4.º orden |

Reglas transversales de implementación:

- La teoría de errores (absoluto, relativo si procede, porcentual, residual y sensibilidad) debe aplicarse en **todas** las familias de métodos y en **todos** los módulos. No se presenta como módulo independiente.
- El sistema, como conjunto, debe incluir **todos** los métodos de la cobertura matemática mínima; no es necesario ejecutar todas las familias en cada módulo, se distribuyen por pertinencia.
- Cada familia debe tener una prueba reproducible con solución analítica cuando sea posible; si no, una referencia numérica de precisión justificada.
- Calcular errores sin dividir por cero.

## 2. Ejecución de los cuatro módulos (escenario NORMAL obligatorio)

Los cuatro módulos deben ejecutar **al menos el escenario NORMAL** y mostrar:

- Tablas de iteraciones o de refinamiento (paso, subintervalos, tolerancia), valor aproximado y criterio de parada.
- Errores por método.
- **Dos gráficos por módulo**: solución/escenario y error/convergencia/comparación.

Los módulos y sus métodos pertinentes (asignación por módulo):

| Módulo | Métodos que le corresponden |
| --- | --- |
| 1. Detención de emergencia | EDO (RK2 y RK4 sobre dx/dt = v, dv/dt = -a(v,t)); integración de v(t) con trapecio, Simpson y Romberg; raíces (bisección, Newton, secante) para el instante v(t) = 0 |
| 2. Deterioro mecánico | Raíces (bisección, Newton, secante) para D(t) - D_umbral = 0; sistemas lineales (Jacobi, Gauss-Seidel, LU, gradiente conjugado) sobre un sistema SPD; integración opcional de la tasa de deterioro |
| 3. Oscilaciones por viento | EDO (RK2 y RK4 sobre x' = v, v' = (F(t) - cv - kx)/m); integración de \|x(t)\| o x(t)² con trapecio, Simpson y Romberg; sistemas lineales auxiliares de calibración si corresponde |
| 4. Reconstrucción de sensores | Interpolación obligatoria (Lagrange, Newton, splines cúbicos); sistemas lineales auxiliares de calibración; raíces de cruce de umbral de la curva interpolada cuando corresponda |

Referencias analíticas verificables por módulo:

- Módulo 1: desaceleración constante, v(t) = v0 - at, x(t) = x0 + v0·t - (a/2)·t², t_det = v0/a, distancia de frenado v0²/(2a).
- Módulo 2: D(t) = D0 + αt + βt²; resolver la cuadrática y elegir la raíz físicamente admisible; construir A·x* = b con x* conocido y matriz SPD.
- Módulo 3: F(t) = 0 en régimen subamortiguado, x(t) = e^(-ζω₀t)·[C1·cos(ωd·t) + C2·sin(ωd·t)], o un caso de vibración libre más simple.
- Módulo 4: datos sintéticos derivados de y(t) = sin(t) o y(t) = e^(-t), con puntos ocultados para calcular el error real de reconstrucción.

## 3. Escenarios ESTRÉS y MAL CONDICIONADO

En la Semana 2 se incorporan estos dos escenarios y las primeras comparaciones de resultados:

- **ESTRÉS**: condiciones más exigentes dentro del modelo (pasos mayores/menores, perturbaciones más intensas, más puntos o más tiempo de simulación). Evidencia: comparación de desempeño y sensibilidad; explicar si cambian el riesgo modelado y el error numérico.
- **MAL CONDICIONADO**: ejemplo matemáticamente sensible (matriz con κ(A) elevado, nodos de interpolación desfavorables, raíz múltiple/derivada pequeña o modelo de sensibilidad demostrable). Evidencia: medición cuantitativa del mal condicionamiento, distinguiéndolo de un fallo de convergencia.

Restricciones:

- No toda situación físicamente peligrosa es un problema mal condicionado; el escenario mal condicionado puede ser un subexperimento numérico vinculado al módulo, identificado como tal.
- Evitar matrices no SPD al ejecutar gradiente conjugado estándar; justificar las condiciones de convergencia de los métodos iterativos.
- No equiparar mal condicionamiento, riesgo físico, alta exigencia y falta de convergencia.

## 4. Base de datos y persistencia (obligatoria en Semana 2)

- Base de datos **funcional**, con prueba de guardar y recuperar una ejecución histórica.
- Requisito del modelo de datos: DER (modelo entidad-relación), modelo relacional y script SQL o migraciones. El sistema debe guardar una ejecución completa y permitir recuperarla tras reiniciar la aplicación.
- Entidades mínimas y campos sugeridos:

| Entidad | Campos |
| --- | --- |
| caso_estudio | id, nombre, modelo_version |
| escenario | id, caso_id, tipo (NORMAL/ESTRÉS/MAL_CONDICIONADO), parámetros_json, fuente_datos |
| simulacion | id, escenario_id, fecha, usuario/equipo opcional, estado |
| ejecucion_metodo | id, simulacion_id, metodo, tolerancia, paso, max_iter, convergio, tiempo_ms |
| iteracion_resultado | id, ejecucion_id, numero, aproximacion_json, residual, error_abs, error_rel |
| resultado_resumen | id, ejecucion_id, referencia, valor_json, metrica_error_json, interpretacion |

- Prueba obligatoria de persistencia: ejecutar → guardar → cerrar/actualizar → recuperar parámetros, iteraciones y gráficos → repetir el cálculo → demostrar coincidencia dentro de la tolerancia. El historial NO puede depender solo de variables temporales en memoria.

## 5. Aplicación web (pantallas/funciones requeridas)

Los módulos de la aplicación web son exactamente los cuatro casos de estudio. Dentro de cada módulo se accede a los métodos numéricos pertinentes, sus tablas, gráficos, escenarios y resultados. Se debe poder volver al panel general de comparación y al historial de experimentos.

| Pantalla / función | Contenido imprescindible |
| --- | --- |
| Inicio | Cuatro tarjetas: Detención, Deterioro, Oscilaciones, Sensores |
| Módulo del caso | Modelo, parámetros con validaciones, elección NORMAL/ESTRÉS/MAL CONDICIONADO |
| Resultados | Métodos aplicables, tablas de iteraciones, error y comparación gráfica |
| Interpretación | Conclusión matemática y conclusión sobre el caso, claramente separadas |
| Historial | Buscar, abrir, visualizar y relanzar al menos una simulación ya guardada |

Evidencias obligatorias dentro de cada módulo:

- Descripción del escenario, ecuación/modelo, variables y unidades; fuente de cada parámetro.
- Tres ejecuciones (NORMAL, ESTRÉS, MAL CONDICIONADA) con entradas reproducibles.
- Tablas de iteraciones/refinamiento, valor aproximado y criterio de parada.
- Referencia analítica cuando exista; si no, solución independiente de alta precisión justificada.
- Errores por método y escenario, residuales, cambios ante perturbaciones y convergencia.
- Al menos dos gráficos útiles por módulo: solución/escenario y error/convergencia/comparación.
- Conclusión numérica y conclusión del problema, separadas.

## 6. Entrega de la Semana 2

- Enlace de la aplicación funcionando.
- Repositorio actualizado (GitHub).
- Informe de experimentos y fallos detectados.

## 7. Rúbrica de evaluación (total 25 puntos)

| Criterio verificable | S1 | S2 | S3 | Total |
| --- | --- | --- | --- | --- |
| Modelos integrados de los cuatro casos y supuestos | 2 | 0 | 0 | 2 |
| Teoría de errores transversal y sistemas lineales | 3 | 0 | 0 | 3 |
| Interpolación, raíces, integración y EDO implementados | 0 | 5 | 0 | 5 |
| Escenarios 3 × 4, tablas, gráficos y comparación/validación | 0 | 2 | 4 | 6 |
| Análisis y conclusiones de métodos + problemas resueltos | 0 | 0 | 3 | 3 |
| Aplicación web, DER, guardado y recuperación | 1 | 2 | 1 | 4 |
| GitHub, video y defensa de todos los integrantes | 0 | 0 | 2 | 2 |
| **TOTAL** | **6** | **9** | **10** | **25** |

Puntos de la rúbrica que se evalúan en la Semana 2 (9 en total):

- Interpolación, raíces, integración y EDO implementados: **5 puntos**.
- Escenarios 3 × 4, tablas, gráficos y comparación/validación: **2 puntos** (de la parte Semana 2; los otros 4 corresponden a la Semana 3).
- Aplicación web, DER, guardado y recuperación: **2 puntos** (de la parte Semana 2; 1 es de Semana 1 y 1 de Semana 3).

Nota de corrección general: una interfaz atractiva no compensa algoritmos incorrectos. Para los puntos de conclusiones se requieren dos conclusiones diferenciadas por cada caso (una sobre métodos numéricos y otra sobre el problema aplicado).

## 8. Reglas metodológicas que afectan el desarrollo

- Los cuatro módulos y los tres escenarios en cada uno son obligatorios.
- Usar funciones de prueba con solución analítica siempre que sea posible; justificar referencias numéricas donde no exista solución cerrada útil.
- Declarar los datos como sintéticos y los parámetros como supuestos; el sistema es estrictamente educativo y sin conexión con equipos de control reales.
- En trabajo individual se admite un diseño visual austero, pero no se reduce el alcance matemático ni la rúbrica.
- Modalidad: individual o grupal (máximo 4 integrantes).
- Mas en el dorectorio semana_2_dev/ (docs\semana_2_dev) con indicaciones para proseguir con la semana 2

# SIMTELE-RISK — Requisitos de desarrollo y programación

Extraído de la consigna oficial del Desafío Integrador Final de Métodos Numéricos.

## Datos generales

| Ítem | Valor |
| --- | --- |
| Duración | 3 semanas |
| Puntaje total | 25 puntos |
| Modalidad | Individual o grupal (máximo 4 integrantes) |
| Alcance | 4 módulos obligatorios + 3 escenarios por módulo |
| Producto | Una aplicación web integrada con 4 módulos |

## Requisito central

Desarrollar UNA aplicación web denominada SIMTELE-RISK con CUATRO módulos/casos de estudio obligatorios:

1. Detención de emergencia de cabinas
2. Deterioro mecánico y mantenimiento
3. Oscilaciones por viento
4. Reconstrucción de señales de sensores

Cada módulo debe ejecutar y comparar las condiciones NORMAL, ESTRÉS y MAL CONDICIONADA.

La teoría de errores es TRANSVERSAL: debe aplicarse en todas las familias de métodos y en los cuatro módulos. Se exige evaluación tanto del error/estabilidad del cálculo como de su interpretación respecto del caso estudiado. NO se presenta como caso o módulo independiente.

Nota de contexto de la consigna: sistema de transporte por cable inspirado en Mi Teleférico, La Paz. Los escenarios son hipotéticos y no describen fallas verificadas de la empresa.

## Resultados de aprendizaje

- Formular modelos matemáticos coherentes con variables, parámetros, unidades, hipótesis, condiciones iniciales y alcance.
- Implementar, verificar y comparar métodos de sistemas lineales, interpolación, raíces, integración y ecuaciones diferenciales.
- Analizar errores, residuos, convergencia, sensibilidad, estabilidad y mal condicionamiento en todos los módulos.
- Guardar y recuperar experimentos completos (entrada, escenario, método, iteraciones, resultados y errores).
- Explicar dos tipos de conclusiones: (a) sobre los métodos numéricos y (b) sobre el fenómeno simulado.

## Cobertura matemática mínima (el sistema completo debe incluir TODOS estos métodos)

| Familia | Métodos obligatorios | Evidencia mínima |
| --- | --- | --- |
| Errores (transversal) | Absoluto, relativo si procede, porcentual, residual y sensibilidad | Tablas de error para CADA módulo; comparación bajo perturbaciones |
| Sistemas lineales | Jacobi; Gauss-Seidel; LU; gradiente conjugado; solución exacta/directa de referencia | A x = b de tamaño ≥ 4; residuo, condición, iteraciones y errores |
| Interpolación | Lagrange; Newton (diferencias divididas); splines cúbicos | Mismos nodos; puntos ocultados; curvas superpuestas |
| Raíces | Bisección; Newton-Raphson; secante | Intervalo/semillas, raíz, iteraciones, error o residual |
| Integración | Trapecio compuesto; Simpson 1/3 compuesto; Romberg | Integral, valor analítico o referencia, refinamiento y errores |
| EDO | Runge-Kutta 2.º orden (variante declarada); Runge-Kutta 4.º orden | Condición inicial, paso, tabla temporal, solución de referencia y errores |

Los métodos se distribuyen entre los cuatro módulos según pertinencia; NO es necesario ejecutar todas las familias en cada módulo. Cada familia debe contar con una prueba reproducible con solución analítica cuando sea posible; si no, una referencia numérica de precisión justificada.

## Requisitos por módulo

### Módulo 1 — Detención de emergencia de cabinas

- Pregunta: ¿cómo varían tiempo y distancia de detención frente a cambios de velocidad, tiempo de reacción y frenado?
- Métodos: EDO (RK2 y RK4) sobre dx/dt = v y dv/dt = -a(v,t); integración de v(t) con trapecio, Simpson y Romberg; raíces para el instante v(t) = 0 mediante bisección, Newton y secante cuando exista una formulación continua adecuada.
- Referencia analítica: desaceleración constante, v(t)=v0-at, x(t)=x0+v0t-(a/2)t², t_det=v0/a, distancia de frenado v0²/(2a). Comparar con una función de desaceleración variable como ampliación.
- Resultados a explicar: velocidad, posición, distancia, tiempo hasta detenerse, evolución del error y restricciones de distancia disponible.

### Módulo 2 — Deterioro mecánico y mantenimiento

- Pregunta: ¿cuándo alcanzaría un indicador hipotético de deterioro un umbral de inspección?
- Métodos: raíces (bisección, Newton, secante) para D(t)-D_umbral=0; sistemas lineales para estimar coeficientes de un modelo de ajuste o calibración usando Jacobi, Gauss-Seidel, LU y gradiente conjugado sobre un sistema SPD; integración opcional de la tasa de deterioro.
- Referencia analítica: D(t)=D0+αt+βt²; resolver la cuadrática y seleccionar la raíz físicamente admisible. Para sistemas lineales construir A x* = b con x* conocido y matriz SPD para comparar los cuatro métodos.
- Resultados a explicar: tiempo estimado al umbral, sensibilidad de parámetros, residuo, condicionamiento, efecto del mantenimiento retrasado.

### Módulo 3 — Oscilaciones por viento

- Pregunta: ¿cómo se modifica la oscilación ante cambios de fuerza externa, amortiguamiento y parámetros del modelo?
- Métodos: EDO (RK2 y RK4) sobre x'=v; v'=(F(t)-cv-kx)/m; integración de |x(t)| o x(t)² por trapecio, Simpson y Romberg para una magnitud acumulada bien definida; sistemas lineales auxiliares para calibrar parámetros si corresponde.
- Referencia analítica: F(t)=0 con parámetros en régimen subamortiguado, solución x(t)=e^(-ζω₀t)[C1 cos(ωd t)+C2 sin(ωd t)]. Puede usarse un caso de vibración libre aún más simple.
- Resultados a explicar: amplitud máxima, trayectoria de oscilación, magnitud integrada, diferencia RK2/RK4 y límites del modelo físico.

### Módulo 4 — Reconstrucción de señales de sensores

- Pregunta: ¿cómo reconstruir registros faltantes y medir la distorsión que producen datos con ruido?
- Métodos: interpolación obligatoria (Lagrange, Newton por diferencias divididas, splines cúbicos); sistemas lineales auxiliares de calibración; raíces de cruce de umbral de la curva interpolada cuando corresponda.
- Referencia analítica: datos sintéticos derivados de y(t)=sin(t) o y(t)=e^(-t), con valores de referencia conocidos. Retirar puntos de prueba para calcular el error real de reconstrucción.
- Resultados a explicar: error de predicción sobre datos ocultados, efecto del espaciamiento de nodos, estabilidad ante ruido y confiabilidad de la reconstrucción.

## Escenarios obligatorios en CADA módulo

| Escenario | Definición | Evidencia requerida |
| --- | --- | --- |
| NORMAL | Parámetros nominales sintéticos, datos consistentes y configuración numérica adecuada | Tabla base, curva, referencia y error |
| ESTRÉS | Condiciones más exigentes dentro del modelo: pasos mayores/menores, perturbaciones más intensas, más puntos o más tiempo de simulación | Comparación de desempeño y sensibilidad; explicar si cambian el riesgo modelado y el error numérico |
| MAL CONDICIONADO | Ejemplo matemáticamente sensible: matriz con κ(A) elevado, nodos de interpolación desfavorables, raíz múltiple/derivada pequeña o modelo de sensibilidad demostrable | Evidencia cuantitativa del mal condicionamiento y distinción frente a fallo de convergencia |

Reglas de los escenarios:

- El escenario "mal condicionado" puede ser un subexperimento numérico vinculado al módulo y debe identificarse como tal.
- Evitar matrices no SPD al ejecutar gradiente conjugado estándar; justificar las condiciones de convergencia de los iterativos.
- No equiparar mal condicionamiento, riesgo físico, alta exigencia y falta de convergencia.

## Evidencias obligatorias dentro de cada módulo

- Descripción del escenario, ecuación/modelo, variables y unidades; fuente de cada parámetro.
- Tres ejecuciones: NORMAL, ESTRÉS y MAL CONDICIONADA, con entradas reproducibles.
- Tablas de iteraciones o de refinamiento (paso, subintervalos, tolerancia), valor aproximado y criterio de parada.
- Referencia analítica cuando exista; en otros casos, solución independiente de alta precisión justificada.
- Errores por método y escenario (sin dividir por cero), residuales, cambios ante perturbaciones y convergencia.
- Al menos dos gráficos útiles por módulo: solución/escenario y error/convergencia/comparación.
- CONCLUSIÓN NUMÉRICA: comparación de precisión, iteraciones, estabilidad y ventajas/limitaciones de los algoritmos.
- CONCLUSIÓN DEL PROBLEMA: qué significa físicamente u operativamente el resultado, qué variables influyen y qué no puede inferirse.

## Plataforma web (pantallas y contenido imprescindible)

Los módulos de la aplicación web serán exactamente los cuatro casos de estudio. Dentro de cada módulo se accede a los métodos numéricos pertinentes, sus tablas, gráficos, escenarios y resultados. Debe permitirse volver al panel general de comparación y al historial de experimentos.

| Pantalla / función | Contenido imprescindible |
| --- | --- |
| Inicio | Cuatro tarjetas: Detención, Deterioro, Oscilaciones, Sensores |
| Módulo del caso | Modelo, parámetros con validaciones, elección NORMAL/ESTRÉS/MAL CONDICIONADO |
| Resultados | Métodos aplicables, tablas de iteraciones, error y comparación gráfica |
| Interpretación | Conclusión matemática y conclusión sobre el caso, claramente separadas |
| Historial | Buscar, abrir, visualizar y relanzar al menos una simulación ya guardada |

## Modelo de datos y persistencia obligatorios

Entregables: modelo entidad-relación (DER), modelo relacional y script SQL o migraciones. El sistema debe guardar una ejecución completa y permitir recuperarla después de reiniciar la aplicación.

| Entidad mínima | Campos sugeridos |
| --- | --- |
| caso_estudio | id, nombre, modelo_version |
| escenario | id, caso_id, tipo (NORMAL/ESTRÉS/MAL_CONDICIONADO), parámetros_json, fuente_datos |
| simulacion | id, escenario_id, fecha, usuario/equipo opcional, estado |
| ejecucion_metodo | id, simulacion_id, metodo, tolerancia, paso, max_iter, convergio, tiempo_ms |
| iteracion_resultado | id, ejecucion_id, numero, aproximacion_json, residual, error_abs, error_rel |
| resultado_resumen | id, ejecucion_id, referencia, valor_json, metrica_error_json, interpretacion |

Prueba obligatoria de persistencia: ejecutar → guardar → cerrar/actualizar → recuperar parámetros, iteraciones y gráficos → repetir el cálculo → demostrar coincidencia dentro de la tolerancia. El historial NO puede depender solo de variables temporales en memoria.

## Cronograma y entregables por semana

### Semana 1 — Modelos y primeros algoritmos (6 puntos)

- Planteamiento de los CUATRO casos y relación entre modelos y métodos.
- Implementación de teoría de errores transversal y sistemas lineales (Jacobi, Gauss-Seidel, LU, gradiente conjugado y referencia).
- Primeras pruebas de los tres escenarios en al menos un caso; definir los escenarios de los otros tres.
- Prototipo web con cuatro módulos visibles, DER inicial y repositorio GitHub con README.
- Entrega: avance PDF con fórmulas, ejemplos manuales, matrices/soluciones de referencia y tablas de error.

### Semana 2 — Integración matemática y aplicación (9 puntos)

- Implementación de interpolación (Lagrange, Newton, splines), raíces (bisección, Newton-Raphson, secante), integración (trapecio, Simpson, Romberg) y EDO (RK2 y RK4).
- Los cuatro módulos ejecutan al menos el escenario NORMAL y muestran tablas, errores y dos gráficos.
- Incorporar escenarios ESTRÉS y MAL CONDICIONADO y las primeras comparaciones de resultados.
- Base de datos funcional; prueba de guardar y recuperar una ejecución histórica.
- Entrega: enlace de la aplicación, repositorio actualizado e informe de experimentos y fallos detectados.

### Semana 3 — Validación, conclusiones y defensa (10 puntos)

- Ejecutar los TRES escenarios en los CUATRO casos de estudio y verificar datos de referencia.
- Completar comparación de métodos, tablas de iteraciones/refinamiento, gráficos de error y convergencia.
- Redactar para CADA caso la conclusión numérica Y la conclusión del problema, además de una conclusión integradora.
- Presentar la aplicación final, DER y persistencia comprobada, informe PDF/Word, GitHub y video ≤ 3 min.
- Defensa presencial: cada participante cambia parámetros, ejecuta cálculos, recupera un experimento anterior e interpreta resultados.

## Rúbrica de evaluación — total 25 puntos

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

Criterio de corrección: una interfaz atractiva no compensa algoritmos incorrectos. Para obtener los puntos de conclusiones se requieren DOS conclusiones diferenciadas por cada caso: una sobre métodos numéricos y otra sobre el problema aplicado.

## Estructura del informe final

Portada; participantes y mención; resumen; objetivo; arquitectura general y DER; definición de los cuatro módulos; fundamento y modelos matemáticos; métodos y pseudocódigo; pruebas analíticas; resultados por módulo y escenario; tablas de iteraciones; teoría de errores transversal; comparaciones gráficas; conclusiones numéricas de cada módulo; conclusiones del problema de cada módulo; conclusión global; limitaciones; referencias y anexos con enlaces.

## Entregables finales y defensa

- Aplicación web funcional con los cuatro módulos y las tres condiciones experimentales por módulo.
- Modelo de datos, script SQL o migraciones y prueba de recuperación de un experimento guardado.
- Repositorio GitHub: código, estructura de BD, ejemplos de entrada, pruebas, instrucciones de ejecución y README.
- Informe final con modelos, fórmulas, tablas, errores, gráficos, comparaciones y conclusiones dobles.
- Video demostrativo de MÁXIMO 3 minutos: problema general, métodos aplicados, recorrido de los cuatro módulos, simulación, resultados y hallazgos.
- Defensa presencial de TODOS: modificar parámetros, explicar diferencias entre métodos, justificar errores y convergencia, interpretar consecuencias en el caso y recuperar una simulación anterior.
- Cada estudiante explica sus aportes desde su mención, sin dejar de dominar las bases matemáticas comunes.

## Reglas metodológicas

- Los cuatro módulos y los tres escenarios en cada uno son obligatorios.
- La teoría de errores es transversal a todos los métodos y módulos; no es un caso o módulo independiente.
- Utilizar funciones de prueba con solución analítica siempre que sea posible y justificar referencias numéricas donde no exista solución cerrada útil.
- No equiparar mal condicionamiento, riesgo físico, alta exigencia y falta de convergencia.
- Declarar datos sintéticos y parámetros supuestos. El sistema es estrictamente educativo y no tiene conexión con equipos de control reales.
- En trabajo individual se admite diseño visual austero; NO se reducen el alcance matemático ni la rúbrica.

# SIMTELE-RISK — Métodos Numéricos — Semana 2

Sistema de simulación y análisis numérico de riesgos en transporte por cable (inspirado en la red de teleféricos urbanos de La Paz), desarrollado con fines educativos y experimentales usando datos sintéticos y sin conexión con sistemas de control reales.

## Integrantes del Proyecto

- Choque Sillo Ronald
- Limachi Mamani Ronal
- Quispe Chino Jose Luis
- Velasquez Gonzales Juan Pablo

---

## Semana 2 — Integración matemática y aplicación (Rúbrica oficial 9/9 pts)

El avance de la Semana 2 cumple rigurosamente con los 9 puntos exigidos en la rúbrica oficial de la consigna:

### 1. Cobertura completa de familias de métodos numéricos (5 pts)

| Familia | Métodos implementados | Archivo fuente | Evidencia de verificación analítica |
|---|---|---|---|
| **Raíces** | Bisección, Newton-Raphson, Secante | [public/js/numerics/raices.js](file:///C:/Users/alfon/TGZ/strisk/public/js/numerics/raices.js) | Solución analítica $f(x)=\cos(x)-x=0$ (número de Dottie), error $< 10^{-10}$ |
| **Integración** | Trapecio compuesto, Simpson 1/3 compuesto, Romberg | [public/js/numerics/integracion.js](file:///C:/Users/alfon/TGZ/strisk/public/js/numerics/integracion.js) | Solución analítica $\int_0^\pi \sin(x)dx=2$, error $< 10^{-10}$ |
| **Interpolación** | Lagrange, Newton (diferencias divididas), Splines Cúbicos Naturales | [public/js/numerics/interpolacion.js](file:///C:/Users/alfon/TGZ/strisk/public/js/numerics/interpolacion.js) | Señal analítica $e^{-t}$ con puntos ocultos y Fenómeno de Runge $1/(1+25t^2)$ |
| **EDO** | Runge-Kutta 2.º orden (Heun), Runge-Kutta 4.º orden clásico | [public/js/numerics/edo.js](file:///C:/Users/alfon/TGZ/strisk/public/js/numerics/edo.js) | Solución analítica $y'=-2y, y(0)=1 \rightarrow y(1)=e^{-2}$ con error $< 10^{-6}$ |
| **Teoría de errores** | Absoluto, Relativo (con guarda contra cero), Porcentual, Residual, Sensibilidad | [public/js/numerics/errores.js](file:///C:/Users/alfon/TGZ/strisk/public/js/numerics/errores.js) | Transversal a todas las familias y módulos (sin divisiones por cero) |
| **Sistemas lineales** | Jacobi, Gauss-Seidel, Factorización LU, Gradiente Conjugado SPD | [public/js/principal.js](file:///C:/Users/alfon/TGZ/strisk/public/js/principal.js) y [public/js/casos.js](file:///C:/Users/alfon/TGZ/strisk/public/js/casos.js) | Calibración con sistema SPD 4×4 e Hilbert $H$ mal condicionada |

---

### 2. Matriz de 4 Módulos × 3 Escenarios (12 Ejecuciones) (2 pts)

Cada módulo ejecuta sus métodos pertinentes en los tres escenarios requeridos (**NORMAL**, **ESTRÉS** y **MAL CONDICIONADO**), orquestados en [public/js/casos.js](file:///C:/Users/alfon/TGZ/strisk/public/js/casos.js):

1. **Módulo 1 — Detención de emergencia de cabinas:**
   - *Métodos:* EDO (RK2 y RK4) sobre $dx/dt=v, dv/dt=-a(v,t)$; integración de $v(t)$ (Trapecio, Simpson 1/3, Romberg); raíces (Bisección, Newton, Secante) para $v(t)=0$.
   - *NORMAL:* Desaceleración nominal constante con referencia analítica cerrada ($t_{det}=v_0/a$, $d=v_0^2/(2a)$).
   - *ESTRÉS:* Alta velocidad inicial ($38\text{ m/s}$) con arrastre aerodinámico cuadrático ($k_{drag} v^2$).
   - *MAL CONDICIONADO:* Frenado suave con derivada nula en la raíz $v'(t_{det}) \approx 0$ (raíz de multiplicidad 3).
2. **Módulo 2 — Deterioro mecánico y mantenimiento:**
   - *Métodos:* Raíces para $D(t)-D_{umbral}=0$ con $D(t)=D_0+\alpha t+\beta t^2$; calibración de coeficientes con Gradiente Conjugado sobre matriz SPD.
   - *NORMAL:* Desgaste nominal cuadrático y matriz SPD bien condicionada ($\kappa \approx 4.5$).
   - *ESTRÉS:* Fatiga acelerada por sobrecarga continua ($\kappa \approx 35$).
   - *MAL CONDICIONADO:* Umbral casi tangente al vértice ($D'(t^*) \approx 0$) y matriz SPD casi singular ($\kappa \approx 1.5\times 10^7$).
3. **Módulo 3 — Oscilaciones por viento:**
   - *Métodos:* EDO (RK2 y RK4) sobre $x'=v, v'=(F(t)-cv-kx)/m$; integración de $x(t)^2$ para energía acumulada (Trapecio, Simpson, Romberg).
   - *NORMAL:* Vibración libre subamortiguada ($F(t)=0$) con solución analítica cerrada exponencial-sinusoidal.
   - *ESTRÉS:* Excitación resonante sostenida ($\omega_F = \omega_0 = 2\text{ rad/s}$).
   - *MAL CONDICIONADO:* Sistema rígido (*stiff system*, $k/m=2500$) con paso $h=0.04\text{ s}$ donde RK2 explícito exhibe inestabilidad numérica artificial mientras RK4 permanece estable.
4. **Módulo 4 — Reconstrucción de señales de sensores:**
   - *Métodos:* Interpolación de Lagrange, Newton por diferencias divididas y Splines Cúbicos Naturales; raíces de cruce de umbral sobre el spline.
   - *NORMAL:* Señal $y(t)=\sin(t)$ con 20 puntos ocultados para medir error real de reconstrucción.
   - *ESTRÉS:* Señal amortiguada $e^{-0.5t}\cos(2t)$ con pérdida de paquetes intermedios.
   - *MAL CONDICIONADO:* Fenómeno de Runge sobre $f(t)=1/(1+25t^2)$ con 13 nodos equiespaciados (demostración cuantitativa: polinomios divergen violentamente en los bordes mientras Splines Cúbicos permanecen con error mínimo).

#### Visualización interactiva y Conclusiones:
- **Dos gráficos interactivos por módulo (Chart.js):**
  1. *Solución / Escenario:* Trayectorias temporales $x(t), v(t)$, curvas de deterioro $D(t)$ vs umbral, oscilación $x(t)$ o reconstrucción vs señal real.
  2. *Error / Convergencia:* Evolución del error absoluto en escala logarítmica por iteración y comparativa de errores entre métodos.
- **Dos conclusiones claramente separadas por caso:**
  1. *Conclusión matemática y numérica:* tasa de convergencia, estabilidad, efecto de derivadas pequeñas o condicionamiento.
  2. *Conclusión sobre el problema aplicado:* evaluación del riesgo físico, distancia de frenado vs vía disponible, tiempo hasta mantenimiento y fidelidad de telemetría.

---

### 3. Base de Datos y Persistencia Relacional SQLite con Deno (2 pts)

- **Modelo relacional y DER:** 6 entidades relacionales (`caso_estudio`, `escenario`, `simulacion`, `ejecucion_metodo`, `iteracion_resultado`, `resultado_resumen`) con restricciones de integridad referencial (`ON DELETE CASCADE`) e índices para acelerar búsquedas. Documentado en [docs/bd/der.md](file:///C:/Users/alfon/TGZ/strisk/docs/bd/der.md) y [db/schema.sql](file:///C:/Users/alfon/TGZ/strisk/db/schema.sql).
- **Backend nativo en Deno ([server.js](file:///C:/Users/alfon/TGZ/strisk/server.js)):**
  - Desarrollado exclusivamente para **Deno 2** con `Deno.serve` y SQLite integrado (`node:sqlite`).
  - `GET /api/simulaciones`: historial completo con joins.
  - `POST /api/simulaciones`: inserción transaccional de escenario, simulación, métodos e iteraciones.
  - `GET /api/simulaciones/:id`: recuperación detallada de parámetros, iteraciones y resúmenes.
- **Prueba obligatoria de reproducibilidad (tolerancia $\le 10^{-9}$):**
  - Flujo: Ejecutar simulación $\rightarrow$ Guardar en SQLite $\rightarrow$ Recargar/reiniciar $\rightarrow$ Recuperar $\rightarrow$ Relanzar cálculo idéntico $\rightarrow$ Demostrar coincidencia $|v_{guardado} - v_{recalculado}| \le 10^{-9}$.

---

## Ejecución del proyecto con Deno

El proyecto cuenta con tareas configuradas en [deno.json](file:///C:/Users/alfon/TGZ/strisk/deno.json):

### Iniciar el servidor web (con base de datos SQLite)

Para desarrollo con recarga automática al modificar archivos:
```bash
deno task dev
```

O para ejecución estándar:
```bash
deno task start
```

Abrir en el navegador: **[http://localhost:3000](http://localhost:3000)**.

### Ejecutar las pruebas analíticas automatizadas

Verifica las 4 familias de métodos contra soluciones analíticas cerradas y la cobertura de los 12 escenarios:
```bash
deno task test
```

Resultado verificado:
```text
running 6 tests from ./tests/verificar_semana2_test.js
1. Raíces: cos(x) - x = 0 (Dottie number ≈ 0.7390851332151607) ... ok (1ms)
2. Integración: ∫_0^π sin(x) dx = 2 ... ok (1ms)
3. Interpolación: reconstrucción de e^(-t) en puntos intermedios ... ok (1ms)
4. EDO: y' = -2y, y(0) = 1 -> y(1) = e^(-2) ... ok (1ms)
5. Cobertura completa de la matriz 4 módulos × 3 escenarios (12 ejecuciones) ... ok (13ms)
6. Prueba de tolerancia y reproducibilidad (<= 1e-9) ... ok (2ms)

ok | 6 passed | 0 failed (28ms)
```

### Inspeccionar la base de datos SQLite en terminal

Permite comprobar las 6 tablas y las simulaciones almacenadas físicamente en disco:
```bash
deno task db:status
```

Resultado verificado:
```text
📁 Archivo físico:   db/simtele.db (73.7 KB)

📊 1. CONTEO DE FILAS POR TABLA:
  • caso_estudio           : 4 registros
  • escenario              : 2 registros
  • simulacion             : 2 registros
  • ejecucion_metodo       : 12 registros
  • iteracion_resultado    : 165 registros
  • resultado_resumen      : 12 registros
```

---

## Estructura limpia del repositorio

```text
├── deno.json                         Configuración oficial de tareas de Deno (dev, start, test, db:status)
├── server.js                         Servidor nativo Deno.serve + API REST SQLite
├── db/
│   ├── schema.sql                    Script DDL relacional (6 tablas, llaves foráneas e índices)
│   └── simtele.db                    Base de datos SQLite persistente (precargada con ejecuciones)
├── docs/
│   ├── semana2.md                    Consigna oficial de Semana 2
│   ├── Informe_SIMTELE-RISK_Semana2.md  Informe formal de experimentos y fallos detectados
│   ├── bd/
│   │   └── der.md                    Diagrama Entidad-Relación (Mermaid) y diseño relacional
│   └── semana_2_dev/                 Guías de desarrollo y diseño técnico
├── public/                           Archivos estáticos servidos por el backend
│   ├── index.html                    Interfaz web integrada (Semana 1 + Semana 2)
│   ├── estilos.css                   Hojas de estilo responsive y badges
│   ├── principal.js                  Módulos analíticos y solvers lineales de S1
│   └── js/
│       ├── casos.js                  Orquestador de los 4 módulos × 3 escenarios (12 experimentos)
│       ├── persistencia.js           Cliente API con fallback offline y prueba de tolerancia
│       ├── ui-semana2.js             Renderizado de gráficos (Chart.js), tablas y conclusiones
│       └── numerics/
│           ├── errores.js            Teoría de errores transversal y sensibilidad
│           ├── raices.js             Bisección, Newton-Raphson y Secante
│           ├── integracion.js        Trapecio, Simpson 1/3 y Romberg
│           ├── interpolacion.js      Lagrange, Newton (dif. div.) y Splines Cúbicos
│           └── edo.js                Runge-Kutta 2º (Heun) y Runge-Kutta 4º clásico
├── scripts/
│   └── inspeccionar_db.js            Script Deno de auditoría e inspección de SQLite
└── tests/
    └── verificar_semana2_test.js     Suite oficial de pruebas automatizadas en Deno
```

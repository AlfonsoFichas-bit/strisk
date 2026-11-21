/* =========================================================================
   SIMTELE-RISK — Semana 1
   Modelos, teoría de errores transversal y sistemas lineales.
   Sin dependencias: se ejecuta abriendo index.html.
   ========================================================================= */

/* ----------------------------- Utilidades ----------------------------- */
const $ = (id) => document.getElementById(id);

function numero(id) {
  const v = Number($(id).value);
  return Number.isFinite(v) ? v : NaN;
}

function fmt(x, decimales = 8) {
  if (x === null || x === undefined) return "—";
  if (Number.isNaN(x)) return "—";
  if (!Number.isFinite(x)) return x > 0 ? "∞" : "−∞";
  if (Math.abs(x) < 1e-15) x = 0;
  return Number(x).toFixed(decimales);
}

function fmtSig(x, digitos = 6) {
  if (x === null || x === undefined) return "—";
  if (Number.isNaN(x)) return "—";
  if (!Number.isFinite(x)) return x > 0 ? "∞" : "−∞";
  if (Math.abs(x) < 1e-15) x = 0;
  return Number(x).toPrecision(digitos);
}

function fmtPct(x, digitos = 4) {
  if (Number.isNaN(x) || !Number.isFinite(x)) return "—";
  return `${fmtSig(x * 100, digitos)} %`;
}

function esc(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function tablaHTML(headers, rows, clase = "") {
  return `<div class="tabla-contenedor ${clase}"><table><thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function matrizAumentadaHTML(A, b) {
  if (!A || !A.length) return "";
  const headers = ["i", ...A[0].map((_, j) => `j${j + 1}`), "b"];
  const rows = A.map((fila, i) => [
    i + 1,
    ...fila.map((v) => fmtSig(v, 6)),
    fmtSig(b[i], 8)
  ]);
  return tablaHTML(headers, rows);
}

function vectorHTML(v, nombre = "x") {
  return tablaHTML(["i", nombre], v.map((x, i) => [i + 1, fmtSig(x, 8)]));
}

function mostrarPanel(id) {
  const el = $(id);
  if (el) el.classList.remove("oculto");
}

function ocultarPanel(id) {
  const el = $(id);
  if (el) el.classList.add("oculto");
}

function validarNumero(valor, nombre, opciones = {}) {
  const { min = null, max = null, entero = false } = opciones;
  if (!Number.isFinite(valor)) return `${nombre} debe ser un número finito.`;
  if (entero && !Number.isInteger(valor)) return `${nombre} debe ser entero.`;
  if (min !== null && valor < min) return `${nombre} debe ser ≥ ${min}.`;
  if (max !== null && valor > max) return `${nombre} debe ser ≤ ${max}.`;
  return null;
}

function mensajeError(texto) {
  return `<p class="badge error">${esc(texto)}</p>`;
}

function leerLocal(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarLocal(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch {
    return false;
  }
}

function borrarLocal(clave) {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* el prototipo sigue funcionando sin almacenamiento */
  }
}

/* ----------------------------- Matrices ------------------------------- */
function ceros(n, m = n) {
  return Array.from({ length: n }, () => Array(m).fill(0));
}

function identidad(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function clonarMatriz(M) {
  return M.map((fila) => fila.slice());
}

function multiplicarMatrizVector(M, v) {
  return M.map((fila) => fila.reduce((s, aij, j) => s + aij * v[j], 0));
}

function multiplicarMatrices(A, B) {
  const n = A.length;
  const m = B[0].length;
  const p = B.length;
  const C = ceros(n, m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let k = 0; k < p; k++) s += A[i][k] * B[k][j];
      C[i][j] = s;
    }
  }
  return C;
}

function transpuesta(M) {
  return M[0].map((_, j) => M.map((fila) => fila[j]));
}

function normaInf(v) {
  return Math.max(...v.map((x) => Math.abs(x)));
}

function normaInfMat(M) {
  return Math.max(...M.map((fila) => fila.reduce((s, x) => s + Math.abs(x), 0)));
}

function residual(A, b, x) {
  return b.map((bi, i) => bi - A[i].reduce((s, aij, j) => s + aij * x[j], 0));
}

function errorAbsMax(x, ref) {
  return Math.max(...x.map((v, i) => Math.abs(v - ref[i])));
}

function errorRelMax(x, ref) {
  return Math.max(
    ...x.map((v, i) => Math.abs(v - ref[i]) / Math.max(Math.abs(ref[i]), 1e-300))
  );
}

function inversaMatriz(M) {
  const n = M.length;
  const aug = M.map((fila, i) => [
    ...fila,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let c = 0; c < n; c++) {
    let pivote = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(aug[r][c]) > Math.abs(aug[pivote][c])) pivote = r;
    }
    if (Math.abs(aug[pivote][c]) < 1e-14) return null;
    [aug[c], aug[pivote]] = [aug[pivote], aug[c]];

    const div = aug[c][c];
    for (let j = 0; j < 2 * n; j++) aug[c][j] /= div;

    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const factor = aug[r][c];
      if (Math.abs(factor) < 1e-300) continue;
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[c][j];
    }
  }

  return aug.map((fila) => fila.slice(n));
}

function condicionInf(M) {
  const inv = inversaMatriz(M);
  if (!inv) return Infinity;
  return normaInfMat(M) * normaInfMat(inv);
}

/* Autovalores de una matriz simétrica por el método de Jacobi cíclico. */
function autovaloresSimetrica(S) {
  const n = S.length;
  const A = clonarMatriz(S);
  for (let barrido = 0; barrido < 100; barrido++) {
    let fuera = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) fuera += A[i][j] * A[i][j];
    }
    if (fuera < 1e-26) break;

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-18) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t =
          Math.sign(theta || 1) /
          (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;

        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
      }
    }
  }
  return A.map((fila, i) => fila[i]);
}

/* κ₂ = σ_max/σ_min a partir de los autovalores de MᵀM. */
function condicion2(M) {
  const S = multiplicarMatrices(transpuesta(M), M);
  const autovalores = autovaloresSimetrica(S).sort((a, b) => a - b);
  const maximo = autovalores[autovalores.length - 1];
  const minimo = autovalores[0];
  if (!(minimo > 0) || !Number.isFinite(maximo)) return Infinity;
  return Math.sqrt(maximo / minimo);
}

function interpretarCondicion(kappa) {
  if (!Number.isFinite(kappa)) return "singular o no calculable";
  if (kappa < 1e2) return "bien condicionada";
  if (kappa < 1e6) return "moderadamente mal condicionada";
  return "severamente mal condicionada";
}

function esSimetrica(M, tol = 1e-12) {
  for (let i = 0; i < M.length; i++) {
    for (let j = i + 1; j < M.length; j++) {
      if (Math.abs(M[i][j] - M[j][i]) > tol) return false;
    }
  }
  return true;
}

function esDiagonalDominante(M) {
  return M.every((fila, i) => {
    const suma = fila.reduce((s, x, j) => (j === i ? s : s + Math.abs(x)), 0);
    return Math.abs(fila[i]) > suma;
  });
}

function esSPD(M, tol = 1e-12) {
  const n = M.length;
  const L = ceros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = M[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (!(s > tol)) return false;
        L[i][j] = Math.sqrt(s);
      } else {
        L[i][j] = s / L[j][j];
      }
    }
  }
  return true;
}

/* ----------------------------- Solvers -------------------------------- */
function jacobi(A, b, tol, maxIter) {
  const n = b.length;
  let x = Array(n).fill(0);
  const historial = [];
  let estado = "no convergió";
  let iteraciones = 0;

  for (let it = 1; it <= maxIter; it++) {
    iteraciones = it;
    const xn = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j];
      xn[i] = (b[i] - suma) / A[i][i];
    }
    x = xn;
    const res = normaInf(residual(A, b, x));
    historial.push({ iteracion: it, x: x.slice(), residual: res });
    if (!Number.isFinite(res) || res > 1e12) {
      estado = "divergió";
      break;
    }
    if (res < tol) {
      estado = "convergió";
      break;
    }
  }

  return {
    metodo: "Jacobi",
    x,
    iteraciones,
    residual: normaInf(residual(A, b, x)),
    historial,
    estado
  };
}

function gaussSeidel(A, b, tol, maxIter) {
  const n = b.length;
  const x = Array(n).fill(0);
  const historial = [];
  let estado = "no convergió";
  let iteraciones = 0;

  for (let it = 1; it <= maxIter; it++) {
    iteraciones = it;
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j];
      x[i] = (b[i] - suma) / A[i][i];
    }
    const res = normaInf(residual(A, b, x));
    historial.push({ iteracion: it, x: x.slice(), residual: res });
    if (!Number.isFinite(res) || res > 1e12) {
      estado = "divergió";
      break;
    }
    if (res < tol) {
      estado = "convergió";
      break;
    }
  }

  return {
    metodo: "Gauss-Seidel",
    x,
    iteraciones,
    residual: normaInf(residual(A, b, x)),
    historial,
    estado
  };
}

function gradienteConjugado(A, b, tol, maxIter) {
  const n = b.length;
  let x = Array(n).fill(0);
  let r = residual(A, b, x);
  let p = r.slice();
  let rr = r.reduce((s, v) => s + v * v, 0);
  const historial = [];
  let estado = "no convergió";
  let iteraciones = 0;

  for (let it = 1; it <= maxIter; it++) {
    iteraciones = it;
    const Ap = multiplicarMatrizVector(A, p);
    const den = p.reduce((s, v, i) => s + v * Ap[i], 0);
    if (!(den > 0)) {
      estado = "falló: matriz no SPD o dirección nula";
      break;
    }

    const alfa = rr / den;
    x = x.map((v, i) => v + alfa * p[i]);
    r = r.map((v, i) => v - alfa * Ap[i]);
    const rrNuevo = r.reduce((s, v) => s + v * v, 0);
    const res = normaInf(r);
    historial.push({ iteracion: it, x: x.slice(), residual: res });

    if (res < tol) {
      estado = "convergió";
      break;
    }
    if (rrNuevo === 0) {
      estado = "convergió";
      break;
    }

    const beta = rrNuevo / rr;
    p = r.map((v, i) => v + beta * p[i]);
    rr = rrNuevo;
  }

  return {
    metodo: "Gradiente conjugado",
    x,
    iteraciones,
    residual: normaInf(residual(A, b, x)),
    historial,
    estado
  };
}

function luSolve(A, b) {
  const n = A.length;
  const L = identidad(n);
  const U = clonarMatriz(A);
  let singular = false;

  for (let k = 0; k < n; k++) {
    if (Math.abs(U[k][k]) < 1e-14) {
      singular = true;
      break;
    }
    for (let i = k + 1; i < n; i++) {
      const factor = U[i][k] / U[k][k];
      L[i][k] = factor;
      for (let j = k; j < n; j++) U[i][j] -= factor * U[k][j];
    }
  }

  if (singular) return null;

  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j];
    y[i] = s;
  }

  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < n; j++) s -= U[i][j] * x[j];
    x[i] = s / U[i][i];
  }

  return {
    metodo: "LU",
    x,
    L,
    U,
    iteraciones: 1,
    estado: "directo",
    residual: normaInf(residual(A, b, x))
  };
}

/* ------------------------- Sistemas lineales -------------------------- */
function crearHilbert(n = 4) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => 1 / (i + j + 1))
  );
}

function crearSistema(clave) {
  if (clave === "H") {
    const A = crearHilbert(4);
    const xRef = [1, 1, 1, 1];
    const b = multiplicarMatrizVector(A, xRef);
    return {
      clave,
      nombre: "H — Hilbert 4×4 SPD mal condicionada",
      A,
      b,
      xRef,
      descripcion:
        "Matriz de Hilbert de orden 4. Es simétrica y definida positiva, pero su número de condición crece muy rápido con el orden."
    };
  }

  const A = [
    [10, -1, 2, 0],
    [-1, 11, -1, 3],
    [2, -1, 10, -1],
    [0, 3, -1, 8]
  ];
  const xRef = [1, 2, 3, 4];
  const b = multiplicarMatrizVector(A, xRef);
  return {
    clave: "A",
    nombre: "A — SPD bien condicionada",
    A,
    b,
    xRef,
    descripcion:
      "Matriz simétrica, definida positiva y estrictamente diagonal dominante. Solución de referencia x* = [1, 2, 3, 4]."
  };
}

function propiedadesSistema(sis) {
  return {
    simetrica: esSimetrica(sis.A),
    diagonalDominante: esDiagonalDominante(sis.A),
    spd: esSPD(sis.A),
    kappaInf: condicionInf(sis.A),
    kappa2: condicion2(sis.A)
  };
}

function renderSistemaActual() {
  const sis = crearSistema($("matriz-sistema").value);
  const props = propiedadesSistema(sis);
  const filas = [
    ["Matriz", esc(sis.nombre)],
    ["Tamaño", `${sis.A.length} × ${sis.A.length}`],
    ["Simétrica", props.simetrica ? "sí" : "no"],
    ["Diagonal dominante", props.diagonalDominante ? "sí" : "no"],
    ["Definida positiva", props.spd ? "sí" : "no"],
    ["κ∞(A)", fmtSig(props.kappaInf, 8)],
    ["κ₂(A)", fmtSig(props.kappa2, 8)],
    ["Interpretación", interpretarCondicion(props.kappaInf)],
    ["Solución de referencia", `x* = [${sis.xRef.join(", ")}]`]
  ];
  $("sistema-actual").innerHTML =
    `<p>${esc(sis.descripcion)}</p>` +
    tablaHTML(["Propiedad", "Valor"], filas) +
    `<p class="nota">Vector b = A·x*: [${sis.b.map((v) => fmtSig(v, 8)).join(", ")}]</p>` +
    matrizAumentadaHTML(sis.A, sis.b);
  return sis;
}

function filaResultadoSistema(res, sis) {
  const { x, iteraciones, residual: resInf, estado, metodo } = res;
  const eAbs = errorAbsMax(x, sis.xRef);
  const eRel = errorRelMax(x, sis.xRef);
  const clase =
    estado === "convergió" || estado === "directo"
      ? "badge ok"
      : "badge error";
  return [
    metodo,
    ...x.map((v) => fmtSig(v, 8)),
    iteraciones,
    fmtSig(resInf, 6),
    fmtSig(eAbs, 6),
    fmtSig(eRel, 6),
    fmtPct(eRel, 4),
    `<span class="${clase}">${esc(estado)}</span>`
  ];
}

function filasIteraciones(resultados, sis) {
  const filas = [];
  resultados.forEach((res) => {
    if (!res) return;
    if (!res.historial || res.historial.length === 0) {
      if (res.metodo === "LU") {
        filas.push([
          "LU (directo)",
          "—",
          fmtSig(res.residual, 6),
          fmtSig(errorAbsMax(res.x, sis.xRef), 6),
          fmtSig(errorRelMax(res.x, sis.xRef), 6)
        ]);
      }
      return;
    }
    const h = res.historial;
    const indices = new Set();
    h.slice(0, 5).forEach((_, i) => indices.add(i));
    const inicioUltimos = Math.max(0, h.length - 5);
    h.slice(inicioUltimos).forEach((_, i) => indices.add(inicioUltimos + i));
    const ordenados = [...indices].sort((a, b) => a - b);
    let anterior = -1;
    ordenados.forEach((idx) => {
      if (idx - anterior > 1) {
        filas.push([
          res.metodo,
          "…",
          "…",
          "…",
          "…"
        ]);
      }
      const paso = h[idx];
      filas.push([
        res.metodo,
        paso.iteracion,
        fmtSig(paso.residual, 6),
        fmtSig(errorAbsMax(paso.x, sis.xRef), 6),
        fmtSig(errorRelMax(paso.x, sis.xRef), 6)
      ]);
      anterior = idx;
    });
  });
  return filas;
}

function renderLU(res) {
  if (!res) {
    $("factores-lu").innerHTML = mensajeError(
      "La factorización LU no pudo completarse: apareció un pivote nulo. Se requeriría pivoteo."
    );
    return;
  }
  $("factores-lu").innerHTML =
    `<p><strong>L</strong> (triangular inferior con diagonal unitaria)</p>` +
    tablaHTML(
      ["i", "j1", "j2", "j3", "j4"],
      res.L.map((fila, i) => [i + 1, ...fila.map((v) => fmtSig(v, 8))])
    ) +
    `<p><strong>U</strong> (triangular superior)</p>` +
    tablaHTML(
      ["i", "j1", "j2", "j3", "j4"],
      res.U.map((fila, i) => [i + 1, ...fila.map((v) => fmtSig(v, 8))])
    ) +
    `<p class="nota">Se usa LU sin pivoteo. En estas matrices los pivotes son no nulos; para una matriz general habría que añadir pivoteo parcial.</p>`;
}

function renderDiagnostico(sis, props) {
  const notas = [];
  if (sis.clave === "A") {
    notas.push(
      "Jacobi y Gauss-Seidel convergen por la dominancia diagonal estricta. El gradiente conjugado es aplicable porque la matriz es SPD."
    );
  } else {
    notas.push(
      "La matriz de Hilbert es SPD pero no es diagonalmente dominante. Jacobi puede divergir, Gauss-Seidel converge muy lentamente y el gradiente conjugado puede perder precisión por el mal condicionamiento."
    );
  }
  $("diagnostico-sistemas").innerHTML =
    tablaHTML(
      ["Indicador", "Valor"],
      [
        ["κ∞(A) = ||A||∞·||A⁻¹||∞", fmtSig(props.kappaInf, 8)],
        ["κ₂(A) = σ_max/σ_min", fmtSig(props.kappa2, 8)],
        ["Interpretación", interpretarCondicion(props.kappaInf)],
        ["Simétrica", props.simetrica ? "sí" : "no"],
        ["Diagonal dominante", props.diagonalDominante ? "sí" : "no"],
        ["Definida positiva", props.spd ? "sí" : "no"]
      ]
    ) +
    `<p class="nota">${esc(notas.join(" "))}</p>`;
}

let ultimaEjecucionSistemas = null;
let ultimaPerturbacionSistemas = null;

function resolverSistemas() {
  const sis = renderSistemaActual();
  const tol = numero("tolerancia");
  const maxIter = numero("max-iter");

  const errorTol = validarNumero(tol, "La tolerancia", { min: 1e-12 });
  const errorIter = validarNumero(maxIter, "El máximo de iteraciones", {
    min: 1,
    entero: true
  });
  if (errorTol || errorIter) {
    $("tabla-sistemas").innerHTML = `<tr><td colspan="11">${mensajeError(
      errorTol || errorIter
    )}</td></tr>`;
    return;
  }

  const resultados = [
    jacobi(sis.A, sis.b, tol, maxIter),
    gaussSeidel(sis.A, sis.b, tol, maxIter),
    luSolve(sis.A, sis.b),
    gradienteConjugado(sis.A, sis.b, tol, maxIter)
  ];

  const filas = resultados.map((res) => {
    if (!res) {
      return [
        "LU",
        "—", "—", "—", "—",
        "—",
        "—",
        "—",
        "—",
        "—",
        '<span class="badge error">pivote nulo</span>'
      ];
    }
    return filaResultadoSistema(res, sis);
  });

  const filaReferencia = [
    "Referencia x*",
    ...sis.xRef.map((v) => fmtSig(v, 8)),
    "—",
    "0",
    "0",
    "0",
    "0 %",
    '<span class="badge ok">referencia</span>'
  ];
  $("tabla-sistemas").innerHTML = [filaReferencia, ...filas]
    .map((fila) => `<tr>${fila.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");

  $("tabla-iteraciones-sistemas").innerHTML =
    filasIteraciones(resultados, sis)
      .map((fila) => `<tr>${fila.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("") ||
    `<tr><td colspan="5">No hay iteraciones registradas.</td></tr>`;

  renderLU(resultados[2]);

  const props = propiedadesSistema(sis);
  renderDiagnostico(sis, props);

  const kappaInf = props.kappaInf;
  const kappa2 = props.kappa2;
  ultimaEjecucionSistemas = {
    fecha: new Date().toLocaleString("es-BO"),
    matriz: sis.clave,
    nombre: sis.nombre,
    tolerancia: tol,
    maxIter,
    kappaInf,
    kappa2,
    metodos: resultados.filter(Boolean).map((res) => ({
      metodo: res.metodo,
      x: res.x,
      iteraciones: res.iteraciones,
      residual: res.residual,
      errorAbs: errorAbsMax(res.x, sis.xRef),
      errorRel: errorRelMax(res.x, sis.xRef),
      errorPct: 100 * errorRelMax(res.x, sis.xRef),
      estado: res.estado
    }))
  };
  ultimaPerturbacionSistemas = null;
  $("resultado-guardado-sistemas").textContent =
    "La ejecución está lista. Puedes guardarla en el historial.";
  $("resultado-perturbacion").innerHTML = "";
}

function perturbarSistemas() {
  const sis = crearSistema($("matriz-sistema").value);
  const base = luSolve(sis.A, sis.b);
  if (!base) {
    $("resultado-perturbacion").innerHTML = mensajeError(
      "No se pudo resolver el sistema base con LU."
    );
    return;
  }

  const bPert = sis.b.map((v, i) => v * (1 + (i % 2 === 0 ? 0.01 : -0.01)));
  const pert = luSolve(sis.A, bPert);
  if (!pert) {
    $("resultado-perturbacion").innerHTML = mensajeError(
      "No se pudo resolver el sistema perturbado con LU."
    );
    return;
  }

  const dx = normaInf(pert.x.map((v, i) => v - base.x[i]));
  const xNorma = Math.max(normaInf(base.x), 1e-300);
  const db = normaInf(bPert.map((v, i) => v - sis.b[i]));
  const bNorma = Math.max(normaInf(sis.b), 1e-300);
  const cambioRelX = dx / xNorma;
  const cambioRelB = db / bNorma;
  const amplificacion = cambioRelX / cambioRelB;
  const kappaInf = condicionInf(sis.A);

  ultimaPerturbacionSistemas = {
    matriz: sis.clave,
    bPert,
    xBase: base.x,
    xPert: pert.x,
    cambioRelB,
    cambioRelX,
    amplificacion,
    kappaInf
  };

  $("resultado-perturbacion").innerHTML =
    `<h4>Prueba de perturbación de b (±1 % alternado)</h4>` +
    tablaHTML(
      ["Indicador", "Valor"],
      [
        ["||δb||∞ / ||b||∞", fmtSig(cambioRelB, 6)],
        ["||δx||∞ / ||x||∞", fmtSig(cambioRelX, 6)],
        ["Amplificación observada (cambio rel. x / cambio rel. b)", fmtSig(amplificacion, 6)],
        ["κ∞(A) (cota de la amplificación)", fmtSig(kappaInf, 6)],
        ["Cota de ||δx||/||x||: κ∞·(||δb||/||b||)", fmtSig(kappaInf * cambioRelB, 6)],
        ["Error abs. máx. de x perturbada vs x*", fmtSig(errorAbsMax(pert.x, sis.xRef), 6)],
        ["Error rel. máx. de x perturbada vs x*", fmtSig(errorRelMax(pert.x, sis.xRef), 6)]
      ]
    ) +
    `<p class="nota">La comparación entre la amplificación observada y κ∞(A) muestra por qué el número de condición describe la sensibilidad del sistema. En la matriz A el efecto es pequeño; en Hilbert es mucho mayor.</p>` +
    tablaHTML(
      ["i", "b original", "b perturbada", "x original", "x perturbada"],
      sis.b.map((v, i) => [
        i + 1,
        fmtSig(v, 8),
        fmtSig(bPert[i], 8),
        fmtSig(base.x[i], 8),
        fmtSig(pert.x[i], 8)
      ])
    );
}

/* --------------------- Historial de sistemas --------------------------- */
const CLAVE_HISTORIAL_SISTEMAS = "simtele_historial_sistemas";

function leerHistorialSistemas() {
  try {
    const datos = JSON.parse(leerLocal(CLAVE_HISTORIAL_SISTEMAS) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarHistorialSistemas() {
  if (!ultimaEjecucionSistemas) {
    $("resultado-guardado-sistemas").innerHTML = mensajeError(
      "Primero ejecuta los métodos para poder guardar la ejecución."
    );
    return;
  }
  const historial = leerHistorialSistemas();
  const registro = {
    ...ultimaEjecucionSistemas,
    perturbacion: ultimaPerturbacionSistemas
  };
  historial.unshift(registro);
  const guardado = guardarLocal(
    CLAVE_HISTORIAL_SISTEMAS,
    JSON.stringify(historial.slice(0, 10))
  );
  $("resultado-guardado-sistemas").innerHTML = guardado
    ? `<p class="badge ok">Ejecución guardada. Puedes recuperarla desde el historial inferior.</p>`
    : mensajeError("No se pudo guardar: el almacenamiento local no está disponible.");
  renderHistorialSistemas();
}

function renderHistorialSistemas() {
  const cont = $("historial-sistemas");
  if (!cont) return;
  const historial = leerHistorialSistemas();
  if (historial.length === 0) {
    cont.innerHTML = "Todavía no hay ejecuciones de sistemas lineales guardadas.";
    return;
  }
  cont.innerHTML = historial
    .map((h, i) => {
      const metodos = (h.metodos || [])
        .map((m) => `${m.metodo}: ${m.iteraciones} it, error ${fmtSig(m.errorRel, 3)}`)
        .join(" · ");
      return `<div class="historial-item">
        <div><strong>${esc(h.fecha)}</strong> · Matriz ${esc(h.matriz)} · tol ${fmtSig(h.tolerancia, 3)} · máx ${h.maxIter}</div>
        <div class="nota">${esc(metodos)} · κ∞ ${fmtSig(h.kappaInf, 6)} · κ₂ ${fmtSig(h.kappa2, 6)}</div>
        <button class="boton secundario" data-cargar-sistema="${i}">Cargar y repetir</button>
        <button class="boton secundario" data-eliminar-sistema="${i}">Eliminar</button>
      </div>`;
    })
    .join("");

  cont.querySelectorAll("[data-cargar-sistema]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const h = leerHistorialSistemas()[Number(btn.dataset.cargarSistema)];
      if (!h) return;
      $("matriz-sistema").value = h.matriz;
      $("tolerancia").value = h.tolerancia;
      $("max-iter").value = h.maxIter;
      resolverSistemas();
      $("sistemas").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  cont.querySelectorAll("[data-eliminar-sistema]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.eliminarSistema);
      const arr = leerHistorialSistemas();
      arr.splice(idx, 1);
      guardarLocal(CLAVE_HISTORIAL_SISTEMAS, JSON.stringify(arr));
      renderHistorialSistemas();
    });
  });
}

function limpiarHistorialSistemas() {
  borrarLocal(CLAVE_HISTORIAL_SISTEMAS);
  renderHistorialSistemas();
  $("resultado-guardado-sistemas").textContent =
    "Historial de sistemas lineales eliminado.";
}

/* ============================== MÓDULO 1 =============================== */
const ESCENARIOS_DETENCION = {
  normal: { x0: 0, v0: 10, tr: 1, a: 1.5, disponible: 80 },
  estres: { x0: 0, v0: 14, tr: 1.5, a: 1, disponible: 120 }
};

const MAL_DETENCION = {
  a0: 1.5,
  k: 0.14,
  v0: 10.7,
  tr: 1,
  disponible: 500
};

function calcularDetencion({ x0, v0, tr, a, disponible }) {
  const errores = [
    validarNumero(x0, "x₀"),
    validarNumero(v0, "v₀", { min: 0 }),
    validarNumero(tr, "t_r", { min: 0 }),
    validarNumero(a, "a", { min: 1e-12 }),
    validarNumero(disponible, "d_disponible", { min: 1e-12 })
  ].filter(Boolean);
  if (errores.length) return { error: errores.join(" ") };

  const tf = v0 / a;
  const tTotal = tr + tf;
  const dr = v0 * tr;
  const df = (v0 * v0) / (2 * a);
  const dTotal = dr + df;
  const xFinal = x0 + dTotal;
  const margen = disponible - dTotal;

  const derivadas = {
    d_v0: tr + v0 / a,
    d_a: -(v0 * v0) / (2 * a * a),
    d_tr: v0,
    t_v0: 1 / a,
    t_a: -(v0 / (a * a)),
    t_tr: 1
  };

  function elasticidad(p, derivada) {
    return dTotal !== 0 && p !== 0 ? (p / dTotal) * derivada : NaN;
  }

  return {
    x0, v0, tr, a, disponible,
    tf, tTotal, dr, df, dTotal, xFinal, margen,
    seDetiene: margen >= 0,
    derivadas,
    elasticidades: {
      v0: elasticidad(v0, derivadas.d_v0),
      a: elasticidad(a, derivadas.d_a),
      tr: elasticidad(tr, derivadas.d_tr)
    }
  };
}

function calcularDetencionVariable({ a0, k, v0, tr, disponible }) {
  const errores = [
    validarNumero(a0, "a₀", { min: 1e-12 }),
    validarNumero(k, "k", { min: 1e-12 }),
    validarNumero(v0, "v₀", { min: 0 }),
    validarNumero(tr, "t_r", { min: 0 }),
    validarNumero(disponible, "d_disponible", { min: 1e-12 })
  ].filter(Boolean);

  const vc = a0 / k;
  if (!errores.length && !(v0 < vc)) {
    errores.push(
      `Para el modelo variable se requiere v₀ < a₀/k = ${fmtSig(vc, 8)} m/s; si v₀ se acerca o supera ese valor, la desaceleración neta no frena la cabina.`
    );
  }
  if (errores.length) return { error: errores.join(" ") };

  const gap = a0 - k * v0;
  const tf = v0 === 0 ? 0 : (1 / k) * Math.log(vc / (vc - v0));
  const df = vc * tf - v0 / k;
  const dr = v0 * tr;
  const dTotal = dr + df;
  const tTotal = tr + tf;
  const margen = disponible - dTotal;

  const derivadas = {
    t_v0: gap > 0 ? 1 / gap : Infinity,
    d_v0: tr + (gap > 0 ? v0 / gap : Infinity),
    t_tr: 1,
    d_tr: v0
  };

  return {
    a0, k, v0, tr, disponible, vc, gap,
    tf, tTotal, dr, df, dTotal, xFinal: dTotal, margen,
    seDetiene: margen >= 0,
    derivadas,
    elasticidades: {
      v0: dTotal !== 0 ? (v0 / dTotal) * derivadas.d_v0 : NaN,
      tr: dTotal !== 0 ? (tr / dTotal) * derivadas.d_tr : NaN
    },
    condicionTiempo: gap > 0 ? 1 / gap : Infinity
  };
}

function cargarEscenarioDetencion() {
  const clave = $("escenario-detencion").value;
  if (clave === "personalizado") return;
  const p = ESCENARIOS_DETENCION[clave];
  if (!p) return;
  $("det-x0").value = p.x0;
  $("det-v0").value = p.v0;
  $("det-tr").value = p.tr;
  $("det-a").value = p.a;
  $("det-disponible").value = p.disponible;
}

function etiquetaDetencion(p) {
  for (const [clave, q] of Object.entries(ESCENARIOS_DETENCION)) {
    const iguales =
      Math.abs(p.x0 - q.x0) < 1e-12 &&
      Math.abs(p.v0 - q.v0) < 1e-12 &&
      Math.abs(p.tr - q.tr) < 1e-12 &&
      Math.abs(p.a - q.a) < 1e-12 &&
      Math.abs(p.disponible - q.disponible) < 1e-12;
    if (iguales) return clave.toUpperCase();
  }
  return "PERSONALIZADO";
}

function estadoDetencion(res) {
  return res.seDetiene
    ? `<span class="badge ok">Se detiene: margen ${fmt(res.margen, 4)} m</span>`
    : `<span class="badge error">No alcanza: déficit ${fmt(-res.margen, 4)} m</span>`;
}

function tablaDetencion(res) {
  return tablaHTML(
    ["Indicador", "Valor"],
    [
      ["Tiempo de reacción t_r", `${fmt(res.tr, 6)} s`],
      ["Tiempo de frenado t_f = v₀/a", `${fmt(res.tf, 6)} s`],
      ["Tiempo total", `${fmt(res.tTotal, 6)} s`],
      ["Distancia de reacción d_r = v₀t_r", `${fmt(res.dr, 6)} m`],
      ["Distancia de frenado d_f = v₀²/(2a)", `${fmt(res.df, 6)} m`],
      ["Distancia total", `${fmt(res.dTotal, 6)} m`],
      ["Posición final x_final", `${fmt(res.xFinal, 6)} m`],
      ["Distancia disponible", `${fmt(res.disponible, 6)} m`],
      ["Margen", `${fmt(res.margen, 6)} m`],
      ["Estado", estadoDetencion(res)]
    ]
  );
}

function tablaSensibilidadDetencion(res) {
  const filas = [
    [
      "v₀",
      fmtSig(res.derivadas.d_v0, 8),
      fmtSig(res.elasticidades.v0, 6),
      `${fmtSig(res.dTotal * res.elasticidades.v0 * 0.01, 6)} m`
    ],
    [
      "a",
      fmtSig(res.derivadas.d_a, 8),
      fmtSig(res.elasticidades.a, 6),
      `${fmtSig(res.dTotal * res.elasticidades.a * 0.01, 6)} m`
    ],
    [
      "t_r",
      fmtSig(res.derivadas.d_tr, 8),
      fmtSig(res.elasticidades.tr, 6),
      `${fmtSig(res.dTotal * res.elasticidades.tr * 0.01, 6)} m`
    ]
  ];
  return tablaHTML(
    ["Parámetro", "∂d_total/∂p", "Elasticidad S_p", "Cambio de d_total ante +1 %"],
    filas
  );
}

function interpretacionDetencion(res, etiqueta) {
  const partes = [];
  partes.push(
    `El tiempo total es ${fmt(res.tTotal, 4)} s y la distancia total es ${fmt(
      res.dTotal,
      4
    )} m.`
  );
  if (res.seDetiene) {
    partes.push(
      `La cabina se detiene con un margen de ${fmt(
        res.margen,
        4
      )} m antes del límite disponible.`
    );
  } else {
    partes.push(
      `La cabina no alcanza a detenerse: el déficit es ${fmt(
        -res.margen,
        4
      )} m. En un caso real esto obligaría a reducir velocidad, aumentar la desaceleración o ampliar la distancia de protección.`
    );
  }
  if (etiqueta === "MAL") {
    partes.push(
      "El subexperimento MAL usa desaceleración variable, no constante. Su objetivo es mostrar que una pequeña variación de v₀ cerca de a₀/k produce un cambio grande en el tiempo de detención; no es un escenario de riesgo físico adicional."
    );
  } else {
    const sV = res.elasticidades.v0;
    partes.push(
      `La elasticidad de la distancia respecto de v₀ es ${fmtSig(
        sV,
        5
      )}: un aumento del 1 % en v₀ cambia la distancia total aproximadamente en ${fmtSig(
        sV,
        5
      )} %. La distancia depende del cuadrado de la velocidad, por eso este efecto es el más importante.`
    );
  }
  return partes.join(" ");
}

function renderResultadosDetencion(res, etiqueta) {
  $("modulo-1-resultados-contenido").innerHTML =
    `<p><strong>${esc(etiqueta)}</strong></p>` +
    tablaDetencion(res) +
    (etiqueta === "MAL" ? "" : tablaSensibilidadDetencion(res));
  $("modulo-1-interpretacion-contenido").innerHTML =
    `<p>${esc(interpretacionDetencion(res, etiqueta))}</p>`;
  mostrarPanel("modulo-1-resultados");
  mostrarPanel("modulo-1-interpretacion");
}

function calcularDetencionUI() {
  const datos = {
    x0: numero("det-x0"),
    v0: numero("det-v0"),
    tr: numero("det-tr"),
    a: numero("det-a"),
    disponible: numero("det-disponible")
  };
  const res = calcularDetencion(datos);
  if (res.error) {
    $("resultado-detencion").innerHTML = mensajeError(res.error);
    return;
  }
  const etiqueta = etiquetaDetencion(datos);
  $("resultado-detencion").innerHTML =
    `<p><strong>Escenario ${etiqueta}</strong></p>` +
    tablaDetencion(res) +
    `<p class="nota">${esc(interpretacionDetencion(res, etiqueta))}</p>`;
  renderResultadosDetencion(res, etiqueta);
}

function compararDetencionUI() {
  const normal = calcularDetencion(ESCENARIOS_DETENCION.normal);
  const estres = calcularDetencion(ESCENARIOS_DETENCION.estres);
  const mal = calcularDetencionVariable(MAL_DETENCION);

  const filas = [
    [
      "NORMAL",
      "a constante",
      `${fmt(normal.tf, 4)} s`,
      `${fmt(normal.tTotal, 4)} s`,
      `${fmt(normal.dTotal, 4)} m`,
      `${fmt(normal.disponible, 4)} m`,
      `${fmt(normal.margen, 4)} m`,
      estadoDetencion(normal)
    ],
    [
      "ESTRÉS",
      "a constante",
      `${fmt(estres.tf, 4)} s`,
      `${fmt(estres.tTotal, 4)} s`,
      `${fmt(estres.dTotal, 4)} m`,
      `${fmt(estres.disponible, 4)} m`,
      `${fmt(estres.margen, 4)} m`,
      estadoDetencion(estres)
    ],
    [
      "MAL",
      "a(v)=a₀−kv",
      `${fmt(mal.tf, 4)} s`,
      `${fmt(mal.tTotal, 4)} s`,
      `${fmt(mal.dTotal, 4)} m`,
      `${fmt(mal.disponible, 4)} m`,
      `${fmt(mal.margen, 4)} m`,
      estadoDetencion(mal)
    ]
  ];

  $("comparacion-detencion").innerHTML =
    `<h3>Comparación de escenarios</h3>` +
    tablaHTML(
      ["Escenario", "Modelo", "t_f", "t_total", "d_total", "Disponible", "Margen", "Estado"],
      filas
    ) +
    `<p class="nota">Los escenarios NORMAL y ESTRÉS usan frenado constante. MAL es un subexperimento de sensibilidad con desaceleración variable; no debe interpretarse como una condición operativa real.</p>`;
}

function calcularMalUI() {
  const datos = {
    a0: numero("mal-a0"),
    k: numero("mal-k"),
    v0: numero("mal-v0"),
    tr: numero("mal-tr"),
    disponible: numero("mal-disponible")
  };
  const res = calcularDetencionVariable(datos);
  if (res.error) {
    $("resultado-mal-detencion").innerHTML = mensajeError(res.error);
    return;
  }

  const comparacion = 1 / 1.5;
  $("resultado-mal-detencion").innerHTML =
    `<p><strong>Subexperimento MAL CONDICIONADO</strong></p>` +
    tablaHTML(
      ["Indicador", "Valor"],
      [
        ["Velocidad crítica a₀/k", `${fmt(res.vc, 8)} m/s`],
        ["Margen dinámico a₀ − kv₀", fmtSig(res.gap, 8)],
        ["Tiempo de frenado t_f", `${fmt(res.tf, 8)} s`],
        ["Tiempo total", `${fmt(res.tTotal, 8)} s`],
        ["Distancia de frenado d_f", `${fmt(res.df, 8)} m`],
        ["Distancia total", `${fmt(res.dTotal, 8)} m`],
        ["Margen disponible", `${fmt(res.margen, 8)} m`],
        ["∂t_f/∂v₀ = 1/(a₀−kv₀)", fmtSig(res.derivadas.t_v0, 8)],
        ["∂d_total/∂v₀", fmtSig(res.derivadas.d_v0, 8)],
        ["Elasticidad de d_total respecto de v₀", fmtSig(res.elasticidades.v0, 6)],
        ["Condición absoluta del tiempo 1/gap", fmtSig(res.condicionTiempo, 6)],
        ["Comparación con 1/a del modelo constante", `${fmtSig(res.condicionTiempo / comparacion, 6)} ×`]
      ]
    ) +
    `<p class="nota">Como v₀ → a₀/k, el denominador a₀−kv₀ → 0 y la derivada ∂t_f/∂v₀ crece sin límite. Por eso el tiempo de detención se vuelve extremadamente sensible a v₀. La distancia disponible de ${fmt(
      res.disponible,
      0
    )} m se eligió para que el ejemplo no termine en colisión y se pueda comparar el margen.</p>`;
  renderResultadosDetencion(res, "MAL");
}

/* ============================== MÓDULO 2 =============================== */
const ESCENARIOS_DETERIORO = {
  normal: { d0: 0.10, alpha: 0.02, beta: 0.001, umbral: 0.50 },
  estres: { d0: 0.15, alpha: 0.03, beta: 0.0015, umbral: 0.50 },
  mal: { d0: 0.499, alpha: 0.0001, beta: 0.000001, umbral: 0.50 }
};

function resolverCuadratica(d0, alpha, beta, umbral) {
  if (![d0, alpha, beta, umbral].every(Number.isFinite)) {
    return { error: "Todos los parámetros deben ser números finitos." };
  }
  if (beta < 0) return { error: "β debe ser ≥ 0." };
  if (alpha < 0) return { error: "α debe ser ≥ 0." };
  if (umbral < 0) return { error: "El umbral debe ser ≥ 0." };

  if (d0 > umbral) {
    const derivada = alpha;
    return {
      t: 0,
      raiz1: 0,
      raiz2: null,
      discriminante: null,
      derivada,
      condicion: derivada > 0 ? 1 / derivada : Infinity,
      residual: d0 - umbral,
      yaSuperado: true
    };
  }

  if (beta === 0) {
    if (alpha === 0) {
      if (d0 === umbral) {
        return {
          t: 0, raiz1: 0, raiz2: null, discriminante: null,
          derivada: 0, condicion: Infinity, residual: 0, yaSuperado: true
        };
      }
      return { error: "Con α=0 y β=0 el indicador no cambia; no hay un instante de cruce único." };
    }
    const t = (umbral - d0) / alpha;
    return {
      t,
      raiz1: t,
      raiz2: null,
      discriminante: null,
      derivada: alpha,
      condicion: 1 / alpha,
      residual: 0,
      yaSuperado: false
    };
  }

  const discriminante = alpha * alpha - 4 * beta * (d0 - umbral);
  if (discriminante < -1e-15) {
    return {
      error: `El discriminante es negativo (${fmtSig(
        discriminante,
        6
      )}); el modelo cuadrático no cruza el umbral con esos parámetros.`
    };
  }

  const raiz = Math.sqrt(Math.max(0, discriminante));
  const r1 = (-alpha - raiz) / (2 * beta);
  const r2 = (-alpha + raiz) / (2 * beta);
  const candidatas = [r1, r2].filter((t) => t >= -1e-12);
  if (candidatas.length === 0) {
    return { error: "No existe una raíz no negativa físicamente admisible." };
  }
  const t = Math.max(0, Math.min(...candidatas));
  const derivada = alpha + 2 * beta * t;
  return {
    t,
    raiz1: r1,
    raiz2: r2,
    discriminante,
    derivada,
    condicion: Math.abs(derivada) > 0 ? 1 / Math.abs(derivada) : Infinity,
    residual: d0 + alpha * t + beta * t * t - umbral,
    yaSuperado: false
  };
}

function calcularRaizDeterioro(d0, alpha, beta, umbral) {
  const res = resolverCuadratica(d0, alpha, beta, umbral);
  return res.error ? null : res.t;
}

function pasoDiferencia(p) {
  if (p === 0) return 1e-6;
  return Math.max(Math.abs(p) * 1e-3, 1e-9);
}

function derivadaCentral(funcion, p, h) {
  const tp = funcion(p + h);
  const tm = funcion(p - h);
  if (tp !== null && tm !== null) return (tp - tm) / (2 * h);
  const t0 = funcion(p);
  if (t0 === null) return NaN;
  if (p - h < 0) {
    const tpH = funcion(p + h);
    if (tpH === null) return NaN;
    return (tpH - t0) / h;
  }
  const tmH = funcion(p - h);
  if (tmH === null) return NaN;
  return (t0 - tmH) / h;
}

function sensibilidadParametros(d0, alpha, beta, umbral) {
  const base = resolverCuadratica(d0, alpha, beta, umbral);
  if (base.error) return { error: base.error };

  const t = base.t;
  const derivada = base.derivada;
  const d = Math.abs(derivada) > 0 ? derivada : NaN;

  const hAlpha = pasoDiferencia(alpha);
  const hBeta = pasoDiferencia(beta);
  const hUmbral = pasoDiferencia(umbral);

  const numAlpha = derivadaCentral(
    (p) => calcularRaizDeterioro(d0, p, beta, umbral),
    alpha,
    hAlpha
  );
  const numBeta = derivadaCentral(
    (p) => calcularRaizDeterioro(d0, alpha, p, umbral),
    beta,
    hBeta
  );
  const numUmbral = derivadaCentral(
    (p) => calcularRaizDeterioro(d0, alpha, beta, p),
    umbral,
    hUmbral
  );

  const anaAlpha = Number.isFinite(d) && d !== 0 ? -t / d : Infinity;
  const anaBeta = Number.isFinite(d) && d !== 0 ? -(t * t) / d : Infinity;
  const anaUmbral = Number.isFinite(d) && d !== 0 ? 1 / d : Infinity;

  return {
    base,
    t,
    derivada,
    condicion: base.condicion,
    numAlpha,
    numBeta,
    numUmbral,
    anaAlpha,
    anaBeta,
    anaUmbral,
    hAlpha,
    hBeta,
    hUmbral,
    S_alpha: alpha !== 0 && t !== 0 ? (alpha / t) * anaAlpha : NaN,
    S_beta: beta !== 0 && t !== 0 ? (beta / t) * anaBeta : NaN,
    S_umbral: umbral !== 0 && t !== 0 ? (umbral / t) * anaUmbral : NaN
  };
}

function calcularMantenimiento(d0, alpha, beta, umbral, tm, reduccion) {
  const base = resolverCuadratica(d0, alpha, beta, umbral);
  if (base.error) return { error: base.error };
  if (!Number.isFinite(tm) || tm < 0) return { error: "t_m debe ser ≥ 0." };
  if (!Number.isFinite(reduccion) || reduccion < 0) {
    return { error: "La reducción r debe ser ≥ 0." };
  }

  const dAntes = d0 + alpha * tm + beta * tm * tm;
  const dDespues = dAntes - reduccion;
  const desde = resolverCuadratica(dDespues, alpha, beta, umbral);
  if (desde.error) return { error: desde.error };

  if (tm >= base.t) {
    return {
      base,
      tm,
      reduccion,
      dAntes,
      dDespues,
      s: 0,
      tTotal: base.t,
      retraso: 0,
      posterior: true,
      derivadaNueva: desde.derivada,
      condicionNueva: desde.condicion
    };
  }

  const s = dDespues >= umbral ? 0 : desde.t;
  const tTotal = tm + s;
  const retraso = tTotal - base.t;

  return {
    base,
    tm,
    reduccion,
    dAntes,
    dDespues,
    s,
    tTotal,
    retraso,
    posterior: false,
    derivadaNueva: desde.derivada,
    condicionNueva: desde.condicion
  };
}

function cargarEscenarioDeterioroUI() {
  const clave = $("escenario-deterioro").value;
  const p = ESCENARIOS_DETERIORO[clave];
  if (!p) {
    $("estado-escenario-deterioro").textContent = "Parámetros personalizados";
    return;
  }
  $("der-d0").value = p.d0;
  $("der-alpha").value = p.alpha;
  $("der-beta").value = p.beta;
  $("der-umbral").value = p.umbral;
  $("estado-escenario-deterioro").textContent = `Parámetros del escenario ${clave.toUpperCase()}`;
}

function etiquetaDeterioro(d0, alpha, beta, umbral) {
  for (const [clave, p] of Object.entries(ESCENARIOS_DETERIORO)) {
    const iguales =
      Math.abs(p.d0 - d0) < 1e-12 &&
      Math.abs(p.alpha - alpha) < 1e-15 &&
      Math.abs(p.beta - beta) < 1e-15 &&
      Math.abs(p.umbral - umbral) < 1e-12;
    if (iguales) return clave.toUpperCase();
  }
  return "PERSONALIZADO";
}

function leerParametrosDeterioro() {
  return {
    d0: numero("der-d0"),
    alpha: numero("der-alpha"),
    beta: numero("der-beta"),
    umbral: numero("der-umbral")
  };
}

function actualizarEtiquetaDeterioro() {
  const p = leerParametrosDeterioro();
  const etiqueta = etiquetaDeterioro(p.d0, p.alpha, p.beta, p.umbral);
  $("estado-escenario-deterioro").textContent =
    etiqueta === "PERSONALIZADO"
      ? "Parámetros personalizados"
      : `Parámetros del escenario ${etiqueta}`;
}

let ultimoDeterioro = null;

function tablaResultadoDeterioro(res, etiqueta) {
  const filas = [
    ["Escenario", etiqueta],
    ["D₀", fmtSig(res.d0, 8)],
    ["α", fmtSig(res.alpha, 8)],
    ["β", fmtSig(res.beta, 8)],
    ["Umbral", fmtSig(res.umbral, 8)],
    ["t*", `${fmt(res.t, 8)} días`],
    ["D(t*)", fmtSig(res.d0 + res.alpha * res.t + res.beta * res.t * res.t, 10)],
    ["Residual D(t*) − umbral", fmtSig(res.residual, 6)],
    ["D′(t*) = α + 2βt*", fmtSig(res.derivada, 8)],
    ["1/|D′(t*)| (condición absoluta)", fmtSig(res.condicion, 8)]
  ];
  if (res.yaSuperado) {
    filas.push(["Observación", "El umbral ya estaba superado en t=0."]);
  }
  return tablaHTML(["Indicador", "Valor"], filas);
}

function interpretacionDeterioro(res, etiqueta) {
  if (etiqueta === "MAL") {
    return `En el escenario MAL, t* = ${fmt(res.t, 6)} días y D′(t*) = ${fmtSig(
      res.derivada,
      6
    )}. La derivada es pequeña porque α y β son muy pequeños, no porque D₀ esté cerca del umbral. La condición absoluta 1/|D′| = ${fmtSig(
      res.condicion,
      6
    )} indica que un cambio absoluto de 0,001 en el umbral desplaza t* aproximadamente ${fmtSig(
      res.condicion * 0.001,
      4
    )} días. Las elasticidades relativas pueden ser moderadas; por eso conviene distinguir entre sensibilidad absoluta y relativa.`;
  }
  return `La raíz positiva es t* = ${fmt(
    res.t,
    6
  )} días. La derivada D′(t*) = ${fmtSig(
    res.derivada,
    6
  )} mide cuánto cambia el indicador por día en el cruce; su inverso, ${fmtSig(
    res.condicion,
    6
  )}, es la condición absoluta de la raíz. El residual confirma que la solución satisface la ecuación.`;
}

function renderResultadosDeterioro(res, etiqueta) {
  $("modulo-2-resultados-contenido").innerHTML =
    tablaResultadoDeterioro(res, etiqueta);
  $("modulo-2-interpretacion-contenido").innerHTML =
    `<p>${esc(interpretacionDeterioro(res, etiqueta))}</p>`;
  mostrarPanel("modulo-2-resultados");
  mostrarPanel("modulo-2-interpretacion");
}

function calcularDeterioroUI() {
  ultimoDeterioro = null;
  const p = leerParametrosDeterioro();
  const errores = [
    validarNumero(p.d0, "D₀", { min: 0 }),
    validarNumero(p.alpha, "α", { min: 0 }),
    validarNumero(p.beta, "β", { min: 0 }),
    validarNumero(p.umbral, "El umbral", { min: 0 })
  ].filter(Boolean);
  if (errores.length) {
    $("resultado-deterioro").innerHTML = mensajeError(errores.join(" "));
    return;
  }

  const res = resolverCuadratica(p.d0, p.alpha, p.beta, p.umbral);
  if (res.error) {
    $("resultado-deterioro").innerHTML = mensajeError(res.error);
    return;
  }

  const etiqueta = etiquetaDeterioro(p.d0, p.alpha, p.beta, p.umbral);
  $("resultado-deterioro").innerHTML =
    tablaResultadoDeterioro({ ...p, ...res }, etiqueta) +
    `<p class="nota">${esc(interpretacionDeterioro({ ...p, ...res }, etiqueta))}</p>`;

  ultimoDeterioro = { ...p, ...res, etiqueta, fecha: new Date().toLocaleString("es-BO") };
  renderResultadosDeterioro({ ...p, ...res }, etiqueta);
  $("resultado-sensibilidad").textContent =
    "Presiona «Analizar sensibilidad» para estimar derivadas, elasticidades y condición de la raíz.";
  $("resultado-mantenimiento").textContent =
    "Introduce el instante y la reducción para comparar con el caso sin mantenimiento.";
}

function analizarSensibilidadUI() {
  const p = leerParametrosDeterioro();
  const res = sensibilidadParametros(p.d0, p.alpha, p.beta, p.umbral);
  if (res.error) {
    $("resultado-sensibilidad").innerHTML = mensajeError(res.error);
    return;
  }

  const filas = [
    [
      "α",
      fmtSig(res.numAlpha, 8),
      fmtSig(res.anaAlpha, 8),
      fmtSig(res.S_alpha, 6),
      `ε = ${fmtSig(res.hAlpha, 4)} (${fmtSig((res.hAlpha / (p.alpha || 1)) * 100, 4)} %)`
    ],
    [
      "β",
      fmtSig(res.numBeta, 8),
      fmtSig(res.anaBeta, 8),
      fmtSig(res.S_beta, 6),
      `ε = ${fmtSig(res.hBeta, 4)} (${fmtSig((res.hBeta / (p.beta || 1)) * 100, 4)} %)`
    ],
    [
      "Umbral",
      fmtSig(res.numUmbral, 8),
      fmtSig(res.anaUmbral, 8),
      fmtSig(res.S_umbral, 6),
      `ε = ${fmtSig(res.hUmbral, 4)}`
    ]
  ];

  let nota = `La raíz es t* = ${fmt(res.t, 8)} días y D′(t*) = ${fmtSig(
    res.derivada,
    8
  )}. La condición absoluta es 1/|D′| = ${fmtSig(res.condicion, 8)}.`;
  if (res.condicion > 100) {
    nota += ` Un cambio de 0,001 en el umbral produce un cambio aproximado de ${fmtSig(
      res.condicion * 0.001,
      6
    )} días en t*. Esta es la amplificación que justifica la etiqueta MAL CONDICIONADO.`;
  }

  $("resultado-sensibilidad").innerHTML =
    `<h4>Sensibilidad de t*</h4>` +
    tablaHTML(
      ["Parámetro p", "∂t*/∂p numérica", "∂t*/∂p analítica", "Elasticidad S_p", "Paso usado"],
      filas
    ) +
    `<p class="nota">${esc(nota)}</p>`;
}

function compararDeterioroUI() {
  const filas = Object.entries(ESCENARIOS_DETERIORO).map(([clave, p]) => {
    const r = resolverCuadratica(p.d0, p.alpha, p.beta, p.umbral);
    const s = sensibilidadParametros(p.d0, p.alpha, p.beta, p.umbral);
    return [
      clave.toUpperCase(),
      fmtSig(p.d0, 4),
      fmtSig(p.alpha, 4),
      fmtSig(p.beta, 4),
      fmtSig(p.umbral, 4),
      r.error ? "—" : fmt(r.t, 6),
      r.error ? "—" : fmtSig(r.derivada, 6),
      r.error ? "—" : fmtSig(r.condicion, 6),
      s.error ? "—" : fmtSig(s.S_alpha, 5),
      s.error ? "—" : fmtSig(s.S_beta, 5),
      r.error ? "—" : fmtSig(r.residual, 4)
    ];
  });

  $("comparacion-deterioro").innerHTML =
    `<h3>Comparación de los tres escenarios</h3>` +
    tablaHTML(
      ["Escenario", "D₀", "α", "β", "Umbral", "t*", "D′(t*)", "1/|D′|", "S_α", "S_β", "Residual"],
      filas
    ) +
    `<p class="nota">El escenario MAL tiene una condición absoluta mucho mayor, pero sus elasticidades relativas no son necesariamente grandes. Esto ocurre porque α y β son pequeños: la función D(t) es muy plana cerca del cruce y pequeñas variaciones absolutas del umbral producen cambios grandes en t*.</p>`;
}

function calcularMantenimientoUI() {
  const p = leerParametrosDeterioro();
  const tm = numero("der-tm");
  const reduccion = numero("der-reduccion");
  const res = calcularMantenimiento(p.d0, p.alpha, p.beta, p.umbral, tm, reduccion);
  if (res.error) {
    $("resultado-mantenimiento").innerHTML = mensajeError(res.error);
    return;
  }

  const estado = res.posterior
    ? "El mantenimiento se realiza después del cruce del umbral; no evita la inspección, solo reduce el indicador posterior."
    : res.retraso > 0
      ? "El mantenimiento retrasa el cruce del umbral."
      : "El mantenimiento no retrasa el cruce en este caso.";

  $("resultado-mantenimiento").innerHTML =
    `<h4>Comparación con y sin mantenimiento</h4>` +
    tablaHTML(
      ["Indicador", "Valor"],
      [
        ["t* sin mantenimiento", `${fmt(res.base.t, 6)} días`],
        ["Instante de mantenimiento t_m", `${fmt(res.tm, 6)} días`],
        ["D(t_m) antes del mantenimiento", fmtSig(res.dAntes, 8)],
        ["D(t_m) después de la reducción r", fmtSig(res.dDespues, 8)],
        ["Tiempo adicional s desde t_m", `${fmt(res.s, 6)} días`],
        ["t_total con mantenimiento", `${fmt(res.tTotal, 6)} días`],
        ["Retraso del cruce t_total − t*", `${fmt(res.retraso, 6)} días`],
        ["D′ en el nuevo cruce", fmtSig(res.derivadaNueva, 8)],
        ["Condición 1/|D′| en el nuevo cruce", fmtSig(res.condicionNueva, 8)]
      ]
    ) +
    `<p class="nota">${esc(estado)}</p>`;
}

/* --------------------- Historial de deterioro -------------------------- */
const CLAVE_HISTORIAL_DETERIORO = "simtele_historial_deterioro";

function leerHistorialDeterioro() {
  try {
    const datos = JSON.parse(leerLocal(CLAVE_HISTORIAL_DETERIORO) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarHistorialDeterioroUI() {
  if (!ultimoDeterioro) {
    alert("Primero ejecuta un escenario de deterioro.");
    return;
  }
  const arr = leerHistorialDeterioro();
  arr.unshift({
    fecha: ultimoDeterioro.fecha,
    escenario: ultimoDeterioro.etiqueta,
    d0: ultimoDeterioro.d0,
    alpha: ultimoDeterioro.alpha,
    beta: ultimoDeterioro.beta,
    umbral: ultimoDeterioro.umbral,
    raiz: ultimoDeterioro.t,
    derivada: ultimoDeterioro.derivada,
    condicion: ultimoDeterioro.condicion,
    residual: ultimoDeterioro.residual
  });
  guardarLocal(
    CLAVE_HISTORIAL_DETERIORO,
    JSON.stringify(arr.slice(0, 20))
  );
  renderHistorialDeterioro();
}

function renderHistorialDeterioro() {
  const cont = $("historial");
  if (!cont) return;
  const arr = leerHistorialDeterioro();
  if (arr.length === 0) {
    cont.innerHTML = "Todavía no hay registros de deterioro guardados.";
    return;
  }
  cont.innerHTML = arr
    .map(
      (h, i) => `<div class="historial-item">
        <div><strong>${esc(h.fecha)}</strong> · ${esc(h.escenario)} · t* = ${fmt(h.raiz, 6)} días</div>
        <div class="nota">D₀=${fmtSig(h.d0, 4)} · α=${fmtSig(h.alpha, 4)} · β=${fmtSig(h.beta, 4)} · umbral=${fmtSig(h.umbral, 4)} · 1/|D′|=${fmtSig(h.condicion, 4)}</div>
        <button class="boton secundario" data-cargar-deterioro="${i}">Cargar</button>
        <button class="boton secundario" data-eliminar-deterioro="${i}">Eliminar</button>
      </div>`
    )
    .join("");

  cont.querySelectorAll("[data-cargar-deterioro]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const h = leerHistorialDeterioro()[Number(btn.dataset.cargarDeterioro)];
      if (!h) return;
      $("der-d0").value = h.d0;
      $("der-alpha").value = h.alpha;
      $("der-beta").value = h.beta;
      $("der-umbral").value = h.umbral;
      $("escenario-deterioro").value = "personalizado";
      $("estado-escenario-deterioro").textContent = "Parámetros recuperados del historial";
      calcularDeterioroUI();
      $("modulo-deterioro").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  cont.querySelectorAll("[data-eliminar-deterioro]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.eliminarDeterioro);
      const lista = leerHistorialDeterioro();
      lista.splice(idx, 1);
      guardarLocal(CLAVE_HISTORIAL_DETERIORO, JSON.stringify(lista));
      renderHistorialDeterioro();
    });
  });
}

function limpiarHistorialDeterioro() {
  borrarLocal(CLAVE_HISTORIAL_DETERIORO);
  renderHistorialDeterioro();
}

/* ============================== MÓDULO 3 =============================== */
const ESCENARIOS_OSCILACIONES = {
  normal: { m: 1000, c: 500, k: 20000, f0: 1000, w: 2, x0: 0.05, v0: 0 },
  estres: { m: 1200, c: 300, k: 15000, f0: 1800, w: 3.2, x0: 0.12, v0: 0.05 },
  mal: { m: 1000, c: 150, k: 20000, f0: 1000, w: 4.4, x0: 0.05, v0: 0 }
};

function amplitudForzada(p, w = p.w) {
  const den = Math.sqrt(
    Math.pow(p.k - p.m * w * w, 2) + Math.pow(p.c * w, 2)
  );
  return den > 0 ? p.f0 / den : Infinity;
}

function analizarOscilaciones(p) {
  const errores = [
    validarNumero(p.m, "La masa m", { min: 1e-12 }),
    validarNumero(p.c, "El amortiguamiento c", { min: 0 }),
    validarNumero(p.k, "La rigidez k", { min: 1e-12 }),
    validarNumero(p.f0, "La fuerza F₀", { min: 0 }),
    validarNumero(p.w, "La frecuencia ω", { min: 0 }),
    validarNumero(p.x0, "La posición inicial x₀"),
    validarNumero(p.v0, "La velocidad inicial v₀")
  ].filter(Boolean);
  if (errores.length) return { error: errores.join(" ") };

  const omega0 = Math.sqrt(p.k / p.m);
  const zeta = p.c / (2 * Math.sqrt(p.k * p.m));
  let regimen;
  let omegaD = NaN;
  let C1;
  let C2;
  let xLibre;
  let vLibre;

  if (zeta < 1) {
    regimen = "subamortiguado";
    omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    C1 = p.x0;
    C2 = (p.v0 + zeta * omega0 * p.x0) / omegaD;
    xLibre = (t) =>
      Math.exp(-zeta * omega0 * t) *
      (C1 * Math.cos(omegaD * t) + C2 * Math.sin(omegaD * t));
    vLibre = (t) =>
      Math.exp(-zeta * omega0 * t) *
      ((-zeta * omega0 * C1 + omegaD * C2) * Math.cos(omegaD * t) +
        (-zeta * omega0 * C2 - omegaD * C1) * Math.sin(omegaD * t));
  } else if (Math.abs(zeta - 1) < 1e-12) {
    regimen = "crítico";
    omegaD = 0;
    C1 = p.x0;
    C2 = p.v0 + omega0 * p.x0;
    xLibre = (t) => Math.exp(-omega0 * t) * (C1 + C2 * t);
    vLibre = (t) =>
      Math.exp(-omega0 * t) * (C2 - omega0 * (C1 + C2 * t));
  } else {
    regimen = "sobreamortiguado";
    const raiz = omega0 * Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta * omega0 + raiz;
    const r2 = -zeta * omega0 - raiz;
    C1 = (p.v0 - r2 * p.x0) / (r1 - r2);
    C2 = p.x0 - C1;
    xLibre = (t) => C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
    vLibre = (t) => C1 * r1 * Math.exp(r1 * t) + C2 * r2 * Math.exp(r2 * t);
  }

  const X = amplitudForzada(p);
  const fase = Math.atan2(p.c * p.w, p.k - p.m * p.w * p.w);
  const razon = p.w / omega0;
  const envolvente = Number.isFinite(C1) && Number.isFinite(C2)
    ? Math.sqrt(C1 * C1 + C2 * C2)
    : NaN;

  const hW = Math.max(Math.abs(p.w) * 1e-4, 1e-8);
  const hC = Math.max(Math.abs(p.c) * 1e-4, 1e-8);
  const dXdw =
    (amplitudForzada(p, p.w + hW) - amplitudForzada(p, p.w - hW)) / (2 * hW);
  const dXdc =
    (amplitudForzada({ ...p, c: p.c + hC }) -
      amplitudForzada({ ...p, c: Math.max(0, p.c - hC) })) /
    (p.c - hC >= 0 ? 2 * hC : hC);

  return {
    ...p,
    omega0,
    zeta,
    regimen,
    omegaD,
    C1,
    C2,
    envolvente,
    X,
    fase,
    razon,
    dXdw,
    dXdc,
    S_w: X !== 0 ? (p.w / X) * dXdw : NaN,
    S_c: X !== 0 && p.c !== 0 ? (p.c / X) * dXdc : NaN,
    xLibre,
    vLibre
  };
}

function cargarEscenarioOscilacionesUI() {
  const clave = $("escenario-oscilaciones").value;
  const p = ESCENARIOS_OSCILACIONES[clave];
  if (!p) return;
  $("osc-m").value = p.m;
  $("osc-c").value = p.c;
  $("osc-k").value = p.k;
  $("osc-f0").value = p.f0;
  $("osc-w").value = p.w;
  $("osc-x0").value = p.x0;
  $("osc-v0").value = p.v0;
}

function renderTablaEscenariosOscilaciones() {
  const filas = Object.entries(ESCENARIOS_OSCILACIONES).map(([clave, p]) => {
    const r = analizarOscilaciones(p);
    return [
      clave.toUpperCase(),
      fmtSig(p.m, 5),
      fmtSig(p.c, 5),
      fmtSig(p.k, 5),
      fmtSig(p.f0, 5),
      fmtSig(p.w, 5),
      r.error ? "—" : fmtSig(r.omega0, 5),
      r.error ? "—" : fmtSig(r.zeta, 5),
      r.error ? "—" : r.regimen,
      r.error ? "—" : fmtSig(r.X, 5),
      r.error ? "—" : fmtSig(r.razon, 5),
      r.error ? "—" : fmtSig(Math.abs(r.dXdw), 5)
    ];
  });
  $("tabla-escenarios-oscilaciones").innerHTML =
    tablaHTML(
      ["Escenario", "m (kg)", "c (N·s/m)", "k (N/m)", "F₀ (N)", "ω (rad/s)", "ω₀", "ζ", "Régimen", "X forzada (m)", "ω/ω₀", "|dX/dω|"],
      filas
    ) +
    `<p class="nota">El escenario MAL combina amortiguamiento bajo con una frecuencia de excitación cercana a ω₀ para estudiar la cercanía a resonancia. La simulación temporal forzada con RK2/RK4 se implementa en S2; aquí se reporta la referencia analítica de régimen permanente y la sensibilidad de la amplitud.</p>`;
}

function interpretacionOscilaciones(r, etiqueta) {
  const base = `La frecuencia natural es ω₀ = ${fmtSig(
    r.omega0,
    6
  )} rad/s y la razón de amortiguamiento ζ = ${fmtSig(
    r.zeta,
    6
  )}, por lo que el régimen es ${r.regimen}. La amplitud forzada de régimen permanente es X = ${fmtSig(
    r.X,
    6
  )} m, con ω/ω₀ = ${fmtSig(r.razon, 6)}.`;
  if (etiqueta === "MAL") {
    return `${base} Al estar en ω ≈ ω₀, la amplitud es mucho mayor que en NORMAL y la sensibilidad |dX/dω| = ${fmtSig(
      Math.abs(r.dXdw),
      6
    )} también aumenta. Esto ilustra un problema mal condicionado en la práctica: pequeñas variaciones de la frecuencia de excitación producen cambios grandes en la respuesta. No implica que la estructura real falle; es un modelo académico.`;
  }
  return `${base} La sensibilidad |dX/dω| = ${fmtSig(
    Math.abs(r.dXdw),
    6
  )} m/(rad/s) permite comparar escenarios. Cuanto más cerca de la resonancia, mayor es la respuesta y más sensible resulta a la frecuencia de excitación.`;
}

function calcularOscilacionesUI() {
  const clave = $("escenario-oscilaciones").value;
  const p = ESCENARIOS_OSCILACIONES[clave];
  if (!p) return;
  cargarEscenarioOscilacionesUI();
  const r = analizarOscilaciones(p);
  if (r.error) {
    $("modulo-3-resultados-contenido").innerHTML = mensajeError(r.error);
    mostrarPanel("modulo-3-resultados");
    return;
  }

  const etiqueta = clave.toUpperCase();
  const tiempos = [0, 1, 2, 5];
  const filasTiempo = tiempos.map((t) => [
    fmt(t, 2),
    fmtSig(r.xLibre(t), 8),
    fmtSig(r.vLibre(t), 8)
  ]);

  $("modulo-3-resultados-contenido").innerHTML =
    `<p><strong>Escenario ${etiqueta}</strong></p>` +
    tablaHTML(
      ["Indicador", "Valor"],
      [
        ["ω₀ = √(k/m)", `${fmtSig(r.omega0, 8)} rad/s`],
        ["ζ = c/(2√(km))", fmtSig(r.zeta, 8)],
        ["Régimen", r.regimen],
        ["ω_d = ω₀√(1−ζ²)", Number.isFinite(r.omegaD) ? `${fmtSig(r.omegaD, 8)} rad/s` : "—"],
        ["C₁", fmtSig(r.C1, 8)],
        ["C₂", fmtSig(r.C2, 8)],
        ["Envolvente √(C₁²+C₂²)", `${fmtSig(r.envolvente, 8)} m`],
        ["Amplitud forzada X", `${fmtSig(r.X, 8)} m`],
        ["Fase φ", `${fmtSig(r.fase, 8)} rad`],
        ["Razón ω/ω₀", fmtSig(r.razon, 8)],
        ["dX/dω", `${fmtSig(r.dXdw, 8)} m/(rad/s)`],
        ["Elasticidad S_ω", fmtSig(r.S_w, 6)]
      ]
    ) +
    `<h4>Vibración libre de referencia</h4>` +
    tablaHTML(["t (s)", "x_libre(t) (m)", "v_libre(t) (m/s)"], filasTiempo) +
    `<p class="nota">${esc(interpretacionOscilaciones(r, etiqueta))}</p>`;

  $("modulo-3-interpretacion-contenido").innerHTML =
    `<p>${esc(interpretacionOscilaciones(r, etiqueta))}</p>` +
    `<p class="nota">La referencia libre usa F(t)=0. La respuesta forzada de régimen permanente se calcula con X = F₀/√((k−mω²)²+(cω)²). La simulación numérica de la EDO completa corresponde a S2.</p>`;
  mostrarPanel("modulo-3-resultados");
  mostrarPanel("modulo-3-interpretacion");
}

/* ============================== MÓDULO 4 =============================== */
const ESCENARIOS_SENSORES = {
  normal: {
    nodos: [0, 0.5, 1, 1.5, 2],
    sigma: 0,
    semilla: null,
    ocultos: [0.25, 0.75, 1.25, 1.75],
    umbral: 0.8,
    descripcion: "Nodos equiespaciados, sin ruido. Sirve como referencia de reconstrucción."
  },
  estres: {
    nodos: [0, 0.5, 1, 1.5, 2],
    sigma: 0.05,
    semilla: 12345,
    ocultos: [0.25, 0.75, 1.25, 1.75],
    umbral: 0.8,
    descripcion: "Nodos equiespaciados con ruido aditivo N(0, 0.05²). El ruido se genera en S2 con semilla fija."
  },
  mal: {
    nodos: [0, 0.01, 0.02, 0.03, 2],
    sigma: 0,
    semilla: null,
    ocultos: [0.005, 0.015, 0.025, 1.0],
    umbral: 0.8,
    descripcion: "Nodos agrupados cerca de 0 y un nodo lejano en 2. La matriz de Vandermonde queda severamente mal condicionada."
  }
};

function matrizVandermonde(nodos) {
  return nodos.map((t) => nodos.map((_, j) => Math.pow(t, j)));
}

function crucesUmbral(umbral) {
  if (umbral < -1 || umbral > 1) return [];
  const u = Math.asin(umbral);
  const candidatos = [];
  for (let k = -2; k <= 2; k++) {
    candidatos.push(u + 2 * Math.PI * k);
    candidatos.push(Math.PI - u + 2 * Math.PI * k);
  }
  return [...new Set(candidatos.map((t) => Number(t.toFixed(12))))]
    .filter((t) => t >= 0 && t <= 2)
    .sort((a, b) => a - b);
}

function analizarSensores(p) {
  const V = matrizVandermonde(p.nodos);
  const kappaInf = condicionInf(V);
  const kappa2 = condicion2(V);
  const y = p.nodos.map((t) => Math.sin(t));
  const cruces = crucesUmbral(p.umbral);
  return { ...p, V, kappaInf, kappa2, y, cruces };
}

function cargarEscenarioSensoresUI() {
  const clave = $("escenario-sensores").value;
  const p = ESCENARIOS_SENSORES[clave];
  if (!p) return null;
  return { clave, ...p };
}

function renderTablaEscenariosSensores() {
  const filas = Object.entries(ESCENARIOS_SENSORES).map(([clave, p]) => {
    const r = analizarSensores(p);
    return [
      clave.toUpperCase(),
      `[${p.nodos.join(", ")}]`,
      p.sigma === 0 ? "0" : fmtSig(p.sigma, 4),
      p.semilla === null ? "—" : p.semilla,
      `[${p.ocultos.join(", ")}]`,
      fmtSig(r.kappaInf, 6),
      fmtSig(r.kappa2, 6),
      interpretarCondicion(r.kappaInf)
    ];
  });
  $("tabla-escenarios-sensores").innerHTML =
    tablaHTML(
      ["Escenario", "Nodos t_i", "σ", "Semilla", "Puntos ocultos", "κ∞(V)", "κ₂(V)", "Interpretación"],
      filas
    ) +
    `<p class="nota">La interpolación de Lagrange, Newton y splines se implementa en S2. En S1 se define el muestreo, el ruido y el condicionamiento de la matriz de Vandermonde que determina la estabilidad del ajuste polinomial.</p>`;
}

function renderSensoresUI(mostrar) {
  const escenario = cargarEscenarioSensoresUI();
  if (!escenario) return;
  renderTablaEscenariosSensores();
  const r = analizarSensores(escenario);

  $("tabla-sensores-contenedor").innerHTML =
    tablaHTML(
      ["i", "t_i (s)", "y_i = sen(t_i)", "Ruido declarado"],
      r.nodos.map((t, i) => [
        i + 1,
        fmtSig(t, 6),
        fmtSig(r.y[i], 8),
        r.sigma === 0 ? "sin ruido" : `ε_i ~ N(0, ${fmtSig(r.sigma, 4)}²)`
      ])
    ) +
    `<p class="nota">${esc(r.descripcion)}</p>`;

  const filasCruces = r.cruces.map((t) => [
    fmt(t, 8),
    fmtSig(Math.sin(t), 8),
    "Bisección, Newton-Raphson o secante (S2)"
  ]);

  $("condicion-sensores").innerHTML =
    tablaHTML(
      ["Indicador", "Valor"],
      [
        ["κ∞(V) = ||V||∞·||V⁻¹||∞", fmtSig(r.kappaInf, 8)],
        ["κ₂(V)", fmtSig(r.kappa2, 8)],
        ["Interpretación", interpretarCondicion(r.kappaInf)],
        ["Nodos", `[${r.nodos.join(", ")}]`],
        ["Puntos ocultos", `[${r.ocultos.join(", ")}]`]
      ]
    ) +
    (filasCruces.length
      ? `<h4>Cruces de umbral y(t)=${fmtSig(r.umbral, 4)}</h4>` +
        tablaHTML(["t de cruce (s)", "y(t)", "Método previsto"], filasCruces)
      : `<p class="nota">La señal no cruza el umbral dentro de [0, 2].</p>`);

  if (mostrar) {
    const etiqueta = escenario.clave.toUpperCase();
    $("modulo-4-resultados-contenido").innerHTML =
      `<p><strong>Escenario ${etiqueta}</strong></p>` +
      tablaHTML(
        ["Indicador", "Valor"],
        [
          ["Nodos", `[${r.nodos.join(", ")}]`],
          ["σ del ruido", r.sigma === 0 ? "0" : fmtSig(r.sigma, 6)],
          ["Semilla", r.semilla === null ? "—" : r.semilla],
          ["κ∞(V)", fmtSig(r.kappaInf, 8)],
          ["κ₂(V)", fmtSig(r.kappa2, 8)],
          ["Interpretación", interpretarCondicion(r.kappaInf)],
          ["Puntos ocultos", `[${r.ocultos.join(", ")}]`],
          ["Umbral", fmtSig(r.umbral, 4)],
          ["Cruces en [0,2]", r.cruces.length ? r.cruces.map((t) => fmt(t, 6)).join(", ") : "ninguno"]
        ]
      ) +
      `<p class="nota">${esc(r.descripcion)}</p>`;

    const interpretacion =
      r.kappaInf > 1e6
        ? `La matriz de Vandermonde tiene κ∞ = ${fmtSig(
            r.kappaInf,
            6
          )}, un valor muy alto. Esto significa que pequeños cambios en las mediciones o en los nodos pueden producir cambios grandes en los coeficientes del polinomio de interpolación. Es el ejemplo de mal condicionamiento del módulo.`
        : `La matriz de Vandermonde tiene κ∞ = ${fmtSig(
            r.kappaInf,
            6
          )}. El condicionamiento es moderado; la reconstrucción polinomial es más estable que con nodos agrupados.`;
    $("modulo-4-interpretacion-contenido").innerHTML =
      `<p>${esc(interpretacion)}</p>` +
      `<p class="nota">En S2 se compararán Lagrange, Newton y splines cúbicos en los puntos ocultos, y se resolverán los cruces de umbral con bisección, Newton-Raphson y secante. El ruido de ESTRÉS se generará con la semilla indicada para que el experimento sea reproducible.</p>`;
    mostrarPanel("modulo-4-resultados");
    mostrarPanel("modulo-4-interpretacion");
  }
}

/* ======================== Teoría de errores ============================ */
function calcularErrorUI() {
  const ref = numero("error-ref");
  const aprox = numero("error-aprox");
  if (!Number.isFinite(ref) || !Number.isFinite(aprox)) {
    $("resultado-error").innerHTML = mensajeError(
      "El valor de referencia y el aproximado deben ser números finitos."
    );
    return;
  }

  const absoluto = Math.abs(ref - aprox);
  const tieneRelativo = ref !== 0;
  const relativo = tieneRelativo ? absoluto / Math.abs(ref) : null;
  const porcentual = tieneRelativo ? 100 * relativo : null;

  $("resultado-error").innerHTML =
    tablaHTML(
      ["Métrica", "Valor"],
      [
        ["Error absoluto |V_r − V_a|", fmtSig(absoluto, 8)],
        ["Error relativo", tieneRelativo ? fmtSig(relativo, 8) : "no definido (V_r = 0)"],
        ["Error porcentual", tieneRelativo ? `${fmtSig(porcentual, 6)} %` : "no definido (V_r = 0)"]
      ]
    ) +
    `<p class="nota">Cuando la referencia es cero solo se reporta el error absoluto; el error relativo y el porcentual no están definidos.</p>`;
}

/* ========================= Navegación e inicio ========================= */
function configurarNavegacion() {
  const tarjetas = document.querySelectorAll(".tarjeta");
  const modulos = document.querySelectorAll(".modulo");
  tarjetas.forEach((btn) => {
    btn.addEventListener("click", () => {
      tarjetas.forEach((b) => b.classList.remove("activa"));
      btn.classList.add("activa");
      const destino = `modulo-${btn.dataset.modulo}`;
      modulos.forEach((m) => m.classList.toggle("oculto", m.id !== destino));
      const el = $(destino);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function init() {
  configurarNavegacion();

  /* Módulo 1 */
  cargarEscenarioDetencion();
  $("escenario-detencion").addEventListener("change", () => {
    cargarEscenarioDetencion();
    ocultarPanel("modulo-1-resultados");
    ocultarPanel("modulo-1-interpretacion");
    $("resultado-detencion").textContent =
      "Introduce los parámetros y ejecuta el escenario.";
  });
  $("calcular-detencion").addEventListener("click", calcularDetencionUI);
  $("comparar-detencion").addEventListener("click", compararDetencionUI);
  $("calcular-mal-detencion").addEventListener("click", calcularMalUI);

  /* Módulo 2 */
  cargarEscenarioDeterioroUI();
  $("escenario-deterioro").addEventListener("change", () => {
    cargarEscenarioDeterioroUI();
    ocultarPanel("modulo-2-resultados");
    ocultarPanel("modulo-2-interpretacion");
    $("resultado-deterioro").textContent = "Selecciona un escenario y ejecútalo.";
    $("resultado-sensibilidad").textContent =
      "Presiona «Analizar sensibilidad» para estimar derivadas, elasticidades y condición de la raíz.";
    $("resultado-mantenimiento").textContent =
      "Introduce el instante y la reducción para comparar con el caso sin mantenimiento.";
  });
  ["der-d0", "der-alpha", "der-beta", "der-umbral"].forEach((id) => {
    $(id).addEventListener("input", actualizarEtiquetaDeterioro);
  });
  $("calcular-deterioro").addEventListener("click", calcularDeterioroUI);
  $("analizar-sensibilidad").addEventListener("click", analizarSensibilidadUI);
  $("comparar-deterioro").addEventListener("click", compararDeterioroUI);
  $("calcular-mantenimiento").addEventListener("click", calcularMantenimientoUI);
  $("guardar-historial").addEventListener("click", guardarHistorialDeterioroUI);
  $("limpiar-historial-deterioro").addEventListener("click", limpiarHistorialDeterioro);

  /* Módulo 3 */
  cargarEscenarioOscilacionesUI();
  renderTablaEscenariosOscilaciones();
  $("escenario-oscilaciones").addEventListener("change", () => {
    cargarEscenarioOscilacionesUI();
    renderTablaEscenariosOscilaciones();
    ocultarPanel("modulo-3-resultados");
    ocultarPanel("modulo-3-interpretacion");
  });
  const btnOsc = $("calcular-oscilaciones");
  if (btnOsc) btnOsc.addEventListener("click", calcularOscilacionesUI);

  /* Módulo 4 */
  renderSensoresUI(false);
  $("escenario-sensores").addEventListener("change", () => {
    renderSensoresUI(false);
    ocultarPanel("modulo-4-resultados");
    ocultarPanel("modulo-4-interpretacion");
  });
  const btnSen = $("calcular-sensores");
  if (btnSen) btnSen.addEventListener("click", () => renderSensoresUI(true));

  /* Sistemas lineales */
  renderSistemaActual();
  $("matriz-sistema").addEventListener("change", () => {
    renderSistemaActual();
    ultimaEjecucionSistemas = null;
    $("tabla-sistemas").innerHTML =
      '<tr><td colspan="11">Presiona el botón para ejecutar los métodos.</td></tr>';
    $("tabla-iteraciones-sistemas").innerHTML =
      '<tr><td colspan="5">Ejecuta los métodos para ver la convergencia.</td></tr>';
    $("diagnostico-sistemas").innerHTML = "";
    $("resultado-perturbacion").innerHTML = "";
    $("factores-lu").textContent = "La factorización se muestra después de ejecutar.";
    $("resultado-guardado-sistemas").textContent =
      "La última ejecución todavía no se ha guardado.";
  });
  $("resolver-sistemas").addEventListener("click", resolverSistemas);
  $("perturbar-sistemas").addEventListener("click", perturbarSistemas);
  $("guardar-sistemas").addEventListener("click", guardarHistorialSistemas);
  $("limpiar-historial-sistemas").addEventListener("click", limpiarHistorialSistemas);
  renderHistorialSistemas();

  /* Errores */
  $("calcular-error").addEventListener("click", calcularErrorUI);

  /* Historial de deterioro */
  renderHistorialDeterioro();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

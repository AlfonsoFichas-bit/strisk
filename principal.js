const A = [
  [10,-1,2,0],
  [-1,11,-1,3],
  [2,-1,10,-1],
  [0,3,-1,8]
];
const b = [14,30,26,35];
const xRef = [1,2,3,4];

function numero(id){ return Number(document.getElementById(id).value); }
function fmt(x){ return Number(x).toFixed(8); }
function fmtSig(x,digitos=6){ return Number(x).toPrecision(digitos); }
function normaInf(v){ return Math.max(...v.map(x=>Math.abs(x))); }
function residual(A,b,x){
  return b.map((bi,i)=>bi-A[i].reduce((s,aij,j)=>s+aij*x[j],0));
}
function errorMax(x,ref){ return Math.max(...x.map((v,i)=>Math.abs(v-ref[i]))); }

function jacobi(A,b,tol,maxIter){
  let x=[0,0,0,0], it=0, r=residual(A,b,x);
  for(it=1;it<=maxIter;it++){
    const xn=[0,0,0,0];
    for(let i=0;i<4;i++){
      let suma=0;
      for(let j=0;j<4;j++) if(j!==i) suma+=A[i][j]*x[j];
      xn[i]=(b[i]-suma)/A[i][i];
    }
    x=xn; r=residual(A,b,x);
    if(normaInf(r)<tol) break;
  }
  return {x,it:Math.min(it,maxIter),res:normaInf(r),ok:normaInf(r)<tol};
}
function gaussSeidel(A,b,tol,maxIter){
  let x=[0,0,0,0], it=0, r=residual(A,b,x);
  for(it=1;it<=maxIter;it++){
    for(let i=0;i<4;i++){
      let suma=0;
      for(let j=0;j<4;j++) if(j!==i) suma+=A[i][j]*x[j];
      x[i]=(b[i]-suma)/A[i][i];
    }
    r=residual(A,b,x);
    if(normaInf(r)<tol) break;
  }
  return {x,it:Math.min(it,maxIter),res:normaInf(r),ok:normaInf(r)<tol};
}
function luSolve(A,b){
  const n=b.length, L=Array.from({length:n},()=>Array(n).fill(0));
  const U=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){
    for(let k=i;k<n;k++){
      let s=0; for(let j=0;j<i;j++) s+=L[i][j]*U[j][k];
      U[i][k]=A[i][k]-s;
    }
    for(let k=i;k<n;k++){
      if(i===k) L[i][i]=1;
      else{
        let s=0; for(let j=0;j<i;j++) s+=L[k][j]*U[j][i];
        L[k][i]=(A[k][i]-s)/U[i][i];
      }
    }
  }
  const y=Array(n).fill(0), x=Array(n).fill(0);
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<i;j++)s+=L[i][j]*y[j];y[i]=b[i]-s;}
  for(let i=n-1;i>=0;i--){let s=0;for(let j=i+1;j<n;j++)s+=U[i][j]*x[j];x[i]=(y[i]-s)/U[i][i];}
  return {x,L,U};
}
function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0);}
function matVec(A,x){return A.map(row=>dot(row,x));}
function gradienteConjugado(A,b,tol,maxIter){
  let x=[0,0,0,0], r=b.map((v,i)=>v-matVec(A,x)[i]), p=r.slice(), rr=dot(r,r), it=0;
  for(it=1;it<=maxIter && Math.sqrt(rr)>=tol;it++){
    const Ap=matVec(A,p), den=dot(p,Ap);
    if(den<=0) throw new Error("La matriz no cumple la condición SPD necesaria.");
    const alpha=rr/den;
    x=x.map((v,i)=>v+alpha*p[i]);
    const rn=r.map((v,i)=>v-alpha*Ap[i]);
    const rrNuevo=dot(rn,rn), beta=rrNuevo/rr;
    p=rn.map((v,i)=>v+beta*p[i]); r=rn; rr=rrNuevo;
  }
  const res=normaInf(residual(A,b,x));
  return {x,it:Math.min(it-1,maxIter),res,ok:res<tol};
}
function normaInfMat(M){
  return Math.max(...M.map(fila=>fila.reduce((s,v)=>s+Math.abs(v),0)));
}
function inversa4x4(M){
  const n=M.length;
  const aug=M.map((fila,i)=>[...fila.map(Number),...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let col=0;col<n;col++){
    let pivote=col;
    for(let fila=col+1;fila<n;fila++){
      if(Math.abs(aug[fila][col])>Math.abs(aug[pivote][col])) pivote=fila;
    }
    if(Math.abs(aug[pivote][col])<1e-12) throw new Error("La matriz es singular o casi singular.");
    [aug[col],aug[pivote]]=[aug[pivote],aug[col]];
    const divisor=aug[col][col];
    for(let j=0;j<2*n;j++) aug[col][j]/=divisor;
    for(let fila=0;fila<n;fila++){
      if(fila===col) continue;
      const factor=aug[fila][col];
      if(factor===0) continue;
      for(let j=0;j<2*n;j++) aug[fila][j]-=factor*aug[col][j];
    }
  }
  return aug.map(fila=>fila.slice(n));
}
function autovalorMaxPotencia(M,tol=1e-10,maxIter=100){
  const n=M.length;
  let v=Array(n).fill(1), lambda=0;
  for(let it=0;it<maxIter;it++){
    const w=matVec(M,v);
    const norma=Math.sqrt(dot(w,w));
    if(norma===0) return 0;
    v=w.map(x=>x/norma);
    const nuevo=dot(v,matVec(M,v));
    if(Math.abs(nuevo-lambda)<tol) return nuevo;
    lambda=nuevo;
  }
  return lambda;
}
function calcularCondicion(M=A){
  const inv=inversa4x4(M);
  const kInf=normaInfMat(M)*normaInfMat(inv);
  const k2=autovalorMaxPotencia(M)*autovalorMaxPotencia(inv);
  return {kInf,k2};
}
function interpretarCondicion(kappa){
  if(!Number.isFinite(kappa)) return "no determinada";
  if(kappa<1e2) return "bien condicionada";
  if(kappa<=1e6) return "moderadamente mal condicionada";
  return "severamente mal condicionada";
}
function mostrarSistemas(){
  const tol=numero("tolerancia"), maxIter=Math.floor(numero("max-iter"));
  if(!(tol>0) || !(maxIter>0)){alert("La tolerancia y el máximo de iteraciones deben ser positivos.");return;}
  const resultados=[];
  const j=jacobi(A,b,tol,maxIter), gs=gaussSeidel(A,b,tol,maxIter);
  const lu=luSolve(A,b), cg=gradienteConjugado(A,b,tol,maxIter);
  resultados.push(["Jacobi",j.x,j.it,j.res,j.ok]);
  resultados.push(["Gauss-Seidel",gs.x,gs.it,gs.res,gs.ok]);
  resultados.push(["LU",lu.x,"Directo",normaInf(residual(A,b,lu.x)),true]);
  resultados.push(["Gradiente conjugado",cg.x,cg.it,cg.res,cg.ok]);
  const tbody=document.getElementById("tabla-sistemas");
  tbody.innerHTML="";
  resultados.forEach(r=>{
    const tr=document.createElement("tr");
    const vals=[r[0],...r[1].map(fmt),r[2],fmt(r[3]),fmt(errorMax(r[1],xRef)),r[4]?"Convergió":"No convergió"];
    vals.forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
    tbody.appendChild(tr);
  });
  const cond=calcularCondicion(A);
  const trCond=document.createElement("tr");
  const tdEtiqueta=document.createElement("td");
  tdEtiqueta.colSpan=2;
  tdEtiqueta.innerHTML="<strong>Número de condición</strong>";
  const tdKInf=document.createElement("td");
  tdKInf.colSpan=2;
  tdKInf.textContent=`κ∞(A) = ${fmtSig(cond.kInf)}`;
  const tdK2=document.createElement("td");
  tdK2.colSpan=2;
  tdK2.textContent=`κ₂(A) = ${fmtSig(cond.k2)}`;
  const tdInterpretacion=document.createElement("td");
  tdInterpretacion.colSpan=3;
  tdInterpretacion.textContent=interpretarCondicion(cond.kInf);
  [tdEtiqueta,tdKInf,tdK2,tdInterpretacion].forEach(td=>trCond.appendChild(td));
  tbody.appendChild(trCond);
}
document.getElementById("resolver-sistemas").addEventListener("click",mostrarSistemas);

const escenariosDeterioro={
  normal:{d0:0.10,alpha:0.02,beta:0.001,umbral:0.50},
  estres:{d0:0.15,alpha:0.03,beta:0.0015,umbral:0.50},
  mal:{d0:0.499,alpha:0.0001,beta:0.000001,umbral:0.50}
};
const escenariosDetencion={
  normal:{v0:10,a:1.5},
  estres:{v0:14,a:1.0}
};
let ultimoDeterioro=null;
function cargarEscenario(){
  const e=escenariosDeterioro[document.getElementById("escenario-deterioro").value];
  document.getElementById("der-d0").value=e.d0;
  document.getElementById("der-alpha").value=e.alpha;
  document.getElementById("der-beta").value=e.beta;
  document.getElementById("der-umbral").value=e.umbral;
}
function calcularRaizDeterioro(d0,alpha,beta,umbral){
  const c=d0-umbral;
  let raiz;
  if(Math.abs(beta)<1e-15){
    if(Math.abs(alpha)<1e-15) return null;
    raiz=-c/alpha;
  }else{
    const disc=alpha*alpha-4*beta*c;
    if(disc<0) return null;
    const r1=(-alpha+Math.sqrt(disc))/(2*beta), r2=(-alpha-Math.sqrt(disc))/(2*beta);
    raiz=[r1,r2].filter(x=>x>=0).sort((x,y)=>x-y)[0];
  }
  return Number.isFinite(raiz)&&raiz>=0?raiz:null;
}
function calcularDeterioro(){
  const d0=numero("der-d0"), a=numero("der-alpha"), beta=numero("der-beta"), u=numero("der-umbral");
  const raiz=calcularRaizDeterioro(d0,a,beta,u);
  if(raiz===null){
    document.getElementById("resultado-deterioro").textContent="No existen raíces reales positivas para estos parámetros.";
    return;
  }
  const d=d0+a*raiz+beta*raiz*raiz;
  const deriv=a+2*beta*raiz;
  const nombre=document.getElementById("escenario-deterioro").selectedOptions[0].textContent;
  ultimoDeterioro={fecha:new Date().toLocaleString("es-BO"),escenario:nombre,d0,a,beta,u,raiz,deriv,d};
  document.getElementById("resultado-deterioro").innerHTML=
    `<strong>${nombre}</strong><br>Raíz positiva: t = ${fmt(raiz)} días<br>D(t) = ${fmt(d)}<br>Derivada en la raíz: D′(t) = ${fmt(deriv)}<br>Comprobación: D(t) − umbral = ${fmt(d-u)}.`;
  mostrarResultadosModulo2();
  mostrarInterpretacionModulo2();
}
function sensibilidadParametros(d0,alpha,beta,umbral){
  const t0=calcularRaizDeterioro(d0,alpha,beta,umbral);
  if(t0===null) return null;
  const epsAlpha=Math.max(0.001*Math.abs(alpha),1e-6);
  const epsBeta=Math.max(0.001*Math.abs(beta),1e-6);
  const tAlphaMas=calcularRaizDeterioro(d0,alpha+epsAlpha,beta,umbral);
  const tAlphaMenos=calcularRaizDeterioro(d0,alpha-epsAlpha,beta,umbral);
  const tBetaMas=calcularRaizDeterioro(d0,alpha,beta+epsBeta,umbral);
  const tBetaMenos=calcularRaizDeterioro(d0,alpha,beta-epsBeta,umbral);
  if([tAlphaMas,tAlphaMenos,tBetaMas,tBetaMenos].some(t=>t===null)) return null;
  return {
    d0,alpha,beta,umbral,t0,epsAlpha,epsBeta,
    dtdAlpha:(tAlphaMas-tAlphaMenos)/(2*epsAlpha),
    dtdBeta:(tBetaMas-tBetaMenos)/(2*epsBeta)
  };
}
function calcularSensibilidadDeterioro(){
  const d0=numero("der-d0"), alpha=numero("der-alpha"), beta=numero("der-beta"), umbral=numero("der-umbral");
  return sensibilidadParametros(d0,alpha,beta,umbral);
}
document.getElementById("analizar-sensibilidad").addEventListener("click",()=>{
  const cont=document.getElementById("resultado-sensibilidad");
  const s=calcularSensibilidadDeterioro();
  if(!s){
    cont.textContent="No se pudo calcular la sensibilidad: no existe una raíz positiva para los parámetros actuales o para alguna perturbación.";
    return;
  }
  const nombre=document.getElementById("escenario-deterioro").selectedOptions[0].textContent;
  let html=`<strong>Sensibilidad — ${nombre}</strong><br>Raíz base: t* = ${fmt(s.t0)} días<br>∂t*/∂α ≈ ${fmtSig(s.dtdAlpha,4)} días por unidad de α<br>∂t*/∂β ≈ ${fmtSig(s.dtdBeta,4)} días por unidad de β`;
  if(document.getElementById("escenario-deterioro").value==="mal"){
    const n=escenariosDeterioro.normal;
    const sn=sensibilidadParametros(n.d0,n.alpha,n.beta,n.umbral);
    if(sn){
      const ampAlpha=Math.abs(s.dtdAlpha/sn.dtdAlpha), ampBeta=Math.abs(s.dtdBeta/sn.dtdBeta);
      html+=`<br><strong>Amplificación frente a NORMAL:</strong> ∂t*/∂α ×${fmtSig(ampAlpha,3)}, ∂t*/∂β ×${fmtSig(ampBeta,3)}. La cercanía de D₀ al umbral hace que la raíz amplifique pequeños errores en α y β; es fragilidad numérica del modelo, no un riesgo físico adicional.`;
    }
  }
  html+=`<div class="nota">Sensibilidad calculada por diferencias centradas (ε = 0.1% del parámetro; εα = ${fmtSig(s.epsAlpha,3)}, εβ = ${fmtSig(s.epsBeta,3)}).</div>`;
  html+=`<div class="nota">Esta sensibilidad mide cómo errores en la estimación de α, β se propagan al tiempo de inspección calculado; es el número de condición del problema de raíces.</div>`;
  cont.innerHTML=html;
});
document.getElementById("escenario-deterioro").addEventListener("change",cargarEscenario);
document.getElementById("calcular-deterioro").addEventListener("click",calcularDeterioro);
cargarEscenario();

function revelarPanel(id,desplazar=false){
  const panel=document.getElementById(id);
  panel.classList.remove("oculto");
  if(desplazar) panel.scrollIntoView({behavior:"smooth",block:"start"});
}
function mostrarResultadosModulo1(){
  const x0=numero("det-x0"), v0=numero("det-v0"), a=numero("det-a");
  if(!(v0>=0)||!(a>0)) return;
  const t=v0/a, d=v0*v0/(2*a), xf=x0+d;
  document.getElementById("modulo-1-resultados-contenido").innerHTML=
    `<div class="tabla-contenedor"><table><thead><tr><th>Magnitud</th><th>Valor</th></tr></thead><tbody>
      <tr><td>Tiempo de detención</td><td>${fmt(t)} s</td></tr>
      <tr><td>Distancia de frenado</td><td>${fmt(d)} m</td></tr>
      <tr><td>Posición final</td><td>${fmt(xf)} m</td></tr>
    </tbody></table></div>`;
  revelarPanel("modulo-1-resultados",true);
}
function mostrarInterpretacionModulo1(){
  const x0=numero("det-x0"), v0=numero("det-v0"), a=numero("det-a");
  if(!(v0>=0)||!(a>0)) return;
  const t=v0/a, d=v0*v0/(2*a), xf=x0+d;
  const n=escenariosDetencion.normal, e=escenariosDetencion.estres;
  const dNormal=n.v0*n.v0/(2*n.a), dEstres=e.v0*e.v0/(2*e.a);
  const aumento=(dEstres/dNormal-1)*100;
  document.getElementById("modulo-1-interpretacion-contenido").innerHTML=
    `<p>Con los parámetros actuales (v₀ = ${v0} m/s, a = ${a} m/s²) la cabina se detiene en ${fmt(t)} s y recorre ${fmt(d)} m; la posición final es ${fmt(xf)} m.</p>
     <p>En condiciones NORMAL (v₀ = 10 m/s, a = 1.5 m/s²) la cabina frena en ${fmt(dNormal)} m. En ESTRÉS (v₀ = 14 m/s, a = 1.0 m/s²) la distancia aumenta a ${fmt(dEstres)} m, es decir, ${fmtSig(aumento,4)} % más: la distancia crece con el cuadrado de la velocidad y de forma inversa con la desaceleración.</p>
     <p>El caso MAL CONDICIONADO ilustra sensibilidad numérica, no riesgo físico real: una raíz con derivada pequeña amplifica perturbaciones aunque el modelo físico no cambie.</p>`;
  revelarPanel("modulo-1-interpretacion");
}
function mostrarResultadosModulo2(){
  if(!ultimoDeterioro) return;
  const d=ultimoDeterioro;
  document.getElementById("modulo-2-resultados-contenido").innerHTML=
    `<div class="tabla-contenedor"><table><thead><tr><th>Magnitud</th><th>Valor</th></tr></thead><tbody>
      <tr><td>Escenario ejecutado</td><td>${d.escenario}</td></tr>
      <tr><td>Raíz positiva t*</td><td>${fmt(d.raiz)} días</td></tr>
      <tr><td>D(t*)</td><td>${fmt(d.d)}</td></tr>
      <tr><td>D′(t*)</td><td>${fmt(d.deriv)}</td></tr>
      <tr><td>Residual D(t*) − umbral</td><td>${fmt(d.d-d.u)}</td></tr>
    </tbody></table></div>`;
  revelarPanel("modulo-2-resultados",true);
}
function mostrarInterpretacionModulo2(){
  if(!ultimoDeterioro) return;
  const d=ultimoDeterioro;
  const esMal=document.getElementById("escenario-deterioro").value==="mal";
  document.getElementById("modulo-2-interpretacion-contenido").innerHTML=
    `<p>El parámetro α controla la tasa inicial de deterioro y β su curvatura. Un α mayor adelanta la inspección; β modifica la raíz de forma no lineal, especialmente cuando D₀ está próximo al umbral.</p>
     <p>El valor t* = ${fmt(d.raiz)} días es válido dentro del modelo cuadrático y del intervalo simulado; extrapolar más allá supone que la tendencia se mantiene, lo cual debe justificarse con datos.</p>
     <p>La comprobación D(t*) − umbral = ${fmt(d.d-d.u)} confirma el residual de la raíz.${esMal?" En el escenario MAL CONDICIONADO, D₀ está muy cerca del umbral: la raíz es numéricamente frágil y pequeños cambios en α o β modifican mucho t*; esto no implica mayor riesgo físico real.":""}</p>`;
  revelarPanel("modulo-2-interpretacion");
}
function mostrarResultadosModulo3(){
  const cont=document.getElementById("modulo-3-resultados-contenido");
  if(!cont.innerHTML.trim()) cont.innerHTML=`<p class="nota">Implementación en Semana 2: RK2/RK4, integración numérica, energía.</p>`;
  revelarPanel("modulo-3-resultados");
}
function mostrarInterpretacionModulo3(){
  const cont=document.getElementById("modulo-3-interpretacion-contenido");
  if(!cont.innerHTML.trim()) cont.innerHTML=`<p class="nota">Análisis de amplitud, fase, energía (Semana 2).</p>`;
  revelarPanel("modulo-3-interpretacion");
}
function mostrarResultadosModulo4(){
  const cont=document.getElementById("modulo-4-resultados-contenido");
  if(!cont.innerHTML.trim()) cont.innerHTML=`<p class="nota">Implementación en Semana 2: Lagrange, Newton, Splines, error de reconstrucción.</p>`;
  revelarPanel("modulo-4-resultados");
}
function mostrarInterpretacionModulo4(){
  const cont=document.getElementById("modulo-4-interpretacion-contenido");
  if(!cont.innerHTML.trim()) cont.innerHTML=`<p class="nota">Análisis de error de reconstrucción, efecto de Runge (Semana 2).</p>`;
  revelarPanel("modulo-4-interpretacion");
}

document.getElementById("calcular-detencion").addEventListener("click",()=>{
  const x0=numero("det-x0"),v0=numero("det-v0"),a=numero("det-a");
  if(v0<0||a<=0){alert("La velocidad debe ser no negativa y la desaceleración positiva.");return;}
  const t=v0/a, d=v0*v0/(2*a), xf=x0+d;
  document.getElementById("resultado-detencion").innerHTML=`Tiempo de detención: ${fmt(t)} s<br>Distancia de frenado: ${fmt(d)} m<br>Posición final: ${fmt(xf)} m.`;
  mostrarResultadosModulo1();
  mostrarInterpretacionModulo1();
});

document.getElementById("calcular-error").addEventListener("click",()=>{
  const vr=numero("error-ref"), va=numero("error-aprox"), ea=Math.abs(vr-va);
  const er=vr===0?"No definido (referencia cero)":ea/Math.abs(vr);
  const ep=vr===0?"No definido":(ea/Math.abs(vr))*100;
  document.getElementById("resultado-error").innerHTML=`Error absoluto: ${fmt(ea)}<br>Error relativo: ${typeof er==="number"?fmt(er):er}<br>Error porcentual: ${typeof ep==="number"?fmt(ep)+" %":ep}`;
});

const nodos=[0,0.5,1,1.5,2], pruebas=[0.25,0.75,1.25,1.75];
const tablaSensores=document.getElementById("tabla-sensores");
[...nodos.map(t=>({t,uso:"Nodo conocido"})),...pruebas.map(t=>({t,uso:"Punto de prueba ocultado"}))]
.sort((a,b)=>a.t-b.t).forEach(p=>{
  const tr=document.createElement("tr");
  [p.t.toFixed(2),Math.sin(p.t).toFixed(8),p.uso].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
  tablaSensores.appendChild(tr);
});

document.getElementById("guardar-historial").addEventListener("click",()=>{
  if(!ultimoDeterioro){alert("Primero ejecuta un escenario de deterioro.");return;}
  const historial=JSON.parse(localStorage.getItem("simtele_historial")||"[]");
  historial.unshift(ultimoDeterioro);
  localStorage.setItem("simtele_historial",JSON.stringify(historial.slice(0,10)));
  mostrarHistorial();
});
function mostrarHistorial(){
  const h=JSON.parse(localStorage.getItem("simtele_historial")||"[]");
  document.getElementById("historial").textContent=h.length?h.map((v,i)=>`${i+1}. ${v.fecha} | ${v.escenario} | t=${v.raiz.toFixed(6)} días`).join(" | "):"Todavía no hay registros guardados.";
}
mostrarHistorial();

document.querySelectorAll(".tarjeta").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const modulo=btn.dataset.modulo;
    document.querySelectorAll(".tarjeta").forEach(x=>x.classList.remove("activa"));
    btn.classList.add("activa");
    document.querySelectorAll(".modulo").forEach(x=>x.classList.add("oculto"));
    document.getElementById("modulo-"+modulo).classList.remove("oculto");
    document.getElementById("modulo-"+modulo).scrollIntoView({behavior:"smooth",block:"start"});
    if(modulo==="oscilaciones"){ mostrarResultadosModulo3(); mostrarInterpretacionModulo3(); }
    if(modulo==="sensores"){ mostrarResultadosModulo4(); mostrarInterpretacionModulo4(); }
  });
});

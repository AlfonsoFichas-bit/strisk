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
}
document.getElementById("resolver-sistemas").addEventListener("click",mostrarSistemas);

const escenariosDeterioro={
  normal:{d0:0.10,alpha:0.02,beta:0.001,umbral:0.50},
  estres:{d0:0.15,alpha:0.03,beta:0.0015,umbral:0.50},
  mal:{d0:0.499,alpha:0.0001,beta:0.000001,umbral:0.50}
};
let ultimoDeterioro=null;
function cargarEscenario(){
  const e=escenariosDeterioro[document.getElementById("escenario-deterioro").value];
  document.getElementById("der-d0").value=e.d0;
  document.getElementById("der-alpha").value=e.alpha;
  document.getElementById("der-beta").value=e.beta;
  document.getElementById("der-umbral").value=e.umbral;
}
function calcularDeterioro(){
  const d0=numero("der-d0"), a=numero("der-alpha"), beta=numero("der-beta"), u=numero("der-umbral");
  const c=d0-u;
  let raiz;
  if(Math.abs(beta)<1e-15){
    if(Math.abs(a)<1e-15){alert("No existe una ecuación de raíz válida con estos parámetros.");return;}
    raiz=-c/a;
  }else{
    const disc=a*a-4*beta*c;
    if(disc<0){document.getElementById("resultado-deterioro").textContent="No existen raíces reales para estos parámetros.";return;}
    const r1=(-a+Math.sqrt(disc))/(2*beta), r2=(-a-Math.sqrt(disc))/(2*beta);
    raiz=[r1,r2].filter(x=>x>=0).sort((x,y)=>x-y)[0];
  }
  if(!Number.isFinite(raiz)){alert("No se encontró una raíz positiva.");return;}
  const d=d0+a*raiz+beta*raiz*raiz;
  const deriv=a+2*beta*raiz;
  const nombre=document.getElementById("escenario-deterioro").selectedOptions[0].textContent;
  ultimoDeterioro={fecha:new Date().toLocaleString("es-BO"),escenario:nombre,d0,a,beta,u,raiz,deriv,d};
  document.getElementById("resultado-deterioro").innerHTML=
    `<strong>${nombre}</strong><br>Raíz positiva: t = ${fmt(raiz)} días<br>D(t) = ${fmt(d)}<br>Derivada en la raíz: D′(t) = ${fmt(deriv)}<br>Comprobación: D(t) − umbral = ${fmt(d-u)}.`;
}
document.getElementById("escenario-deterioro").addEventListener("change",cargarEscenario);
document.getElementById("calcular-deterioro").addEventListener("click",calcularDeterioro);
cargarEscenario();

document.getElementById("calcular-detencion").addEventListener("click",()=>{
  const x0=numero("det-x0"),v0=numero("det-v0"),a=numero("det-a");
  if(v0<0||a<=0){alert("La velocidad debe ser no negativa y la desaceleración positiva.");return;}
  const t=v0/a, d=v0*v0/(2*a), xf=x0+d;
  document.getElementById("resultado-detencion").innerHTML=`Tiempo de detención: ${fmt(t)} s<br>Distancia de frenado: ${fmt(d)} m<br>Posición final: ${fmt(xf)} m.`;
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
    document.querySelectorAll(".tarjeta").forEach(x=>x.classList.remove("activa"));
    btn.classList.add("activa");
    document.querySelectorAll(".modulo").forEach(x=>x.classList.add("oculto"));
    document.getElementById("modulo-"+btn.dataset.modulo).classList.remove("oculto");
    document.getElementById("modulo-"+btn.dataset.modulo).scrollIntoView({behavior:"smooth",block:"start"});
  });
});

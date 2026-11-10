// TORRE FUERTE · Operación V1 · Supabase Auth + RLS
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
const $ = id => document.getElementById(id);
// Identidad interna para Supabase Auth. El mecánico nunca debe introducir un correo.
// Esta dirección es un alias técnico, NO una cuenta de correo ni una clave secreta.
const STAFF_USERNAME = "mecanicolider";
const STAFF_AUTH_EMAIL = "mecanicolider@torre-fuerte.example";
const TOUR_SEEN_KEY = "tf-portal-recorrido-v1";
const cfg = window.TF_CONFIG || {};
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl || "") &&
  typeof cfg.supabasePublishableKey === "string" && cfg.supabasePublishableKey.length > 25;
const db = configured ? createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null;
let records = [], grid = null, calendar = null, selected = null, serviceLines = [];
let currentUser = null;
const states = {pendiente:"Pendiente",confirmada:"Confirmada",en_reparacion:"En reparación",lista:"Lista",entregada:"Entregada",cancelada:"Cancelada"};
const currency = value => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(value)||0);
const formatDate = input => {
  const p=String(input||"").slice(0,10).split("-");
  return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:(input||"—");
};
const value = (obj,field) => String(obj[field]??"");
function message(content,bad=false){
  $("statusMessage").textContent=content;
  $("statusMessage").className=content?"alert"+(bad?" err":""):"";
}
function textRow(parent,title,content){
  const p=document.createElement("p"),strong=document.createElement("strong");
  strong.textContent=title+": ";p.append(strong,document.createTextNode(String(content??"—")));parent.append(p);
}
function todayLocal(){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const data=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return data.year+"-"+data.month+"-"+data.day;
}
async function hasAccess(){
  if(!db)return false;
  const {data,error}=await db.auth.getUser();
  if(error||!data.user)return false;
  const {data:role,error:roleError}=await db.from("tf_staff").select("user_id").eq("user_id",data.user.id).maybeSingle();
  if(roleError||!role){
    $("loginMessage").textContent="Esta cuenta no tiene acceso al taller.";
    await db.auth.signOut();return false;
  }
  currentUser=data.user;return true;
}
async function enter(){
  if(!(await hasAccess()))return false;
  $("gate").hidden=true;$("workspace").hidden=false;$("signout").hidden=false;
  $("restartTour").hidden=false;$("changePass").hidden=false;
  await loadRecords();
  if(!localStorage.getItem(TOUR_SEEN_KEY)){
    // Dar tiempo a la tabla para que complete el primer render.
    setTimeout(()=>startWelcomeTour(true),650);
  }
  return true;
}
function leave(){
  currentUser=null;records=[];selected=null;$("gate").hidden=false;
  $("workspace").hidden=true;$("signout").hidden=true;
  $("restartTour").hidden=true;$("changePass").hidden=true;
}
if(!db){$("setupNotice").hidden=false;$("loginForm").querySelector("button").disabled=true;}
else {try{await enter();}catch{$("loginMessage").textContent="No se pudo conectar. Intenta iniciar sesión.";}}
$("loginForm").addEventListener("submit",async event=>{
  event.preventDefault();if(!db)return;
  const submit=$("loginForm").querySelector("button");submit.disabled=true;
  $("loginMessage").textContent="";
  try{
    const username=$("username").value.trim().toLocaleLowerCase("es-MX");
    if(username!==STAFF_USERNAME)throw Error("Usuario no válido.");
    const {error}=await db.auth.signInWithPassword({email:STAFF_AUTH_EMAIL,password:$("password").value});
    if(error)throw error;
    if(!(await enter()))$("loginMessage").textContent||="No autorizado para este taller.";
  }catch{$("loginMessage").textContent="No se pudo iniciar sesión. Revisa tus datos y conexión.";}
  finally{submit.disabled=false;}
});
$("signout").addEventListener("click",async()=>{if(db)await db.auth.signOut();leave();});

function startWelcomeTour(auto=false){
  const driverFactory=window.driver?.js?.driver;
  if(typeof driverFactory!=="function"){
    if(!auto)message("La guía interactiva no pudo cargarse. Revisa la conexión a internet.",true);
    return;
  }
  // Todas las referencias de la guía apuntan a controles visibles, aun con cero solicitudes.
  document.querySelector('[data-tab="orders"]')?.click();
  const tour=driverFactory({
    showProgress:true,animate:true,allowClose:true,
    nextBtnText:"Siguiente",prevBtnText:"Atrás",doneBtnText:"Terminar",
    progressText:"Paso {{current}} de {{total}}",
    steps:[
      {element:".workspacehead",popover:{title:"Bienvenido a tu taller",description:"Esta es tu pantalla principal. Aquí puedes revisar lo importante sin entrar a Excel."}},
      {element:"#newOrder",popover:{title:"Crear una orden",description:"Usa este botón cuando una moto llegue directamente al taller. Ingresa cliente, moto y servicio; el folio se crea automáticamente."}},
      {element:"#activityRings",popover:{title:"Anillos del taller",description:"Muestran órdenes pendientes, en reparación y listas. Los números vienen de las órdenes registradas."}},
      {element:'[data-tab="orders"]',popover:{title:"Todas tus comandas",description:"Abre la tabla de órdenes para ver datos, modificar estados y generar tickets."}},
      {element:"#search",popover:{title:"Encontrar un cliente",description:"Busca por folio, nombre, teléfono o motocicleta. También puedes filtrar por fecha y estado."}},
      {element:"#exportCsv",popover:{title:"Guardar una lista",description:"Descarga un archivo compatible con Excel. Solo exporta las órdenes visibles según los filtros."}},
      {element:'[data-tab="calendar"]',popover:{title:"Tu calendario",description:"Cambia a Calendario para consultar las fechas solicitadas. Recuerda confirmar las citas antes de recibir la moto."}},
      {element:"#refresh",popover:{title:"Actualizar información",description:"Pulsa aquí para cargar nuevas citas. En el detalle de una orden puedes imprimir la comanda y crear la nota PDF."}},
      {element:"#restartTour",popover:{title:"Vuelve cuando quieras",description:"Con este botón puedes repetir la guía todas las veces que necesites. ¡Listo!"}}
    ]
  });
  try{tour.drive();localStorage.setItem(TOUR_SEEN_KEY,"1");}
  catch{if(!auto)message("No fue posible iniciar la guía.",true);}
}
$("restartTour").addEventListener("click",()=>startWelcomeTour());
$("changePass").addEventListener("click",()=>{
  $("changePasswordForm").reset();$("passwordFeedback").textContent="";
  $("passwordDialog").showModal();
});
$("changePasswordForm").addEventListener("submit",async event=>{
  event.preventDefault();if(!db||!currentUser)return;
  const current=$("currentPassword").value;
  const next=$("newPassword").value;
  const feedback=$("passwordFeedback");
  feedback.textContent="";
  if(next.length<12||/^\d+$/.test(next)){
    feedback.textContent="Usa al menos 12 caracteres y combina palabras, letras o símbolos. Evita claves solo numéricas.";
    return;
  }
  if(next!==$("confirmNewPassword").value){feedback.textContent="La confirmación no coincide.";return;}
  if(current===next){feedback.textContent="La nueva contraseña debe ser distinta a la actual.";return;}
  const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
  try{
    // Revalidar la clave vigente antes de intentar cambiarla.
    const {error:verifyError}=await db.auth.signInWithPassword({email:STAFF_AUTH_EMAIL,password:current});
    if(verifyError)throw Error("La contraseña actual es incorrecta.");
    const {error}=await db.auth.updateUser({password:next});
    if(error)throw Error("Supabase no permitió cambiar la contraseña. Inténtalo de nuevo.");
    await db.auth.signOut();
    $("passwordDialog").close();leave();
    $("loginMessage").textContent="Contraseña actualizada. Vuelve a entrar con tu nueva clave.";
    $("password").value="";
  }catch(error){feedback.textContent=error?.message||"No se pudo guardar la contraseña.";}
  finally{button.disabled=false;}
});

function renderActivity(){
  // Proporción por estado entre órdenes activas, no objetivos ni progreso ficticio.
  const pending=records.filter(r=>r.status==="pendiente").length;
  const confirmed=records.filter(r=>r.status==="confirmada").length;
  const working=records.filter(r=>r.status==="en_reparacion").length;
  const ready=records.filter(r=>r.status==="lista").length;
  const active=pending+confirmed+working+ready;
  $("activityTotal").textContent=String(active);
  $("kpiPending").textContent=String(pending);
  $("kpiWorking").textContent=String(working);
  $("kpiReady").textContent=String(ready);
  $("kpiConfirmed").textContent=String(confirmed);
  const svg=$("activityRings");
  svg.querySelectorAll(".activity-arc").forEach(el=>el.remove());
  const svgNS="http://www.w3.org/2000/svg";
  const rings=[
    {count:pending,r:77,color:"#ee5960"},
    {count:working,r:57,color:"#f4b54a"},
    {count:ready,r:37,color:"#37b88c"}
  ];
  const before=svg.querySelector("text");
  for(const ring of rings){
    const circumference=2*Math.PI*ring.r;
    const ratio=active>0?ring.count/active:0;
    const arc=document.createElementNS(svgNS,"circle");
    arc.setAttribute("class","activity-arc");
    arc.setAttribute("cx","105");arc.setAttribute("cy","105");
    arc.setAttribute("r",String(ring.r));
    arc.setAttribute("fill","none");arc.setAttribute("stroke",ring.color);
    arc.setAttribute("stroke-width","14");arc.setAttribute("stroke-linecap","round");
    arc.setAttribute("stroke-dasharray",String(circumference*ratio)+" "+String(circumference));
    arc.setAttribute("transform","rotate(-90 105 105)");
    if(ring.count===0)arc.setAttribute("opacity","0");
    svg.insertBefore(arc,before);
  }
  svg.setAttribute("aria-label",active===0
    ?"No hay órdenes activas."
    :active+" órdenes activas: "+pending+" pendientes, "+confirmed+" confirmadas, "+
      working+" en reparación y "+ready+" listas para entregar.");
}

async function loadRecords(){
  const {data,error}=await db.from("tf_requests").select("*").order("created_at",{ascending:false}).limit(1000);
  if(error){message("No se pudieron consultar las órdenes. Verifica la conexión y los permisos.",true);return;}
  records=data||[];
  renderActivity();
  renderGrid();renderCalendar();
  message(records.length+" órdenes y solicitudes cargadas.");
}
function filterRow(row){
  const term=$("search").value.trim().toLocaleLowerCase("es");
  const matches=!term||["folio","client_name","client_phone","motorcycle","service"].some(k=>value(row,k).toLocaleLowerCase("es").includes(term));
  return matches&&(!$("filterStatus").value||row.status===$("filterStatus").value)&&
    (!$("filterDate").value||row.requested_date===$("filterDate").value);
}
function renderGrid(){
  if(!window.Tabulator){message("No pudo cargarse Tabulator. Verifica internet.",true);return;}
  if(!grid){
    grid=new Tabulator("#ordersTable",{
      data:records,layout:"fitColumns",responsiveLayout:"collapse",pagination:true,paginationSize:10,
      placeholder:"No hay solicitudes todavía.",columns:[
        {title:"Folio",field:"folio",minWidth:110,width:120},
        {title:"Cliente",field:"client_name",minWidth:155},
        {title:"Motocicleta",field:"motorcycle",minWidth:130},
        {title:"Fecha",field:"requested_date",width:125,formatter:cell=>formatDate(cell.getValue())},
        {title:"Estado",field:"status",width:135,formatter:cell=>states[cell.getValue()]||cell.getValue()},
        {title:"",width:86,headerSort:false,formatter:()=>{
          const b=document.createElement("button");b.textContent="Abrir";b.type="button";return b;
        },cellClick:(_,cell)=>openOrder(cell.getRow().getData().id)}
      ]
    });
  }else grid.replaceData(records);
  grid.setFilter(filterRow);
}
function renderCalendar(){
  if(!window.FullCalendar){message("No pudo cargarse FullCalendar. Verifica internet.",true);return;}
  const events=records.filter(r=>r.status!=="cancelada").map(r=>({
    id:r.id,title:r.client_name+" · "+r.service+" · "+r.requested_slot,
    start:r.requested_date,allDay:true,
    backgroundColor:r.status==="confirmada"?"#27846a":r.status==="pendiente"?"#c79a41":"#626b73",
    borderColor:"transparent"
  }));
  if(!calendar){
    calendar=new FullCalendar.Calendar($("calendar"),{
      initialView:"dayGridMonth",locale:"es",firstDay:1,height:"auto",
      headerToolbar:{left:"prev,next today",center:"title",right:"dayGridMonth,listWeek"},
      eventClick:e=>openOrder(e.event.id),events
    });
    calendar.render();
  } else {calendar.removeAllEvents();calendar.addEventSource(events);}
}
document.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll("[data-tab]").forEach(b=>{
    b.classList.toggle("active",b===button);b.setAttribute("aria-selected",String(b===button));
  });
  $("ordersSection").hidden=button.dataset.tab!=="orders";
  $("calendarSection").hidden=button.dataset.tab!=="calendar";
  if(button.dataset.tab==="calendar")calendar?.updateSize();
}));
["search","filterStatus","filterDate"].forEach(id=>$(id).addEventListener("input",()=>grid?.setFilter(filterRow)));
$("resetFilters").addEventListener("click",()=>{
  ["search","filterStatus","filterDate"].forEach(id=>$(id).value="");
  grid?.setFilter(filterRow);
});
$("refresh").addEventListener("click",loadRecords);
function csvCell(input){
  const val=String(input??"");
  const neutralized=/^[\s]*[=+\-@\t\r]/.test(val)?"'"+val:val;
  return '"'+neutralized.replace(/"/g,'""')+'"';
}
$("exportCsv").addEventListener("click",()=>{
  const keys=["folio","client_name","client_phone","motorcycle","motorcycle_year","service","requested_date","requested_slot","details","status","created_at"];
  const headings=["Folio","Cliente","Teléfono","Motocicleta","Año","Servicio","Fecha","Horario","Observaciones","Estado","Registro"];
  const content=[headings.map(csvCell).join(","),...records.filter(filterRow).map(record=>keys.map(k=>csvCell(record[k])).join(","))].join("\r\n");
  const file=new Blob(["\ufeff"+content],{type:"text/csv;charset=utf-8;"});
  const link=document.createElement("a");link.href=URL.createObjectURL(file);link.download="torre-fuerte-comandas.csv";
  link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
$("newOrder").addEventListener("click",()=>{
  $("newForm").reset();$("newForm").elements.namedItem("requested_date").value=todayLocal();$("newDialog").showModal();
});
$("newForm").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("saveNew");btn.disabled=true;
  const fields=Object.fromEntries(new FormData(e.currentTarget).entries());
  const phone=String(fields.client_phone||"").replace(/\D/g,"");
  if(phone.length<10||phone.length>15){message("El teléfono debe tener entre 10 y 15 dígitos.",true);btn.disabled=false;return;}
  const payload={...fields,client_phone:phone,source:"manual",motorcycle_year:fields.motorcycle_year?Number(fields.motorcycle_year):null};
  try{
    const {data,error}=await db.from("tf_requests").insert(payload).select("id,folio").single();
    if(error)throw error;
    $("newDialog").close();await loadRecords();message("Orden "+data.folio+" guardada.");await openOrder(data.id);
  }catch{message("No se pudo guardar la orden. Revisa los datos o la conexión.",true);}
  finally{btn.disabled=false;}
});

const ORDER_TOUR_SEEN_KEY = "tf-orden-recorrido-v1";
const orderTourSteps = [
  {id:"orderInfo",title:"Datos de la orden",text:"Aquí aparecen el folio, nombre del cliente, motocicleta, servicio y cita solicitada. Compruébalos antes de continuar."},
  {id:"orderStatus",title:"Estado de la moto",text:"Selecciona si está pendiente, en reparación, lista o entregada. El cambio no se guarda hasta pulsar el botón siguiente."},
  {id:"internalNotes",title:"Anota los avances",text:"Escribe aquí lo que encontraste al revisar la moto o las indicaciones para el trabajo."},
  {id:"saveOrder",title:"Guardar cambios",text:"Pulsa este botón cuando hayas cambiado el estado o las notas internas de la orden."},
  {id:"addItem",title:"Agregar un trabajo o pieza",text:"Crea un renglón para escribir cada trabajo, refacción, cantidad y precio. El total se calcula automáticamente."},
  {id:"saveItems",title:"Guardar el desglose",text:"Guarda los conceptos de mano de obra y refacciones. Hazlo antes de descargar el PDF."},
  {id:"printOrder",title:"Imprimir comanda",text:"Abre la impresión del ticket blanco con el folio y datos de la solicitud. Elige la impresora disponible en tu teléfono."},
  {id:"pdfDownload",title:"Descargar nota PDF",text:"Genera la nota de servicio para conservarla o enviársela al cliente más tarde. No es una factura fiscal."},
  {id:"pdfShare",title:"Compartir con el cliente",text:"En teléfonos compatibles puedes compartir el PDF directamente a WhatsApp. Si no, descárgalo y adjúntalo en el chat."}
];
let orderGuideIndex = 0;
function hideOrderGuide(){
  $("orderTourPanel").hidden=true;
  document.querySelectorAll(".guide-highlight").forEach(el=>el.classList.remove("guide-highlight"));
}
function renderOrderGuide(){
  const step=orderTourSteps[orderGuideIndex];
  if(!step)return;
  $("orderTourPanel").hidden=false;
  $("orderTourTitle").textContent=step.title;
  $("orderTourText").textContent=step.text;
  $("orderTourCounter").textContent=(orderGuideIndex+1)+" / "+orderTourSteps.length;
  $("orderTourPrev").disabled=orderGuideIndex===0;
  $("orderTourNext").textContent=orderGuideIndex===orderTourSteps.length-1?"Terminar":"Siguiente";
  document.querySelectorAll(".guide-highlight").forEach(el=>el.classList.remove("guide-highlight"));
  const highlight=$(step.id);
  if(highlight){
    highlight.classList.add("guide-highlight");
    highlight.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
  }
}
function startOrderGuide(auto=false){
  if(!$("orderDialog").open)return;
  orderGuideIndex=0;
  renderOrderGuide();
  if(auto)localStorage.setItem(ORDER_TOUR_SEEN_KEY,"1");
}
$("orderTutorialButton").addEventListener("click",()=>startOrderGuide());
$("orderTourNext").addEventListener("click",()=>{
  if(orderGuideIndex===orderTourSteps.length-1){hideOrderGuide();return;}
  orderGuideIndex++;renderOrderGuide();
});
$("orderTourPrev").addEventListener("click",()=>{
  orderGuideIndex=Math.max(0,orderGuideIndex-1);renderOrderGuide();
});
$("orderTourClose").addEventListener("click",hideOrderGuide);
$("orderDialog").addEventListener("close",hideOrderGuide);

async function openOrder(id){
  selected=records.find(record=>record.id===id);
  if(!selected){message("La orden ya no está disponible; actualiza el panel.",true);return;}
  $("orderTitle").textContent=selected.folio;
  const container=$("orderInfo");container.replaceChildren();
  textRow(container,"Cliente",selected.client_name);
  textRow(container,"Teléfono",selected.client_phone);
  textRow(container,"Motocicleta",selected.motorcycle+(selected.motorcycle_year?" · "+selected.motorcycle_year:""));
  textRow(container,"Servicio",selected.service);
  textRow(container,"Fecha solicitada",formatDate(selected.requested_date)+" · "+selected.requested_slot);
  if(selected.details)textRow(container,"Observaciones",selected.details);
  $("orderStatus").value=selected.status;
  $("internalNotes").value=selected.internal_notes||"";
  $("items").replaceChildren();
  hideOrderGuide();
  $("orderDialog").showModal();
  const {data,error}=await db.from("tf_service_lines").select("*").eq("request_id",id).order("created_at");
  if(error){message("No se pudo leer el desglose de servicio.",true);return;}
  serviceLines=(data||[]).map(line=>({id:line.id,kind:line.kind,description:line.description,quantity:Number(line.quantity),unit_price:Number(line.unit_price)}));
  renderLines();
  if(!localStorage.getItem(ORDER_TOUR_SEEN_KEY)) setTimeout(()=>startOrderGuide(true),350);
}
$("saveOrder").addEventListener("click",async()=>{
  if(!selected)return;
  const {data,error}=await db.from("tf_requests").update({status:$("orderStatus").value,internal_notes:$("internalNotes").value})
    .eq("id",selected.id).select("*").single();
  if(error){message("No se pudo actualizar la orden.",true);return;}
  selected=data;await loadRecords();message("Cambios guardados en "+selected.folio+".");
});
function lineElement(line,i){
  const div=document.createElement("div");div.className="itemrow";
  const make=(title,el)=>{
    const label=document.createElement("label");label.textContent=title;label.appendChild(el);div.appendChild(label);
  };
  const type=document.createElement("select");
  [["mano_obra","Mano de obra"],["refaccion","Refacción"]].forEach(([v,t])=>{
    const o=document.createElement("option");o.value=v;o.textContent=t;type.appendChild(o);
  });type.value=line.kind;
  type.addEventListener("change",()=>{serviceLines[i].kind=type.value;});
  make("Tipo",type);
  const description=document.createElement("input");description.placeholder="Descripción";description.maxLength=200;description.value=line.description;
  description.addEventListener("input",()=>{serviceLines[i].description=description.value;});make("Concepto",description);
  const quantity=document.createElement("input");quantity.type="number";quantity.step="0.01";quantity.min="0.01";quantity.value=line.quantity;
  quantity.addEventListener("input",()=>{serviceLines[i].quantity=Number(quantity.value);updateTotal();});make("Cantidad",quantity);
  const price=document.createElement("input");price.type="number";price.min="0";price.step="0.01";price.value=line.unit_price;
  price.addEventListener("input",()=>{serviceLines[i].unit_price=Number(price.value);updateTotal();});make("Precio",price);
  const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.setAttribute("aria-label","Quitar concepto");
  remove.addEventListener("click",()=>{serviceLines.splice(i,1);renderLines();});div.appendChild(remove);
  return div;
}
function renderLines(){
  const holder=$("items");holder.replaceChildren();
  serviceLines.forEach((line,i)=>holder.append(lineElement(line,i)));
  updateTotal();
}
function updateTotal(){
  const total=serviceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.quantity)||0)*Math.max(0,Number(line.unit_price)||0),0);
  $("total").textContent=currency(total);
}
$("addItem").addEventListener("click",()=>{
  serviceLines.push({kind:"mano_obra",description:"",quantity:1,unit_price:0});renderLines();
});
$("saveItems").addEventListener("click",saveLines);
async function saveLines(){
  if(!selected)return false;
  const btn=$("saveItems");
  const valid=serviceLines.every(line=>line.description.trim().length>=2&&line.description.length<=200&&
    Number.isFinite(line.quantity)&&line.quantity>0&&Number.isFinite(line.unit_price)&&line.unit_price>=0);
  if(!valid){message("Completa las descripciones, cantidades y precios del desglose.",true);return false;}
  btn.disabled=true;
  try{
    const {data:existing,error:queryError}=await db.from("tf_service_lines").select("id").eq("request_id",selected.id);
    if(queryError)throw queryError;
    const persisted=new Set(serviceLines.filter(line=>line.id).map(line=>line.id));
    const toDelete=(existing||[]).map(line=>line.id).filter(id=>!persisted.has(id));
    if(toDelete.length){
      const {error}=await db.from("tf_service_lines").delete().in("id",toDelete).eq("request_id",selected.id);
      if(error)throw error;
    }
    for(const line of serviceLines){
      const payload={request_id:selected.id,kind:line.kind,description:line.description.trim(),quantity:line.quantity,unit_price:line.unit_price};
      const result=line.id
        ?await db.from("tf_service_lines").update(payload).eq("id",line.id).eq("request_id",selected.id).select("id").single()
        :await db.from("tf_service_lines").insert(payload).select("id").single();
      if(result.error)throw result.error;
      line.id=result.data.id;
    }
    message("Desglose guardado.");return true;
  }catch{message("No se guardó todo el desglose. Revisa la conexión antes de generar la nota.",true);return false;}
  finally{btn.disabled=false;}
}
function generateTicket(){
  if(!selected)return;
  const div=$("printReceipt");div.replaceChildren();
  const add=(tag,txt,cl="")=>{
    const el=document.createElement(tag);el.textContent=txt;
    if(cl)el.className=cl;div.append(el);
  };
  add("h1","TORRE FUERTE");add("p","TALLER DE MOTOCICLETAS · PUERTO ESCONDIDO","center");
  add("hr","");add("p","COMANDA DE SOLICITUD","center");
  add("p","FOLIO: "+selected.folio);
  add("p","Registrada: "+new Date(selected.created_at).toLocaleString("es-MX",{timeZone:"America/Mexico_City"}));
  add("hr","");
  add("p","CLIENTE: "+selected.client_name);add("p","TELÉFONO: "+selected.client_phone);
  add("p","MOTO: "+selected.motorcycle+(selected.motorcycle_year?" ("+selected.motorcycle_year+")":""));
  add("p","SERVICIO: "+selected.service);
  add("p","FECHA SOLICITADA: "+formatDate(selected.requested_date));
  add("p","HORARIO SOLICITADO: "+selected.requested_slot);
  if(selected.details)add("p","OBSERVACIONES: "+selected.details);
  add("hr","");add("p","ESTADO: "+(states[selected.status]||selected.status));
  add("p","La fecha no queda confirmada hasta que el taller la acepte.","center");
}
$("printOrder").addEventListener("click",()=>{
  if(!selected)return;generateTicket();
  window.print();
});
async function buildPdfBlob(){
  if(!selected)throw new Error("Selecciona una orden.");
  if(!window.pdfMake)throw new Error("No pudo cargarse pdfmake. Revisa internet.");
  const ok=await saveLines();
  if(!ok)throw new Error("Primero guarda el desglose.");
  const body=[
    [{text:"Concepto",bold:true},{text:"Tipo",bold:true},{text:"Cant.",bold:true,alignment:"right"},{text:"P. unit.",bold:true,alignment:"right"},{text:"Subtotal",bold:true,alignment:"right"}],
    ...serviceLines.map(item=>[
      item.description,item.kind==="refaccion"?"Refacción":"Mano de obra",
      {text:String(item.quantity),alignment:"right"},
      {text:currency(item.unit_price),alignment:"right"},
      {text:currency(item.quantity*item.unit_price),alignment:"right"}
    ])
  ];
  const total=serviceLines.reduce((sum,item)=>sum+item.quantity*item.unit_price,0);
  const doc={
    pageSize:"A4",pageMargins:[36,46,36,45],
    content:[
      {text:"TORRE FUERTE",bold:true,fontSize:21,color:"#191c21"},
      {text:"Taller de motocicletas · Puerto Escondido, Oaxaca",fontSize:10,color:"#646c74",margin:[0,0,0,20]},
      {text:"NOTA DE SERVICIO  ·  "+selected.folio,bold:true,fontSize:14,margin:[0,0,0,16]},
      {text:"Cliente: "+selected.client_name+"\nTeléfono: "+selected.client_phone+
        "\nMotocicleta: "+selected.motorcycle+(selected.motorcycle_year?" · "+selected.motorcycle_year:"")+
        "\nServicio solicitado: "+selected.service+
        "\nFecha solicitada: "+formatDate(selected.requested_date)+" · "+selected.requested_slot,margin:[0,0,0,17]},
      {text:"DESGLOSE DE TRABAJOS Y REFACCIONES",bold:true,fontSize:10,margin:[0,0,0,7]},
      {table:{headerRows:1,widths:["*","auto",38,66,74],body},layout:"lightHorizontalLines"},
      {text:"TOTAL: "+currency(total),alignment:"right",bold:true,fontSize:16,margin:[0,18,0,18]},
      {text:"Observaciones: "+(selected.internal_notes||selected.details||"Sin observaciones"),fontSize:10},
      {text:"Documento informativo de servicio. No sustituye una factura fiscal.",fontSize:9,color:"#626b72",margin:[0,30,0,0]}
    ],defaultStyle:{fontSize:10}
  };
  return await new Promise((resolve,reject)=>{
    try{window.pdfMake.createPdf(doc).getBlob(blob=>resolve(blob));}catch(err){reject(err);}
  });
}
$("pdfDownload").addEventListener("click",async()=>{
  try{
    const blob=await buildPdfBlob();
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=selected.folio+"-nota-servicio.pdf";
    a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);message("Nota PDF generada.");
  }catch(err){message(err.message||"No se pudo crear el PDF.",true);}
});
$("pdfShare").addEventListener("click",async()=>{
  try{
    const blob=await buildPdfBlob();const file=new File([blob],selected.folio+"-nota-servicio.pdf",{type:"application/pdf"});
    if(navigator.canShare?.({files:[file]})&&navigator.share){
      await navigator.share({files:[file],title:"Torre Fuerte · "+selected.folio,text:"Nota de servicio "+selected.folio});
    }else{
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=file.name;
      a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
      message("PDF descargado. Ahora adjúntalo manualmente en WhatsApp.");
    }
  }catch(err){
    if(err?.name!=="AbortError")message("No fue posible compartir el PDF; prueba Descargar PDF.",true);
  }
});

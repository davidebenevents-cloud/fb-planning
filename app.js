
const monthNames = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
let currentDate = new Date();

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function generateWeekDates() {
  const start = getStartOfWeek(currentDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function updateWeekLabel() {
  const week = generateWeekDates();
  const first = week[0];
  const last = week[6];

  document.querySelector("#currentWeekLabel").textContent =
    `${first.getDate()} ${monthNames[first.getMonth()]} ${first.getFullYear()} - ${last.getDate()} ${monthNames[last.getMonth()]} ${last.getFullYear()}`;
}

function saveResources() {
  localStorage.setItem("planningResources", JSON.stringify(resources));
}

function loadResources() {
  const stored = localStorage.getItem("planningResources");
  if (stored) {
    const parsed = JSON.parse(stored);
    resources.length = 0;
    parsed.forEach(item => resources.push(item));
  }
}

function renderResources() {
  const container = document.querySelector("#resourceList");
  if (!container) return;
  const search = (document.querySelector("#resourceSearch")?.value || "").toLowerCase();
  const deptFilter = document.querySelector("#resourceDepartmentFilter")?.value || "";
  container.innerHTML = "";

  resources.forEach((resource, index) => {
    if (search && !resource.name.toLowerCase().includes(search)) return;
    if (deptFilter && resource.department !== deptFilter) return;

    const element = document.createElement("div");
    element.className = "resource-card";
    element.innerHTML = `
      <div class="resource-card-left">
        <div class="resource-color" style="background:${resource.color || "#0f766e"}"></div>
        <div class="resource-meta">
          <strong>${resource.name}</strong>
          <span>${resource.position} · ${resource.department || ""}</span>
        </div>
      </div>
      <div>
        <button class="ghost-button compact" onclick="editResource(${index})">Modifica</button>
        <button class="ghost-button compact" onclick="deleteResource(${index})">Elimina</button>
      </div>`;
    container.appendChild(element);
  });
}

function deleteResource(index) {
  resources.splice(index, 1);
  saveResources();
  renderResources();
  render();
}
const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const departments = ["Sala Bar", "Cucina", "Colazioni"];
const positions = [
"Head Waiter",
"Breakfast Coordinator",
"Commis di sala",
"Chef de Rang",
"Add.tta prenotaz. acc.za",
"Senior Waiter",
"Coordinatore sala/bar",
"Restaurant Supervisor",
"Bar Manager",
"Bartender",
"Waiter",
"Add.tto serv. tavoli",
"Cameriere di sala",
"Add.tta al buffet e sala",
"Add.tta al banco bar e sala",
"Capo cuoco",
"Sous Chef",
"Aiuto capo cuoco",
"Capo cuoco partita",
"Cuoco",
"Commis di cucina",
"Add.tta di cucina",
"Lavapiatti",
"Barback"
];
const properties = ["Hotel Artemide S.r.l."];
const maxWeeklyHours = 44;
const coverageRequirements = [];
localStorage.setItem("planningShifts", localStorage.getItem("planningShifts")||"[]");

const resources = [];

const templates = { /* demo disabled */
  standard: [
    ["", "Lun", "Colazione", "Maitre", "06:30", "14:30"],
    ["", "Lun", "Pranzo", "Chef", "10:00", "16:00"],
    ["", "Lun", "Cena", "Cameriere", "17:30", "23:30"],
    ["", "Mar", "Bar", "Barman", "16:00", "23:00"],
    ["", "Mer", "Colazione", "Commis", "06:00", "13:00"],
    ["", "Gio", "Pranzo", "Runner", "11:00", "16:00"],
    ["", "Ven", "Cena", "Maitre", "16:00", "23:30"],
    ["", "Sab", "Cena", "Chef", "15:00", "23:00"],
    ["", "Dom", "Colazione", "Cameriere", "06:30", "14:00"],
    ["", "Dom", "Banqueting", "Barman", "12:00", "22:00"],
  ],
  banquet: [
    ["", "Ven", "Banqueting", "Maitre", "12:00", "23:30"],
    ["", "Ven", "Banqueting", "Chef", "11:00", "23:00"],
    ["", "Ven", "Banqueting", "Cameriere", "14:00", "23:30"],
    ["", "Sab", "Banqueting", "Runner", "13:00", "23:00"],
    ["", "Sab", "Bar", "Barman", "16:00", "01:00"],
    ["", "Dom", "Colazione", "Commis", "06:00", "13:00"],
  ],
  low: [
    ["", "Lun", "Colazione", "Maitre", "07:00", "13:00"],
    ["", "Mar", "Pranzo", "Chef", "10:00", "15:00"],
    ["", "Gio", "Cena", "Cameriere", "18:00", "23:00"],
    ["", "Sab", "Bar", "Barman", "17:00", "23:00"],
  ],
};

let currentView = "resource";
let activeTemplate = "standard";
let selectedProperty = "all";
let shifts = []; loadShifts();


function saveShifts(){ localStorage.setItem("planningShifts", JSON.stringify(shifts));}
function loadShifts(){ try{ shifts = JSON.parse(localStorage.getItem("planningShifts")||"[]"); }catch(e){shifts=[];} }

const weekGrid = document.querySelector("#weekGrid");
const planningTitle = document.querySelector("#planningTitle");
const planningSubtitle = document.querySelector("#planningSubtitle");
const propertyFilter = document.querySelector("#propertyFilter");
const templateSelect = document.querySelector("#templateSelect");
const shiftDialog = document.querySelector("#shiftDialog");
const toast = document.querySelector("#toast");

function mapTemplate(rows) {
  return rows.map(([resource, day, department, position, start, end], index) => ({
    id: `${Date.now()}-${index}-${resource}`,
    resource,
    day,
    department,
    position,
    start,
    end,
  }));
}

function hoursBetween(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  let startValue = startHour + startMinute / 60;
  let endValue = endHour + endMinute / 60;
  if (endValue <= startValue) endValue += 24;
  return endValue - startValue;
}

function money(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getResource(name) {
  return resources.find((resource) => resource.name === name);
}

function visibleShifts() {
  if (selectedProperty === "all") return shifts;
  return shifts.filter((shift) => getResource(shift.resource)?.property === selectedProperty);
}

function viewRows() {
  const data = visibleShifts();
  if (currentView === "department") return departments;
  if (currentView === "position") return positions;
  return resources
    .filter((resource) => selectedProperty === "all" || resource.property === selectedProperty)
    .map((resource) => resource.name);
}

function shiftBelongsToRow(shift, row) {
  if (currentView === "department") return shift.department === row;
  if (currentView === "position") return shift.position === row;
  return shift.resource === row;
}

function rowSubtext(row) {
  if (currentView === "resource") {
    const resource = getResource(row);
    return `${resource.position} · ${resource.property}`;
  }
  const rowHours = visibleShifts()
    .filter((shift) => shiftBelongsToRow(shift, row))
    .reduce((sum, shift) => sum + hoursBetween(shift.start, shift.end), 0);
  return `${rowHours.toFixed(1)} ore pianificate`;
}

function renderGrid() {
  weekGrid.innerHTML = "";
  weekGrid.appendChild(cell("", "header-cell"));
  generateWeekDates().forEach((date,index) => {
    const isWeekend = index >= 5 ? "weekend-column" : "";
    const today = new Date();
    const isToday = today.toDateString() === date.toDateString() ? "today-column" : "";
    weekGrid.appendChild(
      cell(`${days[index]}<br><strong>${date.getDate()}</strong><br>${monthNames[date.getMonth()]}`, `header-cell ${isWeekend} ${isToday}`)
    );
  });

  viewRows().forEach((row) => {
    const label = cell(`<strong>${row}</strong><small>${rowSubtext(row)}</small>`, "row-label");
    weekGrid.appendChild(label);

    days.forEach((day) => {
      const dayCell = cell("", "");
      visibleShifts()
         .filter((shift) => ((shift.day||"").startsWith(day) || shift.day===day) && shiftBelongsToRow(shift, row))
        .forEach((shift) => dayCell.appendChild(shiftCard(shift)));
      weekGrid.appendChild(dayCell);
    });
  });

  const titles = {
    resource: ["Vista per risorsa", "Turni, servizi e costi per persona"],
    department: ["Vista per reparto", "Copertura per colazione, pranzo, cena e outlet"],
    position: ["Vista per posizione", "Fabbisogno operativo per ruolo"],
  };
  planningTitle.textContent = titles[currentView][0];
  planningSubtitle.textContent = titles[currentView][1];
}

function cell(content, extraClass) {
  const element = document.createElement("div");
  element.className = `grid-cell ${extraClass}`.trim();
  element.innerHTML = content;
  return element;
}

function shiftCard(shift) {
  const resource = getResource(shift.resource);
  const duration = hoursBetween(shift.start, shift.end);
  const source = shift.auto ? " · Auto" : "";
  const element = document.createElement("article");
  element.className = "shift-card";
  element.dataset.department = shift.department;
  element.innerHTML = `
    <strong>${shift.start}-${shift.end}</strong>
    <span>${shift.department} · ${shift.position}</span>
    <span>${shift.resource}</span>
    <span>${duration.toFixed(1)}h · ${money(duration * resource.rate)}${source}</span>
  `;
  return element;
}

function renderMetrics() {
  const data = visibleShifts();
  const hours = data.reduce((sum, shift) => sum + hoursBetween(shift.start, shift.end), 0);
  const cost = data.reduce((sum, shift) => {
    const resource = getResource(shift.resource);
    return sum + hoursBetween(shift.start, shift.end) * resource.rate;
  }, 0);
  const requiredSlots = coverageRequirements.length;
  const coveredSlots = coverageRequirements.filter((requirement) => coversRequirement(data, requirement)).length;
  const issues = calculateIssues();
  const budget = selectedProperty === "all" ? 27500 : 9300;
  const delta = ((cost - budget) / budget) * 100;

  document.querySelector("#plannedHours").textContent = hours.toFixed(1);
  document.querySelector("#plannedCost").textContent = money(cost);
  document.querySelector("#coverageScore").textContent = `${Math.round((coveredSlots / requiredSlots) * 100)}%`;
  document.querySelector("#issueCount").textContent = issues.length;
  document.querySelector("#costDelta").textContent = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}% vs budget`;
}

function calculateIssues() {
  const data = visibleShifts();
  const issues = [];
  coverageRequirements.forEach((requirement) => {
    if (!coversRequirement(data, requirement)) {
      issues.push({
        title: `${requirement.department} scoperto ${requirement.day}`,
        text: `Manca una posizione ${requirement.position} ${requirement.start}-${requirement.end}.`,
        status: "red",
        label: "Scopertura",
      });
    }
  });

  resources.forEach((resource) => {
    const total = data
      .filter((shift) => shift.resource === resource.name)
      .reduce((sum, shift) => sum + hoursBetween(shift.start, shift.end), 0);
    if (total > 44) {
      issues.push({
        title: `${resource.name} oltre soglia`,
        text: `${total.toFixed(1)} ore pianificate nella settimana.`,
        status: "amber",
        label: "Extra ore",
      });
    }
  });

  return issues.slice(0, 5);
}

function coversRequirement(data, requirement) {
  return data.some(
    (shift) =>
      shift.day === requirement.day &&
      shift.department === requirement.department &&
      shift.position === requirement.position,
  );
}

function shiftsOverlap(first, second) {
  if (first.day !== second.day) return false;
  const firstStart = timeToNumber(first.start);
  const firstEnd = normalizeEnd(firstStart, timeToNumber(first.end));
  const secondStart = timeToNumber(second.start);
  const secondEnd = normalizeEnd(secondStart, timeToNumber(second.end));
  return firstStart < secondEnd && secondStart < firstEnd;
}

function timeToNumber(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour + minute / 60;
}

function normalizeEnd(start, end) {
  return end <= start ? end + 24 : end;
}

function weeklyHoursFor(resourceName, plannedShifts) {
  return plannedShifts
    .filter((shift) => shift.resource === resourceName)
    .reduce((sum, shift) => sum + hoursBetween(shift.start, shift.end), 0);
}

function canAssign(resource, requirement, plannedShifts) {
  if (resource.position !== requirement.position) return false;
  const candidateShift = { ...requirement, resource: resource.name };
  const hasOverlap = plannedShifts.some(
    (shift) => shift.resource === resource.name && shiftsOverlap(shift, candidateShift),
  );
  const candidateHours = weeklyHoursFor(resource.name, plannedShifts) + hoursBetween(requirement.start, requirement.end);
  return !hasOverlap && candidateHours <= maxWeeklyHours;
}

function generateAutoPlan() {
  const generated = [];
  const uncovered = [];

  coverageRequirements.forEach((requirement) => {
    if (coversRequirement(shifts, requirement)) return;

    const candidate = resources
      .filter((resource) => selectedProperty === "all" || resource.property === selectedProperty)
      .filter((resource) => canAssign(resource, requirement, shifts.concat(generated)))
      .sort(
        (first, second) =>
          weeklyHoursFor(first.name, shifts.concat(generated)) - weeklyHoursFor(second.name, shifts.concat(generated)) ||
          first.rate - second.rate,
      )[0];

    if (!candidate) {
      uncovered.push(requirement);
      return;
    }

    generated.push({
      id: `${Date.now()}-auto-${generated.length}`,
      resource: candidate.name,
      day: requirement.day,
      department: requirement.department,
      position: requirement.position,
      start: requirement.start,
      end: requirement.end,
      auto: true,
    });
  });

  shifts = shifts.concat(generated);
  render();

  if (!generated.length && !uncovered.length) {
    showToast("Planning gia coperto dai turni esistenti");
    return;
  }

  showToast(`${generated.length} turni generati, ${uncovered.length} scoperture residue`);
}

function renderInsights() {
  const insights = calculateIssues();
  const list = document.querySelector("#insightList");
  list.innerHTML = "";

  if (!insights.length) {
    list.innerHTML = `<div class="insight"><strong>Nessuna anomalia critica</strong><span>Il planning rispetta copertura e soglie principali.</span><div class="status green">Validabile</div></div>`;
    return;
  }

  insights.forEach((issue) => {
    const item = document.createElement("article");
    item.className = "insight";
    item.innerHTML = `<strong>${issue.title}</strong><span>${issue.text}</span><div class="status ${issue.status}">${issue.label}</div>`;
    list.appendChild(item);
  });
}

function renderApprovals() {
  const approvals = [
    ["Cambio turno", " · Sabato · +2.0 ore", "amber", "Da approvare"],
    ["Cambio turno", " con  · Domenica", "green", "Pre-validato"],
    ["", " · Martedi mattina", "red", "Richiede copertura"],
  ];
  document.querySelector("#approvalList").innerHTML = approvals
    .map(
      ([title, text, status, label]) =>
        `<article class="approval"><strong>${title}</strong><span>${text}</span><div class="status ${status}">${label}</div></article>`,
    )
    .join("");
}

function renderTemplates() {
  const templateInfo = [
    ["Settimana standard F&B", "10 turni · servizi core coperti"],
    ["Settimana eventi e banqueting", "6 turni · rinforzo weekend"],
    ["Bassa occupazione", "4 turni · costo ridotto"],
  ];
  document.querySelector("#templateList").innerHTML = templateInfo
    .map(([title, text]) => `<article class="template-item"><strong>${title}</strong><span>${text}</span></article>`)
    .join("");
}

function render() {
  renderGrid();
  renderMetrics();
  renderInsights();
  renderApprovals();
  renderTemplates();
  updateWeekLabel();
  renderResources();
}

function populateInputs() {
  if (properties.length > 1) {
    properties.forEach((property) => propertyFilter.add(new Option(property, property)));
  }
  resources.forEach((resource) => document.querySelector("#resourceInput").add(new Option(resource.name, resource.name)));
  const fullDays=["Lunedì 25/05","Martedì 26/05","Mercoledì 27/05","Giovedì 28/05","Venerdì 29/05","Sabato 30/05","Domenica 31/05"];
  fullDays.forEach((day) => document.querySelector("#dayInput").add(new Option(day, day)));
  departments.forEach((department) => document.querySelector("#departmentInput").add(new Option(department, department)));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segmented button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentView = button.dataset.view;
    render();
  });
});

propertyFilter.addEventListener("change", () => {
  selectedProperty = propertyFilter.value;
  render();
});

templateSelect.addEventListener("change", () => {
  activeTemplate = templateSelect.value;
  shifts = mapTemplate(templates[activeTemplate]);
  render();
  showToast("Modello applicato al planning");
});

document.querySelector("#applyTemplateBtn").addEventListener("click", () => {
  shifts = shifts.concat(
    mapTemplate(templates[activeTemplate]).map((shift) => ({
      ...shift,
      id: `${shift.id}-copy`,
    })),
  );
  render();
  showToast("Settimana duplicata in un secondo");
});

document.querySelector("#saveTemplateBtn").addEventListener("click", () => {
  showToast("Modello settimanale salvato");
});

document.querySelector("#autoPlanBtn").addEventListener("click", generateAutoPlan);

document.querySelector("#addShiftBtn").addEventListener("click", () => {
  if (typeof shiftDialog.showModal === "function") shiftDialog.showModal();
});

document.querySelector("#confirmShiftBtn").addEventListener("click", () => {
  const resource=document.querySelector("#resourceInput").value;
  if(!resource){ showToast("Seleziona una risorsa"); return; }
  shifts.push({
    id: `${Date.now()}-manual`,
    resource: document.querySelector("#resourceInput").value,
    day: document.querySelector("#dayInput").value,
    department: document.querySelector("#departmentInput").value,
    position: "",
    start: document.querySelector("#startInput").value,
    end: document.querySelector("#endInput").value,
  });
  saveShifts();
  shiftDialog.close();
  render();
  showToast("Turno aggiunto e metriche aggiornate");
});

populateInputs();
render();


document.querySelector("#prevWeekBtn").addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 7);
  render();
});

document.querySelector("#nextWeekBtn").addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() + 7);
  render();
});

document.querySelector("#saveResourceBtn").addEventListener("click", () => {
  const name = document.querySelector("#resourceName").value;
  const role = document.querySelector("#resourceRole").value;
  const department = document.querySelector("#resourceDepartment").value;
  const rate = Number(document.querySelector("#resourceRate").value || 0);
  const maxHours = Number(document.querySelector("#resourceHours").value || 44);
  const color = document.querySelector("#resourceColor").value;

  if (!name) {
    showToast("Inserisci il nome della risorsa");
    return;
  }

  resources.push({
    name,
    position: role,
    department,
    rate,
    maxHours,
    color,
    property: properties[0],
  });

  saveResources();
  renderResources();
  render();

  document.querySelector("#resourceName").value = "";
  document.querySelector("#resourceRate").value = "";
  document.querySelector("#resourceHours").value = "";

  showToast("Risorsa salvata");
});

loadResources();
renderResources();


const navItems = document.querySelectorAll(".nav-item");

const planningSection = document.getElementById("planningSection");

const resourcesSection = document.getElementById("resourcesSection");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((btn) => {
      btn.classList.remove("active");
    });

    item.classList.add("active");

    const section = item.dataset.section;

    if (!section) return;

    planningSection.classList.remove("active-section");
    resourcesSection.classList.remove("active-section");

    if (section === "planning") {
      planningSection.classList.add("active-section");
    }

    if (section === "resources") {
      resourcesSection.classList.add("active-section");
    }
  });
});


const roleMap = {
  "Sala Bar": [
    "Head Waiter","Chef de Rang","Senior Waiter","Coordinatore sala/bar",
    "Restaurant Supervisor","Bar Manager","Bartender","Waiter",
    "Add.tto serv. tavoli","Cameriere di sala",
    "Add.tta prenotaz. acc.za",
    "Add.tta al buffet e sala","Add.tta al banco bar e sala","Barback"
  ],
  "Cucina": [
    "Capo cuoco","Sous Chef","Aiuto capo cuoco",
    "Capo cuoco partita","Cuoco","Commis di cucina",
    "Add.tta di cucina","Lavapiatti"
  ],
  "Colazioni": [
    "Breakfast Coordinator",
"Commis di sala","Head Waiter","Chef de Rang",
    "Cameriere di sala","Waiter",
    "Add.tta al buffet e sala","Add.tta di cucina"
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  const dep = document.getElementById("resourceDepartment");
  const role = document.getElementById("resourceRole");

  if (dep && role) {
    const refreshRoles = () => {
      const roles = roleMap[dep.value] || [];
      role.innerHTML = roles.map(r => `<option>${r}</option>`).join("");
    };

    dep.addEventListener("change", refreshRoles);
    refreshRoles();
  }
});


const departmentColors={
 "Sala Bar":"#2563eb",
 "Cucina":"#b45309",
 "Colazioni":"#15803d"
};

const originalRenderResources = renderResources;
renderResources = function(){
  originalRenderResources();
  const q=(document.getElementById('resourceSearch')?.value||'').toLowerCase();
  document.querySelectorAll('.resource-card').forEach((card,i)=>{
    if(q && !card.textContent.toLowerCase().includes(q)) card.style.display='none';
    const actions=card.querySelector('.resource-actions');
    if(actions && !actions.querySelector('.resource-edit')){
      const b=document.createElement('button');
      b.className='ghost-button compact resource-edit';
      b.textContent='Modifica';
      b.onclick=()=>editResource(i);
      actions.prepend(b);
    }
  });
}

function editResource(index){
 const r=resources[index];
 const name=prompt('Nome risorsa',r.name);
 if(name===null) return;
 r.name=name;
 saveResources(); renderResources(); render();
 setTimeout(groupResourcesByDepartment,50);
}

document.getElementById('resourceDepartment')?.addEventListener('change',e=>{
 const c=departmentColors[e.target.value];
 const color=document.getElementById('resourceColor');
 if(color && c) color.value=c;
});

document.getElementById('resourceSearch')?.addEventListener('input',()=>renderResources());

document.getElementById('exportExcelBtn')?.addEventListener('click',()=>{
 let rows=[['Nome','Ruolo','Reparto','Costo Orario','Ore Max']];
 resources.forEach(r=>rows.push([r.name,r.position,r.department,r.rate||'',r.maxHours||'']));
 const csv=rows.map(r=>r.join(';')).join('\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download='risorse_planning.csv';
 a.click();
});

function editResource(index){ 
 const r=resources[index];
 document.getElementById('resourceName').value=r.name||'';
 document.getElementById('resourceRole').value=r.position||'';
 document.getElementById('resourceDepartment').value=r.department||'';
 document.getElementById('resourceRate').value=r.rate||'';
 document.getElementById('resourceHours').value=r.maxHours||'';
 resources.splice(index,1);
 saveResources();
 renderResources();
}
document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('resourceSearch')?.addEventListener('input',renderResources);
 document.getElementById('resourceDepartmentFilter')?.addEventListener('change',renderResources);
});

const _oldRenderResources = renderResources;
renderResources = function(){
  _oldRenderResources();
  const filter=document.querySelector('#resourceDepartmentFilter');
  const list=document.querySelector('#resourceList');
  if(filter && !filter.value && list){
    [...list.children].sort((a,b)=>{
      const ta=a.innerText, tb=b.innerText;
      return ta.localeCompare(tb);
    }).forEach(el=>list.appendChild(el));
  }
}


/* Group resources by department when filter = all */
function groupResourcesByDepartment(){
 const list=document.querySelector('#resourceList');
 const filter=document.querySelector('#resourceDepartmentFilter');
 if(!list || !filter || filter.value) return;

 const cards=[...list.querySelectorAll('.resource-card')];
 if(!cards.length) return;

 const groups={'Sala Bar':[], 'Colazioni':[], 'Cucina':[]};

 cards.forEach(card=>{
   const txt=card.innerText||'';
   if(txt.includes('Sala Bar')) groups['Sala Bar'].push(card);
   else if(txt.includes('Colazioni')) groups['Colazioni'].push(card);
   else groups['Cucina'].push(card);
 });

 list.innerHTML='';

 const colors={'Sala Bar':'#2563eb','Colazioni':'#16a34a','Cucina':'#ea580c'};

 Object.keys(groups).forEach(dep=>{
   if(!groups[dep].length) return;

   const h=document.createElement('div');
   h.className='department-group-title';
   h.style.borderLeft='6px solid '+colors[dep];
   h.innerHTML='<strong>'+dep+'</strong> ('+groups[dep].length+')';
   list.appendChild(h);

   groups[dep].forEach(c=>list.appendChild(c));
 });
}

document.addEventListener('change',e=>{
 if(e.target && e.target.id==='resourceDepartmentFilter'){
   setTimeout(groupResourcesByDepartment,50);
 }
});

setTimeout(groupResourcesByDepartment,500);

const _rr=renderResources;
renderResources=function(){
 _rr();
 setTimeout(groupResourcesByDepartment,10);
}


loadResources();

function rebuildPlanningFromResources(){
  shifts = [];
  resources.forEach((r,index)=>{
    const day = days[index % 7];
    shifts.push({
      id:'auto-'+index,
      resource:r.name,
      day,
      department:r.department || '',
      position:r.position || '',
      start:'09:00',
      end:'17:00'
    });
  });
}

const _saveResourcesOriginal = saveResources;
saveResources = function(){
  _saveResourcesOriginal();
  rebuildPlanningFromResources();
  render();
}

rebuildPlanningFromResources();

document.addEventListener('DOMContentLoaded',()=>{
 const dept=document.querySelector('#shiftDepartment');
 const res=document.querySelector('#shiftResource');
 if(dept && res){
   const refresh=()=>{
    const d=dept.value;
    res.innerHTML='';
    resources.filter(r=>!d || r.department===d).forEach(r=>{
      const o=document.createElement('option');
      o.value=r.name;o.textContent=r.name;
      res.appendChild(o);
    });
   };
   dept.addEventListener('change',refresh);
   setTimeout(refresh,300);
 }
});

function updateResourceDropdown(){
 const dept=document.querySelector('#departmentSelect, #serviceSelect');
 const res=document.querySelector('#resourceSelect');
 if(!res) return;
 const dep=dept?dept.value:'';
 res.innerHTML='<option value="">Seleziona risorsa</option>';
 (resources||[]).filter(r=>!dep || r.department===dep).forEach(r=>{
   const o=document.createElement('option');
   o.value=r.name;o.textContent=r.name;
   res.appendChild(o);
 });
}
document.addEventListener('change',e=>{
 if(e.target && (e.target.id==='departmentSelect' || e.target.id==='serviceSelect')) updateResourceDropdown();
});
document.addEventListener('DOMContentLoaded',()=>setTimeout(updateResourceDropdown,300));

function renderImmediateControl(){
 const el=document.querySelector('#immediateControl');
 if(!el) return;
 const counts={};
 (resources||[]).forEach(r=>counts[r.department]=(counts[r.department]||0)+1);
 el.innerHTML='';
 ['Sala Bar','Colazioni','Cucina'].forEach(dep=>{
   const c=counts[dep]||0;
   const card=document.createElement('div');
   card.className='alert-card';
   card.innerHTML='<strong>'+dep+'</strong><div>'+(c===0?'Nessuna risorsa assegnata':'Risorse presenti: '+c)+'</div>';
   el.appendChild(card);
 });
}

document.addEventListener('DOMContentLoaded', ()=>{
 const dep=document.querySelector('#departmentInput');
 const res=document.querySelector('#resourceInput');
 function fillResources(){
   if(!dep||!res||typeof resources==='undefined') return;
   res.innerHTML='';
   const filtered=resources.filter(r=>!dep.value || r.department===dep.value);
   filtered.forEach(r=>res.add(new Option(r.name,r.name)));
 }
 dep?.addEventListener('change',fillResources);
 setTimeout(fillResources,200);
});

function refreshResourceSelect(){
 const dep=document.querySelector("#departmentInput");
 const sel=document.querySelector("#resourceInput");
 if(!dep || !sel) return;
 sel.innerHTML='';
 resources.filter(r=>r.department===dep.value).forEach(r=>{
   const o=document.createElement('option');
   o.value=r.name;
   o.textContent=r.name;
   sel.appendChild(o);
 });
}
document.querySelector("#departmentInput")?.addEventListener("change",refreshResourceSelect);
setTimeout(refreshResourceSelect,100);

document.getElementById('importResourcesBtn')?.addEventListener('click',()=>document.getElementById('excelImport').click());
document.getElementById('excelImport')?.addEventListener('change',(e)=>{
 const f=e.target.files[0]; if(!f) return;
 const reader=new FileReader();
 reader.onload=()=>{
  const text=reader.result;
  const lines=text.split(/\r?\n/).filter(x=>x.trim());
  let added=0;
  for(let i=1;i<lines.length;i++){
    const c=lines[i].split(';').length>1?lines[i].split(';'):lines[i].split(',');
    if(c.length<4) continue;
    const name=(c[0]+' '+(c[1]||'')).trim();
    const role=(c[2]||'').trim();
    let dep=(c[3]||'').trim();
    if(dep.toUpperCase().includes('SALA')) dep='Sala Bar';
    else if(dep.toUpperCase().includes('CUCINA')) dep='Cucina';
    else dep='Colazioni';
    resources.push({name:name,role:role,department:dep,rate:parseFloat(c[4]||0)||0});
    added++;
  }
  saveResources();
  if(typeof renderResources==='function') renderResources();
  alert('Importate '+added+' risorse');
 };
 reader.readAsText(f);
});

// Variablen
const taskInput = document.getElementById('taskInput');
const timeInput = document.getElementById('timeInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressBar = document.getElementById('progress-bar');
const xpEl = document.getElementById('xp');
const levelEl = document.getElementById('level');
const todayCountEl = document.getElementById('todayCount');
const dateTime = document.getElementById('dateTime');
const avatar = document.getElementById('avatar');
const nextBg = document.getElementById('nextBg');
const darkToggle = document.getElementById('darkToggle');
const pointsSelect = document.getElementById('pointsSelect');
const toast = document.getElementById('toast');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

// Daten laden
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let xp = Number(localStorage.getItem('xp') || 0);
let bgIndex = Number(localStorage.getItem('bgIndex') || 0);
let darkMode = localStorage.getItem('darkMode') === 'true';
let filter = 'all';
let daily = JSON.parse(localStorage.getItem('daily')) || {};
const backgrounds = [
  "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')",
  "url('https://images.unsplash.com/photo-1503264116251-35a269479413')",
  "url('https://images.unsplash.com/photo-1526406915895-50e0d2b6f44b')",
  "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')"
];

// Init
if(darkMode) document.body.classList.add('dark');

// Hintergrund setzen und richtig skalieren
document.body.style.backgroundImage = backgrounds[bgIndex];
document.body.style.backgroundSize = "cover";
document.body.style.backgroundPosition = "center";
document.body.style.backgroundRepeat = "no-repeat";

// Speicher Funktion
function saveAll(){
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('xp', xp);
  localStorage.setItem('bgIndex', bgIndex);
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  localStorage.setItem('daily', JSON.stringify(daily));
}

// Toast Funktion
function showToast(text,time=2000){
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'),time);
}

// Datum & Zeit anzeigen
function updateDateTime(){
  const now = new Date();
  dateTime.textContent = now.toLocaleString('de-DE',{dateStyle:'full',timeStyle:'short'});
}
setInterval(updateDateTime,1000);
updateDateTime();

// XP & Level
function xpToLevel(xp){ return Math.floor(Math.sqrt(xp/10)) + 1; }
function updateXPDisplay(){
  xpEl.textContent = xp;
  const lvl = xpToLevel(xp);
  levelEl.textContent = 'Lv ' + lvl;
  if(lvl < 3) avatar.textContent = '🙂';
  else if(lvl < 6) avatar.textContent = '😃';
  else if(lvl < 10) avatar.textContent = '🤩';
  else avatar.textContent = '🦸';
}

// Hintergrund wechseln
nextBg.addEventListener('click', ()=>{
  bgIndex = (bgIndex + 1) % backgrounds.length;
  document.body.style.backgroundImage = backgrounds[bgIndex];
  saveAll();
});

// Dark Mode toggle
darkToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  saveAll();
});

// Aufgabe hinzufügen
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e=>{ if(e.key==='Enter') addTask(); });

function addTask(){
  const text = taskInput.value.trim();
  const time = timeInput.value;
  const points = Number(pointsSelect.value);
  if(!text){ showToast('Gebe eine Aufgabe ein'); return; }
  tasks.push({text, time, points, done:false, created:new Date().toISOString()});
  taskInput.value=''; timeInput.value='';
  saveAndRender(); showToast('Aufgabe hinzugefügt');
}

// Aufgabe erledigen
function toggleDone(i){
  const t = tasks[i];
  if(!t) return;
  t.done = !t.done;
  if(t.done){
    xp += t.points || 10;
    const today = new Date().toISOString().slice(0,10);
    daily[today] = (daily[today] || 0) + 1;
    showToast('Erledigt! +' + (t.points||10) + ' XP',1500);
    checkLevelUp();
  }
  saveAndRender();
}

// Aufgabe löschen
function deleteTask(i){
  if(confirm('Wirklich löschen?')){
    tasks.splice(i,1);
    saveAndRender();
  }
}

// Aufgaben rendern
function renderTasks(){
  taskList.innerHTML='';
  const q = searchInput.value.toLowerCase();
  const filtered = tasks.filter(t=>{
    const matches = t.text.toLowerCase().includes(q);
    if(filter==='open') return !t.done && matches;
    if(filter==='done') return t.done && matches;
    return matches;
  });
  filtered.forEach((t)=>{
    const i = tasks.indexOf(t);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="task-left">
        <div class="task-title">${escapeHtml(t.text)}</div>
        <div class="task-meta">${t.time?'🕒 '+t.time+' · ':''}+${t.points} XP · erstellt ${new Date(t.created).toLocaleString('de-DE')}</div>
      </div>
      <div class="task-actions">
        <button class="done-btn" onclick="toggleDone(${i})">${t.done?'↺':'✔'}</button>
        <button class="delete-btn" onclick="deleteTask(${i})">✖</button>
      </div>
    `;
    if(t.done) li.classList.add('done');
    taskList.appendChild(li);
  });
  updateProgress();
  updateXPDisplay();
  updateTodayCount();
}

// Fortschrittsbalken
function updateProgress(){
  const done = tasks.filter(t=>t.done).length;
  const total = tasks.length;
  progressBar.style.width = total ? Math.round((done/total)*100)+'%' : '0%';
}

// Suche + Filter
searchInput.addEventListener('input', renderTasks);
filterButtons.forEach(btn=>btn.addEventListener('click', ()=>{
  filterButtons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filter = btn.dataset.filter;
  renderTasks();
}));

// Erinnerungen / Timer
setInterval(()=>{
  const now = new Date();
  const nowTime = now.toTimeString().slice(0,5);
  tasks.forEach((t)=>{
    if(!t.done && t.time && t.time === nowTime){
      showToast(`⏰ Erinnerung: ${t.text}`,4000);
    }
  });
},30000);

// Export / Reset
exportBtn.addEventListener('click', ()=>{
  const data = {tasks,xp,daily};
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='todo-export.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('Export erstellt');
});

clearBtn.addEventListener('click', ()=>{
  if(confirm('Alle Daten löschen?')){
    tasks=[]; xp=0; daily={};
    localStorage.clear();
    saveAndRender();
    showToast('Reset vollständig');
  }
});

// Hilfsfunktionen
function saveAndRender(){ saveAll(); renderTasks(); }
function updateTodayCount(){
  const today = new Date().toISOString().slice(0,10);
  todayCountEl.textContent = daily[today] || 0;
}
function checkLevelUp(){
  const lvl = xpToLevel(xp);
  const prev = xpToLevel(xp - (Number(pointsSelect.value) || 10));
  if(lvl>prev){ showToast('Level Up! '+lvl,2000); confetti(); }
}
function escapeHtml(str){ return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Confetti Animation
function confetti(){ 
  const count=20; 
  for(let i=0;i<count;i++){ 
    const el=document.createElement('div'); 
    el.style.position='fixed'; 
    el.style.left=(50+Math.random()*40-20)+'%'; 
    el.style.top='30%'; 
    el.style.width='8px'; 
    el.style.height='8px'; 
    el.style.borderRadius='50%'; 
    el.style.background=['#FFD166','#06D6A0','#118AB2','#EF476F'][Math.floor(Math.random()*4)]; 
    el.style.opacity='0.95'; 
    el.style.transition='transform 1s linear, opacity 1s linear'; 
    document.body.appendChild(el); 
    requestAnimationFrame(()=>{ 
      el.style.transform=`translateY(${200+Math.random()*200}px) translateX(${(Math.random()*400-200)}px) rotate(${Math.random()*360}deg) scale(.8)`; 
      el.style.opacity='0'; 
    }); 
    setTimeout(()=>el.remove(),1100);
  }
}

// Initialisierung
updateXPDisplay();
renderTasks();

// Expose functions für HTML Buttons
window.toggleDone = toggleDone;
window.deleteTask = deleteTask;

// 🐾 Motivations-Tier-Funktion 🐾

// Liste der Sprüche
const messages = [
  "🐱 Starte deinen Tag mit Lernen!",
  "🐶 Du schaffst das! Bleib dran!",
  "🐰 Kleine Schritte bringen dich ans Ziel!",
  "🦊 Mach kurz Pause und trink Wasser!",
  "🐼 Du bist besser als du denkst!",
  "🐯 Eine erledigte Aufgabe ist ein Sieg!",
  "🐧 Bleib fokussiert – du bist auf dem richtigen Weg!"
];

// Funktion, um zufällige Nachricht zu zeigen
function showMotivation() {
  // Nachricht erstellen
  const box = document.createElement('div');
  box.classList.add('motivation-box');
  box.textContent = messages[Math.floor(Math.random() * messages.length)];

  document.body.appendChild(box);

  // Nach 5 Sekunden wieder verschwinden lassen
  setTimeout(() => {
    box.classList.add('fade-out');
    setTimeout(() => box.remove(), 1000);
  }, 10000);
}

// Timer starten, der alle 3 Minuten die Nachricht zeigt
function startMotivationTimer() {
  showMotivation(); // Sofort beim Start
  setInterval(showMotivation, 20000); // Alle 3 Minuten
}

// Starten beim Laden der Seite
window.addEventListener('load', startMotivationTimer);

// 🎈 XP-Blasen-Funktion (fehlerfrei)
(function(){
  let xp = 0; // aktuelle XP

  // Funktion für zufällige Matheaufgabe
  function generateMathQuestion() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let answer;
    switch(op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '*': answer = a * b; break;
    }
    return { question: `${a} ${op} ${b}`, answer: answer };
  }

  // Blase erzeugen
  function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'math-bubble';

    // Zufällige Position
    const x = Math.random() * (window.innerWidth - 60);
    const y = Math.random() * (window.innerHeight - 100);
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';

    // Mathefrage
    const math = generateMathQuestion();
    bubble.textContent = math.question;

    // Klick-Event
    bubble.addEventListener('click', () => {
      const userAnswer = prompt(`Löse: ${math.question}`);
      if(userAnswer !== null && parseInt(userAnswer) === math.answer){
        const earnedXP = Math.floor(Math.random() * 6) + 5; // 5–10 XP
        xp += earnedXP;
        alert(`Richtig! +${earnedXP} XP (Gesamt: ${xp})`);
      } else if(userAnswer !== null){
        alert(`Falsch! Richtige Antwort: ${math.answer}`);
      }
      bubble.remove();
    });

    document.body.appendChild(bubble);

    // Blase nach 10s automatisch entfernen
    setTimeout(() => {
      if(document.body.contains(bubble)) bubble.remove();
    }, 10000);
  }

  // Blasen alle 2 Minuten generieren
  setInterval(createBubble, 60000);

  // Sofort beim Laden eine Blase
  window.addEventListener('load', createBubble);

})();

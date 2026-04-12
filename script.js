const firebaseConfig = {
    apiKey: "AIzaSyBrEhFGTVumQMRE0nNBO0Ki08ah1iAt2iQ",
    authDomain: "deadlineintelligence.firebaseapp.com",
    projectId: "deadlineintelligence",
    storageBucket: "deadlineintelligence.firebasestorage.app",
    messagingSenderId: "383132162184",
    appId: "1:383132162184:web:397ccc6152b1901016e73d",
    measurementId: "G-1P4YMD9GKN",
    databaseURL: "https://deadlineintelligence-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
let statsChart, prioChart, isLoginMode = true, currentTasks = [];

// AUTH TOGGLE FIX
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-main-title');
    const btn = document.getElementById('authBtn');
    const footerTxt = document.getElementById('auth-footer-text');
    const toggleLink = document.getElementById('toggleMsg');

    if (!isLoginMode) {
        title.innerText = "Student Registration";
        btn.innerText = "Register Now";
        footerTxt.innerText = "Already have an account?";
        toggleLink.innerText = "Login here";
    } else {
        title.innerText = "Student Login";
        btn.innerText = "Login";
        footerTxt.innerText = "Don't have an account?";
        toggleLink.innerText = "Create Account";
    }
}

function handleAuth() {
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    if(!e || !p) return alert("Please fill fields!");
    
    if(isLoginMode) {
        auth.signInWithEmailAndPassword(e, p).catch(err => alert(err.message));
    } else {
        auth.createUserWithEmailAndPassword(e, p).catch(err => alert(err.message));
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').style.display = 'block';
        document.getElementById('userMail').innerText = user.email;
        initCharts(); syncData();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-screen').style.display = 'none';
    }
});

function logout() { auth.signOut(); }

function addTask() {
    const name = document.getElementById('tName').value, cat = document.getElementById('tCat').value;
    const date = document.getElementById('tDate').value, prio = document.getElementById('tPrio').value;
    if(!name || !date) return alert("Fill data!");
    db.ref('tasks/' + auth.currentUser.uid).push({ name, category: cat, date, prio: parseInt(prio), done: false });
    document.getElementById('tName').value = '';
}

function syncData() {
    db.ref('tasks/' + auth.currentUser.uid).on('value', snap => {
        currentTasks = snap.val() ? Object.keys(snap.val()).map(id => ({id, ...snap.val()[id]})) : [];
        renderTasks(currentTasks); updateAnalytics(); checkAlerts();
    });
    db.ref('notes/' + auth.currentUser.uid).on('value', snap => {
        const vault = document.getElementById('notesVault'); vault.innerHTML = '';
        const data = snap.val();
        if(data) Object.keys(data).forEach(id => {
            const n = data[id];
            const d = document.createElement('div'); d.className = 'note-file-link';
            d.innerHTML = `<i data-lucide="file-text" size="14"></i> ${n.title}`;
            d.onclick = () => { document.getElementById('modalTitle').innerText = n.title; document.getElementById('modalBody').innerText = n.content; document.getElementById('noteModal').classList.remove('hidden'); };
            vault.prepend(d);
        });
        lucide.createIcons();
    });
}

function renderTasks(arr) {
    const list = document.getElementById('taskList'); list.innerHTML = '';
    arr.forEach(t => {
        const c = t.prio == 3 ? 'red' : t.prio == 2 ? 'orange' : 'green';
        const div = document.createElement('div'); div.className = 'task-item';
        div.innerHTML = `<input type="checkbox" ${t.done?'checked':''} onclick="toggleTask('${t.id}', ${t.done})" style="width:25px; height:25px;">
            <div style="flex:1"><span class="tag ${c}">${t.prio==3?'High':'Mid'}</span><span class="tag" style="background:rgba(255,255,255,0.1)">${t.category}</span>
            <div style="font-weight:700; font-size:18px; margin-top:5px; text-decoration:${t.done?'line-through':'none'}">${t.name}</div>
            <small style="opacity:0.5">${t.date}</small></div>
            <button onclick="deleteTask('${t.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i data-lucide="trash-2" size="18"></i></button>`;
        list.appendChild(div);
    });
    lucide.createIcons();
}

function checkAlerts() {
    const alertBox = document.getElementById('systemAlert');
    const urgent = currentTasks.find(t => !t.done && t.prio === 3);
    if(urgent) { alertBox.innerText = `⚠️ ALERT: High Priority Mission "${urgent.name}" is pending!`; alertBox.classList.remove('hidden'); }
    else { alertBox.classList.add('hidden'); }
}

function addNote() {
    const t = document.getElementById('noteTitle').value, c = document.getElementById('noteContent').value;
    if(t && c) db.ref('notes/' + auth.currentUser.uid).push({ title: t, content: c });
    document.getElementById('noteTitle').value = ''; document.getElementById('noteContent').value = '';
}
function closeNote() { document.getElementById('noteModal').classList.add('hidden'); }

function initCharts() {
    Chart.defaults.color = '#94a3b8';
    if(statsChart) statsChart.destroy(); if(prioChart) prioChart.destroy();
    statsChart = new Chart(document.getElementById('statsChart'), { type: 'doughnut', data: { datasets: [{ data: [1, 0], backgroundColor: ['#2d334a', '#6366f1'], borderWidth: 0 }] }, options: { cutout: '85%', maintainAspectRatio: false } });
    prioChart = new Chart(document.getElementById('prioChart'), { type: 'bar', data: { labels: ['High', 'Mid', 'Low'], datasets: [{ data: [0,0,0], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'], borderRadius: 10 }] }, options: { maintainAspectRatio: false } });
}

function updateAnalytics() {
    const total = currentTasks.length, done = currentTasks.filter(t => t.done).length;
    document.getElementById('completionRate').innerText = total === 0 ? "0%" : Math.round((done/total)*100) + "%";
    statsChart.data.datasets[0].data = [total-done, done]; statsChart.update();
    prioChart.data.datasets[0].data = [currentTasks.filter(t=>t.prio==3).length, currentTasks.filter(t=>t.prio==2).length, currentTasks.filter(t=>t.prio==1).length];
    prioChart.update();
}

function toggleTask(id, current) { db.ref('tasks/' + auth.currentUser.uid + '/' + id).update({done: !current}); }
function deleteTask(id) { db.ref('tasks/' + auth.currentUser.uid + '/' + id).remove(); }
function syncFilter() { const q = document.getElementById('searchInput').value.toLowerCase(); const p = document.getElementById('prioFilter').value; renderTasks(currentTasks.filter(t => t.name.toLowerCase().includes(q) && (p === 'all' || t.prio == p))); }
lucide.createIcons();
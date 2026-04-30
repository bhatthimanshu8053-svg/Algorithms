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

firebase.initializeApp(firebaseConfig); 

var auth = firebase.auth();
var db = firebase.database();

var loginMode = true; 
var taskListArray = []; 

function switchScreen() {
    if (loginMode == true) {
        loginMode = false;
        document.getElementById('auth-main-title').innerText = "Student Registration";
        document.getElementById('authBtn').innerText = "Register";
    } else {
        loginMode = true;
        document.getElementById('auth-main-title').innerText = "Student Login";
        document.getElementById('authBtn').innerText = "Login";
    }
}

function handleAuth() {
    var email = document.getElementById('email').value;
    var pass = document.getElementById('password').value;
    
    if (loginMode == true) {
        auth.signInWithEmailAndPassword(email, pass).catch(function(err) {
            alert("Error: " + err.message);
        });
    } else {
        auth.createUserWithEmailAndPassword(email, pass).catch(function(err) {
            alert("Error: " + err.message);
        });
    }
}

auth.onAuthStateChanged(function(user) {
    if (user != null) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        fetchData(); 
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
});

function logout() {
    auth.signOut();
}

function fetchData() {
    var user_id = auth.currentUser.uid;
    db.ref('tasks/' + user_id).on('value', function(snap) {
        var all_data = snap.val();
        taskListArray = []; 
        
        if (all_data != null) {
            for (var key in all_data) {
                var single_item = all_data[key];
                single_item.id = key;
                taskListArray.push(single_item);
            }
        }
        drawTable(); 
        calcStats(); 
    });
}

function saveTask() {
    var t_title = document.getElementById('tName').value;
    var t_date = document.getElementById('tDate').value;
    
    if (t_title == "" || t_date == "") {
        alert("Saari details bharo bhai!");
    } else {
        var user_id = auth.currentUser.uid;
        db.ref('tasks/' + user_id).push({
            taskName: t_title,
            taskDate: t_date,
            status: "pending" 
        });
        document.getElementById('tName').value = "";
    }
}

function deleteTask(id) {
    var user_id = auth.currentUser.uid;
    db.ref('tasks/' + user_id + '/' + id).remove();
}

function toggleStatus(id, isChecked) {
    var user_id = auth.currentUser.uid;
    var finalStatus = "pending";
    
    if (isChecked == true) {
        finalStatus = "completed";
    }
    
    db.ref('tasks/' + user_id + '/' + id).update({
        status: finalStatus
    });
}

function drawTable() {
    var box = document.getElementById('taskList');
    box.innerHTML = ""; 

    for (var i = 0; i < taskListArray.length; i++) {
        var data = taskListArray[i];
        
        var itemStatus = "pending";
        if (data.status != null) {
            itemStatus = data.status;
        }

        var isDone = "";
        var line = "none";
        var light = "1";
        
        if (itemStatus == "completed") {
            isDone = "checked";
            line = "line-through";
            light = "0.5";
        }

        var myRow = document.createElement('div');
        myRow.className = 'task-item';
        
        var htmlCode = '<span><input type="checkbox" ' + isDone + ' onclick="toggleStatus(\'' + data.id + '\', this.checked)"></span>';
        htmlCode = htmlCode + '<span style="text-decoration:' + line + '; opacity:' + light + '">' + data.taskName + '</span>';
        htmlCode = htmlCode + '<span>' + data.taskDate + '</span>';
        htmlCode = htmlCode + '<span><button onclick="deleteTask(\'' + data.id + '\')" style="color:red; border:1px solid red; background:none; padding:5px;">Delete</button></span>';
        
        myRow.innerHTML = htmlCode;
        box.appendChild(myRow);
    }
}

function calcStats() {
    var total = taskListArray.length;
    var done = 0;
    var aane_wala = 0;
    var chhut_gaya = 0;
    
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    
    if (month < 10) { month = "0" + month; }
    if (day < 10) { day = "0" + day; }
    
    var todayStr = year + "-" + month + "-" + day;

    for (var i = 0; i < taskListArray.length; i++) {
        var item = taskListArray[i];
        var s = "pending";
        if (item.status != null) { s = item.status; }

        if (s == "completed") {
            done = done + 1;
        } else {
            if (item.taskDate < todayStr) {
                chhut_gaya = chhut_gaya + 1;
            } else {
                aane_wala = aane_wala + 1;
            }
        }
    }

    document.getElementById('totalCount').innerText = total;
    document.getElementById('completedCount').innerText = done;
    document.getElementById('upcomingCount').innerText = aane_wala;
    document.getElementById('missedCount').innerText = chhut_gaya;
}

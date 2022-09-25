let token;
let loggedOut = false;

async function GetTasks() {
    let json;
    var query = `query getTasks($token: String) {
                getTasks(token: $token)
                }`;

    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {token},
        })
    }).then(r => r.json()).then(data => {
        json = JSON.parse(data["data"]["getTasks"]);
    });

	if (json.code == 401) {
        fourZeroOne();
	}

    if (json.code == 200) {
        tasks = JSON.parse(json.tasks);
        let rows = document.querySelector(".info"); 
        rows.innerHTML = '';

        select = document.getElementById('filter');
		value = select.options[select.selectedIndex].value;

        tasks.forEach(task => {
        	if (value == task.status || value == -1)
        	{
            	rows.append(row(task));
        	}
        });
    }

    console.log(json.code);
}

function row(task) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", task.id);
	tr.className = "tasks";

    const dateTd = document.createElement("td");
    dateTd.setAttribute('style','text-align :center;');
    dateTd.append(task.date);
    tr.append(dateTd);

    const timeTd = document.createElement("td");
    timeTd.setAttribute('style','text-align :center;');
    timeTd.append(task.time);
    tr.append(timeTd);

    const statusTd = document.createElement("td");
    statusTd.setAttribute('style','text-align :center;');
    const btn = document.createElement("button");
    if (task.status)
    {
    	btn.className = "standart | marked";
		btn.textContent = "Unmark";
    }
    else
    {
    	btn.className = "standart | unmarked";
		btn.textContent = "Mark";
		tr.className = "undone";
    }
	btn.value = task.status;
    btn.name = "status";
	btn.type = "submit";
    btn.addEventListener("click", e => {
        e.preventDefault();
    	id = task.id;
        if (task.status)
        {
        	btn.className = "standart | unmarked";
			btn.textContent = "Mark";
			task.status = 0;
			markTask(task.id, 0);
			tr.className = "undone";
        }
        else
        {
        	btn.className = "standart | marked";
			btn.textContent = "Unmark";
			task.status = 1;
			markTask(task.id, 1);
			tr.className = "";
        }
    });
	statusTd.append(btn);
    tr.append(statusTd);

    const taskTd = document.createElement("td");
    taskTd.setAttribute('style','text-align :center;');
    taskTd.append(task.task);
    tr.append(taskTd);

    const fileTd = document.createElement("td");
    fileTd.setAttribute('style','text-align :center;');
    const dwnldLink = document.createElement("a");
    dwnldLink.setAttribute('href','./files/' + task.file);
    dwnldLink.setAttribute('download', task.file);
    dwnldLink.append(task.file);
    fileTd.append(dwnldLink);
    tr.append(fileTd);

    return tr;
}

async function markTask(id, status)
{
    let json;
    var query = `query markTask($token: String, $id: String, $status: String) {
                markTask(token: $token, id: $id, status: $status)
                }`;
    id = id.toString();
    status = status.toString();
    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {token, id, status},
        })
    }).then(r => r.json()).then(data => {
        json = JSON.parse(data["data"]["markTask"]);
    });

	if (json.code == 401) {
        fourZeroOne();
	}

    console.log(json.code);
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function addTask() 
{
	date = document.getElementById('tbDate').value;
	time = document.getElementById('tbTime').value;
	task = document.getElementById('tbTask').value;
	file = document.getElementById('btnFile').files[0];
    name = file.name;
    file = await toBase64(file);
	
    let json;
    var query = `query newTask($token: String, $date: String, $time: String, $name: String, $file: String, $task: String) {
                newTask(token: $token, date: $date, time: $time, name: $name, file: $file, task: $task)
                }`;
    date = date.toString();
    time = time.toString();
    task = task.toString();
    file = file.toString();
    name = name.toString();
    task = task.toString();

    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {token, date, time, name, file, task},
        })
    }).then(r => r.json()).then(data => {
        json = JSON.parse(data["data"]["newTask"]);
    });

	if (json.code == 401) {
        fourZeroOne();
	}
	else {
    	GetTasks();
    	mainVis();
    	date.value = "";
    	time.value = "";
    	task.value = "";
    	file.value = "";
	}

	console.log(json.code);
}

async function auth() {
	login = document.getElementById('inputLogin').value;
	pass = document.getElementById('inputPassword').value;

	if (login.length == 0 || pass.length == 0) {
		alert("Complete all fields");
		return;
	}
    let json;
    var query = `query auth($login: String, $pass: String) {
                auth(login: $login, pass: $pass)
                }`;

    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {login, pass},
        })
    }).then(r => r.json()).then(data => {
        json = JSON.parse(data["data"]["auth"]);
    });

	if (json.code == 200) {
    	select = document.getElementById('authdiv').style.visibility = "hidden";
    	select = document.getElementById('maindiv').style.visibility = "visible";
    	token = json.token;

    	console.log(json.code);

		GetTasks();
        document.getElementById('inputLogin').value = "";
        document.getElementById('inputPassword').value = "";
        loggedOut = false;
	}
	else {
		alert("Wrong login or password");
	}
}

async function reg() {
	login = document.getElementById('inputLoginR').value;
	pass = document.getElementById('inputPasswordR').value;
	passR = document.getElementById('inputPasswordRepeatR').value;

	if (pass != passR) {
		alert("Passwords doesn't match");
		return;
	}

	if (login.length == 0 || pass.length == 0) {
		alert("Complete all fields");
		return;
	}

	let json;
    var query = `query reg($login: String, $pass: String) {
                reg(login: $login, pass: $pass)
                }`;

    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {login, pass},
        })
    }).then(r => r.json()).then(data => {
        json = JSON.parse(data["data"]["reg"]);
    });

	if (json.code == 200) {
    	select = document.getElementById('regdiv').style.visibility = "hidden";
    	select = document.getElementById('authdiv').style.visibility = "visible";

        document.getElementById('inputLoginR').value = "";
        document.getElementById('inputPasswordR').value = "";
        document.getElementById('inputPasswordRepeatR').value = "";
	}
	else {
		if (json.code == 409)
			alert("Login exists");
		else
			alert("Smth went wrong");
	}
	console.log(json.code);
}

async function logOut() {
    select = document.getElementById('regdiv').style.visibility = "hidden";
    select = document.getElementById('adddiv').style.visibility = "hidden";
    select = document.getElementById('maindiv').style.visibility = "hidden";
    select = document.getElementById('authdiv').style.visibility = "visible";
    token = null;
}

async function load() {
    document.write(`<div class="wrapper">
        <div class="a">
            <div id = "maindiv" class = "center-index"> 
                <h1 align = "center">Your time manager</h1>
                <div class = "selecter">
                    <p class = "selecter"> Filter by status: </p>
                    <select class = "index" id = "filter" onchange="GetTasks()">
                        <option value = "-1" selected>All</option>
                        <option value = "0"> Undone</option>
                        <option value = "1">Done</option>
                    </select>
                    <div class = "controls">
                        <button class = "standart | newTask" onclick="logOut()"> Log Out </button>
                        <button class = "standart | newTask" onclick="addTaskVis()"> Add new task </button>
                    </div>
                </div>
                <table id = "tasks">
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Task</th>
                        <th>File</th>
                    </tr>
                    <tbody class="info"></tbody>
                </table>
            </div>  
        </div>
        <div class="b">
            <div id = "adddiv" class = "center-add">
                <h1> Add new task </h1>
                <div class="add1">
                    <div class="addChild1">
                        <label class = "add" for = "tbDate">Date:</label>
                        <input type = "date" id = "tbDate">
                        <label class = "add" for = "tbTime">Time:</label>
                        <input type = "time" id = "tbTime">
                    </div>
                    <div class="addChild2">
                        <p class="add">Task:</p>
                        <textarea class = "add" id = "tbTask" cols = "40" rows = "5"></textarea>
                        <input class = "font" type = "file" id = "btnFile" />
                    </div>
                </div>
                <button class="standart | add" onclick="addTask()"> Add new task </button>
                <button class="standart | add" onclick="mainVis()"> Return </button>
            </div>
        </div>
        <div class="c">
            <div id = "authdiv" class = "center-auth">
                <h1> Auth </h1>
                <input class="auth" id="inputLogin" placeholder="login"/>
                <input class="auth" id="inputPassword" type="password" placeholder="password"/>
                <div class="authParent">
                    <button class="standart | add" onclick="auth()"> Login </button>
                    <button class="standart | add" onclick="regVis()"> Registration </button>
                </div>
            </div>
        </div>
        <div class="d">
            <div id = "regdiv" class = "center-add">
                <h1> Reg </h1>
                <input class="auth" id="inputLoginR" placeholder="login"/>
                <input class="auth" id="inputPasswordR" type="password" placeholder="password"/>
                <input class="auth" id="inputPasswordRepeatR" type="password" placeholder="repeat password"/>
                <div class="authParent">
                    <button class="standart | add" onclick="reg()"> Reg </button>
                    <button class="standart | add" onclick="authVis()"> Back </button>
                </div>
            </div>
        </div>
    </div>`);
}

function fourZeroOne() {
	select = document.getElementById('regdiv').style.visibility = "hidden";
	select = document.getElementById('adddiv').style.visibility = "hidden";
	select = document.getElementById('maindiv').style.visibility = "hidden";
	select = document.getElementById('authdiv').style.visibility = "visible";
	alert("Your session expired, please log in again.");
}

async function regVis() {
	select = document.getElementById('authdiv').style.visibility = "hidden";
	select = document.getElementById('regdiv').style.visibility = "visible";
}

async function authVis() {
	select = document.getElementById('regdiv').style.visibility = "hidden";
	select = document.getElementById('authdiv').style.visibility = "visible";
}

function addTaskVis() 
{
	select = document.getElementById('maindiv').style.visibility = "hidden";
	select = document.getElementById('adddiv').style.visibility = "visible";
}

function mainVis() 
{
	select = document.getElementById('adddiv').style.visibility = "hidden";
	select = document.getElementById('maindiv').style.visibility = "visible";
}

load();
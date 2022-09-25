const express = require("express");
const path = require('path');
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dataBase = require('./db.js');
const tokenBase = require('./tokens.js');
const http = require('http');
const { Server } = require("socket.io");
const siofu = require("socketio-file-upload");


const app = express();
const router = express.Router();
initCheck = 0;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);
app.use(siofu.router);

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

const server = http.createServer(app);
const io = new Server(server, {
    cookie: true
});

function checkTokenMiddleware(access) {
    try {
        jwt.verify(access, "smallSecret");
        console.log("Access alive");
        return true;
    }
    catch {
        return false;
    }
}

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('connection');

    socket.on('auth', async function(json) {
        if (!initCheck) {
            await dataBase.init();
            initCheck = 1;
        }

        json = JSON.parse(json);

        login = json["login"];
        pass = json["pass"];

        id = await dataBase.dbFindAuth(login, pass);
        if (id) {
            var result = await tokenBase.updateTokens(id, login);
        }
        if (result) {
            socket.emit("auth", JSON.stringify({"status": 200, "token": result["access"]}));
        }
        else {
            socket.emit("auth", JSON.stringify({"status": 401}));
        }
    });

    socket.on('tasks', async function(token) {
        if (checkTokenMiddleware(token)) {
            info = await dataBase.dbGetTasks();
            const tasks = JSON.stringify(info);
            socket.emit("tasks", JSON.stringify({"status": 200, "tasks": tasks}));
        }
        else {
            socket.emit("tasks", JSON.stringify({"status": 401}));
        }
    });

    socket.on('mark', async function(json) {
        json = JSON.parse(json);
        if (checkTokenMiddleware(json["token"])) {
            id = json["id"];
            status = json["status"];

            result = await dataBase.dbUpdateTaskStatus(parseInt(id), parseInt(status));
            if (result) {
                socket.emit("mark", JSON.stringify({"status": 200}));
                info = await dataBase.dbGetTasks();
                const tasks = JSON.stringify(info);
                io.emit("tasks", JSON.stringify({"status": 200, "tasks": tasks}));
            }
            else {
                socket.emit("mark", JSON.stringify({"status": 500}));
            }
        }
        else {
            socket.emit("mark", JSON.stringify({"status": 401}));
        }
    });

    socket.on('reg', async function(json) {
        if (!initCheck) {
            await dataBase.init();
            initCheck = 1;
        }

        json = JSON.parse(json);
        login = json["login"];
        pass = json["pass"];
        id = await dataBase.dbGetAuthLastId();
        id = id + 1;

        oldUser = await dataBase.dbExist(login);

        if (oldUser) {
            socket.emit("reg", 409);
            return;
        }

        const salt = await bcrypt.genSalt(10);
        encryptedPassword = await bcrypt.hash(pass, salt);

        const new_record = {id: id, login: login, pass: encryptedPassword, token: "0"};

        const result = await dataBase.dbAddUser(new_record);

        if (result) {
            socket.emit("reg", 200);
        }
        else {
            socket.emit("reg", 500);
        }
    });

    socket.on('newtask', async function(json) { 
        json = JSON.parse(json);
        if (checkTokenMiddleware(json["token"])) {
            id = await dataBase.dbGetDiaryLastId();
            id = id + 1;

            date = json["date"];
            time = json["time"];
            task = json["task"];
            file = json["file"];

            const path = __dirname + "/files/" + file;

            uploader = new siofu();
            uploader.dir = __dirname + "/files";
            uploader.listen(socket);
            uploader.on("saved", async function(event){
                console.log("file saved");

                const new_record = {id: id, time: time, date: date, task: task, status: 0, file: file};

                const result = await dataBase.dbAddTask(new_record);
                if (result) {
                    socket.emit('newtask', 200);
                    info = await dataBase.dbGetTasks();
                    const tasks = JSON.stringify(info);
                    io.emit("tasks", JSON.stringify({"status": 200, "tasks": tasks}));
                }
                else {
                    socket.emit('newtask', 500);
                }
            });
        }
        else {
            socket.emit('newtask', 401);
        }
    });
});



server.listen(3000, () => {
  console.log('listening on *:3000');
});
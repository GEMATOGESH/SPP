const express = require("express");
const path = require('path');
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const dataBase = require('./db.js');
const tokenBase = require('./tokens.js');

const app = express();
const router = express.Router();
const jsonParser = express.json();
const urlencodedParser = express.urlencoded({extended: false});

app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(cookieParser());

initCheck = 0;

async function checkTokenMiddleware(req, res, next) {
    const access = req.headers.authorization;
    try {
        jwt.verify(access, "smallSecret");
        console.log("Access alive");
        next();
    }
    catch {
        return res.sendStatus(401);
    }
}

app.put("/refresh", async function(req, res) {
    const refresh = req.cookies.authcookie;
    tokens = await tokenBase.checkToken(refresh);
    if (tokens) {
        res.cookie('authcookie', tokens["refresh"], {maxAge: 9999999, httpOnly:true});
        res.status(200);
        res.send(JSON.stringify(tokens["access"]));
        return;
    }
    res.sendStatus(401);
});

app.get("/tasks", checkTokenMiddleware, jsonParser, async function(req, res){
    info = await dataBase.dbGetTasks();
    const tasks = JSON.stringify(info);
    res.send(tasks);
});

app.post("/tasks", checkTokenMiddleware, jsonParser, async function(req, res){
    id = req.body.id;
    status = req.body.status;
    result = await dataBase.dbUpdateTaskStatus(parseInt(id), parseInt(status));
    res.send(result);
});

app.post("/newtask", checkTokenMiddleware, urlencodedParser, async function(req, res){
    id = await dataBase.dbGetDiaryLastId();
    id = id + 1;

    date = req.body.date;
    time = req.body.time;
    task = req.body.task;
    file = req.files.file;

    const path = __dirname + "/files/" + file.name;
    file.mv(path, (err) => {
        if (err) {
          return res.status(500).send(err);
        }
    });

    const new_record = {id: id, time: time, date: date, task: task, status: 0, file: file.name};

    const result = await dataBase.dbAddTask(new_record);

    res.send(result);
});

app.post("/reg", jsonParser, async function(req, res){
    if (!initCheck) {
        await dataBase.init();
        initCheck = 1;
    }

    login = req.body.login;
    pass = req.body.pass;
    id = await dataBase.dbGetAuthLastId();
    id = id + 1;

    oldUser = await dataBase.dbExist(login);

    if (oldUser) {
        return res.status(409).send("User already exist. Please Login");
    }

    const salt = await bcrypt.genSalt(10);
    encryptedPassword = await bcrypt.hash(pass, salt);

    const new_record = {id: id, login: login, pass: encryptedPassword, token: "0"};

    const result = await dataBase.dbAddUser(new_record);

    res.send(result);
});

app.post("/auth", jsonParser, async function(req, res){
    if (!initCheck) {
        await dataBase.init();
        initCheck = 1;
    }

    login = req.body.login;
    pass = req.body.pass;

    id = await dataBase.dbFindAuth(login, pass);
    if (id) {
        var result = await tokenBase.updateTokens(id, login);
    }
    if (result) {
        res.cookie('authcookie', result["refresh"], {maxAge: 9999999, httpOnly:true});
        res.status(200);
        res.send(JSON.stringify(result["access"]));
    }
    else {
        res.status(401).send("Wrong login or pass");
    }
});

app.put("/logout", jsonParser, async function(req, res){
    res.cookie('authcookie', "0", {maxAge: 9999999, httpOnly:true});
    res.sendStatus(200);
});

   
app.use('/', router);
app.listen(3000);

console.log('Running at Port 3000');
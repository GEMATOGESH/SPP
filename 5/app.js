const express = require("express");
const path = require('path');
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { graphql, buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');

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


const schema = buildSchema(`
    type Query {
        getTasks(token: String): String
        markTask(token: String, id: String, status: String): String
        newTask(token: String, date: String, time: String, name: String, file: String, task: String): String
        reg(login: String, pass: String): String
        auth(login: String, pass: String): String
    }
`);


async function checkTokenMiddleware(access) {
    try {
        jwt.verify(access, "smallSecret");
        console.log("Access alive");
        return true;
    }
    catch {
        return false;
    }
}

async function getTasks() {
    info = await dataBase.dbGetTasks();
    const tasks = JSON.stringify(info);
    return JSON.stringify({code: 200, tasks: tasks});
}

async function mark(id, status) {
    result = await dataBase.dbUpdateTaskStatus(parseInt(id), parseInt(status));
    return JSON.stringify({code: 200, result: result});
}

async function newTask(date, time, name, file, task){
    id = await dataBase.dbGetDiaryLastId();
    id = id + 1;

    const new_record = {id: id, time: time, date: date, task: task, status: 0, file: name};

    const result = await dataBase.dbAddTask(new_record);
    return JSON.stringify({code: 200, result: result});
}

async function reg(login, pass) {
    if (!initCheck) {
        await dataBase.init();
        initCheck = 1;
    }
    id = await dataBase.dbGetAuthLastId();
    id = id + 1;

    oldUser = await dataBase.dbExist(login);

    if (oldUser) {
        return JSON.stringify({code: 409});
    }

    const salt = await bcrypt.genSalt(10);
    encryptedPassword = await bcrypt.hash(pass, salt);

    const new_record = {id: id, login: login, pass: encryptedPassword, token: "0"};

    const result = await dataBase.dbAddUser(new_record);

    return JSON.stringify({code: 200, result: result});
}

async function auth(login, pass){
    if (!initCheck) {
        await dataBase.init();
        initCheck = 1;
    }

    id = await dataBase.dbFindAuth(login, pass);
    if (id) {
        var result = await tokenBase.updateTokens(id, login);
    }
    if (result) {
        return JSON.stringify({code: 200, token: result["access"]});
    }
    else {
        return JSON.stringify({code: 401});
    }
}
 
var root = {
    auth: async function ({login, pass}) {
        return await auth(login, pass);
    },
    getTasks: async function ({token}) {
        if (checkTokenMiddleware(token)) {
            return await getTasks();
        }
        else {
            return JSON.stringify({code: 401});
        }
    },
    markTask: async function ({token, id, status}) {
        if (checkTokenMiddleware(token)) {
            return await mark(id, status);
        }
        else {
            return JSON.stringify({code: 401});
        }
    },
    newTask: async function ({token, date, time, name, file, task}) {
        if (checkTokenMiddleware(token)) {
            return await newTask(date, time, name, file, task);
        }
        else {
            return JSON.stringify({code: 401});
        }
    },
    reg: async function ({login, pass}) {
        return await reg(login, pass);
    }
};

app.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
app.listen(3000);

console.log('Running at Port 3000');

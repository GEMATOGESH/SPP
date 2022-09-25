const express = require("express");
const path = require('path');
const ejs = require('ejs');
const MongoClient = require("mongodb").MongoClient;   
const fileUpload = require("express-fileupload");

const app = express();
const router = express.Router();
const jsonParser = express.json();
const urlencodedParser = express.urlencoded({extended: false});
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

const url = "mongodb://localhost:27017/";
const mongoClient = new MongoClient(url);
let db;
let dbo;


async function dbGet() {
    db = await MongoClient.connect(url);
    dbo = db.db("diary");
    const collection = await dbo.collection("main").find({}).toArray();
    return collection;
}

async function dbGetLastId() {
    const collection = await dbo.collection("main").find({}).toArray();
    let id = collection[collection.length - 1];
    if (!id) {
        id = 0;
    } else {
        id = id["id"];
    }
    return id;
}

async function dbAdd(new_record) {
    const result = await dbo.collection("main").insertOne(new_record);
    return result;
}

async function dbUpdate(id, status) {
    const result = await dbo.collection("main").updateOne({id: id}, { $set: {status : status} });
    return result;
}

app.get("/tasks", async function(req, res){
    const info = await dbGet();
    const tasks = JSON.stringify(info);
    res.send(tasks);
});

app.post("/tasks", jsonParser, async function(req, res){
    id = req.body.id;
    status = req.body.status;
    result = await dbUpdate(parseInt(id), parseInt(status));
    res.send(result);
});

app.post("/newtask", urlencodedParser, async function(req, res){
    let id = await dbGetLastId();
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

    const result = await dbAdd(new_record);

    res.send(result);
});
   
app.use('/', router);
app.listen(3000);

console.log('Running at Port 3000');
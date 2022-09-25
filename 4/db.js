const MongoClient = require("mongodb").MongoClient; 
const bcrypt = require('bcrypt');

const url = "mongodb://localhost:27017/";
const mongoClient = new MongoClient(url);
let db;

const init = async function() {
    db = await MongoClient.connect(url);
    console.log("Database initialized");
}

const dbGetTasks = async function() {
    dbDiary = db.db("diary").collection("main");
    const collection = await dbDiary.find({}).toArray();
    return collection;
}

async function dbGetLastId(doc) {
    const collection = await doc.find({}).toArray();
    let id = collection[collection.length - 1];
    if (!id) {
        id = 0;
    } else {
        id = id["id"];
    }
    return id;
}

const dbGetDiaryLastId = async function() {
    dbDiary = db.db("diary").collection("main");
    return await dbGetLastId(dbDiary);
}

const dbGetAuthLastId = async function() {
    collection = db.db("diary");
    dbAuth = collection.collection("diary.auth");
    return await dbGetLastId(dbAuth);
}

const dbExist = async function(login) {
    dbAuth = db.db("diary").collection("diary.auth");
    collection = await dbAuth.find({"login" : login}).toArray();
    return collection.length;
}

const dbAddTask = async function(new_record) {
    const result = await dbDiary.insertOne(new_record);
    return result;
}

const dbAddUser = async function(new_record) {
    const result = await dbAuth.insertOne(new_record);
    return result;
}

const dbUpdateTaskStatus = async function(id, status) {
    const result = await dbDiary.updateOne({id: id}, { $set: {status : status} });
    return result;
}

const dbFindAuth = async function(login, pass) {
    dbAuth = db.db("diary").collection("diary.auth");
    const collection = await dbAuth.find({"login": login}).toArray();
    if (collection.length == 0) {
        return false;
    }
    result = await bcrypt.compare(pass, collection[0]["pass"]);
    if (result) {
        return collection[0]["id"];
    }
    return false;
}

const dbUpdateToken = async function(login, token) {
    result = await dbAuth.updateOne({"login": login}, {$set: {token: token}});
    return result;
}

const dbGetLoginByToken = async function(token) {
    dbAuth = db.db("diary").collection("diary.auth");
    login = await dbAuth.find({"token": token}).toArray();
    login = login[0];
    return login;
}

module.exports = {
    init, dbGetTasks, dbGetDiaryLastId, dbGetAuthLastId, dbExist, dbAddTask, dbAddUser, dbUpdateTaskStatus, dbFindAuth, dbUpdateToken, dbGetLoginByToken
}
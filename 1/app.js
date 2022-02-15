const express = require("express");
const path = require('path');
const ejs = require('ejs');
const MongoClient = require("mongodb").MongoClient;   
const fileUpload = require("express-fileupload");

const app = express();
const router = express.Router();
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

router.get('/', async function(req,res) {
    const collection = await dbGet();
    const count = collection.length;

    let filter = -1;
    if (req.query.filter !== undefined) {
        filter = req.query.filter;
    }

	ejs.renderFile('./public/index.ejs', {collection : collection, count : count, filter: parseInt(filter)}, 
		function (error, result) {
        if (error) {
            throw error;
        } else {
            res.end(result);
        }
    });
});

router.post('/', urlencodedParser, async function(req,res) {
    let id = req.body.id;
    let status = 1;
    if (req.body.status == 0) {
        status = 0;
    }

    const result = await dbUpdate(parseInt(id), parseInt(status));
    if (!result) {
        res.end("DB error");
    }

    const collection = await dbGet();
    const count = collection.length;

    res.redirect("/");
});

router.get('/add',function(req,res){
    if (!db) {
        return res.sendStatus(502);
    }

    ejs.renderFile('./public/add.ejs', 
        function (error, result) {
        if (error) {
            throw error;
        } else {
            res.end(result);
        }
    });
});

router.post("/add", urlencodedParser, async function (req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }

    let id = await dbGetLastId();
    id = id + 1;

    const time = req.body.tbTime;
    const date = req.body.tbDate;
    const task = req.body.tbTask;
    const file = req.files.btnFile;

    const path = __dirname + "/files/" + file.name;
    file.mv(path, (err) => {
        if (err) {
          return res.status(500).send(err);
        }
    });

    const new_record = {id: id, time: time, date: date, task: task, status: 0, file: file.name};

    const result = await dbAdd(new_record);
    if (!result) {
        res.end("DB error");
    }

    res.redirect("/");
});
   
app.use('/', router);
app.use('/add', router);
app.listen(3000);

console.log('Running at Port 3000');
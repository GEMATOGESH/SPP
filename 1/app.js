const express = require("express");
const path = require('path');
const ejs = require('ejs');
const router = express.Router();

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

router.get('/',function(req,res){
	ejs.renderFile('./public/index.ejs', 
		function (error, result) {
        if (error) {
            throw error;
        } else {
            res.end(result);
        }
    });
});

router.get('/23',function(req,res){
	ejs.renderFile('./public/23.ejs', 
		function (error, result) {
        if (error) {
            throw error;
        } else {
            res.end(result);
        }
    });
});
   
app.use('/', router);
app.use('/23', router);
app.listen(3000);

console.log('Running at Port 3000');
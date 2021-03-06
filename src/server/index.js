
/*
var ReactEngine = require('express-react-engine');
var express = require("express");
var path = require("path");

var app = express();
app.set('views', __dirname + '../../App/components');
//app.engine('jsx', ReactEngine());
app.engine('jsx', ReactEngine({wrapper: 'html.jsx'}));
app.use(express.static(path.join(__dirname,"../../dist")));


app.all('/*', function(req, res) {
  res.render('html.jsx', { foo: 'bar' });
});
console.log(app)
app.listen(7777,function(){
    console.log("Started listening on port", 7777);
})*/
var config = require('config');
console.log(config)
var express = require("express");
var path = require("path");
var compression = require('compression')
//var {constanst:{PORT,HOST}} = require("../../webpack/constanst.js");


var app = express();
app.use(compression({level:-1}))
app.use(express.static(path.join(__dirname,"../../dist")));
app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../dist', 'index.html'));
});

app.get('/SC/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../dist/SC', 'index.html'));
});
app.listen(config.PORT,config.HOST,function(){
    console.log("HHCloud client start in port: "+config.PORT+", host: "+config.HOST);
})

var express = require('express');
var http = require('http');
var path = require('path');
var config = require('./config.json');
var basecamp = require('basecamp');
var util = require('util');

var app = express();

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser(config.express.sessionkey));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.errorHandler());

var client = new basecamp.Client(config.basecamp.id, config.basecamp.secret, config.basecamp.redirect, config.basecamp.useragent);

app.get('/',function(req,res) {
	var authNewUrl = client.getAuthNewUrl();
	res.send(200,util.format('<a href="%s">Authorize</a> %s',authNewUrl,req.sessionID));
});

app.get('/authorize',function(req,res) {
	client.authNewCallback(req, res, function(error, userInfo) {
		if (error) {
			console.log(error);
		} else {
			console.log(userInfo);
			req.session.userInfo = userInfo;
		}
	});
});

http.createServer(app).listen(config.express.port, function(){
	console.log('Express server listening');
});
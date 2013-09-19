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
var accounts = {};

app.get('/identity',function(req,res) {
	if (req.session.userInfo) {
		res.send(200,req.session.userInfo.identity);
	} else {
		res.send(200,{
			'link': client.getAuthNewUrl()
		});
	}
});

app.get('/authorize',function(req,res) {
	client.authNewCallback(req, res, function(error, userInfo) {
		if (error) {
			console.log(error);
			res.send(500);
		} else {
			req.session.userInfo = userInfo;
			res.header('Location','/');
		}
	});
});

app.get('/account',function(req,res) {
	if (accounts[req.sessionID]) {
		res.send(200,accounts[req.sessionID].account);
	} else {
		res.send(200);
	}
});

app.get('/accounts',function(req,res) {
	if (req.session.userInfo) {
		var accounts = [];
		req.session.userInfo.accounts.forEach(function(item) {
			if (item.product == 'bcx') {
				accounts.push(item);
			}
		});
		res.send(200,accounts);
	} else {
		res.send(200);
	}
});

app.post('/account',function(req,res) {
	if (req.body.id) {
		new basecamp.Account(client, req.body.id, req.session.userInfo.refresh_token, function(error, account) {
			if (error) {
				console.log(error);
				res.send(500);
			} else {
				accounts[req.sessionID] = account;
				res.send(200,accounts[req.sessionID].account);
			}
		});
	} else {
		res.send(500);
	}
});

app.get('/projects',function(req,res) {
	if (accounts[req.sessionID]) {
		accounts[req.sessionID].req('get_projects',function(error, result) {
			// result.sort(function(a,b) {
			// 	var dateA = Date.parse(a);
			// 	var dateB = Date.parse(b);
			// 	console.log(dateA);
			// 	return dateB - dateA;
			// }); 
			// TODO: Figure out date parsing in node
			res.send(200,result);
		});
	} else {
		res.send(500);
	}
});

app.get('/todolists/:projectid',function(req,res) {
	if (accounts[req.sessionID] && req.params.projectid) {
		var project = new basecamp.Project(accounts[req.sessionID], req.params.projectid);
		project.req('get_todolists', {}, function(error, result) {
			if (error) {
				console.log(error);
				res.send(500);
			} else {
				res.send(200,result);
			}
		});
	} else {
		res.send(500)
	}
});

http.createServer(app).listen(config.express.port, function(){
	console.log('Express server listening');
});
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var express = require('express');
var app = express();

var watchSetRouter = require('./routes/watch_set');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set('env', 'development');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));


app.get('/', function (req, resp, next) {
    resp.render('index.jade');
});

app.use('/watch_set', watchSetRouter);

module.exports = app;

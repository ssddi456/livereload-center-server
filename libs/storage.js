var nedb = require('nedb');
var path = require('path');
var fs = require('fs');

var storage = new nedb({ filename: path.join(__dirname, '../data/watch_list.db' ), autoload: true});
storage.persistence.setAutocompactionInterval(30*6e3);

module.exports = storage;

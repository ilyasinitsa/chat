const net = require('net');
const fs = require('fs');

let fileServer = net.createServer(socket => {

  var chunks = [];

}).listen(9967, '127.0.0.1', () => {console.log('File server is running')});
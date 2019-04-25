const net = require('net');

let fileServer = net.createServer(socket => {

  socket.on('data', data => {

  });

}).listen(9967, '127.0.0.1', () => {console.log('File server is running')});
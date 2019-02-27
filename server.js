const dgram = require('dgram');
const net = require('net');

var clients = Array();

const udpServer = dgram.createSocket('udp4');

udpServer.on('listening', () => {
    let address = udpServer.address();
    console.log('UDP-сервер слушает ' + address.address + ':' + address.port);
});

udpServer.on('message', (msg) => {
    console.log('Получено сообщение (UDP): ' + msg);
});

udpServer.bind(9967, '127.0.0.1');

const tcpServer = net.createServer( function (socket) {
    console.log('Пользователь подключился');

    socket.setEncoding('utf8');

    clients.push(socket);

    socket.on('data', (data) => {
        console.log('Получено сообщение (TCP): ' +  data);
        clients.forEach(client => {
            client.write(data);
        });
    });

    socket.on('end', () => {
        console.log('Пользователь отключился');
    });

}).listen(9966, '127.0.0.1');
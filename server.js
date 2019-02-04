const net = require('net');

var sockets = Array();

const tcpServer = net.createServer(function (socket) {
    console.log('Юзер '+ socket.localAddress + ':' + socket.localPort +' подключился');

    socket.setEncoding('utf8');
    sockets.push(socket);

    socket.on('data', (data) => {
        console.log(data);
        sockets.forEach((elem) =>{
            elem.write(data);
        });
    });

    socket.on('end', () => {
        console.log('Пользователь отключился');
    });
});

tcpServer.listen(1234, '127.0.0.1');
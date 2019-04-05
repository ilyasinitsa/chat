const dgram = require('dgram');
const net = require('net');
const mysql = require('mysql');

//Создание списка TCP подключений
var clients = Array();

//Подключение к базе данных
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'messenger'
});
conn.connect();

//Создание UDP сервера
const udpServer = dgram.createSocket('udp4');

udpServer.on('listening', () => {
    console.log('UDP-сервер запущен');
});

udpServer.on('message', (msg) => {
    console.log('Получено сообщение (UDP): ' + msg);
    clients.forEach(client => {
        udpServer.send(msg, 9967, client.localAddress);
    });
});

udpServer.bind(9967, '127.0.0.1');

//Создание TCP сервера
const tcpServer = net.createServer( function (socket) {
    console.log('Пользователь подключился');
    
    socket.setEncoding('utf8');
    
    //Обработка сообщений
    socket.on('data', (data) => {
        let message = JSON.parse(data);
        //Авторизация
        if (message.type == 'login') {
            //Проверка, существует ли пользователь
            conn.query('SELECT COUNT(*) AS cnt, id_user FROM user WHERE EXISTS ( SELECT * FROM login_password WHERE login = "' + message.login + '" AND password = "' + message.password + '")', (err, result) => {
                if (result[0].cnt != 0) {
                    clients.push(socket);
                    conn.query('UPDATE user SET last_entry ="' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '" WHERE id_user = ' + result[0].id_user + ';')
                    socket.write(JSON.stringify({
                        type: 'login-confirm',
                        
                        confirm: true
                    }));
                }
                else {
                    socket.write(JSON.stringify({
                        type: 'login-confirm',
                        confirm: false
                    }));
                }
            });
        }
        else if (message.type == 'message') {
            console.log(message.sender + ": " + message.content);
            clients.forEach(client => {
                client.write(JSON.stringify(message));
            });
        }
    });
    
    socket.on('end', () => {
        console.log('Пользователь отключился');
        clients.splice(clients.indexOf(socket), 1);
    });
    
}).listen(9966, '127.0.0.1',() => console.log('TCP-сервер запущен'));
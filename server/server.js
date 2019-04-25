const net = require('net');
const mysql = require('mysql');

//Создание списка TCP подключений
var clients = Array();

//Подключение к базе данных
const conn = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'messenger'});
conn.connect();
 
//Создание TCP сервера
const tcpServer = net.createServer( function (socket) {
    console.log('User connected ' + socket.remoteAddress + ':' + socket.remotePort);

    socket.setEncoding('utf8');
    
    //Обработка сообщений
    socket.on('data', (data) => {
        let message = JSON.parse(data);

        if (message.type === 'login') {
            conn.query('SELECT COUNT(*) AS cnt, id_user FROM user WHERE id_login_password IN ( SELECT id_login_password FROM login_password WHERE login = "' + message.login + '" AND password = "' + message.password + '")', (err, result) => {
                if (result[0].cnt != 0) {
                    clients.push({
                        userID: result[0].id_user,
                        socket: socket
                    });

                    conn.query('UPDATE user SET online = 1 WHERE id_user ="' + result[0].id_user + '";');

                    socket.write(JSON.stringify({
                        type: 'login-confirm',
                        confirm: true,
                        autoLogin: message.autoLogin
                    }));
                }
            });
        } else if (message.type === 'message') {
            console.log(message.sender + ": " + message.content);
            clients.forEach(client => {
                client.socket.write(JSON.stringify(message));
            });
        } else if (message.type === 'get-groups') {
            conn.query('SELECT name FROM room INNER JOIN room_user ON room.id_room = room_user.id_room INNER JOIN user ON room_user.id_user = user.id_user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login = "' + message.sender + '"', (err, result) => {
                if (Object.keys(result).length != 0) {
                    socket.write(JSON.stringify({
                        type: 'groups-list',
                        groups: result
                    }));
                }
            });
        } else if (message.type === 'group-online-get') {
            conn.query('SELECT COUNT(user.online) AS cnt FROM room INNER JOIN room_user ON room.id_room = room_user.id_room INNER JOIN user ON room_user.id_user = user.id_user WHERE room.name = "' + message.groupName + '" AND user.online = 1', (err, result) => {
                socket.write(JSON.stringify({
                    type: 'group-online-get-result',
                    groupOnline: result[0].cnt
                }));               
            });
        }
    });

    socket.on('end', () => {
        console.log('User disconnected');
        if (clients.findIndex(x => x.socket == socket) >= 0) {
            conn.query('UPDATE user SET online = 0 WHERE id_user = ' + clients.find(x => x.socket == socket).userID + ';');
            clients.splice(clients.findIndex(x => x.socket == socket), 1);
        }
    });
    
}).listen(9966, '127.0.0.1', () => console.log('Server is running'));
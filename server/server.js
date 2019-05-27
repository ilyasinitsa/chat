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

        if (message.type === 'REQ_AUTHORIZATION') { //Обработка авторизации
            conn.query('SELECT COUNT(*) AS cnt, id_user FROM user WHERE id_login_password IN ( SELECT id_login_password FROM login_password WHERE login = "' + message.login + '" AND password = "' + message.password + '")', (err, result) => {
                if (result[0].cnt != 0) {
                    socket.userID = result[0].id_user;
                    clients.push(socket);

                    conn.query('UPDATE user SET online = 1 WHERE id_user ="' + result[0].id_user + '";');

                    socket.write(JSON.stringify({
                        type: 'REQ_AUTHORIZATION_RESULT',
                        confirm: true,
                    }));
                } else {
                    socket.write(JSON.stringify({
                        type: 'REQ_AUTHORIZATION_RESULT',
                        confirm: false
                    }));
                }
            });
        } else if (message.type === 'REQ_MESSAGE') { //Обработка сообщений
            if (message.messageType === 'group') {
                conn.query('INSERT INTO `group_messages` SET id_group = (SELECT id_group FROM `group` WHERE `group`.`name` = "' + message.groupName + '"), id_sender = (SELECT id_user FROM user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login_password.login = "' + message.sender + '"), message = "' + message.content + '", send_time = "' + message.sendTime + '";', (err, result) => {
                    conn.query('SELECT user.id_user FROM user INNER JOIN group_user on user.id_user = group_user.id_user INNER JOIN `group` ON group_user.id_group = `group`.`id_group` WHERE `group`.name = "' + message.groupName + '" AND user.online = 1', (err, result) => {
                        for (i in result) {
                            clients.find(x => x.userID == result[i].id_user).write(JSON.stringify(message));
                        }
                    });
                });
            } else {
                
            }
        } else if (message.type === 'REQ_GROUPLIST') { //Отправка списка групп пользователю
            conn.query('SELECT name FROM `group` INNER JOIN group_user ON `group`.id_group = group_user.id_group INNER JOIN user ON group_user.id_user = user.id_user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login = "' + message.sender + '"', (err, result) => {
                if (Object.keys(result).length != 0) {
                    socket.write(JSON.stringify({
                        type: 'REQ_GROUPLIST_RESULT',
                        groups: result
                    }));
                }
            });
        } else if (message.type === 'REQ_GROUPONLINE') { //Отправка количества пользователей в сети группы
            conn.query('SELECT COUNT(user.online) AS cnt FROM `group` INNER JOIN group_user ON `group`.id_group = group_user.id_group INNER JOIN user ON group_user.id_user = user.id_user WHERE `group`.name = "' + message.groupName + '" AND user.online = 1', (err, result) => {
                socket.write(JSON.stringify({
                    type: 'REQ_GROUPONLINE_RESULT',
                    groupOnline: result[0].cnt
                }));               
            });
        } else if (message.type === 'REQ_FRIENDSLIST') {
            //
        } else if (message.type === 'REQ_GROUPDATA') {
            groupData = {};
            groupData.type = 'REQ_GROUPDATA_RESULT';
            
            conn.query('SELECT login_password.login, group_messages.message, group_messages.send_time FROM group_messages INNER JOIN user ON group_messages.id_sender = user.id_user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE id_group IN (SELECT `group`.id_group FROM `group` WHERE `group`.name = "' + message.groupName + '")', (err, result) => {
                groupData.groupMessages = result;
            });

            conn.query('SELECT COUNT(user.online) AS cnt FROM `group` INNER JOIN group_user ON `group`.id_group = group_user.id_group INNER JOIN user ON group_user.id_user = user.id_user WHERE `group`.name = "' + message.groupName + '" AND user.online = 1', (err, result) => {
                groupData.groupOnline = result[0].cnt;                
                socket.write(JSON.stringify(groupData));
            });

        } else if (message.type === 'REQ_DIRECTMESSAGES') {
            //
        } else if (message.type === 'REQ_SIGNOUT') {
            //
        }

        setInterval(() => {
            conn.query('SELECT 1');
        }, 5000);
    });

    socket.on('end', () => {
        console.log('User disconnected');
        if (clients.length > 0) {
            conn.query('UPDATE user SET online = 0 WHERE id_user = ' + clients.find(x => x == socket).userID + ';');
            clients.splice(clients.findIndex(x => x == socket), 1);
        }
    });
    
}).listen(9966, '127.0.0.1', () => console.log('Server is running'));
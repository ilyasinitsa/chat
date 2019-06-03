const net = require('net');
const mysql = require('mysql');

//Создание списка TCP подключений
var clients = Array();

//Подключение к базе данных
const conn = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'messenger'});
conn.connect();
 
setInterval(() => {
    conn.query('SELECT 1');
}, 5000);

//Создание TCP сервера
const tcpServer = net.createServer( function (socket) {
    console.log('User connected ' + socket.remoteAddress + ':' + socket.remotePort);

    socket.setEncoding('utf8');
    
    //Обработка запросов
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
                conn.query('INSERT INTO `group_messages` SET id_group = (SELECT id_group FROM `group` WHERE `group`.`name` = "' + message.groupName + '"), id_sender = ' + socket.userID + ', message = "' + message.content + '", send_time = "' + message.sendTime + '";', (err, result) => {
                    conn.query('SELECT user.id_user FROM user INNER JOIN group_user on user.id_user = group_user.id_user INNER JOIN `group` ON group_user.id_group = `group`.`id_group` WHERE `group`.name = "' + message.groupName + '" AND user.online = 1', (err, result) => {
                        for (i in result) {
                            clients.find(x => x.userID == result[i].id_user).write(JSON.stringify(message));
                        }
                    });
                });
            } else {
                conn.query('INSERT INTO direct_messages SET id_sender = ' + socket.userID + ', id_receiver = SELECT id_user FROM user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login_password.login = "' + message.receiver + '"), message = "' + message.content + ', send_time = "' + message.sendTime + '";', (err, result) => {
                    conn.query('SELECT user.id_user, user.online FROM user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login_password.login = "' + message.receiver + '";', (err, result) => {
                        socket.write(JSON.stringify(message));
                        if (result[0].online === 1) {
                            clients.find(x => x.userID === result[0].id_user).write(JSON.stringify(message));
                        }
                    });
                });
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
        } else if (message.type === 'REQ_FRIENDSLIST') {
            //
        } else if (message.type === 'REQ_GROUPDATA') {
            groupData = {type: 'REQ_GROUPDATA_RESULT'};
            
            conn.query('SELECT login_password.login, group_messages.message, group_messages.send_time FROM group_messages INNER JOIN user ON group_messages.id_sender = user.id_user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE id_group IN (SELECT `group`.id_group FROM `group` WHERE `group`.name = "' + message.groupName + '")', (err, result) => {
                groupData.groupMessages = result;
            });

            conn.query('SELECT COUNT(user.online) AS cnt FROM `group` INNER JOIN group_user ON `group`.id_group = group_user.id_group INNER JOIN user ON group_user.id_user = user.id_user WHERE `group`.name = "' + message.groupName + '" AND user.online = 1', (err, result) => {
                groupData.groupOnline = result[0].cnt;                
                socket.write(JSON.stringify(groupData));
            });

        } else if (message.type === 'REQ_USERDATA') {
            conn.query('SELECT personal_data.name, personal_data.last_name, login_password.login FROM user INNER JOIN personal_data ON user.id_personal_data = personal_data.id_personal_data INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE user.id_user =' + socket.userID + ';', (err, result) => {
                socket.write(JSON.stringify({
                    type: 'REQ_USERDATA_RESULT',
                    userName: result[0].name,
                    userLastName: result[0].last_name,
                    userLogin: result[0].login
                }));
            });
        } else if (message.type === 'REQ_USERDATAUPDATE') {
            conn.query('UPDATE personal_data SET name = "' + message.userName + '", last_name = "' + message.userLastName + '" WHERE id_personal_data = (SELECT id_personal_data FROM user WHERE id_user = ' + socket.userID + ');', (err, result) => {
                conn.query('UPDATE login_password SET login = "' + message.userLogin +'" WHERE id_login_password = (SELECT id_login_password FROM user WHERE id_user = ' + socket.userID + ');');
            });
        } else if (message.type === 'REQ_GROUPCREATE') {
            inviteCode = groupInviteCodeGeneration();
            conn.query('INSERT INTO `group` SET name ="' + message.groupName + '", code ="' + inviteCode + '", creator = ' + socket.userID + ';');
            conn.query('INSERT INTO group_user SET id_group = (SELECT id_group FROM `group` WHERE code = "' + inviteCode + '"), id_user = ' + socket.userID + ';');
            socket.write(JSON.stringify({
                type: 'REQ_GROUPCREATE_RESULT',
                inviteCode: inviteCode 
            }))
        } else if (message.type === 'REQ_FRIENDLIST') {
            conn.query('SELECT login FROM friend_list INNER JOIN user ON friend_list.id_friend = user.id_user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE friend_list.id_user = ' + socket.userID + ';', (err, result) => {
                socket.write(JSON.stringify({
                    type: 'REQ_FRIENDLIST_RESULT',
                    friends: result
                }));
            });
        } else if (message.type === 'REQ_FRIENDDATA') {
            friendData = {type: 'REQ_FRIENDDATA_RESULT'};

            conn.query('SELECT personal_data.name, personal_data.last_name, user.online FROM user INNER JOIN personal_data ON user.id_personal_data = personal_data.id_personal_data INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login_password.login = "' + message.friendLogin + '";', (err, result) => {
                friendData.friendName = result[0].name;
                friendData.friendLastName = result[0].last_name;
                friendData.friendStatus = result[0].online;
            });
            
            conn.query('SELECT user.id_user FROM user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE login_password.login = "' + message.friendLogin + '";', (err, result) => {
                friendID = result[0].id_user;
                conn.query('SELECT login_password.login, direct_messages.message, direct_messages.send_time FROM direct_messages INNER JOIN user ON direct_messages.id_sender = user.id_user INNER JOIN login_password ON user.id_login_password = login_password.id_login_password WHERE ((id_sender = ' + socket.userID + ' AND id_receiver = ' + friendID + ') OR (id_sender = ' + friendID + ' AND id_receiver = ' + socket.userID + '));', (err, result) => {
                    friendData.friendMessages = result;
                    socket.write(JSON.stringify(friendData));
                });
            });
        }
    });

    socket.on('end', () => {
        console.log('User disconnected');
        if (clients.length > 0) {
            conn.query('UPDATE user SET online = 0 WHERE id_user = ' + clients.find(x => x == socket).userID + ';');
            clients.splice(clients.findIndex(x => x == socket), 1);
        }
    });
}).listen(9966, '127.0.0.1', () => console.log('Server is running'));

const groupInviteCodeGeneration = () => {
    return Math.random().toString(36).substr(2, 8);
}
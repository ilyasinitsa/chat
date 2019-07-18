const electron = require('electron');
const net = require('net');
const moment = require('moment');
const ipc = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let appWindow;
let loginWindow;
let tcpClient;
let fileClient;
let login;

//Вход в программу
ipc.on('login', (event, arg) => {
    login = arg.login;
    tcpClient.write(JSON.stringify({
        type: 'REQ_AUTHORIZATION',
        login: arg.login,
        password: arg.password
    }));
});

//Отправка сообщения на сервер
ipc.on('message-send', (event, arg) => {
    if (arg.messageType === 'group') {
        tcpClient.write(JSON.stringify({
            type: 'REQ_MESSAGE',
            sender: login,
            messageType: arg.messageType,
            groupName: arg.groupName,
            content: arg.messageText,
            sendTime: moment().format("YYYY-MM-DD HH:mm:ss")
        }));
    } else {
        tcpClient.write(JSON.stringify({
            type: 'REQ_MESSAGE',
            sender: login,
            messageType: arg.messageType,
            receiver: arg.receiver,
            content: arg.messageText,
            sendTime: moment().format("YYYY-MM-DD HH:mm:ss")
        }));
    }
});

//Запрос на получение комнат
ipc.on('get-groups', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPLIST',
        sender: login
    }));
});

//Запрос на получение списка групп
ipc.on('group-data-get', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPDATA',
        groupName: arg
    }));
});

//Запрос на получение пользовательских данных
ipc.on('user-data-get', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_USERDATA'
    }));
});

//Запрос на сохранение изменений пользовательских данных
ipc.on('user-data-changes-save', (event, arg) => {
    login = arg.login;
    tcpClient.write(JSON.stringify({
        type: 'REQ_USERDATAUPDATE',
        userName: arg.name,
        userLastName: arg.lastName,
        userLogin: arg.login
    }));
});

//Запрос на создание группы
ipc.on('group-create', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPCREATE',
        groupCreator: login,
        groupName: arg
    }));
});

//Запрос на получение списка друзей
ipc.on('get-friends', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_FRIENDLIST',
        sender: login
    }));
});

//Запрос на получение информации о друге
ipc.on('friend-data-get', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_FRIENDDATA',
        friendLogin: arg
    }));
});

//Запрос на создание окна регистрации
ipc.on('register-window-create', event => {
    registrationWindow = new BrowserWindow({width: 375, height: 500, parent: loginWindow, modal: true, frame: false, maximizable: false, minimizable: false, resizable: false, webPreferences: {nodeIntegration: true}});
    registrationWindow.loadFile('./app/register/register.html');
});

//Запрос на регистрацию пользователя
ipc.on('register', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_REGISTRATION',
        lastName: arg.lastName,
        name: arg.name,
        email: arg.email,
        login: arg.login,
        password: arg.password
    }));
});

ipc.on('group-join', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPJOIN',
        inviteCode: arg
    }));
});

ipc.on('group-sign-out', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPSIGNOUT',
        groupName: arg
    }));
});

//Запуск приложения
app.on('ready', () => {
    tcpSetup();
    createWindow();
});

//Выход из приложения
app.on('window-all-closed', () => {
    app.quit();
    // fileClient.end();
    tcpClient.end();
});

// Создание окон
const createWindow = () => {
    splashScreen = new BrowserWindow({width: 350, height: 350, frame: false, show: false, alwaysOnTop: true, webPreferences: {nodeIntegration: true}});
    splashScreen.loadFile('./app/splashscreen/loading.html');

    loginWindow = new BrowserWindow({width: 550, height: 480, frame: false, show: false, maximizable: false, resizable: false, minimizable: false, webPreferences: {nodeIntegration: true}});
    loginWindow.setMenu(null);

    loginWindow.loadFile('./app/login/index.html');
    
    splashScreen.once('ready-to-show', ()=> {
        splashScreen.show();
    });

    loginWindow.once('ready-to-show', () => {
        splashScreen.destroy();
        loginWindow.show();
    });
}

//Создание TCP подключения
const tcpSetup = () => {
    tcpClient = net.createConnection(9966, '127.0.0.1');

    tcpClient.setEncoding('utf8');

    tcpClient.on('data', (data) => {
        message = JSON.parse(data);
        if (message.type === 'REQ_AUTHORIZATION_RESULT') {
            if (message.confirm) {
                appWindow = new BrowserWindow({minWidth: 800, minHeight: 600, frame: false, useContentSize: true, webPreferences: {nodeIntegration: true}});
                appWindow.setMenu(null);
                appWindow.webContents.openDevTools();
                appWindow.loadFile('./app/index.html');
                loginWindow.destroy();
            } else {
                loginWindow.webContents.send('login-error', '');
            }
        } else if (message.type === 'REQ_MESSAGE') {
            appWindow.webContents.send('message-display', message);  
        } else if (message.type === 'REQ_GROUPLIST_RESULT') {
            appWindow.webContents.send('groups-display', message.groups);
        } else if (message.type === 'REQ_GROUPDATA_RESULT') {
            appWindow.webContents.send('group-data-display', message);
        } else if (message.type === 'REQ_USERDATA_RESULT') {
            appWindow.webContents.send('user-data-display', message);
        } else if (message.type === 'REQ_GROUPCREATE_RESULT') {
            appWindow.webContents.send('group-invite-code-display', message);
        } else if (message.type === 'REQ_FRIENDLIST_RESULT') {
            appWindow.webContents.send('friends-display', message.friends);
        } else if (message.type === 'REQ_FRIENDDATA_RESULT') {
            appWindow.webContents.send('friend-data-display', message);
        } else if (message.type === 'REQ_REGISTRATION_RESULT') {
            if (message.error === 'no') {
                registrationWindow.destroy();
            } else {
                registrationWindow.webContents.send('registration-error', message.error);
            }
        } else if (message.type === 'REQ_GROUPJOIN_RESULT') {
            appWindow.webContents.send('group-join-result', message.error);
        }
    });
}

// const fileTransferSetup = () => {
//     fileClient = net.createConnection(9967, '127.0.0.1');
// }
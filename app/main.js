const electron = require('electron');
const net = require('net');
const moment = require('moment');
const ipc = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let appWindow;
let loginWindow;
let tcpClient;
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
    }
});

//Запрос на получение комнат
ipc.on('get-groups', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPLIST',
        sender: login
    }));
});

ipc.on('group-online-get', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPONLINE',
        groupName: arg
    }));
});

ipc.on('group-data-get', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'REQ_GROUPDATA',
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
    tcpClient.end();
});

// Создание окон
const createWindow = () => {
    splashScreen = new BrowserWindow({width: 350, height: 350, frame: false, show: false, alwaysOnTop: true, webPreferences: {nodeIntegration: true}});
    splashScreen.loadFile('./app/splashscreen/loading.html');

    loginWindow = new BrowserWindow({width: 550, height: 480, frame: false, show: false, maximizable: false, minimizable: false, webPreferences: {nodeIntegration: true}});
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
        } else if (message.type === 'REQ_GROUPONLINE_RESULT') {
            appWindow.webContents.send('group-online-display', message.groupOnline);
        } else if (message.type === 'REQ_GROUPDATA_RESULT') {
            appWindow.webContents.send('group-messages-display', message);
        }
    });
}
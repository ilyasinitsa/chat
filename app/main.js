const electron = require('electron');
const net = require('net');
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
        type: 'login',
        login: arg.login,
        password: arg.password
    }));
});

//Отправка сообщения на сервер
ipc.on('message-send', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'message',
        sender: login,
        content: arg
    }));
});

//Запрос на получение комнат
ipc.on('get-groups', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'get-groups',
        sender: login
    }));
});

ipc.on('group-online-get', (event, arg) => {
    tcpClient.write(JSON.stringify({
        type: 'group-online-get',
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
    splashScreen = new BrowserWindow({width: 350, height: 350, frame: false, show: false, alwaysOnTop: true});
    splashScreen.loadFile('./app/splashscreen/loading.html');

    loginWindow = new BrowserWindow({width: 550, height: 480, frame: false, show: false});
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
        if (message.type === 'login-confirm') {
            if (message.confirm) {
                appWindow = new BrowserWindow({minWidth: 800, minHeight: 600, frame: false, useContentSize: true});
                appWindow.setMenu(null);
                appWindow.webContents.openDevTools();
                appWindow.loadFile('./app/index.html');
                loginWindow.destroy();
            }
        } else if (message.type === 'message') {
            appWindow.webContents.send('message-print', data);  
        } else if (message.type === 'groups-list') {
            appWindow.webContents.send('groups-display', message.groups);
        } else if (message.type === 'group-online-get-result') {
            appWindow.webContents.send('group-online-get-result', message.groupOnline);
        }
    });
}
const ipc = require('electron').ipcRenderer;
const customTitlebar = require('@inceldes/cet');
const greetings = ['Здравствуйте', 'Hello', 'Hola', 'Bonjour', 'Buenas Dias', 'Dzien dobry', 'Terve', 'Guten Tag', 'Прывітанне', 'Dobrý den', '今日は', '您好'];

new customTitlebar.Titlebar({
    menu: false,
    backgroundColor: customTitlebar.Color.fromHex('#444')
});

var login = document.getElementById('log_in');
var loginInput = document.getElementById('login');
var passwordInput = document.getElementById('password');
var alerts = document.getElementById('alert');

loginInput.focus();

function randomInteger(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

document.querySelector('h1').innerText = greetings[randomInteger(0, (greetings.length - 1))];

login.onmouseover = () => {
    login.style.backgroundColor = '#afafaf';
}

login.onmouseout = () => {
    login.style.backgroundColor = '#d2d2d2'; 
}

login.onclick = () => {
    alerts.innerText = '';
    let reg = /^[a-z0-9_-]{3,16}$/;
    if (reg.test(loginInput.value) && passwordInput.value != "") {
        ipc.send('login', {
            login: loginInput.value,
            password: passwordInput.value
        });
    }
    else {
        alerts.style.color = '#f00';
        alerts.innerText = 'Проверьте правильность данных';
    }
}

ipc.on('login-confirm', (event, arg) => {
    alerts.style.color = '#f00';
    alerts.innerText = 'Неправильный логин или пароль';
});
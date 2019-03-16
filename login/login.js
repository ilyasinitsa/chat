const ipc = require('electron').ipcRenderer;
const greetings = ['Здравствуйте', 'Hello', 'Hola', 'Bonjour', 'Buenas Dias', 'Dzien dobry', 'Terve', 'Guten Tag', 'Прывітанне', 'Dobrý den', '今日は', '您好'];

var login = document.getElementById('log_in');
var loginInput = document.getElementById('login');
var passwordInput = document.getElementById('password');

function randomInteger(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

document.querySelector('h1').innerText = greetings[randomInteger(0, (greetings.length - 1))];

login.onclick = () => {
    let reg = /^[a-z0-9_-]{3,16}$/;

}
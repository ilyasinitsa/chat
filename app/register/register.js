const ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;
const customTitlebar = require('custom-electron-titlebar');

new customTitlebar.Titlebar({
  menu: false,
  backgroundColor: customTitlebar.Color.fromHex('#444'),
  maximizable: false,
  minimizable: false
});

let registerButton = document.querySelector('#register-button');
let lastName = document.querySelector('#lastName');
let name = document.querySelector('#name');
let email = document.querySelector('#e-mail');
let login = document.querySelector('#login');
let password = document.querySelector('#password');

document.querySelectorAll('input').forEach(elem => {
  elem.oninput = () => {
    elem.style.boxShadow = '0 0 5px 0 #888888';
  }
});

registerButton.addEventListener('click', () => {
  let inputCheck = true;
  document.querySelectorAll('input').forEach(elem => {
    if (elem.value === '') {
      inputCheck = false;
      elem.style.boxShadow = '0 0 5px 0 red';
    }
  });
      if (inputCheck) {
        if(/\S+@\S+\.\S+/.test(email.value)) {
          ipc.send('register', {
            lastName: lastName.value,
            name: name.value,
            email: email.value,
            login: login.value,
            password: password.value,
          });
        } else {
          email.style.boxShadow = '0 0 5px 0 red';
        }
      }
});

ipc.on('registration-error', (event, arg) => {
  if (arg === 'email') {
    dialog.showErrorBox('Ошибка регистрации', 'Указаный электронный адрес уже существует');
  }
  if (arg === 'login') {
    dialog.showErrorBox('Ошибка регистрации', 'Указаный логин уже существует');
  }
});
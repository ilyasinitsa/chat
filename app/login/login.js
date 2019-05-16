const ipc = require('electron').ipcRenderer;
const customTitlebar = require('custom-electron-titlebar');
 
new customTitlebar.Titlebar({
    menu: false,
    backgroundColor: customTitlebar.Color.fromHex('#444')
});

var signInButton = document.getElementById('sign-in');
var rememberMeCheckbox = document.getElementById('remember-me');
var loginInput = document.getElementById('login-input');
var passwordInput = document.getElementById('password-input');

loginInput.focus();

signInButton.onclick = () => {
    let reg = /^[a-z0-9_-]{3,16}$/;
    loginInput.style.borderBottomColor = "#999999";
    passwordInput.style.borderBottomColor = "#999999";
    if (reg.test(loginInput.value) && passwordInput.value != "") {
        ipc.send('login', {
            login: loginInput.value,
            password: passwordInput.value,
            autoLogin: rememberMeCheckbox.checked
        });
    }
}

ipc.on('login-error', (event, arg) => {
    loginInput.style.borderBottomColor = "#ff0000";
    passwordInput.style.borderBottomColor = "#ff0000";
});
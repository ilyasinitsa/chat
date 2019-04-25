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
    if (reg.test(loginInput.value) && passwordInput.value != "") {
        ipc.sendSync('login', {
            login: loginInput.value,
            password: passwordInput.value,
            autoLogin: rememberMeCheckbox.checked
        });
    }
}
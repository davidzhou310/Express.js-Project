import "@babel/polyfill";

import { displayMap } from "./mapbox";
import { login, logout } from './login';
import { updateSettings } from "./updateSettings";

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-settings")

//DELEGATIONS
if (mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener("submit", e => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password  = document.getElementById("password").value;
        
        login(email, password);
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", e => {
        logout();
    });
}

if (userDataForm) {
    userDataForm.addEventListener("submit", async e => {
        e.preventDefault();

        const form = new FormData();
        form.append("email", document.getElementById("email").value);
        form.append("name", document.getElementById("name").value);
        form.append("photo", document.getElementById("photo").files[0]);

        await updateSettings(form, "data");
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener("submit", async e => {
        e.preventDefault();
        document.querySelector(".btn--save-password").textContent = "Updating...";

        const curPassword = document.getElementById("password-current").value;
        const newPassword = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password-confirm").value;

        await updateSettings({ curPassword, newPassword, passwordConfirm }, "password");

        document.querySelector(".btn--save-password").textContent = "save password";
        document.getElementById("password-current").value = '';
        document.getElementById("password").value = '';
        document.getElementById("password-confirm").value = '';
    });
}




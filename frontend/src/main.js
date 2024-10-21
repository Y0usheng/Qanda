import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

function create_div(labelText, type, id) {
    const div = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");

    label.innerText = labelText;

    input.id = id;
    input.type = type;

    div.appendChild(label);
    div.appendChild(input);
    return div;
}

function get_button(words, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = words;
    button.id = words;
    button.addEventListener("click", callback)
    return button;
};

function btn1() {
    console.log("Login button!")
}

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', init);

function init() {
    if (localStorage.getItem('authToken')) {
        renderDashboard();
    } else {
        renderLoginForm();
    }
}

function renderLoginForm() {
    const main = document.getElementById('main');
    clearElement(main);;

    const form = document.createElement("form");
    form.id = "loginForm";
    form.onsubmit = handleLogin;

    form.appendChild(create_div("Email", "email", "loginEmail"));
    form.appendChild(create_div("Password", "password", "loginPassword"));

    const loginButton = get_button("Login", btn1);
    loginButton.type = "submit";
    form.appendChild(loginButton);

    const registrationButton = get_button("Register");
    registrationButton.onclick = renderRegistrationForm;
    form.appendChild(registrationButton);

    main.appendChild(form);
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Login error: HTTP error! status: ${response.status}`);;
            return response.json();
        })
        .then(data => {
            if (!data) {
                showError(data.error);
            } else {
                console.log('Login successful', data);
                localStorage.setItem('authToken', data.token);
                alert('Login successful!');
                renderDashboard();
            }
        })
        .catch(error => {
            console.error('Login failed', error);
            showError('Invalid email or password.');
        });
}

function renderRegistrationForm() {
    const main = document.getElementById('main');
    clearElement(main);

    const form = document.createElement('form');
    form.id = 'registrationForm';
    form.onsubmit = handleRegistration;

    form.appendChild(create_div("Email", "email", "registerEmail"));
    form.appendChild(create_div("Name", "text", "registerName"));
    form.appendChild(create_div("Password", "password", "registerPassword"));
    form.appendChild(create_div("Confirm Password", "password", "confirmPassword"));

    const registerButton = get_button("Register");
    registerButton.type = "submit";
    form.appendChild(registerButton);

    const backToLoginButton = get_button("Back to Login");
    backToLoginButton.onclick = renderLoginForm;
    form.appendChild(backToLoginButton);

    main.appendChild(form);
}

function handleRegistration(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const name = document.getElementById('registerName').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    fetch(`http://localhost:${BACKEND_PORT}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Registration error: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Registration successful', data);
            alert('Registration successful!');
            localStorage.setItem('authToken', data.token);
            renderDashboard();
        })
        .catch(error => {
            console.error('Registration error', error);
            showError('Registration error: ' + error.message);
        });
}

// ------------ 2.1.3. Error Popup ------------ 
function showError(message) {
    let errorPopup = document.getElementById('errorPopup');
    if (!errorPopup) {
        errorPopup = document.createElement('div');
        errorPopup.id = 'errorPopup';
        errorPopup.style.position = 'fixed';
        errorPopup.style.left = '50%';
        errorPopup.style.top = '50%';
        errorPopup.style.transform = 'translate(-50%, -50%)';
        errorPopup.style.backgroundColor = 'white';
        errorPopup.style.border = '1px solid red';
        errorPopup.style.padding = '20px';
        errorPopup.style.zIndex = '1000';
        errorPopup.style.borderRadius = '10px';
        errorPopup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        const messageDiv = document.createElement('div');
        messageDiv.id = 'errorMessage';
        errorPopup.appendChild(messageDiv);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '10px';
        closeButton.style.border = 'none';
        closeButton.style.background = 'none';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '16px';
        closeButton.style.fontWeight = 'bold';
        closeButton.onclick = function () {
            errorPopup.style.display = 'none';
        };
        errorPopup.appendChild(closeButton);

        document.body.appendChild(errorPopup);
    }

    document.getElementById('errorMessage').textContent = message;
    errorPopup.style.display = 'block';
}


// ------------ 2.1.4. Dashboard ------------ 
function renderDashboard() {
    const main = document.getElementById('main');
    clearElement(main);;

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.onclick = handleLogout;
    main.appendChild(logoutButton);
}

function handleLogout() {
    localStorage.removeItem('authToken');
    renderLoginForm();
}

// ------------ 2.2.1. Making a thread ------------ 


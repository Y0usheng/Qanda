import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

const create_div = (labelText, type, id) => {
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

const get_button = (words, callback) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = words;
    button.id = words;
    button.addEventListener("click", callback)
    return button;
};

const btn1 = () => {
    console.log("Login button!")
}


document.addEventListener('DOMContentLoaded', init);

function init() {
    renderLoginForm();
}

function renderLoginForm() {
    const main = document.getElementById('main');
    const form = document.createElement("form");
    form.id = "loginForm";
    form.onsubmit = handleLogin;

    form.appendChild(create_div("Email", "email", "loginEmail"));
    form.appendChild(create_div("Password", "password", "loginPassword"));
    const loginButton = get_button("Login", btn1);
    loginButton.type = "submit";
    form.appendChild(loginButton);

    main.appendChild(form);
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to login');
            return response.json();
        })
        .then(data => {
            console.log('Login successful', data);
        })
        .catch(error => {
            console.error('Login failed', error);
            showError('Invalid email or password.');
        });
}

function showError(message) {
    let errorDiv = document.getElementById('errorDiv');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorDiv';
        errorDiv.style.color = 'red';
        const main = document.getElementById('main');
        main.appendChild(errorDiv);
    }

    errorDiv.textContent = message;
    clearTimeout(errorDiv.timeout);
    errorDiv.timeout = setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}


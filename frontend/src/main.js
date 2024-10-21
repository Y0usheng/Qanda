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
    main.innerHTML = '';

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

function renderRegistrationForm() {
    const main = document.getElementById('main');
    main.innerHTML = '';

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
            if (!response.ok) throw new Error('Registration failed');
            return response.json();
        })
        .then(data => {
            console.log('Registration successful', data);
            renderLoginForm();
        })
        .catch(error => {
            console.error('Registration error', error);
            showError(error.message);
        });
}


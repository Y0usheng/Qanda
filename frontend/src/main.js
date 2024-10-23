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

function createCheckbox(id, labelContent) {
    const div = document.createElement("div");
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    label.htmlFor = id;
    label.appendChild(document.createTextNode(labelContent));
    label.insertBefore(checkbox, label.firstChild);
    div.appendChild(label);
    return div;
}

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
    createSidebar();
    if (localStorage.getItem('authToken')) {
        renderDashboard();
    } else {
        renderLoginForm();
    }
}

function renderLoginForm() {
    const main = document.getElementById('main');
    clearElement(main);

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

    const CreateThreadButton = document.createElement('button');
    CreateThreadButton.textContent = 'Create Thread';
    CreateThreadButton.onclick = showCreateThreadScreen;
    main.appendChild(CreateThreadButton);

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
function showCreateThreadScreen() {
    const main = document.getElementById('main');
    clearElement(main);

    const form = document.createElement('form');
    form.id = 'createThreadForm';
    form.addEventListener('submit', handleCreateThreadSubmission);

    form.appendChild(create_div('Thread Title', 'text', 'threadTitle'));
    form.appendChild(create_div('Content', 'text', 'threadContent'));
    form.appendChild(createCheckbox('threadPublic', 'Make Public'));

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);

    main.appendChild(form);
}

function handleCreateThreadSubmission(event) {
    event.preventDefault();
    const title = document.getElementById('threadTitle').value;
    const content = document.getElementById('threadContent').value;
    const isPublic = document.getElementById('threadPublic').checked;

    const token = localStorage.getItem('authToken');

    fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, isPublic, content })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Thread creation error: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data) {
                console.log('Thread created successfully', data);
                alert('Thread created successfully!');
                renderThreadScreen(data.threadId);
            } else {
                throw new Error('Invalid thread data received');
            }
        })
        .catch(error => {
            console.error('Thread creation error', error);
            showError('Thread creation error: ' + error.message);
        });
}


// ------------ 2.2.2. Getting a List of Threads ------------ 
function createSidebar() {
    const main = document.getElementById('main');  // Assuming there's a 'main' container
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.width = '400px';
    sidebar.style.maxWidth = '400px';
    sidebar.style.height = '100vh'; // Adjust according to your layout
    sidebar.style.overflowY = 'auto';
    sidebar.style.position = 'fixed'; // Making it scroll independently of the main content
    sidebar.style.left = '0'; // Position it on the left
    sidebar.style.top = '0'; // Start at the top of the container
    sidebar.style.borderRight = '1px solid #ccc'; // Aesthetic border

    main.prepend(sidebar); // Prepend to ensure it appears at the start of the main container

    // Optionally load threads or any initial content into the sidebar
    loadThreads();
}

function loadThreads(StartIndex = 0) {
    const sidebar = document.getElementById('sidebar'); // Ensure this exists in your HTML or create it similarly
    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:${BACKEND_PORT}/threads?start=${StartIndex}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => response.json())
        .then(data => {
            data.forEach(thread => {
                const threadElement = createThreadElement(thread);
                sidebar.appendChild(threadElement);
            });
            if (data.length === 5) { // Assuming the API returns 5 threads at a time
                const moreButton = document.createElement('button');
                moreButton.textContent = 'More';
                moreButton.onclick = () => {
                    loadThreads(StartIndex + 5);
                    sidebar.removeChild(moreButton);
                };
                sidebar.appendChild(moreButton);
            }
        });
}


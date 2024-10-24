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

function create_checkbox(id, labelContent) {
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

function clear_element(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', init);

function init() {
    if (localStorage.getItem('authToken')) {
        render_dashboard();
    } else {
        render_login_form();
    }
}

function render_login_form() {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement("form");
    form.id = "loginForm";
    form.onsubmit = handle_login;

    form.appendChild(create_div("Email", "email", "loginEmail"));
    form.appendChild(create_div("Password", "password", "loginPassword"));

    const loginButton = get_button("Login", btn1);
    loginButton.type = "submit";
    form.appendChild(loginButton);

    const registrationButton = get_button("Register");
    registrationButton.onclick = render_register_form;
    form.appendChild(registrationButton);

    main.appendChild(form);
}

function handle_login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ email, password })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Login error: HTTP error! status: ${response.status}`);;
            return response.json();
        })
        .then(data => {
            if (!data) {
                error_popup_window(data.error);
            } else {
                console.log('Login successful', data);
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userRole', data.admin ? 'admin' : 'user');
                alert('Login successful!');
                render_dashboard();
            }
        })
        .catch(error => {
            console.error('Login failed', error);
            error_popup_window('Invalid email or password.');
        });
}

function render_register_form() {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'registrationForm';
    form.onsubmit = handle_register;

    form.appendChild(create_div("Email", "email", "registerEmail"));
    form.appendChild(create_div("Name", "text", "registerName"));
    form.appendChild(create_div("Password", "password", "registerPassword"));
    form.appendChild(create_div("Confirm Password", "password", "confirmPassword"));

    const registerButton = get_button("Register");
    registerButton.type = "submit";
    form.appendChild(registerButton);

    const backToLoginButton = get_button("Back to Login");
    backToLoginButton.onclick = render_login_form;
    form.appendChild(backToLoginButton);

    main.appendChild(form);
}

function handle_register(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const name = document.getElementById('registerName').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        error_popup_window('Passwords do not match.');
        return;
    }

    fetch(`http://localhost:${BACKEND_PORT}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
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
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userRole', data.admin ? 'admin' : 'user');
            render_dashboard();
        })
        .catch(error => {
            console.error('Registration error', error);
            error_popup_window('Registration error: ' + error.message);
        });
}

// ------------ 2.1.3. Error Popup ------------ 
function error_popup_window(message) {
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
function render_dashboard() {
    const main = document.getElementById('main');
    clear_element(main);;

    const CreateThreadButton = document.createElement('button');
    CreateThreadButton.textContent = 'Create Thread';
    CreateThreadButton.onclick = create_thread;
    main.appendChild(CreateThreadButton);

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.onclick = handle_logout;
    main.appendChild(logoutButton);

    load_threads();
}

function handle_logout() {
    localStorage.removeItem('authToken');
    render_login_form();
}

// ------------ 2.2.1. Making a thread ------------ 
function create_thread() {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'createThreadForm';
    form.addEventListener('submit', handle_thread_submission);

    form.appendChild(create_div('Thread Title', 'text', 'threadTitle'));
    form.appendChild(create_div('Content', 'text', 'threadContent'));
    form.appendChild(create_checkbox('threadPublic', 'Make Public'));

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);

    const create_thread_back = document.createElement('button');
    create_thread_back.textContent = 'Back';
    create_thread_back.onclick = render_dashboard;

    form.appendChild(create_thread_back);
    main.appendChild(form);
}

function handle_thread_submission(event) {
    event.preventDefault();
    const title = document.getElementById('threadTitle').value;
    const content = document.getElementById('threadContent').value;
    const isPublic = document.getElementById('threadPublic').checked;

    const token = localStorage.getItem('authToken');
    console.log('Retrieved token:', token);

    fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
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
                console.log('Thread created successfully', data, data.id);
                alert('Thread created successfully!');
                return get_thread_details(data.id);
            } else {
                throw new Error('Invalid thread data received');
            }
        })
        .then(fullThread => {
            render_single_thread(fullThread);
        })
        .catch(error => {
            console.error('Thread creation error', error);
            error_popup_window('Thread creation error: ' + error.message);
        });
}


// ------------ 2.2.2. Getting a List of Threads ------------ 
function load_threads(StartIndex = 0) {
    const main = document.getElementById('main');
    const token = localStorage.getItem('authToken');
    console.log('Retrieved token:', token);
    fetch(`http://localhost:${BACKEND_PORT}/threads?start=${StartIndex}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => response.json())
        .then(data => {
            data.forEach(thread => {
                const threadElement = create_thread_div(thread);
                main.appendChild(threadElement);
            });
            if (data.length === 5) {
                const moreButton = document.createElement('button');
                moreButton.textContent = 'More';
                moreButton.onclick = () => {
                    load_threads(StartIndex + 5);
                    main.removeChild(moreButton);
                };
                main.appendChild(moreButton);
            }
        });
}

function get_thread_details(threadId) {
    const token = localStorage.getItem('authToken');

    return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch thread details: HTTP error ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Failed to fetch thread details:', error);
            throw error;
        });
}


function create_thread_div(thread) {
    const threadDiv = document.createElement('div');
    threadDiv.className = 'thread-box';
    threadDiv.style.maxHeight = '100px';
    threadDiv.style.cursor = 'pointer';

    get_thread_details(thread)
        .then(fullThread => {
            threadDiv.textContent = `Title: ${fullThread.title}, Body content: ${fullThread.content}, Number of likes: ${fullThread.likes.length}`;
            threadDiv.addEventListener('click', () => {
                render_single_thread(fullThread);
            });
        })
        .catch(error => {
            console.error('Error fetching thread details:', error);
            threadDiv.textContent = 'Failed to load thread details';
        });
    return threadDiv;
}

// ------------ 2.2.3. Individual Thread Screen ------------ 
function render_single_thread(thread) {
    const main = document.getElementById('main');
    clear_element(main);

    const thread_single_detail = document.createElement('div');
    thread_single_detail.className = 'single-thread-detail';

    const titleElement = document.createElement('h2');
    titleElement.textContent = `Title: ${thread.title}`;

    const contentElement = document.createElement('p');
    contentElement.textContent = `Body content: ${thread.content}`;

    const likesElement = document.createElement('p');
    likesElement.textContent = `Number of likes: ${thread.likes.length}`;

    thread_single_detail.appendChild(titleElement);
    thread_single_detail.appendChild(contentElement);
    thread_single_detail.appendChild(likesElement);

    const check_user_is_creator = localStorage.getItem('userId') === thread.creatorId.toString();
    const check_user_is_admin = localStorage.getItem('userRole') === 'admin';

    console.log(check_user_is_creator, localStorage.getItem('userId'), thread.creatorId);
    console.log(check_user_is_admin, localStorage.getItem('userRole'));

    if (check_user_is_creator || check_user_is_admin) {
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => render_edit_thread_screen(thread);
        thread_single_detail.appendChild(editButton);
    }

    const single_thread_back = document.createElement('button');
    single_thread_back.textContent = 'Back';
    single_thread_back.onclick = render_dashboard;

    main.appendChild(thread_single_detail);
    main.appendChild(single_thread_back);
}

// ------------ 2.3.1. Editing a thread ------------ 
function render_edit_thread_screen(thread) {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'editThreadForm';
    form.addEventListener('submit', (event) => handle_thread_edit(event, thread.id));

    const titleInputDiv = create_div('Thread Title', 'text', 'editThreadTitle');
    const contentInputDiv = create_div('Content', 'text', 'editThreadContent');
    const publicCheckboxDiv = create_checkbox('editThreadPublic', 'Make Public');
    const lockedCheckboxDiv = create_checkbox('editThreadLocked', 'Lock Thread');

    const titleInput = titleInputDiv.querySelector('input');
    const contentInput = contentInputDiv.querySelector('input');
    const publicCheckbox = publicCheckboxDiv.querySelector('input');
    const lockedCheckbox = lockedCheckboxDiv.querySelector('input');

    titleInput.value = thread.title;
    contentInput.value = thread.content;
    publicCheckbox.checked = thread.isPublic;
    lockedCheckbox.checked = thread.lock;
    console.log(thread)

    form.appendChild(titleInputDiv);
    form.appendChild(contentInputDiv);
    form.appendChild(publicCheckboxDiv);
    form.appendChild(lockedCheckboxDiv);

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save';
    form.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => render_single_thread(thread);
    form.appendChild(cancelButton);

    main.appendChild(form);
}

function handle_thread_edit(event, threadId) {
    event.preventDefault();

    const title = document.getElementById('editThreadTitle').value;
    const content = document.getElementById('editThreadContent').value;
    const isPublic = document.getElementById('editThreadPublic').checked;
    const isLocked = document.getElementById('editThreadLocked').checked;

    const token = localStorage.getItem('authToken');

    fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: threadId, title, content, isPublic, isLocked }),
    })
        .then(response => {
            if (!response.ok) throw new Error(`Thread update error: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(updatedThread => {
            console.log('Thread updated successfully', updatedThread);
            alert('Thread updated successfully!');
            render_single_thread(updatedThread);
        })
        .catch(error => {
            console.error('Thread update error', error);
            error_popup_window('Thread update error: ' + error.message);
        });
}


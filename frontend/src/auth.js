//frontend/src/auth.js
import { api } from './api.js';
import { clear_element, create_div, get_button } from './utils.js';
import { showNotification } from './helpers.js';

// ------------ Login ------------ 
/**
 * Render the login form 
 * @param {Function} onLoginSuccess - Callback function to be called on successful login
 */
export function render_login_form(onLoginSuccess) {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement("form");
    form.id = "loginForm";
    form.onsubmit = (event) => handle_login(event, onLoginSuccess);

    form.appendChild(create_div("Email", "email", "loginEmail"));
    form.appendChild(create_div("Password", "password", "loginPassword"));

    const loginButton = get_button("Login");
    loginButton.type = "submit";
    form.appendChild(loginButton);

    const registrationButton = get_button("Register");
    registrationButton.onclick = () => {
        render_register_form(onLoginSuccess);
    };
    form.appendChild(registrationButton);

    main.appendChild(form);
}

// ------------ Registration ------------ 
/**
 * render register form
 */
export function render_register_form(onLoginSuccess) {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'registrationForm';
    form.onsubmit = (event) => handle_register(event, onLoginSuccess);

    form.appendChild(create_div("Email", "email", "registerEmail"));
    form.appendChild(create_div("Name", "text", "registerName"));
    form.appendChild(create_div("Password", "password", "registerPassword"));
    form.appendChild(create_div("Confirm Password", "password", "confirmPassword"));

    const registerButton = get_button("Register");
    registerButton.type = "submit";
    form.appendChild(registerButton);

    const backToLoginButton = get_button("Back to Login");
    backToLoginButton.onclick = () => {
        render_login_form(onLoginSuccess);
    };
    form.appendChild(backToLoginButton);

    main.appendChild(form);
}

/**
 * render login logic
 */
async function handle_login(event, onLoginSuccess) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await api.auth.login(email, password);

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);

        const userDetails = await api.user.get(data.userId);

        const userRole = userDetails.admin ? 'admin' : 'user';
        localStorage.setItem('userRole', userRole);
        console.log('Login successful!', userDetails);
        showNotification('Login successful!', 'success');
        if (onLoginSuccess) {
            onLoginSuccess();
        }
    } catch (error) {
        console.error('Login failed', error);
        showNotification('Invalid email or password.', 'error');
    }
}

/**
 * render register logic
 */
async function handle_register(event, onLoginSuccess) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const name = document.getElementById('registerName').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    try {
        const data = await api.auth.register(email, name, password);

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);

        const userDetails = await api.user.get(data.userId);

        const userRole = userDetails.admin ? 'admin' : 'user';
        localStorage.setItem('userRole', userRole);

        showNotification('Registration successful!', 'success');
        if (onLoginSuccess) {
            onLoginSuccess();
        }
    } catch (error) {
        console.error('Registration error', error);
        showNotification('Registration error: ' + error.message, 'error');
    }
}

/**
 * Handle user logout
 * @param {Function} onLogout - Callback function to be called on logout
 */
export function handle_logout(onLogout) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    if (onLogout) {
        onLogout();
    }
}
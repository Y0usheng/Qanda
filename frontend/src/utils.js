// frontend/src/utils.js

export function create_div(labelText, type, id) {
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

export function get_button(words, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = words;
    button.id = words;
    if (callback) {
        button.addEventListener("click", callback);
    }
    return button;
};

export function create_checkbox(id, labelContent) {
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

export function clear_element(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

export function create_checkbox(id, labelContent) {
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

export function get_time_since(timestamp) {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - commentTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute(s) ago`;
    else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour(s) ago`;
    else if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day(s) ago`;
    else return `${Math.floor(diffInSeconds / 604800)} week(s) ago`;
}

export function create_user_name_element(userId, onProfileClick) {
    const userNameElement = document.createElement('a');
    userNameElement.style.cursor = 'pointer';
    userNameElement.className = 'username';
    userNameElement.href = '#';
    userNameElement.textContent = 'Loading...';

    api.user.get(userId)
        .then(user => {
            userNameElement.textContent = user.name && user.name.trim() !== '' ? user.name : `User ${userId}`;
            userNameElement.addEventListener('click', (event) => {
                event.preventDefault();
                if (onProfileClick) onProfileClick(userId);
            });
        })
        .catch(error => {
            console.error('Failed to fetch user name', error);
            userNameElement.textContent = 'Unknown User';
        });

    return userNameElement;
}
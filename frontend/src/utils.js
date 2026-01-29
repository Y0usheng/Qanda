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
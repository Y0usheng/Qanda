import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

const create_div = (labelText, type, id) => {
    const div = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");

    label.innerText = labelText;
    label.htmlFor = id;

    input.id = id;
    input.type = type;

    div.appendChild(label);
    div.appendChild(input);
    return div;
}

const get_button = (words) => {
    const button = document.createElement("button");
    button.innerText = words;
    button.type = "button";
    button.id = "test";
    return button;
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.createElement("form");
    form.id = "loginForm";

    form.appendChild(create_div("Email", "email", "loginEmail"));
    form.appendChild(create_div("Password", "password", "loginPassword"));
    form.appendChild(get_button("Login"));

    const main = document.getElementById("main");
    main.appendChild(form);
});

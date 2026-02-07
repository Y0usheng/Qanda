// frontend/src/profile.js
import { api } from './api.js';
import { fileToDataUrl, showNotification } from './helpers.js';
import { clear_element, create_div, get_button } from './utils.js';

// ------------ Viewing a profile ------------ 
export async function render_profile(userId, callbacks) {
    try {
        const user = await api.user.get(userId);
        display_user_profile(user, callbacks);
        load_user_threads(userId, callbacks);
    } catch (error) {
        console.error('Failed to fetch user profile', error);
        showNotification('Failed to fetch user profile: ' + error.message, 'error');
    };
}

function display_user_profile(user, callbacks) {
    const main = document.getElementById('main');
    clear_element(main);

    const profileDiv = document.createElement('div');
    profileDiv.className = 'profile-box';

    if (user.image && user.image.trim() !== '') {
        const profileImage = document.createElement('img');
        profileImage.className = 'profile-image';
        profileImage.src = user.image;
        profileImage.alt = `${user.name || `User ${user.id}`}'s Profile Picture`;
        profileImage.style.width = '150px';
        profileImage.style.height = '150px';
        profileImage.style.borderRadius = '50%';
        profileDiv.appendChild(profileImage);
    } else {
        const noImageText = document.createElement('p');
        noImageText.textContent = 'Image: null';
        profileDiv.appendChild(noImageText);
    }

    const nameHeading = document.createElement('h2');
    const userName = user.name && user.name.trim() !== '' ? user.name : `User ${user.id}`;
    nameHeading.textContent = `${userName}'s Profile`;
    profileDiv.appendChild(nameHeading);

    const emailParagraph = document.createElement('p');
    emailParagraph.textContent = `Email: ${user.email && user.email.trim() !== '' ? user.email : 'null'}`;
    profileDiv.appendChild(emailParagraph);

    const adminParagraph = document.createElement('p');
    adminParagraph.textContent = `Admin: ${user.admin ? 'Yes' : 'No'}`;
    profileDiv.appendChild(adminParagraph);

    main.appendChild(profileDiv);

    const current_userRole = localStorage.getItem('userRole');
    const current_userId = parseInt(localStorage.getItem('userId'));

    if (current_userRole === 'admin' && current_userId !== user.id) {
        const adminSelectDiv = document.createElement('div');
        const adminLabel = document.createElement('label');
        adminLabel.innerText = 'User Role: ';

        const adminSelect = document.createElement('select');
        adminSelect.id = 'adminStatusSelect';

        const userOption = document.createElement('option');
        userOption.value = 'user';
        userOption.text = 'User';
        adminSelect.appendChild(userOption);

        const adminOption = document.createElement('option');
        adminOption.value = 'admin';
        adminOption.text = 'Admin';
        adminSelect.appendChild(adminOption);

        adminSelect.value = user.admin ? 'admin' : 'user';

        adminSelectDiv.appendChild(adminLabel);
        adminSelectDiv.appendChild(adminSelect);
        profileDiv.appendChild(adminSelectDiv);

        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.onclick = () => handle_update_admin_status(user.id, callbacks);
        profileDiv.appendChild(updateButton);
    }

    if (parseInt(localStorage.getItem('userId')) === user.id) {
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update Profile';
        updateButton.onclick = () => render_update_profile_form(callbacks);
        main.appendChild(updateButton);
    }

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.onclick = () => callbacks.onBack();
    main.appendChild(backButton);
}

// ------------ Loading a profile ------------ 
async function load_user_threads(userId, callbacks) {
    try {
        const threadIds = await api.thread.getList(0);

        const threadDetailPromises = threadIds.map(threadId => api.thread.get(threadId));
        const allThreads = await Promise.all(threadDetailPromises);

        const userThreads = allThreads.filter(thread => thread.creatorId === parseInt(userId));

        const main = document.getElementById('main');
        const threadsDiv = document.createElement('div');
        threadsDiv.className = 'threads-box';

        const heading = document.createElement('h3');
        heading.textContent = `${userThreads.length} Threads by User`;
        threadsDiv.appendChild(heading);

        userThreads.forEach(thread => {
            const threadElement = document.createElement('div');
            threadElement.className = 'thread-box';
            threadElement.style.cursor = 'pointer';

            const threadTitle = document.createElement('h4');
            threadTitle.textContent = thread.title;

            const threadContent = document.createElement('p');
            threadContent.textContent = thread.content;

            const threadInfo = document.createElement('p');
            threadInfo.textContent = `Likes: ${thread.likes.length}`;

            threadElement.appendChild(threadTitle);
            threadElement.appendChild(threadContent);
            threadElement.appendChild(threadInfo);

            threadElement.addEventListener('click', () => {
                if (callbacks.onThreadOpen) callbacks.onThreadOpen(thread);
            });
            threadsDiv.appendChild(threadElement);
        });

        main.appendChild(threadsDiv);
    } catch (error) {
        console.error('Failed to load user threads', error);
        showNotification('Failed to load user threads: ' + error.message, 'error');
    }
}

// ------------ Updating your profile ------------ 
function render_update_profile_form(callbacks) {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'updateProfileForm';
    form.onsubmit = (event) => handle_profile_update(event, callbacks);

    form.appendChild(create_div('Email', 'email', 'updateEmail'));
    form.appendChild(create_div('Name', 'text', 'updateName'));
    form.appendChild(create_div('Password', 'password', 'updatePassword'));

    const imageDiv = document.createElement('div');
    const imageLabel = document.createElement('label');
    imageLabel.innerText = 'Profile Image';
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.id = 'updateImage';
    imageInput.accept = 'image/png, image/jpeg';
    imageDiv.appendChild(imageLabel);
    imageDiv.appendChild(imageInput);
    form.appendChild(imageDiv);

    const saveButton = get_button('Save Changes');
    saveButton.type = 'submit';
    form.appendChild(saveButton);

    const cancelButton = get_button('Cancel');
    cancelButton.onclick = () => {
        const userId = localStorage.getItem('userId');
        render_profile(userId, callbacks);
    };
    form.appendChild(cancelButton);

    main.appendChild(form);
}

async function handle_profile_update(event, callbacks) {
    event.preventDefault();
    const userId = localStorage.getItem('userId')
    const email = document.getElementById('updateEmail').value;
    const name = document.getElementById('updateName').value;
    const password = document.getElementById('updatePassword').value;
    const imageFile = document.getElementById('updateImage').files[0];

    let profileData = { email, name, password };

    try {
        if (imageFile) {
            try {
                const dataUrl = await fileToDataUrl(imageFile);
                profileData.image = dataUrl;
            } catch (err) {
                throw new Error('Failed to process image file.');
            }
        }

        await api.user.update(profileData);
        showNotification('Profile updated successfully!', 'success');
        render_profile(userId, callbacks);
    } catch (error) {
        console.error('Failed to convert image to data URL:', error);
        showNotification('Failed to process image. Please try again.', 'error');
    };
}

// ------------ Updating someone as admin ------------ 
async function handle_update_admin_status(userId, callbacks) {
    const newRole = document.getElementById('adminStatusSelect').value;
    const isAdmin = newRole === 'admin';
    console.log(isAdmin, newRole)

    try {
        await api.user.setAdmin(userId, isAdmin);
        showNotification('User role updated successfully!', 'success');
        render_profile(userId, callbacks);
    } catch (error) {
        console.error('Failed to update user role', error);
        showNotification('Failed to update user role: ' + error.message, 'error');
    }
}
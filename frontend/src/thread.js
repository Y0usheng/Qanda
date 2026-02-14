// frontend/src/thread.js
import { api } from './api.js';
import { showNotification } from './helpers.js';
import {
    clear_element,
    create_div,
    create_checkbox,
    get_button,
    get_time_since,
    create_user_name_element
} from './utils.js';

// ------------ Making a thread ------------ 
export function render_create_thread_screen(callbacks) {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'createThreadForm';
    form.addEventListener('submit', (event) => handle_thread_submission(event, callbacks));

    form.appendChild(create_div('Thread Title', 'text', 'threadTitle'));
    form.appendChild(create_div('Content', 'text', 'threadContent'));
    form.appendChild(create_checkbox('threadPublic', 'Make Public'));

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);

    const backButton = get_button('Back', callbacks.onBack);
    form.appendChild(backButton);
    main.appendChild(form);
}

async function handle_thread_submission(event, callbacks) {
    event.preventDefault();
    const title = document.getElementById('threadTitle').value;
    const content = document.getElementById('threadContent').value;
    const isPublic = document.getElementById('threadPublic').checked;

    if (!title.trim()) {
        showNotification('Thread title cannot be empty', 'error');
        return;
    }

    if (!content.trim()) {
        showNotification('Thread content cannot be empty', 'error');
        return;
    }

    try {
        const data = await api.thread.create(title, isPublic, content);

        if (data && data.id) {
            console.log('Thread created successfully', data.id);
            showNotification('Thread created successfully!', 'success');

            const fullThread = await get_thread_details(data.id);

            render_single_thread(fullThread, callbacks);
        } else {
            throw new Error('Invalid thread data received');
        }
    } catch (error) {
        console.error('Thread creation error', error);
        showNotification(error.message || 'Error creating thread', 'error');
    }
}

async function get_thread_details(threadId) {
    try {
        return await api.thread.get(threadId);
    } catch (error) {
        console.error('Failed to fetch thread details:', error);
        throw error;
    }
}

// ------------ Getting a List of Threads ------------ 
export async function load_threads_list(container, callbacks, StartIndex = 0, limit = 10, sortBy = 'recent') {
    try {
        const data = await api.thread.getList(StartIndex, limit, sortBy);
        data.forEach(thread => {
            const threadElement = create_thread_div(thread, callbacks);
            container.appendChild(threadElement);
        });
        if (data.length === limit) {
            const moreButton = document.createElement('button');
            moreButton.textContent = 'More';
            moreButton.style.marginTop = '20px';
            moreButton.onclick = () => {
                load_threads_list(container, callbacks, StartIndex + limit, limit, sortBy);
                moreButton.remove();
            };
            container.appendChild(moreButton);
        } else if (data.length === 0 && StartIndex === 0) {
            container.textContent = 'No threads found.';
        }
    } catch (error) {
        console.error('Failed to load threads', error);
        showNotification('Failed to load threads: ' + error.message, 'error');
    };
}

function create_thread_div(thread, callbacks) {
    const threadDiv = document.createElement('div');
    threadDiv.className = 'thread-box';

    const threadId = (typeof thread === 'object') ? (thread.threadId || thread.id) : thread;
    if (!threadId) {
        console.error('Invalid thread data encountered:', thread);
        threadDiv.textContent = 'Error: Invalid thread data';
        return threadDiv;
    }

    get_thread_details(thread)
        .then(fullThread => {
            const threadContentDiv = document.createElement('div');
            threadContentDiv.className = 'thread-content';
            threadContentDiv.style.cursor = 'pointer'

            const threadTitle = document.createElement('h4');
            threadTitle.textContent = `Title: ${fullThread.title}`;

            const threadTime = document.createElement('span');
            threadTime.style.fontSize = '0.8em';
            threadTime.style.color = '#666';
            threadTime.style.marginLeft = '10px';

            threadTime.textContent = get_time_since(fullThread.createdAt);
            threadTitle.appendChild(threadTime);

            const threadContent = document.createElement('p');
            threadContent.textContent = `Body content: ${fullThread.content}`;

            const threadLikes = document.createElement('p');
            threadLikes.textContent = `Number of likes: ${fullThread.likes.length}`;

            threadContentDiv.appendChild(threadTitle);
            threadContentDiv.appendChild(threadContent);
            threadContentDiv.appendChild(threadLikes);

            threadDiv.appendChild(threadContentDiv);

            const userNameElement = create_user_name_element(fullThread.creatorId, callbacks.onProfile);
            threadDiv.appendChild(userNameElement);

            threadContentDiv.addEventListener('click', () => {
                render_single_thread(fullThread, callbacks);
            });
        })
        .catch(error => {
            console.error('Error fetching thread details:', error);
            threadDiv.textContent = 'Failed to load thread details';
        });

    return threadDiv;
}

// ------------ Individual Thread Screen ------------ 
export function render_single_thread(thread, callbacks) {
    const main = document.getElementById('main');
    clear_element(main);

    const thread_single_detail = document.createElement('div');
    thread_single_detail.className = 'single-thread-detail';

    const titleElement = document.createElement('h2');
    titleElement.textContent = `Title: ${thread.title}`;

    const timeElement = document.createElement('p');
    timeElement.style.color = 'gray';
    timeElement.style.fontSize = '0.9em';
    timeElement.textContent = `Posted: ${get_time_since_comment(thread.createdAt)}`;
    if (thread.updatedAt) {
        timeElement.textContent += ' (Edited)';
    }

    const statusElement = document.createElement('p');
    statusElement.textContent = `Status: ${thread.isPublic ? 'Public' : 'Private'}`;
    statusElement.style.color = 'grey';
    statusElement.style.fontSize = '0.8em';

    const contentElement = document.createElement('p');
    contentElement.textContent = `Body content: ${thread.content}`;

    const likesElement = document.createElement('p');
    likesElement.textContent = `Number of likes: ${thread.likes.length}`;

    thread_single_detail.appendChild(titleElement);
    thread_single_detail.appendChild(contentElement);
    thread_single_detail.appendChild(statusElement);
    thread_single_detail.appendChild(likesElement);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const currentUserId = parseInt(localStorage.getItem('userId'));
    const currentUserRole = localStorage.getItem('userRole');
    if (currentUserRole === 'admin' || currentUserId === thread.creatorId) {
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit Thread';
        editButton.style.backgroundColor = '#ffc107';
        editButton.style.color = 'black';
        editButton.style.marginRight = '10px';
        editButton.onclick = () => render_edit_thread_screen(thread);
        buttonContainer.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Thread';
        deleteButton.style.backgroundColor = '#dc3545';
        deleteButton.style.color = 'white';
        deleteButton.style.marginRight = '10px';
        deleteButton.onclick = () => handle_thread_delete(thread.id);
        buttonContainer.appendChild(deleteButton);
    }

    const likeButton = document.createElement('button');
    likeButton.id = 'likeButton';
    likeButton.disabled = thread.lock;
    likeButton.textContent = thread.likes.includes(parseInt(localStorage.getItem('userId'))) ? 'Unlike' : 'Like';
    likeButton.onclick = () => handle_thread_like(thread.id, !thread.likes.includes(parseInt(localStorage.getItem('userId'))));
    buttonContainer.appendChild(likeButton);

    const watchButton = document.createElement('button');
    watchButton.id = 'watchButton';
    watchButton.textContent = thread.watchees.includes(parseInt(localStorage.getItem('userId'))) ? 'Unwatch' : 'Watch';
    watchButton.onclick = () => handle_thread_watch(thread.id, !thread.watchees.includes(parseInt(localStorage.getItem('userId'))));
    buttonContainer.appendChild(watchButton);

    const single_thread_back = document.createElement('button');
    single_thread_back.textContent = 'Back';
    single_thread_back.onclick = render_dashboard;
    buttonContainer.appendChild(single_thread_back);

    thread_single_detail.appendChild(buttonContainer);
    main.appendChild(thread_single_detail);

    if (callbacks.onLoadComments) {
        callbacks.onLoadComments(thread.id, thread.lock);
    }
}

///////////////////////////////////////////////////////////////////////////
//////                      Thread Interactions                      //////
///////////////////////////////////////////////////////////////////////////

// ------------ Editing a thread ------------ 

function render_edit_thread_screen(thread, callbacks) {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'editThreadForm';
    form.addEventListener('submit', (event) => handle_thread_edit(event, thread.id, callbacks));

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

async function handle_thread_edit(event, threadId, callbacks) {
    event.preventDefault();

    const title = document.getElementById('editThreadTitle').value;
    const content = document.getElementById('editThreadContent').value;
    const isPublic = document.getElementById('editThreadPublic').checked;
    const lock = document.getElementById('editThreadLocked').checked;

    if (!title.trim()) {
        showNotification('Thread title cannot be empty', 'error');
        return;
    }

    if (!content.trim()) {
        showNotification('Thread content cannot be empty', 'error');
        return;
    }

    try {
        await api.thread.update(threadId, title, content, isPublic, lock);

        console.log('Thread updated successfully');
        showNotification('Thread updated successfully!', 'success');

        const fullThread = await get_thread_details(threadId);
        render_single_thread(fullThread, callbacks);

    } catch (error) {
        console.error('Thread update error', error);
        showNotification('Thread update error: ' + error.message, 'error');
    }
}

// ------------ Deleting a thread ------------ 
async function handle_thread_delete(threadId, callbacks) {
    if (!confirm('Are you sure you want to delete this thread?')) {
        return;
    }

    try {
        await api.thread.delete(threadId);
        console.log('Thread deleted successfully');
        showNotification('Thread deleted successfully!', 'success');
        if (callbacks.onBack) callbacks.onBack();
    }
    catch (error) {
        console.error('Thread delete error', error);
        showNotification('Thread delete error: ' + error.message, 'error');
    };
}

// ------------ Liking a thread ------------ 
async function handle_thread_like(threadId, isLike, callbacks) {
    try {
        await api.thread.like(threadId, isLike);

        const updatedThread = await get_thread_details(threadId);
        render_single_thread(updatedThread, callbacks);

    } catch (error) {
        console.error('Thread like/unlike error', error);
        showNotification('Thread like/unlike error: ' + error.message, 'error');
    }
}

// ------------ Watching a thread ------------ 
async function handle_thread_watch(threadId, isWatch, callbacks) {
    try {
        await api.thread.watch(threadId, isWatch);

        const updatedThread = await get_thread_details(threadId);
        render_single_thread(updatedThread, callbacks);

    } catch (error) {
        console.error('Thread watch/unwatch error', error);
        showNotification('Thread watch/unwatch error: ' + error.message, 'error');
    };
}

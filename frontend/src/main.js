import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
// api file
import { api } from './api.js';

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

///////////////////////////////////////////////////////////////////////////
//////          2.1. Milestone 1 - Registration & Login              //////
///////////////////////////////////////////////////////////////////////////

// ------------ 2.1.1. Login ------------ 
function render_login_form() {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement("form");
    form.id = "loginForm";
    form.onsubmit = handle_login;

    form.appendChild(create_div("Email", "email", "loginEmail"));
    form.appendChild(create_div("Password", "password", "loginPassword"));

    const loginButton = get_button("Login");
    loginButton.type = "submit";
    form.appendChild(loginButton);

    const registrationButton = get_button("Register");
    registrationButton.onclick = render_register_form;
    form.appendChild(registrationButton);

    main.appendChild(form);
}

async function handle_login(event) {
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
        alert('Login successful!');
        render_dashboard();
    } catch (error) {
        console.error('Login failed', error);
        error_popup_window('Invalid email or password.');
    }
}

// ------------ 2.1.2. Registration ------------ 
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

async function handle_register(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const name = document.getElementById('registerName').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        error_popup_window('Passwords do not match.');
        return;
    }

    try {
        const data = await api.auth.register(email, name, password);

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);

        const userDetails = await api.user.get(data.userId);

        const userRole = userDetails.admin ? 'admin' : 'user';
        localStorage.setItem('userRole', userRole);

        alert('Registration successful!');
        render_dashboard();

    } catch (error) {
        console.error('Registration error', error);
        error_popup_window('Registration error: ' + error.message);
    }
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
    clear_element(main);

    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';

    const actionButtonsDiv = document.createElement('div');
    actionButtonsDiv.className = 'action-buttons';

    const createThreadButton = get_button("Create Thread", create_thread);
    actionButtonsDiv.appendChild(createThreadButton);

    const viewProfileButton = get_button("View Profile", () => {
        const userId = localStorage.getItem('userId');
        render_profile(userId);
    });
    actionButtonsDiv.appendChild(viewProfileButton);
    const logoutButton = get_button("Logout", handle_logout);
    actionButtonsDiv.appendChild(logoutButton);

    dashboardContainer.appendChild(actionButtonsDiv);

    const threadsContainer = document.createElement('div');
    threadsContainer.className = 'threads-container';

    load_threads(threadsContainer);
    dashboardContainer.appendChild(threadsContainer);

    main.appendChild(dashboardContainer);
}


function handle_logout() {
    localStorage.removeItem('authToken');
    render_login_form();
}

///////////////////////////////////////////////////////////////////////////
//////          2.2. Milestone 2 - Making Threads                    //////
///////////////////////////////////////////////////////////////////////////

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

async function handle_thread_submission(event) {
    event.preventDefault();
    const title = document.getElementById('threadTitle').value;
    const content = document.getElementById('threadContent').value;
    const isPublic = document.getElementById('threadPublic').checked;

    try {
        const data = await api.thread.create(title, isPublic, content);

        if (data && data.id) {
            console.log('Thread created successfully', data.id);
            alert('Thread created successfully!');

            const fullThread = await get_thread_details(data.id);

            render_single_thread(fullThread);
        } else {
            throw new Error('Invalid thread data received');
        }
    } catch (error) {
        console.error('Thread creation error', error);
        error_popup_window(error.message);
    }
}

// ------------ 2.2.2. Getting a List of Threads ------------ 
async function load_threads(threadsContainer, StartIndex = 0) {
    try {
        const data = await api.thread.list(StartIndex);
        data.forEach(thread => {
            const threadElement = create_thread_div(thread);
            threadsContainer.appendChild(threadElement);
        });
        if (data.length === 5) {
            const moreButton = document.createElement('button');
            moreButton.textContent = 'More';
            moreButton.onclick = () => {
                load_threads(threadsContainer, StartIndex + 5);
                moreButton.remove();
            };
            threadsContainer.appendChild(moreButton);
        }
    } catch (error) {
        console.error('Failed to load threads', error);
        error_popup_window('Failed to load threads: ' + error.message);
    };
}


async function get_thread_details(threadId) {
    try {
        return await api.thread.get(threadId);
    } catch (error) {
        console.error('Failed to fetch thread details:', error);
        throw error;
    }
}


function create_thread_div(thread) {
    const threadDiv = document.createElement('div');
    threadDiv.className = 'thread-box';

    get_thread_details(thread)
        .then(fullThread => {
            const threadContentDiv = document.createElement('div');
            threadContentDiv.className = 'thread-content';

            const threadTitle = document.createElement('h4');
            threadTitle.textContent = `Title: ${fullThread.title}`;

            const threadContent = document.createElement('p');
            threadContent.textContent = `Body content: ${fullThread.content}`;

            const threadLikes = document.createElement('p');
            threadLikes.textContent = `Number of likes: ${fullThread.likes.length}`;

            threadContentDiv.appendChild(threadTitle);
            threadContentDiv.appendChild(threadContent);
            threadContentDiv.appendChild(threadLikes);
            threadContentDiv.style.cursor = 'pointer';

            threadDiv.appendChild(threadContentDiv);

            const userNameElement = create_user_name_element(fullThread.creatorId);
            threadDiv.appendChild(userNameElement);

            threadContentDiv.addEventListener('click', () => {
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

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

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

    load_comments(thread.id);
}


///////////////////////////////////////////////////////////////////////////
//////          2.3. Milestone 3 - Thread Interactions               //////
///////////////////////////////////////////////////////////////////////////

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



async function handle_thread_edit(event, threadId) {
    event.preventDefault();

    const title = document.getElementById('editThreadTitle').value;
    const content = document.getElementById('editThreadContent').value;
    const isPublic = document.getElementById('editThreadPublic').checked;
    const lock = document.getElementById('editThreadLocked').checked;

    try {
        await api.thread.update(threadId, title, content, isPublic, lock);

        console.log('Thread updated successfully');
        alert('Thread updated successfully!');

        const fullThread = await get_thread_details(threadId);
        render_single_thread(fullThread);

    } catch (error) {
        console.error('Thread update error', error);
        error_popup_window('Thread update error: ' + error.message);
    }
}

// ------------ 2.3.2. Deleting a thread ------------ 
async function handle_thread_delete(threadId) {
    if (!confirm('Are you sure you want to delete this thread?')) {
        return;
    }

    try {
        await api.thread.delete(threadId);
        console.log('Thread deleted successfully');
        alert('Thread deleted successfully!');
        redirect_to_latest_thread();
    }
    catch (error) {
        console.error('Thread delete error', error);
        error_popup_window('Thread delete error: ' + error.message);
    };
}

async function redirect_to_latest_thread() {
    try {
        const data = await api.thread.getList(0);
        console.log('Data received from server:', data, 'Show me 0', data[0]);
        if (Array.isArray(data) && data.length > 0) {
            const fullThread = await get_thread_details(data[0]);
            render_single_thread(fullThread);
        } else {
            alert('No threads available.');
            render_dashboard();
        }
    } catch (error) {
        console.error('Failed to load threads', error);
        error_popup_window('Failed to load threads: ' + error.message);
    };
}

// ------------ 2.3.3. Liking a thread ------------ xw
async function handle_thread_like(threadId, isLike) {
    try {
        await api.thread.like(threadId, isLike);

        const updatedThread = await get_thread_details(threadId);
        render_single_thread(updatedThread);

    } catch (error) {
        console.error('Thread like/unlike error', error);
        error_popup_window('Thread like/unlike error: ' + error.message);
    }
}

// ------------ 2.3.4. Watching a thread ------------ 
async function handle_thread_watch(threadId, isWatch) {
    try {
        await api.thread.watch(threadId, isWatch);

        const updatedThread = await get_thread_details(threadId);
        render_single_thread(updatedThread);

    } catch (error) {
        console.error('Thread watch/unwatch error', error);
        error_popup_window('Thread watch/unwatch error: ' + error.message);
    };
}

///////////////////////////////////////////////////////////////////////////
//////          2.4. Milestone 4 - Comments                          //////
///////////////////////////////////////////////////////////////////////////

// ------------ 2.4.1. Showing comments ------------ 
function load_comments(threadId) {
    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load comments: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(comments => {
            comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            const commentsContainer = document.createElement('div');
            commentsContainer.className = 'comments-container';

            const stack = comments.filter(comment => comment.parentCommentId === null).map(comment => ({ comment, indentLevel: 0 }));
            while (stack.length > 0) {
                const { comment, indentLevel } = stack.pop();
                const commentElement = create_comment_element(threadId, comment, indentLevel);
                commentsContainer.appendChild(commentElement);

                const childComments = comments.filter(cmt => cmt.parentCommentId === comment.id);
                childComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                childComments.forEach(childComment => {
                    stack.push({ comment: childComment, indentLevel: indentLevel + 1 });
                });
            }

            const main = document.getElementById('main');
            main.appendChild(commentsContainer);

            get_thread_details(threadId)
                .then(thread => {
                    console.log(thread);
                    console.log(thread.lock);
                    if (!thread.lock) {
                        if (comments.length === 0) {
                            render_comment_input(main, threadId, null);
                        } else {
                            render_comment_input(commentsContainer, threadId, null);
                        }
                    }
                })
                .catch(error => {
                    console.error('Failed to get thread details', error);
                });
        })
        .catch(error => {
            console.error('Failed to load comments', error);
            error_popup_window('Failed to load comments: ' + error.message);
        });

}

function create_comment_element(threadId, comment, indentLevel = 0) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.style.marginLeft = `${indentLevel * 20}px`;

    const commentText = document.createElement('p');
    commentText.textContent = comment.content;
    commentDiv.appendChild(commentText);

    const timeSinceComment = document.createElement('span');
    timeSinceComment.className = 'time-since-comment';
    timeSinceComment.textContent = get_time_since_comment(comment.createdAt);
    commentDiv.appendChild(timeSinceComment);

    const userNameElement = create_user_name_element(comment.creatorId);
    commentDiv.appendChild(userNameElement);

    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.onclick = () => render_reply_modal(commentDiv, threadId, comment.id, indentLevel + 1);
    commentDiv.appendChild(replyButton);

    const userId = parseInt(localStorage.getItem('userId'));
    const userRole = localStorage.getItem('userRole');
    if (comment.creatorId === userId || userRole === 'admin') {
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => render_edit_comment_modal(commentDiv, comment);
        commentDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => handle_comment_delete(comment.id, commentDiv);
        commentDiv.appendChild(deleteButton);
    }

    const likeButton = document.createElement('button');
    likeButton.textContent = comment.likes.includes(userId) ? 'Unlike' : 'Like';
    likeButton.onclick = () => handle_comment_like(threadId, comment.id, !comment.likes.includes(userId));
    commentDiv.appendChild(likeButton);

    const likesElement = document.createElement('span');
    likesElement.className = 'comment-likes';
    likesElement.textContent = `Likes: ${comment.likes.length}`;
    commentDiv.appendChild(likesElement);

    return commentDiv;
}

function get_time_since_comment(timestamp) {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - commentTime) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute(s) ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour(s) ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day(s) ago`;
    } else {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} week(s) ago`;
    }
}

// ------------ 2.4.2. Making a comment ------------ 
function render_comment_input(container, threadId, parentCommentId) {
    const commentInputDiv = document.createElement('div');
    commentInputDiv.className = 'comment-input-div';

    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Write your comment here...';
    commentTextarea.className = 'comment-textarea';
    commentInputDiv.appendChild(commentTextarea);

    const commentButton = document.createElement('button');
    commentButton.textContent = 'Comment';
    commentButton.onclick = () => handle_comment_submission(commentTextarea.value, threadId, parentCommentId);
    commentInputDiv.appendChild(commentButton);

    container.appendChild(commentInputDiv);
}

function handle_comment_submission(commentText, threadId, parentCommentId) {
    if (!commentText.trim()) {
        alert('Comment cannot be empty');
        return;
    }

    console.log(commentText, threadId, parentCommentId)

    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ "content": commentText, "threadId": threadId, "parentCommentId": parentCommentId })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to post comment: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            console.log('Comment posted successfully');
            return get_thread_details(threadId);
        })
        .then(updatedThread => {
            render_single_thread(updatedThread);
        })
        .catch(error => {
            console.error('Failed to post comment', error);
            error_popup_window('Failed to post comment: ' + error.message);
        });
}

function render_reply_modal(commentDiv, threadId, parentCommentId, indentLevel) {
    const modal = document.createElement('div');
    modal.className = 'reply-modal';
    modal.style.marginLeft = `${Math.min(indentLevel, 1) * 20}px`;

    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Write your reply here...';
    commentTextarea.className = 'comment-textarea';
    modal.appendChild(commentTextarea);

    const commentButton = document.createElement('button');
    commentButton.textContent = 'Comment';
    commentButton.onclick = () => {
        handle_comment_submission(commentTextarea.value, threadId, parentCommentId);
        commentDiv.removeChild(modal);
    };
    modal.appendChild(commentButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => commentDiv.removeChild(modal);
    modal.appendChild(closeButton);

    commentDiv.appendChild(modal);
}

// ------------ 2.4.3. Editing a comment ------------ 
function render_edit_comment_modal(commentDiv, comment) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';

    const commentTextarea = document.createElement('textarea');
    commentTextarea.className = 'comment-textarea';
    commentTextarea.value = comment.content;
    modal.appendChild(commentTextarea);

    const commentButton = document.createElement('button');
    commentButton.textContent = 'Update Comment';
    commentButton.onclick = () => {
        handle_comment_edit(commentTextarea.value, comment.id, modal, commentDiv);
    };
    modal.appendChild(commentButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => commentDiv.removeChild(modal);
    modal.appendChild(closeButton);

    commentDiv.appendChild(modal);
}

function handle_comment_edit(updatedText, commentId, modal, commentDiv) {
    if (!updatedText.trim()) {
        alert('Comment cannot be empty');
        return;
    }

    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ "id": commentId, "content": updatedText, })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to edit comment: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            console.log('Comment updated successfully');
            const commentText = commentDiv.querySelector('p');
            commentText.textContent = updatedText;
            commentDiv.removeChild(modal);
        })
        .catch(error => {
            console.error('Failed to edit comment', error);
            error_popup_window('Failed to edit comment: ' + error.message);
        });
}

function handle_comment_delete(commentId, commentDiv) {
    const token = localStorage.getItem('authToken');

    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: commentId })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to delete comment: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            console.log('Comment deleted successfully');
            commentDiv.parentNode.removeChild(commentDiv);
        })
        .catch(error => {
            console.error('Failed to delete comment', error);
            error_popup_window('Failed to delete comment: ' + error.message);
        });
}

// ------------ 2.4.4. Liking a comment ------------ 
function handle_comment_like(threadId, commentId, isLike) {
    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:${BACKEND_PORT}/comment/like`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ "id": commentId, "turnon": isLike })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to ${isLike ? 'like' : 'unlike'} comment: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            console.log('Thread updated successfully after like/unlike');
            return get_thread_details(threadId);
        })
        .then(updatedThread => {
            console.log('updatedThread', updatedThread)
            render_single_thread(updatedThread);
        })
        .catch(error => {
            console.error(`Failed to ${isLike ? 'like' : 'unlike'} comment`, error);
            error_popup_window(`Failed to ${isLike ? 'like' : 'unlike'} comment: ` + error.message);
        });
}

///////////////////////////////////////////////////////////////////////////
//////          2.5. Milestone 5 - Handling Users                    //////
///////////////////////////////////////////////////////////////////////////

// ------------ 2.5.1. Viewing a profile ------------ 
function create_user_name_element(userId) {
    const userNameElement = document.createElement('a');
    userNameElement.style.cursor = 'pointer';
    userNameElement.className = 'username';
    userNameElement.href = '#';

    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch user details: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(user => {
            userNameElement.textContent = user.name && user.name.trim() !== '' ? user.name : `User ${userId}`;
            userNameElement.addEventListener('click', (event) => {
                event.preventDefault();
                render_profile(userId);
            });
        })
        .catch(error => {
            console.error('Failed to fetch user name', error);
            userNameElement.textContent = 'Unknown User';
        });

    return userNameElement;
}


function render_profile(userId) {
    const token = localStorage.getItem('authToken');

    fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch user details: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(user => {
            display_user_profile(user);
            load_user_threads(userId);
        })
        .catch(error => {
            console.error('Failed to fetch user profile', error);
            error_popup_window('Failed to fetch user profile: ' + error.message);
        });
}

function display_user_profile(user) {
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
        updateButton.onclick = () => handle_update_admin_status(user.id);
        profileDiv.appendChild(updateButton);
    }

    if (parseInt(localStorage.getItem('userId')) === user.id) {
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update Profile';
        updateButton.onclick = render_update_profile_form;
        main.appendChild(updateButton);
    }

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.onclick = () => render_dashboard();
    main.appendChild(backButton);
}

function load_user_threads(userId) {
    const token = localStorage.getItem('authToken');
    let startIndex = 0;

    // First, fetch all thread IDs
    fetch(`http://localhost:${BACKEND_PORT}/threads?start=${startIndex}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load thread IDs: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(threadIds => {
            const threadDetailPromises = threadIds.map(threadId => {
                return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${threadId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        Authorization: `Bearer ${token}`,
                    },
                }).then(response => {
                    if (!response.ok) throw new Error(`Failed to load thread details: HTTP error! status: ${response.status}`);
                    return response.json();
                });
            });

            return Promise.all(threadDetailPromises);
        })
        .then(allThreads => {
            const userThreads = allThreads.filter(thread => thread.creatorId === parseInt(userId));

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

                threadElement.addEventListener('click', () => render_single_thread(thread));

                threadsDiv.appendChild(threadElement);
            });

            main.appendChild(threadsDiv);
        })
        .catch(error => {
            console.error('Failed to load user threads', error);
            error_popup_window('Failed to load user threads: ' + error.message);
        });
}

// ------------ 2.5.2 Viewing your own profile ------------ 
// Implement a button in the render_dashboard() function.

// ------------ 2.5.3. Updating your profile ------------ 
function render_update_profile_form() {
    const main = document.getElementById('main');
    clear_element(main);

    const form = document.createElement('form');
    form.id = 'updateProfileForm';
    form.onsubmit = handle_profile_update;

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

    const saveButton = get_button('Save Changes', handle_profile_update);
    saveButton.type = 'submit';
    form.appendChild(saveButton);

    const cancelButton = get_button('Cancel');
    cancelButton.onclick = () => {
        const userId = localStorage.getItem('userId');
        render_profile(userId);
    };
    form.appendChild(cancelButton);

    main.appendChild(form);
}

function handle_profile_update(event) {
    event.preventDefault();

    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const email = document.getElementById('updateEmail').value;
    const name = document.getElementById('updateName').value;
    const password = document.getElementById('updatePassword').value;
    const imageFile = document.getElementById('updateImage').files[0];

    let profileData = { email, name, password };

    if (imageFile) {
        fileToDataUrl(imageFile)
            .then(dataUrl => {
                profileData.image = dataUrl;
                return update_profile(userId, profileData, token);
            })
            .catch(error => {
                console.error('Failed to convert image to data URL:', error);
                error_popup_window('Failed to process image. Please try again.');
            });
    } else {
        update_profile(userId, profileData, token);
    }
}

function update_profile(userId, profileData, token) {
    fetch(`http://localhost:${BACKEND_PORT}/user`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData)
    })
        .then(response => {
            if (!response.ok) throw new Error(`Profile update error: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            console.log('Profile updated successfully');
            alert('Profile updated successfully!');
            render_profile(userId);
        })
        .catch(error => {
            console.error('Profile update error', error);
            error_popup_window('Profile update error: ' + error.message);
        });
}

// ------------ 2.5.4. Updating someone as admin ------------ 
function handle_update_admin_status(userId) {
    const token = localStorage.getItem('authToken');
    const newRole = document.getElementById('adminStatusSelect').value;
    const isAdmin = newRole === 'admin';
    console.log(isAdmin, newRole)

    fetch(`http://localhost:${BACKEND_PORT}/user/admin`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ "userId": parseInt(userId), "turnon": isAdmin })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to update user role: HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            console.log('User role updated successfully');
            alert('User role updated successfully!');
            render_profile(userId);
        })
        .catch(error => {
            console.error('Failed to update user role', error);
            error_popup_window('Failed to update user role: ' + error.message);
        });
}
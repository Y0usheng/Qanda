// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, showNotification } from './helpers.js';
// api file
import { api } from './api.js';
// utils file
import { create_div, get_button, create_checkbox, clear_element } from './utils.js';
// auth file
import { render_login_form, handle_logout } from './auth.js';


document.addEventListener('DOMContentLoaded', init);
function init() {
    if (localStorage.getItem('authToken')) {
        render_dashboard();
    } else {
        render_login_form(render_dashboard);
    }
}

///////////////////////////////////////////////////////////////////////////
//////                      Registration & Login                     //////
///////////////////////////////////////////////////////////////////////////
// ------------ Dashboard ------------ 
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
    const logoutButton = get_button("Logout", () => {
        handle_logout(() => render_login_form(render_dashboard));
    });
    actionButtonsDiv.appendChild(logoutButton);

    dashboardContainer.appendChild(actionButtonsDiv);

    const threadsContainer = document.createElement('div');
    threadsContainer.className = 'threads-container';

    load_threads(threadsContainer);
    dashboardContainer.appendChild(threadsContainer);

    main.appendChild(dashboardContainer);
}

///////////////////////////////////////////////////////////////////////////
//////          2.4. Milestone 4 - Comments                          //////
///////////////////////////////////////////////////////////////////////////

// ------------ 2.4.1. Showing comments ------------ 
async function load_comments(threadId) {
    try {
        const thread = await get_thread_details(threadId);

        const comments = await api.comment.list(threadId);
        comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'comments-container';

        const stack = comments.filter(comment => comment.parentCommentId === null).map(comment => ({ comment, indentLevel: 0 }));
        while (stack.length > 0) {
            const { comment, indentLevel } = stack.pop();
            const commentElement = create_comment_element(threadId, comment, indentLevel, thread.lock);
            commentsContainer.appendChild(commentElement);

            const childComments = comments.filter(cmt => cmt.parentCommentId === comment.id);
            childComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            childComments.forEach(childComment => {
                stack.push({ comment: childComment, indentLevel: indentLevel + 1 });
            });
        }

        const main = document.getElementById('main');
        main.appendChild(commentsContainer);

        if (!thread.lock) {
            if (comments.length === 0) {
                render_comment_input(main, threadId, null);
            } else {
                render_comment_input(commentsContainer, threadId, null);
            }
        }
    } catch (error) {
        console.error('Failed to load comments', error);
        showNotification('Failed to load comments: ' + error.message, 'error');
    };
}

function create_comment_element(threadId, comment, indentLevel = 0, isLocked = false) {
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

    if (!isLocked) {
        const replyButton = document.createElement('button');
        replyButton.textContent = 'Reply';
        replyButton.onclick = () => render_reply_modal(commentDiv, threadId, comment.id, indentLevel + 1);
        commentDiv.appendChild(replyButton);
    }

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

async function handle_comment_submission(commentText, threadId, parentCommentId) {
    if (!commentText.trim()) {
        showNotification('Comment cannot be empty', 'error');
        return;
    }

    try {
        await api.comment.create(commentText, threadId, parentCommentId);
        console.log('Comment posted successfully');

        const updatedThread = await get_thread_details(threadId);
        render_single_thread(updatedThread);
    } catch (error) {
        console.error('Failed to post comment', error);
        showNotification('Failed to post comment: ' + error.message, 'error');
    };
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

async function handle_comment_edit(updatedText, commentId, modal, commentDiv) {
    if (!updatedText.trim()) {
        alert('Comment cannot be empty');
        return;
    }

    try {
        await api.comment.update(commentId, updatedText);
        console.log('Comment updated successfully');
        const commentText = commentDiv.querySelector('p');
        commentText.textContent = updatedText;
        commentDiv.removeChild(modal);
    } catch (error) {
        console.error('Failed to edit comment', error);
        showNotification('Failed to edit comment: ' + error.message, 'error');
    };
}

async function handle_comment_delete(commentId, commentDiv) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        await api.comment.delete(commentId);
        console.log('Comment deleted successfully');
        commentDiv.parentNode.removeChild(commentDiv);
    } catch (error) {
        console.error('Failed to delete comment', error);
        showNotification('Failed to delete comment: ' + error.message, 'error');
    };
}

// ------------ 2.4.4. Liking a comment ------------ 
async function handle_comment_like(threadId, commentId, isLike) {
    try {
        await api.comment.like(commentId, isLike);
        const updatedThread = await get_thread_details(threadId);
        render_single_thread(updatedThread);
    } catch (error) {
        console.error(`Failed to ${isLike ? 'like' : 'unlike'} comment`, error);
        showNotification(`Failed to ${isLike ? 'like' : 'unlike'} comment: ` + error.message, 'error');
    };
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
    userNameElement.textContent = 'Loading...';

    api.user.get(userId)
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

async function render_profile(userId) {
    try {
        const user = await api.user.get(userId);
        display_user_profile(user);
        load_user_threads(userId);
    } catch (error) {
        console.error('Failed to fetch user profile', error);
        showNotification('Failed to fetch user profile: ' + error.message, 'error');
    };
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

async function load_user_threads(userId) {
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

            threadElement.addEventListener('click', () => render_single_thread(thread));

            threadsDiv.appendChild(threadElement);
        });

        main.appendChild(threadsDiv);
    } catch (error) {
        console.error('Failed to load user threads', error);
        showNotification('Failed to load user threads: ' + error.message, 'error');
    }
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

async function handle_profile_update(event) {
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
        console.log('Profile updated successfully');
        showNotification('Profile updated successfully!', 'success');

        render_profile(userId);
    } catch (error) {
        console.error('Failed to convert image to data URL:', error);
        showNotification('Failed to process image. Please try again.', 'error');
    };
}

// ------------ 2.5.4. Updating someone as admin ------------ 
async function handle_update_admin_status(userId) {
    const newRole = document.getElementById('adminStatusSelect').value;
    const isAdmin = newRole === 'admin';
    console.log(isAdmin, newRole)

    try {
        await api.user.setAdmin(userId, isAdmin);
        console.log('User role updated successfully');
        showNotification('User role updated successfully!', 'success');
        render_profile(userId);
    } catch (error) {
        console.error('Failed to update user role', error);
        showNotification('Failed to update user role: ' + error.message, 'error');
    }
}
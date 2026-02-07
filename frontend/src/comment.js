// frontend/src/comment.js
import { api } from './api.js';
import { showNotification } from './helpers.js';
import {
    create_user_name_element,
    get_time_since
} from './utils.js';

// ------------ Showing comments ------------ 
export async function load_comments(threadId, isLocked, callbacks) {
    try {
        const comments = await api.comment.list(threadId);
        comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'comments-container';

        const stack = comments.filter(comment => comment.parentCommentId === null).map(comment => ({ comment, indentLevel: 0 }));
        while (stack.length > 0) {
            const { comment, indentLevel } = stack.pop();
            const commentElement = create_comment_element(threadId, comment, indentLevel, isLocked, callbacks);
            commentsContainer.appendChild(commentElement);

            const childComments = comments.filter(cmt => cmt.parentCommentId === comment.id);
            childComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            childComments.forEach(childComment => {
                stack.push({ comment: childComment, indentLevel: indentLevel + 1 });
            });
        }

        const main = document.getElementById('main');
        main.appendChild(commentsContainer);

        if (!isLocked) {
            if (comments.length === 0) {
                render_comment_input(main, threadId, null, callbacks);
            } else {
                render_comment_input(commentsContainer, threadId, null, callbacks);
            }
        }
    } catch (error) {
        console.error('Failed to load comments', error);
        showNotification('Failed to load comments: ' + error.message, 'error');
    };
}

function create_comment_element(threadId, comment, indentLevel = 0, isLocked = false, callbacks) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.style.marginLeft = `${indentLevel * 20}px`;

    const commentText = document.createElement('p');
    commentText.textContent = comment.content;
    commentDiv.appendChild(commentText);

    const timeSinceComment = document.createElement('span');
    timeSinceComment.className = 'time-since-comment';
    timeSinceComment.textContent = get_time_since(comment.createdAt);
    commentDiv.appendChild(timeSinceComment);

    const userNameElement = create_user_name_element(comment.creatorId, callbacks.onProfile);
    commentDiv.appendChild(userNameElement);

    if (!isLocked) {
        const replyButton = document.createElement('button');
        replyButton.textContent = 'Reply';
        replyButton.onclick = () => render_reply_modal(commentDiv, threadId, comment.id, indentLevel + 1, callbacks);
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
    likeButton.onclick = () => handle_comment_like(threadId, comment.id, !comment.likes.includes(userId), callbacks);
    commentDiv.appendChild(likeButton);

    const likesElement = document.createElement('span');
    likesElement.className = 'comment-likes';
    likesElement.textContent = `Likes: ${comment.likes.length}`;
    commentDiv.appendChild(likesElement);

    return commentDiv;
}

// ------------ Making a comment ------------ 
function render_comment_input(container, threadId, parentCommentId, callbacks) {
    const commentInputDiv = document.createElement('div');
    commentInputDiv.className = 'comment-input-div';

    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Write your comment here...';
    commentTextarea.className = 'comment-textarea';
    commentInputDiv.appendChild(commentTextarea);

    const commentButton = document.createElement('button');
    commentButton.textContent = 'Comment';
    commentButton.onclick = () => handle_comment_submission(commentTextarea.value, threadId, parentCommentId, callbacks);
    commentInputDiv.appendChild(commentButton);

    container.appendChild(commentInputDiv);
}

// ------------ Submit a comment ------------ 
async function handle_comment_submission(commentText, threadId, parentCommentId, callbacks) {
    if (!commentText.trim()) {
        showNotification('Comment cannot be empty', 'error');
        return;
    }

    try {
        await api.comment.create(commentText, threadId, parentCommentId);
        console.log('Comment posted successfully');

        if (callbacks.onRefresh) callbacks.onRefresh(threadId);
    } catch (error) {
        console.error('Failed to post comment', error);
        showNotification('Failed to post comment: ' + error.message, 'error');
    };
}

// ------------ Reply a comment ------------ 
function render_reply_modal(commentDiv, threadId, parentCommentId, indentLevel, callbacks) {
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
        handle_comment_submission(commentTextarea.value, threadId, parentCommentId, callbacks);
        commentDiv.removeChild(modal);
    };
    modal.appendChild(commentButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => commentDiv.removeChild(modal);
    modal.appendChild(closeButton);

    commentDiv.appendChild(modal);
}

// ------------ Editing a comment ------------ 
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
        const commentText = commentDiv.querySelector('p');
        commentText.textContent = updatedText;
        commentDiv.removeChild(modal);
        showNotification('Comment updated successfully', 'success');
    } catch (error) {
        console.error('Failed to edit comment', error);
        showNotification('Failed to edit comment: ' + error.message, 'error');
    };
}

// ------------ Deleting a comment ------------ 
async function handle_comment_delete(commentId, commentDiv) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        await api.comment.delete(commentId);
        commentDiv.parentNode.removeChild(commentDiv);
        showNotification('Comment deleted successfully', 'success');
    } catch (error) {
        console.error('Failed to delete comment', error);
        showNotification('Failed to delete comment: ' + error.message, 'error');
    };
}

// ------------ Liking a comment ------------ 
async function handle_comment_like(threadId, commentId, isLike) {
    try {
        await api.comment.like(commentId, isLike);
        if (callbackss.onRefresh) callbackss.onRefresh(threadId);
    } catch (error) {
        console.error(`Failed to ${isLike ? 'like' : 'unlike'} comment`, error);
        showNotification(`Failed to ${isLike ? 'like' : 'unlike'} comment: ` + error.message, 'error');
    };
}

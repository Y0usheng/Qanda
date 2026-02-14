// A helper you may want to use when uploading new images to the server.
import { showNotification } from './helpers.js';
// api file
import { api } from './api.js';
// utils file
import { clear_element, get_button } from './utils.js';
// auth file
import { render_login_form, handle_logout } from './auth.js';
// thread file
import { render_create_thread_screen, load_threads_list, render_single_thread } from './thread.js';
// comment file
import { load_comments } from './comment.js';
// profile file
import { render_profile } from './profile.js';

document.addEventListener('DOMContentLoaded', init);
function init() {
    if (localStorage.getItem('authToken')) {
        render_dashboard();
    } else {
        render_login_form(render_dashboard);
    }
}

const callbacks = {
    onBack: render_dashboard,

    onProfile: (userId) => render_profile(userId, callbacks),

    onThreadOpen: (thread) => render_single_thread(thread, callbacks),

    onLoadComments: (threadId, isLocked) => load_comments(threadId, isLocked, callbacks),

    onRefresh: async (threadId) => {
        try {
            const thread = await api.thread.get(threadId);
            render_single_thread(thread, callbacks);
        } catch (error) {
            console.error('Refresh error', error);
            showNotification('Failed to refresh thread', 'error');
        }
    }
};

// ------------ Dashboard ------------ 
function render_dashboard() {
    const main = document.getElementById('main');
    clear_element(main);

    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';

    const actionButtonsDiv = document.createElement('div');
    actionButtonsDiv.className = 'action-buttons';

    const createThreadButton = get_button("Create Thread", () => render_create_thread_screen(callbacks));
    actionButtonsDiv.appendChild(createThreadButton);

    const viewProfileButton = get_button("View Profile", () => {
        const userId = localStorage.getItem('userId');
        render_profile(userId, callbacks);
    });
    actionButtonsDiv.appendChild(viewProfileButton);

    const logoutButton = get_button("Logout", () => {
        handle_logout(() => render_login_form(render_dashboard));
    });
    actionButtonsDiv.appendChild(logoutButton);

    dashboardContainer.appendChild(actionButtonsDiv);

    const controlsDiv = document.createElement('div');
    controlsDiv.style.margin = '20px 0';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.alignItems = 'center';
    controlsDiv.style.gap = '10px';

    const sortLabel = document.createElement('label');
    sortLabel.textContent = 'Sort by: ';

    const sortSelect = document.createElement('select');
    sortSelect.id = 'threadSortSelect';

    // recent options
    const optionRecent = document.createElement('option');
    optionRecent.value = 'recent';
    optionRecent.textContent = 'Most Recent';

    // likes options
    const optionLikes = document.createElement('option');
    optionLikes.value = 'likes';
    optionLikes.textContent = 'Most Likes';

    sortSelect.appendChild(optionRecent);
    sortSelect.appendChild(optionLikes);

    controlsDiv.appendChild(sortLabel);
    controlsDiv.appendChild(sortSelect);
    dashboardContainer.appendChild(controlsDiv);

    const threadsContainer = document.createElement('div');
    threadsContainer.className = 'threads-container';
    dashboardContainer.appendChild(threadsContainer);

    load_threads_list(threadsContainer, callbacks, 0, 10, 'recent');

    sortSelect.onchange = (e) => {
        const selectedSort = e.target.value;
        clear_element(threadsContainer);
        load_threads_list(threadsContainer, callbacks, 0, 10, selectedSort);
    };

    main.appendChild(dashboardContainer);
}
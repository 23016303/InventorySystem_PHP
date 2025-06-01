
// Dependencies and imports
// Assuming these utility functions exist or need to be implemented

// Global variables to maintain session state
let currentUser = null;
let pageTitle = 'My profile';

// Utility functions equivalent to PHP includes/load.php
function pageRequireLevel(requiredLevel) {
    // Check if user has required permission level
    if (!currentUser || currentUser.user_level < requiredLevel) {
        redirect('login.html', false);
        return false;
    }
    return true;
}

function redirect(url, usePhpExit = true) {
    // Redirect to specified URL
    window.location.href = url;
    if (usePhpExit) {
        return; // Equivalent to PHP exit
    }
}

async function findById(table, id) {
    // Database query equivalent - replace with actual API call
    try {
        const response = await fetch(`/api/${table}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Database query error:', error);
        return null;
    }
}

function firstCharacter(name) {
    // Extract first character of name for display
    if (!name || name.length === 0) {
        return '';
    }
    return name.charAt(0).toUpperCase();
}

function getSessionToken() {
    // Get session token from localStorage or sessionStorage
    return localStorage.getItem('sessionToken') || sessionStorage.getItem('sessionToken');
}

function getUrlParameter(name) {
    // Extract URL parameter equivalent to PHP $_GET
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function loadCurrentUser() {
    // Load current user session data
    try {
        const response = await fetch('/api/current-user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getSessionToken()}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
        }
    } catch (error) {
        console.error('Failed to load current user:', error);
    }
}

async function includeLayout(layoutName) {
    // Include layout files equivalent to PHP include_once
    try {
        const response = await fetch(`layouts/${layoutName}`);
        if (response.ok) {
            const html = await response.text();
            return html;
        }
    } catch (error) {
        console.error(`Failed to load layout ${layoutName}:`, error);
    }
    return '';
}

// Main application logic
async function initializeProfile() {
    // Set page title
    document.title = pageTitle;
    
    // Load current user session
    await loadCurrentUser();
    
    // Check user permission level (equivalent to page_require_level(3))
    if (!pageRequireLevel(3)) {
        return; // Exit if permission check fails
    }
    
    // Get user ID from URL parameters (equivalent to $_GET['id'])
    const userId = parseInt(getUrlParameter('id')) || 0;
    
    let userProfile = null;
    
    // Check if user ID is empty and handle accordingly
    if (!userId || userId === 0) {
        redirect('home.php', false);
        return;
    } else {
        // Find user by ID (equivalent to find_by_id('users', $user_id))
        userProfile = await findById('users', userId);
        if (!userProfile) {
            redirect('home.php', false);
            return;
        }
    }
    
    // Load and insert header layout
    const headerHtml = await includeLayout('header.php');
    
    // Create the main profile HTML content
    const profileHtml = `
        <div class="row">
            <div class="col-md-4">
                <div class="panel profile">
                    <div class="jumbotron text-center bg-red">
                        <img class="img-circle img-size-2" src="uploads/users/${userProfile.image}" alt="">
                        <h3>${firstCharacter(userProfile.name)}</h3>
                    </div>
                    ${userProfile.id === currentUser.id ? `
                    <ul class="nav nav-pills nav-stacked">
                        <li><a href="edit_account.php"> <i class="glyphicon glyphicon-edit"></i> Edit profile</a></li>
                    </ul>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Load and insert footer layout
    const footerHtml = await includeLayout('footer.php');
    
    // Combine all HTML content
    const fullPageHtml = headerHtml + profileHtml + footerHtml;
    
    // Insert the complete HTML into the document body
    document.body.innerHTML = fullPageHtml;
}

// Initialize the profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile().catch(error => {
        console.error('Failed to initialize profile page:', error);
        // Handle initialization error - could redirect to error page
        redirect('error.html', false);
    });
});

// Alternative initialization if called directly
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfile);
} else if (typeof window !== 'undefined') {
    // Document already loaded
    initializeProfile();
}


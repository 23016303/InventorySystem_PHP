
// Required dependencies and imports
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

// Equivalent to ob_start() - in Node.js, response buffering is handled automatically
// but we can implement similar functionality if needed
let outputBuffer = '';

// Equivalent to require_once('includes/load.php')
const load = require('./includes/load.js');

// Session management equivalent
class SessionManager {
    constructor(req) {
        this.req = req;
    }
    
    isUserLoggedIn(redirect = false) {
        // Check if user session exists and is valid
        if (this.req.session && this.req.session.user && this.req.session.user.loggedIn) {
            return true;
        }
        return false;
    }
}

// Redirect function equivalent
function redirect(url, exit = true) {
    if (typeof window !== 'undefined') {
        // Client-side redirect
        window.location.href = url;
    } else {
        // Server-side redirect (Node.js/Express)
        if (global.currentResponse) {
            global.currentResponse.redirect(url);
        }
    }
    if (exit) {
        return;
    }
}

// Display message function equivalent
function display_msg(msg) {
    if (!msg) return '';
    
    let messageHtml = '';
    if (Array.isArray(msg)) {
        msg.forEach(message => {
            messageHtml += `<div class="alert alert-info">${message}</div>`;
        });
    } else if (typeof msg === 'string') {
        messageHtml = `<div class="alert alert-info">${msg}</div>`;
    } else if (typeof msg === 'object') {
        for (let key in msg) {
            messageHtml += `<div class="alert alert-${key}">${msg[key]}</div>`;
        }
    }
    return messageHtml;
}

// Include file function equivalent
function include_once(filePath) {
    if (typeof window !== 'undefined') {
        // Client-side: return empty string or handle differently
        return '';
    } else {
        // Server-side: read file content
        try {
            const fullPath = path.resolve(filePath);
            return fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            console.error(`Error including file ${filePath}:`, error);
            return '';
        }
    }
}

// Main login page function
function renderLoginPage(req, res, msg = null) {
    // Equivalent to ob_start()
    outputBuffer = '';
    
    // Equivalent to require_once('includes/load.php')
    // This would load necessary configurations and setup
    
    // Session check equivalent
    const session = new SessionManager(req);
    if (session.isUserLoggedIn(true)) {
        redirect('home.php', false);
        return;
    }
    
    // Equivalent to include_once('layouts/header.php')
    const headerContent = include_once('layouts/header.php');
    
    // Main HTML content
    const mainContent = `
    <div class="login-page">
        <div class="text-center">
           <h1>Login Panel</h1>
           <h4>Inventory Management System</h4>
         </div>
         ${display_msg(msg)}
          <form method="post" action="auth.php" class="clearfix">
            <div class="form-group">
                  <label for="username" class="control-label">Username</label>
                  <input type="name" class="form-control" name="username" placeholder="Username">
            </div>
            <div class="form-group">
                <label for="Password" class="control-label">Password</label>
                <input type="password" name="password" class="form-control" placeholder="Password">
            </div>
            <div class="form-group">
                    <button type="submit" class="btn btn-danger" style="border-radius:0%">Login</button>
            </div>
        </form>
    </div>`;
    
    // Equivalent to include_once('layouts/footer.php')
    const footerContent = include_once('layouts/footer.php');
    
    // Combine all content
    const fullPageContent = headerContent + mainContent + footerContent;
    
    // If this is a server response, send the content
    if (res && typeof res.send === 'function') {
        res.send(fullPageContent);
    }
    
    return fullPageContent;
}

// Client-side version for browser environments
function renderLoginPageClient(msg = null) {
    // Check if user is already logged in (client-side session check)
    if (localStorage.getItem('userLoggedIn') === 'true') {
        redirect('home.php', false);
        return;
    }
    
    // Create the login page HTML
    const loginPageHtml = `
    <div class="login-page">
        <div class="text-center">
           <h1>Login Panel</h1>
           <h4>Inventory Management System</h4>
         </div>
         ${display_msg(msg)}
          <form method="post" action="auth.php" class="clearfix" id="loginForm">
            <div class="form-group">
                  <label for="username" class="control-label">Username</label>
                  <input type="name" class="form-control" name="username" placeholder="Username">
            </div>
            <div class="form-group">
                <label for="Password" class="control-label">Password</label>
                <input type="password" name="password" class="form-control" placeholder="Password">
            </div>
            <div class="form-group">
                    <button type="submit" class="btn btn-danger" style="border-radius:0%">Login</button>
            </div>
        </form>
    </div>`;
    
    // Insert into DOM if document exists
    if (typeof document !== 'undefined') {
        const container = document.getElementById('main-content') || document.body;
        container.innerHTML = loginPageHtml;
        
        // Add form submission handler
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                // Handle form submission here
                const formData = new FormData(form);
                // Submit to auth.php equivalent
                submitLoginForm(formData);
            });
        }
    }
    
    return loginPageHtml;
}

// Form submission handler for client-side
function submitLoginForm(formData) {
    const username = formData.get('username');
    const password = formData.get('password');
    
    // Submit to authentication endpoint
    fetch('auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('userLoggedIn', 'true');
            redirect('home.php');
        } else {
            // Display error message
            renderLoginPageClient(data.message || 'Login failed');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        renderLoginPageClient('An error occurred during login');
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderLoginPage,
        renderLoginPageClient,
        SessionManager,
        redirect,
        display_msg,
        include_once
    };
}


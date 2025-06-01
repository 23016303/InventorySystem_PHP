
// Required dependencies and imports
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

// Load configuration and utilities (equivalent to includes/load.php)
const config = require('./includes/load.js');

// Session management class (equivalent to $session object)
class SessionManager {
    constructor(req) {
        this.req = req;
    }
    
    isUserLoggedIn(strict = false) {
        if (strict) {
            return this.req.session && this.req.session.user && this.req.session.user.id;
        }
        return this.req.session && this.req.session.user;
    }
}

// Redirect function (equivalent to redirect())
function redirect(url, permanent = true) {
    const statusCode = permanent ? 301 : 302;
    return {
        redirect: true,
        url: url,
        statusCode: statusCode
    };
}

// Display message function (equivalent to display_msg())
function display_msg(msg) {
    if (!msg) return '';
    
    let output = '';
    if (Array.isArray(msg)) {
        msg.forEach(message => {
            output += `<div class="alert alert-${message.type}">${message.text}</div>`;
        });
    } else if (typeof msg === 'object') {
        output = `<div class="alert alert-${msg.type}">${msg.text}</div>`;
    } else if (typeof msg === 'string') {
        output = `<div class="alert alert-info">${msg}</div>`;
    }
    return output;
}

// Include header layout function (equivalent to include_once())
function includeHeader() {
    try {
        const headerPath = path.join(__dirname, 'layouts', 'header.php');
        if (fs.existsSync(headerPath)) {
            return fs.readFileSync(headerPath, 'utf8');
        }
        return '';
    } catch (error) {
        console.error('Error including header:', error);
        return '';
    }
}

// Main login page handler (equivalent to the entire PHP script)
function loginPage(req, res) {
    // Equivalent to ob_start() - we'll buffer output and send at the end
    let output = '';
    
    // Create session manager instance
    const session = new SessionManager(req);
    
    // Check if user is logged in and redirect if true
    if (session.isUserLoggedIn(true)) {
        return res.redirect(302, 'home.php');
    }
    
    // Get message from session or query parameters
    const msg = req.session.msg || req.query.msg || null;
    
    // Clear message from session after retrieving
    if (req.session.msg) {
        delete req.session.msg;
    }
    
    // Build the HTML output
    output += `
<div class="login-page">
    <div class="text-center">
       <h1>Welcome</h1>
       <p>Sign in to start your session</p>
     </div>
     ${display_msg(msg)}
      <form method="post" action="auth_v2.php" class="clearfix">
        <div class="form-group">
              <label for="username" class="control-label">Username</label>
              <input type="name" class="form-control" name="username" placeholder="Username">
        </div>
        <div class="form-group">
            <label for="Password" class="control-label">Password</label>
            <input type="password" name= "password" class="form-control" placeholder="password">
        </div>
        <div class="form-group">
                <button type="submit" class="btn btn-info  pull-right">Login</button>
        </div>
    </form>
</div>`;
    
    // Include header layout
    output += includeHeader();
    
    // Send the complete output
    res.send(output);
}

// Export for use in Express routes
module.exports = {
    loginPage,
    SessionManager,
    redirect,
    display_msg,
    includeHeader
};

// Example Express route usage:
// app.get('/login', loginPage);


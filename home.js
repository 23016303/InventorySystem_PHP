
// Dependencies and imports
const express = require('express');
const session = require('express-session');
const path = require('path');

// Session management class
class SessionManager {
    constructor(req) {
        this.req = req;
    }

    isUserLoggedIn(redirect = false) {
        return this.req.session && this.req.session.user && this.req.session.user.loggedIn === true;
    }
}

// Utility functions
function redirect(url, permanent = false) {
    if (typeof window !== 'undefined') {
        // Client-side redirect
        window.location.href = url;
    } else {
        // Server-side redirect (if using Node.js/Express)
        throw new Error(`REDIRECT:${url}:${permanent}`);
    }
}

function display_msg(msg) {
    if (!msg) return '';
    
    let alertClass = 'alert-info';
    if (msg.type) {
        switch (msg.type) {
            case 'success':
                alertClass = 'alert-success';
                break;
            case 'error':
                alertClass = 'alert-danger';
                break;
            case 'warning':
                alertClass = 'alert-warning';
                break;
            default:
                alertClass = 'alert-info';
        }
    }
    
    return `<div class="alert ${alertClass} alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                ${msg.text || msg}
            </div>`;
}

// Layout templates
const headerTemplate = (pageTitle) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container-fluid">
`;

const footerTemplate = () => `
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;

// Main page logic - Direct translation of the PHP code
function homePage(req, res, msg = null) {
    // <?php
    const page_title = 'Home Page';
    
    // require_once('includes/load.php'); - Equivalent to loading dependencies
    const session = new SessionManager(req);
    
    // if (!$session->isUserLoggedIn(true)) { redirect('index.php', false);}
    if (!session.isUserLoggedIn(true)) {
        redirect('index.php', false);
        return;
    }
    // ?>

    // <?php include_once('layouts/header.php'); ?>
    let html = headerTemplate(page_title);
    
    html += `
<div class="row">
  <div class="col-md-12">`;
    
    // <?php echo display_msg($msg); ?>
    html += display_msg(msg);
    
    html += `
  </div>
 <div class="col-md-12">
    <div class="panel">
      <div class="jumbotron text-center">
         <h1>Welcome User <hr> Inventory Management System</h1>
         <p>Browes around to find out the pages that you can access!</p>
      </div>
    </div>
 </div>
</div>`;

    // <?php include_once('layouts/footer.php'); ?>
    html += footerTemplate();
    
    if (res) {
        res.send(html);
    }
    
    return html;
}

// Express.js route handler (server-side implementation)
function setupHomePageRoute(app) {
    app.get('/home.php', (req, res) => {
        try {
            homePage(req, res, req.session?.msg);
            // Clear message after displaying
            if (req.session?.msg) {
                delete req.session.msg;
            }
        } catch (error) {
            if (error.message.startsWith('REDIRECT:')) {
                const parts = error.message.split(':');
                const url = parts[1];
                const permanent = parts[2] === 'true';
                res.redirect(permanent ? 301 : 302, url);
            } else {
                throw error;
            }
        }
    });
}

// Client-side implementation for SPA applications
class HomePage {
    constructor() {
        this.page_title = 'Home Page';
        this.session = null;
        this.msg = null;
    }

    // Load dependencies equivalent
    async loadDependencies() {
        // Initialize session management
        this.session = {
            isUserLoggedIn: (redirectOnFail) => {
                const user = localStorage.getItem('user');
                const isLoggedIn = user && JSON.parse(user).loggedIn === true;
                
                if (!isLoggedIn && redirectOnFail) {
                    redirect('index.php', false);
                    return false;
                }
                
                return isLoggedIn;
            }
        };
        
        // Get any pending messages
        this.msg = JSON.parse(sessionStorage.getItem('msg') || 'null');
        sessionStorage.removeItem('msg'); // Clear after reading
    }

    async render() {
        // Load dependencies first
        await this.loadDependencies();
        
        // Check authentication
        if (!this.session.isUserLoggedIn(true)) {
            redirect('index.php', false);
            return;
        }

        // Build the page HTML
        const headerHtml = headerTemplate(this.page_title);
        
        const bodyHtml = `
<div class="row">
  <div class="col-md-12">
    ${display_msg(this.msg)}
  </div>
 <div class="col-md-12">
    <div class="panel">
      <div class="jumbotron text-center">
         <h1>Welcome User <hr> Inventory Management System</h1>
         <p>Browes around to find out the pages that you can access!</p>
      </div>
    </div>
 </div>
</div>`;

        const footerHtml = footerTemplate();
        
        const fullHtml = headerHtml + bodyHtml + footerHtml;
        
        // Update document
        document.open();
        document.write(fullHtml);
        document.close();
    }
}

// Usage examples:

// For Node.js/Express server:
// const app = express();
// setupHomePageRoute(app);

// For client-side SPA:
// const homePage = new HomePage();
// homePage.render();

// For direct function call:
// const html = homePage(mockReq, mockRes, mockMsg);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        homePage,
        HomePage,
        setupHomePageRoute,
        SessionManager,
        display_msg,
        redirect,
        headerTemplate,
        footerTemplate
    };
}


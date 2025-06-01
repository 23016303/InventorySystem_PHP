
// Required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};

// Database connection class
class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        this.connection = await mysql.createConnection(dbConfig);
    }

    escape(value) {
        if (this.connection) {
            return this.connection.escape(value).slice(1, -1); // Remove quotes added by escape
        }
        return value.toString().replace(/['";\\]/g, '\\$&');
    }

    async query(sql) {
        try {
            if (!this.connection) {
                await this.connect();
            }
            const [results] = await this.connection.execute(sql);
            return { success: true, results };
        } catch (error) {
            console.error('Database query error:', error);
            return { success: false, error };
        }
    }
}

// Session management class
class Session {
    constructor(req) {
        this.req = req;
    }

    msg(type, message) {
        if (!this.req.session.messages) {
            this.req.session.messages = [];
        }
        this.req.session.messages.push({ type, message });
    }

    getMessages() {
        const messages = this.req.session.messages || [];
        this.req.session.messages = []; // Clear messages after getting them
        return messages;
    }
}

// Global variables and instances
const db = new Database();
let errors = [];

// Helper functions
function remove_junk(input) {
    return input.toString().trim().replace(/<[^>]*>/g, '');
}

function validate_fields(fields, postData) {
    errors = [];
    fields.forEach(field => {
        if (!postData[field] || postData[field].toString().trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    return errors.length === 0;
}

async function find_all(table) {
    const query = `SELECT * FROM ${table}`;
    const result = await db.query(query);
    return result.success ? result.results : [];
}

function page_require_level(requiredLevel, req, res) {
    // Check if user has required permission level
    const userLevel = req.session.user_level || 0;
    if (userLevel < requiredLevel) {
        return res.redirect('/login');
    }
    return true;
}

function redirect(url, permanent = false, res) {
    const statusCode = permanent ? 301 : 302;
    res.status(statusCode).redirect(url);
}

function display_msg(messages) {
    if (!messages || messages.length === 0) {
        return '';
    }
    
    let html = '';
    messages.forEach(msg => {
        const alertClass = msg.type === 's' ? 'alert-success' : 'alert-danger';
        html += `<div class="alert ${alertClass} alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            ${msg.message}
        </div>`;
    });
    return html;
}

// Layout rendering functions
function renderHeader(pageTitle) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">
</head>
<body>
<div class="container">`;
}

function renderFooter() {
    return `</div>
<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js"></script>
</body>
</html>`;
}

// Route handler for add user page
app.get('/add_user', async (req, res) => {
    // Set page title
    const page_title = 'Add User';
    
    // Check user permission level
    if (!page_require_level(1, req, res)) {
        return;
    }
    
    // Get user groups
    const groups = await find_all('user_groups');
    
    // Get session instance
    const session = new Session(req);
    const msg = session.getMessages();
    
    // Render the page
    const html = `${renderHeader(page_title)}
        ${display_msg(msg)}
        <div class="row">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <strong>
                        <span class="glyphicon glyphicon-th"></span>
                        <span>Add New User</span>
                    </strong>
                </div>
                <div class="panel-body">
                    <div class="col-md-6">
                        <form method="post" action="/add_user">
                            <div class="form-group">
                                <label for="name">Name</label>
                                <input type="text" class="form-control" name="full-name" placeholder="Full Name">
                            </div>
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input type="text" class="form-control" name="username" placeholder="Username">
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" class="form-control" name="password" placeholder="Password">
                            </div>
                            <div class="form-group">
                                <label for="level">User Role</label>
                                <select class="form-control" name="level">
                                    ${groups.map(group => 
                                        `<option value="${group.group_level}">${group.group_name.charAt(0).toUpperCase() + group.group_name.slice(1)}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group clearfix">
                                <button type="submit" name="add_user" class="btn btn-primary">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        ${renderFooter()}`;
    
    res.send(html);
});

// POST route handler for adding user
app.post('/add_user', async (req, res) => {
    // Check user permission level
    if (!page_require_level(1, req, res)) {
        return;
    }
    
    // Get session instance
    const session = new Session(req);
    
    if (req.body.add_user !== undefined) {
        const req_fields = ['full-name', 'username', 'password', 'level'];
        const isValid = validate_fields(req_fields, req.body);
        
        if (errors.length === 0) {
            const name = remove_junk(db.escape(req.body['full-name']));
            const username = remove_junk(db.escape(req.body['username']));
            const password = remove_junk(db.escape(req.body['password']));
            const user_level = parseInt(db.escape(req.body['level']));
            const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
            
            let query = "INSERT INTO users (";
            query += "name,username,password,user_level,status";
            query += ") VALUES (";
            query += ` '${name}', '${username}', '${hashedPassword}', '${user_level}','1'`;
            query += ")";
            
            const result = await db.query(query);
            if (result.success) {
                // success
                session.msg('s', "User account has been creted! ");
                redirect('/add_user', false, res);
            } else {
                // failed
                session.msg('d', ' Sorry failed to create account!');
                redirect('/add_user', false, res);
            }
        } else {
            session.msg("d", errors.join(', '));
            redirect('/add_user', false, res);
        }
    } else {
        redirect('/add_user', false, res);
    }
});

// Initialize database connection and start server
async function startServer() {
    try {
        await db.connect();
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();

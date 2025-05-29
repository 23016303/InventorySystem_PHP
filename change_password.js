
// Required dependencies
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const path = require('path');
const ejs = require('ejs');

// Database connection class
class Database {
    constructor(config) {
        this.pool = mysql.createPool(config);
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            this.lastResult = rows;
            this.affectedRowsCount = rows.affectedRows || 0;
            return rows;
        } catch (error) {
            throw error;
        }
    }

    escape(value) {
        return mysql.escape(value).slice(1, -1); // Remove quotes added by mysql.escape
    }

    affected_rows() {
        return this.affectedRowsCount;
    }
}

// Session manager class
class SessionManager {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }

    msg(type, message) {
        if (!this.req.session.messages) {
            this.req.session.messages = [];
        }
        this.req.session.messages.push({ type, message });
    }

    logout() {
        this.req.session.destroy();
    }
}

// Global variables and functions
const db = new Database({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database'
});

let errors = [];

// Utility functions
function remove_junk(str) {
    return str.replace(/[<>\"'%;()&+]/g, '');
}

function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
}

function validate_fields(req_fields, post_data) {
    errors = [];
    for (let field of req_fields) {
        if (!post_data[field] || post_data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    }
    return errors.length === 0;
}

async function current_user(req) {
    if (req.session && req.session.userId) {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            return null;
        }
    }
    return null;
}

function page_require_level(required_level, user_level) {
    return user_level >= required_level;
}

function redirect(res, url, permanent = false) {
    const statusCode = permanent ? 301 : 302;
    res.redirect(statusCode, url);
}

function display_msg(messages) {
    if (!messages || messages.length === 0) return '';
    
    let html = '';
    for (let msg of messages) {
        const alertClass = msg.type === 's' ? 'alert-success' : 'alert-danger';
        html += `<div class="alert ${alertClass}">${msg.message}</div>`;
    }
    return html;
}

// Express app setup
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route handler for change password page
app.all('/change_password', async (req, res) => {
    // Set page title
    const page_title = 'Change Password';
    
    // Check user permission level
    const user = await current_user(req);
    if (!user || !page_require_level(3, user.level)) {
        return res.status(403).send('Access denied');
    }

    // Get session messages
    const msg = req.session.messages || [];
    req.session.messages = []; // Clear messages after getting them

    if (req.method === 'POST' && req.body.update) {
        const req_fields = ['new-password', 'old-password', 'id'];
        validate_fields(req_fields, req.body);

        if (errors.length === 0) {
            // Check if old password matches
            if (sha1(req.body['old-password']) !== user.password) {
                const session = new SessionManager(req, res);
                session.msg('d', "Your old password not match");
                return redirect(res, '/change_password', false);
            }

            const id = parseInt(req.body.id);
            const new_password = remove_junk(db.escape(sha1(req.body['new-password'])));
            const sql = `UPDATE users SET password ='${new_password}' WHERE id='${db.escape(id)}'`;
            
            try {
                const result = await db.query(sql);
                if (result && db.affected_rows() === 1) {
                    const session = new SessionManager(req, res);
                    session.logout();
                    session.msg('s', "Login with your new password.");
                    return redirect(res, '/index', false);
                } else {
                    const session = new SessionManager(req, res);
                    session.msg('d', ' Sorry failed to updated!');
                    return redirect(res, '/change_password', false);
                }
            } catch (error) {
                const session = new SessionManager(req, res);
                session.msg('d', 'Database error occurred');
                return redirect(res, '/change_password', false);
            }
        } else {
            const session = new SessionManager(req, res);
            session.msg("d", errors.join(', '));
            return redirect(res, '/change_password', false);
        }
    }

    // Render the page
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${page_title}</title>
    <link rel="stylesheet" href="/css/bootstrap.min.css">
</head>
<body>
    <!-- Header content would be included here -->
    <div class="login-page">
        <div class="text-center">
           <h3>Change your password</h3>
         </div>
         ${display_msg(msg)}
          <form method="post" action="/change_password" class="clearfix">
            <div class="form-group">
                  <label for="newPassword" class="control-label">New password</label>
                  <input type="password" class="form-control" name="new-password" placeholder="New password">
            </div>
            <div class="form-group">
                  <label for="oldPassword" class="control-label">Old password</label>
                  <input type="password" class="form-control" name="old-password" placeholder="Old password">
            </div>
            <div class="form-group clearfix">
                   <input type="hidden" name="id" value="${parseInt(user.id)}">
                    <button type="submit" name="update" class="btn btn-info">Change</button>
            </div>
        </form>
    </div>
    <!-- Footer content would be included here -->
</body>
</html>
    `;

    res.send(html);
});

// Additional routes that would be needed
app.get('/index', (req, res) => {
    res.send('Login page');
});

// Static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

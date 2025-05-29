
// This would be the equivalent of include_once('includes/load.php')
const load = require('./includes/load.js');

// Global errors array to match PHP behavior
let errors = [];

// Session object to handle session management
const session = {
    login: function(user_id) {
        // Store user_id in session (assuming Express session middleware)
        if (typeof req !== 'undefined' && req.session) {
            req.session.user_id = user_id;
            req.session.logged_in = true;
        }
    },
    
    msg: function(type, message) {
        // Store message in session for display (flash message equivalent)
        if (typeof req !== 'undefined' && req.session) {
            req.session.message = {
                type: type,
                text: message
            };
        }
    }
};

// Function to validate required fields
function validate_fields(req_fields) {
    errors = []; // Reset errors array
    
    req_fields.forEach(field => {
        if (!req.body || !req.body[field] || req.body[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
}

// Function to remove unwanted characters (sanitize input)
function remove_junk(str) {
    if (!str) return '';
    
    // Remove extra whitespace and potentially harmful characters
    return str.toString()
        .trim()
        .replace(/[<>'"]/g, ''); // Basic XSS prevention
}

// Function to authenticate user credentials
async function authenticate(username, password) {
    try {
        // This would typically query a database
        // Implementation depends on your database setup
        const db = require('./database'); // Assuming database module
        
        const query = "SELECT id, password FROM users WHERE username = ? LIMIT 1";
        const result = await db.query(query, [username]);
        
        if (result.length > 0) {
            const user = result[0];
            // Verify password (assuming password is hashed)
            const bcrypt = require('bcrypt');
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (isValidPassword) {
                return user.id;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

// Function to update last login time
async function updateLastLogIn(user_id) {
    try {
        const db = require('./database'); // Assuming database module
        const query = "UPDATE users SET last_login = NOW() WHERE id = ?";
        await db.query(query, [user_id]);
    } catch (error) {
        console.error('Update last login error:', error);
    }
}

// Function to handle redirects
function redirect(res, url, permanent = false) {
    const statusCode = permanent ? 301 : 302;
    res.status(statusCode).redirect(url);
}

// Main login processing function (equivalent to the PHP script)
async function processLogin(req, res) {
    const req_fields = ['username', 'password'];
    validate_fields(req_fields);
    const username = remove_junk(req.body.username);
    const password = remove_junk(req.body.password);

    if (errors.length === 0) {
        const user_id = await authenticate(username, password);
        if (user_id) {
            //create session with id
            session.login(user_id);
            //Update Sign in time
            await updateLastLogIn(user_id);
            session.msg("s", "Welcome to Inventory Management System");
            redirect(res, 'admin.php', false);
        } else {
            session.msg("d", "Sorry Username/Password incorrect.");
            redirect(res, 'index.php', false);
        }
    } else {
        session.msg("d", errors);
        redirect(res, 'index.php', false);
    }
}

// Export the main function for use in Express routes
module.exports = {
    processLogin,
    validate_fields,
    remove_junk,
    authenticate,
    updateLastLogIn,
    session,
    redirect
};


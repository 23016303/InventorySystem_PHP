
// Required dependencies
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const path = require('path');
const validator = require('validator');

const router = express.Router();

// Middleware for page require level (equivalent to page_require_level(1))
function pageRequireLevel(requiredLevel) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.level < requiredLevel) {
            req.session.msg = { type: 'd', text: 'Access denied! Insufficient permissions.' };
            return res.redirect('/login');
        }
        next();
    };
}

// Helper function equivalent to remove_junk()
function removeJunk(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
}

// Helper function equivalent to find_by_groupName()
async function findByGroupName(db, groupName) {
    try {
        const [rows] = await db.execute('SELECT * FROM user_groups WHERE group_name = ?', [groupName]);
        return rows.length > 0 ? rows[0] : false;
    } catch (error) {
        console.error('Database error in findByGroupName:', error);
        return null;
    }
}

// Helper function equivalent to find_by_groupLevel()
async function findByGroupLevel(db, groupLevel) {
    try {
        const [rows] = await db.execute('SELECT * FROM user_groups WHERE group_level = ?', [groupLevel]);
        return rows.length > 0 ? rows[0] : false;
    } catch (error) {
        console.error('Database error in findByGroupLevel:', error);
        return null;
    }
}

// Helper function equivalent to validate_fields()
function validateFields(reqFields, postData) {
    const errors = [];
    reqFields.forEach(field => {
        if (!postData[field] || postData[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    return errors;
}

// Helper function equivalent to display_msg()
function displayMsg(msg) {
    if (!msg) return '';
    
    const alertClass = msg.type === 's' ? 'alert-success' : 'alert-danger';
    return `<div class="alert ${alertClass} alert-dismissible">
        <button type="button" class="close" data-dismiss="alert">&times;</button>
        ${msg.text}
    </div>`;
}

// GET route for displaying the form
router.get('/add_group', pageRequireLevel(1), async (req, res) => {
    // Equivalent to $page_title = 'Add Group';
    const pageTitle = 'Add Group';
    
    // Get message from session (equivalent to display_msg($msg))
    const msg = req.session.msg || null;
    delete req.session.msg; // Clear message after displaying
    
    // Render the template with data
    res.render('add_group', {
        pageTitle: pageTitle,
        msg: displayMsg(msg)
    });
});

// POST route for processing the form submission
router.post('/add_group', pageRequireLevel(1), async (req, res) => {
    // Equivalent to if(isset($_POST['add'])){
    if (req.body.add !== undefined) {
        
        // Equivalent to $req_fields = array('group-name','group-level');
        const reqFields = ['group-name', 'group-level'];
        
        // Equivalent to validate_fields($req_fields);
        const errors = validateFields(reqFields, req.body);
        
        // Get database connection (assuming it's available in req.db)
        const db = req.db;
        
        // Equivalent to if(find_by_groupName($_POST['group-name']) === false ){
        const existingGroupName = await findByGroupName(db, req.body['group-name']);
        if (existingGroupName !== false) {
            req.session.msg = { type: 'd', text: '<b>Sorry!</b> Entered Group Name already in database!' };
            return res.redirect('/add_group');
        } 
        // Equivalent to elseif(find_by_groupLevel($_POST['group-level']) === false) {
        else {
            const existingGroupLevel = await findByGroupLevel(db, req.body['group-level']);
            if (existingGroupLevel !== false) {
                req.session.msg = { type: 'd', text: '<b>Sorry!</b> Entered Group Level already in database!' };
                return res.redirect('/add_group');
            }
        }
        
        // Equivalent to if(empty($errors)){
        if (errors.length === 0) {
            // Equivalent to $name = remove_junk($db->escape($_POST['group-name']));
            const name = removeJunk(req.body['group-name']);
            // Equivalent to $level = remove_junk($db->escape($_POST['group-level']));
            const level = removeJunk(req.body['group-level']);
            // Equivalent to $status = remove_junk($db->escape($_POST['status']));
            const status = removeJunk(req.body['status']);

            // Equivalent to the INSERT query construction
            const query = `INSERT INTO user_groups (group_name, group_level, group_status) VALUES (?, ?, ?)`;
            
            try {
                // Equivalent to if($db->query($query)){
                const [result] = await db.execute(query, [name, level, status]);
                
                if (result.affectedRows > 0) {
                    // Success - equivalent to $session->msg('s',"Group has been creted! ");
                    req.session.msg = { type: 's', text: 'Group has been creted! ' };
                    return res.redirect('/add_group');
                } else {
                    // Failed - equivalent to $session->msg('d',' Sorry failed to create Group!');
                    req.session.msg = { type: 'd', text: ' Sorry failed to create Group!' };
                    return res.redirect('/add_group');
                }
            } catch (error) {
                console.error('Database error:', error);
                // Failed - equivalent to $session->msg('d',' Sorry failed to create Group!');
                req.session.msg = { type: 'd', text: ' Sorry failed to create Group!' };
                return res.redirect('/add_group');
            }
        } else {
            // Equivalent to $session->msg("d", $errors);
            req.session.msg = { type: 'd', text: errors.join(', ') };
            return res.redirect('/add_group');
        }
    }
    
    // If not a POST with 'add' parameter, redirect to GET
    res.redirect('/add_group');
});

module.exports = router;

// Template file: views/add_group.ejs
// This would be saved as a separate file in your views directory
const addGroupTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title><%= pageTitle %></title>
    <!-- Include your CSS and other head elements here -->
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <%- include('layouts/header') %>
    
    <div class="login-page">
        <div class="text-center">
           <h3>Add new user Group</h3>
         </div>
         <%- msg %>
          <form method="post" action="/add_group" class="clearfix">
            <div class="form-group">
                  <label for="name" class="control-label">Group Name</label>
                  <input type="name" class="form-control" name="group-name">
            </div>
            <div class="form-group">
                  <label for="level" class="control-label">Group Level</label>
                  <input type="number" class="form-control" name="group-level">
            </div>
            <div class="form-group">
              <label for="status">Status</label>
                <select class="form-control" name="status">
                  <option value="1">Active</option>
                  <option value="0">Deactive</option>
                </select>
            </div>
            <div class="form-group clearfix">
                    <button type="submit" name="add" class="btn btn-info">Update</button>
            </div>
        </form>
    </div>

    <%- include('layouts/footer') %>
</body>
</html>
`;

// Express app setup (main application file)
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        // Create database connection - adjust connection parameters as needed
        req.db = await mysql.createConnection({
            host: 'localhost',
            user: 'your_username',
            password: 'your_password',
            database: 'your_database'
        });
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).send('Database connection error');
    }
});

// Use the router
app.use('/', router);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

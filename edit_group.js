
// Required dependencies
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2/promise');
const validator = require('validator');

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set view engine for templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};

// Global variables and functions (equivalent to includes/load.php)
let db;
let session_manager = {};
let errors = [];

// Initialize database connection
async function initDB() {
    db = await mysql.createConnection(dbConfig);
}

// Equivalent to find_by_id function
async function find_by_id(table, id) {
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}

// Equivalent to page_require_level function
function page_require_level(required_level) {
    return (req, res, next) => {
        // Check user level from session
        if (!req.session.user || req.session.user.level < required_level) {
            req.session.msg = { type: 'd', text: 'Access denied. Insufficient permissions.' };
            return res.redirect('/login.php');
        }
        next();
    };
}

// Equivalent to remove_junk function
function remove_junk(str) {
    if (!str) return '';
    return validator.escape(str.trim());
}

// Equivalent to validate_fields function
function validate_fields(req_fields, post_data) {
    errors = [];
    req_fields.forEach(field => {
        if (!post_data[field] || post_data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    return errors.length === 0;
}

// Equivalent to session message functions
session_manager.msg = function(req, type, message) {
    req.session.msg = { type: type, text: message };
};

// Equivalent to redirect function
function redirect(res, url, permanent = true) {
    const statusCode = permanent ? 301 : 302;
    res.redirect(statusCode, url);
}

// Equivalent to display_msg function
function display_msg(msg) {
    if (!msg) return '';
    
    const alertClass = msg.type === 's' ? 'alert-success' : 
                      msg.type === 'd' ? 'alert-danger' : 'alert-info';
    
    return `<div class="alert ${alertClass} alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                ${msg.text}
            </div>`;
}

// Database escape function
function escape(value) {
    return mysql.escape(value);
}

// GET route for edit_group.php
app.get('/edit_group.php', page_require_level(1), async (req, res) => {
    // Equivalent to: $page_title = 'Edit Group';
    const page_title = 'Edit Group';
    
    // Equivalent to: $e_group = find_by_id('user_groups',(int)$_GET['id']);
    const e_group = await find_by_id('user_groups', parseInt(req.query.id));
    
    // Equivalent to: if(!$e_group){ $session->msg("d","Missing Group id."); redirect('group.php'); }
    if (!e_group) {
        session_manager.msg(req, "d", "Missing Group id.");
        return redirect(res, 'group.php');
    }
    
    // Get message from session
    const msg = req.session.msg;
    delete req.session.msg;
    
    // Render the form
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${page_title}</title>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
    </head>
    <body>
        <div class="login-page">
            <div class="text-center">
               <h3>Edit Group</h3>
             </div>
             ${display_msg(msg)}
              <form method="post" action="edit_group.php?id=${parseInt(e_group.id)}" class="clearfix">
                <div class="form-group">
                      <label for="name" class="control-label">Group Name</label>
                      <input type="name" class="form-control" name="group-name" value="${remove_junk(e_group.group_name ? e_group.group_name.charAt(0).toUpperCase() + e_group.group_name.slice(1).toLowerCase() : '')}">
                </div>
                <div class="form-group">
                      <label for="level" class="control-label">Group Level</label>
                      <input type="number" class="form-control" name="group-level" value="${parseInt(e_group.group_level)}">
                </div>
                <div class="form-group">
                  <label for="status">Status</label>
                      <select class="form-control" name="status">
                        <option ${e_group.group_status === '1' ? 'selected="selected"' : ''} value="1"> Active </option>
                        <option ${e_group.group_status === '0' ? 'selected="selected"' : ''} value="0">Deactive</option>
                      </select>
                </div>
                <div class="form-group clearfix">
                        <button type="submit" name="update" class="btn btn-info">Update</button>
                </div>
            </form>
        </div>
    </body>
    </html>`;
    
    res.send(htmlContent);
});

// POST route for edit_group.php
app.post('/edit_group.php', page_require_level(1), async (req, res) => {
    // Equivalent to: $e_group = find_by_id('user_groups',(int)$_GET['id']);
    const e_group = await find_by_id('user_groups', parseInt(req.query.id));
    
    // Equivalent to: if(!$e_group){ $session->msg("d","Missing Group id."); redirect('group.php'); }
    if (!e_group) {
        session_manager.msg(req, "d", "Missing Group id.");
        return redirect(res, 'group.php');
    }
    
    // Equivalent to: if(isset($_POST['update'])){
    if (req.body.update !== undefined) {
        
        // Equivalent to: $req_fields = array('group-name','group-level');
        const req_fields = ['group-name', 'group-level'];
        
        // Equivalent to: validate_fields($req_fields);
        validate_fields(req_fields, req.body);
        
        // Equivalent to: if(empty($errors)){
        if (errors.length === 0) {
            // Equivalent to: $name = remove_junk($db->escape($_POST['group-name']));
            const name = remove_junk(escape(req.body['group-name']));
            
            // Equivalent to: $level = remove_junk($db->escape($_POST['group-level']));
            const level = remove_junk(escape(req.body['group-level']));
            
            // Equivalent to: $status = remove_junk($db->escape($_POST['status']));
            const status = remove_junk(escape(req.body['status']));
            
            // Equivalent to: $query = "UPDATE user_groups SET "; $query .= "group_name='{$name}',group_level='{$level}',group_status='{$status}'"; $query .= "WHERE ID='{$db->escape($e_group['id'])}'";
            let query = "UPDATE user_groups SET ";
            query += `group_name=${name},group_level=${level},group_status=${status}`;
            query += ` WHERE ID=${escape(e_group.id)}`;
            
            try {
                // Equivalent to: $result = $db->query($query);
                const [result] = await db.execute(query.replace(/'/g, ''), [
                    req.body['group-name'],
                    req.body['group-level'],
                    req.body['status'],
                    e_group.id
                ]);
                
                // Equivalent to: if($result && $db->affected_rows() === 1){
                if (result && result.affectedRows === 1) {
                    // Equivalent to: //sucess $session->msg('s',"Group has been updated! "); redirect('edit_group.php?id='.(int)$e_group['id'], false);
                    //sucess
                    session_manager.msg(req, 's', "Group has been updated! ");
                    return redirect(res, `edit_group.php?id=${parseInt(e_group.id)}`, false);
                } else {
                    // Equivalent to: //failed $session->msg('d',' Sorry failed to updated Group!'); redirect('edit_group.php?id='.(int)$e_group['id'], false);
                    //failed
                    session_manager.msg(req, 'd', ' Sorry failed to updated Group!');
                    return redirect(res, `edit_group.php?id=${parseInt(e_group.id)}`, false);
                }
            } catch (error) {
                //failed
                session_manager.msg(req, 'd', ' Sorry failed to updated Group!');
                return redirect(res, `edit_group.php?id=${parseInt(e_group.id)}`, false);
            }
        } else {
            // Equivalent to: } else { $session->msg("d", $errors); redirect('edit_group.php?id='.(int)$e_group['id'], false); }
            session_manager.msg(req, "d", errors);
            return redirect(res, `edit_group.php?id=${parseInt(e_group.id)}`, false);
        }
    }
});

// Initialize and start server
async function startServer() {
    await initDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer().catch(console.error);
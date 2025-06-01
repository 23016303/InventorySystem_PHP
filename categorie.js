
// Required dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');

// Database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
});

// Express app setup
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables
let countIdCounter = 0;

// Helper functions
function remove_junk(str) {
    if (!str) return '';
    return str.toString().trim().replace(/[<>\"'%;()&+]/g, '');
}

function validate_fields(req_fields, postData) {
    const errors = [];
    req_fields.forEach(field => {
        if (!postData[field] || postData[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    return errors;
}

function display_msg(msg) {
    if (!msg) return '';
    const alertClass = msg.type === 's' ? 'alert-success' : 'alert-danger';
    return `<div class="alert ${alertClass} alert-dismissible">
        <button type="button" class="close" data-dismiss="alert">&times;</button>
        ${msg.text}
    </div>`;
}

function count_id() {
    return ++countIdCounter;
}

function page_require_level(req, requiredLevel) {
    if (!req.session.user || req.session.user.level < requiredLevel) {
        throw new Error('Insufficient permissions');
    }
}

async function find_all(table) {
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table}`);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        return [];
    }
}

function escape_string(str) {
    if (!str) return '';
    return str.toString().replace(/'/g, "''");
}

function redirect(res, url, msg = null) {
    if (msg) {
        // Store message in session for next request
        res.locals.session.msg = msg;
    }
    res.redirect(url);
}

// Route handler for categories page
app.get('/categorie', async (req, res) => {
    try {
        // $page_title = 'All categories';
        const page_title = 'All categories';
        
        // require_once('includes/load.php');
        // Checkin What level user has permission to view this page
        // page_require_level(1);
        page_require_level(req, 1);
        
        // $all_categories = find_all('categories')
        const all_categories = await find_all('categories');
        
        // Reset counter for count_id function
        countIdCounter = 0;
        
        // Get any session messages
        const msg = req.session.msg || null;
        req.session.msg = null; // Clear message after displaying
        
        res.render('categorie', {
            page_title: page_title,
            all_categories: all_categories,
            msg: msg,
            display_msg: display_msg,
            remove_junk: remove_junk,
            count_id: count_id
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// POST handler for adding categories
app.post('/categorie', async (req, res) => {
    try {
        // if(isset($_POST['add_cat'])){
        if (req.body.add_cat) {
            // $req_field = array('categorie-name');
            const req_field = ['categorie-name'];
            
            // validate_fields($req_field);
            const errors = validate_fields(req_field, req.body);
            
            // $cat_name = remove_junk($db->escape($_POST['categorie-name']));
            const cat_name = remove_junk(escape_string(req.body['categorie-name']));
            
            // if(empty($errors)){
            if (errors.length === 0) {
                // $sql  = "INSERT INTO categories (name)";
                // $sql .= " VALUES ('{$cat_name}')";
                const sql = `INSERT INTO categories (name) VALUES ('${cat_name}')`;
                
                try {
                    // if($db->query($sql)){
                    await db.execute(sql);
                    // $session->msg("s", "Successfully Added New Category");
                    req.session.msg = { type: 's', text: 'Successfully Added New Category' };
                    // redirect('categorie.php',false);
                    redirect(res, '/categorie');
                } catch (dbError) {
                    // $session->msg("d", "Sorry Failed to insert.");
                    req.session.msg = { type: 'd', text: 'Sorry Failed to insert.' };
                    // redirect('categorie.php',false);
                    redirect(res, '/categorie');
                }
            } else {
                // $session->msg("d", $errors);
                req.session.msg = { type: 'd', text: errors.join(', ') };
                // redirect('categorie.php',false);
                redirect(res, '/categorie');
            }
        } else {
            res.redirect('/categorie');
        }
    } catch (error) {
        console.error('Error:', error);
        req.session.msg = { type: 'd', text: 'An error occurred while processing your request.' };
        res.redirect('/categorie');
    }
});

// EJS Template (views/categorie.ejs)
const categorieTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title><%= page_title %></title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
<!-- <?php include_once('layouts/header.php'); ?> -->
<div class="container">
    <div class="row">
        <div class="col-md-12">
            <!-- <?php echo display_msg($msg); ?> -->
            <%- display_msg(msg) %>
        </div>
    </div>
    <div class="row">
        <div class="col-md-5">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <strong>
                        <span class="glyphicon glyphicon-th"></span>
                        <span>Add New Category</span>
                    </strong>
                </div>
                <div class="panel-body">
                    <form method="post" action="/categorie">
                        <div class="form-group">
                            <input type="text" class="form-control" name="categorie-name" placeholder="Category Name">
                        </div>
                        <button type="submit" name="add_cat" value="1" class="btn btn-primary">Add Category</button>
                    </form>
                </div>
            </div>
        </div>
        <div class="col-md-7">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <strong>
                        <span class="glyphicon glyphicon-th"></span>
                        <span>All Categories</span>
                    </strong>
                </div>
                <div class="panel-body">
                    <table class="table table-bordered table-striped table-hover">
                        <thead>
                            <tr>
                                <th class="text-center" style="width: 50px;">#</th>
                                <th>Categories</th>
                                <th class="text-center" style="width: 100px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- <?php foreach ($all_categories as $cat):?> -->
                            <% all_categories.forEach(function(cat) { %>
                                <tr>
                                    <td class="text-center">
                                        <!-- <?php echo count_id();?> -->
                                        <%= count_id() %>
                                    </td>
                                    <td>
                                        <!-- <?php echo remove_junk(ucfirst($cat['name'])); ?> -->
                                        <%= remove_junk(cat.name.charAt(0).toUpperCase() + cat.name.slice(1)) %>
                                    </td>
                                    <td class="text-center">
                                        <div class="btn-group">
                                            <!-- <a href="edit_categorie.php?id=<?php echo (int)$cat['id'];?>" class="btn btn-xs btn-warning" data-toggle="tooltip" title="Edit"> -->
                                            <a href="/edit_categorie?id=<%= parseInt(cat.id) %>" class="btn btn-xs btn-warning" data-toggle="tooltip" title="Edit">
                                                <span class="glyphicon glyphicon-edit"></span>
                                            </a>
                                            <!-- <a href="delete_categorie.php?id=<?php echo (int)$cat['id'];?>" class="btn btn-xs btn-danger" data-toggle="tooltip" title="Remove"> -->
                                            <a href="/delete_categorie?id=<%= parseInt(cat.id) %>" class="btn btn-xs btn-danger" data-toggle="tooltip" title="Remove">
                                                <span class="glyphicon glyphicon-trash"></span>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            <!-- <?php endforeach; ?> -->
                            <% }); %>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- <?php include_once('layouts/footer.php'); ?> -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
</body>
</html>
`;

// Save the template to views/categorie.ejs
const fs = require('fs');
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir);
}
fs.writeFileSync(path.join(viewsDir, 'categorie.ejs'), categorieTemplate);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;


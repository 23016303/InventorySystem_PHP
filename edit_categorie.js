
// Required dependencies
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const path = require('path');
const ejs = require('ejs');

// edit_categorie.js - Express route handler
const router = express.Router();

// Utility functions (equivalent to PHP includes/load.php functions)
class Database {
    constructor(connection) {
        this.connection = connection;
        this.lastAffectedRows = 0;
    }

    escape(value) {
        return this.connection.escape(value);
    }

    async query(sql) {
        try {
            const [rows, fields] = await this.connection.execute(sql);
            this.lastAffectedRows = rows.affectedRows || 0;
            return rows;
        } catch (error) {
            throw error;
        }
    }

    affected_rows() {
        return this.lastAffectedRows;
    }
}

class Session {
    constructor(req) {
        this.req = req;
        if (!this.req.session.messages) {
            this.req.session.messages = [];
        }
    }

    msg(type, message) {
        this.req.session.messages.push({ type: type, text: message });
    }

    getMessages() {
        const messages = this.req.session.messages || [];
        this.req.session.messages = [];
        return messages;
    }
}

// Helper functions
function remove_junk(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

function validate_fields(req_fields, post_data) {
    const errors = [];
    req_fields.forEach(field => {
        if (!post_data[field] || post_data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    return errors;
}

async function find_by_id(table, id, db) {
    try {
        const sql = `SELECT * FROM ${table} WHERE id = ${parseInt(id)} LIMIT 1`;
        const result = await db.query(sql);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        return null;
    }
}

function page_require_level(required_level, user_level) {
    return user_level >= required_level;
}

function redirect(res, url, end = true) {
    res.redirect(url);
    if (end) {
        return;
    }
}

function display_msg(messages) {
    let html = '';
    messages.forEach(msg => {
        const alertClass = msg.type === 's' ? 'alert-success' : 'alert-danger';
        html += `<div class="alert ${alertClass}">${msg.text}</div>`;
    });
    return html;
}

// GET route for edit categorie page
router.get('/edit_categorie.php', async (req, res) => {
    // $page_title = 'Edit categorie';
    const page_title = 'Edit categorie';
    
    // require_once('includes/load.php');
    // (Dependencies loaded at top of file)
    
    // Checkin What level user has permission to view this page
    // page_require_level(1);
    const user_level = req.session.user_level || 0;
    if (!page_require_level(1, user_level)) {
        return res.status(403).send('Access denied');
    }

    // Initialize database and session
    const db = new Database(req.app.locals.dbConnection);
    const session = new Session(req);

    //Display all catgories.
    //$categorie = find_by_id('categories',(int)$_GET['id']);
    const categorie = await find_by_id('categories', parseInt(req.query.id), db);
    
    //if(!$categorie){
    if (!categorie) {
        //$session->msg("d","Missing categorie id.");
        session.msg("d", "Missing categorie id.");
        //redirect('categorie.php');
        return redirect(res, 'categorie.php');
    }
    //}

    // Get messages for display
    const msg = session.getMessages();

    // Render the page
    const html = `
<?php include_once('layouts/header.php'); ?>

<div class="row">
   <div class="col-md-12">
     ${display_msg(msg)}
   </div>
   <div class="col-md-5">
     <div class="panel panel-default">
       <div class="panel-heading">
         <strong>
           <span class="glyphicon glyphicon-th"></span>
           <span>Editing ${remove_junk(categorie.name.charAt(0).toUpperCase() + categorie.name.slice(1))}</span>
        </strong>
       </div>
       <div class="panel-body">
         <form method="post" action="edit_categorie.php?id=${parseInt(categorie.id)}">
           <div class="form-group">
               <input type="text" class="form-control" name="categorie-name" value="${remove_junk(categorie.name.charAt(0).toUpperCase() + categorie.name.slice(1))}">
           </div>
           <button type="submit" name="edit_cat" class="btn btn-primary">Update categorie</button>
       </form>
       </div>
     </div>
   </div>
</div>

<?php include_once('layouts/footer.php'); ?>
    `;

    res.send(html);
});

// POST route for edit categorie form submission
router.post('/edit_categorie.php', async (req, res) => {
    // $page_title = 'Edit categorie';
    const page_title = 'Edit categorie';
    
    // require_once('includes/load.php');
    // (Dependencies loaded at top of file)
    
    // Checkin What level user has permission to view this page
    // page_require_level(1);
    const user_level = req.session.user_level || 0;
    if (!page_require_level(1, user_level)) {
        return res.status(403).send('Access denied');
    }

    // Initialize database and session
    const db = new Database(req.app.locals.dbConnection);
    const session = new Session(req);

    //Display all catgories.
    //$categorie = find_by_id('categories',(int)$_GET['id']);
    const categorie = await find_by_id('categories', parseInt(req.query.id), db);
    
    //if(!$categorie){
    if (!categorie) {
        //$session->msg("d","Missing categorie id.");
        session.msg("d", "Missing categorie id.");
        //redirect('categorie.php');
        return redirect(res, 'categorie.php');
    }
    //}

    //if(isset($_POST['edit_cat'])){
    if (req.body.edit_cat !== undefined) {
        //$req_field = array('categorie-name');
        const req_field = ['categorie-name'];
        
        //validate_fields($req_field);
        const errors = validate_fields(req_field, req.body);
        
        //$cat_name = remove_junk($db->escape($_POST['categorie-name']));
        const cat_name = remove_junk(db.escape(req.body['categorie-name']));
        
        //if(empty($errors)){
        if (errors.length === 0) {
            //$sql = "UPDATE categories SET name='{$cat_name}'";
            let sql = `UPDATE categories SET name=${cat_name}`;
            //$sql .= " WHERE id='{$categorie['id']}'";
            sql += ` WHERE id='${categorie.id}'`;
            
            //$result = $db->query($sql);
            const result = await db.query(sql);
            
            //if($result && $db->affected_rows() === 1) {
            if (result && db.affected_rows() === 1) {
                //$session->msg("s", "Successfully updated Categorie");
                session.msg("s", "Successfully updated Categorie");
                //redirect('categorie.php',false);
                return redirect(res, 'categorie.php', false);
            //} else {
            } else {
                //$session->msg("d", "Sorry! Failed to Update");
                session.msg("d", "Sorry! Failed to Update");
                //redirect('categorie.php',false);
                return redirect(res, 'categorie.php', false);
            //}
            }
        //} else {
        } else {
            //$session->msg("d", $errors);
            session.msg("d", errors.join(', '));
            //redirect('categorie.php',false);
            return redirect(res, 'categorie.php', false);
        //}
        }
    //}
    }
});

module.exports = router;
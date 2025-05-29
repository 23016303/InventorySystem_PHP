
// Required dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

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

// Global variables
let db;
let errors = [];
let msg = '';

// Database connection
async function initializeDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

// Helper function to escape database inputs
function escape(value) {
    if (db && db.escape) {
        return db.escape(value).replace(/^'|'$/g, ''); // Remove quotes added by mysql escape
    }
    return value ? value.toString().replace(/'/g, "''") : '';
}

// Helper function to remove junk characters
function remove_junk(str) {
    if (!str) return '';
    return str.toString()
        .trim()
        .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

// Helper function to validate required fields
function validate_fields(required_fields, post_data) {
    errors = [];
    for (let field of required_fields) {
        if (!post_data[field] || post_data[field].toString().trim() === '') {
            errors.push(`${field} is required`);
        }
    }
    return errors.length === 0;
}

// Helper function to check user permission level
function page_require_level(required_level) {
    // This would typically check the user's session for their permission level
    // For now, we'll assume the user has sufficient permissions
    return true;
}

// Helper function to find all records from a table
async function find_all(table) {
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table}`);
        return rows;
    } catch (error) {
        console.error(`Error fetching from ${table}:`, error);
        return [];
    }
}

// Helper function to create current date
function make_date() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Session message functions
const sessionManager = {
    msg: function(type, message) {
        // In a real application, this would store in session
        // For this translation, we'll store globally
        global.sessionMessage = { type: type, message: message };
    }
};

// Display message function
function display_msg(message) {
    if (global.sessionMessage) {
        const msgClass = global.sessionMessage.type === 's' ? 'alert-success' : 'alert-danger';
        const msgText = Array.isArray(global.sessionMessage.message) ? 
            global.sessionMessage.message.join(', ') : global.sessionMessage.message;
        global.sessionMessage = null; // Clear after displaying
        return `<div class="alert ${msgClass}">${msgText}</div>`;
    }
    return '';
}

// Redirect function
function redirect(url, permanent = false) {
    return { redirect: url, permanent: permanent };
}

// Route handler for add_product.php
app.get('/add_product.php', async (req, res) => {
    // Set page title
    const page_title = 'Add Product';
    
    // Check user permission level
    page_require_level(2);
    
    // Fetch all categories and photos
    const all_categories = await find_all('categories');
    const all_photo = await find_all('media');
    
    // Generate HTML response
    const html = `
<?php include_once('layouts/header.php'); ?>
<div class="row">
  <div class="col-md-12">
    ${display_msg(msg)}
  </div>
</div>
  <div class="row">
  <div class="col-md-8">
      <div class="panel panel-default">
        <div class="panel-heading">
          <strong>
            <span class="glyphicon glyphicon-th"></span>
            <span>Add New Product</span>
         </strong>
        </div>
        <div class="panel-body">
         <div class="col-md-12">
          <form method="post" action="add_product.php" class="clearfix">
              <div class="form-group">
                <div class="input-group">
                  <span class="input-group-addon">
                   <i class="glyphicon glyphicon-th-large"></i>
                  </span>
                  <input type="text" class="form-control" name="product-title" placeholder="Product Title">
               </div>
              </div>
              <div class="form-group">
                <div class="row">
                  <div class="col-md-6">
                    <select class="form-control" name="product-categorie">
                      <option value="">Select Product Category</option>
                    ${all_categories.map(cat => `
                      <option value="${parseInt(cat.id)}">
                        ${cat.name}</option>
                    `).join('')}
                    </select>
                  </div>
                  <div class="col-md-6">
                    <select class="form-control" name="product-photo">
                      <option value="">Select Product Photo</option>
                    ${all_photo.map(photo => `
                      <option value="${parseInt(photo.id)}">
                        ${photo.file_name}</option>
                    `).join('')}
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-group">
               <div class="row">
                 <div class="col-md-4">
                   <div class="input-group">
                     <span class="input-group-addon">
                      <i class="glyphicon glyphicon-shopping-cart"></i>
                     </span>
                     <input type="number" class="form-control" name="product-quantity" placeholder="Product Quantity">
                  </div>
                 </div>
                 <div class="col-md-4">
                   <div class="input-group">
                     <span class="input-group-addon">
                       <i class="glyphicon glyphicon-usd"></i>
                     </span>
                     <input type="number" class="form-control" name="buying-price" placeholder="Buying Price">
                     <span class="input-group-addon">.00</span>
                  </div>
                 </div>
                  <div class="col-md-4">
                    <div class="input-group">
                      <span class="input-group-addon">
                        <i class="glyphicon glyphicon-usd"></i>
                      </span>
                      <input type="number" class="form-control" name="saleing-price" placeholder="Selling Price">
                      <span class="input-group-addon">.00</span>
                   </div>
                  </div>
               </div>
              </div>
              <button type="submit" name="add_product" class="btn btn-danger">Add product</button>
          </form>
         </div>
        </div>
      </div>
    </div>
  </div>

<?php include_once('layouts/footer.php'); ?>
    `;
    
    res.send(html);
});

// POST handler for adding products
app.post('/add_product.php', async (req, res) => {
    if (req.body.add_product !== undefined) {
        const req_fields = ['product-title', 'product-categorie', 'product-quantity', 'buying-price', 'saleing-price'];
        
        if (validate_fields(req_fields, req.body)) {
            if (errors.length === 0) {
                const p_name = remove_junk(escape(req.body['product-title']));
                const p_cat = remove_junk(escape(req.body['product-categorie']));
                const p_qty = remove_junk(escape(req.body['product-quantity']));
                const p_buy = remove_junk(escape(req.body['buying-price']));
                const p_sale = remove_junk(escape(req.body['saleing-price']));
                
                let media_id;
                if (req.body['product-photo'] === null || req.body['product-photo'] === "") {
                    media_id = '0';
                } else {
                    media_id = remove_junk(escape(req.body['product-photo']));
                }
                
                const date = make_date();
                
                let query = "INSERT INTO products (";
                query += " name,quantity,buy_price,sale_price,categorie_id,media_id,date";
                query += ") VALUES (";
                query += ` '${p_name}', '${p_qty}', '${p_buy}', '${p_sale}', '${p_cat}', '${media_id}', '${date}'`;
                query += ")";
                query += ` ON DUPLICATE KEY UPDATE name='${p_name}'`;
                
                try {
                    await db.execute(query);
                    sessionManager.msg('s', "Product added ");
                    const redirectResult = redirect('add_product.php', false);
                    res.redirect(redirectResult.redirect);
                } catch (error) {
                    console.error('Database query error:', error);
                    sessionManager.msg('d', ' Sorry failed to added!');
                    const redirectResult = redirect('product.php', false);
                    res.redirect(redirectResult.redirect);
                }
            } else {
                sessionManager.msg("d", errors);
                const redirectResult = redirect('add_product.php', false);
                res.redirect(redirectResult.redirect);
            }
        } else {
            sessionManager.msg("d", errors);
            const redirectResult = redirect('add_product.php', false);
            res.redirect(redirectResult.redirect);
        }
    }
});

// Initialize database and start server
async function startServer() {
    await initializeDatabase();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Start the application
startServer().catch(console.error);

module.exports = app;

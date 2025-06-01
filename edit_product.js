
// Required dependencies
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
const { body, validationResult } = require('express-validator');

// Assuming these are custom modules that need to be implemented
const { 
  page_require_level, 
  find_by_id, 
  find_all, 
  remove_junk, 
  validate_fields, 
  display_msg,
  redirect 
} = require('./includes/load');

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Set page title
let page_title = 'Edit product';

// Database connection setup (assuming MySQL)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
});

// Session object to mimic PHP session functionality
class SessionManager {
  constructor(req) {
    this.req = req;
  }
  
  msg(type, message) {
    if (!this.req.session.messages) {
      this.req.session.messages = [];
    }
    this.req.session.messages.push({ type, message });
  }
}

// Custom database class to mimic PHP database functionality
class Database {
  constructor(connection) {
    this.connection = connection;
    this.lastResult = null;
  }
  
  escape(value) {
    return mysql.escape(value);
  }
  
  async query(sql) {
    try {
      const [rows, fields] = await this.connection.execute(sql);
      this.lastResult = rows;
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      return false;
    }
  }
  
  affected_rows() {
    return this.lastResult ? this.lastResult.affectedRows || 0 : 0;
  }
}

const dbInstance = new Database(db);

// Global variables to mimic PHP globals
let errors = [];
let msg = '';

// GET route for edit product page
app.get('/edit_product.php', async (req, res) => {
  try {
    // Checkin What level user has permission to view this page
    page_require_level(2);
    
    const session = new SessionManager(req);
    
    const product = await find_by_id('products', parseInt(req.query.id));
    const all_categories = await find_all('categories');
    const all_photo = await find_all('media');
    
    if (!product) {
      session.msg("d", "Missing product id.");
      return redirect(res, 'product.php');
    }
    
    // Get any messages from session
    const messages = req.session.messages || [];
    req.session.messages = []; // Clear messages after displaying
    msg = display_msg(messages);
    
    // Render the HTML
    const html = `
    ${await include_once('layouts/header.php')}
    <div class="row">
      <div class="col-md-12">
        ${msg}
      </div>
    </div>
      <div class="row">
          <div class="panel panel-default">
            <div class="panel-heading">
              <strong>
                <span class="glyphicon glyphicon-th"></span>
                <span>Add New Product</span>
             </strong>
            </div>
            <div class="panel-body">
             <div class="col-md-7">
               <form method="post" action="edit_product.php?id=${parseInt(product.id)}">
                  <div class="form-group">
                    <div class="input-group">
                      <span class="input-group-addon">
                       <i class="glyphicon glyphicon-th-large"></i>
                      </span>
                      <input type="text" class="form-control" name="product-title" value="${remove_junk(product.name)}">
                   </div>
                  </div>
                  <div class="form-group">
                    <div class="row">
                      <div class="col-md-6">
                        <select class="form-control" name="product-categorie">
                        <option value=""> Select a categorie</option>
                       ${all_categories.map(cat => `
                         <option value="${parseInt(cat.id)}" ${product.categorie_id === cat.id ? "selected" : ""}>
                           ${remove_junk(cat.name)}</option>
                       `).join('')}
                     </select>
                      </div>
                      <div class="col-md-6">
                        <select class="form-control" name="product-photo">
                          <option value=""> No image</option>
                          ${all_photo.map(photo => `
                            <option value="${parseInt(photo.id)}" ${product.media_id === photo.id ? "selected" : ""}>
                              ${photo.file_name}</option>
                          `).join('')}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                   <div class="row">
                     <div class="col-md-4">
                      <div class="form-group">
                        <label for="qty">Quantity</label>
                        <div class="input-group">
                          <span class="input-group-addon">
                           <i class="glyphicon glyphicon-shopping-cart"></i>
                          </span>
                          <input type="number" class="form-control" name="product-quantity" value="${remove_junk(product.quantity)}">
                       </div>
                      </div>
                     </div>
                     <div class="col-md-4">
                      <div class="form-group">
                        <label for="qty">Buying price</label>
                        <div class="input-group">
                          <span class="input-group-addon">
                            <i class="glyphicon glyphicon-usd"></i>
                          </span>
                          <input type="number" class="form-control" name="buying-price" value="${remove_junk(product.buy_price)}">
                          <span class="input-group-addon">.00</span>
                       </div>
                      </div>
                     </div>
                      <div class="col-md-4">
                       <div class="form-group">
                         <label for="qty">Selling price</label>
                         <div class="input-group">
                           <span class="input-group-addon">
                             <i class="glyphicon glyphicon-usd"></i>
                           </span>
                           <input type="number" class="form-control" name="saleing-price" value="${remove_junk(product.sale_price)}">
                           <span class="input-group-addon">.00</span>
                        </div>
                       </div>
                      </div>
                   </div>
                  </div>
                  <button type="submit" name="product" class="btn btn-danger">Update</button>
              </form>
             </div>
            </div>
          </div>
      </div>

    ${await include_once('layouts/footer.php')}
    `;
    
    res.send(html);
    
  } catch (error) {
    console.error('Error in GET /edit_product.php:', error);
    res.status(500).send('Internal Server Error');
  }
});

// POST route for form submission
app.post('/edit_product.php', async (req, res) => {
  try {
    const session = new SessionManager(req);
    
    if (req.body.product !== undefined) {
      const req_fields = ['product-title', 'product-categorie', 'product-quantity', 'buying-price', 'saleing-price'];
      validate_fields(req_fields, req.body);
      
      if (errors.length === 0) {
        const p_name = remove_junk(dbInstance.escape(req.body['product-title']));
        const p_cat = parseInt(req.body['product-categorie']);
        const p_qty = remove_junk(dbInstance.escape(req.body['product-quantity']));
        const p_buy = remove_junk(dbInstance.escape(req.body['buying-price']));
        const p_sale = remove_junk(dbInstance.escape(req.body['saleing-price']));
        
        let media_id;
        if (req.body['product-photo'] === null || req.body['product-photo'] === "") {
          media_id = '0';
        } else {
          media_id = remove_junk(dbInstance.escape(req.body['product-photo']));
        }
        
        const product = await find_by_id('products', parseInt(req.query.id));
        
        let query = "UPDATE products SET";
        query += ` name ='${p_name}', quantity ='${p_qty}',`;
        query += ` buy_price ='${p_buy}', sale_price ='${p_sale}', categorie_id ='${p_cat}',media_id='${media_id}'`;
        query += ` WHERE id ='${product.id}'`;
        
        const result = await dbInstance.query(query);
        
        if (result && dbInstance.affected_rows() === 1) {
          session.msg('s', "Product updated ");
          redirect(res, 'product.php', false);
        } else {
          session.msg('d', ' Sorry failed to updated!');
          redirect(res, `edit_product.php?id=${product.id}`, false);
        }
      } else {
        session.msg("d", errors);
        const product = await find_by_id('products', parseInt(req.query.id));
        redirect(res, `edit_product.php?id=${product.id}`, false);
      }
    }
    
  } catch (error) {
    console.error('Error in POST /edit_product.php:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper function to mimic PHP include_once
async function include_once(filepath) {
  // This would need to be implemented based on your templating system
  // For now, returning empty string as placeholder
  const fs = require('fs').promises;
  try {
    const content = await fs.readFile(path.join(__dirname, filepath), 'utf8');
    return content;
  } catch (error) {
    console.error(`Error including file ${filepath}:`, error);
    return '';
  }
}

module.exports = app;

// Required dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const path = require('path');
const moment = require('moment');

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};

// Database connection pool
const pool = mysql.createPool(dbConfig);

// Session management class
class SessionManager {
    constructor(req) {
        this.req = req;
    }

    msg(type, message) {
        if (!this.req.session.messages) {
            this.req.session.messages = [];
        }
        this.req.session.messages.push({ type: type, text: message });
    }

    getMessages() {
        const messages = this.req.session.messages || [];
        this.req.session.messages = [];
        return messages;
    }
}

// Database wrapper class
class Database {
    constructor() {
        this.pool = pool;
        this.affectedRowsCount = 0;
    }

    escape(value) {
        if (typeof value === 'string') {
            return mysql.escape(value).slice(1, -1); // Remove quotes added by mysql.escape
        }
        return value;
    }

    async query(sql) {
        try {
            const [results, fields] = await this.pool.execute(sql);
            this.affectedRowsCount = results.affectedRows || 0;
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            return false;
        }
    }

    affected_rows() {
        return this.affectedRowsCount;
    }
}

// Global variables
let errors = [];

// Helper functions
function page_require_level(level) {
    return (req, res, next) => {
        // Check user permission level
        if (!req.session.user || req.session.user.level < level) {
            return res.redirect('/login.php');
        }
        next();
    };
}

async function find_by_id(table, id) {
    const db = new Database();
    const sql = `SELECT * FROM ${table} WHERE id = ${parseInt(id)} LIMIT 1`;
    const result = await db.query(sql);
    return result && result.length > 0 ? result[0] : null;
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

async function update_product_qty(qty, product_id) {
    const db = new Database();
    const sql = `UPDATE products SET quantity = quantity - ${parseInt(qty)} WHERE id = ${parseInt(product_id)}`;
    return await db.query(sql);
}

function remove_junk(str) {
    if (!str) return '';
    return str.toString().replace(/[<>]/g, '');
}

function display_msg(messages) {
    let html = '';
    for (let msg of messages) {
        const alertClass = msg.type === 's' ? 'alert-success' : 
                          msg.type === 'd' ? 'alert-danger' : 'alert-info';
        html += `<div class="alert ${alertClass}">${msg.text}</div>`;
    }
    return html;
}

function redirect(url, end = true) {
    // This would be handled differently in Express - return redirect response
    return { redirect: url, end: end };
}

// Route handler for edit_sale.php
app.get('/edit_sale.php', page_require_level(3), async (req, res) => {
    const page_title = 'Edit sale';
    const session = new SessionManager(req);
    const db = new Database();

    // Checkin What level user has permission to view this page
    // (Already handled by middleware)

    const sale = await find_by_id('sales', parseInt(req.query.id));
    if (!sale) {
        session.msg("d", "Missing product id.");
        return res.redirect('sales.php');
    }

    const product = await find_by_id('products', sale.product_id);
    const msg = session.getMessages();

    res.render('edit_sale', {
        page_title: page_title,
        sale: sale,
        product: product,
        msg: msg,
        display_msg: display_msg,
        remove_junk: remove_junk
    });
});

app.post('/edit_sale.php', page_require_level(3), async (req, res) => {
    const session = new SessionManager(req);
    const db = new Database();

    const sale = await find_by_id('sales', parseInt(req.query.id));
    if (!sale) {
        session.msg("d", "Missing product id.");
        return res.redirect('sales.php');
    }

    const product = await find_by_id('products', sale.product_id);

    if (req.body.update_sale) {
        const req_fields = ['title', 'quantity', 'price', 'total', 'date'];
        const isValid = validate_fields(req_fields, req.body);
        
        if (isValid) {
            const p_id = db.escape(parseInt(product.id));
            const s_qty = db.escape(parseInt(req.body.quantity));
            const s_total = db.escape(req.body.total);
            const date = db.escape(req.body.date);
            const s_date = moment(date).format("YYYY-MM-DD");

            let sql = "UPDATE sales SET";
            sql += ` product_id= '${p_id}',qty=${s_qty},price='${s_total}',date='${s_date}'`;
            sql += ` WHERE id ='${sale.id}'`;
            
            const result = await db.query(sql);
            if (result && db.affected_rows() === 1) {
                await update_product_qty(s_qty, p_id);
                session.msg('s', "Sale updated.");
                return res.redirect(`edit_sale.php?id=${sale.id}`);
            } else {
                session.msg('d', ' Sorry failed to updated!');
                return res.redirect('sales.php');
            }
        } else {
            session.msg("d", errors.join(', '));
            return res.redirect(`edit_sale.php?id=${parseInt(sale.id)}`);
        }
    }
});

// EJS template for edit_sale.ejs
const editSaleTemplate = `
<%- include('layouts/header') %>
<div class="row">
  <div class="col-md-6">
    <%- display_msg(msg) %>
  </div>
</div>
<div class="row">

  <div class="col-md-12">
  <div class="panel">
    <div class="panel-heading clearfix">
      <strong>
        <span class="glyphicon glyphicon-th"></span>
        <span>All Sales</span>
     </strong>
     <div class="pull-right">
       <a href="sales.php" class="btn btn-primary">Show all sales</a>
     </div>
    </div>
    <div class="panel-body">
       <table class="table table-bordered">
         <thead>
          <th> Product title </th>
          <th> Qty </th>
          <th> Price </th>
          <th> Total </th>
          <th> Date</th>
          <th> Action</th>
         </thead>
           <tbody  id="product_info">
              <tr>
              <form method="post" action="edit_sale.php?id=<%= parseInt(sale.id) %>">
                <td id="s_name">
                  <input type="text" class="form-control" id="sug_input" name="title" value="<%= remove_junk(product.name) %>">
                  <div id="result" class="list-group"></div>
                </td>
                <td id="s_qty">
                  <input type="text" class="form-control" name="quantity" value="<%= parseInt(sale.qty) %>">
                </td>
                <td id="s_price">
                  <input type="text" class="form-control" name="price" value="<%= remove_junk(product.sale_price) %>" >
                </td>
                <td>
                  <input type="text" class="form-control" name="total" value="<%= remove_junk(sale.price) %>">
                </td>
                <td id="s_date">
                  <input type="date" class="form-control datepicker" name="date" data-date-format="" value="<%= remove_junk(sale.date) %>">
                </td>
                <td>
                  <button type="submit" name="update_sale" class="btn btn-primary">Update sale</button>
                </td>
              </form>
              </tr>
           </tbody>
       </table>

    </div>
  </div>
  </div>

</div>

<%- include('layouts/footer') %>
`;

// Write the template to file (this would typically be done outside the code)
const fs = require('fs');
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
}
fs.writeFileSync(path.join(viewsDir, 'edit_sale.ejs'), editSaleTemplate);

module.exports = app;
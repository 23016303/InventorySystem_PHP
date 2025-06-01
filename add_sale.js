
// Required dependencies
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const moment = require('moment');

// Import custom modules (these would need to be implemented)
const { pageRequireLevel } = require('./includes/auth');
const { validateFields } = require('./includes/validation');
const { makeDate } = require('./includes/helpers');
const { updateProductQty } = require('./includes/product');
const { displayMsg } = require('./includes/messages');

// Database connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory'
});

// Escape function for database queries
db.escape = function(value) {
    return mysql.escape(value);
};

// Express app setup
const app = express();
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

// Add Sale Route
app.get('/add_sale.php', async (req, res) => {
    const pageTitle = 'Add Sale';
    
    // Check what level user has permission to view this page
    try {
        await pageRequireLevel(req, 3);
    } catch (error) {
        return res.redirect('/login.php');
    }

    const msg = req.session.msg || '';
    req.session.msg = '';

    // Render the page
    res.render('add_sale', {
        pageTitle: pageTitle,
        msg: msg,
        displayMsg: displayMsg
    });
});

app.post('/add_sale.php', async (req, res) => {
    const pageTitle = 'Add Sale';
    
    // Check what level user has permission to view this page
    try {
        await pageRequireLevel(req, 3);
    } catch (error) {
        return res.redirect('/login.php');
    }

    if (req.body.add_sale) {
        const reqFields = ['s_id', 'quantity', 'price', 'total', 'date'];
        const errors = validateFields(req.body, reqFields);
        
        if (!errors || errors.length === 0) {
            const pId = db.escape(parseInt(req.body.s_id));
            const sQty = db.escape(parseInt(req.body.quantity));
            const sTotal = db.escape(req.body.total);
            const date = db.escape(req.body.date);
            const sDate = makeDate();

            let sql = "INSERT INTO sales (";
            sql += " product_id,qty,price,date";
            sql += ") VALUES (";
            sql += `${pId},${sQty},${sTotal},'${sDate}'`;
            sql += ")";

            try {
                await new Promise((resolve, reject) => {
                    db.query(sql, (error, results) => {
                        if (error) reject(error);
                        else resolve(results);
                    });
                });

                await updateProductQty(sQty, pId);
                req.session.msg = { type: 's', text: "Sale added. " };
                res.redirect('/add_sale.php');
            } catch (error) {
                req.session.msg = { type: 'd', text: ' Sorry failed to add!' };
                res.redirect('/add_sale.php');
            }
        } else {
            req.session.msg = { type: 'd', text: errors };
            res.redirect('/add_sale.php');
        }
    }
});

// Export for use in main app
module.exports = app;

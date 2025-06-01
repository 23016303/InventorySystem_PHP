
// Required dependencies
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Database connection setup (you'll need to configure your actual database credentials)
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};

// Session management object equivalent
const sessionManager = {
    isUserLoggedIn: function(requireLogin = false) {
        // Implementation of session check - adjust based on your session structure
        return req.session && req.session.user_id ? true : false;
    }
};

// Database utility functions
async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

// Utility functions
function removeJunk(str) {
    // Remove unwanted characters and sanitize input
    if (!str) return '';
    return str.toString()
        .replace(/[<>'"]/g, '')
        .trim();
}

function dbEscape(str) {
    // Escape database input - mysql2 handles this with prepared statements
    // This function maintains compatibility with the original structure
    return str ? str.toString().replace(/'/g, "''") : '';
}

function addslashes(str = '') {
    // Add slashes before quotes
    return str.toString()
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\0/g, '\\0');
}

// Database query functions
async function findProductByTitle(productName) {
    const connection = await getDbConnection();
    try {
        const query = "SELECT * FROM products WHERE name LIKE ? LIMIT 10";
        const [rows] = await connection.execute(query, [`%${productName}%`]);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        return [];
    } finally {
        await connection.end();
    }
}

async function findAllProductInfoByTitle(productTitle) {
    const connection = await getDbConnection();
    try {
        const query = "SELECT id, name, sale_price FROM products WHERE name LIKE ? LIMIT 10";
        const [rows] = await connection.execute(query, [`%${productTitle}%`]);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        return [];
    } finally {
        await connection.end();
    }
}

// Session check middleware
function requireLogin(req, res, next) {
    if (!sessionManager.isUserLoggedIn(true)) {
        return res.redirect('/index.php');
    }
    next();
}

// Main route handler
app.post('/', requireLogin, async (req, res) => {
    let html = '';

    // Auto suggestion functionality
    if (req.body.product_name && req.body.product_name.length > 0) {
        const products = await findProductByTitle(req.body.product_name);
        
        if (products && products.length > 0) {
            products.forEach(product => {
                html += "<li class=\"list-group-item\">";
                html += product.name;
                html += "</li>";
            });
        } else {
            html += '<li onClick=\"fill(\'' + addslashes() + '\')\" class=\"list-group-item\">';
            html += 'Not found';
            html += "</li>";
        }

        return res.json(html);
    }

    // Find all product functionality
    if (req.body.p_name && req.body.p_name.length > 0) {
        const productTitle = removeJunk(dbEscape(req.body.p_name));
        const results = await findAllProductInfoByTitle(productTitle);
        
        if (results && results.length > 0) {
            results.forEach(result => {
                html += "<tr>";
                html += "<td id=\"s_name\">" + result.name + "</td>";
                html += "<input type=\"hidden\" name=\"s_id\" value=\"" + result.id + "\">";
                html += "<td>";
                html += "<input type=\"text\" class=\"form-control\" name=\"price\" value=\"" + result.sale_price + "\">";
                html += "</td>";
                html += "<td id=\"s_qty\">";
                html += "<input type=\"text\" class=\"form-control\" name=\"quantity\" value=\"1\">";
                html += "</td>";
                html += "<td>";
                html += "<input type=\"text\" class=\"form-control\" name=\"total\" value=\"" + result.sale_price + "\">";
                html += "</td>";
                html += "<td>";
                html += "<input type=\"date\" class=\"form-control datePicker\" name=\"date\" data-date data-date-format=\"yyyy-mm-dd\">";
                html += "</td>";
                html += "<td>";
                html += "<button type=\"submit\" name=\"add_sale\" class=\"btn btn-primary\">Add sale</button>";
                html += "</td>";
                html += "</tr>";
            });
        } else {
            html = '<tr><td>product name not resgister in database</td></tr>';
        }

        return res.json(html);
    }

    // If no valid POST data, return empty response
    res.json('');
});

// Redirect route for index.php
app.get('/index.php', (req, res) => {
    res.send('Login page - implement your login form here');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;


// Required dependencies
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Utility functions (previously in includes/load.php)
let globalCountId = 0;

function count_id() {
    return ++globalCountId;
}

function remove_junk(str) {
    if (!str) return '';
    return String(str).trim().replace(/[<>'"]/g, '');
}

function first_character(str) {
    if (!str) return '';
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

function page_require_level(requiredLevel) {
    // Implement user level checking logic
    // For now, assuming user has appropriate level
    const userLevel = 1; // This would come from session/authentication
    if (userLevel !== requiredLevel) {
        throw new Error('Insufficient privileges');
    }
}

// Database functions (previously in includes/functions.php)
async function count_by_id(tableName) {
    // This would typically connect to your database
    // For demonstration, returning mock data
    const mockCounts = {
        'categories': { total: 12 },
        'products': { total: 25 },
        'sales': { total: 150 },
        'users': { total: 8 }
    };
    return mockCounts[tableName] || { total: 0 };
}

async function find_higest_saleing_product(limit) {
    // This would query your database for highest selling products
    // Returning mock data for demonstration
    return [
        { name: 'iPhone 12', totalSold: 45, totalQty: 50 },
        { name: 'Samsung Galaxy', totalSold: 32, totalQty: 40 },
        { name: 'MacBook Pro', totalSold: 18, totalQty: 20 },
        { name: 'iPad Air', totalSold: 25, totalQty: 30 },
        { name: 'AirPods Pro', totalSold: 60, totalQty: 75 }
    ].slice(0, parseInt(limit));
}

async function find_recent_product_added(limit) {
    // This would query your database for recently added products
    // Returning mock data for demonstration
    return [
        { id: 1, name: 'New Product 1', sale_price: 299, categorie: 'Electronics', media_id: '1', image: 'product1.jpg' },
        { id: 2, name: 'New Product 2', sale_price: 199, categorie: 'Accessories', media_id: '0', image: '' },
        { id: 3, name: 'New Product 3', sale_price: 499, categorie: 'Computers', media_id: '2', image: 'product3.jpg' },
        { id: 4, name: 'New Product 4', sale_price: 99, categorie: 'Mobile', media_id: '3', image: 'product4.jpg' },
        { id: 5, name: 'New Product 5', sale_price: 399, categorie: 'Audio', media_id: '0', image: '' }
    ].slice(0, parseInt(limit));
}

async function find_recent_sale_added(limit) {
    // This would query your database for recent sales
    // Returning mock data for demonstration
    return [
        { id: 1, name: 'iPhone 12', date: '2023-12-01', price: '999.00' },
        { id: 2, name: 'Samsung Galaxy', date: '2023-12-02', price: '799.00' },
        { id: 3, name: 'MacBook Pro', date: '2023-12-03', price: '1299.00' },
        { id: 4, name: 'iPad Air', date: '2023-12-04', price: '599.00' },
        { id: 5, name: 'AirPods Pro', date: '2023-12-05', price: '249.00' }
    ].slice(0, parseInt(limit));
}

function display_msg(msg) {
    if (!msg) return '';
    return `<div class="alert alert-info">${msg}</div>`;
}

// Layout functions
async function include_header() {
    // This would include your header layout
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Home Page</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css">
    <style>
        .bg-secondary1 { background-color: #6c757d; }
        .bg-red { background-color: #dc3545; }
        .bg-blue2 { background-color: #007bff; }
        .bg-green { background-color: #28a745; }
        .img-avatar { width: 40px; height: 40px; }
        .panel-box { border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
<div class="container">
    `;
}

async function include_footer() {
    // This would include your footer layout
    return `
</div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</body>
</html>
    `;
}

// Main admin home page function
async function renderAdminHomePage(req, res) {
    try {
        // Set page title
        const page_title = 'Admin Home Page';
        
        // Require appropriate user level
        page_require_level(1);

        // Get counts and data
        const c_categorie = await count_by_id('categories');
        const c_product = await count_by_id('products');
        const c_sale = await count_by_id('sales');
        const c_user = await count_by_id('users');
        const products_sold = await find_higest_saleing_product('10');
        const recent_products = await find_recent_product_added('5');
        const recent_sales = await find_recent_sale_added('5');

        // Get message from session/query params
        const msg = req.query.msg || req.session?.msg || '';

        // Include header
        let html = await include_header();

        // Add main content
        html += `
<div class="row">
  <div class="col-md-6">
    ${display_msg(msg)}
  </div>
</div>

<div class="row" style="margin-bottom: 20px;">
  <div class="col-md-3">
    <a href="users.php" style="text-decoration: none; color: black;">
      <div class="panel panel-box clearfix" style="height: 120px; display: flex; align-items: center; padding: 10px;">
        <div class="panel-icon pull-left bg-secondary1" style="width: 60px; height: 60px; font-size: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <i class="glyphicon glyphicon-user" style="color:white;"></i>
        </div>
        <div class="panel-value pull-right" style="padding-left: 10px;">
          <h2 class="margin-top" style="margin: 0;">${c_user.total}</h2>
          <p class="text-muted" style="margin: 0;">Users</p>
        </div>
      </div>
    </a>
  </div>

  <div class="col-md-3">
    <a href="categorie.php" style="text-decoration: none; color: black;">
      <div class="panel panel-box clearfix" style="height: 120px; display: flex; align-items: center; padding: 10px;">
        <div class="panel-icon pull-left bg-red" style="width: 60px; height: 60px; font-size: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <i class="glyphicon glyphicon-th-large" style="color:white;"></i>
        </div>
        <div class="panel-value pull-right" style="padding-left: 10px;">
          <h2 class="margin-top" style="margin: 0;">${c_categorie.total}</h2>
          <p class="text-muted" style="margin: 0;">Categories</p>
        </div>
      </div>
    </a>
  </div>

  <div class="col-md-3">
    <a href="product.php" style="text-decoration: none; color: black;">
      <div class="panel panel-box clearfix" style="height: 120px; display: flex; align-items: center; padding: 10px;">
        <div class="panel-icon pull-left bg-blue2" style="width: 60px; height: 60px; font-size: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <i class="glyphicon glyphicon-shopping-cart" style="color:white;"></i>
        </div>
        <div class="panel-value pull-right" style="padding-left: 10px;">
          <h2 class="margin-top" style="margin: 0;">${c_product.total}</h2>
          <p class="text-muted" style="margin: 0;">Products</p>
        </div>
      </div>
    </a>
  </div>

  <div class="col-md-3">
    <a href="sales.php" style="text-decoration: none; color: black;">
      <div class="panel panel-box clearfix" style="height: 120px; display: flex; align-items: center; padding: 10px;">
        <div class="panel-icon pull-left bg-green" style="width: 60px; height: 60px; font-size: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <i class="glyphicon glyphicon-usd" style="color:white;"></i>
        </div>
        <div class="panel-value pull-right" style="padding-left: 10px;">
          <h2 class="margin-top" style="margin: 0;">${c_sale.total}</h2>
          <p class="text-muted" style="margin: 0;">Sales</p>
        </div>
      </div>
    </a>
  </div>
</div>

<div class="row">
  <div class="col-md-4">
    <div class="panel panel-default">
      <div class="panel-heading">
        <strong><span class="glyphicon glyphicon-th"></span> Highest Selling Products</strong>
      </div>
      <div class="panel-body">
        <table class="table table-striped table-bordered table-condensed">
          <thead>
            <tr>
              <th>Title</th>
              <th>Total Sold</th>
              <th>Total Quantity</th>
            </tr>
          </thead>
          <tbody>`;

        // Generate highest selling products table rows
        products_sold.forEach(product_sold => {
            html += `
              <tr>
                <td>${remove_junk(first_character(product_sold.name))}</td>
                <td>${parseInt(product_sold.totalSold)}</td>
                <td>${parseInt(product_sold.totalQty)}</td>
              </tr>`;
        });

        html += `
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="col-md-4">
    <div class="panel panel-default">
      <div class="panel-heading">
        <strong><span class="glyphicon glyphicon-th"></span> Latest Sales</strong>
      </div>
      <div class="panel-body">
        <table class="table table-striped table-bordered table-condensed">
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">#</th>
              <th>Product Name</th>
              <th>Date</th>
              <th>Total Sale</th>
            </tr>
          </thead>
          <tbody>`;

        // Generate recent sales table rows
        recent_sales.forEach(recent_sale => {
            html += `
              <tr>
                <td class="text-center">${count_id()}</td>
                <td><a href="edit_sale.php?id=${parseInt(recent_sale.id)}">${remove_junk(first_character(recent_sale.name))}</a></td>
                <td>${remove_junk(first_character(recent_sale.date))}</td>
                <td>$${remove_junk(first_character(recent_sale.price))}</td>
              </tr>`;
        });

        html += `
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="col-md-4">
    <div class="panel panel-default">
      <div class="panel-heading">
        <strong><span class="glyphicon glyphicon-th"></span> Recently Added Products</strong>
      </div>
      <div class="panel-body">
        <div class="list-group">`;

        // Generate recent products list
        recent_products.forEach(recent_product => {
            const imageSrc = recent_product.media_id === '0' 
                ? 'uploads/products/no_image.png' 
                : `uploads/products/${recent_product.image}`;
            
            html += `
            <a class="list-group-item clearfix" href="edit_product.php?id=${parseInt(recent_product.id)}">
              <h4 class="list-group-item-heading">
                <img class="img-avatar img-circle" src="${imageSrc}" alt="">
                ${remove_junk(first_character(recent_product.name))}
                <span class="label label-warning pull-right">
                  $${parseInt(recent_product.sale_price)}
                </span>
              </h4>
              <span class="list-group-item-text pull-right">
                ${remove_junk(first_character(recent_product.categorie))}
              </span>
            </a>`;
        });

        html += `
        </div>
      </div>
    </div>
  </div>
</div>`;

        // Include footer
        html += await include_footer();

        // Send response
        res.send(html);

    } catch (error) {
        console.error('Error rendering admin home page:', error);
        res.status(500).send('Internal Server Error');
    }
}

// Express route setup
const app = express();

// Configure session middleware (you'll need express-session)
app.use(require('express-session')({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Route for admin home page
app.get('/admin', renderAdminHomePage);
app.get('/', renderAdminHomePage);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for use in other modules
module.exports = {
    renderAdminHomePage,
    count_by_id,
    find_higest_saleing_product,
    find_recent_product_added,
    find_recent_sale_added,
    remove_junk,
    first_character,
    count_id,
    page_require_level,
    display_msg
};

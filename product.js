
// Import required modules (assuming Node.js/modern JS environment)
// You may need to adjust these imports based on your specific setup
const path = require('path');
const fs = require('fs');

// Global variables
let pageTitle = 'All Product';
let msg = ''; // Assume this comes from session or global state
let products = [];

// Helper functions equivalent to PHP functions
function displayMsg(message) {
    if (!message) return '';
    return `<div class="alert alert-info">${message}</div>`;
}

let countIdCounter = 0;
function countId() {
    return ++countIdCounter;
}

function removeJunk(str) {
    if (!str) return '';
    return str.toString()
        .replace(/[<>]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function readDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
}

// Function to check user permission level
async function pageRequireLevel(level) {
    // This would typically make an API call to check user permissions
    // For now, returning true - implement according to your auth system
    try {
        const response = await fetch('/api/check-permission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ required_level: level })
        });
        const result = await response.json();
        if (!result.authorized) {
            window.location.href = '/unauthorized.php';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Permission check failed:', error);
        return false;
    }
}

// Function to fetch products (equivalent to join_product_table())
async function joinProductTable() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

// Function to load header content
async function loadHeader() {
    try {
        const response = await fetch('/layouts/header.php');
        const headerContent = await response.text();
        return headerContent;
    } catch (error) {
        console.error('Failed to load header:', error);
        return '';
    }
}

// Function to load footer content
async function loadFooter() {
    try {
        const response = await fetch('/layouts/footer.php');
        const footerContent = await response.text();
        return footerContent;
    } catch (error) {
        console.error('Failed to load footer:', error);
        return '';
    }
}

// Function to generate product table row
function generateProductRow(product) {
    const imageHtml = product.media_id === '0' || product.media_id === 0
        ? '<img class="img-avatar img-circle" src="uploads/products/no_image.png" alt="">'
        : `<img class="img-avatar img-circle" src="uploads/products/${product.image}" alt="">`;

    return `
        <tr>
            <td class="text-center">${countId()}</td>
            <td>
                ${imageHtml}
            </td>
            <td>${removeJunk(product.name)}</td>
            <td class="text-center">${removeJunk(product.categorie)}</td>
            <td class="text-center">${removeJunk(product.quantity)}</td>
            <td class="text-center">${removeJunk(product.buy_price)}</td>
            <td class="text-center">${removeJunk(product.sale_price)}</td>
            <td class="text-center">${readDate(product.date)}</td>
            <td class="text-center">
                <div class="btn-group">
                    <a href="edit_product.php?id=${parseInt(product.id)}" class="btn btn-info btn-xs" title="Edit" data-toggle="tooltip">
                        <span class="glyphicon glyphicon-edit"></span>
                    </a>
                    <a href="delete_product.php?id=${parseInt(product.id)}" class="btn btn-danger btn-xs" title="Delete" data-toggle="tooltip">
                        <span class="glyphicon glyphicon-trash"></span>
                    </a>
                </div>
            </td>
        </tr>
    `;
}

// Function to generate the complete page content
function generatePageContent() {
    const productsTableRows = products.map(product => generateProductRow(product)).join('');
    
    return `
        <div class="row">
            <div class="col-md-12">
                ${displayMsg(msg)}
            </div>
            <div class="col-md-12">
                <div class="panel panel-default">
                    <div class="panel-heading clearfix">
                        <div class="pull-right">
                            <a href="add_product.php" class="btn btn-primary">Add New</a>
                        </div>
                    </div>
                    <div class="panel-body">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th class="text-center" style="width: 50px;">#</th>
                                    <th> Photo</th>
                                    <th> Product Title </th>
                                    <th class="text-center" style="width: 10%;"> Categories </th>
                                    <th class="text-center" style="width: 10%;"> In-Stock </th>
                                    <th class="text-center" style="width: 10%;"> Buying Price </th>
                                    <th class="text-center" style="width: 10%;"> Selling Price </th>
                                    <th class="text-center" style="width: 10%;"> Product Added </th>
                                    <th class="text-center" style="width: 100px;"> Actions </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsTableRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Main function to initialize and render the page
async function initPage() {
    try {
        // Check user permission level
        const hasPermission = await pageRequireLevel(2);
        if (!hasPermission) {
            return;
        }

        // Fetch products data
        products = await joinProductTable();

        // Load header and footer content
        const headerContent = await loadHeader();
        const footerContent = await loadFooter();

        // Generate the main page content
        const pageContent = generatePageContent();

        // Combine all content
        const fullPageContent = headerContent + pageContent + footerContent;

        // Insert content into the document
        document.body.innerHTML = fullPageContent;

        // Initialize tooltips if using Bootstrap
        if (typeof $ !== 'undefined' && $.fn.tooltip) {
            $('[data-toggle="tooltip"]').tooltip();
        }

        // Reset counter for proper numbering
        countIdCounter = 0;

    } catch (error) {
        console.error('Error initializing page:', error);
        document.body.innerHTML = '<div class="alert alert-danger">Error loading page content.</div>';
    }
}

// Browser-specific initialization
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    // Node.js environment - export functions for use
    module.exports = {
        pageTitle,
        displayMsg,
        countId,
        removeJunk,
        readDate,
        pageRequireLevel,
        joinProductTable,
        loadHeader,
        loadFooter,
        generateProductRow,
        generatePageContent,
        initPage
    };
}


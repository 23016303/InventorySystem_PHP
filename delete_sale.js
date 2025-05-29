
// Required dependencies
const express = require('express');
const session = require('express-session');
const { findById, deleteById } = require('./includes/database'); // Database helper functions
const { pageRequireLevel } = require('./includes/auth'); // Authentication helper
const { setMessage, redirect } = require('./includes/session'); // Session helper functions

// Express router setup
const router = express.Router();

// Route handler for deleting a sale
router.get('/delete_sale/:id', async (req, res) => {
  try {
    // Check what level user has permission to view this page
    await pageRequireLevel(req, res, 3);
    
    // Find sale by ID from URL parameter
    const saleId = parseInt(req.params.id);
    const dSale = await findById('sales', saleId);
    
    if (!dSale) {
      setMessage(req, "d", "Missing sale id.");
      return redirect(res, 'sales.php');
    }
    
    // Attempt to delete the sale
    const deleteId = await deleteById('sales', parseInt(dSale.id));
    
    if (deleteId) {
      setMessage(req, "s", "sale deleted.");
      redirect(res, 'sales.php');
    } else {
      setMessage(req, "d", "sale deletion failed.");
      redirect(res, 'sales.php');
    }
    
  } catch (error) {
    console.error('Error in delete sale route:', error);
    setMessage(req, "d", "An error occurred while deleting the sale.");
    redirect(res, 'sales.php');
  }
});

// Alternative implementation if using query parameters instead of route parameters
router.get('/delete_sale', async (req, res) => {
  try {
    // Check what level user has permission to view this page
    await pageRequireLevel(req, res, 3);
    
    // Find sale by ID from query parameter
    const saleId = parseInt(req.query.id);
    const dSale = await findById('sales', saleId);
    
    if (!dSale) {
      setMessage(req, "d", "Missing sale id.");
      return redirect(res, 'sales.php');
    }
    
    // Attempt to delete the sale
    const deleteId = await deleteById('sales', parseInt(dSale.id));
    
    if (deleteId) {
      setMessage(req, "s", "sale deleted.");
      redirect(res, 'sales.php');
    } else {
      setMessage(req, "d", "sale deletion failed.");
      redirect(res, 'sales.php');
    }
    
  } catch (error) {
    console.error('Error in delete sale route:', error);
    setMessage(req, "d", "An error occurred while deleting the sale.");
    redirect(res, 'sales.php');
  }
});

// Helper function implementations (equivalent to includes/load.php functionality)

// Database helper functions (includes/database.js)
async function findById(table, id) {
  // Implementation would depend on your database choice (MySQL, PostgreSQL, etc.)
  // Example using a hypothetical database connection
  const db = require('./database_connection');
  try {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    const result = await db.query(query, [id]);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Database error in findById:', error);
    return null;
  }
}

async function deleteById(table, id) {
  // Implementation would depend on your database choice
  const db = require('./database_connection');
  try {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const result = await db.query(query, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database error in deleteById:', error);
    return false;
  }
}

// Authentication helper function (includes/auth.js)
async function pageRequireLevel(req, res, requiredLevel) {
  // Check if user is authenticated and has required permission level
  if (!req.session.user || !req.session.user.level || req.session.user.level < requiredLevel) {
    setMessage(req, "d", "Access denied. Insufficient permissions.");
    return redirect(res, 'login.php');
  }
  return true;
}

// Session helper functions (includes/session.js)
function setMessage(req, type, message) {
  // Set flash message in session
  if (!req.session.messages) {
    req.session.messages = [];
  }
  req.session.messages.push({ type: type, text: message });
}

function redirect(res, url) {
  // Perform redirect
  res.redirect(url);
}

module.exports = router;


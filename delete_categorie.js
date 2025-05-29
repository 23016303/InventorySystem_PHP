// Required dependencies
const express = require('express');
const session = require('express-session');
const path = require('path');

// Import the load module (equivalent to includes/load.php)
const { 
  page_require_level, 
  find_by_id, 
  delete_by_id, 
  sessionManager 
} = require('./includes/load');

const router = express.Router();

// Middleware to handle session and other setup
router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Main route handler (equivalent to the PHP script)
router.get('/delete-category', async (req, res) => {
  try {
    // Check what level user has permission to view this page
    page_require_level(1, req, res);

    // Find category by ID from GET parameter
    const categorie = await find_by_id('categories', parseInt(req.query.id));
    
    if (!categorie) {
      sessionManager.msg(req.session, "d", "Missing Categorie id.");
      return res.redirect('categorie.php');
    }

    // Delete the category by ID
    const delete_id = await delete_by_id('categories', parseInt(categorie.id));
    
    if (delete_id) {
      sessionManager.msg(req.session, "s", "Categorie deleted.");
      res.redirect('categorie.php');
    } else {
      sessionManager.msg(req.session, "d", "Categorie deletion failed.");
      res.redirect('categorie.php');
    }
    
  } catch (error) {
    console.error('Error in delete category:', error);
    sessionManager.msg(req.session, "d", "An error occurred while deleting category.");
    res.redirect('categorie.php');
  }
});

// Export the router
module.exports = router;

// includes/load.js - Complete implementation of the required functions
// This would be in a separate file: includes/load.js

const mysql = require('mysql2/promise');

// Database configuration (adjust as needed)
const dbConfig = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Session manager object
const sessionManager = {
  /**
   * Add a message to the session
   * @param {Object} session - Express session object
   * @param {string} type - Message type ('s' for success, 'd' for danger/error)
   * @param {string} message - The message text
   */
  msg: function(session, type, message) {
    if (!session.messages) {
      session.messages = [];
    }
    session.messages.push({
      type: type,
      text: message
    });
  }
};

/**
 * Check if user has required permission level
 * @param {number} required_level - Required permission level
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function page_require_level(required_level, req, res) {
  // Check if user is logged in and has required level
  if (!req.session.user || !req.session.user.user_level) {
    sessionManager.msg(req.session, "d", "Access denied. Please login.");
    return res.redirect('/login.php');
  }
  
  if (req.session.user.user_level > required_level) {
    sessionManager.msg(req.session, "d", "Access denied. Insufficient permissions.");
    return res.redirect('/index.php');
  }
}

/**
 * Find a record by ID in the specified table
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Object|null} - Found record or null
 */
async function find_by_id(table, id) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ?? WHERE id = ? LIMIT 1`,
      [table, id]
    );
    connection.release();
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error in find_by_id:', error);
    return null;
  }
}

/**
 * Delete a record by ID from the specified table
 * @param {string} table - Table name
 * @param {number} id - Record ID to delete
 * @returns {boolean} - True if deletion was successful, false otherwise
 */
async function delete_by_id(table, id) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `DELETE FROM ?? WHERE id = ?`,
      [table, id]
    );
    connection.release();
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in delete_by_id:', error);
    return false;
  }
}

// Export all functions and objects
module.exports = {
  page_require_level,
  find_by_id,
  delete_by_id,
  sessionManager,
  pool
};

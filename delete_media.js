
// Required dependencies
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
const mysql = require('mysql2/promise');

// Database configuration and connection
const dbConfig = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
};

let dbConnection;

// Initialize database connection
async function initDatabase() {
  dbConnection = await mysql.createConnection(dbConfig);
}

// Session management class
class SessionManager {
  constructor(req) {
    this.req = req;
    if (!this.req.session.messages) {
      this.req.session.messages = [];
    }
  }

  msg(type, message) {
    this.req.session.messages.push({
      type: type,
      message: message
    });
  }

  getMessages() {
    const messages = this.req.session.messages || [];
    this.req.session.messages = [];
    return messages;
  }
}

// User permission checking function
function page_require_level(requiredLevel, userLevel) {
  if (userLevel < requiredLevel) {
    throw new Error('Insufficient permissions');
  }
}

// Database utility function to find record by ID
async function find_by_id(table, id) {
  try {
    const query = `SELECT * FROM ?? WHERE id = ?`;
    const [rows] = await dbConnection.execute(query, [table, id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database error in find_by_id:', error);
    return null;
  }
}

// Media class
class Media {
  constructor() {
    // Media class constructor
  }

  async media_destroy(mediaId, fileName) {
    try {
      // Delete from database
      const deleteQuery = `DELETE FROM media WHERE id = ?`;
      const [result] = await dbConnection.execute(deleteQuery, [mediaId]);
      
      if (result.affectedRows > 0) {
        // Delete physical file
        try {
          const filePath = path.join(__dirname, 'uploads', fileName);
          await fs.unlink(filePath);
          return true;
        } catch (fileError) {
          console.error('File deletion error:', fileError);
          // Even if file deletion fails, database deletion succeeded
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Media destruction error:', error);
      return false;
    }
  }
}

// Redirect function
function redirect(res, url) {
  res.redirect(url);
}

// Main delete media handler (equivalent to the PHP script)
async function deleteMediaHandler(req, res) {
  try {
    // Initialize database connection if not already done
    if (!dbConnection) {
      await initDatabase();
    }

    // Create session manager instance
    const session = new SessionManager(req);

    // Check user permission level (assuming user level is stored in session)
    // In a real application, you would get this from the authenticated user
    const userLevel = req.session.user ? req.session.user.level : 0;
    page_require_level(2, userLevel);

    // Get media ID from query parameters (equivalent to $_GET['id'])
    const mediaId = parseInt(req.query.id);
    
    if (isNaN(mediaId)) {
      session.msg("d", "Invalid media ID.");
      return redirect(res, '/media');
    }

    // Find media by ID
    const find_media = await find_by_id('media', mediaId);
    
    if (!find_media) {
      session.msg("d", "Media not found.");
      return redirect(res, '/media');
    }

    // Create new Media instance
    const photo = new Media();
    
    // Attempt to destroy media
    const deleteResult = await photo.media_destroy(find_media.id, find_media.file_name);
    
    if (deleteResult) {
      session.msg("s", "Photo has been deleted.");
      redirect(res, '/media');
    } else {
      session.msg("d", "Photo deletion failed Or Missing Prm.");
      redirect(res, '/media');
    }

  } catch (error) {
    console.error('Delete media handler error:', error);
    const session = new SessionManager(req);
    session.msg("d", "An error occurred while deleting the photo.");
    redirect(res, '/media');
  }
}

// Express app setup and route definition
const app = express();

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Route for deleting media (equivalent to the PHP script)
app.get('/delete_media', deleteMediaHandler);

// Export for use in larger application
module.exports = {
  deleteMediaHandler,
  Media,
  SessionManager,
  find_by_id,
  page_require_level,
  redirect
};


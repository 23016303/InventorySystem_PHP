
// Required dependencies and imports
const express = require('express');
const session = require('express-session');
const { URL } = require('url');

// Import the load module (equivalent to includes/load.php)
const loadModule = require('./includes/load');

// Import necessary functions and objects
const { page_require_level, delete_by_id, Session } = loadModule;

// Express app and router setup (assuming this runs in an Express context)
const router = express.Router();

// Route handler for group deletion
router.get('/delete_group', async (req, res) => {
    // Checkin What level user has permission to view this page
    page_require_level(1, req, res);
    
    // Get the ID from query parameters (equivalent to $_GET['id'])
    const id = parseInt(req.query.id);
    
    // Create session object instance
    const sessionObj = new Session(req.session);
    
    try {
        // Delete user group by ID
        const delete_id = await delete_by_id('user_groups', id);
        
        if (delete_id) {
            sessionObj.msg("s", "Group has been deleted.");
            redirect(res, 'group.php');
        } else {
            sessionObj.msg("d", "Group deletion failed Or Missing Prm.");
            redirect(res, 'group.php');
        }
    } catch (error) {
        sessionObj.msg("d", "Group deletion failed Or Missing Prm.");
        redirect(res, 'group.php');
    }
});

// Helper function for redirection (equivalent to PHP redirect())
function redirect(res, url) {
    res.redirect(url);
}

// Alternative implementation if this needs to be a standalone script
// (for use in a different context like a serverless function)
async function deleteGroupHandler(request, response) {
    // Load required modules
    require('./includes/load');
    
    // Checkin What level user has permission to view this page
    page_require_level(1, request, response);
    
    // Parse URL to get query parameters
    const url = new URL(request.url, `http://${request.headers.host}`);
    const id = parseInt(url.searchParams.get('id'));
    
    // Create session object
    const sessionObj = new Session(request.session);
    
    try {
        // Delete the user group by ID
        const delete_id = await delete_by_id('user_groups', id);
        
        if (delete_id) {
            sessionObj.msg("s", "Group has been deleted.");
            redirect(response, 'group.php');
        } else {
            sessionObj.msg("d", "Group deletion failed Or Missing Prm.");
            redirect(response, 'group.php');
        }
    } catch (error) {
        sessionObj.msg("d", "Group deletion failed Or Missing Prm.");
        redirect(response, 'group.php');
    }
}

// Export the router for use in main application
module.exports = router;

// Also export the standalone handler function
module.exports.deleteGroupHandler = deleteGroupHandler;


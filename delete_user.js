
// Import required modules and dependencies
const { pageRequireLevel, deleteById, session, redirect } = require('./includes/load');

// Check what level user has permission to view this page
pageRequireLevel(1);

// Delete user by ID from URL parameter
const deleteId = deleteById('users', parseInt(req.query.id));

if (deleteId) {
    session.msg("s", "User deleted.");
    redirect('users.php');
} else {
    session.msg("d", "User deletion failed Or Missing Prm.");
    redirect('users.php');
}


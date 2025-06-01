
// Required dependencies
const session = require('./includes/load.js').session;
const redirect = require('./includes/load.js').redirect;

// Main logic - equivalent to the PHP script
if (!session.logout()) {
    redirect("index.php");
}


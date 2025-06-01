
// Load required dependencies and helper functions
const { validateFields, removeJunk, authenticateV2, updateLastLogIn, redirect } = require('./includes/load');
const session = require('./includes/session'); // Assuming session management module

// Required fields validation
const reqFields = ['username', 'password'];
validateFields(reqFields);

// Sanitize input data
const username = removeJunk(req.body.username);
const password = removeJunk(req.body.password);

if (errors.length === 0) {
    
    const user = authenticateV2(username, password);
    
    if (user) {
        // Create session with id
        session.login(user.id);
        
        // Update Sign in time
        updateLastLogIn(user.id);
        
        // Redirect user to group home page by user level
        if (user.user_level === '1') {
            session.msg("s", `Hello ${user.username}, Welcome to OSWA-INV.`);
            redirect('admin.php', false);
        } else if (user.user_level === '2') {
            session.msg("s", `Hello ${user.username}, Welcome to OSWA-INV.`);
            redirect('special.php', false);
        } else {
            session.msg("s", `Hello ${user.username}, Welcome to OSWA-INV.`);
            redirect('home.php', false);
        }
        
    } else {
        session.msg("d", "Sorry Username/Password incorrect.");
        redirect('index.php', false);
    }
    
} else {
    session.msg("d", errors);
    redirect('login_v2.php', false);
}


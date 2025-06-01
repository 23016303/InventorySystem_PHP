
// Required dependencies
const path = require('path');
const fs = require('fs');

// User list page handler
async function allUsersPage(req, res) {
    // Set page title
    const page_title = 'All User';
    
    // Load required modules (equivalent to PHP include)
    const { 
        page_require_level, 
        find_all_user, 
        display_msg, 
        remove_junk, 
        count_id, 
        read_date 
    } = require('./includes/load.js');
    
    const { renderHeader } = require('./layouts/header.js');
    const { renderFooter } = require('./layouts/footer.js');
    
    try {
        // Check what level user has permission to view this page
        page_require_level(1);
        
        // Pull out all user from database
        const all_users = await find_all_user();
        
        // Get message from session/global variable
        const msg = req.session ? req.session.msg : global.msg || '';
        
        // Generate HTML content
        const htmlContent = `
            ${renderHeader(page_title)}
            <div class="row">
               <div class="col-md-12">
                 ${display_msg(msg)}
               </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="panel panel-default">
                  <div class="panel-heading clearfix">
                    <strong>
                      <span class="glyphicon glyphicon-th"></span>
                      <span>Users</span>
                   </strong>
                     <a href="add_user.php" class="btn btn-info pull-right">Add New User</a>
                  </div>
                 <div class="panel-body">
                  <table class="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 50px;">#</th>
                        <th>Name </th>
                        <th>Username</th>
                        <th class="text-center" style="width: 15%;">User Role</th>
                        <th class="text-center" style="width: 10%;">Status</th>
                        <th style="width: 20%;">Last Login</th>
                        <th class="text-center" style="width: 100px;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    ${all_users.map(a_user => {
                        return `
                          <tr>
                           <td class="text-center">${count_id()}</td>
                           <td>${remove_junk(ucwords(a_user.name))}</td>
                           <td>${remove_junk(ucwords(a_user.username))}</td>
                           <td class="text-center">${remove_junk(ucwords(a_user.group_name))}</td>
                           <td class="text-center">
                           ${a_user.status === '1' 
                             ? `<span class="label label-success">Active</span>`
                             : `<span class="label label-danger">Deactive</span>`
                           }
                           </td>
                           <td>${read_date(a_user.last_login)}</td>
                           <td class="text-center">
                             <div class="btn-group">
                                <a href="edit_user.php?id=${parseInt(a_user.id)}" class="btn btn-xs btn-warning" data-toggle="tooltip" title="Edit">
                                  <i class="glyphicon glyphicon-pencil"></i>
                               </a>
                                <a href="delete_user.php?id=${parseInt(a_user.id)}" class="btn btn-xs btn-danger" data-toggle="tooltip" title="Remove">
                                  <i class="glyphicon glyphicon-remove"></i>
                                </a>
                                </div>
                           </td>
                          </tr>
                        `;
                    }).join('')}
                   </tbody>
                 </table>
                 </div>
                </div>
              </div>
            </div>
            ${renderFooter()}
        `;
        
        // Send response
        res.send(htmlContent);
        
    } catch (error) {
        console.error('Error in allUsersPage:', error);
        res.status(500).send('Internal Server Error');
    }
}

// Helper function to implement PHP's ucwords equivalent
function ucwords(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Export the function for use in routing
module.exports = {
    allUsersPage,
    ucwords
};

// Alternative implementation for direct execution (if needed)
if (require.main === module) {
    // This would be used if the file is executed directly
    // Set up basic Express server
    const express = require('express');
    const session = require('express-session');
    const app = express();
    
    app.use(session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true
    }));
    
    app.get('/all_users', allUsersPage);
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}


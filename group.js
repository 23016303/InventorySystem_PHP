
// Required dependencies
const express = require('express');
const path = require('path');
const app = express();

// Include necessary modules (equivalent to PHP includes)
const { 
    pageRequireLevel, 
    findAll, 
    displayMsg, 
    countId, 
    removeJunk 
} = require('./includes/load');

// Set up view engine for template rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route handler for all groups page
app.get('/all_groups', async (req, res) => {
    try {
        // Set page title
        const pageTitle = 'All Group';
        
        // Check what level user has permission to view this page
        pageRequireLevel(1, req);
        
        // Find all user groups
        const allGroups = await findAll('user_groups');
        
        // Render the page with data
        res.render('all_groups', {
            pageTitle: pageTitle,
            allGroups: allGroups,
            msg: req.flash('msg') || null,
            countId: countId,
            removeJunk: removeJunk
        });
        
    } catch (error) {
        console.error('Error loading groups page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Helper functions (equivalent to PHP functions)
function ucwords(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// EJS Template: views/all_groups.ejs
const allGroupsTemplate = `
<%- include('layouts/header', { pageTitle: pageTitle }) %>
<div class="row">
   <div class="col-md-12">
     <%- displayMsg(msg) %>
   </div>
</div>
<div class="row">
  <div class="col-md-12">
    <div class="panel panel-default">
    <div class="panel-heading clearfix">
      <strong>
        <span class="glyphicon glyphicon-th"></span>
        <span>Groups</span>
     </strong>
       <a href="add_group.php" class="btn btn-info pull-right btn-sm"> Add New Group</a>
    </div>
     <div class="panel-body">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">#</th>
            <th>Group Name</th>
            <th class="text-center" style="width: 20%;">Group Level</th>
            <th class="text-center" style="width: 15%;">Status</th>
            <th class="text-center" style="width: 100px;">Actions</th>
          </tr>
        </thead>
        <tbody>
        <% allGroups.forEach(function(aGroup) { %>
          <tr>
           <td class="text-center"><%- countId() %></td>
           <td><%- removeJunk(ucwords(aGroup.group_name)) %></td>
           <td class="text-center">
             <%- removeJunk(ucwords(aGroup.group_level)) %>
           </td>
           <td class="text-center">
           <% if(aGroup.group_status === '1') { %>
            <span class="label label-success">Active</span>
          <% } else { %>
            <span class="label label-danger">Deactive</span>
          <% } %>
           </td>
           <td class="text-center">
             <div class="btn-group">
                <a href="edit_group.php?id=<%= parseInt(aGroup.id) %>" class="btn btn-xs btn-warning" data-toggle="tooltip" title="Edit">
                  <i class="glyphicon glyphicon-pencil"></i>
               </a>
                <a href="delete_group.php?id=<%= parseInt(aGroup.id) %>" class="btn btn-xs btn-danger" data-toggle="tooltip" title="Remove">
                  <i class="glyphicon glyphicon-remove"></i>
                </a>
                </div>
           </td>
          </tr>
        <% }); %>
       </tbody>
     </table>
     </div>
    </div>
  </div>
</div>
<%- include('layouts/footer') %>
`;

// Template helper functions to make available in templates
app.locals.ucwords = ucwords;
app.locals.parseInt = parseInt;

// Alternative client-side approach (if needed for SPA)
const clientSideVersion = `
// Client-side JavaScript equivalent
class AllGroupsPage {
    constructor() {
        this.pageTitle = 'All Group';
        this.allGroups = [];
        this.countIdCounter = 0;
    }
    
    async init() {
        // Check what level user has permission to view this page
        this.pageRequireLevel(1);
        
        // Find all user groups
        this.allGroups = await this.findAll('user_groups');
        
        // Render the page
        this.render();
    }
    
    pageRequireLevel(level) {
        // Implementation for permission checking
        if (!this.hasPermission(level)) {
            throw new Error('Insufficient permissions');
        }
    }
    
    async findAll(table) {
        // Implementation for database query
        const response = await fetch(\`/api/\${table}\`);
        return await response.json();
    }
    
    displayMsg(msg) {
        if (!msg) return '';
        return \`<div class="alert alert-info">\${msg}</div>\`;
    }
    
    countId() {
        return ++this.countIdCounter;
    }
    
    removeJunk(str) {
        if (!str) return '';
        return str.replace(/[<>'"&]/g, function(match) {
            const escapeMap = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return escapeMap[match];
        });
    }
    
    ucwords(str) {
        if (!str) return '';
        return str.replace(/\\w\\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
    
    render() {
        const headerContent = this.includeHeader();
        const footerContent = this.includeFooter();
        
        const tableRows = this.allGroups.map(aGroup => {
            const statusLabel = aGroup.group_status === '1' 
                ? '<span class="label label-success">Active</span>'
                : '<span class="label label-danger">Deactive</span>';
                
            return \`
                <tr>
                    <td class="text-center">\${this.countId()}</td>
                    <td>\${this.removeJunk(this.ucwords(aGroup.group_name))}</td>
                    <td class="text-center">
                        \${this.removeJunk(this.ucwords(aGroup.group_level))}
                    </td>
                    <td class="text-center">
                        \${statusLabel}
                    </td>
                    <td class="text-center">
                        <div class="btn-group">
                            <a href="edit_group.php?id=\${parseInt(aGroup.id)}" class="btn btn-xs btn-warning" data-toggle="tooltip" title="Edit">
                                <i class="glyphicon glyphicon-pencil"></i>
                            </a>
                            <a href="delete_group.php?id=\${parseInt(aGroup.id)}" class="btn btn-xs btn-danger" data-toggle="tooltip" title="Remove">
                                <i class="glyphicon glyphicon-remove"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            \`;
        }).join('');
        
        const content = \`
            \${headerContent}
            <div class="row">
                <div class="col-md-12">
                    \${this.displayMsg(this.msg)}
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <div class="panel panel-default">
                        <div class="panel-heading clearfix">
                            <strong>
                                <span class="glyphicon glyphicon-th"></span>
                                <span>Groups</span>
                            </strong>
                            <a href="add_group.php" class="btn btn-info pull-right btn-sm"> Add New Group</a>
                        </div>
                        <div class="panel-body">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th class="text-center" style="width: 50px;">#</th>
                                        <th>Group Name</th>
                                        <th class="text-center" style="width: 20%;">Group Level</th>
                                        <th class="text-center" style="width: 15%;">Status</th>
                                        <th class="text-center" style="width: 100px;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            \${footerContent}
        \`;
        
        document.body.innerHTML = content;
    }
    
    includeHeader() {
        // Implementation for including header layout
        return \`<!-- Header content would be loaded here -->\`;
    }
    
    includeFooter() {
        // Implementation for including footer layout
        return \`<!-- Footer content would be loaded here -->\`;
    }
    
    hasPermission(level) {
        // Implementation for checking user permissions
        // This would typically check session/token/user role
        return true; // Placeholder implementation
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const page = new AllGroupsPage();
    await page.init();
});
`;

module.exports = app;


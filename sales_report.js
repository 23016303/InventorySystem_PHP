
// Required dependencies
const path = require('path');
const fs = require('fs');

// Global variables
let page_title = 'Sale Report';

// Include load.js equivalent
require('./includes/load.js');

// Check what level user has permission to view this page
page_require_level(3);

// Helper function to include files (equivalent to PHP include_once)
function include_once(filePath) {
    try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
            return require(fullPath);
        }
        return '';
    } catch (error) {
        console.error(`Error including file ${filePath}:`, error);
        return '';
    }
}

// Function to display messages (equivalent to PHP display_msg)
function display_msg(msg) {
    if (!msg || msg === '') {
        return '';
    }
    return msg;
}

// Function to check user permission level (equivalent to PHP page_require_level)
function page_require_level(level) {
    // Implementation would depend on your authentication system
    // This is a placeholder that would need to be implemented based on your specific requirements
    const userLevel = getCurrentUserLevel(); // This function would need to be implemented
    if (userLevel < level) {
        throw new Error('Insufficient permissions to view this page');
    }
}

// Helper function to get current user level (needs implementation based on your auth system)
function getCurrentUserLevel() {
    // This would typically check session, JWT token, or database
    // Placeholder implementation - replace with actual logic
    return 3; // Default to level 3 for this example
}

// Main page generation function
function generateSaleReportPage() {
    // Include header
    const header = include_once('layouts/header.php');
    
    // Generate the main page content
    const pageContent = `
<div class="row">
  <div class="col-md-6">
    ${display_msg(typeof msg !== 'undefined' ? msg : '')}
  </div>
</div>
<div class="row">
  <div class="col-md-6">
    <div class="panel">
      <div class="panel-heading">

      </div>
      <div class="panel-body">
          <form class="clearfix" method="post" action="sale_report_process.php">
            <div class="form-group">
              <label class="form-label">Date Range</label>
                <div class="input-group">
                  <input type="text" class="datepicker form-control" name="start-date" placeholder="From">
                  <span class="input-group-addon"><i class="glyphicon glyphicon-menu-right"></i></span>
                  <input type="text" class="datepicker form-control" name="end-date" placeholder="To">
                </div>
            </div>
            <div class="form-group">
                 <button type="submit" name="submit" class="btn btn-primary">Generate Report</button>
            </div>
          </form>
      </div>

    </div>
  </div>

</div>`;

    // Include footer
    const footer = include_once('layouts/footer.php');
    
    // Return complete page
    return header + pageContent + footer;
}

// For Express.js route handler
function saleReportHandler(req, res) {
    try {
        // Set page title (equivalent to PHP $page_title)
        res.locals.page_title = page_title;
        
        // Check user permissions
        page_require_level(3);
        
        // Generate and send the page
        const pageHtml = generateSaleReportPage();
        res.send(pageHtml);
        
    } catch (error) {
        console.error('Error generating sale report page:', error);
        res.status(403).send('Access denied or internal error');
    }
}

// For client-side usage
function renderSaleReportPage(containerId) {
    try {
        // Check user permissions
        page_require_level(3);
        
        // Get container element
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
        
        // Generate page content
        const pageContent = `
<div class="row">
  <div class="col-md-6">
    ${display_msg(typeof msg !== 'undefined' ? msg : '')}
  </div>
</div>
<div class="row">
  <div class="col-md-6">
    <div class="panel">
      <div class="panel-heading">

      </div>
      <div class="panel-body">
          <form class="clearfix" method="post" action="sale_report_process.php">
            <div class="form-group">
              <label class="form-label">Date Range</label>
                <div class="input-group">
                  <input type="text" class="datepicker form-control" name="start-date" placeholder="From">
                  <span class="input-group-addon"><i class="glyphicon glyphicon-menu-right"></i></span>
                  <input type="text" class="datepicker form-control" name="end-date" placeholder="To">
                </div>
            </div>
            <div class="form-group">
                 <button type="submit" name="submit" class="btn btn-primary">Generate Report</button>
            </div>
          </form>
      </div>

    </div>
  </div>

</div>`;
        
        // Insert content into container
        container.innerHTML = pageContent;
        
        // Initialize datepicker if jQuery and datepicker are available
        if (typeof $ !== 'undefined' && $.fn.datepicker) {
            $('.datepicker').datepicker({
                format: 'yyyy-mm-dd',
                autoclose: true
            });
        }
        
    } catch (error) {
        console.error('Error rendering sale report page:', error);
        if (container) {
            container.innerHTML = '<div class="alert alert-danger">Access denied or error loading page</div>';
        }
    }
}

// Module exports for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        page_title,
        generateSaleReportPage,
        saleReportHandler,
        renderSaleReportPage,
        page_require_level,
        display_msg,
        include_once
    };
}

// Global assignments for browser usage
if (typeof window !== 'undefined') {
    window.page_title = page_title;
    window.generateSaleReportPage = generateSaleReportPage;
    window.renderSaleReportPage = renderSaleReportPage;
    window.page_require_level = page_require_level;
    window.display_msg = display_msg;
}


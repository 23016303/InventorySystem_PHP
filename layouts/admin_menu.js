
// Navigation menu data structure and HTML generator
class NavigationMenu {
    constructor() {
        // Define the complete menu structure
        this.menuData = [
            {
                href: "admin.php",
                icon: "glyphicon glyphicon-home",
                text: "Dashboard",
                submenu: null
            },
            {
                href: "#",
                icon: "glyphicon glyphicon-user",
                text: "User Management",
                class: "submenu-toggle",
                submenu: [
                    { href: "group.php", text: "Manage Groups" },
                    { href: "users.php", text: "Manage Users" }
                ]
            },
            {
                href: "categorie.php",
                icon: "glyphicon glyphicon-indent-left",
                text: "Categories",
                submenu: null
            },
            {
                href: "#",
                icon: "glyphicon glyphicon-th-large",
                text: "Products",
                class: "submenu-toggle",
                submenu: [
                    { href: "product.php", text: "Manage Products" },
                    { href: "add_product.php", text: "Add Products" }
                ]
            },
            {
                href: "media.php",
                icon: "glyphicon glyphicon-picture",
                text: "Media Files",
                submenu: null
            },
            {
                href: "#",
                icon: "glyphicon glyphicon-credit-card",
                text: "Sales",
                class: "submenu-toggle",
                submenu: [
                    { href: "sales.php", text: "Manage Sales" },
                    { href: "add_sale.php", text: "Add Sale" }
                ]
            },
            {
                href: "#",
                icon: "glyphicon glyphicon-duplicate",
                text: "Sales Report",
                class: "submenu-toggle",
                submenu: [
                    { href: "sales_report.php", text: "Sales by dates " },
                    { href: "monthly_sales.php", text: "Monthly sales" },
                    { href: "daily_sales.php", text: "Daily sales" }
                ]
            }
        ];
    }

    // Generate the complete HTML structure
    generateHTML() {
        let html = '<ul>\n';
        
        this.menuData.forEach(item => {
            html += '  <li>\n';
            
            // Generate main link
            let linkClass = item.class ? ` class="${item.class}"` : '';
            html += `    <a href="${item.href}"${linkClass}>\n`;
            html += `      <i class="${item.icon}"></i>\n`;
            html += `      <span>${item.text}</span>\n`;
            html += '    </a>\n';
            
            // Generate submenu if it exists
            if (item.submenu && item.submenu.length > 0) {
                html += '    <ul class="nav submenu">\n';
                item.submenu.forEach(subItem => {
                    html += `      <li><a href="${subItem.href}">${subItem.text}</a> </li>\n`;
                });
                html += '   </ul>\n';
            }
            
            html += '  </li>\n';
        });
        
        html += '</ul>';
        return html;
    }

    // Render the menu to a specific DOM element
    renderTo(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = this.generateHTML();
        }
    }

    // Get the raw HTML string
    getHTML() {
        return this.generateHTML();
    }

    // Add a new menu item
    addMenuItem(item) {
        this.menuData.push(item);
    }

    // Remove a menu item by index
    removeMenuItem(index) {
        if (index >= 0 && index < this.menuData.length) {
            this.menuData.splice(index, 1);
        }
    }

    // Get menu data
    getMenuData() {
        return this.menuData;
    }
}

// Static function to generate the exact HTML from the original
function generateNavigationHTML() {
    return `<ul>
  <li>
    <a href="admin.php">
      <i class="glyphicon glyphicon-home"></i>
      <span>Dashboard</span>
    </a>
  </li>
  <li>
    <a href="#" class="submenu-toggle">
      <i class="glyphicon glyphicon-user"></i>
      <span>User Management</span>
    </a>
    <ul class="nav submenu">
      <li><a href="group.php">Manage Groups</a> </li>
      <li><a href="users.php">Manage Users</a> </li>
   </ul>
  </li>
  <li>
    <a href="categorie.php" >
      <i class="glyphicon glyphicon-indent-left"></i>
      <span>Categories</span>
    </a>
  </li>
  <li>
    <a href="#" class="submenu-toggle">
      <i class="glyphicon glyphicon-th-large"></i>
      <span>Products</span>
    </a>
    <ul class="nav submenu">
       <li><a href="product.php">Manage Products</a> </li>
       <li><a href="add_product.php">Add Products</a> </li>
   </ul>
  </li>
  <li>
    <a href="media.php" >
      <i class="glyphicon glyphicon-picture"></i>
      <span>Media Files</span>
    </a>
  </li>
  <li>
    <a href="#" class="submenu-toggle">
      <i class="glyphicon glyphicon-credit-card"></i>
       <span>Sales</span>
      </a>
      <ul class="nav submenu">
         <li><a href="sales.php">Manage Sales</a> </li>
         <li><a href="add_sale.php">Add Sale</a> </li>
     </ul>
  </li>
  <li>
    <a href="#" class="submenu-toggle">
      <i class="glyphicon glyphicon-duplicate"></i>
       <span>Sales Report</span>
      </a>
      <ul class="nav submenu">
        <li><a href="sales_report.php">Sales by dates </a></li>
        <li><a href="monthly_sales.php">Monthly sales</a></li>
        <li><a href="daily_sales.php">Daily sales</a> </li>
      </ul>
  </li>
</ul>`;
}

// Usage examples:
// Create navigation menu instance
const navMenu = new NavigationMenu();

// Get the HTML
const htmlOutput = navMenu.getHTML();

// Render to a DOM element (if in browser environment)
// navMenu.renderTo('navigation-container');

// Or use the static function for exact original output
const exactHTML = generateNavigationHTML();

// Export for use in modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NavigationMenu,
        generateNavigationHTML
    };
}


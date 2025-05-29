const menu = [
  {
    title: "Dashboard",
    link: "home.php",
    icon: "glyphicon glyphicon-home",
  },
  {
    title: "Sales",
    link: "#",
    icon: "glyphicon glyphicon-th-list",
    submenu: [
      { title: "Manage Sales", link: "sales.php" },
      { title: "Add Sale", link: "add_sale.php" },
    ],
  },
  {
    title: "Sales Report",
    link: "#",
    icon: "glyphicon glyphicon-signal",
    submenu: [
      { title: "Sales by dates", link: "sales_report.php" },
      { title: "Monthly sales", link: "monthly_sales.php" },
      { title: "Daily sales", link: "daily_sales.php" },
    ],
  },
];

// Function to generate HTML from the menu structure
function generateMenu(menu) {
  const ul = document.createElement('ul');
  menu.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.link;
    a.innerHTML = `<i class="${item.icon}"></i><span>${item.title}</span>`;
    li.appendChild(a);
    
    if (item.submenu) {
      const submenu = generateMenu(item.submenu);
      submenu.classList.add('nav', 'submenu');
      li.appendChild(submenu);
      a.classList.add('submenu-toggle');
    }
    
    ul.appendChild(li);
  });
  return ul;
}

// Append the generated menu to the body or a specific element
document.body.appendChild(generateMenu(menu));


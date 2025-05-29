const menu = [
  {
    href: "home.php",
    icon: "glyphicon glyphicon-home",
    text: "Dashboard"
  },
  {
    href: "categorie.php",
    icon: "glyphicon glyphicon-indent-left",
    text: "Categories"
  },
  {
    href: "#",
    icon: "glyphicon glyphicon-th-large",
    text: "Products",
    submenu: [
      { href: "product.php", text: "Manage product" },
      { href: "add_product.php", text: "Add product" }
    ]
  },
  {
    href: "media.php",
    icon: "glyphicon glyphicon-picture",
    text: "Media"
  }
];

// Function to generate HTML from the menu array
function generateMenu(menu) {
  const ul = document.createElement('ul');
  
  menu.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    
    const icon = document.createElement('i');
    icon.className = item.icon;
    a.appendChild(icon);
    
    const span = document.createElement('span');
    span.textContent = item.text;
    a.appendChild(span);
    
    li.appendChild(a);
    
    if (item.submenu) {
      const submenuUl = document.createElement('ul');
      submenuUl.className = 'nav submenu';
      item.submenu.forEach(subitem => {
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.href = subitem.href;
        subA.textContent = subitem.text;
        subLi.appendChild(subA);
        submenuUl.appendChild(subLi);
      });
      li.appendChild(submenuUl);
    }
    
    ul.appendChild(li);
  });
  
  return ul;
}

// Append the generated menu to the body or a specific element
document.body.appendChild(generateMenu(menu));
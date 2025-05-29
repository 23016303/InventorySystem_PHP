
// Required dependencies - these would typically be imported
const crypto = require('crypto');

// Database connection class - equivalent to the global $db object
class Database {
  constructor(connection) {
    this.connection = connection;
    this.DB_NAME = process.env.DB_NAME || 'your_database_name';
  }

  escape(value) {
    if (typeof value === 'string') {
      return this.connection.escape(value);
    }
    return value;
  }

  async query(sql) {
    return await this.connection.query(sql);
  }

  async fetch_assoc(result) {
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null;
  }

  async while_loop(result) {
    return result;
  }

  num_rows(result) {
    return Array.isArray(result) ? result.length : 0;
  }

  affected_rows() {
    return this.connection.affectedRows || 0;
  }
}

// Session management class
class Session {
  constructor() {
    this.sessionData = {};
  }

  isUserLoggedIn(redirect = false) {
    return !!this.sessionData.user_id;
  }

  msg(type, message) {
    console.log(`[${type}] ${message}`);
  }

  set(key, value) {
    this.sessionData[key] = value;
  }

  get(key) {
    return this.sessionData[key];
  }
}

// Global variables equivalent
let db;
let session = new Session();

// Helper functions
function remove_junk(str) {
  return str.replace(/[<>\"'%;()&+]/g, '');
}

function make_date() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function redirect(url, exit = true) {
  console.log(`Redirecting to: ${url}`);
  if (exit) {
    process.exit(0);
  }
}

/*--------------------------------------------------------------*/
/* Function for find all database table rows by table name
/*--------------------------------------------------------------*/
async function find_all(table) {
  if (await tableExists(table)) {
    return await find_by_sql("SELECT * FROM " + db.escape(table));
  }
}

/*--------------------------------------------------------------*/
/* Function for Perform queries
/*--------------------------------------------------------------*/
async function find_by_sql(sql) {
  const result = await db.query(sql);
  const result_set = await db.while_loop(result);
  return result_set;
}

/*--------------------------------------------------------------*/
/*  Function for Find data from table by id
/*--------------------------------------------------------------*/
async function find_by_id(table, id) {
  id = parseInt(id);
  if (await tableExists(table)) {
    const sql = await db.query(`SELECT * FROM ${db.escape(table)} WHERE id='${db.escape(id)}' LIMIT 1`);
    const result = await db.fetch_assoc(sql);
    if (result) {
      return result;
    } else {
      return null;
    }
  }
}

/*--------------------------------------------------------------*/
/* Function for Delete data from table by id
/*--------------------------------------------------------------*/
async function delete_by_id(table, id) {
  if (await tableExists(table)) {
    let sql = "DELETE FROM " + db.escape(table);
    sql += " WHERE id=" + db.escape(id);
    sql += " LIMIT 1";
    await db.query(sql);
    return (db.affected_rows() === 1) ? true : false;
  }
}

/*--------------------------------------------------------------*/
/* Function for Count id  By table name
/*--------------------------------------------------------------*/
async function count_by_id(table) {
  if (await tableExists(table)) {
    const sql = "SELECT COUNT(id) AS total FROM " + db.escape(table);
    const result = await db.query(sql);
    return (await db.fetch_assoc(result));
  }
}

/*--------------------------------------------------------------*/
/* Determine if database table exists
/*--------------------------------------------------------------*/
async function tableExists(table) {
  const table_exit = await db.query('SHOW TABLES FROM ' + db.DB_NAME + ' LIKE "' + db.escape(table) + '"');
  if (table_exit) {
    if (db.num_rows(table_exit) > 0) {
      return true;
    } else {
      return false;
    }
  }
}

/*--------------------------------------------------------------*/
/* Login with the data provided in $_POST,
/* coming from the login form.
/*--------------------------------------------------------------*/
async function authenticate(username = '', password = '') {
  username = db.escape(username);
  password = db.escape(password);
  const sql = `SELECT id,username,password,user_level FROM users WHERE username ='${username}' LIMIT 1`;
  const result = await db.query(sql);
  if (db.num_rows(result)) {
    const user = await db.fetch_assoc(result);
    const password_request = crypto.createHash('sha1').update(password).digest('hex');
    if (password_request === user.password) {
      return user.id;
    }
  }
  return false;
}

/*--------------------------------------------------------------*/
/* Login with the data provided in $_POST,
/* coming from the login_v2.php form.
/* If you used this method then remove authenticate function.
/*--------------------------------------------------------------*/
async function authenticate_v2(username = '', password = '') {
  username = db.escape(username);
  password = db.escape(password);
  const sql = `SELECT id,username,password,user_level FROM users WHERE username ='${username}' LIMIT 1`;
  const result = await db.query(sql);
  if (db.num_rows(result)) {
    const user = await db.fetch_assoc(result);
    const password_request = crypto.createHash('sha1').update(password).digest('hex');
    if (password_request === user.password) {
      return user;
    }
  }
  return false;
}

/*--------------------------------------------------------------*/
/* Find current log in user by session id
/*--------------------------------------------------------------*/
let current_user_cache;
async function current_user() {
  if (!current_user_cache) {
    if (session.get('user_id')) {
      const user_id = parseInt(session.get('user_id'));
      current_user_cache = await find_by_id('users', user_id);
    }
  }
  return current_user_cache;
}

/*--------------------------------------------------------------*/
/* Find all user by
/* Joining users table and user gropus table
/*--------------------------------------------------------------*/
async function find_all_user() {
  const results = [];
  let sql = "SELECT u.id,u.name,u.username,u.user_level,u.status,u.last_login,";
  sql += "g.group_name ";
  sql += "FROM users u ";
  sql += "LEFT JOIN user_groups g ";
  sql += "ON g.group_level=u.user_level ORDER BY u.name ASC";
  const result = await find_by_sql(sql);
  return result;
}

/*--------------------------------------------------------------*/
/* Function to update the last log in of a user
/*--------------------------------------------------------------*/
async function updateLastLogIn(user_id) {
  const date = make_date();
  const sql = `UPDATE users SET last_login='${date}' WHERE id ='${user_id}' LIMIT 1`;
  const result = await db.query(sql);
  return (result && db.affected_rows() === 1 ? true : false);
}

/*--------------------------------------------------------------*/
/* Find all Group name
/*--------------------------------------------------------------*/
async function find_by_groupName(val) {
  const sql = `SELECT group_name FROM user_groups WHERE group_name = '${db.escape(val)}' LIMIT 1 `;
  const result = await db.query(sql);
  return (db.num_rows(result) === 0 ? true : false);
}

/*--------------------------------------------------------------*/
/* Find group level
/*--------------------------------------------------------------*/
async function find_by_groupLevel(level) {
  const sql = `SELECT group_level FROM user_groups WHERE group_level = '${db.escape(level)}' LIMIT 1 `;
  const result = await db.query(sql);
  return (db.num_rows(result) === 0 ? true : false);
}

/*--------------------------------------------------------------*/
/* Function for cheaking which user level has access to page
/*--------------------------------------------------------------*/
async function page_require_level(require_level) {
  const current_user_data = await current_user();
  const login_level = await find_by_groupLevel(current_user_data.user_level);
  
  // if user not login
  if (!session.isUserLoggedIn(true)) {
    session.msg('d', 'Please login...');
    redirect('index.php', false);
    // if Group status Deactive
  } else if (login_level.group_status === '0') {
    session.msg('d', 'This level user has been band!');
    redirect('home.php', false);
    // cheackin log in User level and Require level is Less than or equal to
  } else if (current_user_data.user_level <= parseInt(require_level)) {
    return true;
  } else {
    session.msg("d", "Sorry! you dont have permission to view the page.");
    redirect('home.php', false);
  }
}

/*--------------------------------------------------------------*/
/* Function for Finding all product name
/* JOIN with categorie  and media database table
/*--------------------------------------------------------------*/
async function join_product_table() {
  let sql = " SELECT p.id,p.name,p.quantity,p.buy_price,p.sale_price,p.media_id,p.date,c.name";
  sql += " AS categorie,m.file_name AS image";
  sql += " FROM products p";
  sql += " LEFT JOIN categories c ON c.id = p.categorie_id";
  sql += " LEFT JOIN media m ON m.id = p.media_id";
  sql += " ORDER BY p.id ASC";
  return await find_by_sql(sql);
}

/*--------------------------------------------------------------*/
/* Function for Finding all product name
/* Request coming from ajax.php for auto suggest
/*--------------------------------------------------------------*/
async function find_product_by_title(product_name) {
  const p_name = remove_junk(db.escape(product_name));
  const sql = `SELECT name FROM products WHERE name like '%${p_name}%' LIMIT 5`;
  const result = await find_by_sql(sql);
  return result;
}

/*--------------------------------------------------------------*/
/* Function for Finding all product info by product title
/* Request coming from ajax.php
/*--------------------------------------------------------------*/
async function find_all_product_info_by_title(title) {
  let sql = "SELECT * FROM products ";
  sql += ` WHERE name ='${title}'`;
  sql += " LIMIT 1";
  return await find_by_sql(sql);
}

/*--------------------------------------------------------------*/
/* Function for Update product quantity
/*--------------------------------------------------------------*/
async function update_product_qty(qty, p_id) {
  qty = parseInt(qty);
  const id = parseInt(p_id);
  const sql = `UPDATE products SET quantity=quantity -'${qty}' WHERE id = '${id}'`;
  const result = await db.query(sql);
  return (db.affected_rows() === 1 ? true : false);
}

/*--------------------------------------------------------------*/
/* Function for Display Recent product Added
/*--------------------------------------------------------------*/
async function find_recent_product_added(limit) {
  let sql = " SELECT p.id,p.name,p.sale_price,p.media_id,c.name AS categorie,";
  sql += "m.file_name AS image FROM products p";
  sql += " LEFT JOIN categories c ON c.id = p.categorie_id";
  sql += " LEFT JOIN media m ON m.id = p.media_id";
  sql += " ORDER BY p.id DESC LIMIT " + db.escape(parseInt(limit));
  return await find_by_sql(sql);
}

/*--------------------------------------------------------------*/
/* Function for Find Highest saleing Product
/*--------------------------------------------------------------*/
async function find_higest_saleing_product(limit) {
  let sql = "SELECT p.name, COUNT(s.product_id) AS totalSold, SUM(s.qty) AS totalQty";
  sql += " FROM sales s";
  sql += " LEFT JOIN products p ON p.id = s.product_id ";
  sql += " GROUP BY s.product_id";
  sql += " ORDER BY SUM(s.qty) DESC LIMIT " + db.escape(parseInt(limit));
  return await db.query(sql);
}

/*--------------------------------------------------------------*/
/* Function for find all sales
/*--------------------------------------------------------------*/
async function find_all_sale() {
  let sql = "SELECT s.id,s.qty,s.price,s.date,p.name";
  sql += " FROM sales s";
  sql += " LEFT JOIN products p ON s.product_id = p.id";
  sql += " ORDER BY s.date DESC";
  return await find_by_sql(sql);
}

/*--------------------------------------------------------------*/
/* Function for Display Recent sale
/*--------------------------------------------------------------*/
async function find_recent_sale_added(limit) {
  let sql = "SELECT s.id,s.qty,s.price,s.date,p.name";
  sql += " FROM sales s";
  sql += " LEFT JOIN products p ON s.product_id = p.id";
  sql += " ORDER BY s.date DESC LIMIT " + db.escape(parseInt(limit));
  return await find_by_sql(sql);
}

/*--------------------------------------------------------------*/
/* Function for Generate sales report by two dates
/*--------------------------------------------------------------*/
async function find_sale_by_dates(start_date, end_date) {
  const start_date_formatted = new Date(start_date).toISOString().slice(0, 10);
  const end_date_formatted = new Date(end_date).toISOString().slice(0, 10);
  let sql = "SELECT s.date, p.name,p.sale_price,p.buy_price,";
  sql += "COUNT(s.product_id) AS total_records,";
  sql += "SUM(s.qty) AS total_sales,";
  sql += "SUM(p.sale_price * s.qty) AS total_saleing_price,";
  sql += "SUM(p.buy_price * s.qty) AS total_buying_price ";
  sql += "FROM sales s ";
  sql += "LEFT JOIN products p ON s.product_id = p.id";
  sql += ` WHERE s.date BETWEEN '${start_date_formatted}' AND '${end_date_formatted}'`;
  sql += " GROUP BY DATE(s.date),p.name";
  sql += " ORDER BY DATE(s.date) DESC";
  return await db.query(sql);
}

/*--------------------------------------------------------------*/
/* Function for Generate Daily sales report
/*--------------------------------------------------------------*/
async function dailySales(year, month) {
  let sql = "SELECT s.qty,";
  sql += " DATE_FORMAT(s.date, '%Y-%m-%e') AS date,p.name,";
  sql += "SUM(p.sale_price * s.qty) AS total_saleing_price";
  sql += " FROM sales s";
  sql += " LEFT JOIN products p ON s.product_id = p.id";
  sql += ` WHERE DATE_FORMAT(s.date, '%Y-%m' ) = '${year}-${month}'`;
  sql += " GROUP BY DATE_FORMAT( s.date,  '%e' ),s.product_id";
  return await find_by_sql(sql);
}

/*--------------------------------------------------------------*/
/* Function for Generate Monthly sales report
/*--------------------------------------------------------------*/
async function monthlySales(year) {
  let sql = "SELECT s.qty,";
  sql += " DATE_FORMAT(s.date, '%Y-%m-%e') AS date,p.name,";
  sql += "SUM(p.sale_price * s.qty) AS total_saleing_price";
  sql += " FROM sales s";
  sql += " LEFT JOIN products p ON s.product_id = p.id";
  sql += ` WHERE DATE_FORMAT(s.date, '%Y' ) = '${year}'`;
  sql += " GROUP BY DATE_FORMAT( s.date,  '%c' ),s.product_id";
  sql += " ORDER BY date_format(s.date, '%c' ) ASC";
  return await find_by_sql(sql);
}

// Initialize database connection (this would be called at application startup)
function initializeDatabase(connection) {
  db = new Database(connection);
}

// Export all functions for use
module.exports = {
  Database,
  Session,
  initializeDatabase,
  find_all,
  find_by_sql,
  find_by_id,
  delete_by_id,
  count_by_id,
  tableExists,
  authenticate,
  authenticate_v2,
  current_user,
  find_all_user,
  updateLastLogIn,
  find_by_groupName,
  find_by_groupLevel,
  page_require_level,
  join_product_table,
  find_product_by_title,
  find_all_product_info_by_title,
  update_product_qty,
  find_recent_product_added,
  find_higest_saleing_product,
  find_all_sale,
  find_recent_sale_added,
  find_sale_by_dates,
  dailySales,
  monthlySales,
  remove_junk,
  make_date,
  redirect,
  session
};


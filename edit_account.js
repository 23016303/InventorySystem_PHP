
// Required dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');
const crypto = require('crypto');

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Global variables
let page_title = 'Edit Account';
let errors = [];
let msg = '';
let user = {};

// Database connection setup
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};

let db;

// Initialize database connection
async function initDatabase() {
    db = await mysql.createConnection(dbConfig);
}

// Media class equivalent
class Media {
    constructor() {
        this.errors = [];
        this.upload_path = 'uploads/users/';
        this.upload_errors = {
            0: 'There is no error, the file uploaded with success',
            1: 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            2: 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
            3: 'The uploaded file was only partially uploaded',
            4: 'No file was uploaded',
            6: 'Missing a temporary folder'
        };
    }

    upload(file) {
        if (!file) {
            this.errors.push("No file was uploaded");
            return false;
        }
        
        this.fileName = file.filename;
        this.fileTempPath = file.path;
        this.fileSize = file.size;
        this.fileExt = path.extname(file.originalname).toLowerCase();
        this.uploadPath = this.upload_path;
        
        return this.checkFileType() && this.checkFileSize();
    }

    checkFileType() {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        if (!allowedTypes.includes(this.fileExt)) {
            this.errors.push(`File type ${this.fileExt} is not allowed`);
            return false;
        }
        return true;
    }

    checkFileSize() {
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (this.fileSize > maxSize) {
            this.errors.push("File size is too large");
            return false;
        }
        return true;
    }

    async process_user(user_id) {
        if (this.errors.length > 0) {
            return false;
        }

        try {
            const newFileName = `user_${user_id}_${Date.now()}${this.fileExt}`;
            const targetPath = path.join(this.uploadPath, newFileName);
            
            // Ensure upload directory exists
            await fs.mkdir(this.uploadPath, { recursive: true });
            
            // Move uploaded file
            await fs.rename(this.fileTempPath, targetPath);
            
            // Update database
            const sql = `UPDATE users SET image = ? WHERE id = ?`;
            const [result] = await db.execute(sql, [newFileName, user_id]);
            
            return result.affectedRows === 1;
        } catch (error) {
            this.errors.push(`Failed to process file: ${error.message}`);
            return false;
        }
    }
}

// Session management object
const sessionManager = {
    msg: function(type, message) {
        // Store message in session for display
        if (!global.sessionData) {
            global.sessionData = {};
        }
        global.sessionData.msg = { type: type, text: message };
    }
};

// Helper functions
function remove_junk(str) {
    if (typeof str !== 'string') {
        return '';
    }
    // Remove dangerous characters and trim whitespace
    return str.replace(/[<>'"&]/g, '').trim();
}

function validate_fields(req_fields, post_data) {
    errors = [];
    for (let field of req_fields) {
        if (!post_data[field] || post_data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    }
    return errors.length === 0;
}

function redirect(url, permanent = true) {
    return { redirect: url, permanent: permanent };
}

function display_msg(message) {
    if (!message) return '';
    
    let alertClass = '';
    switch (message.type) {
        case 's':
            alertClass = 'alert-success';
            break;
        case 'd':
            alertClass = 'alert-danger';
            break;
        case 'w':
            alertClass = 'alert-warning';
            break;
        default:
            alertClass = 'alert-info';
    }
    
    return `<div class="alert ${alertClass} alert-dismissible">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${message.text}
            </div>`;
}

function page_require_level(level) {
    // Check user permission level
    if (!global.sessionData || !global.sessionData.user_level || global.sessionData.user_level < level) {
        throw new Error('Insufficient permissions');
    }
}

function ucwords(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/temp/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Load includes equivalent
async function loadIncludes(req, res, next) {
    try {
        await initDatabase();
        
        // Simulate session data loading
        if (req.session.user_id) {
            const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.session.user_id]);
            if (rows.length > 0) {
                user = rows[0];
                global.sessionData = {
                    user_id: user.id,
                    user_level: user.user_level || 1
                };
            }
        }
        
        // Check required level
        page_require_level(3);
        
        next();
    } catch (error) {
        res.status(403).send('Access denied');
    }
}

// Routes
app.get('/edit_account.php', loadIncludes, async (req, res) => {
    try {
        // Get current message if any
        let currentMsg = global.sessionData && global.sessionData.msg ? global.sessionData.msg : null;
        if (currentMsg) {
            delete global.sessionData.msg; // Clear message after displaying
        }

        const headerInclude = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${page_title}</title>
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
            <style>
                .img-size-2 { width: 60px; height: 60px; }
                .btn-file { position: relative; overflow: hidden; }
            </style>
        </head>
        <body>
        `;

        const footerInclude = `
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
        </body>
        </html>
        `;

        const htmlContent = `
        ${headerInclude}
        <div class="row">
          <div class="col-md-12">
            ${display_msg(currentMsg)}
          </div>
          <div class="col-md-6">
              <div class="panel panel-default">
                <div class="panel-heading">
                  <div class="panel-heading clearfix">
                    <span class="glyphicon glyphicon-camera"></span>
                    <span>Change My Photo</span>
                  </div>
                </div>
                <div class="panel-body">
                  <div class="row">
                    <div class="col-md-4">
                        <img class="img-circle img-size-2" src="uploads/users/${user.image || 'default.png'}" alt="">
                    </div>
                    <div class="col-md-8">
                      <form class="form" action="edit_account.php" method="POST" enctype="multipart/form-data">
                      <div class="form-group">
                        <input type="file" name="file_upload" multiple="multiple" class="btn btn-default btn-file"/>
                      </div>
                      <div class="form-group">
                        <input type="hidden" name="user_id" value="${user.id}">
                         <button type="submit" name="submit" class="btn btn-warning">Change</button>
                      </div>
                     </form>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          <div class="col-md-6">
            <div class="panel panel-default">
              <div class="panel-heading clearfix">
                <span class="glyphicon glyphicon-edit"></span>
                <span>Edit My Account</span>
              </div>
              <div class="panel-body">
                  <form method="post" action="edit_account.php?id=${parseInt(user.id)}" class="clearfix">
                    <div class="form-group">
                          <label for="name" class="control-label">Name</label>
                          <input type="name" class="form-control" name="name" value="${remove_junk(ucwords(user.name || ''))}">
                    </div>
                    <div class="form-group">
                          <label for="username" class="control-label">Username</label>
                          <input type="text" class="form-control" name="username" value="${remove_junk(ucwords(user.username || ''))}">
                    </div>
                    <div class="form-group clearfix">
                            <a href="change_password.php" title="change password" class="btn btn-danger pull-right">Change Password</a>
                            <button type="submit" name="update" class="btn btn-info">Update</button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        ${footerInclude}
        `;

        res.send(htmlContent);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Handle photo upload
app.post('/edit_account.php', loadIncludes, upload.single('file_upload'), async (req, res) => {
    try {
        // update user image
        if (req.body.submit !== undefined) {
            const photo = new Media();
            const user_id = parseInt(req.body.user_id);
            
            if (await photo.upload(req.file)) {
                if (await photo.process_user(user_id)) {
                    sessionManager.msg('s', 'photo has been uploaded.');
                    return res.redirect('edit_account.php');
                } else {
                    sessionManager.msg('d', photo.errors.join(', '));
                    return res.redirect('edit_account.php');
                }
            } else {
                sessionManager.msg('d', photo.errors.join(', '));
                return res.redirect('edit_account.php');
            }
        }

        // update user other info
        if (req.body.update !== undefined) {
            const req_fields = ['name', 'username'];
            
            if (validate_fields(req_fields, req.body)) {
                const id = parseInt(global.sessionData.user_id);
                const name = remove_junk(req.body.name);
                const username = remove_junk(req.body.username);
                
                const sql = `UPDATE users SET name = ?, username = ? WHERE id = ?`;
                const [result] = await db.execute(sql, [name, username, id]);
                
                if (result && result.affectedRows === 1) {
                    sessionManager.msg('s', "Account updated ");
                    return res.redirect('edit_account.php');
                } else {
                    sessionManager.msg('d', ' Sorry failed to updated!');
                    return res.redirect('edit_account.php');
                }
            } else {
                sessionManager.msg("d", errors.join(', '));
                return res.redirect('edit_account.php');
            }
        }

        // If neither submit nor update, redirect to GET
        res.redirect('edit_account.php');
        
    } catch (error) {
        sessionManager.msg('d', `Error: ${error.message}`);
        res.redirect('edit_account.php');
    }
});

// Initialize and start server
async function startServer() {
    try {
        await initDatabase();
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();


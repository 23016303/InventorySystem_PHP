
// Required dependencies
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const mysql = require('mysql2/promise');

const app = express();

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files middleware
app.use('/uploads', express.static('uploads'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));

// Global variables
let page_title = 'All Image';
let msg = '';

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};

// Database connection function
async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

// Equivalent of require_once('includes/load.php')
// This would contain all the necessary functions and classes

// Function equivalent to find_all('media')
async function find_all(table) {
    const connection = await getDbConnection();
    try {
        const [rows] = await connection.execute(`SELECT * FROM ${table}`);
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        return [];
    } finally {
        await connection.end();
    }
}

// Function equivalent to page_require_level(2)
function page_require_level(level) {
    // This function would check if user has the required permission level
    // For now, we'll assume the user has proper permissions
    // In a real implementation, this would check session data or user roles
    return true;
}

// Function equivalent to count_id()
let counter = 0;
function count_id() {
    return ++counter;
}

// Session message handling equivalent
const sessionManager = {
    msg: function(type, message) {
        msg = { type: type, text: message };
    }
};

// Function equivalent to display_msg($msg)
function display_msg(msg) {
    if (!msg || !msg.text) return '';
    
    let alertClass = '';
    switch(msg.type) {
        case 's': alertClass = 'alert-success'; break;
        case 'd': alertClass = 'alert-danger'; break;
        case 'w': alertClass = 'alert-warning'; break;
        default: alertClass = 'alert-info';
    }
    
    return `<div class="alert ${alertClass} alert-dismissible">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                ${msg.text}
            </div>`;
}

// Function equivalent to redirect()
function redirect(res, url) {
    res.redirect(url);
}

// Media class equivalent
class Media {
    constructor() {
        this.errors = [];
        this.file_name = '';
        this.file_type = '';
        this.file_size = 0;
        this.tmp_path = '';
        this.upload_path = 'uploads/products/';
    }

    upload(file) {
        if (!file) {
            this.errors.push('No file selected');
            return false;
        }

        this.file_name = file.originalname;
        this.file_type = file.mimetype;
        this.file_size = file.size;
        this.tmp_path = file.path;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(this.file_type)) {
            this.errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            return false;
        }

        // Validate file size (max 5MB)
        if (this.file_size > 5 * 1024 * 1024) {
            this.errors.push('File size too large. Maximum 5MB allowed.');
            return false;
        }

        return true;
    }

    async process_media() {
        if (this.errors.length > 0) {
            return false;
        }

        try {
            // Create upload directory if it doesn't exist
            if (!fs.existsSync(this.upload_path)) {
                fs.mkdirSync(this.upload_path, { recursive: true });
            }

            // Move file to final destination
            const finalPath = path.join(this.upload_path, this.file_name);
            fs.copyFileSync(this.tmp_path, finalPath);
            
            // Clean up temporary file
            fs.unlinkSync(this.tmp_path);

            // Save to database
            const connection = await getDbConnection();
            await connection.execute(
                'INSERT INTO media (file_name, file_type, file_size) VALUES (?, ?, ?)',
                [this.file_name, this.file_type, this.file_size]
            );
            await connection.end();

            return true;
        } catch (error) {
            this.errors.push('Failed to process media: ' + error.message);
            return false;
        }
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Header template function
function getHeader(title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">
</head>
<body>
<div class="container">`;
}

// Footer template function
function getFooter() {
    return `</div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</body>
</html>`;
}

// Main route handler equivalent to the PHP page
app.get('/media', async (req, res) => {
    // Equivalent of $page_title = 'All Image';
    page_title = 'All Image';
    
    // Equivalent of page_require_level(2);
    if (!page_require_level(2)) {
        return res.status(403).send('Access denied');
    }
    
    // Equivalent of $media_files = find_all('media');
    const media_files = await find_all('media');
    
    // Reset counter for count_id()
    counter = 0;
    
    // Generate HTML equivalent to the PHP template
    let html = getHeader(page_title);
    
    html += `
     <div class="row">
        <div class="col-md-6">
          ${display_msg(msg)}
        </div>

      <div class="col-md-12">
        <div class="panel panel-default">
          <div class="panel-heading clearfix">
            <span class="glyphicon glyphicon-camera"></span>
            <span>All Photos</span>
            <div class="pull-right">
              <form class="form-inline" action="/media" method="POST" enctype="multipart/form-data">
              <div class="form-group">
                <div class="input-group">
                  <span class="input-group-btn">
                    <input type="file" name="file_upload" multiple="multiple" class="btn btn-primary btn-file"/>
                 </span>

                 <button type="submit" name="submit" class="btn btn-default">Upload</button>
               </div>
              </div>
             </form>
            </div>
          </div>
          <div class="panel-body">
            <table class="table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 50px;">#</th>
                  <th class="text-center">Photo</th>
                  <th class="text-center">Photo Name</th>
                  <th class="text-center" style="width: 20%;">Photo Type</th>
                  <th class="text-center" style="width: 50px;">Actions</th>
                </tr>
              </thead>
                <tbody>`;
    
    // Equivalent of foreach ($media_files as $media_file):
    media_files.forEach(media_file => {
        html += `
                <tr class="list-inline">
                 <td class="text-center">${count_id()}</td>
                  <td class="text-center">
                      <img src="uploads/products/${media_file.file_name}" class="img-thumbnail" />
                  </td>
                <td class="text-center">
                  ${media_file.file_name}
                </td>
                <td class="text-center">
                  ${media_file.file_type}
                </td>
                <td class="text-center">
                  <a href="/delete_media?id=${parseInt(media_file.id)}" class="btn btn-danger btn-xs"  title="Edit">
                    <span class="glyphicon glyphicon-trash"></span>
                  </a>
                </td>
               </tr>`;
    });
    
    html += `
            </tbody>
          </div>
        </div>
      </div>
</div>`;
    
    html += getFooter();
    
    // Clear message after displaying
    msg = '';
    
    res.send(html);
});

// POST route handler for file upload
app.post('/media', upload.single('file_upload'), async (req, res) => {
    // Equivalent of if(isset($_POST['submit']))
    if (req.body.submit !== undefined || req.file) {
        // Equivalent of $photo = new Media();
        const photo = new Media();
        
        // Equivalent of $photo->upload($_FILES['file_upload']);
        photo.upload(req.file);
        
        // Equivalent of if($photo->process_media())
        if (await photo.process_media()) {
            // Equivalent of $session->msg('s','photo has been uploaded.');
            sessionManager.msg('s', 'photo has been uploaded.');
            // Equivalent of redirect('media.php');
            redirect(res, '/media');
        } else {
            // Equivalent of $session->msg('d',join($photo->errors));
            sessionManager.msg('d', photo.errors.join(', '));
            // Equivalent of redirect('media.php');
            redirect(res, '/media');
        }
    } else {
        redirect(res, '/media');
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for testing or modular use
module.exports = app;



const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Assuming these constants are defined elsewhere in your application
// const SITE_ROOT = process.cwd(); // or your application root
// const DS = path.sep;

class Media {
  constructor() {
    this.imageInfo = null;
    this.fileName = null;
    this.fileType = null;
    this.fileTempPath = null;
    
    // Set destination for upload
    this.userPath = path.join(SITE_ROOT, '..', 'uploads', 'users');
    this.productPath = path.join(SITE_ROOT, '..', 'uploads', 'products');
    
    this.errors = [];
    this.upload_errors = {
      0: 'There is no error, the file uploaded with success',
      1: 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
      2: 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
      3: 'The uploaded file was only partially uploaded',
      4: 'No file was uploaded',
      6: 'Missing a temporary folder',
      7: 'Failed to write file to disk.',
      8: 'A PHP extension stopped the file upload.'
    };
    
    this.upload_extensions = [
      'gif',
      'jpg',
      'jpeg',
      'png'
    ];
  }

  file_ext(filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.') + 1);
    if (this.upload_extensions.includes(ext)) {
      return true;
    }
  }

  upload(file) {
    if (!file || !file || !Array.isArray(file) && typeof file !== 'object') {
      this.errors.push("No file was uploaded.");
      return false;
    } else if (file.error !== 0) {
      this.errors.push(this.upload_errors[file.error]);
      return false;
    } else if (!this.file_ext(file.name)) {
      this.errors.push('File not right format ');
      return false;
    } else {
      // JavaScript equivalent of getimagesize - using a helper function
      this.imageInfo = this.getImageSize(file.tmp_name || file.path);
      this.fileName = path.basename(file.name);
      this.fileType = this.imageInfo ? this.imageInfo.mime : file.mimetype;
      this.fileTempPath = file.tmp_name || file.path;
      return true;
    }
  }

  // Helper function to simulate PHP's getimagesize
  getImageSize(filePath) {
    try {
      // This is a simplified version - in a real implementation you might want to use
      // an image processing library like 'sharp' or 'jimp' to get actual image dimensions
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        return {
          mime: this.getMimeType(filePath),
          size: stats.size
        };
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  // Helper function to get MIME type
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  process() {
    if (this.errors.length > 0) {
      return false;
    } else if (!this.fileName || !this.fileTempPath) {
      this.errors.push("The file location was not available.");
      return false;
    } else if (!this.isWritable(this.productPath)) {
      this.errors.push(this.productPath + " Must be writable!!!.");
      return false;
    } else if (fs.existsSync(path.join(this.productPath, this.fileName))) {
      this.errors.push(`The file ${this.fileName} already exists.`);
      return false;
    } else {
      return true;
    }
  }

  // Helper function to check if directory is writable
  isWritable(dirPath) {
    try {
      fs.accessSync(dirPath, fs.constants.W_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /*--------------------------------------------------------------*/
  /* Function for Process media file
  /*--------------------------------------------------------------*/
  process_media() {
    if (this.errors.length > 0) {
      return false;
    }
    if (!this.fileName || !this.fileTempPath) {
      this.errors.push("The file location was not available.");
      return false;
    }

    if (!this.isWritable(this.productPath)) {
      this.errors.push(this.productPath + " Must be writable!!!.");
      return false;
    }

    if (fs.existsSync(path.join(this.productPath, this.fileName))) {
      this.errors.push(`The file ${this.fileName} already exists.`);
      return false;
    }

    if (this.moveUploadedFile(this.fileTempPath, path.join(this.productPath, this.fileName))) {
      if (this.insert_media()) {
        delete this.fileTempPath;
        return true;
      }
    } else {
      this.errors.push("The file upload failed, possibly due to incorrect permissions on the upload folder.");
      return false;
    }
  }

  // Helper function to simulate PHP's move_uploaded_file
  moveUploadedFile(sourcePath, destPath) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /*--------------------------------------------------------------*/
  /* Function for Process user image
  /*--------------------------------------------------------------*/
  process_user(id) {
    if (this.errors.length > 0) {
      return false;
    }
    if (!this.fileName || !this.fileTempPath) {
      this.errors.push("The file location was not available.");
      return false;
    }
    if (!this.isWritable(this.userPath)) {
      this.errors.push(this.userPath + " Must be writable!!!.");
      return false;
    }
    if (!id) {
      this.errors.push(" Missing user id.");
      return false;
    }
    const ext = this.fileName.split(".");
    const new_name = this.randString(8) + id + '.' + ext[ext.length - 1];
    this.fileName = new_name;
    if (this.user_image_destroy(id)) {
      if (this.moveUploadedFile(this.fileTempPath, path.join(this.userPath, this.fileName))) {
        if (this.update_userImg(id)) {
          delete this.fileTempPath;
          return true;
        }
      } else {
        this.errors.push("The file upload failed, possibly due to incorrect permissions on the upload folder.");
        return false;
      }
    }
  }

  // Helper function to generate random string (equivalent to PHP's randString)
  randString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /*--------------------------------------------------------------*/
  /* Function for Update user image
  /*--------------------------------------------------------------*/
  update_userImg(id) {
    // Assuming global db object is available - you'll need to adapt this to your DB implementation
    const sql = `UPDATE users SET image='${db.escape(this.fileName)}' WHERE id='${db.escape(id)}'`;
    const result = db.query(sql);
    return (result && db.affected_rows() === 1 ? true : false);
  }

  /*--------------------------------------------------------------*/
  /* Function for Delete old image
  /*--------------------------------------------------------------*/
  user_image_destroy(id) {
    const image = find_by_id('users', id);
    if (image.image === 'no_image.png') {
      return true;
    } else {
      try {
        fs.unlinkSync(path.join(this.userPath, image.image));
        return true;
      } catch (error) {
        return true; // Return true even if file doesn't exist, matching PHP behavior
      }
    }
  }

  /*--------------------------------------------------------------*/
  /* Function for insert media image
  /*--------------------------------------------------------------*/
  insert_media() {
    // Assuming global db object is available - you'll need to adapt this to your DB implementation
    const sql = `INSERT INTO media ( file_name,file_type ) VALUES ('${db.escape(this.fileName)}', '${db.escape(this.fileType)}')`;
    return (db.query(sql) ? true : false);
  }

  /*--------------------------------------------------------------*/
  /* Function for Delete media by id
  /*--------------------------------------------------------------*/
  media_destroy(id, file_name) {
    this.fileName = file_name;
    if (!this.fileName) {
      this.errors.push("The Photo file Name missing.");
      return false;
    }
    if (!id) {
      this.errors.push("Missing Photo id.");
      return false;
    }
    if (delete_by_id('media', id)) {
      try {
        fs.unlinkSync(path.join(this.productPath, this.fileName));
        return true;
      } catch (error) {
        return true; // Return true even if file doesn't exist, matching PHP behavior
      }
    } else {
      this.errors.push("Photo deletion failed Or Missing Prm.");
      return false;
    }
  }
}

module.exports = Media;


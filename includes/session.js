
// Simulating PHP session functionality
let $_SESSION = {};

// Simulating session_start() - this initializes the session storage
function session_start() {
    // In a real implementation, this would initialize session storage
    // For this translation, we'll use a simple object to simulate $_SESSION
    if (!$_SESSION) {
        $_SESSION = {};
    }
}

// Call session_start() at the beginning like in PHP
session_start();

class Session {

    constructor() {
        this.msg = null;
        this.user_is_logged_in = false;
        
        this._flash_msg();
        this._userLoginSetup();
    }

    isUserLoggedIn() {
        return this.user_is_logged_in;
    }

    login(user_id) {
        $_SESSION['user_id'] = user_id;
    }

    _userLoginSetup() {
        if (isset($_SESSION['user_id'])) {
            this.user_is_logged_in = true;
        } else {
            this.user_is_logged_in = false;
        }
    }

    logout() {
        unset($_SESSION, 'user_id');
    }

    msg(type = '', msg = '') {
        if (!empty(msg)) {
            if (strlen(trim(type)) === 1) {
                type = str_replace(['d', 'i', 'w', 's'], ['danger', 'info', 'warning', 'success'], type);
            }
            if (!$_SESSION['msg']) {
                $_SESSION['msg'] = {};
            }
            $_SESSION['msg'][type] = msg;
        } else {
            return this.msg;
        }
    }

    _flash_msg() {
        if (isset($_SESSION['msg'])) {
            this.msg = $_SESSION['msg'];
            unset($_SESSION, 'msg');
        } else {
            this.msg;
        }
    }
}

// Helper functions to simulate PHP functions
function isset(obj, key = null) {
    if (key === null) {
        return obj !== undefined && obj !== null;
    }
    return obj !== undefined && obj !== null && obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null;
}

function unset(obj, key) {
    if (obj && obj.hasOwnProperty(key)) {
        delete obj[key];
    }
}

function empty(value) {
    return value === undefined || value === null || value === '' || value === 0 || value === false || 
           (Array.isArray(value) && value.length === 0) || 
           (typeof value === 'object' && Object.keys(value).length === 0);
}

function strlen(str) {
    return str ? str.length : 0;
}

function trim(str) {
    return str ? str.trim() : '';
}

function str_replace(search, replace, subject) {
    if (Array.isArray(search) && Array.isArray(replace)) {
        for (let i = 0; i < search.length; i++) {
            if (i < replace.length) {
                subject = subject.split(search[i]).join(replace[i]);
            }
        }
        return subject;
    }
    return subject.split(search).join(replace);
}

const session = new Session();
const msg = session.msg();

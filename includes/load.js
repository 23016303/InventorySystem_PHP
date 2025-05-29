const path = require('path');
const fs = require('fs');

// -----------------------------------------------------------------------
// DEFINE SEPERATOR ALIASES
// -----------------------------------------------------------------------
const URL_SEPARATOR = '/';

const DS = path.sep;

// -----------------------------------------------------------------------
// DEFINE ROOT PATHS
// -----------------------------------------------------------------------
let SITE_ROOT;
if (typeof global.SITE_ROOT === 'undefined') {
    SITE_ROOT = path.resolve(path.dirname(__filename));
    global.SITE_ROOT = SITE_ROOT;
} else {
    SITE_ROOT = global.SITE_ROOT;
}

const LIB_PATH_INC = SITE_ROOT + DS;

// Require all necessary modules
require(LIB_PATH_INC + 'config.js');
require(LIB_PATH_INC + 'functions.js');
require(LIB_PATH_INC + 'session.js');
require(LIB_PATH_INC + 'upload.js');
require(LIB_PATH_INC + 'database.js');
require(LIB_PATH_INC + 'sql.js');

// Export constants for use in other modules
module.exports = {
    URL_SEPARATOR,
    DS,
    SITE_ROOT,
    LIB_PATH_INC
};
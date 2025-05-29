// Global errors array
let errors = [];

// Global database connection variable (would need to be set based on your database setup)
let con = null;

/*--------------------------------------------------------------*/
/* Function for Remove escapes special
/* characters in a string for use in an SQL statement
/*--------------------------------------------------------------*/
function real_escape(str) {
    // Note: This is a basic JavaScript implementation for escaping SQL special characters
    // In a real application, you should use parameterized queries instead
    if (typeof str !== 'string') {
        return str;
    }
    
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char;
            default:
                return char;
        }
    });
}

/*--------------------------------------------------------------*/
/* Function for Remove html characters
/*--------------------------------------------------------------*/
function remove_junk(str) {
    // Convert newlines to <br> tags
    str = str.replace(/\n/g, '<br>');
    
    // Strip HTML tags and escape special characters
    str = str.replace(/<[^>]*>/g, '');
    
    // Escape HTML special characters
    str = str.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#x27;');
    
    return str;
}

/*--------------------------------------------------------------*/
/* Function for Uppercase first character
/*--------------------------------------------------------------*/
function first_character(str) {
    let val = str.replace(/-/g, ' ');
    val = val.charAt(0).toUpperCase() + val.slice(1);
    return val;
}

/*--------------------------------------------------------------*/
/* Function for Checking input fields not empty
/*--------------------------------------------------------------*/
function validate_fields(varFields, postData = {}) {
    // Note: postData parameter replaces PHP's $_POST global
    varFields.forEach(function(field) {
        let val = remove_junk(postData[field] || '');
        if (val === '') {
            errors = field + " can't be blank.";
            return errors;
        }
    });
}

/*--------------------------------------------------------------*/
/* Function for Display Session Message
   Ex echo display_msg(message);
/*--------------------------------------------------------------*/
function display_msg(msg = '') {
    let output = [];
    if (msg && Object.keys(msg).length > 0) {
        for (let key in msg) {
            if (msg.hasOwnProperty(key)) {
                let value = msg[key];
                output = "<div class=\"alert alert-" + key + "\">";
                output += "<a href=\"#\" class=\"close\" data-dismiss=\"alert\">&times;</a>";
                output += remove_junk(first_character(value));
                output += "</div>";
            }
        }
        return output;
    } else {
        return "";
    }
}

/*--------------------------------------------------------------*/
/* Function for redirect
/*--------------------------------------------------------------*/
function redirect(url, permanent = false) {
    // Note: This is client-side redirect. Server-side redirects would need different implementation
    if (typeof window !== 'undefined') {
        window.location.href = url;
    }
    // In Node.js environment, you would use response.redirect() instead
}

/*--------------------------------------------------------------*/
/* Function for find out total selling price, buying price and profit
/*--------------------------------------------------------------*/
function total_price(totals) {
    let sum = 0;
    let sub = 0;
    
    totals.forEach(function(total) {
        sum += parseFloat(total.total_saleing_price) || 0;
        sub += parseFloat(total.total_buying_price) || 0;
    });
    
    let profit = sum - sub;
    
    return [sum, profit];
}

/*--------------------------------------------------------------*/
/* Function for Readable date time
/*--------------------------------------------------------------*/
function read_date(str) {
    if (str) {
        let date = new Date(str);
        let options = {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    } else {
        return null;
    }
}

/*--------------------------------------------------------------*/
/* Function for  Readable Make date time
/*--------------------------------------------------------------*/
function make_date() {
    let now = new Date();
    let year = now.getFullYear();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let day = String(now.getDate()).padStart(2, '0');
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/*--------------------------------------------------------------*/
/* Function for  Readable date time
/*--------------------------------------------------------------*/
function count_id() {
    // Static variable simulation using function property
    if (typeof count_id.count === 'undefined') {
        count_id.count = 1;
    }
    return count_id.count++;
}

/*--------------------------------------------------------------*/
/* Function for Creating random string
/*--------------------------------------------------------------*/
function randString(length = 5) {
    let str = '';
    let cha = "0123456789abcdefghijklmnopqrstuvwxyz";
    
    for (let x = 0; x < length; x++) {
        str += cha[Math.floor(Math.random() * cha.length)];
    }
    return str;
}

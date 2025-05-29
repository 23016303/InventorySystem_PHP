
// Import required modules and dependencies
const path = require('path');
const load = require('./includes/load.js');

// Import necessary functions and objects from the load module
const { page_require_level, find_by_id, delete_by_id, session, redirect } = load;

// Function to handle the product deletion request
async function deleteProduct(req, res) {
    try {
        // Check what level user has permission to view this page
        await page_require_level(2, req, res);
        
        // Get product by ID from query parameters
        const productId = parseInt(req.query.id);
        const product = await find_by_id('products', productId);
        
        if (!product) {
            session.msg("d", "Missing Product id.");
            redirect('product.php', res);
            return;
        }
        
        // Delete the product by ID
        const delete_id = await delete_by_id('products', parseInt(product.id));
        
        if (delete_id) {
            session.msg("s", "Products deleted.");
            redirect('product.php', res);
        } else {
            session.msg("d", "Products deletion failed.");
            redirect('product.php', res);
        }
        
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        session.msg("d", "Products deletion failed.");
        redirect('product.php', res);
    }
}

// Export the function for use in routing
module.exports = deleteProduct;

// Alternative implementation as an Express.js route handler
function deleteProductRoute(req, res) {
    // Check what level user has permission to view this page
    page_require_level(2, req, res)
        .then(() => {
            // Get product by ID from query parameters
            const productId = parseInt(req.query.id);
            return find_by_id('products', productId);
        })
        .then((product) => {
            if (!product) {
                session.msg("d", "Missing Product id.");
                redirect('product.php', res);
                return Promise.reject(new Error('Product not found'));
            }
            
            // Delete the product by ID
            return delete_by_id('products', parseInt(product.id));
        })
        .then((delete_id) => {
            if (delete_id) {
                session.msg("s", "Products deleted.");
                redirect('product.php', res);
            } else {
                session.msg("d", "Products deletion failed.");
                redirect('product.php', res);
            }
        })
        .catch((error) => {
            if (error.message !== 'Product not found') {
                console.error('Error in deleteProductRoute:', error);
                session.msg("d", "Products deletion failed.");
                redirect('product.php', res);
            }
        });
}

// Export both implementations
module.exports = {
    deleteProduct,
    deleteProductRoute
};


<?php
/**
 * Plugin Name: Natural Options AI Shopper Assistant
 * Description: An AI-powered shopper assistant for Natural Options using Google Gemini.
 * Version: 1.0.1
 * Author: Omu
 * Text Domain: natural-options-ai
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define constants
define('NO_AI_PATH', plugin_dir_path(__FILE__));
define('NO_AI_URL', plugin_dir_url(__FILE__));

// Include required files
require_once NO_AI_PATH . 'includes/admin-settings.php';
require_once NO_AI_PATH . 'includes/api-handler.php';
require_once NO_AI_PATH . 'includes/woo-context.php';
require_once NO_AI_PATH . 'includes/frontend-widget.php';

// Initialization
add_action('plugins_loaded', 'no_ai_init');

function no_ai_init() {
    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'no_ai_woo_missing_notice');
        return;
    }
}

function no_ai_woo_missing_notice() {
    ?>
    <div class="error notice">
        <p><?php _e('Natural Options AI Assistant requires WooCommerce to be installed and active.', 'natural-options-ai'); ?></p>
    </div>
    <?php
}

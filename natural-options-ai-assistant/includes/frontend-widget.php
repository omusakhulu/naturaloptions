<?php
/**
 * Frontend Widget and Asset Enqueuing
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', 'no_ai_enqueue_scripts');
add_action('wp_footer', 'no_ai_render_widget');

function no_ai_enqueue_scripts() {
    wp_enqueue_style('no-ai-style', NO_AI_URL . 'assets/css/style.css');
    wp_enqueue_script('no-ai-script', NO_AI_URL . 'assets/js/script.js', array('jquery'), '1.0.0', true);

    $options = get_option('no_ai_settings');
    wp_localize_script('no-ai-script', 'noAiSettings', array(
        'apiUrl' => esc_url_raw(rest_url('no-ai/v1/chat')),
        'assistantName' => isset($options['assistant_name']) ? esc_attr($options['assistant_name']) : 'Natural Options Assistant',
    ));
}

function no_ai_render_widget() {
    $options = get_option('no_ai_settings');
    $name = isset($options['assistant_name']) ? esc_attr($options['assistant_name']) : 'Natural Options Assistant';
    ?>
    <div id="no-ai-widget" class="no-ai-closed">
        <div id="no-ai-header">
            <span class="no-ai-title"><?php echo $name; ?></span>
            <button id="no-ai-toggle">−</button>
        </div>
        <div id="no-ai-chat-body">
            <div id="no-ai-messages">
                <div class="no-ai-message no-ai-ai">
                    Hello! How can I help you today?
                </div>
            </div>
            <div id="no-ai-loading" style="display:none;">Thinking...</div>
        </div>
        <form id="no-ai-input-area">
            <input type="text" id="no-ai-input" placeholder="Ask something..." autocomplete="off">
            <button type="submit" id="no-ai-send">Send</button>
        </form>
    </div>
    <button id="no-ai-launcher">
        <span class="dashicons dashicons-format-chat"></span>
    </button>
    <?php
}

<?php
/**
 * Admin Settings for Natural Options AI Assistant
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', 'no_ai_add_admin_menu');
add_action('admin_init', 'no_ai_settings_init');

function no_ai_add_admin_menu() {
    add_menu_page(
        'AI Assistant Settings',
        'AI Assistant',
        'manage_options',
        'no_ai_assistant',
        'no_ai_options_page',
        'dashicons-robot-custom' // We'll use a generic icon or a custom one
    );
}

function no_ai_settings_init() {
    register_setting('noAiPlugin', 'no_ai_settings');

    add_settings_section(
        'no_ai_plugin_section',
        __('API Configuration', 'natural-options-ai'),
        'no_ai_settings_section_callback',
        'noAiPlugin'
    );

    add_settings_field(
        'gemini_api_key',
        __('Gemini API Key', 'natural-options-ai'),
        'no_ai_gemini_api_key_render',
        'noAiPlugin',
        'no_ai_plugin_section'
    );

    add_settings_field(
        'assistant_name',
        __('Assistant Name', 'natural-options-ai'),
        'no_ai_assistant_name_render',
        'noAiPlugin',
        'no_ai_plugin_section'
    );
}

function no_ai_gemini_api_key_render() {
    $options = get_option('no_ai_settings');
    ?>
    <input type='password' name='no_ai_settings[gemini_api_key]' value='<?php echo isset($options['gemini_api_key']) ? esc_attr($options['gemini_api_key']) : ''; ?>' style="width: 400px;">
    <?php
}

function no_ai_assistant_name_render() {
    $options = get_option('no_ai_settings');
    ?>
    <input type='text' name='no_ai_settings[assistant_name]' value='<?php echo isset($options['assistant_name']) ? esc_attr($options['assistant_name']) : 'Natural Options Assistant'; ?>'>
    <?php
}

function no_ai_settings_section_callback() {
    echo __('Enter your Google Gemini API key to enable the AI Shopper Assistant.', 'natural-options-ai');
}

function no_ai_options_page() {
    ?>
    <form action='options.php' method='post'>
        <h2>Natural Options AI Shopper Assistant</h2>
        <?php
        settings_fields('noAiPlugin');
        do_settings_sections('noAiPlugin');
        submit_button();
        ?>
    </form>
    <?php
}

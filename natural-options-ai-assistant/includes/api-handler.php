<?php
/**
 * API Handler for Gemini Communication
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('no-ai/v1', '/chat', array(
        'methods' => 'POST',
        'callback' => 'no_ai_handle_chat_request',
        'permission_callback' => '__return_true', // In production, consider nonces or auth
    ));
});

function no_ai_handle_chat_request($request) {
    $params = $request->get_json_params();
    $message = $params['message'] ?? '';
    $history = $params['history'] ?? array();

    if (empty($message)) {
        return new WP_Error('no_message', 'Message is required', array('status' => 400));
    }

    $options = get_option('no_ai_settings');
    $api_key = $options['gemini_api_key'] ?? '';

    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Gemini API key is not configured', array('status' => 500));
    }

    // Get context
    $context = NO_AI_Woo_Context::get_context();

    $system_prompt = "You are a professional and friendly AI Shopper and Store Assistant for 'Natural Options'. 
    Your goal is to help customers find products, answer questions about availability and pricing, and provide recommendations.
    Additionally, you can provide the store owner with high-level performance information if they ask about sales or shop performance.
    
    Use the following shop and product information as your primary source of truth:
    {$context}
    
    Guidelines:
    1. Be helpful, polite, and concise.
    2. If a product is mentioned, you can provide its price and link.
    3. If you don't know the answer or the data isn't in the list, politely inform the user.
    4. Always maintain a professional yet warm tone.
    5. Do not invent products or performance figures that are not in the context.
    6. For performance data, summarize it clearly for the owner.";

    // Prepare Gemini request
    $gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $api_key;

    $contents = array();
    
    // Add history
    foreach ($history as $h) {
        $contents[] = array(
            'role' => ($h['role'] === 'user') ? 'user' : 'model',
            'parts' => array(array('text' => $h['parts'][0]['text']))
        );
    }

    // Add current message
    $contents[] = array(
        'role' => 'user',
        'parts' => array(array('text' => $message))
    );

    $body = array(
        'systemInstruction' => array(
            'parts' => array(array('text' => $system_prompt))
        ),
        'contents' => $contents,
        'generationConfig' => array(
            'maxOutputTokens' => 1000,
        )
    );

    $response = wp_remote_post($gemini_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($body),
        'timeout' => 30
    ));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }

    $response_body = json_decode(wp_remote_retrieve_body($response), true);

    if (isset($response_body['candidates'][0]['content']['parts'][0]['text'])) {
        $ai_response = $response_body['candidates'][0]['content']['parts'][0]['text'];
        return rest_ensure_response(array('response' => $ai_response));
    } else {
        $error_msg = $response_body['error']['message'] ?? 'Failed to get response from AI';
        return new WP_Error('gemini_error', $error_msg, array('status' => 500));
    }
}

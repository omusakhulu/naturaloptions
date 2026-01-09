<?php
/**
 * API Handler for Gemini Communication
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Ensure WooCommerce session and cart are initialized for REST requests
 */
function no_ai_init_wc_session() {
    if (!class_exists('WooCommerce')) {
        return false;
    }

    if (!function_exists('WC')) {
        return false;
    }

    // Standard WooCommerce way to ensure frontend environment is loaded
    if (null === WC()->session) {
        WC()->frontend_includes();
        
        $session_handler_class = apply_filters('woocommerce_session_handler', 'WC_Session_Handler');
        WC()->session = new $session_handler_class();
        WC()->session->init();
    }

    if (null === WC()->cart) {
        WC()->cart = new WC_Cart();
    }

    return true;
}

add_action('rest_api_init', function () {
    register_rest_route('no-ai/v1', '/chat', array(
        'methods' => 'POST',
        'callback' => 'no_ai_handle_chat_request',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('no-ai/v1', '/add-to-cart', array(
        'methods' => 'POST',
        'callback' => 'no_ai_handle_add_to_cart',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('no-ai/v1', '/request-quote', array(
        'methods' => 'POST',
        'callback' => 'no_ai_handle_request_quote',
        'permission_callback' => '__return_true',
    ));
});

function no_ai_handle_request_quote($request) {
    if (!no_ai_init_wc_session()) {
        return new WP_Error('no_woo', 'WooCommerce not properly initialized', array('status' => 500));
    }

    $params = $request->get_json_params();
    $items_raw = $params['items'] ?? array();
    
    // items_raw should be an array of objects like { product_id: ID, quantity: QTY }
    
    $email = sanitize_email($params['email'] ?? '');

    if (empty($items_raw) || !$email) {
        return new WP_Error('invalid_data', 'Items and Email are required', array('status' => 400));
    }

    try {
        // Create a new order
        $order = wc_create_order();
        
        $added_items = array();
        foreach ($items_raw as $item) {
            $pid = intval($item['product_id']);
            $qty = intval($item['quantity'] ?? 1);
            
            $product = wc_get_product($pid);
            if ($product) {
                $order->add_product($product, $qty);
                $added_items[] = $product->get_name() . " (x{$qty})";
            }
        }
        
        if (empty($added_items)) {
            return new WP_Error('no_valid_products', 'No valid products found for the quote', array('status' => 400));
        }

        $order->set_billing_email($email);
        $order->set_status('pending', 'Quote requested via AI Assistant');
        $order->calculate_totals();
        $order->save();

        // Send the invoice email
        $mailer = WC()->mailer();
        $notification = $mailer->emails['WC_Email_Customer_Invoice'];
        if ($notification) {
            $notification->trigger($order->get_id());
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Quote/Invoice has been sent to your email.', 'natural-options-ai'),
            'order_id' => $order->get_id(),
            'items' => $added_items,
            'total' => $order->get_total()
        ));
    } catch (Exception $e) {
        error_log('AI Assistant Request Quote Error: ' . $e->getMessage());
        return new WP_Error('quote_failed', $e->getMessage(), array('status' => 500));
    }
}

function no_ai_handle_add_to_cart($request) {
    if (!no_ai_init_wc_session()) {
        return new WP_Error('no_woo', 'WooCommerce not properly initialized', array('status' => 500));
    }

    $params = $request->get_json_params();
    $product_id = intval($params['product_id'] ?? 0);

    if (!$product_id) {
        return new WP_Error('invalid_id', 'Product ID is required', array('status' => 400));
    }

    try {
        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('product_not_found', 'Product not found', array('status' => 404));
        }

        // Check stock status
        if (!$product->is_in_stock()) {
            return new WP_Error('out_of_stock', 'Product is out of stock', array('status' => 400));
        }

        $passed_validation = apply_filters('woocommerce_add_to_cart_validation', true, $product_id, 1);
        
        if ($passed_validation) {
            $cart_item_key = WC()->cart->add_to_cart($product_id, 1);
            if ($cart_item_key) {
                // Persistent session for the next request
                if (WC()->session && method_exists(WC()->session, 'set_customer_session_cookie')) {
                    WC()->session->set_customer_session_cookie(true);
                }
                
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => sprintf(__('"%s" added to cart', 'natural-options-ai'), $product->get_name()),
                    'cart_url' => wc_get_cart_url()
                ));
            }
        }

        // If add_to_cart returned false without throwing an exception
        return new WP_Error('add_failed', 'Failed to add product to cart. It might be out of stock or have validation issues.', array('status' => 400));
    } catch (Throwable $e) {
        error_log('AI Assistant Add to Cart Error: ' . $e->getMessage());
        return new WP_Error('add_error', $e->getMessage(), array('status' => 500));
    }
}

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
    
    Order Support:
    If a customer explicitly asks to 'order', 'buy', or 'add to cart' a specific product from the list above, you MUST include the following tag at the end of your message: [ADD_TO_CART:ID] where ID is the numerical ID of the product.
    Example: 'I have added that to your cart for you. [ADD_TO_CART:123]'
    
    Quote Support:
    If a customer asks for a 'quote', 'invoice', or 'pricing document' for one or more products, you MUST:
    1. Ask for their email address if you don't have it.
    2. List every item they selected with its individual price and requested quantity.
    3. Calculate the subtotal and total.
    4. Provide this breakdown clearly in your message.
    5. ONLY AFTER the breakdown, include this tag: [REQUEST_QUOTE:ID1*QTY1,ID2*QTY2:EMAIL]
    
    Example: 
    'Certainly! Here is your quote:
    - Lavender Oil (x3): $60.00 ($20.00 each)
    - Tea Tree Oil (x2): $50.00 ($25.00 each)
    Total: $110.00
    
    I have sent this invoice to your email (user@example.com) for payment. [REQUEST_QUOTE:123*3,456*2:user@example.com]'
    
    If the customer wants to 'checkout' or 'finish', provide them with a link to the checkout page: " . wc_get_checkout_url() . "
    
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

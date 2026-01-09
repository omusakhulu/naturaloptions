<?php
/**
 * WooCommerce Context Fetcher for Natural Options AI Assistant
 */

if (!defined('ABSPATH')) {
    exit;
}

class NO_AI_Woo_Context {
    public static function get_context() {
        if (!class_exists('WooCommerce')) {
            return "WooCommerce is not active.";
        }

        $currency = get_woocommerce_currency_symbol();
        $context = "Here is the current product catalog for Natural Options (Prices in {$currency}):\n\n";

        // Fetch published products
        $args = array(
            'status' => 'publish',
            'stock_status' => 'instock',
            'limit' => 50,
        );
        $products = wc_get_products($args);

        foreach ($products as $product) {
            $price = $product->get_price();
            
            // Skip products without a price
            if (empty($price)) {
                continue;
            }

            $id = $product->get_id();
            $name = $product->get_name();
            $desc = wp_strip_all_tags($product->get_description());
            $desc = mb_strimwidth($desc, 0, 200, "...");
            $link = get_permalink($product->get_id());
            $categories = wc_get_product_category_list($product->get_id(), ', ', '', '');

            $context .= "- ID: {$id}, Name: {$name}, Price: {$price}, Category: " . wp_strip_all_tags($categories) . ". Description: {$desc}. Link: {$link}\n";
        }

        // Add performance data
        $context .= "\nShop Performance Data (Current Month):\n";
        $report = self::get_sales_report();
        $context .= "- Total Sales: " . ($report['total_sales'] ?? 0) . "\n";
        $context .= "- Total Orders: " . ($report['total_orders'] ?? 0) . "\n";
        $context .= "- Total Items Sold: " . ($report['total_items'] ?? 0) . "\n";

        return $context;
    }

    private static function get_sales_report() {
        if (!function_exists('wc_get_report_data')) {
            return array();
        }

        $start_date = date('Y-m-01');
        $end_date = date('Y-m-t');

        $sales_data = wc_get_report_data(array(
            'data' => array(
                'total_sales' => array(
                    'type'     => 'total_sales',
                    'function' => 'SUM',
                    'name'     => 'total_sales',
                ),
                'total_orders' => array(
                    'type'     => 'post_date',
                    'function' => 'COUNT',
                    'name'     => 'total_orders',
                ),
                'total_items' => array(
                    'type'     => 'order_item_qty',
                    'function' => 'SUM',
                    'name'     => 'total_items',
                ),
            ),
            'where' => array(
                array(
                    'key'      => 'post_date',
                    'value'    => $start_date,
                    'operator' => '>=',
                ),
                array(
                    'key'      => 'post_date',
                    'value'    => $end_date,
                    'operator' => '<=',
                ),
            ),
        ));

        return array(
            'total_sales' => $sales_data->total_sales ?? 0,
            'total_orders' => $sales_data->total_orders ?? 0,
            'total_items' => $sales_data->total_items ?? 0,
        );
    }
}

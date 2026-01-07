const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const api = new WooCommerceRestApi({
  url: process.env.WOO_STORE_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: 'wc/v3',
  queryStringAuth: true
});

export const getWooCommerceContext = async () => {
  try {
    // Fetch products to provide context to the AI
    const [productsResponse, reportsResponse] = await Promise.all([
      api.get('products', {
        per_page: 50,
        status: 'publish',
        stock_status: 'instock'
      }),
      api.get('reports/sales', {
        period: 'month'
      })
    ]);

    const products = productsResponse.data.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      description: product.description.replace(/<[^>]*>?/gm, '').substring(0, 200),
      categories: product.categories.map(c => c.name).join(', '),
      permalink: product.permalink
    }));

    const salesReport = reportsResponse.data[0] || {};

    let contextString = "Here is the current product catalog for Natural Options:\n\n";
    products.forEach(p => {
      contextString += `- ${p.name}: Price: ${p.price}, Category: ${p.categories}. Description: ${p.description}. Link: ${p.permalink}\n`;
    });

    contextString += `\nShop Performance Data (Current Month):\n`;
    contextString += `- Total Sales: ${salesReport.total_sales || 0}\n`;
    contextString += `- Total Orders: ${salesReport.total_orders || 0}\n`;
    contextString += `- Total Items Sold: ${salesReport.total_items || 0}\n`;
    contextString += `- Total Shipping: ${salesReport.total_shipping || 0}\n`;
    contextString += `- Total Tax: ${salesReport.total_tax || 0}\n`;

    return contextString;
  } catch (error) {
    console.error('Error fetching WooCommerce context:', error);
    return "Error fetching shop data. Please rely on general knowledge or ask for clarification.";
  }
};

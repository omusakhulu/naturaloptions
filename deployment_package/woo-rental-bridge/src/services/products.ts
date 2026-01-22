// src/services/products.ts (Example structure)
import { ApiClient } from '../client';
// Import necessary types/interfaces for products

export class ProductService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async listProducts(filters = {}): Promise<any[]> { // Replace 'any' with specific Product type
    // TODO: Handle filters mapping to WC API query params
    return this.client.request<any[]>('GET', '/products', undefined, filters);
    // Remember to implement pagination fetching logic here or in the client
  }

  async getProduct(id: number): Promise<any> { // Replace 'any' with specific Product type
    return this.client.request<any>('GET', `/products/${id}`);
  }

  async createProduct(data: any): Promise<any> { // Replace 'any' with specific Product type/payload
    // Ensure rental/booking metadata is structured correctly in 'data'
    return this.client.request<any>('POST', '/products', data);
  }

  async updateProduct(id: number, data: any): Promise<any> { // Replace 'any'
     // Include specific fields like upsells, cross_sells, rental fields
    return this.client.request<any>('PUT', `/products/${id}`, data);
  }

  async deleteProduct(id: number): Promise<any> { // Replace 'any' with response type
    return this.client.request<any>('DELETE', `/products/${id}`, undefined, { force: true });
  }

  async updateInventory(id: number, quantity: number, status: string): Promise<any> { // Replace 'any'
    const data = { stock_quantity: quantity, stock_status: status };
    return this.client.request<any>('PUT', `/products/${id}`, data);
  }

  async checkAvailability(id: number, dates: any): Promise<any> { // Replace 'any'
    // CRITICAL: This needs specific implementation based on the rental/booking plugin
    // on omnishop.omnispace3d.com. It might involve:
    // 1. Calling a custom endpoint provided by the plugin.
    // 2. Querying specific product meta_data fields.
    // This requires investigation on the target WordPress site.
    console.warn(`checkAvailability for product ${id} requires plugin-specific implementation.`);
    throw new Error('checkAvailability not implemented.');
  }
}
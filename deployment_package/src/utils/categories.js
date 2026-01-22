// Default category for products without a valid category
export const DEFAULT_CATEGORY = 'Uncategorized';

// Default category info
const defaultCategoryInfo = {
  icon: 'tabler-tag',
  color: 'default'
};

// Track all unique categories we find in the system
const dynamicCategories = new Map();

/**
 * Gets a valid category name from a product's categories
 * @param {Array} productCategories - Array of category objects from WooCommerce
 * @returns {string} A valid category name
 */
export const getValidCategory = (productCategories) => {
  // Handle null, undefined, or non-array inputs
  if (!productCategories || !Array.isArray(productCategories)) {
    return DEFAULT_CATEGORY;
  }

  // Handle empty array
  if (productCategories.length === 0) {
    return DEFAULT_CATEGORY;
  }

  // Process all categories to find valid ones
  const validCats = productCategories
    .map(cat => {
      // Handle string categories
      if (typeof cat === 'string') {
        return cat.trim();
      }

      // Handle object categories
      if (cat && typeof cat === 'object') {
        // Try different possible category name properties
        const name = cat.name || cat.label || cat.title || '';

        if (name && typeof name === 'string') {
          return name.trim();
        }

        // Look for any string value in the object
        const values = Object.values(cat);
        const firstString = values.find(v => typeof v === 'string');

        if (firstString) {
          return firstString.trim();
        }
      }

      return null;
    })
    .filter(name => name && name.length > 0);

  // If no valid categories found
  if (validCats.length === 0) {
    return DEFAULT_CATEGORY;
  }

  // Add all found categories to our dynamic list
  validCats.forEach(cat => {
    if (!dynamicCategories.has(cat)) {
      dynamicCategories.set(cat, {
        name: cat,
        icon: 'tabler-tag',
        color: getColorForCategory(cat)
      });
    }
  });

  // Return the first valid category
  return validCats[0];
};

/**
 * Gets all unique categories that have been seen
 * @returns {Array} Array of category objects
 */
export const getAllCategories = () => {
  return Array.from(dynamicCategories.values());
};

/**
 * Gets the category object for a given category name
 * @param {string} categoryName - The name of the category
 * @returns {Object} The category object with icon and color
 */
// Get category info with a fallback to default values
export const getCategoryInfo = (categoryName) => {
  if (!categoryName) return { ...defaultCategoryInfo, name: DEFAULT_CATEGORY };

  // Try to find the category in our dynamic list
  const category = dynamicCategories.get(categoryName);

  if (category) return category;

  // If not found, create a new entry with deterministic color
  const newCategory = {
    name: categoryName,
    icon: 'tabler-tag',
    color: getColorForCategory(categoryName)
  };

  dynamicCategories.set(categoryName, newCategory);

  return newCategory;
};

/**
 * Generates a deterministic color based on category name
 * @param {string} categoryName - The name of the category
 * @returns {string} A color string
 */
function getColorForCategory(categoryName) {
  if (!categoryName) return 'default';
  
  // List of available colors
  const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
  
  // Generate a simple hash of the category name
  const hash = categoryName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % colors.length;
  
  return colors[index] || 'default';
}

// Export all functions that might be used elsewhere
export { getColorForCategory };

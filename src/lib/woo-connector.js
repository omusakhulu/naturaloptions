// This is a local module that re-exports WooRentalBridge from woorental-bridge package

// Async function to load WooRentalBridge dynamically
async function loadWooRentalBridge() {
  try {
    const wooModule = await import('woorental-bridge')

    return wooModule.default || wooModule
  } catch (error) {
    console.warn('Failed to load woorental-bridge:', error.message)

    // Fallback class if import fails
    return class {
      constructor(config) {
        this.config = config
      }
    }
  }
}

export default loadWooRentalBridge

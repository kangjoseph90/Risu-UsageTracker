/**
 * Usage Plugin - TypeScript Version
 * This is the main entry point for the usage plugin
 */

class UsagePlugin {
  static PLUGIN_NAME = 'usage-plugin';

  constructor() {
    console.log('Usage Plugin initialized');
  }

  static init() {
    console.log('Usage Plugin ready');
  }

  static showUsageUI() {
    console.log('Showing usage UI');
  }
}

// Initialize plugin
UsagePlugin.init();

// Export for use
export default UsagePlugin;

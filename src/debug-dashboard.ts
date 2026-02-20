/**
 * Debug script to check dashboard configuration in localStorage
 * Run this in the browser console to debug widget ordering
 */

export function debugDashboard() {
  console.log("=== DASHBOARD DEBUG ===");
  
  const configKey = 'cw_dashboard_config';
  const versionKey = 'cw_dashboard_config_version';
  
  const version = localStorage.getItem(versionKey);
  const configStr = localStorage.getItem(configKey);
  
  console.log("Config Version:", version);
  
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      console.log("Total widgets:", config.widgets.length);
      console.log("Enabled widgets:");
      config.widgets
        .filter((w: any) => w.enabled)
        .sort((a: any, b: any) => a.order - b.order)
        .forEach((w: any) => {
          console.log(`  ${w.order}. ${w.id} (size: ${w.size})`);
        });
      
      console.log("\nExpected original order:");
      const expected = [
        'xp-bar',
        'streak-display', 
        'cycle-phase',
        'performance-cards',
        'ai-insight',
        'recent-trades',
        'journal-entry',
        'prop-firm-summary',
        'leaderboard-preview'
      ];
      expected.forEach((id, idx) => {
        console.log(`  ${idx + 1}. ${id}`);
      });
    } catch (e) {
      console.error("Failed to parse config:", e);
    }
  } else {
    console.log("No config found in localStorage");
  }
  
  console.log("=== END DEBUG ===");
}

// Auto-run in development
if (import.meta.env.DEV) {
  window.debugDashboard = debugDashboard as any;
  console.log("Debug function available: window.debugDashboard()");
}

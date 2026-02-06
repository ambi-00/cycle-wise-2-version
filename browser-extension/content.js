// Content script - runs on every page

// Check if current page should be blocked
async function checkAndBlock() {
  const currentUrl = window.location.href;
  
  // Get settings from extension storage
  const result = await chrome.storage.local.get(['safetyModeEnabled', 'blockedUrls']);
  const safetyModeEnabled = result.safetyModeEnabled || false;
  const blockedUrls = result.blockedUrls || [];
  
  if (!safetyModeEnabled || blockedUrls.length === 0) return;
  
  // Check if current URL matches any blocked URL
  const shouldBlock = blockedUrls.some(blockedUrl => {
    try {
      const blockedDomain = new URL(blockedUrl).hostname;
      const currentDomain = window.location.hostname;
      return currentDomain.includes(blockedDomain) || blockedDomain.includes(currentDomain);
    } catch (e) {
      return false;
    }
  });
  
  if (shouldBlock && !currentUrl.includes('blocked.html')) {
    // Redirect to blocked page
    window.location.href = chrome.runtime.getURL('blocked.html') + '?blocked=' + encodeURIComponent(currentUrl);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAppSettings') {
    // Check if we're on CycleWise app
    try {
      const safetyModeEnabled = localStorage.getItem('cw_safety_mode_enabled') === 'true';
      const tradingPlatformUrl = localStorage.getItem('cw_trading_platform_url');
      
      sendResponse({
        settings: {
          safetyModeEnabled,
          blockedUrls: tradingPlatformUrl ? [tradingPlatformUrl] : []
        }
      });
    } catch (e) {
      sendResponse({ settings: null });
    }
  }
  return true;
});

// Run check on page load
checkAndBlock();

// Also check periodically (every 5 seconds)
setInterval(checkAndBlock, 5000);

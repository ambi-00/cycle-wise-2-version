// Background script for CycleWise Safety Mode Blocker

// Listen for tab updates and check if URL should be blocked
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only check main frame
  
  const url = details.url;
  
  // Get settings from storage
  const result = await chrome.storage.local.get(['safetyModeEnabled', 'blockedUrls']);
  const safetyModeEnabled = result.safetyModeEnabled || false;
  const blockedUrls = result.blockedUrls || [];
  
  if (!safetyModeEnabled || blockedUrls.length === 0) return;
  
  // Check if current URL matches any blocked URL
  const shouldBlock = blockedUrls.some(blockedUrl => {
    try {
      const blockedDomain = new URL(blockedUrl).hostname;
      const currentDomain = new URL(url).hostname;
      return currentDomain.includes(blockedDomain) || blockedDomain.includes(currentDomain);
    } catch (e) {
      return false;
    }
  });
  
  if (shouldBlock) {
    // Redirect to blocked page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') + '?blocked=' + encodeURIComponent(url)
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    chrome.storage.local.set({
      safetyModeEnabled: request.safetyModeEnabled,
      blockedUrls: request.blockedUrls
    });
    sendResponse({ success: true });
  } else if (request.action === 'getSettings') {
    chrome.storage.local.get(['safetyModeEnabled', 'blockedUrls'], (result) => {
      sendResponse({
        safetyModeEnabled: result.safetyModeEnabled || false,
        blockedUrls: result.blockedUrls || []
      });
    });
    return true; // Will respond asynchronously
  }
});

// Sync settings from CycleWise app (check every 30 seconds)
setInterval(async () => {
  try {
    // Query CycleWise app tabs
    const tabs = await chrome.tabs.query({ url: "*://localhost:*/*" });
    if (tabs.length > 0) {
      // Send message to get settings from app
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getAppSettings' }, (response) => {
        if (response && response.settings) {
          chrome.storage.local.set({
            safetyModeEnabled: response.settings.safetyModeEnabled,
            blockedUrls: response.settings.blockedUrls
          });
        }
      });
    }
  } catch (e) {
    console.log('Could not sync with CycleWise app');
  }
}, 30000);

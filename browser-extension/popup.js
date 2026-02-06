// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const infoDiv = document.getElementById('info');
  const blockedListDiv = document.getElementById('blockedList');
  const urlListDiv = document.getElementById('urlList');
  
  // Get settings from storage
  const result = await chrome.storage.local.get(['safetyModeEnabled', 'blockedUrls']);
  const safetyModeEnabled = result.safetyModeEnabled || false;
  const blockedUrls = result.blockedUrls || [];
  
  // Update UI
  if (safetyModeEnabled) {
    statusDiv.className = 'status active';
    statusIcon.textContent = '🛡️';
    statusText.textContent = 'Safety Mode is ACTIVE';
    infoDiv.textContent = 'Trading platforms are currently blocked to protect your discipline during sensitive cycle phases.';
  } else {
    statusDiv.className = 'status inactive';
    statusIcon.textContent = '✅';
    statusText.textContent = 'Safety Mode is OFF';
    infoDiv.textContent = 'Trading platforms are accessible. Enable Safety Mode in CycleWise to block them during sensitive phases.';
  }
  
  // Show blocked URLs if any
  if (blockedUrls.length > 0) {
    blockedListDiv.style.display = 'block';
    urlListDiv.innerHTML = blockedUrls.map(url => 
      `<div class="blocked-url">${url}</div>`
    ).join('');
  }
});

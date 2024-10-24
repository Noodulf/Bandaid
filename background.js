let mouseControlActive = false; // State to track whether mouse control is active

// Register the tab switch listener globally
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (mouseControlActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let tab = tabs[0];
      injectMouseControlScripts(tab.id, true); // Inject start script if control is active
    });
  }
});

// Listen for messages from popup (start or stop)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    mouseControlActive = true;  // Mark control as active
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let tab = tabs[0];
      injectMouseControlScripts(tab.id, true); // Start mouse control on the current tab
    });

  } else if (request.action === 'stop') {
    mouseControlActive = false;  // Mark control as inactive
    // Stop mouse control on **all tabs**
    chrome.tabs.query({}, (tabs) => {  // Query all open tabs
      for (let tab of tabs) {
        injectMouseControlScripts(tab.id, false); // Stop mouse control on each tab
      }
    });
  }
});

// Function to inject content scripts for starting or stopping mouse control
function injectMouseControlScripts(tabId, shouldStart) {
  const action = shouldStart ? 'startMouseControl' : 'stopMouseControl';
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      chrome.runtime.sendMessage({ action });
    }
  });
}

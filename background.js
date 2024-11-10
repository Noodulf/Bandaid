let mouseControlActive = false; // Tracks if mouse control is active
let currentTabId = null; // Tracks the currently active tab with mouse control
let currentWindowId = null; // Tracks the window of the currently active tab

// Function to apply or remove the mouse control script on a specific tab
function updateMouseControlOnTab(tabId, shouldStart) {
  const action = shouldStart ? 'startMouseControl' : 'stopMouseControl';

  // Inject the script if starting control; otherwise, send stop message
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js'] // The content script that handles mouse control
  }, () => {
    chrome.tabs.sendMessage(tabId, { action }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log(`Mouse control ${shouldStart ? 'started' : 'stopped'} on tab ${tabId}`);
      }
    });
  });
}

// Listener for switching active tabs (across any window)
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (mouseControlActive) {
    // Stop mouse control on the previous tab if it exists
    if (currentTabId !== null && currentTabId !== activeInfo.tabId) {
      updateMouseControlOnTab(currentTabId, false);
    }

    // Update current tab and window, then start mouse control on the new active tab
    currentTabId = activeInfo.tabId;
    chrome.windows.getCurrent({populate: false}, (window) => {
      currentWindowId = window.id;
    });
    updateMouseControlOnTab(currentTabId, true);
  }
});

// Listener for tab updates (e.g., page reloads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (mouseControlActive && tabId === currentTabId && changeInfo.status === 'complete' && tab.active) {
    updateMouseControlOnTab(tabId, true);
  }
});

// Listener for window changes (e.g., user switches windows)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (mouseControlActive) {
    // If the new window has a valid ID, find its active tab
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
      chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
        if (tabs.length > 0) {
          // Stop mouse control on the previous tab
          if (currentTabId !== null) {
            updateMouseControlOnTab(currentTabId, false);
          }

          // Start mouse control on the new active tab in the focused window
          currentTabId = tabs[0].id;
          currentWindowId = windowId;
          updateMouseControlOnTab(currentTabId, true);
        }
      });
    }
  }
});

// Start or stop mouse control based on messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    mouseControlActive = true;
    // Apply mouse control on the current active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        currentTabId = tabs[0].id;
        currentWindowId = tabs[0].windowId;
        updateMouseControlOnTab(currentTabId, true);
      }
    });
  } else if (request.action === 'stop') {
    mouseControlActive = false;
    // Remove mouse control from the currently active tab
    if (currentTabId !== null) {
      updateMouseControlOnTab(currentTabId, false);
      currentTabId = null;
      currentWindowId = null;
    }
  }
});

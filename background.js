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
      injectMouseControlScripts(tab.id, true); // Start mouse control on current tab
    });

  } else if (request.action === 'stop') {
    mouseControlActive = false;  // Mark control as inactive
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let tab = tabs[0];
      injectMouseControlScripts(tab.id, false); // Stop mouse control on current tab
    });
  }
});

// Function to inject mouse control scripts (start or stop based on flag)
function injectMouseControlScripts(tabId, shouldStart) {
  if (shouldStart) {
    // Inject startMouseControl
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: startMouseControl
    }, () => {
      console.log("startMouseControl injected on tab ID:", tabId);
    });
  } else {
    // Inject stopMouseControl
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: stopMouseControl
    }, () => {
      console.log("stopMouseControl injected on tab ID:", tabId);
    });
  }
}

// Start mouse control function
function startMouseControl() {
  document.body.style.cursor = 'none'; // Hide the default cursor
  const svgPointer = document.createElement('img');
  svgPointer.id = 'custom-pointer';
  svgPointer.style.position = 'absolute';
  svgPointer.style.width = '24px';  // Adjust size
  svgPointer.style.height = '24px';
  
  // Load the SVG file from the extension's directory
  svgPointer.src = chrome.runtime.getURL('icons/cursor.svg'); // Path to your SVG file
  
  // Append to body
  document.body.appendChild(svgPointer);
  
  // Track mouse movement and update SVG position
  document.addEventListener('mousemove', (event) => {
    logMousePosition(event, svgPointer);
  });
}

// Stop mouse control function
function stopMouseControl() {
  document.body.style.cursor = 'auto';  // Restore the cursor
  document.removeEventListener('mousemove', logMousePosition);
}

// Log the mouse position
function logMousePosition(event, svgPointer) {
  // Update the position of the custom SVG pointer
  svgPointer.style.left = `${event.clientX - svgPointer.width / 2}px`;
  svgPointer.style.top = `${event.clientY - svgPointer.height / 2}px`;
  
}

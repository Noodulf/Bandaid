document.getElementById('start').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'start' });
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
});

document.getElementById('controlInput').addEventListener('input', function(event) {
  if (event.target.value === 'c') {  // Check if 'c' is typed
    // Send message to content script to trigger click at the SVG cursor position
    console.log('Triggering click event');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'triggerClick' });
    });
    
    // Clear the input field
    event.target.value = '';
  }
});
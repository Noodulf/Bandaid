document.getElementById('start').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: startMouseControl
      });
    });
  });
  
  document.getElementById('stop').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: stopMouseControl
      });
    });
  });
  
  function startMouseControl() {
    document.body.style.cursor = 'none'; // Hides the cursor (for demonstration)
    document.addEventListener('mousemove', logMousePosition);
  }
  
  function stopMouseControl() {
    document.body.style.cursor = 'auto'; // Restores the cursor
    document.removeEventListener('mousemove', logMousePosition);
  }
  
  function logMousePosition(event) {
    console.log(`Mouse at: ${event.clientX}, ${event.clientY}`);
    // Here, you could send mouse positions back via a WebSocket, for example.
  }
  
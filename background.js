let listenersAdded = false;
if (!listenersAdded) {
  console.log('BGScript running in:', chrome.runtime.getURL(''));
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
      chrome.windows.getCurrent({ populate: false }, (window) => {
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





  // background.js
  let ws; // WebSocket variable
  // let clientId = Math.random().toString(36).substring(2); // Unique client ID

  // Function to establish the WebSocket connection
  function connectWebSocket() {
    ws = new WebSocket('wss://flash-coordinated-harmonica.glitch.me/'); // Replace with your actual WebSocket URL
    // ws = new WebSocket('ws://localhost:3000/'); // Replace with your actual WebSocket URL

    ws.onopen = () => {
      console.log('WebSocket connected');
      // ws.send(JSON.stringify({ type: 'register', clientId: clientId }));
    };

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'sendCoordinates') {
        const { x, y } = message.coordinates;
        console.log('Sending mouse coordinates to socket:', x, y);

        // Send coordinates to the socket server
        // Send coordinates to the socket server
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'mousemove', coordinates:{ x: x, y: y } }));
        }
      }

      if (message.action === 'sendClickCoordinates') {
        const { x, y } = message.coordinates;
        console.log('Sending click coordinates to socket:', x, y);

        // Send click coordinates to the socket server
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'click', coordinates:{ x: x, y: y } }));
        }
      }
    });

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log('Received:', data);
      // if (data.clientId !== clientId) {
        // Handle messages for mouse control actions
        if (data.type === 'mousemove' || data.type === 'click') {
          // Forward mouse actions to content script
          if (currentTabId !== null) {
            chrome.tabs.sendMessage(currentTabId, data, (response) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
              }
            });
          }
        }
      // }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Try reconnecting after a delay
      setTimeout(connectWebSocket, 5000);
    };
  }


  function disconnectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
      console.log('WebSocket disconnected manually');
      ws = null;
    }
  }



  // Establish the WebSocket connection when the extension starts
  // chrome.runtime.onInstalled.addListener(() => {
  //   connectWebSocket();
  //   console.log('Extension installed');
  // });

  // Listen for messages from popup.js to trigger actions
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'connectWebSocket') {
      console.log('Connect req received');
      connectWebSocket();
      // console.log('Connecting WebSocket');
      sendResponse({ status: ws && ws.readyState === WebSocket.OPEN ? 'connected' : 'failed' });
    } else if (message.action === 'disconnectWebSocket') {
      disconnectWebSocket();
      console.log('Disconnecting WebSocket');
      sendResponse({ status: ws === null ? 'disconnected' : 'failed' });
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (message.action === 'createRoom') {
        ws.send(JSON.stringify({ action: 'createRoom', code: message.code }));
      } else if (message.action === 'joinRoom') {
        ws.send(JSON.stringify({ action: 'joinRoom', code: message.code }));
      }
      sendResponse({ status: 'Message sent to server' });
    } else {
      // console.error('WebSocket is not connected');
      // sendResponse({ status: 'WebSocket not connected' });
    }
  });


  function disconnectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
      console.log('WebSocket disconnected manually');
      ws = null;
    }
  }
  listenersAdded = true;
}
// Listen for messages from the popup

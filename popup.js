console.log('PpScript running in:', chrome.runtime.getURL(''));
let listenersAdded = false;
document.addEventListener('DOMContentLoaded', () => {
  if (!listenersAdded) {
    document.getElementById('start').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'start' });
    });

    document.getElementById('stop').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stop' });
    });


    document.getElementById('controlInput').addEventListener('input', function (event) {
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


    // Variables to manage states
    let role = ''; // Track selected role
    // let code = "123456"; // Hold connection code
    let currentVideoIndex = 0; // For cycling through video elements
    let videoElements = []; // Array to store detected video elements

    // Elements in popup
    const senderBtn = document.getElementById('sender-btn');
    const receiverBtn = document.getElementById('receiver-btn');
    const connectScreen = document.getElementById('connect-screen');
    const connectPeer = document.getElementById('connectPeer');
    const codeInput = document.getElementById('code-input');
    const videoSelectionScreen = document.getElementById('video-selection-screen');
    const videoSelectionHeader = document.getElementById('video-selection-header');
    const selectVideoBtn = document.getElementById('select-video-btn');
    const nextVideoBtn = document.getElementById('next-video-btn');
    // const startControlBtn = document.getElementById('start-control-btn');
    // const stopControlBtn = document.getElementById('stop-control-btn');
    const controlButtons = document.getElementById('control-buttons');

    // Step 1: Role Selection
    senderBtn.addEventListener('click', () => {
      role = 'sender';
      showConnectScreen();
    });

    receiverBtn.addEventListener('click', () => {
      role = 'receiver';
      showConnectScreen();
    });

    // Step 2: Connect Screen
    function showConnectScreen() {
      document.getElementById('role-selection').classList.add('hidden');
      connectScreen.classList.remove('hidden');
    }

    // Handle connection logic based on role
    connectPeer.addEventListener('click', () => {
      code = codeInput.value;
      if (role === 'sender') {
        connectAsSender(code);
      } else if (role === 'receiver') {
        connectAsReceiver(code);
      }
    });

    // function connectAsSender(code) {
    //   console.log('Connecting as Sender with code:', code);
    //   // WebSocket or connection logic for sender
    //   showVideoSelectionScreen();
    // }

    function connectAsSender(code) {
      console.log('Connecting as Sender with code:', code);
      chrome.runtime.sendMessage({ action: 'joinRoom', code: code }, (response) => {
        console.log(response.status);
        showVideoSelectionScreen();
      });
    }

    // function connectAsReceiver() {
    //   console.log('Waiting for Sender to connect');
    //   // WebSocket server setup logic for receiver
    //   showControlScreen();
    // }

    function connectAsReceiver(code) {
      console.log('Waiting for Sender to connect');
      chrome.runtime.sendMessage({ action: 'createRoom', code: code }, (response) => {
        console.log(response.status);
        showControlScreen();
      });
    }

    // Transition to Video Selection or Control Screen
    function showVideoSelectionScreen() {
      findAndHighlightVideos();
      connectScreen.classList.add('hidden');
      videoSelectionScreen.classList.remove('hidden');
      videoSelectionHeader.textContent = 'Select Video Element to Share';

      // Video selection buttons visible only to sender
      selectVideoBtn.style.display = 'inline-block';
      nextVideoBtn.style.display = 'inline-block';
      controlButtons.classList.add('hidden');

      // Continuously check for video elements
      // findVideoElements();
    }

    function showControlScreen() {
      connectScreen.classList.add('hidden');
      videoSelectionScreen.classList.remove('hidden');
      videoSelectionHeader.textContent = 'Control the Device';

      // Control buttons visible only to receiver
      selectVideoBtn.style.display = 'none';
      nextVideoBtn.style.display = 'none';
      controlButtons.classList.remove('hidden');
    }

    // Step 3: Detect Video Elements
    function findAndHighlightVideos() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'findVideos', selectedIndex: currentVideoIndex },
          (response) => {
            if (response && response.count > 0) {
              console.log(`Found ${response.count} video elements.`);
              selectVideoBtn.textContent = `Selected Video ${currentVideoIndex + 1}`;
            } else {
              alert('No video elements found.');
            }
          }
        );
      });
    }

    // Cycle through video elements
    nextVideoBtn.addEventListener('click', () => {
      currentVideoIndex++;
      findAndHighlightVideos();
    });


    // // Start/Stop control buttons for receiver
    // startControlBtn.addEventListener('click', () => {
    //   console.log('Control started');
    //   // Start control logic
    // });

    // stopControlBtn.addEventListener('click', () => {
    //   console.log('Control stopped');
    //   // Stop control logic
    // });




    const connectButn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const statusEl = document.getElementById('status');

    // Update status helper
    function updateStatus(text) {
      statusEl.textContent = `Status: ${text}`;
    }

    // Handle connect button click
    connectButn.addEventListener('click', () => {
      console.log("connect button clicked")
      chrome.runtime.sendMessage({ action: 'connectWebSocket' }, (response) => {
        if (response.status === 'connected') {
          updateStatus('Connected');
          connectButn.disabled = true;
          disconnectBtn.disabled = false;
        } else if (response.status === 'failed') {
          updateStatus('Failed to Connect');
        }
      });
    });

    // Handle disconnect button click
    disconnectBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'disconnectWebSocket' }, (response) => {
        if (response.status === 'disconnected') {
          updateStatus('Disconnected');
          connectButn.disabled = false;
          disconnectBtn.disabled = true;
        } else if (response.status === 'failed') {
          updateStatus('Failed to Disconnect');
        }
      });
    });
    listenersAdded = true;
  }
})
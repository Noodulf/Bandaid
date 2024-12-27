// Initialize mouse control
// let mouseControlActive = false;
let listenersAdded = false;
if (!listenersAdded) {
  console.log('CntScript running in:', chrome.runtime.getURL(''));
  let svgPointer = null;
  let lastHoveredElement = null
  let lastElementRect = null;

  // Start mouse control function
  function startMouseControl() {
    console.log('Mouse control started');
    // mouseControlActive = true;

    if (svgPointer) {
      svgPointer.remove(); // Remove if it already exists
    }

    // Create the SVG pointer
    svgPointer = document.createElement('img');
    svgPointer.id = 'bandaid-pointer';
    svgPointer.style.position = 'fixed';
    svgPointer.style.width = '28px';
    svgPointer.style.height = '28px';
    svgPointer.style.pointerEvents = 'none'; // Ensure it doesn’t block mouse events
    svgPointer.style.zIndex = '2147483647';
    svgPointer.style.transform = 'translate(-25%, -25%)'; // Centered position adjustment (corrected)
    svgPointer.src = chrome.runtime.getURL('icons/cursor.svg'); // Path to your SVG file

    document.body.appendChild(svgPointer);

    // Event listeners
    // document.addEventListener('mousemove', updateSVGPosition);
    document.addEventListener('mousemove', handleMovement);

    // document.addEventListener('mousemove', handleHoverEvents);
    document.addEventListener('click', handleClickEvent);
  }

  function handleClickEvent(event) {
    // Get the click coordinates
    const clickX = event.clientX;
    const clickY = event.clientY;

    // Send the coordinates to the background script
    chrome.runtime.sendMessage({
      action: 'sendClickCoordinates',
      coordinates: { x: clickX, y: clickY }
    });
  }
  function handleMovement(event) {
    // Get the click coordinates
    const clickX = event.clientX;
    const clickY = event.clientY;

    // Send the coordinates to the background script
    chrome.runtime.sendMessage({
      action: 'sendCoordinates',
      coordinates: { x: clickX, y: clickY }
    });
  }






  // // Handle hover events on elements under the SVG cursor
  // function handleHoverEvents(event) {
  //   // Ensure we align with the cursor vertex (adjusted with translate)
  //   const rect = svgPointer.getBoundingClientRect();
  //   const x = rect.left + rect.width * 0.25; // Adjust to get the vertex of the pointer
  //   const y = rect.top + rect.height * 0.25;

  //   const elementUnderCursor = document.elementFromPoint(x, y);
  //   if (elementUnderCursor) {
  //     simulateFullHover(elementUnderCursor);

  //     // Stop hover effect on mouse leave
  //     elementUnderCursor.addEventListener('mouseleave', () => stopFullHover(elementUnderCursor), { once: true });
  //   }
  // }

  // // Function to simulate hover events
  // function simulateFullHover(element) {
  //   const rect = element.getBoundingClientRect();
  //   element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  //   element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  //   element.dispatchEvent(new MouseEvent('mousemove', {
  //     bubbles: true,
  //     clientX: rect.left + 1,
  //     clientY: rect.top + 1
  //   }));
  // }

  // // Function to stop hover effect
  // function stopFullHover(element) {
  //   element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  //   element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
  // }








  chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    console.log('Received from background:', data);

    // Update the SVG pointer position when mouseMove or click is received
    if (data.type === 'mousemove') {
      updateSVGPosition(data.coordinates);  // Pass the coordinates to update the position
    }
    else if (data.type === 'click') {
      forwardClickEvent(data.coordinates);
    }
  });
  // Update SVG position based on mouse coordinates
  function updateSVGPosition(coordinates) {
    const { x, y } = coordinates;
    if (svgPointer) {
      const cursorX =  x;
      const cursorY = y;

      // Applying the offset to position the SVG pointer
      svgPointer.style.left = `${cursorX + 40}px`; // Offset to the right
      svgPointer.style.top = `${cursorY + 40}px`;  // Offset downwards

      console.log(`Cursor Position to test: (${cursorX}, ${cursorY})`);
      // Get the element under the SVG pointer
      const elementUnderCursor = document.elementFromPoint(cursorX + 40, cursorY + 40);
      // const elementRect = elementUnderCursor ? elementUnderCursor.getBoundingClientRect() : null;

      // Only trigger hover events if hovering over a new element
      if (elementUnderCursor !== lastHoveredElement) {
        // Trigger `mouseleave` and `mouseout` events on the last hovered element, if any
        if (lastHoveredElement) {
          lastHoveredElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
          lastHoveredElement.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        }

        // Trigger `mouseenter`, `mouseover`, and `mousemove` on the new element
        if (elementUnderCursor) {
          elementUnderCursor.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          elementUnderCursor.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          // elementUnderCursor.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
          elementUnderCursor.focus();

          // Focus on input fields if applicable
          if (['INPUT', 'TEXTAREA', 'A'].includes(elementUnderCursor.tagName)) {
            elementUnderCursor.focus();
          }
        }

        // Update last hovered element to the new one
        lastHoveredElement = elementUnderCursor;
      }
      // else {
      //   // Only `mousemove` event for the same element
      //   // elementUnderCursor.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      // }
    }
  }

  // Function to simulate a click at the SVG cursor position
  function forwardClickEvent(coordinates) {
    if (lastHoveredElement) {
      const rect = svgPointer.getBoundingClientRect();
      // const x = rect.left + rect.width * 0.25;
      const x = coordinates.x;
      // const y = rect.top + rect.height * 0.25;
      const y = coordinates.y;

      // Simulate mousedown, mouseup, and click events on the hovered element
      lastHoveredElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      lastHoveredElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      lastHoveredElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Focus on input fields if applicable
      if (lastHoveredElement.tagName === 'INPUT' || lastHoveredElement.tagName === 'TEXTAREA') {
        lastHoveredElement.focus();
      }
    }
  }

  // Stop mouse control function
  function stopMouseControl() {
    if (svgPointer) {
      svgPointer.remove();
      svgPointer = null;
    }
    // mouseControlActive = false;
    document.removeEventListener('mousemove', updateSVGPosition);
    document.removeEventListener('mousemove', handleMovement);
    // document.removeEventListener('mousemove', handleHoverEvents);
  }

  // Listen for messages from background.js or popup.js
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'triggerClick') {
      forwardClickEvent();
    } else if (request.action === 'startMouseControl') {
      startMouseControl();
    } else if (request.action === 'stopMouseControl') {
      stopMouseControl();
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'findVideos') {
      const videoElements = Array.from(document.getElementsByTagName('video'));
      console.log('Video elements:', videoElements);
      if (videoElements.length > 0) {
        videoElements.forEach((vid, index) => {
          vid.style.border = ''; // Reset all borders
          if (index === message.selectedIndex) {
            vid.style.border = '2px solid red'; // Highlight selected video
          }
        });

        // Send video count back to popup
        sendResponse({ count: videoElements.length });
      } else {
        sendResponse({ count: 0 });
      }
    }
  });
  listenersAdded = true;
}


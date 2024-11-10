// Initialize mouse control
let mouseControlActive = false;
let svgPointer = null;

// Start mouse control function
function startMouseControl() {
  console.log('Mouse control started');
  mouseControlActive = true;

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
  document.addEventListener('mousemove', updateSVGPosition);
  document.addEventListener('mousemove', handleHoverEvents);
}

// Handle hover events on elements under the SVG cursor
function handleHoverEvents(event) {
  // Ensure we align with the cursor vertex (adjusted with translate)
  const rect = svgPointer.getBoundingClientRect();
  const x = rect.left + rect.width * 0.25; // Adjust to get the vertex of the pointer
  const y = rect.top + rect.height * 0.25;

  const elementUnderCursor = document.elementFromPoint(x, y);
  if (elementUnderCursor) {
    simulateFullHover(elementUnderCursor);

    // Stop hover effect on mouse leave
    elementUnderCursor.addEventListener('mouseleave', () => stopFullHover(elementUnderCursor), { once: true });
  }
}

// Function to simulate hover events
function simulateFullHover(element) {
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('mousemove', { 
    bubbles: true, 
    clientX: element.getBoundingClientRect().left + 1 
  }));
}

// Function to stop hover effect
function stopFullHover(element) {
  element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
}

// Update SVG position based on mouse coordinates
function updateSVGPosition(event) {
  if (svgPointer) {
    svgPointer.style.left = `${event.clientX}px`;
    svgPointer.style.top = `${event.clientY}px`;
  }
}

// Function to simulate a click at the SVG cursor position
function forwardClickEvent() {
  if (svgPointer) {
    const rect = svgPointer.getBoundingClientRect();
    const x = rect.left + rect.width * 0.25; // Adjust to get the vertex of the pointer
    const y = rect.top + rect.height * 0.25;

    const elementUnderCursor = document.elementFromPoint(x, y);
    if (elementUnderCursor) {
      const simulatedClick = new MouseEvent('click', { 
        bubbles: true, 
        clientX: x, 
        clientY: y 
      });
      elementUnderCursor.dispatchEvent(simulatedClick);
    }
  }
}

// Stop mouse control function
function stopMouseControl() {
  if (svgPointer) {
    svgPointer.remove();
    svgPointer = null;
  }
  mouseControlActive = false;
  document.removeEventListener('mousemove', updateSVGPosition);
  document.removeEventListener('mousemove', handleHoverEvents);
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

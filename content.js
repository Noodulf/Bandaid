// Start mouse control function
function startMouseControl() {
  document.body.style.cursor = 'none';  // Hide the default cursor
  console.log('Mouse control started');
  
  let existingPointer = document.getElementById('bandaid-pointer');
  if (existingPointer) {
    existingPointer.remove();  // Remove if already there
  }

  const svgPointer = document.createElement('img');
  svgPointer.id = 'bandaid-pointer';
  svgPointer.style.position = 'absolute';
  svgPointer.style.width = '24px';  // Adjust size
  svgPointer.style.height = '24px';
  svgPointer.style.pointerEvents = 'none';  // Ensure it doesn't block mouse events
  svgPointer.style.zIndex = '9999';  // Ensure it's on top of everything
  
  // Load the SVG file from the extension's directory
  svgPointer.src = chrome.runtime.getURL('icons/cursor.svg');  // Path to your SVG file
  svgPointer.style.transform = 'translate(-50%, -50%)';  // Center the pointer on the cursor
  svgPointer.style.transition = 'transform 0.1s ease-out';  // Smooth transition

  // Append the SVG to the body
  document.body.appendChild(svgPointer);

  // Track mouse movement and update SVG position
  document.addEventListener('mousemove', updateSVGPosition);
}

// Stop mouse control function
function stopMouseControl() {
  document.body.style.cursor = 'auto';  // Restore the cursor
  const svgPointer = document.getElementById('bandaid-pointer');
  if (svgPointer) {
    svgPointer.remove();  // Remove the custom pointer from the DOM
  }
  document.removeEventListener('mousemove', updateSVGPosition);  // Remove the mousemove listener
}

// Update SVG position based on mouse coordinates
function updateSVGPosition(event) {
  const svgPointer = document.getElementById('bandaid-pointer');
  if (svgPointer) {
    svgPointer.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;  // Move the pointer
  }
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'startMouseControl') {
    startMouseControl();
  } else if (request.action === 'stopMouseControl') {
    stopMouseControl();
  }
});

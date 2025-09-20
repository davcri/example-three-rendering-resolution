/**
 * Copy paste this file in the browser console to
 * show the window and canvas resolutions.
 */

// Create and style the widget

const FONT_SIZE = 32

const widget = document.createElement('div');
widget.style.position = 'fixed';
widget.style.top = '50px';
widget.style.left = '50px';
widget.style.background = 'rgba(8, 8, 8, 0.95)';
widget.style.color = '#fff';
widget.style.font = FONT_SIZE / window.devicePixelRatio + 'px monospace';
widget.style.padding = '12px 18px';
widget.style.borderRadius = '8px';
widget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
widget.style.zIndex = 99999;
widget.innerHTML = `
  <div><b>Window DPR:</b> <span id="dpr"></span></div>
  <div><b>Window:</b> <span id="win"></span></div>
  <div><b>Canvas:</b> <span id="can"></span></div>
`;
document.body.appendChild(widget);

// Find the first canvas, or create one if not present
let canvas = document.querySelector('canvas');
if (!canvas) {
  throw ("No canvas found")
}

// Update function
function updateWidget() {
  document.getElementById('dpr').textContent = window.devicePixelRatio.toFixed(2);
  document.getElementById('win').textContent = `${window.innerWidth} x ${window.innerHeight} = (${(window.innerWidth * window.innerHeight * 10e-6).toFixed(2)} MegaPixels)`;
  document.getElementById('can').textContent = `${canvas.width} x ${canvas.height} = (${(canvas.width * canvas.height * 10e-6).toFixed(2)} MegaPixels)`;
}
updateWidget();

// Listen for window resize and DPR changes
window.addEventListener('resize', () => {
  // If canvas is full window, update its size
  if (canvas.style.width === '100vw' && canvas.style.height === '100vh') {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
  }
  updateWidget();
});

// Listen for DPR changes using matchMedia
let removeDPRListener;
function handleDPRChange() {
  updateWidget();
  if (removeDPRListener) removeDPRListener();
  const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  media.addEventListener('change', handleDPRChange);
  widget.style.font = FONT_SIZE / window.devicePixelRatio + 'px monospace';
  removeDPRListener = () => media.removeEventListener('change', handleDPRChange);
}
handleDPRChange();
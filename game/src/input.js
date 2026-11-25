// Keyboard and mouse, normalized into the 1280x720 logical stage.
export function createInput(canvas, handlers) {
  const held = new Set();
  const AXIS_KEYS = {
    KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1,
  };
  let mouse = { x: 640, y: 360, inside: false };

  function toStage(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * 1280,
      y: ((ev.clientY - rect.top) / rect.height) * 720,
    };
  }

  function onKeyDown(ev) {
    const code = ev.code;
    if (['Space', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) ev.preventDefault();
    if (ev.repeat) return;
    held.add(code);
    handlers.firstGesture && handlers.firstGesture();
    if (code === 'Enter' || code === 'NumpadEnter') handlers.enter && handlers.enter();
    else if (code === 'Tab') handlers.tab && handlers.tab();
    else if (code === 'KeyP') handlers.pause && handlers.pause();
    else if (code === 'KeyM') handlers.mute && handlers.mute();
    else if (code === 'KeyE') handlers.interact && handlers.interact();
    else if (code === 'Space') handlers.space && handlers.space();
    else if (code === 'Escape') handlers.escape && handlers.escape();
    else if (/^Digit[1-8]$/.test(code)) handlers.digit && handlers.digit(Number(code.slice(5)));
    else if (/^Numpad[1-8]$/.test(code)) handlers.digit && handlers.digit(Number(code.slice(6)));
  }

  function onKeyUp(ev) {
    held.delete(ev.code);
  }

  function onPointerDown(ev) {
    const p = toStage(ev);
    handlers.firstGesture && handlers.firstGesture();
    handlers.click && handlers.click(p.x, p.y, ev);
  }

  function onMove(ev) {
    const p = toStage(ev);
    mouse = { x: p.x, y: p.y, inside: true };
  }

  function axis() {
    let a = 0;
    for (const [code, dir] of Object.entries(AXIS_KEYS)) {
      if (held.has(code)) a += dir;
    }
    return Math.max(-1, Math.min(1, a));
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
  });
  return {
    axis,
    held,
    get mouse() {
      return mouse;
    },
  };
}

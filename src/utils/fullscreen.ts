// utils/fullscreen.ts
export async function enterFullscreenNow() {
  const el: any = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  } catch {
    // ignore; user can try again
  }
}

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  runAt: 'document_end',
  world: 'MAIN',
  main() {
    console.log('youtube render');
    const observer = new MutationObserver((mutations) => {
      const flag = mutations.some(mutation => (mutation.addedNodes.length > 0 && mutation.addedNodes[0] instanceof Element && Array.from(mutation.addedNodes).some(node => node instanceof Element && node.querySelector('ytmusic-you-there-renderer.ytmusic-popup-container'))));
      if (flag) {
        const dialogContainer = document.querySelector('ytmusic-you-there-renderer.ytmusic-popup-container');
        if (dialogContainer) {
          console.log('弹出弹窗!');
          const continueButton = dialogContainer.querySelector('yt-button-renderer.ytmusic-you-there-renderer');
          (window as any).continueButton = continueButton;
          const rect = continueButton?.getBoundingClientRect();
          if (rect) {
            const buttonCenterX = rect.left + Math.floor(rect.width / 2);
            const buttonCenterY = rect.top + Math.floor(rect.height / 2);
            document.documentElement.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              clientX: buttonCenterX,
              clientY: buttonCenterY,
            }));
            (continueButton as HTMLButtonElement)?.click();
            console.log('点击按钮!');
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
});

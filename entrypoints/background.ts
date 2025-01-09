export default defineBackground(() => {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-search') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id!, { action: "open_search" });
        }
      });
    }
  });
});

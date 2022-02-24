chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const sources = message.sources;
    const tab = sender.tab;
    chrome.desktopCapture.chooseDesktopMedia(sources, tab, (streamId) => {
        if (!streamId) {
            sendResponse({
                type: 'error',
                message: 'streamId 获取失败'
            });
        } else {
            sendResponse({
                type: 'success',
                streamId: streamId
            });
        }
    });
    return true;
});
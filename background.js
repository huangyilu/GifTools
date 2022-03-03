const EXTENSION_ID = 'cjhnnbgfmcbmfjhliachhlmppigepoeg';

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

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        id: 'recording',
        title: '前往录制屏幕',
        type: 'normal',
        contexts: ['all'],
        onclick: () => window.open(`chrome-extension://${EXTENSION_ID}/index.html`)
    });
});
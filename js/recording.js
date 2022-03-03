// 录制屏幕的逻辑处理
const EXTENSION_ID = 'cjhnnbgfmcbmfjhliachhlmppigepoeg';

// 找到配置页的tab
let toolsTab = null
chrome.tabs.query({ title: 'Gif Tools' }, tabs => {
    toolsTab = tabs[0]
});

const video = document.getElementById('screen-view');
const getScreen = document.getElementById('get-screen');
const gifView = document.getElementById('gif-view');
const loadingView = document.getElementById('loading')

const request = { sources: ['window', 'screen', 'tab', 'audio'] };
let stream;
let mediaRecorder;
let recordedBlobs = [];

const videoToGif = async () => {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    const name = 'output.webm'

    const videoFile = new File(recordedBlobs, name);

    await ffmpeg.load();
    ffmpeg.FS('writeFile', name, await fetchFile(videoFile));

    const compressionNum = document.getElementById('compressionNum')

    await ffmpeg.run('-i', name, '-r', compressionNum.value || 10, 'output.gif');
    const data = ffmpeg.FS('readFile', 'output.gif');

    loadingView.style.display = 'none'
    gifView.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }))
}

const setVideo = () => {
    video.src = URL.createObjectURL(new Blob(recordedBlobs, { type: 'video/mp4' }));
    videoToGif()
}

const recorder = () => {
    const options = {
        mimeType: 'video/webm'
    };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedBlobs.push(event.data);
            setVideo()
            // 录制完 跳到 选项页
            if (toolsTab) {
                loadingView.style.display = 'block'
                chrome.tabs.highlight({ windowId: toolsTab.windowId, tabs: toolsTab.index });
                chrome.windows.update(toolsTab.windowId, { focused: true });
            }
        }
    };
    mediaRecorder.start();
}

const StartRecording = () => {
    // 清除
    if (video.src !== '') video.src = ''
    if (gifView.src !== '') gifView.src = ''
    chrome.runtime.sendMessage(EXTENSION_ID, request, response => {
        if (response && response.type === 'success') {
            // 从 mediaDevices 获取到对应录屏数据
            navigator.mediaDevices.getUserMedia({
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: response.streamId,
                    }
                }
            }).then(returnedStream => {
                // 视频流
                stream = returnedStream;
                // 录制video的内容
                recorder()
            }).catch(err => {
                console.error('Could not get stream: ', err);
            });
        } else {
            console.error('Could not get stream');
        }
    });
}

getScreen && getScreen.addEventListener('click', StartRecording);

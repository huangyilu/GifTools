// 录制屏幕的逻辑处理
const EXTENSION_ID = 'ccmmbojglpomnaapkgmlhngjmjmdmoib';

const video = document.getElementById('screen-view');
const getScreen = document.getElementById('get-screen');
const gifView = document.getElementById('gif-view');

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
        }
    };
    mediaRecorder.start();
}

getScreen.addEventListener('click', event => {
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
});

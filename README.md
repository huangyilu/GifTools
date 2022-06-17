# Gif Tools

> 一个可录制屏幕、可上传视频并转为gif的工具。

### 一、如何录制
##### 1、Desktop Capture
###### 捕获屏幕
通过chrome extensions的Desktop Capture API，可以捕获整个屏幕、单个窗口或者某个标签页的内容：
```
chrome.desktopCapture.chooseDesktopMedia(
  sources,
  targetTab,
  callback,
)
// 指定获取窗口、屏幕、标签页，以及是否分享音频
const sources = ['window', 'screen', 'tab', 'audio']
// 指定由哪个标签页来捕获，关系到如何获取到录制的媒体流。
const targetTab = ? 
// 回调返回一个streamId，通过这个ID可以获取到录制的媒体流
const callback = (streamId) => {
    if (!streamId) {
        console.error('streamId 为空，则获取失败。')
    } else {
        console.log(' streamId： ', streamId)
    }
}
```

那么问题是，要如何指定标签页？
###### 指定标签页
自己建一个，我们需要一个页面去承载录制按钮、预览等功能：
```
// index.html
<div class="box">
    <div class="title">录制屏幕：</div>
    <button id="get-screen">开始录制</button>
</div>
```

```
// recording.js
const getScreen = document.getElementById('get-screen');
const request = { sources: ['window', 'screen', 'tab', 'audio'] };

// 当点击开始录制，向background发送一条消息
getScreen.addEventListener('click', event => {
    chrome.runtime.sendMessage(EXTENSION_ID, request, response => {
        if (response && response.type === 'success') {
            console.log(' get streamId： ', response.streamId)
        } else {
            console.error('Could not get stream');
        }
    });
});

// background.js
// 在 chrome background 进行监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const sources = message.sources;
    const tab = sender.tab; // 这里就是发送消息的tab
    chrome.desktopCapture.chooseDesktopMedia(sources, tab, (streamId) => {
        if (!streamId) {
            sendResponse({
                type: 'error',
                message: '获取stream ID失败'
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
```

###### 获取媒体流
当拿到streamId之后，可以通过getUserMedia() API拿到媒体流：
```
navigator.mediaDevices.getUserMedia({
    video: {
        mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: response.streamId,
        }
    }
}).then(stream => {
    console.log(' get stream： ', stream)
}).catch(err => {
    console.error('Could not get stream: ', err);
});
```

示例图：


##### 2、MediaRecorder
拿到媒体流后，再通过MediaRecorder录制，得到录制后的视频：
```
const recordedBlobs = []
const options = {
    mimeType: 'video/webm'
};
mediaRecorder = new MediaRecorder(stream, options);
mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
        // 拿到 Blob
        recordedBlobs.push(event.data);
    }
};
mediaRecorder.start();
```

#### 二、上传视频
另一种方式是，直接上传视频：
```
// index.html
<div class="box" >
    <div class="title">上传视频：</div>
    <input type="file" id="uploader" />
</div>
```

```
// upload.js
const transcode = async ({ target: { files } }) => {
    console.log(' get files： ', files)
}
document.getElementById('uploader').addEventListener('change', transcode);
```

#### 三、如何转成 GIF
当拿到了录制好的，或者是上传来的视频文件，将通过FFmpeg把视频文件转成GIF。
这里用到的是ffmpeg.wasm，这是FFmpeg的Webassembly版本。
> WebAssembly是一种新的编码方式，当你使用C/C++编写了代码后，可以使用诸如Emscripten的工具把它编译为.wasm文件，便可以在Web上运行。

```
const { createFFmpeg, fetchFile } = FFmpeg;
// 创建实例
const ffmpeg = createFFmpeg({ log: true });
// 将上面获得的Blob文件，转成File
const name = 'output.webm'
const videoFile = new File(recordedBlobs, name);
// 载入
await ffmpeg.load();
// 将File写入 FFmpeg 文件系统
ffmpeg.FS('writeFile', name, await fetchFile(videoFile));
// 执行 命令行工具
// 将 webm 转为 gif： ('-i', 'output.webm', 'output.gif')
// 设置分辨率： ('-r', '10')
await ffmpeg.run('-i', name, '-r', '10', 'output.gif');
// 从FFmpeg 文件系统中读取 output.gif
const data = ffmpeg.FS('readFile', 'output.gif');
console.log(' get gif： ', data.buffer)
```

#### 四、其他插件相关的问题
当遇到以下几种情况，需要添加对应的Content-Security-Policy

##### 1、当用到wasm模块时
- 报错：
CompileError: WebAssembly.compile(): Wasm code generation disallowed by embedder.
- 在manifest.json中添加【script-src 'self' 'unsafe-eval'】
```
"content_security_policy": "script-src 'self' 'unsafe-eval';"
```

##### 2、当需要加载blob时
- 报错提示如果没有script-src-elem指令，会用script-src，如果也不存在，则用default-src：
Refused to load the script 'blob it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-eval'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback
- 在manifest.json中添加【script-src-elem 'self' * blob:】  以及 【connect-src * blob:】
```
"content_security_policy": "script-src 'self' 'unsafe-eval';script-src-elem 'self' * blob:;connect-src * blob:"
```

#### 五、使用：
https://github.com/huangyilu/GifTools
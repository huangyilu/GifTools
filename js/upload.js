// 上传文件的逻辑处理
const transcode = async ({ target: { files } }) => {
    const gif = document.getElementById('gif-view')
    const video = document.getElementById('screen-view');
    if (gif.src !== '') gif.src = ''
    if (video.src !== '') video.src = ''
    
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({
        log: true
    });
    const { name } = files[0];
    video.src = URL.createObjectURL(files[0]);

    await ffmpeg.load();
    ffmpeg.FS('writeFile', name, await fetchFile(files[0]));

    // 压缩指数
    const compressionNum = document.getElementById('compressionNum')

    await ffmpeg.run('-i', name, '-r', compressionNum.value || 10, 'output.gif');
    const data = ffmpeg.FS('readFile', 'output.gif');

    gif.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }))
}
document.getElementById('uploader').addEventListener('change', transcode);
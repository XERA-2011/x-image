
(function () {
    let disclaimer = GM_getValue("disclaimer", true);

    const icon = "https://picasso-static.xiaohongshu.com/fe-platform/f43dc4a8baf03678996c62d8db6ebc01a82256ff.png";

    const abnormal = () => {
        alert("下载无水印作品文件失败");
    };

    const generateVideoUrl = note => {
        try {
            return [`https://sns-video-bd.xhscdn.com/${note.video.consumer.originVideoKey}`];
        } catch (error) {
            console.error("Error generating video URL:", error);
            return [];
        }
    };

    const generateImageUrl = note => {
        let images = note.imageList;
        const regex = /http:\/\/sns-webpic-qc\.xhscdn.com\/\d+\/[0-9a-z]+\/(\S+)!/;
        let urls = [];
        try {
            images.forEach((item) => {
                let match = item.urlDefault.match(regex);
                if (match && match[1]) {
                    urls.push(`https://ci.xiaohongshu.com/${match[1]}?imageView2/2/w/format/png`);
                }
            })
            return urls
        } catch (error) {
            console.error("Error generating image URLs:", error);
            return [];
        }
    };

    const download = async (urls, type_) => {
        const name = extractName();
        console.info(`基础文件名称 ${name}`);
        if (type_ === "video") {
            await downloadVideo(urls[0], name);
        } else {
            await downloadImage(urls, name);
        }
    };

    const exploreDeal = async note => {
        try {
            let links;
            if (note.type === "normal") {
                links = generateImageUrl(note);
            } else {
                links = generateVideoUrl(note);
            }
            if (links.length > 0) {
                console.info("无水印文件下载链接", links);
                await download(links, note.type);
            } else {
                abnormal()
            }
        } catch (error) {
            console.error("Error in deal function:", error);
            abnormal();
        }
    };

    const extractNoteInfo = () => {
        const regex = /\/explore\/([^?]+)/;
        const match = window.location.href.match(regex);
        if (match) {
            // let note = Object.values(unsafeWindow.__INITIAL_STATE__.note.noteDetailMap);
            return unsafeWindow.__INITIAL_STATE__.note.noteDetailMap[match[1]]
        } else {
            console.error("使用当前链接提取作品 ID 失败", window.location.href,);
        }
    };

    const extractDownloadLinks = async () => {
        let note = extractNoteInfo();
        if (note.note) {
            await exploreDeal(note.note);
        } else {
            abnormal();
        }
    };

    const downloadFile = async (link, filename) => {
        try {
            // 使用 fetch 获取文件数据
            let response = await fetch(link);

            // 检查响应状态码
            if (!response.ok) {
                console.error(`请求失败，状态码: ${response.status}`, response.status);
                return false
            }

            let blob = await response.blob();

            // 创建 Blob 对象的 URL
            let blobUrl = window.URL.createObjectURL(blob);

            // 创建一个临时链接元素
            let tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.download = filename;

            // 模拟点击链接
            tempLink.click();

            // 清理临时链接元素
            window.URL.revokeObjectURL(blobUrl);

            return true
        } catch (error) {
            console.error(`下载失败 (${filename}):`, error);
            return false
        }
    }

    const extractName = () => {
        let name = document.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
        let match = window.location.href.match(/\/([^\/]+)$/);
        let id = match ? match[1] : null;
        return name === "" ? id : name
    };

    const downloadVideo = async (url, name) => {
        if (!await downloadFile(url, `${name}.mp4`)) {
            abnormal();
        }
    };

    const downloadImage = async (urls, name) => {
        let result = [];
        for (const [index, url] of urls.entries()) {
            result.push(await downloadFile(url, `${name}_${index + 1}.png`));
        }
        if (!result.every(item => item === true)) {
            abnormal();
        }
    };

    const createContainer = () => {
        let container = document.createElement('div');
        container.id = 'xhsFunctionContainer';

        let imgTextContainer = document.createElement('div');
        imgTextContainer.id = 'xhsImgTextContainer';

        let img = new Image(48, 48); // 确保 icon 变量已定义
        img.src = icon;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';

        let textDiv = document.createElement('div');
        textDiv.id = 'xhsImgTextContainer__text'
        textDiv.textContent = 'XHS-Downloader';

        imgTextContainer.appendChild(img);
        imgTextContainer.appendChild(textDiv);

        container.appendChild(imgTextContainer);

        document.body.appendChild(container);
        return container;
    };

    const createButton = (id, text, onClick, ...args) => {
        let button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.addEventListener('click', () => onClick(...args));
        return button;
    };

    const exclusionButton = ["xhsImgTextContainer", "About"];

    const updateContainer = buttons => {
        let container = document.getElementById('xhsFunctionContainer');
        if (!container) {
            container = createContainer();
        }

        // 移除除了 imgTextContainer 以外的所有子元素
        Array.from(container.children).forEach(child => {
            if (!exclusionButton.includes(child.id)) {
                child.remove();
            }
        });
        // 添加有效按钮
        buttons.forEach(button => {
            container.appendChild(button);
        });
    };

    const buttons = [
        createButton("Download", "下载无水印作品文件", extractDownloadLinks),
        createButton("tips", "请选择笔记", ()=>{}),
    ];

    const run = url => {
        setTimeout(function () {
            if (url.includes("https://www.xiaohongshu.com/explore/")) {
                updateContainer(buttons.slice(0, 1));
            } else {
                updateContainer(buttons.slice(1, 2));
            }
        }, 500)
    }

    let currentUrl = window.location.href;

    updateContainer(buttons.slice(7));

    // 初始化容器
    run(currentUrl)

    // 设置 MutationObserver 来监听 URL 变化
    let observer
    if (disclaimer) {
        observer = new MutationObserver(function () {
            if (currentUrl !== window.location.href) {
                currentUrl = window.location.href;
                run(currentUrl);
            }
        });
        const config = { childList: true, subtree: true };
        observer.observe(document.body, config);
    }

    const buttonStyle = `
    #xhsFunctionContainer {
        position: fixed;
        bottom: 15%;
        right: 0;
        background-color: #fff;
        color: #2f3542;
        padding: 5px 10px;
        border-radius: 32px 0 0 32px;
        box-shadow: 0 3.2px 12px #00000014, 0 5px 24px #0000000a;
        transition: width 0.25s ease-in-out, border-radius 0.25s ease-in-out, height 0.25s ease-in-out;
        overflow: hidden;
        white-space: nowrap;
        width: 65px; /* 初始宽度 */
        height: 60px;
        text-align: center;
        font-size: 16px;
        display: flex;
        flex-direction: column-reverse;
        z-index: 99999;
    }

    #xhsFunctionContainer:hover {
        padding: 10px 10px 5px 10px;
        width: 210px; /* hover时的宽度 */
        height: auto;
    }

    #xhsFunctionContainer button {
        cursor: pointer;
        height: 48px;
        color: #ff4757;
        font-size: 14px;
        font-weight: 600;
        border-radius: 32px;
        margin-bottom: 14px;
        border: 3px #ff4757 solid;
    }

    #xhsFunctionContainer button:active {
        background-color: #ff4757; /* 点击时的背景颜色 */
    }

    #xhsImgTextContainer {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    #xhsImgTextContainer__text {
        font-size: 14px;
        font-weight: 600;
    }
    `;

    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    head.appendChild(style);

    style.type = 'text/css';
    style.appendChild(document.createTextNode(buttonStyle));
})();



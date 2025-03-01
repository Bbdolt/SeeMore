// // background.js
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "show_hidden_elements") {
//         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//             if (tabs.length > 0) {
//                 // 注入所有 frame（包括 iframe）
//                 chrome.scripting.executeScript({
//                     target: { 
//                         tabId: tabs[0].id,
//                         allFrames: true  // 关键修改：处理所有 iframe
//                     },
//                     func: showHiddenElements
//                 });
//             }
//         });
//     }
// });

// function showHiddenElements() {
//     // 简化的隐藏元素处理逻辑
//     const elements = document.querySelectorAll('*');
//     elements.forEach(el => {
//         const style = window.getComputedStyle(el);
//         const isHidden = style.display === "none" || el.hidden;
        
//         if (isHidden) {
//             // 判断是否满足显示条件
//             const hasClickHandler = !!el.onclick;
//             const hasPointerCursor = style.cursor === "pointer";
//             const hasClickableChild = el.querySelector(
//                 'a, button, input[type="button"], input[type="submit"], [onclick]'
//             );
//             const hasInteractiveClass = /(btn|button|click|toggle|switch|option)/i.test(el.className);

//             if (hasClickHandler || hasPointerCursor || hasClickableChild || hasInteractiveClass) {
//                 el.style.display = "block";
//                 el.hidden = false;
//             }
//         }
//     });
// }

// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length) return;

        const scriptConfig = {
            target: { 
                tabId: tabs[0].id,
                allFrames: true
            }
        };

        if (message.action === "show_hidden_elements") {
            scriptConfig.func = showHiddenElements;
            chrome.scripting.executeScript(scriptConfig);
        } 
        else if (message.action === "restore_elements") {
            scriptConfig.func = restoreHiddenElements;
            chrome.scripting.executeScript(scriptConfig);
        }
    });
});

// ... 保持之前的消息监听和脚本配置部分不变 ...

function showHiddenElements() {
    const selectors = [
        '[style*="display: none"]',
        '[style*="display:none"]',
        '[hidden]',
        'iframe',
        '[class*="hidden"]'
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            // 保存原始状态
            if (!el.dataset.originalDisplay) {
                el.dataset.originalDisplay = el.style.display;
            }
            if (!el.dataset.originalHidden) {
                el.dataset.originalHidden = el.hidden;
            }
            // 新增：保存原始class
            if (!el.dataset.originalClass) {
                el.dataset.originalClass = el.className;
            }

            // 特殊处理iframe
            if (el.tagName === 'IFRAME' && el.contentDocument) {
                const iframeDoc = el.contentDocument;
                iframeDoc.querySelectorAll('*').forEach(processElement);
            }

            processElement(el);
        });
    });

    function processElement(el) {
        const style = window.getComputedStyle(el);
        const isHidden = style.display === "none" || el.hidden;
        if (el.className.includes('hidden') && shouldShowElement(el, style)){
            // console.log(el.className + "===="+ el.outerHTML);
            el.className = el.dataset.originalClass
            .split(/\s+/)
            .filter(className => !/hidden/i.test(className))
            .join(' ')
            .trim();
        }
        
        if ((isHidden && shouldShowElement(el, style))) {
            
            // 强制显示元素
            el.style.display = "block";
            el.hidden = false;
        }
    }

    // 保持shouldShowElement逻辑不变，但可以根据需要调整
    function shouldShowElement(el, style) {
        return (
            !!el.onclick || // 是否有点击事件
            style.cursor === "pointer" || // 鼠标样式为“手型”
            el.querySelector('a, button, input[type="button"], input[type="submit"], [onclick], [href]') || // 匹配所有带 href 的标签
            /(btn|button|click|toggle|switch|option)/i.test(el.className) // class 名是否包含交互性关键词
        );
    }
}

function restoreHiddenElements() {
    // 添加class恢复选择器
    const elements = document.querySelectorAll(
        '[data-original-display], [data-original-hidden], [data-original-class]'
    );
    
    elements.forEach(el => {
        if (el.dataset.originalDisplay) {
            el.style.display = el.dataset.originalDisplay;
            delete el.dataset.originalDisplay;
        }
        if (el.dataset.originalHidden) {
            el.hidden = el.dataset.originalHidden === 'true';
            delete el.dataset.originalHidden;
        }
        // 新增：恢复原始class
        if (el.dataset.originalClass) {
            el.className = el.dataset.originalClass;
            delete el.dataset.originalClass;
        }
    });

    // 处理iframe内容恢复
    document.querySelectorAll('iframe').forEach(iframe => {
        if (iframe.contentDocument) {
            iframe.contentDocument.querySelectorAll(
                '[data-original-display], [data-original-hidden], [data-original-class]'
            ).forEach(el => {
                if (el.dataset.originalDisplay) {
                    el.style.display = el.dataset.originalDisplay;
                    delete el.dataset.originalDisplay;
                }
                if (el.dataset.originalHidden) {
                    el.hidden = el.dataset.originalHidden === 'true';
                    delete el.dataset.originalHidden;
                }
                if (el.dataset.originalClass) {
                    el.className = el.dataset.originalClass;
                    delete el.dataset.originalClass;
                }
            });
        }
    });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) {
      sendResponse({ success: false, error: "No active tabs found" });
      return;
    }

    const scriptConfig = {
      target: {
        tabId: tabs[0].id,
        allFrames: true,
      },
    };

    if (message.action === "show_hidden_elements") {
      scriptConfig.func = showHiddenElements;
    } else if (message.action === "restore_elements") {
      scriptConfig.func = restoreHiddenElements;
    } else {
      sendResponse({ success: false, error: "Unknown action" });
      return;
    }

    chrome.scripting
      .executeScript(scriptConfig)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  });

  return true;
});

// ... 保持之前的消息监听和脚本配置部分不变 ...
function showHiddenElements() {
  const selectors = [
    '[style*="display: none"]',
    '[style*="display:none"]',
    "[hidden]",
    "iframe",
    '[class*="hidden"]',
    '[type="hidden"][name="oldpwd"]',
    '[type="hidden"][name="password"]',
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
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
      if (!el.dataset.originalType) {
        el.dataset.originalType = el.type;
      }

      // 特殊处理iframe
      if (el.tagName === "IFRAME" && el.contentDocument) {
        const iframeDoc = el.contentDocument;
        iframeDoc.querySelectorAll("*").forEach(processElement);
      }

      processElement(el);
    });
  });

  function processElement(el) {
    const style = window.getComputedStyle(el);
    const isHidden =
      style.display === "none" || el.hidden || el.type === "hidden";
    if (el.className.includes("hidden") && shouldShowElement(el, style)) {
      // console.log(el.className + "===="+ el.outerHTML);
      el.className = el.dataset.originalClass
        .split(/\s+/)
        .filter((className) => !/hidden/i.test(className))
        .join(" ")
        .trim();
    }

    // if (isHidden && shouldShowElement(el, style)) {
    //   // 强制显示元素
    //   el.style.display = "block";
    //   el.hidden = false;
    // }
    if (isHidden && shouldShowElement(el, style)) {
      // 强制显示元素
      el.style.display = "block";
      el.hidden = false;
      el.type = "text";
    }
  }

  // 保持shouldShowElement逻辑不变，但可以根据需要调整
  function shouldShowElement(el, style) {
    return (
      !!el.onclick || // 是否有点击事件
      style.cursor === "pointer" || // 鼠标样式为“手型”
      el.querySelector(
        'a, button, input[type="button"], input[type="submit"], [onclick], [href],input[name="oldpwd"],input[name="password"]'
      ) || // 匹配所有带 href 的标签
      /(btn|button|click|toggle|switch|option)/i.test(el.className) || // class 名是否包含交互性关键词
      el.matches(
        'a, button, input[type="button"], input[type="submit"], [onclick], [href],input[name="oldpwd"],input[name="password"]'
      )
    );
  }

  // 处理注释中的隐藏内容
  processHiddenComments();
  function processHiddenComments() {
    console.debug("[注释处理] 开始扫描注释节点");

    const nodeIterator = document.createNodeIterator(
      document.documentElement,
      NodeFilter.SHOW_COMMENT
    );

    let commentNode;
    let commentBlocks = [];
    let tempBlock = [];

    while ((commentNode = nodeIterator.nextNode())) {
      const content = commentNode.nodeValue.trim();

      console.debug(`[注释处理] 发现注释: ${content.slice(0, 50)}...`);

      if (content) {
        tempBlock.push(commentNode);
      } else if (tempBlock.length > 0) {
        commentBlocks.push(tempBlock);
        tempBlock = [];
      }
    }
    if (tempBlock.length > 0) {
      commentBlocks.push(tempBlock);
    }

    console.debug(`[注释处理] 共发现 ${commentBlocks.length} 组注释块`);

    commentBlocks.forEach((block, index) => {
      console.groupCollapsed(`[注释处理] 处理注释块 #${index + 1}`);
      try {
        let fullHTML = block.map((node) => node.nodeValue).join("\n");
        const parent = block[0].parentNode;

        if (!parent) {
          console.warn("[注释处理] 找不到 parentNode，跳过");
          return;
        }

        console.debug("原始合并注释内容:", fullHTML);
        const template = document.createElement("template");
        try {
          template.innerHTML = cleanCommentContent(fullHTML);
          console.debug("解析后的HTML结构:", template.innerHTML);
        } catch (e) {
          console.warn("[注释处理] HTML解析失败:", e);
          return;
        }

        const interactiveElements = template.content.querySelectorAll(
          'a, button, input[type="button"], [onclick], [href]'
        );

        console.debug(`发现 ${interactiveElements.length} 个可交互元素`);

        if (interactiveElements.length > 0) {
          const wrapper = document.createElement("div");
          wrapper.style.cssText = `
                        position: relative;
                        z-index: 2147483647;
                        outline: 2px dashed red;
                        pointer-events: auto;
                    `;
          wrapper.dataset.originalComment = fullHTML;

          // 新增：存储原始注释内容，便于恢复
          wrapper.dataset.originalComments = JSON.stringify(
            block.map((node) => node.nodeValue)
          );

          wrapper.appendChild(template.content.cloneNode(true));
          console.debug("生成的包裹元素:", wrapper);

          block.forEach((node) => {
            if (parent.contains(node)) {
              parent.removeChild(node);
            }
          });
          parent.appendChild(wrapper);
          activateWrapperElements(wrapper);
        }
      } finally {
        console.groupEnd();
      }
    });
  }

  function cleanCommentContent(content) {
    return content
      .replace(/<!--\s*?/g, "")
      .replace(/\s*?-->/g, "")
      .trim();
  }

  function activateWrapperElements(wrapper) {
    console.debug("[元素激活] 处理包裹元素:", wrapper);
    wrapper.querySelectorAll("*").forEach((el) => {
      el.style.position = "relative";
      el.style.zIndex = "2147483647";
    });
    wrapper.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener(
        "click",
        function (e) {
          console.info("[点击事件] 恢复元素被点击:", this.href || this);
          e.stopImmediatePropagation();
        },
        true
      );
    });
  }
}

function restoreHiddenElements() {
  // 添加class恢复选择器
  const elements = document.querySelectorAll(
    "[data-original-display], [data-original-hidden], [data-original-class]"
  );

  elements.forEach((el) => {
    if (el.dataset.originalDisplay) {
      el.style.display = el.dataset.originalDisplay;
    }
    if (el.dataset.originalHidden) {
      el.hidden = el.dataset.originalHidden === "true";
    }
    // 新增：恢复原始class
    if (el.dataset.originalClass) {
      el.className = el.dataset.originalClass;
    }
    if (el.dataset.originalType) {
      el.type = el.dataset.originalType;
    }
    delete el.dataset.originalDisplay;
    delete el.dataset.originalHidden;
    delete el.dataset.originalClass;
    delete el.dataset.originalType;
  });
  // const elements = document.querySelectorAll(
  //   "[data-original-display], [data-original-hidden], [data-original-class], [data-original-type]"
  // );

  // elements.forEach((el) => {
  //   if (el.dataset.originalDisplay) {
  //     el.style.display = el.dataset.originalDisplay;
  //     delete el.dataset.originalDisplay;
  //   }
  //   if (el.dataset.originalHidden) {
  //     el.hidden = el.dataset.originalHidden === "true";
  //     delete el.dataset.originalHidden;
  //   }
  //   if (el.dataset.originalClass) {
  //     el.className = el.dataset.originalClass;
  //     delete el.dataset.originalClass;
  //   }
  //   if (el.dataset.originalType) {
  //     el.type = el.dataset.originalType;
  //     delete el.dataset.originalType;
  //   }
  // });

  // 处理iframe内容恢复
  document.querySelectorAll("iframe").forEach((iframe) => {
    if (iframe.contentDocument) {
      iframe.contentDocument
        .querySelectorAll(
          "[data-original-display], [data-original-hidden], [data-original-class]"
        )
        .forEach((el) => {
          if (el.dataset.originalDisplay) {
            el.style.display = el.dataset.originalDisplay;
            delete el.dataset.originalDisplay;
          }
          if (el.dataset.originalHidden) {
            el.hidden = el.dataset.originalHidden === "true";
            delete el.dataset.originalHidden;
          }
          if (el.dataset.originalClass) {
            el.className = el.dataset.originalClass;
            delete el.dataset.originalClass;
          }
        });
    }
  });

  // 恢复注释内容
  document.querySelectorAll("[data-original-comments]").forEach((wrapper) => {
    console.debug("[恢复操作] 尝试恢复注释块:", wrapper);

    if (!wrapper.dataset.originalComments) {
      console.warn("[恢复操作] 找不到 data-original-comments，跳过");
      return;
    }

    let comments;
    try {
      comments = JSON.parse(wrapper.dataset.originalComments);
    } catch (e) {
      console.error("[恢复操作] JSON 解析失败:", e);
      return;
    }

    if (!wrapper.parentNode) {
      console.warn("[恢复操作] wrapper 没有父节点，跳过");
      return;
    }

    const fragment = document.createDocumentFragment();
    comments.forEach((text, index) => {
      const indent = text.match(/^(\s*)/)[0] || "";
      const comment = document.createComment(indent + text.trim());

      if (index > 0) {
        fragment.appendChild(document.createTextNode("\n"));
      }
      fragment.appendChild(comment);
    });

    try {
      wrapper.parentNode.replaceChild(fragment, wrapper);
      console.debug("[恢复操作] 成功恢复注释块");
    } catch (e) {
      console.error("[恢复操作] replaceChild 失败:", e);
    }
  });
}

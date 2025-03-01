// 动态创建样式标签
const style = document.createElement('style');
style.textContent = `
  *:not(html):not(body):not(head):not(script):not(style):not(meta):not(link):not(title) {
    display: revert !important;
    visibility: visible !important;
    /* 其他样式规则同上 */
  }
`;
document.head.appendChild(style);
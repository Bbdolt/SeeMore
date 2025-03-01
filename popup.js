// document.getElementById("showHidden").addEventListener("click", () => {
//     chrome.runtime.sendMessage({ action: "show_hidden_elements" });
// });
// popup.js
const toggleBtn = document.getElementById("toggleBtn");
let isShowing = false;

toggleBtn.addEventListener("click", () => {
    isShowing = !isShowing;
    
    chrome.runtime.sendMessage({ 
        action: isShowing ? "show_hidden_elements" : "restore_elements"
    });

    toggleBtn.textContent = isShowing ? "recover" : "Show Hidden";
    toggleBtn.classList.toggle("restore", isShowing);
});
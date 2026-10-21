document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const reconnectBtn = document.getElementById("reconnectBtn");

  chrome.debugger.attach({ tabId: 659099347 }, "1.3", () => {
    const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : "SUCCESS";
    fetch("http://127.0.0.1:9333/log?msg=" + encodeURIComponent("Attach 659099347 result: " + err));
    if (!chrome.runtime.lastError) {
      chrome.debugger.detach({ tabId: 659099347 });
    }
  });

  function checkStatus() {
    fetch("http://127.0.0.1:9333/json/version")
      .then(res => res.json())
      .then(() => {
        statusEl.textContent = "Online";
        statusEl.className = "badge connected";
      })
      .catch(() => {
        statusEl.textContent = "Offline";
        statusEl.className = "badge disconnected";
      });
  }

  reconnectBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "reconnect" }, () => {
      setTimeout(checkStatus, 500);
    });
  });

  checkStatus();
});

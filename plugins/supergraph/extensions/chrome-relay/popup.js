document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const reconnectBtn = document.getElementById("reconnectBtn");

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
    reconnectBtn.disabled = true;
    reconnectBtn.textContent = "Connecting...";
    chrome.runtime.sendMessage({ type: "reconnect" }, () => {
      setTimeout(() => {
        checkStatus();
        reconnectBtn.disabled = false;
        reconnectBtn.textContent = "Test Connection (:9333)";
      }, 500);
    });
  });

  checkStatus();
});

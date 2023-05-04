import React from "react";
import ReactDOM from "react-dom/client";
import ReactModal from "react-modal";

import "./index.css";
import App from "./App";

function waitForElm(selector: string) {
  return new Promise<HTMLElement>((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector) as HTMLElement);
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector) as HTMLElement);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

async function init() {
  const addToPlaylistButton = await waitForElm(
    '.header-action-row button[data-tooltip="Add To"]'
  );

  const ddrRoot = document.createElement("div");
  ddrRoot.id = "ddr-root";
  addToPlaylistButton.parentNode?.insertBefore(
    ddrRoot,
    addToPlaylistButton.nextSibling
  );
  addToPlaylistButton.style.display = "none";

  ReactModal.setAppElement("#ddr-root");

  const root = ReactDOM.createRoot(
    document.getElementById("ddr-root") as HTMLElement
  );
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();

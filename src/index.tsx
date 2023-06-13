import React from "react";
import ReactDOM from "react-dom/client";
import ReactModal from "react-modal";

import "./index.css";
import { ShowPageApp } from "./ShowPageApp";

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

async function initShowPage() {
  const addToPlaylistButton = await waitForElm(
    'div[data-testid="metaButtonsInfo"] button[data-tooltip="Add To"]'
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
      <ShowPageApp />
    </React.StrictMode>
  );
}

async function init() {
  const pathnameParts = window.location.pathname.split("/");
  if (pathnameParts[1] === "DublinDigitalRadio") {
    initShowPage();
  } else {
    console.log("nada");
  }
}

init();

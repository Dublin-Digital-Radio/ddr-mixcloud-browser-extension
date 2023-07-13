import React from "react";
import ReactDOM from "react-dom/client";
import ReactModal from "react-modal";

import "./index.css";
import { ShowPageApp } from "./ShowPageApp";
import {
  fetchWholePlaylistForEditing,
  playlistLookup,
  reorderPlaylist,
} from "./api";

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

function waitForElms(selector: string) {
  return new Promise<NodeListOf<HTMLElement>>((resolve) => {
    if (document.querySelectorAll(selector).length > 0) {
      return resolve(document.querySelectorAll(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelectorAll(selector).length > 0) {
        resolve(document.querySelectorAll(selector));
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

async function initPlaylistPage() {
  const pathnameParts = window.location.pathname.split("/");
  const playlistSlug = pathnameParts[3];
  const playallButton = await waitForElm(
    'div[data-testid="adminToolsPageContainer"] button[data-testid="play-all"]'
  );

  const sortNewestFirstButton = document.createElement("button");
  sortNewestFirstButton.textContent = "Sort newest first";
  sortNewestFirstButton.onclick =
    async function onSortNewestFirstButtonClick() {
      const playlistFromSlug = await playlistLookup({ slug: playlistSlug });
      const playlistNodes = await fetchWholePlaylistForEditing({
        playlistId: playlistFromSlug.id,
      });

      const sortedPlaylistIds = playlistNodes
        .sort(
          (nodeA, nodeB) =>
            new Date(nodeB.cloudcast.publishDate).getTime() -
            new Date(nodeA.cloudcast.publishDate).getTime()
        )
        .map((node) => node.id);
      await reorderPlaylist({
        playlistId: playlistFromSlug.id,
        items: sortedPlaylistIds,
      });

      window.location.reload();
    };
  playallButton.parentNode?.appendChild(sortNewestFirstButton);
}

async function initMyShowsPage() {
  const addToPlaylistButtons = await waitForElms(
    'button[data-tooltip="Add To"]'
  );
  addToPlaylistButtons.forEach(
    (button) =>
      ((button as HTMLButtonElement).onclick = () =>
        console.log(
          (
            button.parentElement?.parentElement?.previousSibling
              ?.previousSibling?.childNodes[1].firstChild
              ?.firstChild as HTMLAnchorElement
          )?.href
        ))
  );
}

function onUrlChange() {
  const pathnameParts = window.location.pathname.split("/");
  if (
    pathnameParts[1] === "DublinDigitalRadio" &&
    pathnameParts[2] !== "playlists"
  ) {
    initShowPage();
  } else if (pathnameParts[2] === "playlists") {
    initPlaylistPage();
  } else if (
    `${pathnameParts[2]}/${pathnameParts[3]}` === "my-shows/published"
  ) {
    initMyShowsPage();
  } else {
    console.log("nada");
  }
}

function init() {
  let lastUrl = window.location.href;
  onUrlChange();

  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onUrlChange();
    }
  }).observe(document, { subtree: true, childList: true });
}

init();

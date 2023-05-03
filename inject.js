async function fetchShowCloudcastId() {
  const pathnameParts = window.location.pathname.split("/");
  const username = pathnameParts[1];
  const showSlug = pathnameParts[2];
  return fetch("https://www.mixcloud.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query cloudcastQuery($lookup: CloudcastLookup!) {
          cloudcast: cloudcastLookup(lookup: $lookup) {
            id
          }
        }
        `,
      variables: {
        lookup: {
          username,
          slug: showSlug,
        },
      },
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.cloudcast.id);
}

async function fetchPaginatedPlaylists(showCloudcastId, cursor) {
  return fetch("https://www.mixcloud.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query addToPopoverQuery(
          $cloudcastId: ID!
          $cursor: String
        ) {
          viewer {
            ...AddToPlaylistPopover_viewer_1QwDtI
            id
          }
        }
        
        fragment AddToPlaylistPopover_viewer_1QwDtI on Viewer {
          me {
            id
            username
            isStaff
            playlists(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  ...PlaylistPopoverMenuItem_playlist_1QwDtI
                  id
                  __typename
                }
                cursor
              }
            }
          }
        }
        
        fragment PlaylistPopoverMenuItem_playlist_1QwDtI on Playlist {
          id
          name
          containsCloudcast(id: $cloudcastId)
        }
        `,
      variables: { cloudcastId: showCloudcastId, count: 100, cursor },
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.viewer.me.playlists);
}

async function handleAddToPlaylistClick(event) {
  let requestCount = 0;
  const showCloudcastId = await fetchShowCloudcastId();
  let paginatedPlaylistsResult;
  let playlists = [];
  let cursor = undefined;
  do {
    paginatedPlaylistsResult = await fetchPaginatedPlaylists(
      showCloudcastId,
      cursor
    );
    playlists = [
      ...playlists,
      ...paginatedPlaylistsResult.edges.map((edge) => edge.node),
    ];
    cursor = paginatedPlaylistsResult.pageInfo.endCursor;
    requestCount++;
  } while (paginatedPlaylistsResult.pageInfo.hasNextPage && requestCount < 10);

  const modal = document.createElement("div");
  modal.className = "dublin-digital-radio";
  modal.innerHTML = `
        <div class="modal open">
          <div class="modal-overlay"></div>
          <div class="modal-container">
            <p>Playlists</p>
            <ul>
            ${playlists
              .map((playlist) => `<li>${playlist.name}</li>`)
              .join("\n")}
            </ul>
          </div>
        </div>
      `;
  document.body.appendChild(modal);
}

function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
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

  const newButton = document.createElement("button");
  newButton.innerHTML = "Add to playlist";

  addToPlaylistButton.parentNode?.insertBefore(
    newButton,
    addToPlaylistButton.nextSibling
  );

  newButton.addEventListener("click", handleAddToPlaylistClick);

  console.log(newButton);
}

if (document.readyState === "complete") {
  init();
} else {
  window["onload"] = function () {
    init();
  };
}

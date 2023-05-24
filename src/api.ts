export async function fetchShowCloudcastId() {
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
    .then((response) => response.data.cloudcast.id as string);
}

export interface Playlist {
  id: string;
  name: string;
  slug: string;
}

export interface PlaylistsResponse {
  edges: { node: Playlist }[];
  pageInfo: { endCursor: string; hasNextPage: boolean };
}

export async function fetchPaginatedPlaylists(
  showCloudcastId: string,
  cursor: string | undefined
) {
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
          slug
          containsCloudcast(id: $cloudcastId)
        }
        `,
      variables: { cloudcastId: showCloudcastId, count: 100, cursor },
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.viewer.me.playlists)
    .then((playlistsResponse) => playlistsResponse as PlaylistsResponse);
}

export async function addToPlaylist({
  cloudcastId,
  playlistId,
}: {
  cloudcastId: string;
  playlistId: string;
}) {
  const csrfToken =
    document.cookie
      .split(";")
      .map((keyValueString) => keyValueString.trim().split("="))
      .find((keyValue) => keyValue[0] === "csrftoken")?.[1] ?? "";

  return fetch("https://www.mixcloud.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrftoken": csrfToken,
    },
    body: JSON.stringify({
      query: `
        mutation addPlaylistItemMutation(
          $input: AddPlaylistItemMutationInput!
        ) {
          addPlaylistItem(input: $input) {
            playlist {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          cloudcastId,
          playlistId,
        },
      },
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.addPlaylistItem.playlist as Playlist);
}

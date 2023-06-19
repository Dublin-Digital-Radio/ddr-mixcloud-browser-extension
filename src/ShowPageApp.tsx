import { useCallback, useEffect, useState } from "react";
import ReactModal from "react-modal";

import {
  fetchShowCloudcastId,
  fetchPaginatedPlaylists,
  fetchWholePlaylistForEditing,
  addToPlaylist,
  Playlist,
  reorderPlaylist,
} from "./api";

function PlaylistSelector({ closeModal }: { closeModal: () => void }) {
  const pathnameParts = window.location.pathname.split("/");
  const username = pathnameParts[1];

  const [loading, setLoading] = useState(true);
  const [showCloudcastId, setShowCloudcastId] = useState<string>();
  const [playlists, setPlaylist] = useState<Playlist[]>([]);
  const [filteredPlaylists, setFilteredPlaylist] = useState<Playlist[]>([]);
  const [playlistsStatuses, setPlaylistsStatuses] = useState<
    Record<string, undefined | "adding" | "added">
  >({});

  useEffect(() => {
    (async () => {
      const fetchedShowCloudcastId = await fetchShowCloudcastId();
      setShowCloudcastId(fetchedShowCloudcastId);
      let requestCount = 0;
      let playlistsBuffer: Playlist[] = [];
      let paginatedPlaylistsResult;
      let cursor = undefined;
      do {
        paginatedPlaylistsResult = await fetchPaginatedPlaylists(
          fetchedShowCloudcastId,
          cursor
        );
        playlistsBuffer = [
          ...playlistsBuffer,
          ...paginatedPlaylistsResult.edges.map((edge) => edge.node),
        ];
        cursor = paginatedPlaylistsResult.pageInfo.endCursor;
        requestCount++;
      } while (
        paginatedPlaylistsResult.pageInfo.hasNextPage &&
        requestCount < 10
      );

      setPlaylist(playlistsBuffer);
      setFilteredPlaylist(playlistsBuffer);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!showCloudcastId) {
    return null;
  }

  return (
    <>
      <button onClick={closeModal}>close</button>
      <div>
        <label>Search: </label>
        <input
          type="text"
          onChange={(event) =>
            setFilteredPlaylist(
              playlists.filter((playlist) =>
                playlist.name
                  .toLowerCase()
                  .includes(event.target.value.toLowerCase())
              )
            )
          }
        />
      </div>
      <ul>
        {filteredPlaylists.map((playlist) => (
          <li>
            <button
              onClick={async () => {
                setPlaylistsStatuses({ [playlist.name]: "adding" });
                try {
                  await addToPlaylist({
                    cloudcastId: showCloudcastId,
                    playlistId: playlist.id,
                  });
                  const wholePlaylist = await fetchWholePlaylistForEditing({
                    playlistId: playlist.id,
                  });
                  const wholePlaylistShowIds = wholePlaylist.map(
                    (node) => node.id
                  );
                  const reorderPlaylistInput = [
                    wholePlaylistShowIds[wholePlaylistShowIds.length - 1],
                    ...wholePlaylistShowIds.slice(0, -1),
                  ];
                  await reorderPlaylist({
                    items: reorderPlaylistInput,
                    playlistId: playlist.id,
                  });

                  setPlaylistsStatuses({ [playlist.name]: "added" });
                } catch (error) {
                  console.error(error);
                }
              }}
              disabled={playlistsStatuses[playlist.name] !== undefined}
            >
              {playlistsStatuses[playlist.name] === undefined && "Add to"}
              {playlistsStatuses[playlist.name] === "adding" && "Adding..."}
              {playlistsStatuses[playlist.name] === "added" && "✔️"}
            </button>
            &nbsp;
            <a
              href={`https://www.mixcloud.com/${username}/playlists/${playlist.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              {playlist.name}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ShowPageApp() {
  const [modalIsOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <div className="dublin-digital-radio">
      <button onClick={() => setIsOpen(true)}>Add to playlist</button>
      <ReactModal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Example Modal"
        style={{
          overlay: {
            zIndex: 9999,
          },
        }}
      >
        <PlaylistSelector closeModal={closeModal} />
      </ReactModal>
    </div>
  );
}

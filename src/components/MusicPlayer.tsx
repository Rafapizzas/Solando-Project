"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MusicProvider,
  MusicState,
  MusicTrack,
  musicRepo,
  spotifyEmbed,
  youtubeVideoId,
} from "@/lib/storage";

/* ------------------------------------------------------------------ *
 * YouTube IFrame API — carregada sob demanda uma única vez.
 * ------------------------------------------------------------------ */
interface YTPlayer {
  loadVideoById(id: string, start?: number): void;
  cueVideoById(id: string, start?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  setVolume(volume: number): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

function detectProvider(url: string): { provider: MusicProvider; videoId: string | null } | null {
  const yt = youtubeVideoId(url);
  if (yt) return { provider: "youtube", videoId: yt };
  const sp = spotifyEmbed(url);
  if (sp) return { provider: "spotify", videoId: null };
  return null;
}

/**
 * Player de música da mesa. O mestre controla a trilha; os jogadores acompanham
 * em sincronia (YouTube) via realtime — como um "bot de música" do Discord.
 * O Spotify é suportado por embed (cada um toca localmente, sem sincronizar).
 */
export function MusicPlayer({ tableId, isMaster }: { tableId: string; isMaster: boolean }) {
  const [state, setState] = useState<MusicState | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [synced, setSynced] = useState(false);
  const [volume, setVolume] = useState(70);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const currentVideo = useRef<string | null>(null);

  const load = useCallback(async () => {
    const [s, t] = await Promise.all([musicRepo.get(tableId), musicRepo.tracks(tableId)]);
    setState(s);
    setTracks(t);
  }, [tableId]);

  useEffect(() => {
    load();
    const unsub = musicRepo.subscribe(tableId, load);
    return unsub;
  }, [tableId, load]);

  /* Cria o player do YouTube quando o usuário habilita o áudio. */
  const enableAudio = useCallback(async () => {
    setError(null);
    await loadYouTubeApi();
    if (!containerRef.current || playerRef.current || !window.YT) {
      setSynced(true);
      return;
    }
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "180",
      width: "320",
      playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
    });
    setSynced(true);
  }, []);

  /* Aplica o estado remoto ao player local (sincronização). */
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !synced || !state || state.provider !== "youtube" || !state.videoId) return;
    const drift = state.isPlaying ? (Date.now() - state.updatedAt) / 1000 : 0;
    const target = Math.max(0, state.positionSeconds + drift);
    try {
      if (currentVideo.current !== state.videoId) {
        currentVideo.current = state.videoId;
        if (state.isPlaying) p.loadVideoById(state.videoId, target);
        else p.cueVideoById(state.videoId, target);
      } else {
        const cur = p.getCurrentTime?.() ?? 0;
        if (Math.abs(cur - target) > 2.5) p.seekTo(target, true);
        if (state.isPlaying) p.playVideo();
        else p.pauseVideo();
      }
      p.setVolume(volume);
    } catch {
      /* player ainda inicializando */
    }
  }, [state, synced, volume]);

  /* Mestre: reforça a posição periodicamente para novos ouvintes. */
  useEffect(() => {
    if (!isMaster || !state?.isPlaying || state.provider !== "youtube") return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const pos = p.getCurrentTime?.();
      if (typeof pos === "number") {
        musicRepo.set(tableId, { positionSeconds: pos, isPlaying: true }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isMaster, state?.isPlaying, state?.provider, tableId]);

  function currentPosition(): number {
    const p = playerRef.current;
    return p?.getCurrentTime?.() ?? state?.positionSeconds ?? 0;
  }

  async function playNow(track: { provider: MusicProvider; url: string; videoId: string | null; title: string }) {
    setError(null);
    if (!synced) await enableAudio();
    currentVideo.current = null;
    await musicRepo.set(tableId, {
      provider: track.provider,
      url: track.url,
      videoId: track.videoId,
      title: track.title,
      isPlaying: true,
      positionSeconds: 0,
    });
    await load();
  }

  async function togglePlay() {
    if (!state) return;
    if (!synced) await enableAudio();
    await musicRepo.set(tableId, {
      isPlaying: !state.isPlaying,
      positionSeconds: currentPosition(),
    });
    await load();
  }

  async function stop() {
    await musicRepo.set(tableId, { isPlaying: false, positionSeconds: 0 });
    await load();
  }

  async function submitUrl(mode: "play" | "queue") {
    const parsed = detectProvider(url);
    if (!parsed) {
      setError("Cole um link válido do YouTube ou Spotify.");
      return;
    }
    const t = {
      provider: parsed.provider,
      url: url.trim(),
      videoId: parsed.videoId,
      title: title.trim() || (parsed.provider === "youtube" ? "Faixa do YouTube" : "Faixa do Spotify"),
    };
    if (mode === "play") await playNow(t);
    else {
      await musicRepo.addTrack(tableId, t);
      await load();
    }
    setUrl("");
    setTitle("");
  }

  const spotify = state?.provider === "spotify" ? spotifyEmbed(state.url ?? "") : null;

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-zinc-100">🎵 Trilha sonora</h3>
        {!synced && (
          <button onClick={enableAudio} className="btn-primary text-xs">
            🔊 Sincronizar áudio
          </button>
        )}
      </div>

      {/* Tocando agora */}
      <div className="rounded-xl border border-white/10 bg-void-950/40 p-3">
        {state?.videoId || spotify ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {state?.title || "Sem título"}
                </p>
                <p className="text-xs text-zinc-500">
                  {state?.provider === "spotify" ? "Spotify (local)" : "YouTube · sincronizado"}
                  {state?.isPlaying ? " · ▶️ tocando" : " · ⏸️ pausado"}
                </p>
              </div>
              {isMaster && state?.provider === "youtube" && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={togglePlay} className="btn-ghost text-sm">
                    {state?.isPlaying ? "⏸️" : "▶️"}
                  </button>
                  <button onClick={stop} className="btn-ghost text-sm">
                    ⏹️
                  </button>
                </div>
              )}
            </div>
            {state?.provider === "spotify" && spotify && (
              <iframe
                title="Spotify"
                className="mt-3 w-full rounded-lg"
                style={{ height: spotify.kind === "track" ? 80 : 152 }}
                src={`https://open.spotify.com/embed/${spotify.kind}/${spotify.id}`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500">
            {isMaster
              ? "Cole um link do YouTube ou Spotify abaixo para começar a tocar."
              : "O mestre ainda não iniciou nenhuma trilha."}
          </p>
        )}
      </div>

      {/* Player do YouTube (oculto quando não sincronizado) */}
      <div className={synced && state?.provider === "youtube" ? "flex justify-center" : "hidden"}>
        <div ref={containerRef} className="overflow-hidden rounded-lg" />
      </div>

      {synced && (
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          🔈 Volume
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1"
          />
        </label>
      )}

      {/* Controles do mestre */}
      {isMaster && (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="input w-full"
              placeholder="Link do YouTube ou Spotify"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              className="input w-full sm:w-40"
              placeholder="Título (opcional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => submitUrl("play")} className="btn-primary text-sm">
              ▶️ Tocar agora
            </button>
            <button onClick={() => submitUrl("queue")} className="btn-ghost text-sm">
              ➕ Adicionar à fila
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}

          {tracks.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-400">Fila</p>
              {tracks.map((tr) => (
                <div
                  key={tr.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-void-950/30 px-3 py-2"
                >
                  <span className="truncate text-sm text-zinc-300">
                    {tr.provider === "spotify" ? "🟢" : "▶️"} {tr.title}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() =>
                        playNow({
                          provider: tr.provider,
                          url: tr.url,
                          videoId: tr.videoId,
                          title: tr.title,
                        })
                      }
                      className="btn-ghost text-xs"
                    >
                      Tocar
                    </button>
                    <button
                      onClick={async () => {
                        await musicRepo.removeTrack(tr.id);
                        await load();
                      }}
                      className="btn-ghost text-xs text-red-400"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isMaster && (
        <p className="text-[11px] text-zinc-600">
          Clique em <b>Sincronizar áudio</b> para ouvir a trilha junto com a mesa. O mestre
          controla o que toca.
        </p>
      )}
    </div>
  );
}

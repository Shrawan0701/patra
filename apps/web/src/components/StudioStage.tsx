import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ProjectConfig } from '@patra/shared';
import { STUDIO_URL } from '../lib/api';

export interface StudioStageHandle {
  sendCommand: (type: string, payload?: unknown) => void;
}

interface StudioStageProps {
  project: ProjectConfig;
  activeRoomIdx?: number;
  viewMode?: 'stage' | 'wax_envelope' | 'garden_entrance';
  className?: string;
  title?: string;
  lazy?: boolean;
  onReady?: () => void;
  onPreviewProgress?: (elapsed: number, total: number, pct: number) => void;
  onPreviewDone?: () => void;
  onExportProgress?: (pct: number) => void;
  onExportComplete?: (dataUrl: string, mimeType: string, title: string, blob?: Blob) => void;
  onExportError?: (message: string) => void;
  onCustomTextMoved?: (roomIndex: number, id: string, x: number, y: number) => void;
  onPhotoCutoutMoved?: (roomIndex: number, slot: 1 | 2, offsetX: number, offsetZ: number) => void;
}

export const StudioStage = React.forwardRef<StudioStageHandle, StudioStageProps>(
  (
    {
      project,
      activeRoomIdx = 0,
      viewMode = 'stage',
      className,
      title = 'Patra 3D Interactive Stage',
      lazy = false,
      onReady,
      onPreviewProgress,
      onPreviewDone,
      onExportProgress,
      onExportComplete,
      onExportError,
      onCustomTextMoved,
      onPhotoCutoutMoved,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const loadFallbackRef = useRef<number | null>(null);
    const [shouldMount, setShouldMount] = useState(!lazy);
    const [ready, setReady] = useState(false);
    const [stageLoaded, setStageLoaded] = useState(false);

    const latestPropsRef = useRef({
      project,
      activeRoomIdx,
      viewMode,
      onReady,
      onPreviewProgress,
      onPreviewDone,
      onExportProgress,
      onExportComplete,
      onExportError,
      onCustomTextMoved,
      onPhotoCutoutMoved,
    });
    latestPropsRef.current = {
      project,
      activeRoomIdx,
      viewMode,
      onReady,
      onPreviewProgress,
      onPreviewDone,
      onExportProgress,
      onExportComplete,
      onExportError,
      onCustomTextMoved,
      onPhotoCutoutMoved,
    };

    const postToIframe = (type: string, payload?: unknown) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        JSON.stringify({ type, payload, activeRoomIdx: latestPropsRef.current.activeRoomIdx }),
        '*'
      );
    };

    useImperativeHandle(ref, () => ({
      sendCommand: (type: string, payload?: unknown) => {
        postToIframe(type, payload);
      },
    }));

    useEffect(() => {
      if (!lazy || shouldMount) return;
      const el = containerRef.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        setShouldMount(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setShouldMount(true);
            observer.disconnect();
          }
        },
        { rootMargin: '260px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [lazy, shouldMount]);

    useEffect(() => {
      if (ready) {
        postToIframe('SET_PROJECT', project);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, ready]);

    useEffect(() => {
      if (ready) {
        postToIframe('SET_ROOM', activeRoomIdx);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRoomIdx, ready]);

    useEffect(() => {
      if (ready) {
        postToIframe('SET_VIEW_MODE', viewMode);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, ready]);

    useEffect(() => {
      return () => {
        if (loadFallbackRef.current !== null) {
          window.clearTimeout(loadFallbackRef.current);
          loadFallbackRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      if (!shouldMount) return;

      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframeRef.current?.contentWindow) return;
        const latest = latestPropsRef.current;
        try {
          const msg =
            typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (!msg || typeof msg.type !== 'string') return;

          if (msg.type === 'READY') {
            if (loadFallbackRef.current !== null) {
              window.clearTimeout(loadFallbackRef.current);
              loadFallbackRef.current = null;
            }
            setReady(true);
            setStageLoaded(true);
            postToIframe('SET_PROJECT', latest.project);
            postToIframe('SET_VIEW_MODE', latest.viewMode);
            latest.onReady?.();
          } else if (msg.type === 'PREVIEW_PROGRESS') {
            latest.onPreviewProgress?.(
              msg.payload?.elapsed ?? 0,
              msg.payload?.total ?? 0,
              msg.payload?.pct ?? 0
            );
          } else if (msg.type === 'PREVIEW_DONE') {
            latest.onPreviewDone?.();
          } else if (msg.type === 'EXPORT_PROGRESS') {
            latest.onExportProgress?.(msg.payload?.pct ?? 0);
          } else if (msg.type === 'EXPORT_COMPLETE_BINARY' && msg.payload?.buffer) {
            const mimeType = msg.payload.mimeType || 'video/mp4';
            const blob = new Blob([msg.payload.buffer], { type: mimeType });
            const objectUrl = URL.createObjectURL(blob);
            latest.onExportComplete?.(
              objectUrl,
              mimeType,
              msg.payload.title || latest.project.title,
              blob
            );
          } else if (msg.type === 'EXPORT_COMPLETE' && msg.payload?.dataUrl) {
            latest.onExportComplete?.(
              msg.payload.dataUrl,
              msg.payload.mimeType || 'video/webm',
              msg.payload.title || latest.project.title
            );
          } else if (msg.type === 'EXPORT_ERROR') {
            latest.onExportError?.(
              msg.payload?.message || 'Video export failed on this browser'
            );
          } else if (
            msg.type === 'CUSTOM_TEXT_MOVED' &&
            typeof msg.payload?.roomIndex === 'number' &&
            msg.payload?.id
          ) {
            latest.onCustomTextMoved?.(
              msg.payload.roomIndex,
              msg.payload.id,
              msg.payload.x ?? 0,
              msg.payload.y ?? 0
            );
          } else if (
            msg.type === 'PHOTO_CUTOUT_MOVED' &&
            typeof msg.payload?.roomIndex === 'number'
          ) {
            latest.onPhotoCutoutMoved?.(
              msg.payload.roomIndex,
              msg.payload.slot === 2 ? 2 : 1,
              msg.payload.offsetX ?? 0,
              msg.payload.offsetZ ?? 0
            );
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }, [shouldMount]);

    return (
      <div ref={containerRef} className={`stage-shell ${className || 'stage-iframe'}`}>
        {shouldMount && (
          <iframe
            ref={iframeRef}
            src={`${STUDIO_URL}/?embed=1`}
            title={title}
            loading={lazy ? 'lazy' : 'eager'}
            className="stage-shell-frame"
            allow="autoplay"
            onLoad={() => {
              setReady(true);
              setTimeout(() => {
                postToIframe('SET_PROJECT', latestPropsRef.current.project);
                postToIframe('SET_VIEW_MODE', latestPropsRef.current.viewMode);
              }, 80);
              if (loadFallbackRef.current !== null) {
                window.clearTimeout(loadFallbackRef.current);
              }
              loadFallbackRef.current = window.setTimeout(() => {
                setStageLoaded(true);
                loadFallbackRef.current = null;
              }, 2200);
            }}
          />
        )}
        <div
          className={`stage-loading-overlay ${stageLoaded ? 'is-ready' : ''}`}
          aria-hidden={stageLoaded}
        >
          <span className="stage-loading-spinner" />
          <span>Loading 3D Studio...</span>
        </div>
      </div>
    );
  }
);

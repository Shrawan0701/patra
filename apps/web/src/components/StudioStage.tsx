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
  onReady?: () => void;
  onPreviewProgress?: (elapsed: number, total: number, pct: number) => void;
  onPreviewDone?: () => void;
  onExportProgress?: (pct: number) => void;
  onExportComplete?: (dataUrl: string, mimeType: string, title: string) => void;
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
      onReady,
      onPreviewProgress,
      onPreviewDone,
      onExportProgress,
      onExportComplete,
      onCustomTextMoved,
      onPhotoCutoutMoved,
    },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [ready, setReady] = useState(false);

    const postToIframe = (type: string, payload?: unknown) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify({ type, payload, activeRoomIdx }), '*');
    };

    useImperativeHandle(ref, () => ({
      sendCommand: (type: string, payload?: unknown) => {
        postToIframe(type, payload);
      },
    }));

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
      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframeRef.current?.contentWindow) return;
        try {
          const msg =
            typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (!msg || typeof msg.type !== 'string') return;

          if (msg.type === 'READY') {
            setReady(true);
            postToIframe('SET_PROJECT', project);
            postToIframe('SET_VIEW_MODE', viewMode);
            onReady?.();
          } else if (msg.type === 'PREVIEW_PROGRESS') {
            onPreviewProgress?.(
              msg.payload?.elapsed ?? 0,
              msg.payload?.total ?? 0,
              msg.payload?.pct ?? 0
            );
          } else if (msg.type === 'PREVIEW_DONE') {
            onPreviewDone?.();
          } else if (msg.type === 'EXPORT_PROGRESS') {
            onExportProgress?.(msg.payload?.pct ?? 0);
          } else if (msg.type === 'EXPORT_COMPLETE' && msg.payload?.dataUrl) {
            onExportComplete?.(
              msg.payload.dataUrl,
              msg.payload.mimeType || 'video/webm',
              msg.payload.title || project.title
            );
          } else if (
            msg.type === 'CUSTOM_TEXT_MOVED' &&
            typeof msg.payload?.roomIndex === 'number' &&
            msg.payload?.id
          ) {
            onCustomTextMoved?.(
              msg.payload.roomIndex,
              msg.payload.id,
              msg.payload.x ?? 0,
              msg.payload.y ?? 0
            );
          } else if (
            msg.type === 'PHOTO_CUTOUT_MOVED' &&
            typeof msg.payload?.roomIndex === 'number'
          ) {
            onPhotoCutoutMoved?.(
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, activeRoomIdx, viewMode, onPreviewProgress, onPreviewDone, onExportProgress, onExportComplete, onCustomTextMoved, onPhotoCutoutMoved]);

    return (
      <iframe
        ref={iframeRef}
        src={`${STUDIO_URL}/?embed=1`}
        title={title}
        className={className || 'stage-iframe'}
        allow="autoplay"
        onLoad={() => {
          setReady(true);
          setTimeout(() => {
            postToIframe('SET_PROJECT', project);
            postToIframe('SET_VIEW_MODE', viewMode);
          }, 80);
        }}
      />
    );
  }
);

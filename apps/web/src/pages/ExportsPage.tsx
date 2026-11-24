import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Sparkles, Trash2 } from 'lucide-react';
import { ExportRecord } from '@patra/shared';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';

export function ExportsPage() {
  const [exportsList, setExportsList] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.exportHistory();
        setExportsList(res.exports);
      } catch {
        setExportsList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDeleteExport = async (id: string) => {
    try {
      await api.deleteExport(id);
      setExportsList((prev) => prev.filter((rec) => rec.id !== id));
    } catch {
      // Ignore delete error
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="badge-pill">Download History</span>
            <h1 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 800 }}>Your Downloaded Invitations</h1>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Every HD/4K video and 1-page card download is logged here alongside resolution and format. Files save directly to your browser Downloads folder.
            </p>
          </div>
          <Link to="/app" className="btn btn-primary">
            <Sparkles size={15} /> Create Another Video
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading download history...</p>
        ) : exportsList.length === 0 ? (
          <div className="card-glass" style={{ padding: 32, alignItems: 'center', textAlign: 'center' }}>
            <Film size={32} color="var(--accent)" />
            <h2 style={{ margin: '6px 0 0', fontSize: 20 }}>No downloads unlocked yet</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', maxWidth: 420 }}>
              Open any 3D template or 1-page card, customize your design, then click Download to save directly to your device.
            </p>
            <Link to="/app" className="btn btn-primary" style={{ marginTop: 8 }}>
              Browse Templates
            </Link>
          </div>
        ) : (
          <div className="bento-grid">
            {exportsList.map((rec) => (
              <div key={rec.id} className="card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="badge-pill">{rec.resolution}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{rec.aspectRatio}</span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      title="Remove download record"
                      aria-label={`Delete ${rec.projectTitle}`}
                      style={{ padding: '4px 7px' }}
                      onClick={() => void handleDeleteExport(rec.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 style={{ margin: '4px 0 0', fontSize: 17 }}>{rec.projectTitle}</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
                  {new Date(rec.createdAt).toLocaleString()}
                </p>
                {rec.projectId && (
                  <Link to={`/app/editor/${rec.projectId}`} className="btn btn-sm" style={{ marginTop: 6 }}>
                    Re-open Project in Studio
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  PREMIUM_TEMPLATES,
  ProjectConfig,
  TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
} from '@patra/shared';

type PickerFilter = 'all' | 'western' | 'east_asian' | 'indian' | 'classic' | 'drafts';

interface Props {
  savedProjects: (ProjectConfig & { updatedAt: string })[];
  activeTitle: string;
  activeProjectId?: string;
  onSelect: (key: string) => void;
}

const REGION_LABEL: Record<TemplateRegionId, string> = {
  western: 'Western & European',
  east_asian: 'East Asian',
  indian: 'Indian Heritage',
};

export function StudioTemplatePicker({
  savedProjects,
  activeTitle,
  activeProjectId,
  onSelect,
}: Props) {
  const [filter, setFilter] = useState<PickerFilter>('all');
  const [query, setQuery] = useState('');

  // Interleave Western, East Asian & Indian signatures so overseas users see variety first
  const allSignaturesSorted = useMemo(() => {
    const western = PREMIUM_TEMPLATES.filter((t) => t.region === 'western');
    const eastAsian = PREMIUM_TEMPLATES.filter((t) => t.region === 'east_asian');
    const indian = PREMIUM_TEMPLATES.filter((t) => t.region === 'indian');
    const mixed: TemplatePreset[] = [];
    const max = Math.max(western.length, eastAsian.length, indian.length);
    for (let i = 0; i < max; i++) {
      if (western[i]) mixed.push(western[i]);
      if (eastAsian[i]) mixed.push(eastAsian[i]);
      if (indian[i]) mixed.push(indian[i]);
    }
    return [...mixed, ...TEMPLATES];
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter === 'drafts') {
      return savedProjects
        .filter((p) => !q || p.title.toLowerCase().includes(q))
        .map((p) => ({
          key: p.id!,
          title: p.title,
          tag: 'My Draft',
          subtitle: `${p.rooms.length} ${p.rooms.length === 1 ? 'Room' : 'Rooms'}`,
          gradient: ['#334155', '#64748B'] as [string, string],
          isActive: activeProjectId === p.id,
        }));
    }

    const baseList =
      filter === 'all'
        ? allSignaturesSorted
        : filter === 'classic'
        ? TEMPLATES
        : PREMIUM_TEMPLATES.filter((t) => t.region === filter);

    return baseList
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q) ||
          t.vibeTag.toLowerCase().includes(q)
      )
      .map((t) => ({
        key: `tpl:${t.id}`,
        title: t.name,
        tag: t.region ? REGION_LABEL[t.region] : t.vibeTag,
        subtitle: t.subtitle,
        gradient: t.previewGradient,
        isActive: !activeProjectId && activeTitle === t.project.title,
      }));
  }, [filter, query, savedProjects, allSignaturesSorted, activeProjectId, activeTitle]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 12,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div className="chip-row" style={{ gap: 6 }}>
          {(
            [
              ['all', `All Global (${allSignaturesSorted.length})`],
              ['western', 'Western & European'],
              ['east_asian', 'East Asian'],
              ['indian', 'Indian Heritage'],
              ['classic', `Classic (${TEMPLATES.length})`],
              ...(savedProjects.length > 0 ? [['drafts', `My Drafts (${savedProjects.length})`] as const] : []),
            ] as [PickerFilter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip-btn ${filter === id ? 'active' : ''}`}
              style={{ padding: '5px 11px', fontSize: 12 }}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 230 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.55,
              pointerEvents: 'none',
            }}
          />
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Tuscan, Kyoto, Chapel..."
            style={{ paddingLeft: 30, fontSize: 12.5, height: 34 }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollbarWidth: 'thin',
        }}
      >
        {items.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', padding: '10px 4px' }}>
            No matching templates found. Try clearing the search filter.
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              style={{
                flex: '0 0 auto',
                width: 204,
                padding: '9px 11px',
                borderRadius: 8,
                border: item.isActive ? '2px solid var(--ink)' : '1px solid var(--border)',
                background: item.isActive ? 'var(--bg-subtle)' : 'var(--bg-card)',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.tag}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.subtitle}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

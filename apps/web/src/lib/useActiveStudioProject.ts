import { useCallback, useEffect, useState } from 'react';
import { ProjectConfig, TEMPLATES, findTemplateById, hasPremiumStudioFeatures } from '@patra/shared';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from './api';

export function useActiveStudioProject() {
  const { refreshUser } = useAuth();
  const [savedProjects, setSavedProjects] = useState<(ProjectConfig & { updatedAt: string })[]>([]);
  const [project, setProject] = useState<ProjectConfig>(() => structuredClone(TEMPLATES[0].project));
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallSubscriptionOnly, setPaywallSubscriptionOnly] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.listProjects();
      setSavedProjects(res.projects);
      if (res.projects.length > 0) {
        setProject(structuredClone(res.projects[0]));
        setActiveRoomIdx(0);
      }
    } catch {
      // Keep default template project when offline/empty
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const selectSavedProject = (projectId: string) => {
    if (projectId.startsWith('tpl:')) {
      const tpl = findTemplateById(projectId.slice(4));
      if (tpl) {
        setProject(structuredClone(tpl.project));
        setActiveRoomIdx(0);
      }
      return;
    }
    const found = savedProjects.find((p) => p.id === projectId);
    if (found) {
      setProject(structuredClone(found));
      setActiveRoomIdx(0);
    }
  };

  const saveProject = async (): Promise<ProjectConfig> => {
    setSaving(true);
    setNotice(null);
    try {
      const saved = project.id
        ? (await api.updateProject(project.id, project)).project
        : (await api.createProject(project)).project;
      setProject(saved);
      setSavedProjects((prev) => {
        const rest = prev.filter((p) => p.id !== saved.id);
        return [saved, ...rest];
      });
      setNotice('Saved to your Studio Drafts.');
      setTimeout(() => setNotice(null), 2600);
      return saved;
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to save draft');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const authorizeAndExport = async (startExportCmd: () => void) => {
    if (exporting) return;
    let savedId = project.id;
    if (!savedId) {
      try {
        const created = await saveProject();
        savedId = created.id;
      } catch {
        // Continue to authorization
      }
    }

    const usesPremium = hasPremiumStudioFeatures(project);
    try {
      await api.authorizeExport({
        projectId: savedId,
        projectTitle: project.title,
        aspectRatio: project.aspectRatio,
        usesPremiumFeatures: usesPremium,
      });
      void refreshUser();
      setExporting(true);
      setExportPct(0);
      startExportCmd();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setPaywallSubscriptionOnly(err.code === 'SUBSCRIPTION_REQUIRED' || usesPremium);
        setPaywallOpen(true);
      } else {
        setNotice(err instanceof Error ? err.message : 'Export authorization failed');
      }
    }
  };

  const finishExportDownload = (dataUrl: string, mimeType: string, title: string) => {
    setExporting(false);
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${(title || 'patra-3d-invite').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    a.click();
    setNotice('4K Video downloaded and added to Exports!');
  };

  return {
    savedProjects,
    project,
    setProject,
    activeRoomIdx,
    setActiveRoomIdx,
    saving,
    exporting,
    exportPct,
    setExportPct,
    previewing,
    setPreviewing,
    notice,
    setNotice,
    paywallOpen,
    setPaywallOpen,
    paywallSubscriptionOnly,
    selectSavedProject,
    saveProject,
    authorizeAndExport,
    finishExportDownload,
  };
}

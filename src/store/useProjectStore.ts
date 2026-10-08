import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { ProjectMetadata, ProjectData, QuestData } from "../types/QuestTypes";
import { useQuestStore } from "./useQuestStore";

const PROJECTS_INDEX_KEY = "questslib:projects_index";
const ACTIVE_PROJECT_KEY = "questslib:active_project_id";
const PROJECT_DATA_PREFIX = "questslib:project_data:";
const LEGACY_QUESTS_KEY = "questslib:quests";

const DEFAULT_PROJECT_METADATA: ProjectMetadata = {
    id: "project_default",
    name: "Mon Projet de Quêtes",
    namespace: "questslib",
    description: "Projet principal",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    questCount: 1,
};

interface ProjectState {
    projects: ProjectMetadata[];
    activeProjectId: string;
    isLoading: boolean;

    loadProjects: () => Promise<void>;
    selectProject: (projectId: string) => Promise<void>;
    createProject: (name: string, description?: string, initialQuests?: QuestData[], namespace?: string) => Promise<string>;
    duplicateProject: (projectId: string, newName?: string) => Promise<string>;
    updateProjectMetadata: (projectId: string, patch: Partial<ProjectMetadata>) => Promise<void>;
    deleteProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
    saveActiveProjectQuests: (quests: QuestData[]) => Promise<void>;
    getActiveNamespace: () => string;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [DEFAULT_PROJECT_METADATA],
    activeProjectId: DEFAULT_PROJECT_METADATA.id,
    isLoading: true,

    loadProjects: async () => {
        try {
            let index = (await idbGet(PROJECTS_INDEX_KEY)) as ProjectMetadata[] | undefined;
            let activeId = (await idbGet(ACTIVE_PROJECT_KEY)) as string | undefined;

            // Migration depuis l'ancienne clé unique questslib:quests si aucun projet n'existe
            if (!Array.isArray(index) || index.length === 0) {
                const legacyQuests = (await idbGet(LEGACY_QUESTS_KEY)) as QuestData[] | undefined;
                const initialQuests = Array.isArray(legacyQuests) && legacyQuests.length > 0
                    ? legacyQuests
                    : useQuestStore.getState().quests;

                const initialMeta: ProjectMetadata = {
                    ...DEFAULT_PROJECT_METADATA,
                    questCount: initialQuests.length,
                };

                const initialData: ProjectData = {
                    metadata: initialMeta,
                    quests: initialQuests,
                };

                await idbSet(PROJECT_DATA_PREFIX + initialMeta.id, initialData);
                await idbSet(PROJECTS_INDEX_KEY, [initialMeta]);
                await idbSet(ACTIVE_PROJECT_KEY, initialMeta.id);

                index = [initialMeta];
                activeId = initialMeta.id;
            }

            const currentActiveId = activeId && index.some((p) => p.id === activeId)
                ? activeId
                : index[0].id;

            // Charger les quêtes du projet actif
            const activeData = (await idbGet(PROJECT_DATA_PREFIX + currentActiveId)) as ProjectData | undefined;
            const questsToLoad = activeData?.quests || useQuestStore.getState().quests;

            set({
                projects: index,
                activeProjectId: currentActiveId,
                isLoading: false,
            });

            useQuestStore.getState().initFromProject(currentActiveId, questsToLoad);
        } catch (e) {
            console.error("Erreur lors du chargement des projets :", e);
            set({ projects: [DEFAULT_PROJECT_METADATA], activeProjectId: DEFAULT_PROJECT_METADATA.id, isLoading: false });
        }
    },

    selectProject: async (projectId: string) => {
        const { projects, activeProjectId } = get();
        if (projectId === activeProjectId) return;

        const target = projects.find((p) => p.id === projectId);
        if (!target) return;

        try {
            const projectData = (await idbGet(PROJECT_DATA_PREFIX + projectId)) as ProjectData | undefined;
            const quests = projectData?.quests || [];

            await idbSet(ACTIVE_PROJECT_KEY, projectId);
            set({ activeProjectId: projectId });

            useQuestStore.getState().initFromProject(projectId, quests);
        } catch (err) {
            console.error("Erreur changement de projet:", err);
        }
    },

    createProject: async (name: string, description?: string, initialQuests?: QuestData[], namespace?: string) => {
        const id = `project_${Date.now()}`;
        const cleanNamespace = (namespace?.trim() || "questslib").toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
        const quests = initialQuests && initialQuests.length > 0
            ? initialQuests
            : [
                {
                    id: `${cleanNamespace}:quest_1`,
                    name: "Nouvelle Quête",
                    description: "Quête d'introduction",
                    tasks: [],
                    rewards: [],
                },
            ];

        const newMeta: ProjectMetadata = {
            id,
            name: name.trim() || "Nouveau Projet",
            namespace: cleanNamespace,
            description: description?.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            questCount: quests.length,
        };

        const newProjectData: ProjectData = {
            metadata: newMeta,
            quests,
        };

        const updatedIndex = [...get().projects, newMeta];

        try {
            await idbSet(PROJECT_DATA_PREFIX + id, newProjectData);
            await idbSet(PROJECTS_INDEX_KEY, updatedIndex);
            await idbSet(ACTIVE_PROJECT_KEY, id);

            set({
                projects: updatedIndex,
                activeProjectId: id,
            });

            useQuestStore.getState().initFromProject(id, quests);
            return id;
        } catch (err: any) {
            console.error("Erreur création projet:", err);
            throw err;
        }
    },

    duplicateProject: async (projectId: string, newName?: string) => {
        const { projects } = get();
        const sourceMeta = projects.find((p) => p.id === projectId);
        if (!sourceMeta) throw new Error("Projet source introuvable");

        const sourceData = (await idbGet(PROJECT_DATA_PREFIX + projectId)) as ProjectData | undefined;
        const sourceQuests = sourceData?.quests || [];

        const newId = `project_${Date.now()}`;
        const duplicatedName = newName?.trim() || `${sourceMeta.name} (Copie)`;

        const newMeta: ProjectMetadata = {
            id: newId,
            name: duplicatedName,
            namespace: sourceMeta.namespace || "questslib",
            description: sourceMeta.description,
            datasetId: sourceMeta.datasetId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            questCount: sourceQuests.length,
        };

        // Deep copy des quêtes
        const copiedQuests = JSON.parse(JSON.stringify(sourceQuests)) as QuestData[];

        const newProjectData: ProjectData = {
            metadata: newMeta,
            quests: copiedQuests,
        };

        const updatedIndex = [...projects, newMeta];

        await idbSet(PROJECT_DATA_PREFIX + newId, newProjectData);
        await idbSet(PROJECTS_INDEX_KEY, updatedIndex);
        await idbSet(ACTIVE_PROJECT_KEY, newId);

        set({
            projects: updatedIndex,
            activeProjectId: newId,
        });

        useQuestStore.getState().initFromProject(newId, copiedQuests);
        return newId;
    },

    updateProjectMetadata: async (projectId: string, patch: Partial<ProjectMetadata>) => {
        const { projects } = get();
        const idx = projects.findIndex((p) => p.id === projectId);
        if (idx === -1) return;

        const updatedMeta: ProjectMetadata = {
            ...projects[idx],
            ...patch,
            updatedAt: Date.now(),
        };

        const updatedIndex = [...projects];
        updatedIndex[idx] = updatedMeta;

        try {
            const currentData = (await idbGet(PROJECT_DATA_PREFIX + projectId)) as ProjectData | undefined;
            if (currentData) {
                currentData.metadata = updatedMeta;
                await idbSet(PROJECT_DATA_PREFIX + projectId, currentData);
            }
            await idbSet(PROJECTS_INDEX_KEY, updatedIndex);
            set({ projects: updatedIndex });
        } catch (err) {
            console.error("Erreur mise à jour métadonnées projet:", err);
        }
    },

    deleteProject: async (projectId: string) => {
        const { projects, activeProjectId } = get();
        if (projects.length <= 1) {
            return { success: false, error: "Impossible de supprimer le dernier projet restant." };
        }

        const updatedIndex = projects.filter((p) => p.id !== projectId);
        const nextActiveId = activeProjectId === projectId ? updatedIndex[0].id : activeProjectId;

        try {
            await idbDel(PROJECT_DATA_PREFIX + projectId);
            await idbSet(PROJECTS_INDEX_KEY, updatedIndex);
            await idbSet(ACTIVE_PROJECT_KEY, nextActiveId);

            set({
                projects: updatedIndex,
                activeProjectId: nextActiveId,
            });

            if (activeProjectId === projectId) {
                const nextData = (await idbGet(PROJECT_DATA_PREFIX + nextActiveId)) as ProjectData | undefined;
                useQuestStore.getState().initFromProject(nextActiveId, nextData?.quests || []);
            }

            return { success: true };
        } catch (err: any) {
            console.error("Erreur suppression projet:", err);
            return { success: false, error: err?.message || "Erreur de suppression" };
        }
    },

    saveActiveProjectQuests: async (quests: QuestData[]) => {
        const { activeProjectId, projects } = get();
        const idx = projects.findIndex((p) => p.id === activeProjectId);
        if (idx === -1) return;

        const updatedMeta: ProjectMetadata = {
            ...projects[idx],
            questCount: quests.length,
            updatedAt: Date.now(),
        };

        const updatedProjects = [...projects];
        updatedProjects[idx] = updatedMeta;

        const projectData: ProjectData = {
            metadata: updatedMeta,
            quests,
        };

        try {
            await idbSet(PROJECT_DATA_PREFIX + activeProjectId, projectData);
            await idbSet(PROJECTS_INDEX_KEY, updatedProjects);
            set({ projects: updatedProjects });
        } catch (err) {
            console.error("Erreur sauvegarde projet dans IndexedDB:", err);
        }
    },

    getActiveNamespace: () => {
        const { projects, activeProjectId } = get();
        const active = projects.find((p) => p.id === activeProjectId);
        return active?.namespace || "questslib";
    },
}));

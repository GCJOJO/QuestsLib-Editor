import { create } from "zustand";
import { produce } from "immer";
import type { QuestData, TaskData } from "../types/QuestTypes";
import { useProjectStore } from "./useProjectStore";

type Path = (string | number)[];

export type SaveStatus = "saved" | "saving" | "error";

const DEFAULT_QUESTS: QuestData[] = [
    {
        id: "questslib:quest_1",
        name: "my first quest",
        description: "this is my first quest",
        tasks: [
            {
                task: "questslib:stat",
                id: "questslib:quest_1_collect_dirt",
                name: "Collect 10 dirt",
                stat_type: "item",
                target: "minecraft:dirt",
                amount: 10,
            },
        ],
        rewards: [
            {
                reward: "questslib:item",
                item: "minecraft:diamond",
                amount: 1,
            },
        ],
    },
];

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function persistQuests(quests: QuestData[], onStatusChange: (status: SaveStatus) => void) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

    onStatusChange("saving");
    saveDebounceTimer = setTimeout(async () => {
        try {
            await useProjectStore.getState().saveActiveProjectQuests(quests);
            onStatusChange("saved");
        } catch (err) {
            console.error("Failed to save project quests:", err);
            onStatusChange("error");
        }
    }, 400);
}

interface QuestStore {
    currentProjectId: string | null;
    quests: QuestData[];
    selectedQuestId: string | null;
    isLoading: boolean;
    saveStatus: SaveStatus;

    initFromProject: (projectId: string, quests: QuestData[]) => void;
    setSelectedQuest: (id: string | null) => void;
    addQuest: (quest: QuestData) => void;
    deleteQuest: (questId: string) => void;
    updateValueAt: (path: Path, value: unknown) => void;
    duplicateQuest: (questId: string, newQuestId: string) => void;
    setQuests: (quests: QuestData[]) => Promise<void>;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
    currentProjectId: "project_default",
    quests: DEFAULT_QUESTS,
    selectedQuestId: "questslib:quest_1",
    isLoading: false,
    saveStatus: "saved",

    initFromProject: (projectId, loadedQuests) => {
        const nextQuests = loadedQuests && loadedQuests.length > 0 ? loadedQuests : DEFAULT_QUESTS;
        set({
            currentProjectId: projectId,
            quests: nextQuests,
            selectedQuestId: nextQuests[0]?.id || null,
            isLoading: false,
            saveStatus: "saved",
        });
    },

    setSelectedQuest: (id) => set({ selectedQuestId: id }),

    addQuest: (quest) => {
        const nextQuests = produce(get().quests, (draft) => {
            draft.push(quest);
        });
        set({
            quests: nextQuests,
            selectedQuestId: quest.id,
        });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    deleteQuest: (questId) => {
        const currentQuests = get().quests;
        const nextQuests = currentQuests.filter((q) => q.id !== questId);
        const nextSelected = nextQuests.length > 0 ? nextQuests[0].id : null;

        set({
            quests: nextQuests,
            selectedQuestId: nextSelected,
        });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    updateValueAt: (path, value) => {
        const nextQuests = produce(get().quests, (draft: any) => {
            const adjustedPath = path[0] === "quests" ? path.slice(1) : path;
            let current = draft;
            for (let i = 0; i < adjustedPath.length - 1; i++) {
                current = current[adjustedPath[i]];
            }
            current[adjustedPath[adjustedPath.length - 1]] = value;
        });

        set({ quests: nextQuests });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    duplicateQuest: (questId, newQuestId) => {
        const nextQuests = produce(get().quests, (draft) => {
            const originalIndex = draft.findIndex((q) => q.id === questId);
            if (originalIndex === -1) return;

            const copy = JSON.parse(JSON.stringify(draft[originalIndex])) as QuestData;
            copy.id = newQuestId;
            copy.name = `${copy.name} (Copie)`;

            const regenerateTaskIds = (tasks: TaskData[]) => {
                tasks.forEach((task) => {
                    task.id = `${task.id}_copy`;
                    if (task.subtasks) regenerateTaskIds(task.subtasks);
                });
            };

            if (copy.tasks) regenerateTaskIds(copy.tasks);
            draft.push(copy);
        });

        set({
            quests: nextQuests,
            selectedQuestId: newQuestId,
        });
        persistQuests(nextQuests, (status) => set({ saveStatus: status }));
    },

    setQuests: async (newQuests) => {
        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

        set({
            quests: newQuests,
            selectedQuestId: newQuests.length > 0 ? newQuests[0].id : null,
            saveStatus: "saving",
        });

        try {
            await useProjectStore.getState().saveActiveProjectQuests(newQuests);
            set({ saveStatus: "saved" });
        } catch (err) {
            console.error("Failed to save imported quests to project:", err);
            set({ saveStatus: "error" });
        }
    },
}));
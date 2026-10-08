import { create } from "zustand";
import { produce } from "immer";
import type { QuestData, TaskData } from "../types/QuestTypes";

type Path = (string | number)[];

type QuestStore = {
    quests: QuestData[];
    selectedQuestId: string | null;


    setSelectedQuest: (id: string | null) => void;
    addQuest: (quest: QuestData) => void;
    updateValueAt: (path: Path, value: unknown) => void;
    duplicateQuest: (questId: string, newQuestId: string) => void;
};

export const useQuestStore = create<QuestStore>((set) => ({
    quests: [
        {
            id: "questslib:first_quest",
            name: "Hello World !",
            description: "Your first quest !",
            tasks: [
                {
                    task: "questslib:stat",
                    id: "mymod:first_quest_task_dirt",
                    name: "Get 10 Dirt",
                    target: "minecraft:dirt",
                    amount: 10,
                },
            ],
        },
    ],
    selectedQuestId: "questslib:first_quest",

    setSelectedQuest: (id) => set({ selectedQuestId: id }),

    addQuest: (quest) =>
        set(
            produce((draft: QuestStore) => {
                draft.quests.push(quest);
                draft.selectedQuestId = quest.id;
            })
        ),

    // Edit a specific property on an object
    // ["quests", 0, "tasks", 1, "name"]
    updateValueAt: (path, value) =>
        set(
            produce((draft: QuestStore) => {
                let current: any = draft;
                for (let i = 0; i < path.length - 1; i++) {
                    current = current[path[i]];
                }
                current[path[path.length - 1]] = value;
            })
        ),

    duplicateQuest: (questId, newQuestId) =>
        set(
            produce((draft: QuestStore) => {
                const originalIndex = draft.quests.findIndex((q) => q.id === questId);
                if (originalIndex === -1) return;

                const copy = JSON.parse(JSON.stringify(draft.quests[originalIndex])) as QuestData;
                copy.id = newQuestId;
                copy.name = `${copy.name} (Copie)`;

                // Fonction récursive pour postfixer les IDs des tâches
                const regenerateTaskIds = (tasks: TaskData[]) => {
                    tasks.forEach((task) => {
                        task.id = `${task.id}_copy`;
                        if (task.subtasks) regenerateTaskIds(task.subtasks);
                    });
                };

                if (copy.tasks) regenerateTaskIds(copy.tasks);
                draft.quests.push(copy);
            })
        ),
}));
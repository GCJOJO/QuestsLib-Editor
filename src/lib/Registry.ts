import type { EntityDefinition, QuestData, TaskData, RewardData, ExtensionPackage } from "../types/QuestTypes.ts";

class Registry {
    private baseTasks = new Map<string, EntityDefinition>();
    private baseRewards = new Map<string, EntityDefinition>();

    private extensionTasks = new Map<string, { extensionId: string; def: EntityDefinition }>();
    private extensionRewards = new Map<string, { extensionId: string; def: EntityDefinition }>();

    private listeners = new Set<() => void>();

    public readonly questDefinition: EntityDefinition = {
        typeId: "questslib:quest",
        label: "Quest",
        fields: [
            { key: "id", label: "Quest ID", type: "text", required: true },
            { key: "name", label: "Name", type: "text", required: true },
            { key: "description", label: "Description", type: "text", multiline: true },
            { key: "tasks", label: "Tasks", type: "taskList" },
            { key: "rewards", label: "Rewards", type: "rewardList" },
        ]
    };

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach((l) => l());
    }

    registerBaseTask(taskDef: EntityDefinition) {
        this.baseTasks.set(taskDef.typeId, taskDef);
        this.notify();
    }

    registerBaseReward(rewardDef: EntityDefinition) {
        this.baseRewards.set(rewardDef.typeId, rewardDef);
        this.notify();
    }

    registerExtension(pkg: ExtensionPackage) {
        if (pkg.tasks) {
            pkg.tasks.forEach((t) => {
                this.extensionTasks.set(t.typeId, { extensionId: pkg.id, def: t });
            });
        }
        if (pkg.rewards) {
            pkg.rewards.forEach((r) => {
                this.extensionRewards.set(r.typeId, { extensionId: pkg.id, def: r });
            });
        }
        this.notify();
    }

    unregisterExtension(extensionId: string) {
        for (const [key, item] of this.extensionTasks.entries()) {
            if (item.extensionId === extensionId) {
                this.extensionTasks.delete(key);
            }
        }
        for (const [key, item] of this.extensionRewards.entries()) {
            if (item.extensionId === extensionId) {
                this.extensionRewards.delete(key);
            }
        }
        this.notify();
    }

    clearExtensions() {
        this.extensionTasks.clear();
        this.extensionRewards.clear();
        this.notify();
    }

    getTaskDef(typeId: string): EntityDefinition | undefined {
        return this.extensionTasks.get(typeId)?.def || this.baseTasks.get(typeId);
    }

    getRewardDef(typeId: string): EntityDefinition | undefined {
        return this.extensionRewards.get(typeId)?.def || this.baseRewards.get(typeId);
    }

    getTaskTypes(): { typeId: string; label: string }[] {
        const types: { typeId: string; label: string }[] = [];
        this.baseTasks.forEach((t) => types.push({ typeId: t.typeId, label: t.label }));
        this.extensionTasks.forEach(({ def }) => types.push({ typeId: def.typeId, label: def.label }));
        return types;
    }

    getRewardTypes(): { typeId: string; label: string }[] {
        const types: { typeId: string; label: string }[] = [];
        this.baseRewards.forEach((r) => types.push({ typeId: r.typeId, label: r.label }));
        this.extensionRewards.forEach(({ def }) => types.push({ typeId: def.typeId, label: def.label }));
        return types;
    }

    createDefaultQuest(id: string): QuestData {
        return {
            id,
            name: "New Quest",
            description: "",
            tasks: [],
            rewards: [],
        };
    }

    createDefaultTask(typeId: string, customId: string): TaskData {
        const def = this.getTaskDef(typeId);
        const task: TaskData = { task: typeId, id: customId };

        if (def) {
            def.fields.forEach((f) => {
                if (f.defaultValue !== undefined && f.key !== "id") {
                    task[f.key] = f.defaultValue;
                }
            });
        }

        if (typeId === "questslib:all" || typeId === "questslib:any") {
            task.subtasks = [];
        }

        return task;
    }

    createDefaultReward(typeId: string): RewardData {
        const def = this.getRewardDef(typeId);
        const reward: RewardData = { reward: typeId };

        if (def) {
            def.fields.forEach((f) => {
                if (f.defaultValue !== undefined && f.key !== "reward") {
                    reward[f.key] = f.defaultValue;
                }
            });
        }

        return reward;
    }
}

export const registry = new Registry();

// Tâche Statistique
registry.registerBaseTask({
    typeId: "questslib:stat",
    label: "Stat Task",
    fields: [
        { key: "id", label: "Task ID", type: "text", required: true },
        { key: "name", label: "Name", type: "text" },
        {
            key: "stat_type",
            label: "Type",
            type: "select",
            defaultValue: "item",
            options: [
                { value: "item", label: "Item" },
                { value: "craft", label: "Craft" },
                { value: "placed_blocks", label: "Placed Blocks" },
                { value: "broken_blocks", label: "Broken Blocks" },
                { value: "killed_mobs", label: "Killed Mobs" },
            ]
        },
        {
            key: "target",
            label: "Target",
            type: "registrySelector",
            defaultValue: "minecraft:dirt",
            registryTypeResolver: (data: Record<string, any>) => {
                if (data.stat_type === "broken_blocks" || data.stat_type === "placed_blocks") return "blocks";
                if (data.stat_type === "killed_mobs") return "entities";
                return "items";
            },
        },
        { key: "amount", label: "Amount", type: "number", defaultValue: 1 },
        { key: "rewards", label: "Task Rewards", type: "rewardList" },
    ]
});

// Tâche Localisation
registry.registerBaseTask({
    typeId: "questslib:location",
    label: "Location Task",
    fields: [
        { key: "id", label: "Task ID", type: "text", required: true },
        { key: "name", label: "Name", type: "text" },
        {
            key: "location_type",
            label: "Type",
            type: "select",
            defaultValue: "biome",
            options: [
                { value: "biome", label: "Biome" },
                { value: "structure", label: "Structure" },
            ]
        },
        {
            key: "location",
            label: "Location",
            type: "registrySelector",
            defaultValue: "minecraft:jungle",
            registryTypeResolver: (data: Record<string, any>) => {
                return data.location_type === "structure" ? "structures" : "biomes";
            },
        },
        { key: "rewards", label: "Task Rewards", type: "rewardList" },
    ]
});

// Tâche Any of...
registry.registerBaseTask({
    typeId: "questslib:any",
    label: "Any of...",
    fields: [
        { key: "id", label: "Task ID", type: "text", required: true },
        { key: "name", label: "Name", type: "text" },
        { key: "subtasks", label: "Subtasks", type: "taskList", required: true },
        { key: "rewards", label: "Task Rewards", type: "rewardList" },
    ]
});

// Tâche All of...
registry.registerBaseTask({
    typeId: "questslib:all",
    label: "All of...",
    fields: [
        { key: "id", label: "Task ID", type: "text", required: true },
        { key: "name", label: "Name", type: "text" },
        { key: "subtasks", label: "Subtasks", type: "taskList", required: true },
        { key: "rewards", label: "Task Rewards", type: "rewardList" },
    ]
});

// Récompense Item
registry.registerBaseReward({
    typeId: "questslib:item",
    label: "Item",
    fields: [
        {
            key: "item",
            label: "Item",
            type: "registrySelector",
            registryType: "items",
            required: true,
            defaultValue: "minecraft:diamond",
        },
        { key: "amount", label: "Amount", type: "number", required: true, defaultValue: 1 }
    ]
});

// Récompense Loot Table
registry.registerBaseReward({
    typeId: "questslib:loot_table",
    label: "Loot Table",
    fields: [
        { key: "loot_table", label: "Loot Table", type: "text", required: true, defaultValue: "minecraft:chests/simple_dungeon" }
    ]
});

// Récompense Expérience
registry.registerBaseReward({
    typeId: "questslib:experience",
    label: "Experience",
    fields: [
        { key: "points", label: "Points", type: "number" },
        { key: "levels", label: "Levels", type: "number" },
    ]
});
import type { EntityDefinition, QuestData, TaskData, RewardData } from "../types/QuestTypes.ts";

class Registry {
    private tasks = new Map<string, EntityDefinition>();
    private rewards = new Map<string, EntityDefinition>();

    public readonly questDefinition : EntityDefinition = {
        typeId: "questslib:quest",
        label : "Quest",
        fields : [
            { key : "id", label : "Quest ID", type : "text", required: true },
            { key : "name", label : "Name", type : "text", required: true },
            { key : "description", label : "Description", type : "text", multiline: true },
            { key: "tasks", label : "Tasks", type : "taskList", },
            { key: "rewards", label : "Rewards", type : "rewardList" },
        ]
    };

    registerTask(taskDef : EntityDefinition) {
        this.tasks.set(taskDef.typeId, taskDef);
    }

    registerReward(rewardDef : EntityDefinition) {
        this.rewards.set(rewardDef.typeId, rewardDef);
    }

    getTaskDef(typeId : string): EntityDefinition | undefined {
        return this.tasks.get(typeId);
    }

    getRewardDef(typeId : string): EntityDefinition | undefined {
        return this.rewards.get(typeId);
    }

    getTaskTypes(): { typeId: string, label : string }[] {
        return Array.from(this.tasks.values()).map((t) => ({typeId : t.typeId, label : t.label}));
    }

    getRewardTypes() : { typeId: string, label : string }[] {
        return Array.from(this.rewards.values()).map((t) => ({typeId : t.typeId, label: t.label}));
    }

    createDefaultQuest(id: string): QuestData {
        return {
            id,
            name: "New Quest",
            tasks: [],
        };
    }

    createDefaultTask(typeId : string, customId : string): TaskData {
        const def = this.tasks.get(typeId);
        const task : TaskData = { task : typeId, id : customId };

        if(def){
            def.fields.forEach(f => {
                if(f.defaultValue !== undefined && f.key !== "id"){
                    task[f.key] = f.defaultValue;
                }
            });
        }

        if(typeId === "questslib:all" || typeId === "questslib:any") {
            task.subtasks = [];
        }

        return task;
    }

    createDefaultReward(typeId : string) : RewardData {
        const def = this.tasks.get(typeId);
        const reward : RewardData = { reward: typeId };

        if(def){
            def.fields.forEach(f => {
                if(f.defaultValue !== undefined && f.key !== "id"){
                    reward[f.key] = f.defaultValue;
                }
            })
        }

        return reward;
    }
}

export const registry = new Registry();

registry.registerTask({
    typeId : "questslib:stat",
    label : "Stat Task",
    fields : [
        { key: "id", label: "Task ID", type: "text", required: true },
        { key: "name", label: "Name", type: "text" },
        { key: "stat_type", label: "Type", type: "select", defaultValue: "questslib:item", options : [
                { value : "questslib:item", label : "Item" },
                { value : "questslib:craft", label : "Crafts" },
                { value : "questslib:placed_blocks", label : "Placed Blocks" },
                { value : "questslib:broken_blocks", label : "Broken Blocks" },
                { value : "questslib:killed_mobs", label : "Killed Mobs" },
            ] },
        { key: "target", label: "Target", type: "text", defaultValue: "minecraft:dirt" },
        { key: "amount", label: "Amount", type: "number", defaultValue: 1 },
        { key: "rewards", label: "Task Rewards", type: "rewardList" },
    ]
});

registry.registerTask({
    typeId : "questslib:location",
    label : "Location Task",
    fields : [
        { key: "id", label: "Task ID", type: "text", required: true },
        { key: "name", label: "Name", type: "text" },
        { key: "location_type", label: "Type", type: "select", defaultValue: "questslib:biome", options : [
                { value : "questslib:biome", label : "Biome" },
                { value : "questslib:structure", label : "Structure" },
            ] },
        { key: "target", label: "Target", type: "text", defaultValue: "minecraft:plains" },
        { key: "rewards", label: "Task Rewards", type: "rewardList" },
    ]
});

registry.registerTask({
    typeId : "questslib:any",
    label : "Any of...",
    fields : [
        { key : "subtasks", label: "Subtasks", type: "taskList", required: true },
    ]
});

registry.registerTask({
    typeId : "questslib:all",
    label : "All of...",
    fields : [
        { key : "subtasks", label: "Subtasks", type: "taskList", required: true },
    ]
});

registry.registerReward({
    typeId : "questslib:item",
    label : "Item",
    fields : [
        { key : "item", label: "Item", type: "text", required: true },
        { key : "amount", label: "Amount", type: "number", required: true }
    ]
})

registry.registerReward({
    typeId : "questslib:experience",
    label : "Experience",
    fields : [
        { key: "points", label: "Points", type: "number" },
        { key: "levels", label: "Levels", type: "number" },
    ]
})
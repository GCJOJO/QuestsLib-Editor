import type {EntityDefinition, FieldDefinition} from "../types/QuestTypes.ts";
import {useQuestStore} from "../store/useQuestStore.ts";
import TaskList from "./Tasks/TaskList.tsx";
import FormField from "./Forms/FormField.tsx";
import RewardList from "./Rewards/RewardList.tsx";

interface DynamicFormProps {
    definition: EntityDefinition;
    data: Record<string, any>;
    path: (string | number)[];
    depth?: number;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ definition, data, path, depth = 0 }) => {
    const updateValueAt = useQuestStore((state) => state.updateValueAt);

    return (
        <div>
            {definition.fields.map((field: FieldDefinition) => {
                if (field.type === "taskList") {
                    return (
                        <TaskList
                            key={field.key}
                            label={field.label}
                            tasks={data[field.key] || []}
                            path={[...path, field.key]}
                            depth={depth} // Conserve/transmet la profondeur actuelle
                        />
                    );
                }

                if (field.type === "rewardList") {
                    return (
                        <RewardList
                            key={field.key}
                            label={field.label}
                            rewards={data[field.key] || []}
                            path={[...path, field.key]}
                            depth={depth}
                        />
                    );
                }

                return (
                    <FormField
                        key={field.key}
                        field={field}
                        value={data[field.key]}
                        onChange={(val) => updateValueAt([...path, field.key], val)}
                        parentData={data}
                    />
                );
            })}
        </div>
    );
};
import React, { useState } from "react";
import { DynamicForm } from "../DynamicForm";
import { TaskPickerModal } from "./TaskPickerModal";
import Button from "../UI/Button";
import { registry } from "../../data/Registry";
import { useQuestStore } from "../../store/useQuestStore";
import { getDepthColor } from "../../utils/Colors";
import "../../styles/components.css";

interface TaskListProps {
    label: string;
    tasks: any[];
    path: (string | number)[];
    depth?: number;
}

const TaskList: React.FC<TaskListProps> = ({ label, tasks, path, depth = 0 }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});

    const updateValueAt = useQuestStore((state) => state.updateValueAt);
    const color = getDepthColor(depth);

    const toggleFold = (key: string) => {
        setCollapsedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddTask = (typeId: string) => {
        const customId = prompt("Task ID :", `task_${Date.now()}`);
        if (!customId) return;

        const newTask = registry.createDefaultTask(typeId, customId);
        updateValueAt(path, [...tasks, newTask]);
    };

    return (
        <div className="task-list-container">
            <h4 className="task-list-title">{label}</h4>

            {tasks.map((task, index) => {
                const taskDef = registry.getTaskDef(task.task);
                if (!taskDef) return <div key={index} className="task-unknown">Unknow task type : {task.task}</div>;

                const taskKey = `task_${index}`;
                const isCollapsed = collapsedTasks[taskKey];

                return (
                    <div
                        key={taskKey}
                        className="godot-task-card"
                        style={{
                            borderColor: color, // Bordure Godot personnalisée[cite: 3]
                            borderLeftWidth: "6px",
                        }}
                    >
                        {/* En-tête cliquable pour Fold/Unfold */}
                        <div
                            className="godot-task-header"
                            style={{ backgroundColor: `${color}22` }} // Fond légèrement teinté[cite: 3]
                            onClick={() => toggleFold(taskKey)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="fold-icon">{isCollapsed ? "▶" : "▼"}</span>
                                <span className="godot-task-badge" style={{ backgroundColor: color }}>
                  {taskDef.label}
                </span>
                                <span className="godot-task-id">{task.id}</span>
                            </div>
                        </div>

                        {/* Contenu affiché uniquement si NON replié */}
                        {!isCollapsed && (
                            <div className="godot-task-body">
                                <DynamicForm
                                    definition={taskDef}
                                    data={task}
                                    path={[...path, index]}
                                    depth={depth + 1} // Transmet la profondeur aux sous-tâches
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            <Button onClick={() => setIsModalOpen(true)}>+ Ajouter une tâche</Button>

            <TaskPickerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelectTaskType={handleAddTask}
            />
        </div>
    );
};

export default TaskList;
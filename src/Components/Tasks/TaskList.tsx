import React, { useState } from "react";
import { DynamicForm } from "../DynamicForm";
import { TaskPickerModal } from "./TaskPickerModal";
import Button from "../UI/Button";
import { registry } from "../../lib/Registry.ts";
import { useQuestStore } from "../../store/useQuestStore";
import { useProjectStore } from "../../store/useProjectStore";
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
    const getActiveNamespace = useProjectStore((state) => state.getActiveNamespace);
    const color = getDepthColor(depth);

    const toggleFold = (key: string) => {
        setCollapsedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddTask = (typeId: string) => {
        const ns = getActiveNamespace();
        const defaultId = `${ns}:task_${tasks.length + 1}`;
        const inputId = prompt("Identifiant de la tâche :", defaultId);
        if (!inputId || !inputId.trim()) return;

        const finalId = inputId.trim().includes(":") ? inputId.trim() : `${ns}:${inputId.trim()}`;
        const newTask = registry.createDefaultTask(typeId, finalId);
        updateValueAt(path, [...tasks, newTask]);
    };

    const handleDeleteTask = (taskIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextTasks = tasks.filter((_, idx) => idx !== taskIndex);
        updateValueAt(path, nextTasks);
    };

    return (
        <div className="task-list-container">
            <h4 className="task-list-title">{label}</h4>

            {tasks.map((task, index) => {
                const taskDef = registry.getTaskDef(task.task);
                if (!taskDef) return <div key={index} className="task-unknown">Unknown task type : {task.task}</div>;

                const taskKey = `task_${index}`;
                const isCollapsed = collapsedTasks[taskKey];

                return (
                    <div
                        key={taskKey}
                        className="godot-task-card"
                        style={{
                            borderColor: color,
                            borderLeftWidth: "6px",
                        }}
                    >
                        {/* En-tête cliquable pour Fold/Unfold */}
                        <div
                            className="godot-task-header"
                            style={{ backgroundColor: `${color}22` }}
                            onClick={() => toggleFold(taskKey)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="fold-icon">{isCollapsed ? "▶" : "▼"}</span>
                                <span className="godot-task-badge" style={{ backgroundColor: color }}>
                                    {taskDef.label}
                                </span>
                                <span className="godot-task-id">{task.id}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteTask(index, e)}
                                title="Supprimer la tâche"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#ff6b6b",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                }}
                            >
                                ✕
                            </button>
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
import React, { useState, useMemo } from "react";
import Modal from "../UI/Modal";
import { registry } from "../../data/Registry";
import "../../styles/components.css";
import {VerticalSpacer} from "../Spacer.tsx";

interface TaskPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTaskType: (typeId: string) => void;
}

export const TaskPickerModal: React.FC<TaskPickerModalProps> = ({ isOpen, onClose, onSelectTaskType }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const taskTypes = registry.getTaskTypes();

    // Filtrage dynamique selon le terme recherché
    const filteredTasks = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return taskTypes;

        return taskTypes.filter(
            (t) =>
                t.label.toLowerCase().includes(term) ||
                t.typeId.toLowerCase().includes(term)
        );
    }, [searchTerm, taskTypes]);

    const handleClose = () => {
        setSearchTerm(""); // Réinitialise la recherche à la fermeture
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title="Add a new Task" onClose={handleClose}>
            {/* Barre de recherche */}
            <input
                type="text"
                placeholder="Search Task (ex: Stat, Location, Any, All...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="task-picker-search-input"
                autoFocus
            />

            <VerticalSpacer size={"2vh"}/>

            {/* Liste verticale */}
            <div className="task-picker-list">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((t) => {
                        const [namespace] = t.typeId.includes(":") ? t.typeId.split(":") : ["general"];

                        return (
                            <button
                                key={t.typeId}
                                className="task-picker-item-btn"
                                onClick={() => {
                                    onSelectTaskType(t.typeId);
                                    handleClose();
                                }}>
                                <div className="task-picker-item-header">
                                    <span className="task-picker-item-label">{t.label}</span>
                                    <span className="task-picker-item-badge">{namespace}</span>
                                </div>
                                <small style={{ color: "#aaaaaa", fontSize: "11px" }}>{t.typeId}</small>
                            </button>
                        );
                    })
                ) : (
                    <div className="task-picker-no-result">
                        Aucune tâche ne correspond à "{searchTerm}"
                    </div>
                )}
            </div>
        </Modal>
    );
};
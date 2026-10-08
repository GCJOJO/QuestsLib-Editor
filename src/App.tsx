import React from "react";
import { useQuestStore } from "./store/useQuestStore";
import { registry } from "./data/Registry";
import { DynamicForm } from "./Components/DynamicForm";
import "./App.css";
import JsonPreview from "./Components/JSONPreview.tsx";

export const App: React.FC = () => {
    const { quests, selectedQuestId, setSelectedQuest, addQuest } = useQuestStore();

    const selectedQuestIndex = quests.findIndex((q) => q.id === selectedQuestId);
    const selectedQuest = quests[selectedQuestIndex];

    const handleCreateQuest = () => {
        const id = prompt("Enter new quest id :", `quest_${quests.length + 1}`);
        if (!id) return;
        addQuest(registry.createDefaultQuest(id));
    };

    return (
        <div className="app-container">
            {/* Quest Navigation */}
            <div className="quest-navigation">
                <button onClick={handleCreateQuest} className="create-quest-btn">
                    + New Quest
                </button>
                <ul className="quest-list">
                    {quests.map((q) => (
                        <li
                            key={q.id}
                            onClick={() => setSelectedQuest(q.id)}
                            className={`quest-item ${q.id === selectedQuestId ? "selected" : ""}`}>
                            <strong>{q.name}</strong>
                            <br />
                            <small className="quest-item-id">{q.id}</small>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Edit Window */}
            <div className="main-editor">
                {selectedQuest ? (
                    <DynamicForm
                        definition={registry.questDefinition}
                        data={selectedQuest}
                        path={["quests", selectedQuestIndex]}
                    />) :
                    (<p>Select a quest to begin editing</p>
                )}
            </div>

            {/* Generated JSON Preview */}
            {/*<JsonPreview data={selectedQuest}/>*/}
        </div>
    );
};

export default App;
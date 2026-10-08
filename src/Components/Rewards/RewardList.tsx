import React, { useState } from "react";
import { DynamicForm } from "../DynamicForm";
import { RewardPickerModal } from "./RewardPickerModal";
import Button from "../UI/Button";
import { registry } from "../../lib/Registry.ts";
import { useQuestStore } from "../../store/useQuestStore";
import { getDepthColor } from "../../utils/Colors";
import "../../styles/components.css";

interface RewardListProps {
    label: string;
    rewards: any[];
    path: (string | number)[];
    depth?: number;
}

const RewardList: React.FC<RewardListProps> = ({
                                                   label,
                                                   rewards,
                                                   path,
                                                   depth = 0,
                                               }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [collapsedRewards, setCollapsedRewards] = useState<Record<string, boolean>>({});

    const updateValueAt = useQuestStore((state) => state.updateValueAt);
    const color = getDepthColor(depth + 1); // Décalage de couleur pour différencier des tâches

    const toggleFold = (key: string) => {
        setCollapsedRewards((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddReward = (typeId: string) => {
        const newReward = registry.createDefaultReward(typeId);
        updateValueAt(path, [...rewards, newReward]);
    };

    const handleDeleteReward = (rewardIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextRewards = rewards.filter((_, idx) => idx !== rewardIndex);
        updateValueAt(path, nextRewards);
    };

    return (
        <div className="task-list-container" style={{ borderColor: color }}>
            <h4 className="task-list-title">{label}</h4>

            {rewards.map((reward, index) => {
                const rewardDef = registry.getRewardDef(reward.reward);
                if (!rewardDef) {
                    return (
                        <div key={index} className="task-unknown">
                            Type de récompense inconnu : {reward.reward}
                        </div>
                    );
                }

                const rewardKey = `reward_${index}`;
                const isCollapsed = collapsedRewards[rewardKey];

                return (
                    <div
                        key={index}
                        className="godot-task-card"
                        style={{ borderColor: color, borderLeftWidth: "6px" }}
                    >
                        <div
                            className="godot-task-header"
                            style={{ backgroundColor: `${color}22` }}
                            onClick={() => toggleFold(rewardKey)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="fold-icon">{isCollapsed ? "▶" : "▼"}</span>
                                <span className="godot-task-badge" style={{ backgroundColor: color }}>
                                    {rewardDef.label}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteReward(index, e)}
                                title="Supprimer la récompense"
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

                        {!isCollapsed && (
                            <div className="godot-task-body">
                                <DynamicForm
                                    definition={rewardDef}
                                    data={reward}
                                    path={[...path, index]}
                                    depth={depth + 1}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            <Button onClick={() => setIsModalOpen(true)}>+ Add a Reward</Button>

            <RewardPickerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelectRewardType={handleAddReward}
            />
        </div>
    );
};

export default RewardList;
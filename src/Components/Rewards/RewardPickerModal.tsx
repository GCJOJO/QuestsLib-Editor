import React, { useState, useMemo } from "react";
import Modal from "../UI/Modal";
import { registry } from "../../lib/Registry.ts";
import { useExtensionStore } from "../../extensions/useExtensionStore.ts";
import "../../styles/components.css";

interface RewardPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRewardType: (typeId: string) => void;
}

export const RewardPickerModal: React.FC<RewardPickerModalProps> = ({
                                                                        isOpen,
                                                                        onClose,
                                                                        onSelectRewardType,
                                                                    }) => {
    const [searchTerm, setSearchTerm] = useState("");
    useExtensionStore((state) => state.extensions); // souscrit aux changements d'extensions
    const rewardTypes = registry.getRewardTypes();

    const filteredRewards = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return rewardTypes;
        return rewardTypes.filter(
            (r) =>
                r.label.toLowerCase().includes(term) ||
                r.typeId.toLowerCase().includes(term)
        );
    }, [searchTerm, rewardTypes]);

    const handleClose = () => {
        setSearchTerm("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title="Add a new Reward" onClose={handleClose}>
            <input
                type="text"
                placeholder="Search a Reward (ex: Item, XP...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="task-picker-search-input"
                autoFocus
            />

            <div className="task-picker-list">
                {filteredRewards.length > 0 ? (
                    filteredRewards.map((r) => {
                        const [namespace] = r.typeId.includes(":")
                            ? r.typeId.split(":")
                            : ["general"];

                        return (
                            <button
                                key={r.typeId}
                                className="task-picker-item-btn"
                                onClick={() => {
                                    onSelectRewardType(r.typeId);
                                    handleClose();
                                }}
                            >
                                <div className="task-picker-item-header">
                                    <span className="task-picker-item-label">{r.label}</span>
                                    <span className="task-picker-item-badge">{namespace}</span>
                                </div>
                                <small style={{ color: "#aaaaaa", fontSize: "11px" }}>
                                    {r.typeId}
                                </small>
                            </button>
                        );
                    })
                ) : (
                    <div className="task-picker-no-result">
                        No corresponding result for "{searchTerm}"
                    </div>
                )}
            </div>
        </Modal>
    );
};
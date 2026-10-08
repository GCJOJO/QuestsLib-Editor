import React, { useState, useRef } from "react";
import Modal from "../UI/Modal";
import Button from "../UI/Button";
import { useDatasetStore, validateDatasetJson } from "../../store/useDatasetStore";

interface DatasetManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DatasetManagerModal: React.FC<DatasetManagerModalProps> = ({ isOpen, onClose }) => {
    const { datasets, activeDatasetId, importDataset, deleteDataset, setActiveDataset } = useDatasetStore();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = JSON.parse(text);
                const res = validateDatasetJson(parsed);

                if (!res.valid || !res.dataset) {
                    setErrorMsg(res.error || "Format de registre invalide.");
                    return;
                }

                const saveRes = await importDataset(res.dataset);
                if (saveRes.success) {
                    setSuccessMsg(`Jeu de données "${res.dataset.name}" importé avec succès !`);
                } else {
                    setErrorMsg(saveRes.error || "Erreur lors de la sauvegarde.");
                }
            } catch {
                setErrorMsg("Fichier JSON invalide. Veuillez vérifier la syntaxe.");
            }
        };

        reader.readAsText(file);
        e.target.value = "";
    };

    const handleDownloadTemplate = () => {
        const sample = {
            id: "my_modpack_dump",
            name: "Mon Modpack Personnalisé",
            version: "1.20.1",
            registries: {
                items: [
                    { id: "create:wrench", name: "Wrench" },
                    { id: "botania:lexicon", name: "Lexica Botania" },
                ],
                blocks: [
                    { id: "create:cogwheel", name: "Cogwheel" },
                ],
                biomes: [
                    { id: "biomesoplenty:origin_valley", name: "Origin Valley" },
                ],
            },
        };

        const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "modele_registre_minecraft.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Modal isOpen={isOpen} title="Données & Registres Minecraft" onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#cccccc" }}>
                    Importez des dumps de registres (items, blocs, biomes, entités) pour alimenter l'autocomplétion et les sélecteurs de vos quêtes.
                </p>

                {errorMsg && (
                    <div style={{ padding: "8px 12px", background: "#661111", borderRadius: "4px", color: "#ffcccc", fontSize: "13px" }}>
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: "8px 12px", background: "#114411", borderRadius: "4px", color: "#ccffcc", fontSize: "13px" }}>
                        {successMsg}
                    </div>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                    />
                    <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                        📥 Importer un jeu de données (.json)
                    </Button>
                    <Button variant="secondary" onClick={handleDownloadTemplate}>
                        📄 Télécharger un modèle JSON
                    </Button>
                </div>

                <div style={{ borderTop: "1px solid #3c3c3c", paddingTop: "12px" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#ffffff" }}>
                        Jeux de données disponibles ({datasets.length})
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "40vh", overflowY: "auto" }}>
                        {datasets.map((d) => {
                            const isActive = d.id === activeDatasetId;
                            const regKeys = Object.keys(d.registries);
                            const totalCount = regKeys.reduce((acc, k) => acc + (d.registries[k]?.length || 0), 0);

                            return (
                                <div
                                    key={d.id}
                                    style={{
                                        backgroundColor: isActive ? "#283428" : "#1e1e1e",
                                        border: isActive ? "1px solid #4caf50" : "1px solid #3c3c3c",
                                        borderRadius: "6px",
                                        padding: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div style={{ textAlign: "left" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <strong style={{ color: "#ffffff" }}>{d.name}</strong>
                                            {d.version && <span style={{ fontSize: "11px", color: "#888888" }}>v{d.version}</span>}
                                            {d.isDefault && (
                                                <span style={{ fontSize: "10px", padding: "2px 6px", background: "#2e7d32", borderRadius: "3px", color: "#fff" }}>
                                                    Intégré
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#aaaaaa", marginTop: "4px" }}>
                                            <span>📊 {totalCount} entrées au total</span>
                                            {regKeys.map((k) => (
                                                <span key={k}>
                                                    • {k}: {d.registries[k]?.length || 0}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {!isActive && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveDataset(d.id)}
                                                style={{
                                                    padding: "4px 10px",
                                                    background: "#333",
                                                    color: "#fff",
                                                    border: "1px solid #555",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                Activer
                                            </button>
                                        )}
                                        {isActive && (
                                            <span style={{ fontSize: "12px", color: "#81c784", fontWeight: 600 }}>
                                                ✓ Actif
                                            </span>
                                        )}
                                        {!d.isDefault && (
                                            <button
                                                type="button"
                                                onClick={() => deleteDataset(d.id)}
                                                title="Supprimer ce jeu de données"
                                                style={{
                                                    padding: "4px 8px",
                                                    background: "#c62828",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

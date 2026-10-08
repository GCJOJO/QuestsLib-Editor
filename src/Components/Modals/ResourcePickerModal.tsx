import React, { useState, useMemo } from "react";
import Modal from "../UI/Modal";
import { useDatasetStore } from "../../store/useDatasetStore";
import { MinecraftIcon } from "../UI/MinecraftIcon";
import type { GameRegistryItem } from "../../types/QuestTypes";

interface ResourcePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    registryType: string;
    title?: string;
    currentValue?: string;
    onSelect: (selectedId: string) => void;
}

export const ResourcePickerModal: React.FC<ResourcePickerModalProps> = ({
    isOpen,
    onClose,
    registryType,
    title,
    currentValue,
    onSelect,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [page, setPage] = useState(1);
    const [hoveredItem, setHoveredItem] = useState<GameRegistryItem | null>(null);

    const ITEMS_PER_PAGE = viewMode === "grid" ? 56 : 30;

    const getRegistryItems = useDatasetStore((state) => state.getRegistryItems);
    const items = useMemo(() => getRegistryItems(registryType), [getRegistryItems, registryType]);

    // Extraction des namespaces uniques
    const namespaces = useMemo(() => {
        const nsSet = new Set<string>();
        items.forEach((item) => {
            const ns = item.namespace || (item.id.includes(":") ? item.id.split(":")[0] : "minecraft");
            nsSet.add(ns);
        });
        return Array.from(nsSet).sort();
    }, [items]);

    // Filtrage dynamique
    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return items.filter((item) => {
            const ns = item.namespace || (item.id.includes(":") ? item.id.split(":")[0] : "minecraft");
            if (selectedNamespace !== "all" && ns !== selectedNamespace) {
                return false;
            }
            if (!term) return true;
            return (
                item.id.toLowerCase().includes(term) ||
                (item.name && item.name.toLowerCase().includes(term))
            );
        });
    }, [items, searchTerm, selectedNamespace]);

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredItems, page, ITEMS_PER_PAGE]);

    const handleSelect = (item: GameRegistryItem) => {
        onSelect(item.id);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            title={title || `Choisir (${registryType})`}
            onClose={onClose}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "72vh", maxHeight: "680px" }}>
                {/* Barre supérieure : Recherche + bascule vue */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <input
                            type="text"
                            className="task-picker-search-input"
                            placeholder={`Rechercher parmi ${items.length} entrées (ex: diamond, iron, jungle)...`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            autoFocus
                            style={{ marginBottom: 0, paddingRight: "30px" }}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                style={{
                                    position: "absolute",
                                    right: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "transparent",
                                    border: "none",
                                    color: "#888",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "2px", background: "#222", padding: "2px", borderRadius: "4px" }}>
                        <button
                            type="button"
                            onClick={() => { setViewMode("grid"); setPage(1); }}
                            title="Vue Grille"
                            style={{
                                padding: "6px 10px",
                                background: viewMode === "grid" ? "#388e3c" : "transparent",
                                color: "#fff",
                                border: "none",
                                borderRadius: "3px",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            ▦ Grille
                        </button>
                        <button
                            type="button"
                            onClick={() => { setViewMode("list"); setPage(1); }}
                            title="Vue Liste"
                            style={{
                                padding: "6px 10px",
                                background: viewMode === "list" ? "#388e3c" : "transparent",
                                color: "#fff",
                                border: "none",
                                borderRadius: "3px",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            ☰ Liste
                        </button>
                    </div>
                </div>

                {/* Filtres par namespace */}
                {namespaces.length > 1 && (
                    <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
                        <button
                            type="button"
                            onClick={() => { setSelectedNamespace("all"); setPage(1); }}
                            style={{
                                padding: "3px 8px",
                                borderRadius: "12px",
                                border: "1px solid #444",
                                background: selectedNamespace === "all" ? "#388e3c" : "#222",
                                color: "#fff",
                                fontSize: "11px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Tous ({items.length})
                        </button>
                        {namespaces.map((ns) => (
                            <button
                                key={ns}
                                type="button"
                                onClick={() => { setSelectedNamespace(ns); setPage(1); }}
                                style={{
                                    padding: "3px 8px",
                                    borderRadius: "12px",
                                    border: "1px solid #444",
                                    background: selectedNamespace === ns ? "#388e3c" : "#222",
                                    color: "#fff",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {ns}
                            </button>
                        ))}
                    </div>
                )}

                {/* ZONE CENTRALE : GRILLE OU LISTE */}
                <div style={{ flex: 1, overflowY: "auto", padding: "4px" }}>
                    {viewMode === "grid" ? (
                        /* VUE GRILLE INVENTAIRE MINECRAFT */
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))",
                                gap: "6px",
                            }}
                        >
                            {paginatedItems.map((item) => {
                                const isSelected = item.id === currentValue;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setHoveredItem(item)}
                                        onMouseLeave={() => setHoveredItem((curr) => (curr?.id === item.id ? null : curr))}
                                        title={`${item.name || item.id} (${item.id})`}
                                        style={{
                                            width: "54px",
                                            height: "54px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: isSelected ? "#2d4a2d" : "#232326",
                                            border: isSelected ? "2px solid #4caf50" : "2px solid #38383c",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            padding: 0,
                                            boxShadow: isSelected
                                                ? "inset 0 0 6px rgba(76, 175, 80, 0.6)"
                                                : "inset -2px -2px 0px rgba(0,0,0,0.4), inset 2px 2px 0px rgba(255,255,255,0.06)",
                                            transition: "all 0.1s ease",
                                        }}
                                        onFocus={() => setHoveredItem(item)}
                                    >
                                        <MinecraftIcon id={item.id} registryType={registryType} size={36} />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* VUE LISTE */
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {paginatedItems.map((item) => {
                                const isSelected = item.id === currentValue;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "6px 10px",
                                            backgroundColor: isSelected ? "#2d4a2d" : "#232326",
                                            border: isSelected ? "1px solid #4caf50" : "1px solid #38383c",
                                            borderRadius: "6px",
                                            color: "#fff",
                                            cursor: "pointer",
                                            textAlign: "left",
                                        }}
                                    >
                                        <MinecraftIcon id={item.id} registryType={registryType} size={30} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                                                {item.name || item.id}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#888", fontFamily: "monospace" }}>
                                                {item.id}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {paginatedItems.length === 0 && (
                        <div style={{ textAlign: "center", color: "#888", padding: "40px" }}>
                            Aucun élément trouvé pour "{searchTerm}".
                        </div>
                    )}
                </div>

                {/* Tooltip / Détail en bas de la grille sur l'élément survolé */}
                <div
                    style={{
                        padding: "8px 12px",
                        backgroundColor: "#18181a",
                        border: "1px solid #333336",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minHeight: "44px",
                    }}
                >
                    {hoveredItem ? (
                        <>
                            <MinecraftIcon id={hoveredItem.id} registryType={registryType} size={28} />
                            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                                    {hoveredItem.name || hoveredItem.id}
                                </div>
                                <div style={{ fontSize: "11px", color: "#81c784", fontFamily: "monospace" }}>
                                    {hoveredItem.id}
                                </div>
                            </div>
                            <span style={{ fontSize: "11px", color: "#888", background: "#252528", padding: "2px 6px", borderRadius: "3px" }}>
                                Clic pour sélectionner
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: "12px", color: "#777", textAlign: "left" }}>
                            Survolez un élément pour voir ses détails ou cliquez pour sélectionner.
                        </span>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #333", paddingTop: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#888" }}>
                            {filteredItems.length} résultat(s) - Page {page} / {totalPages}
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{ padding: "4px 10px", background: "#333", border: "none", color: "#fff", borderRadius: "4px", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
                            >
                                ◀ Précédent
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                style={{ padding: "4px 10px", background: "#333", border: "none", color: "#fff", borderRadius: "4px", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}
                            >
                                Suivant ▶
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

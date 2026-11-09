import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { useDatasetStore } from "../store/useDatasetStore";
import type { GameRegistryItem } from "../types/QuestTypes";
import { t } from "../i18n";
import { ItemIcon } from "./ItemIcon";
import { Modal } from "./Modal";

const REGISTRY_NAMES: Record<string, string> = {
    items: "Objets",
    blocks: "Blocs",
    entities: "Entités",
    biomes: "Biomes",
    structures: "Structures",
};
export const registryName = (type: string) => (REGISTRY_NAMES[type] ? t(REGISTRY_NAMES[type]) : type);

function useRegistry(registryType: string) {
    const datasets = useDatasetStore((s) => s.datasets);
    const activeDatasetId = useDatasetStore((s) => s.activeDatasetId);
    const getRegistryItems = useDatasetStore((s) => s.getRegistryItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => getRegistryItems(registryType), [getRegistryItems, registryType, datasets, activeDatasetId]);
}

function matches(item: GameRegistryItem, query: string) {
    return item.id.toLowerCase().includes(query) || (item.name ?? "").toLowerCase().includes(query);
}

type Props = { registryType: string; value: string; onChange: (v: string) => void };

export function RegistryField({ registryType, value, onChange }: Props) {
    const items = useRegistry(registryType);
    const [open, setOpen] = useState(false);
    const [picker, setPicker] = useState(false);
    const [active, setActive] = useState(0);
    const root = useRef<HTMLDivElement>(null);

    const selected = items.find((i) => i.id === value);
    const suggestions = useMemo(() => {
        const q = (value || "").toLowerCase().trim();
        return (q ? items.filter((i) => matches(i, q)) : items).slice(0, 8);
    }, [items, value]);

    useEffect(() => {
        if (!open) return;
        const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
        window.addEventListener("pointerdown", close);
        return () => window.removeEventListener("pointerdown", close);
    }, [open]);

    const pick = (id: string) => {
        onChange(id);
        setOpen(false);
    };

    return (
        <div className="registry-field" ref={root}>
            <button type="button" className="slot" onClick={() => setPicker(true)} title={t("Parcourir : {type}", { type: registryName(registryType) })}>
                {value ? <ItemIcon id={value} registryType={registryType} size={28} /> : <Search size={16} />}
            </button>
            <div className="registry-input">
                <input
                    className="mono"
                    value={value ?? ""}
                    placeholder={t("Rechercher : {type}", { type: registryName(registryType) })}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                        setActive(0);
                    }}
                    onKeyDown={(e) => {
                        if (!open || suggestions.length === 0) return;
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActive((a) => Math.min(a + 1, suggestions.length - 1));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActive((a) => Math.max(a - 1, 0));
                        } else if (e.key === "Enter") {
                            e.preventDefault();
                            pick(suggestions[active].id);
                        } else if (e.key === "Escape") setOpen(false);
                    }}
                />
                {selected?.name && <span className="registry-name">{selected.name}</span>}
                {open && suggestions.length > 0 && (
                    <ul className="suggestions" role="listbox">
                        {suggestions.map((item, i) => (
                            <li
                                key={item.id}
                                role="option"
                                aria-selected={i === active}
                                className={i === active ? "active" : ""}
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    pick(item.id);
                                }}
                                onPointerEnter={() => setActive(i)}
                            >
                                <ItemIcon id={item.id} registryType={registryType} size={22} />
                                <span className="sugg-name">{item.name || item.id}</span>
                                <span className="sugg-id mono">{item.id}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button type="button" className="btn icon" onClick={() => setPicker(true)} title={t("Ouvrir la grille")}>
                <LayoutGrid size={15} />
            </button>
            {picker && (
                <ResourcePicker
                    registryType={registryType}
                    current={value}
                    onClose={() => setPicker(false)}
                    onSelect={(id) => {
                        onChange(id);
                        setPicker(false);
                    }}
                />
            )}
        </div>
    );
}

const PAGE = 120;

function ResourcePicker({
    registryType,
    current,
    onClose,
    onSelect,
}: {
    registryType: string;
    current: string;
    onClose: () => void;
    onSelect: (id: string) => void;
}) {
    const items = useRegistry(registryType);
    const [query, setQuery] = useState("");
    const [ns, setNs] = useState("all");
    const [limit, setLimit] = useState(PAGE);
    const [hover, setHover] = useState<GameRegistryItem | null>(null);

    const namespaces = useMemo(() => [...new Set(items.map((i) => i.namespace || i.id.split(":")[0]))].sort(), [items]);
    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return items.filter((i) => (ns === "all" || (i.namespace || i.id.split(":")[0]) === ns) && (!q || matches(i, q)));
    }, [items, query, ns]);

    const shown = hover ?? items.find((i) => i.id === current) ?? null;

    return (
        <Modal title={registryName(registryType)} onClose={onClose} wide>
            <div className="picker-bar">
                <label className="search">
                    <Search size={14} />
                    <input
                        autoFocus
                        value={query}
                        placeholder={t("Rechercher par nom ou identifiant")}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setLimit(PAGE);
                        }}
                    />
                </label>
                {namespaces.length > 1 && (
                    <select value={ns} onChange={(e) => setNs(e.target.value)} style={{ width: "auto" }}>
                        <option value="all">{t("Tous les namespaces")}</option>
                        {namespaces.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                )}
                <span className="muted small">{t("{n} résultat(s)", { n: filtered.length })}</span>
            </div>
            <div className="picker-grid" onPointerLeave={() => setHover(null)}>
                {filtered.slice(0, limit).map((item) => (
                    <button
                        key={item.id}
                        className={item.id === current ? "cell selected" : "cell"}
                        title={`${item.name ?? ""}\n${item.id}`}
                        onPointerEnter={() => setHover(item)}
                        onFocus={() => setHover(item)}
                        onClick={() => onSelect(item.id)}
                    >
                        <ItemIcon id={item.id} registryType={registryType} size={32} />
                    </button>
                ))}
                {filtered.length === 0 && <p className="muted empty-inline">{t("Aucun résultat.")}</p>}
            </div>
            {filtered.length > limit && (
                <button className="btn ghost more" onClick={() => setLimit((l) => l + PAGE)}>
                    {t("Afficher plus ({n} restants)", { n: filtered.length - limit })}
                </button>
            )}
            <div className="picker-info">
                {shown ? (
                    <>
                        <ItemIcon id={shown.id} registryType={registryType} size={40} />
                        <div>
                            <strong>{shown.name || shown.id}</strong>
                            <div className="mono muted">{shown.id}</div>
                        </div>
                        {query.includes(":") && !items.some((i) => i.id === query.trim()) && (
                            <button className="btn spacer-left" onClick={() => onSelect(query.trim())}>
                                {t("Utiliser « {id} »", { id: query.trim() })}
                            </button>
                        )}
                    </>
                ) : (
                    <span className="muted">{t("Survolez un élément pour voir ses détails.")}</span>
                )}
            </div>
        </Modal>
    );
}

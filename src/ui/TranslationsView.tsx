import { useMemo, useRef, useState } from "react";
import { ArrowRightLeft, Check, Download, Eye, FileUp, Languages, Plus, Search, Trash2, X } from "lucide-react";
import { useQuestStore } from "../store/useQuestStore";
import { useProjectStore } from "../store/useProjectStore";
import { MC_LOCALES, isRtl, localeInfo, localeLabel } from "../data/mcLocales";
import { collectKeyUsages, downloadJson, looksLikeKey, sortedTable } from "../lib/translations";
import { t } from "../i18n";
import { Modal, askConfirm, askText, toast } from "./Modal";

export function TranslationsView() {
    const quests = useQuestStore((s) => s.quests);
    const translations = useQuestStore((s) => s.translations);
    const previewLocale = useQuestStore((s) => s.previewLocale);
    const setPreviewLocale = useQuestStore((s) => s.setPreviewLocale);
    const setTranslation = useQuestStore((s) => s.setTranslation);
    const setTranslations = useQuestStore((s) => s.setTranslations);
    const addLocale = useQuestStore((s) => s.addLocale);
    const removeLocale = useQuestStore((s) => s.removeLocale);
    const renameKey = useQuestStore((s) => s.renameKey);
    const deleteKey = useQuestStore((s) => s.deleteKey);
    const namespace = useProjectStore((s) => s.getActiveNamespace)();

    const locales = useMemo(() => Object.keys(translations).sort(), [translations]);
    const [target, setTarget] = useState<string>(() => (translations[previewLocale] ? previewLocale : (locales[0] ?? previewLocale)));
    const [reference, setReference] = useState<string>(() => (translations.en_us ? "en_us" : (locales[0] ?? "en_us")));
    const [query, setQuery] = useState("");
    const [onlyMissing, setOnlyMissing] = useState(false);
    const [adding, setAdding] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const usages = useMemo(() => collectKeyUsages(quests).filter((u) => looksLikeKey(u.key)), [quests]);
    const keys = useMemo(() => {
        const set = new Set(usages.map((u) => u.key));
        Object.values(translations).forEach((table) => Object.keys(table).forEach((k) => set.add(k)));
        return [...set].sort();
    }, [usages, translations]);
    const usageByKey = useMemo(() => {
        const map = new Map<string, string[]>();
        usages.forEach((u) => map.set(u.key, [...(map.get(u.key) ?? []), u.label]));
        return map;
    }, [usages]);

    const progress = (locale: string) => {
        if (keys.length === 0) return 0;
        const table = translations[locale] ?? {};
        return keys.filter((k) => table[k]).length / keys.length;
    };

    const rows = keys.filter((k) => {
        if (onlyMissing && translations[target]?.[k]) return false;
        const q = query.toLowerCase().trim();
        if (!q) return true;
        return k.toLowerCase().includes(q) || (translations[target]?.[k] ?? "").toLowerCase().includes(q) || (translations[reference]?.[k] ?? "").toLowerCase().includes(q);
    });

    const hasTarget = translations[target] !== undefined;

    const importFiles = async (files: FileList) => {
        let next = { ...translations };
        let count = 0;
        for (const file of Array.from(files)) {
            try {
                const data = JSON.parse(await file.text());
                if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(t("Le fichier doit contenir un objet JSON."));
                let locale: string | null = file.name.replace(/\.json$/i, "").toLowerCase();
                if (!MC_LOCALES.some((l) => l.code === locale)) {
                    locale = await askText(t("Langue de {file}", { file: file.name }), "en_us", t("Code de langue Minecraft (ex : fr_fr)"));
                    if (!locale) continue;
                }
                const table = Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === "string")) as Record<string, string>;
                next = { ...next, [locale]: { ...(next[locale] ?? {}), ...table } };
                count += Object.keys(table).length;
            } catch (err: any) {
                toast(`${file.name} : ${err?.message ?? err}`, "error");
            }
        }
        setTranslations(next);
        if (count) toast(t("{n} traduction(s) importée(s).", { n: count }));
    };

    const exportLocale = (locale: string) => downloadJson(sortedTable(translations[locale] ?? {}), `${locale}.json`);

    const newKey = async () => {
        const key = await askText(t("Nouvelle clé"), `quest.${namespace}.`, t("Elle apparaîtra dans toutes les langues."));
        if (!key) return;
        setTranslation(hasTarget ? target : (locales[0] ?? "en_us"), key, translations[target]?.[key] ?? key);
        setQuery(key);
    };

    return (
        <div className="translations">
            <aside className="locale-panel">
                <div className="panel-head">
                    <h2>{t("Langues")}</h2>
                    <button className="btn small primary" onClick={() => setAdding(true)}>
                        <Plus size={13} /> {t("Ajouter")}
                    </button>
                </div>
                {locales.length === 0 && <p className="muted pad">{t("Aucune langue. Ajoutez-en une, ou importez un fichier de langue.")}</p>}
                <ul className="locale-list">
                    {locales.map((code) => {
                        const info = localeInfo(code);
                        const pct = Math.round(progress(code) * 100);
                        return (
                            <li key={code} className={code === target ? "on" : ""}>
                                <button className="locale-main" onClick={() => setTarget(code)}>
                                    <span className="locale-name">
                                        {info.name}
                                        {code === previewLocale && <Eye size={12} className="accent" aria-label={t("Langue de prévisualisation")} />}
                                    </span>
                                    <span className="locale-sub">
                                        <span className="mono">{code}</span> · {info.region}
                                    </span>
                                    <span className="progress" aria-label={`${pct}%`}>
                                        <span style={{ width: `${pct}%` }} className={pct === 100 ? "done" : ""} />
                                    </span>
                                </button>
                                <span className="pct">{pct}%</span>
                            </li>
                        );
                    })}
                </ul>
                <div className="panel-foot">
                    <input ref={fileInput} type="file" accept=".json" multiple hidden onChange={(e) => e.target.files && importFiles(e.target.files).finally(() => (e.target.value = ""))} />
                    <button className="btn" onClick={() => fileInput.current?.click()} title={t("Fichiers assets/<namespace>/lang/<langue>.json")}>
                        <FileUp size={14} /> {t("Importer")}
                    </button>
                    <button className="btn" disabled={locales.length === 0} onClick={() => locales.forEach(exportLocale)}>
                        <Download size={14} /> {t("Tout exporter")}
                    </button>
                </div>
            </aside>

            <section className="translation-table">
                <div className="table-toolbar">
                    <div className="locale-pair">
                        <select value={reference} onChange={(e) => setReference(e.target.value)} title={t("Langue de référence")}>
                            {[...new Set([...locales, reference])].map((c) => (
                                <option key={c} value={c}>
                                    {c} — {localeInfo(c).name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="icon-btn"
                            title={t("Inverser")}
                            onClick={() => {
                                setReference(target);
                                setTarget(reference);
                            }}
                        >
                            <ArrowRightLeft size={14} />
                        </button>
                        <strong className="target-name">
                            <Languages size={14} /> {localeLabel(target)}
                        </strong>
                    </div>
                    <span className="spacer" />
                    <label className="search">
                        <Search size={14} />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Filtrer les clés et les textes")} />
                    </label>
                    <label className="check">
                        <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
                        {t("Manquantes")}
                    </label>
                    <button className="btn" onClick={newKey}>
                        <Plus size={14} /> {t("Nouvelle clé")}
                    </button>
                </div>

                {hasTarget && (
                    <div className="locale-actions">
                        <button className="btn small" disabled={target === previewLocale} onClick={() => setPreviewLocale(target)}>
                            <Eye size={13} /> {target === previewLocale ? t("Langue de prévisualisation") : t("Prévisualiser dans cette langue")}
                        </button>
                        <button className="btn small" onClick={() => exportLocale(target)}>
                            <Download size={13} /> {t("Exporter {file}", { file: `${target}.json` })}
                        </button>
                        <button
                            className="btn small danger-ghost"
                            onClick={async () => {
                                if (await askConfirm(t("Retirer la langue"), t("Supprimer toutes les traductions en {lang} ?", { lang: localeLabel(target) }), { danger: true, confirmLabel: t("Supprimer") })) {
                                    removeLocale(target);
                                    setTarget(locales.find((l) => l !== target) ?? "en_us");
                                }
                            }}
                        >
                            <Trash2 size={13} /> {t("Retirer la langue")}
                        </button>
                    </div>
                )}

                {!hasTarget ? (
                    <div className="empty">
                        <Languages size={32} />
                        <p>{t("{lang} ne fait pas encore partie du projet.", { lang: localeLabel(target) })}</p>
                        <button className="btn primary" onClick={() => addLocale(target)}>
                            <Plus size={14} /> {t("Ajouter cette langue")}
                        </button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="empty">
                        <Check size={32} />
                        <p>{keys.length === 0 ? t("Aucune clé : donnez des clés de traduction aux noms de vos quêtes.") : t("Rien à afficher avec ces filtres.")}</p>
                    </div>
                ) : (
                    <div className="rows">
                        {rows.map((key) => {
                            const used = usageByKey.get(key);
                            const value = translations[target]?.[key] ?? "";
                            return (
                                <div key={key} className={value ? "t-row" : "t-row missing"}>
                                    <div className="t-key">
                                        <button
                                            className="mono key-btn"
                                            title={t("Renommer la clé")}
                                            onClick={async () => {
                                                const next = await askText(t("Renommer la clé"), key, t("Les quêtes qui l'utilisent seront mises à jour."));
                                                if (next) renameKey(key, next);
                                            }}
                                        >
                                            {key}
                                        </button>
                                        {used ? (
                                            <span className="usage" title={used.join("\n")}>
                                                {used[0]}
                                                {used.length > 1 && ` +${used.length - 1}`}
                                            </span>
                                        ) : (
                                            <span className="usage unused">{t("non utilisée")}</span>
                                        )}
                                    </div>
                                    <div className="t-ref" dir={isRtl(reference) ? "rtl" : "ltr"}>
                                        {reference === target ? <span className="muted">—</span> : (translations[reference]?.[key] ?? <span className="muted">{t("(vide)")}</span>)}
                                    </div>
                                    <textarea
                                        className="t-value"
                                        rows={1}
                                        dir={isRtl(target) ? "rtl" : "ltr"}
                                        value={value}
                                        placeholder={translations[reference]?.[key] ?? t("Traduction en {lang}", { lang: localeInfo(target).name })}
                                        onChange={(e) => setTranslation(target, key, e.target.value)}
                                    />
                                    <button
                                        className="icon-btn danger"
                                        title={t("Supprimer la clé de toutes les langues")}
                                        onClick={async () => {
                                            if (await askConfirm(t("Supprimer la clé"), key, { danger: true, confirmLabel: t("Supprimer") })) deleteKey(key);
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {adding && (
                <LocalePicker
                    existing={locales}
                    onClose={() => setAdding(false)}
                    onPick={(code) => {
                        addLocale(code);
                        setTarget(code);
                        setAdding(false);
                    }}
                />
            )}
        </div>
    );
}

/** Choix parmi toutes les langues de Minecraft. */
export function LocalePicker({ existing, onPick, onClose, title }: { existing: string[]; onPick: (code: string) => void; onClose: () => void; title?: string }) {
    const [query, setQuery] = useState("");
    const q = query.toLowerCase().trim();
    const list = MC_LOCALES.filter((l) => !q || l.code.includes(q) || l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q));
    return (
        <Modal title={title ?? t("Ajouter une langue")} onClose={onClose}>
            <label className="search block">
                <Search size={14} />
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("Nom, région ou code (ex : fr_ca)")}
                    onKeyDown={(e) => e.key === "Enter" && list[0] && onPick(list[0].code)}
                />
            </label>
            <ul className="locale-choices">
                {list.map((l) => {
                    const has = existing.includes(l.code);
                    return (
                        <li key={l.code}>
                            <button onClick={() => onPick(l.code)} className={has ? "has" : ""}>
                                <span className="locale-name">{l.name}</span>
                                <span className="muted">{l.region}</span>
                                <span className="spacer" />
                                {has && <Check size={14} className="accent" />}
                                <span className="mono muted">{l.code}</span>
                            </button>
                        </li>
                    );
                })}
                {list.length === 0 && <li className="muted pad">{t("Aucun résultat.")}</li>}
            </ul>
        </Modal>
    );
}

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { LANGUAGES, setLang, t, useLang, type Lang } from "../i18n";
import { setTheme, useTheme, type ThemeChoice } from "../theme";

const THEMES: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Clair", icon: Sun },
    { id: "dark", label: "Sombre", icon: Moon },
    { id: "system", label: "Système", icon: Monitor },
];

export function OptionsMenu() {
    const lang = useLang();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                button.current?.focus();
            }
        };
        window.addEventListener("pointerdown", onPointer);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("pointerdown", onPointer);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="menu-anchor" ref={root}>
            <button
                ref={button}
                className={open ? "btn icon toggled" : "btn icon"}
                title={t("Options")}
                aria-label={t("Options")}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <Settings size={15} />
            </button>
            {open && (
                <div className="options-menu" role="dialog" aria-label={t("Options")}>
                    <h3>{t("Options")}</h3>
                    <span className="field-label">{t("Thème")}</span>
                    <div className="segmented full" role="radiogroup">
                        {THEMES.map(({ id, label, icon: Icon }) => (
                            <button key={id} role="radio" aria-checked={theme === id} className={theme === id ? "on" : ""} onClick={() => setTheme(id)}>
                                <Icon size={13} /> {t(label)}
                            </button>
                        ))}
                    </div>
                    <label className="field-label" htmlFor="site-language">
                        {t("Langue du site")}
                    </label>
                    <select id="site-language" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                        {LANGUAGES.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                    </select>
                    <p className="field-hint">{t("Ne change pas le texte de vos quêtes : leur langue se choisit dans la barre du haut.")}</p>
                </div>
            )}
        </div>
    );
}

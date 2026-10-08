import React from "react";
import type { FieldDefinition } from "../../types/QuestTypes";
import { RegistrySelector } from "./RegistrySelector";
import "../../styles/components.css";

interface FormFieldProps {
    field: FieldDefinition;
    value: any;
    onChange: (value: any) => void;
    parentData?: Record<string, any>;
}

const FormField: React.FC<FormFieldProps> = ({ field, value, onChange, parentData }) => {
    const currentValue = value ?? "";

    const registryType = field.registryTypeResolver
        ? field.registryTypeResolver(parentData || {})
        : field.registryType || "items";

    return (
        <div className="form-field-group">
            <label className="form-label">
                {field.label} {field.required && <span className="form-required">*</span>}
            </label>

            {field.type === "text" &&
                (field.multiline ? (
                    <textarea
                        className="form-textarea"
                        rows={3}
                        value={currentValue}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <input
                        className="form-input"
                        type="text"
                        value={currentValue}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ))}

            {field.type === "number" && (
                <input
                    className="form-input"
                    type="number"
                    value={currentValue}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            )}

            {field.type === "boolean" && (
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
            )}

            {field.type === "select" && (
                <select
                    className="form-select"
                    value={currentValue}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}

            {field.type === "registrySelector" && (
                <RegistrySelector
                    registryType={registryType}
                    value={currentValue}
                    onChange={onChange}
                />
            )}
        </div>
    );
};

export default FormField;
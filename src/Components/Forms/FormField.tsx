import React from "react";
import type { FieldDefinition } from "../../types/QuestTypes";
import "../../styles/components.css";

interface FormFieldProps {
    field: FieldDefinition;
    value: any;
    onChange: (value: any) => void;
}

const FormField: React.FC<FormFieldProps> = ({ field, value, onChange }) => {
    const currentValue = value ?? "";

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
                        onChange={(e) => onChange(e.target.value)}/>) :
                    (<input
                        className="form-input"
                        type="text"
                        value={currentValue}
                        onChange={(e) => onChange(e.target.value)}/>
                ))}

            {field.type === "number" && (
                <input
                    className="form-input"
                    type="number"
                    value={currentValue}
                    onChange={(e) => onChange(Number(e.target.value))}/>
            )}

            {field.type === "select" && (
                <select
                    className="form-select"
                    value={currentValue}
                    onChange={(e) => onChange(e.target.value)}>
                    {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default FormField;
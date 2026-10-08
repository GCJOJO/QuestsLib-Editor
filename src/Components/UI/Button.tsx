import React from "react";
import "../../styles/components.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
}

const Button: React.FC<ButtonProps> = ({ children, variant = "primary", className = "", ...props }) => {
    return (
        <button className={`ui-btn ui-btn-${variant} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
import React from "react";

export interface SpacerProps {
    size?: number | string;
}

const VerticalSpacer: React.FC<SpacerProps> = ({ size = 16 }) => {
    const heightValue = typeof size === "number" ? `${size}px` : size;
    return <div style={{ height: heightValue, flexShrink: 0 }} />;
};

const HorizontalSpacer: React.FC<SpacerProps> = ({ size = 16 }) => {
    const widthValue = typeof size === "number" ? `${size}px` : size;
    return <div style={{ width: widthValue, display: "inline-block", flexShrink: 0 }} />;
};

export type { SpacerProps as HorizontalSpacerProps };
export { VerticalSpacer, HorizontalSpacer };
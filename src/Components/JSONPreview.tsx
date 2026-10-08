import React, { useState } from "react";
import Button from "./UI/Button";

interface JsonPreviewProps {
    data: any;
}

const JsonPreview: React.FC<JsonPreviewProps> = ({ data }) => {
    const [isFolded, setIsFolded] = useState(false);

    return (
        <div className={`json-preview-container ${isFolded ? "folded" : ""}`}>
            <div className="json-preview-header">
                {!isFolded && (<h4 className="json-preview-title">JSON Preview</h4>)}
                <Button variant="secondary" onClick={() => setIsFolded(!isFolded)}>
                    {isFolded ? "Unfold" : "Fold"}
                </Button>
            </div>

            {!isFolded && (
                <pre className="json-preview-code">
          {JSON.stringify(data, null, 4)}
        </pre>
            )}
        </div>
    );
};

export default JsonPreview;
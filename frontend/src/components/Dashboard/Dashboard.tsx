import React, { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const resp = await fetch(
                    "http://localhost:5000/api/metabase/embed"
                );
                if (!resp.ok)
                    throw new Error("Failed to fetch Metabase embed URL");

                const data = await resp.json();
                if (cancelled) return;

                setEmbedUrl(data.url);
            } catch (err: any) {
                setError(err?.message ?? String(err));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "#f9fafb",
            }}
        >
            {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

            {embedUrl ? (
                <iframe
                    src={embedUrl}
                    title="Metabase Dashboard"
                    style={{
                        flex: 1,
                        width: "90%",
                        height: "100%",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 0 8px rgba(0,0,0,0.1)",
                    }}
                    allowTransparency={true}
                />
            ) : (
                <p>Loading dashboard…</p>
            )}
        </div>
    );
};

export default Dashboard;

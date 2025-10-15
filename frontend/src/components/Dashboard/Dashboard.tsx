import React, { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
    const [embedUrl, setEmbedUrl] = useState<string | null>(
        sessionStorage.getItem("metabaseEmbedUrl")
    );
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!embedUrl);

    useEffect(() => {
        let cancelled = false;

        const fetchEmbedUrl = async () => {
            try {
                const expiry =
                    Number(sessionStorage.getItem("metabaseUrlExpiry")) || 0;
                const stillValid = Date.now() < expiry;

                if (embedUrl && stillValid) {
                    setLoading(false);
                    return;
                }

                const resp = await fetch("/api/metabase/embed");
                if (!resp.ok)
                    throw new Error("Failed to fetch Metabase embed URL");

                const data = await resp.json();
                if (cancelled) return;

                const expiresInMs = 10 * 60 * 1000; // 10 min
                const expiryTime = Date.now() + expiresInMs;

                setEmbedUrl(data.url);
                sessionStorage.setItem("metabaseEmbedUrl", data.url);
                sessionStorage.setItem("metabaseUrlExpiry", String(expiryTime));
            } catch (err: any) {
                setError(err?.message ?? String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchEmbedUrl();

        return () => {
            cancelled = true;
        };
    }, [embedUrl]);

    if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
    if (loading) return <p>Loading dashboard…</p>;

    return (
        <div
            style={{
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
                backgroundColor: "#f9fafb",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {embedUrl && (
                <iframe
                    src={embedUrl}
                    title="Metabase Dashboard"
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                        backgroundColor: "#fff",
                    }}
                    scrolling="no"
                    allowTransparency={true}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            )}
        </div>
    );
};

export default Dashboard;

import React, { useEffect, useState } from "react";
import "./EmbeddedDashboardPage.css";

type DashboardType = "metabase" | "streamlit" | "tableau" | "looker" | "custom";

const DASHBOARD_TYPE_LABELS: Record<DashboardType, string> = {
    metabase: "Metabase",
    streamlit: "Streamlit",
    tableau: "Tableau",
    looker: "Looker",
    custom: "Custom (iframe)",
};

const METABASE_URL_KEY = "metabaseEmbedUrl";
const METABASE_EXPIRY_KEY = "metabaseUrlExpiry";
const METABASE_EMBED_TTL_MS = 10 * 60 * 1000; // 10 minutes

// NEW: key + config type for persistence
const DASHBOARD_CONFIG_KEY = "embeddedDashboardConfigV1";

interface DashboardConfig {
    name: string;
    type: DashboardType;
    width: string;
    height: string;
    metabaseSiteUrl?: string;
    metabaseDashboardId?: string;
    metabaseSecretKey?: string;
    externalEmbedUrl?: string;
    isConfigured: boolean;
}

const EmbeddedDashboardPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // iframe state
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);

    const [loadingEmbed, setLoadingEmbed] = useState(true);
    const [embedError, setEmbedError] = useState<string | null>(null);

    // general form state
    const [name, setName] = useState("Team Performance Dashboard");
    const [type, setType] = useState<DashboardType>("metabase");
    const [width, setWidth] = useState("100%");
    const [height, setHeight] = useState("800px");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // dropdown state
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

    // Metabase-specific form state
    const [metabaseSiteUrl, setMetabaseSiteUrl] = useState("");
    const [metabaseDashboardId, setMetabaseDashboardId] = useState<string>("");
    const [metabaseSecretKey, setMetabaseSecretKey] = useState("");

    // Generic external dashboards (Streamlit/Tableau/Custom)
    const [externalEmbedUrl, setExternalEmbedUrl] = useState("");

    // --- helpers ------------------------------------------------------

    const readCachedMetabaseUrl = () => {
        if (typeof window === "undefined") return null;

        const url = sessionStorage.getItem(METABASE_URL_KEY);
        const expiry = Number(sessionStorage.getItem(METABASE_EXPIRY_KEY)) || 0;
        const stillValid = Date.now() < expiry;

        if (url && stillValid) {
            return url;
        }

        return null;
    };

    const fetchMetabaseUrl = async (
        siteUrl: string,
        dashboardId: string,
        secretKey: string
    ): Promise<string> => {
        const trimmedSite = siteUrl.trim();
        const trimmedSecret = secretKey.trim();

        if (!trimmedSite) {
            throw new Error("Metabase site URL is required.");
        }
        if (
            !trimmedSite.startsWith("http://") &&
            !trimmedSite.startsWith("https://")
        ) {
            throw new Error(
                "Metabase site URL must start with http:// or https://"
            );
        }

        const numericId = Number(dashboardId);
        if (!Number.isFinite(numericId) || numericId <= 0) {
            throw new Error("Metabase dashboard ID must be a positive number.");
        }

        if (!trimmedSecret) {
            throw new Error("Metabase secret key is required.");
        }

        const resp = await fetch("/api/metabase/embed", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                site_url: trimmedSite,
                dashboard_id: numericId,
                secret_key: trimmedSecret,
            }),
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(
                `Failed to fetch Metabase embed URL (status ${resp.status}): ${text}`
            );
        }

        const data = await resp.json();
        if (!data?.url) {
            throw new Error("Metabase embed endpoint returned no URL.");
        }

        const expiryTime = Date.now() + METABASE_EMBED_TTL_MS;
        if (typeof window !== "undefined") {
            sessionStorage.setItem(METABASE_URL_KEY, data.url);
            sessionStorage.setItem(METABASE_EXPIRY_KEY, String(expiryTime));
        }

        return data.url;
    };

    // NEW: helpers to persist / load full dashboard config
    const loadConfigFromStorage = (): DashboardConfig | null => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem(DASHBOARD_CONFIG_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as DashboardConfig;
        } catch {
            return null;
        }
    };

    const saveConfigToStorage = (config: DashboardConfig) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(config));
        } catch {
            // ignore storage errors
        }
    };

    // --- on mount: restore config + Metabase URL if possible ------------

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                setLoadingEmbed(true);
                setEmbedError(null);

                // 1) Restore config (type, name, URLs, dimensions)
                const stored = loadConfigFromStorage();
                if (stored && !cancelled) {
                    setName(stored.name);
                    setType(stored.type);
                    setWidth(stored.width);
                    setHeight(stored.height);
                    setIsConfigured(stored.isConfigured);

                    if (stored.metabaseSiteUrl) {
                        setMetabaseSiteUrl(stored.metabaseSiteUrl);
                    }
                    if (stored.metabaseDashboardId) {
                        setMetabaseDashboardId(stored.metabaseDashboardId);
                    }
                    if (stored.metabaseSecretKey) {
                        setMetabaseSecretKey(stored.metabaseSecretKey);
                    }
                    if (stored.externalEmbedUrl) {
                        setExternalEmbedUrl(stored.externalEmbedUrl);
                    }

                    // 2) Restore embed URL
                    if (stored.type === "metabase") {
                        const cached = readCachedMetabaseUrl();
                        if (cached) {
                            setEmbedUrl(cached);
                        } else {
                            setEmbedUrl(null);
                        }
                    } else if (
                        stored.externalEmbedUrl &&
                        stored.externalEmbedUrl.trim() !== ""
                    ) {
                        setEmbedUrl(stored.externalEmbedUrl.trim());
                    } else {
                        setEmbedUrl(null);
                    }

                    setLoadingEmbed(false);
                    return;
                }

                // No stored config → fall back to previous Metabase-only behavior
                const cached = readCachedMetabaseUrl();
                if (cached && !cancelled) {
                    setEmbedUrl(cached);
                    setIsConfigured(true);
                    setType("metabase");
                } else {
                    setEmbedUrl(null);
                    setIsConfigured(false);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setEmbedError(err?.message ?? String(err));
                }
            } finally {
                if (!cancelled) {
                    setLoadingEmbed(false);
                }
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, []);

    // --- UI handlers --------------------------------------------------

    const handleSetupClick = () => {
        setSaveError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsTypeMenuOpen(false);
    };

    const handleSelectType = (t: DashboardType) => {
        setType(t);
        setIsTypeMenuOpen(false);
        setSaveError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setSaving(true);
        setSaveError(null);
        setEmbedError(null);

        try {
            setLoadingEmbed(true);

            let finalEmbedUrl: string;

            if (type === "metabase") {
                const url = await fetchMetabaseUrl(
                    metabaseSiteUrl,
                    metabaseDashboardId,
                    metabaseSecretKey
                );
                finalEmbedUrl = url;
                setEmbedUrl(url);
                setIsConfigured(true);
            } else {
                // Streamlit / Tableau / Looker / Custom: direct iframe URL
                const rawUrl = externalEmbedUrl.trim();

                if (!rawUrl) {
                    throw new Error(
                        "Embed URL is required for this dashboard type."
                    );
                }

                if (!rawUrl.startsWith("https://")) {
                    throw new Error("Embed URL must start with https://");
                }

                finalEmbedUrl = rawUrl;
                setEmbedUrl(rawUrl);
                setIsConfigured(true);
            }

            // NEW: persist full config so it survives navigation
            const config: DashboardConfig = {
                name,
                type,
                width,
                height,
                metabaseSiteUrl: metabaseSiteUrl || undefined,
                metabaseDashboardId: metabaseDashboardId || undefined,
                metabaseSecretKey: metabaseSecretKey || undefined,
                externalEmbedUrl:
                    type === "metabase"
                        ? undefined
                        : externalEmbedUrl || undefined,
                isConfigured: true,
            };
            saveConfigToStorage(config);

            setIsModalOpen(false);
            setIsTypeMenuOpen(false);
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            setSaveError(msg);
            setEmbedError(msg);
        } finally {
            setSaving(false);
            setLoadingEmbed(false);
        }
    };

    const selectedTypeLabel = DASHBOARD_TYPE_LABELS[type];

    // --- render -------------------------------------------------------

    return (
        <div className="dash-page">
            <div className="dash-card">
                {/* Header */}
                <div className="dash-card-header">
                    <div className="dash-card-title-wrapper">
                        <span
                            className="dash-card-title-icon"
                            aria-hidden="true"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="dash-icon"
                                role="presentation"
                            >
                                <path
                                    d="M14 3h7v7h-2V6.41L10.41 15 9 13.59 17.59 5H14V3z"
                                    fill="currentColor"
                                />
                                <path
                                    d="M5 5h7v2H7v10h10v-5h2v7H5V5z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                        <div>
                            <div className="dash-card-title">
                                Embedded Dashboard
                            </div>
                            <div className="dash-card-subtitle">
                                Integrate external dashboards from Metabase,
                                Streamlit, Tableau, or any tool that supports
                                iframe embedding.
                            </div>
                        </div>
                    </div>

                    <button
                        className="dash-btn dash-btn-primary"
                        onClick={handleSetupClick}
                    >
                        <span className="dash-btn-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" className="dash-icon">
                                <path
                                    d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.18 7.18 0 0 0-1.62-.94L14.5 2.5a.5.5 0 0 0-.49-.5h-3.02a.5.5 0 0 0-.49.5l-.36 2.72c-.6.24-1.15.55-1.66.94l-2.39-.96a.5.5 0 0 0-.61.22L3.04 8.74a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.16 13.42a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.51.39 1.06.71 1.66.94l.36 2.72a.5.5 0 0 0 .49.5h3.02a.5.5 0 0 0 .49-.5l.36-2.72c.6-.24 1.15-.55 1.66-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                        Setup Dashboard
                    </button>
                </div>

                {/* Body */}
                <div className="dash-card-body">
                    {embedError && isConfigured && (
                        <p style={{ color: "crimson" }}>
                            Error loading dashboard: {embedError}
                        </p>
                    )}

                    {loadingEmbed && !embedUrl && <p>Loading dashboard…</p>}

                    {isConfigured && embedUrl ? (
                        <div className="dash-embed-wrapper">
                            <iframe
                                src={embedUrl}
                                title={name || "Embedded Dashboard"}
                                className="dash-embed-iframe"
                                style={{
                                    width: width || "100%",
                                    height: height || "800px",
                                }}
                                scrolling="no"
                                allowTransparency={true}
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                        </div>
                    ) : (
                        !loadingEmbed && (
                            <div className="dash-empty-state">
                                <div className="dash-empty-icon-wrapper">
                                    <div className="dash-empty-icon-circle">
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="dash-empty-icon"
                                        >
                                            <path
                                                d="M14 3h7v7h-2V6.41L10.41 15 9 13.59 17.59 5H14V3z"
                                                fill="#2563eb"
                                            />
                                            <path
                                                d="M5 5h7v2H7v10h10v-5h2v7H5V5z"
                                                fill="#2563eb"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <h2 className="dash-empty-title">
                                    No Dashboard Configured
                                </h2>
                                <p className="dash-empty-text">
                                    Click &quot;Setup Dashboard&quot; to connect
                                    a Metabase or Streamlit dashboard using the
                                    configuration form.
                                </p>

                                <button
                                    className="dash-btn dash-btn-primary dash-btn-large"
                                    onClick={handleSetupClick}
                                >
                                    <span
                                        className="dash-btn-icon"
                                        aria-hidden="true"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="dash-icon"
                                        >
                                            <path
                                                d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.18 7.18 0 0 0-1.62-.94L14.5 2.5a.5.5 0 0 0-.49-.5h-3.02a.5.5 0 0 0-.49.5l-.36 2.72c-.6.24-1.15.55-1.66.94l-2.39-.96a.5.5 0 0 0-.61.22L3.04 8.74a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.16 13.42a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.51.39 1.06.71 1.66.94l.36 2.72a.5.5 0 0 0 .49.5h3.02a.5.5 0 0 0 .49-.5l.36-2.72c.6-.24 1.15-.55 1.66-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </span>
                                    Setup Dashboard
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="dash-modal-backdrop" onClick={handleCloseModal}>
                    <div
                        className="dash-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="setup-dashboard-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dash-modal-header">
                            <h2
                                id="setup-dashboard-title"
                                className="dash-modal-title"
                            >
                                Setup Embedded Dashboard
                            </h2>
                            <button
                                className="dash-modal-close"
                                type="button"
                                onClick={handleCloseModal}
                            >
                                ×
                            </button>
                        </div>

                        <p className="dash-modal-subtitle">
                            Configure how your dashboard is displayed. Metabase
                            embeds are signed via the backend;
                            Streamlit/Tableau/Custom dashboards use a direct
                            HTTPS URL.
                        </p>

                        <form onSubmit={handleSave} className="dash-modal-form">
                            {/* Name */}
                            <div className="dash-field">
                                <label className="dash-label">
                                    Dashboard Name{" "}
                                    <span className="dash-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="dash-input"
                                    placeholder="e.g., Team Performance Dashboard"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Type */}
                            <div className="dash-field">
                                <label className="dash-label">
                                    Dashboard Type
                                </label>

                                <div className="dash-select-wrapper">
                                    <button
                                        type="button"
                                        className={`dash-select-trigger ${
                                            isTypeMenuOpen ? "open" : ""
                                        }`}
                                        onClick={() =>
                                            setIsTypeMenuOpen((v) => !v)
                                        }
                                    >
                                        <span className="dash-select-trigger-label">
                                            {selectedTypeLabel}
                                        </span>
                                        <span className="dash-select-caret">
                                            ▾
                                        </span>
                                    </button>

                                    {isTypeMenuOpen && (
                                        <div className="dash-select-menu">
                                            {(
                                                [
                                                    "metabase",
                                                    "streamlit",
                                                    "tableau",
                                                    "looker",
                                                    "custom",
                                                ] as DashboardType[]
                                            ).map((t) => (
                                                <button
                                                    type="button"
                                                    key={t}
                                                    className="dash-select-option"
                                                    onClick={() =>
                                                        handleSelectType(t)
                                                    }
                                                >
                                                    <span
                                                        className={`dash-type-icon dash-type-${t}`}
                                                    />
                                                    <span>
                                                        {
                                                            DASHBOARD_TYPE_LABELS[
                                                                t
                                                            ]
                                                        }
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metabase-specific fields */}
                            {type === "metabase" && (
                                <>
                                    <div className="dash-field">
                                        <label className="dash-label">
                                            Metabase Site URL{" "}
                                            <span className="dash-required">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            placeholder="https://your-metabase-service.run.app"
                                            value={metabaseSiteUrl}
                                            onChange={(e) =>
                                                setMetabaseSiteUrl(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="dash-field">
                                        <label className="dash-label">
                                            Metabase Dashboard ID{" "}
                                            <span className="dash-required">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            placeholder="1"
                                            value={metabaseDashboardId}
                                            onChange={(e) =>
                                                setMetabaseDashboardId(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="dash-field">
                                        <label className="dash-label">
                                            Metabase Secret Key{" "}
                                            <span className="dash-required">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="password"
                                            className="dash-input"
                                            placeholder="Embedding secret key"
                                            value={metabaseSecretKey}
                                            onChange={(e) =>
                                                setMetabaseSecretKey(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}

                            {/* Generic external URL for Streamlit/Tableau/Custom */}
                            {type !== "metabase" && (
                                <div className="dash-field">
                                    <label className="dash-label">
                                        Embed URL{" "}
                                        <span className="dash-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="dash-input"
                                        placeholder="https://your-streamlit-or-tableau-app..."
                                        value={externalEmbedUrl}
                                        onChange={(e) =>
                                            setExternalEmbedUrl(e.target.value)
                                        }
                                    />
                                </div>
                            )}

                            {/* Width / Height */}
                            <div className="dash-field dash-field-row">
                                <div className="dash-field-col">
                                    <label className="dash-label">Width</label>
                                    <input
                                        type="text"
                                        className="dash-input"
                                        value={width}
                                        onChange={(e) =>
                                            setWidth(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="dash-field-col">
                                    <label className="dash-label">Height</label>
                                    <input
                                        type="text"
                                        className="dash-input"
                                        value={height}
                                        onChange={(e) =>
                                            setHeight(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {saveError && (
                                <p
                                    style={{
                                        color: "crimson",
                                        fontSize: 12,
                                        marginTop: 8,
                                    }}
                                >
                                    {saveError}
                                </p>
                            )}

                            <div className="dash-modal-footer">
                                <button
                                    type="button"
                                    className="dash-btn dash-btn-ghost"
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="dash-btn dash-btn-primary dash-btn-large"
                                    disabled={saving}
                                >
                                    {saving ? "Saving…" : "Save Dashboard"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmbeddedDashboardPage;

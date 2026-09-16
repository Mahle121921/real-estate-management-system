import { useEffect, useState } from "react";
import axios from "axios";
import {
    Bell,
    CalendarDays,
    CheckCircle2,
    Clock3,
    DollarSign,
    Save,
    Settings as SettingsIcon,
    Wrench,
    XCircle
} from "lucide-react";

import "./Settings.css";

const API_URL = "http://localhost:5000/api/settings";

function Settings() {
    const [settings, setSettings] = useState({
        system_name: "",
        currency: "ETB",
        date_format: "YYYY-MM-DD",
        timezone: "Africa/Addis_Ababa",
        email_notifications: "enabled",
        maintenance_cost_approval: "required"
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ==========================================
    // LOAD SETTINGS
    // ==========================================
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const loadedSettings = {};

                response.data.settings.forEach((setting) => {
                    loadedSettings[setting.SettingKey] =
                        setting.SettingValue;
                });

                setSettings((previous) => ({
                    ...previous,
                    ...loadedSettings
                }));
            }
        } catch (err) {
            console.error("Load settings error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load system settings."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // HANDLE INPUT
    // ==========================================
    const handleChange = (event) => {
        const { name, value } = event.target;

        setSettings((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
        setError("");
    };

    // ==========================================
    // SAVE SETTINGS
    // ==========================================
    const handleSave = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const token = localStorage.getItem("token");

            const settingsArray = Object.entries(settings).map(
                ([SettingKey, SettingValue]) => ({
                    SettingKey,
                    SettingValue
                })
            );

            const response = await axios.patch(
                API_URL,
                {
                    settings: settingsArray
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessage(
                    "System settings updated successfully."
                );

                await loadSettings();
            }
        } catch (err) {
            console.error("Save settings error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save system settings."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // RESET
    // ==========================================
    const handleReset = () => {
        loadSettings();
        setMessage("");
        setError("");
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-loading">
                    <div className="settings-spinner"></div>
                    <p>Loading system settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">

            {/* ======================================
                HEADER
            ====================================== */}
            <div className="settings-header">
                <div>
                    <div className="settings-title-row">
                        <div className="settings-title-icon">
                            <SettingsIcon size={24} />
                        </div>

                        <div>
                            <h1>System Settings</h1>
                            <p>
                                Manage system-wide configuration
                                and preferences.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ======================================
                SUCCESS MESSAGE
            ====================================== */}
            {message && (
                <div className="settings-alert settings-alert-success">
                    <CheckCircle2 size={20} />
                    <span>{message}</span>
                </div>
            )}

            {/* ======================================
                ERROR MESSAGE
            ====================================== */}
            {error && (
                <div className="settings-alert settings-alert-error">
                    <XCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave}>

                {/* ======================================
                    SYSTEM INFORMATION
                ====================================== */}
                <section className="settings-card">

                    <div className="settings-card-header">
                        <div className="settings-section-icon">
                            <SettingsIcon size={20} />
                        </div>

                        <div>
                            <h2>System Information</h2>
                            <p>
                                Basic information used throughout
                                the system.
                            </p>
                        </div>
                    </div>

                    <div className="settings-grid">

                        <div className="settings-field">
                            <label htmlFor="system_name">
                                System Name
                            </label>

                            <input
                                id="system_name"
                                name="system_name"
                                type="text"
                                value={settings.system_name}
                                onChange={handleChange}
                                placeholder="Enter system name"
                                required
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="currency">
                                <DollarSign size={16} />
                                Currency
                            </label>

                            <select
                                id="currency"
                                name="currency"
                                value={settings.currency}
                                onChange={handleChange}
                            >
                                <option value="ETB">
                                    ETB - Ethiopian Birr
                                </option>

                                <option value="USD">
                                    USD - US Dollar
                                </option>

                                <option value="EUR">
                                    EUR - Euro
                                </option>
                            </select>
                        </div>

                        <div className="settings-field">
                            <label htmlFor="date_format">
                                <CalendarDays size={16} />
                                Date Format
                            </label>

                            <select
                                id="date_format"
                                name="date_format"
                                value={settings.date_format}
                                onChange={handleChange}
                            >
                                <option value="YYYY-MM-DD">
                                    YYYY-MM-DD
                                </option>

                                <option value="DD-MM-YYYY">
                                    DD-MM-YYYY
                                </option>

                                <option value="MM-DD-YYYY">
                                    MM-DD-YYYY
                                </option>
                            </select>
                        </div>

                        <div className="settings-field">
                            <label htmlFor="timezone">
                                <Clock3 size={16} />
                                Time Zone
                            </label>

                            <select
                                id="timezone"
                                name="timezone"
                                value={settings.timezone}
                                onChange={handleChange}
                            >
                                <option value="Africa/Addis_Ababa">
                                    Africa/Addis_Ababa
                                </option>

                                <option value="UTC">
                                    UTC
                                </option>
                            </select>
                        </div>

                    </div>
                </section>

                {/* ======================================
                    NOTIFICATIONS
                ====================================== */}
                <section className="settings-card">

                    <div className="settings-card-header">
                        <div className="settings-section-icon">
                            <Bell size={20} />
                        </div>

                        <div>
                            <h2>Notification Settings</h2>
                            <p>
                                Control system email notification
                                behavior.
                            </p>
                        </div>
                    </div>

                    <div className="settings-grid">

                        <div className="settings-field">
                            <label htmlFor="email_notifications">
                                Email Notifications
                            </label>

                            <select
                                id="email_notifications"
                                name="email_notifications"
                                value={
                                    settings.email_notifications
                                }
                                onChange={handleChange}
                            >
                                <option value="enabled">
                                    Enabled
                                </option>

                                <option value="disabled">
                                    Disabled
                                </option>
                            </select>

                            <small>
                                Controls whether system email
                                notifications are enabled.
                            </small>
                        </div>

                    </div>
                </section>

                {/* ======================================
                    MAINTENANCE
                ====================================== */}
                <section className="settings-card">

                    <div className="settings-card-header">
                        <div className="settings-section-icon">
                            <Wrench size={20} />
                        </div>

                        <div>
                            <h2>Maintenance Settings</h2>
                            <p>
                                Configure maintenance approval
                                behavior.
                            </p>
                        </div>
                    </div>

                    <div className="settings-grid">

                        <div className="settings-field">
                            <label htmlFor="maintenance_cost_approval">
                                Maintenance Cost Approval
                            </label>

                            <select
                                id="maintenance_cost_approval"
                                name="maintenance_cost_approval"
                                value={
                                    settings.maintenance_cost_approval
                                }
                                onChange={handleChange}
                            >
                                <option value="required">
                                    Required
                                </option>

                                <option value="not_required">
                                    Not Required
                                </option>
                            </select>

                            <small>
                                Determines whether maintenance
                                costs require Administrator approval.
                            </small>
                        </div>

                    </div>
                </section>

                {/* ======================================
                    ACTIONS
                ====================================== */}
                <div className="settings-actions">

                    <button
                        type="button"
                        className="settings-reset-button"
                        onClick={handleReset}
                        disabled={saving}
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        className="settings-save-button"
                        disabled={saving}
                    >
                        <Save size={18} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </form>
        </div>
    );
}

export default Settings;
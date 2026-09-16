import { useState } from "react";
import {
    Lock,
    Bell,
    User,
    Save,
    Eye,
    EyeOff,
    Mail,
    ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./OwnerSettings.css";

const OwnerSettings = () => {
    const navigate = useNavigate();

    // ==========================================
    // GET CURRENT USER
    // ==========================================
    let storedUser = {};

    try {
        storedUser = JSON.parse(
            localStorage.getItem("user") || "{}"
        );
    } catch (error) {
        console.error("Failed to read user:", error);
    }

    const user = storedUser || {};

    // ==========================================
    // PROFILE
    // ==========================================
    const [profile, setProfile] = useState({
        fullName:
            user?.FullName ||
            user?.fullName ||
            user?.name ||
            "Dawit Fikre",

        email:
            user?.Email ||
            user?.email ||
            "",

        phone:
            user?.PhoneNumber ||
            user?.phoneNumber ||
            "",
    });

    // ==========================================
    // PASSWORD
    // ==========================================
    const [password, setPassword] = useState({
        current: "",
        newPassword: "",
        confirm: "",
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    const [notifications, setNotifications] = useState({
        email: true,
        appointments: true,
        maintenance: true,
        payments: true,
    });

    const [message, setMessage] = useState("");

    // ==========================================
    // USER NAME
    // ==========================================
    const userName =
        user?.FullName ||
        user?.fullName ||
        user?.name ||
        "Dawit Fikre";

    // ==========================================
    // PROFILE CHANGE
    // ==========================================
    const handleProfileChange = (e) => {
        const { name, value } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // PASSWORD CHANGE
    // ==========================================
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPassword((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // PROFILE SUBMIT
    // ==========================================
    const handleProfileSubmit = (e) => {
        e.preventDefault();

        setMessage(
            "Profile settings saved successfully."
        );

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    // ==========================================
    // PASSWORD SUBMIT
    // ==========================================
    const handlePasswordSubmit = (e) => {
        e.preventDefault();

        if (
            !password.current ||
            !password.newPassword ||
            !password.confirm
        ) {
            setMessage(
                "Please complete all password fields."
            );
            return;
        }

        if (
            password.newPassword !==
            password.confirm
        ) {
            setMessage(
                "New password and confirmation do not match."
            );
            return;
        }

        setMessage(
            "Password change request saved."
        );

        setPassword({
            current: "",
            newPassword: "",
            confirm: "",
        });

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    // ==========================================
    // NOTIFICATION SUBMIT
    // ==========================================
    const handleNotificationSubmit = (e) => {
        e.preventDefault();

        setMessage(
            "Notification preferences saved successfully."
        );

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    // ==========================================
    // LOGOUT
    // ==========================================
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        navigate("/", { replace: true });
    };

    return (
        <div className="owner-settings-page">

            {/* =====================================================
                MAIN CONTENT
                Global Sidebar is provided by Layout.jsx
            ====================================================== */}

            <main className="owner-settings-main">

                {/* =================================================
                    HEADER
                ================================================== */}

                <header className="owner-settings-header">

                    <div className="owner-settings-search">
                        <input
                            type="text"
                            placeholder="Search..."
                        />
                    </div>

                    <div className="owner-settings-header-right">

                        <button
                            type="button"
                            className="owner-settings-icon-btn"
                        >
                            <Mail size={19} />
                        </button>

                        <button
                            type="button"
                            className="owner-settings-icon-btn"
                        >
                            <Bell size={19} />

                            <span className="notification-dot"></span>
                        </button>

                        <div className="owner-settings-user">

                            <div className="owner-settings-avatar">
                                {userName
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="owner-settings-user-info">

                                <strong>
                                    {userName}
                                </strong>

                                <span>
                                    Property Owner
                                </span>

                            </div>

                        </div>

                    </div>

                </header>


                {/* =================================================
                    PAGE TITLE
                ================================================== */}

                <section className="owner-settings-title">

                    <div>

                        <h1>
                            Settings
                        </h1>

                        <p>
                            Configure your authorized account
                            and notification settings.
                        </p>

                        <button
                            type="button"
                            className="settings-back-btn"
                            onClick={() =>
                                navigate("/owner-dashboard")
                            }
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>

                    </div>

                </section>


                {/* =================================================
                    MESSAGE
                ================================================== */}

                {message && (
                    <div className="owner-settings-message">
                        {message}
                    </div>
                )}


                {/* =================================================
                    PROFILE INFORMATION
                ================================================== */}

                <section className="owner-settings-card">

                    <div className="owner-settings-card-header">

                        <div className="settings-section-icon">
                            <User size={20} />
                        </div>

                        <div>

                            <h2>
                                Profile Information
                            </h2>

                            <p>
                                Update your personal account information.
                            </p>

                        </div>

                    </div>

                    <form onSubmit={handleProfileSubmit}>

                        <div className="settings-form-grid">

                            <div className="settings-field">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={profile.fullName}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your full name"
                                />

                            </div>


                            <div className="settings-field">

                                <label>
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your email"
                                />

                            </div>


                            <div className="settings-field">

                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your phone number"
                                />

                            </div>

                        </div>

                        <div className="settings-form-actions">

                            <button
                                type="submit"
                                className="settings-save-btn"
                            >
                                <Save size={17} />
                                Save Changes
                            </button>

                        </div>

                    </form>

                </section>


                {/* =================================================
                    SECURITY
                ================================================== */}

                <section className="owner-settings-card">

                    <div className="owner-settings-card-header">

                        <div className="settings-section-icon">
                            <Lock size={20} />
                        </div>

                        <div>

                            <h2>
                                Security
                            </h2>

                            <p>
                                Change your account password.
                            </p>

                        </div>

                    </div>

                    <form onSubmit={handlePasswordSubmit}>

                        <div className="settings-form-grid">

                            {/* CURRENT PASSWORD */}

                            <div className="settings-field">

                                <label>
                                    Current Password
                                </label>

                                <div className="password-input-wrapper">

                                    <input
                                        type={
                                            showCurrent
                                                ? "text"
                                                : "password"
                                        }
                                        name="current"
                                        value={password.current}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter current password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrent(
                                                !showCurrent
                                            )
                                        }
                                    >
                                        {showCurrent ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                            </div>


                            {/* NEW PASSWORD */}

                            <div className="settings-field">

                                <label>
                                    New Password
                                </label>

                                <div className="password-input-wrapper">

                                    <input
                                        type={
                                            showNew
                                                ? "text"
                                                : "password"
                                        }
                                        name="newPassword"
                                        value={password.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter new password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNew(
                                                !showNew
                                            )
                                        }
                                    >
                                        {showNew ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                            </div>


                            {/* CONFIRM PASSWORD */}

                            <div className="settings-field">

                                <label>
                                    Confirm New Password
                                </label>

                                <div className="password-input-wrapper">

                                    <input
                                        type={
                                            showConfirm
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirm"
                                        value={password.confirm}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm new password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirm(
                                                !showConfirm
                                            )
                                        }
                                    >
                                        {showConfirm ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                            </div>

                        </div>

                        <div className="settings-form-actions">

                            <button
                                type="submit"
                                className="settings-save-btn"
                            >
                                <Lock size={17} />
                                Change Password
                            </button>

                        </div>

                    </form>

                </section>


                {/* =================================================
                    NOTIFICATION PREFERENCES
                ================================================== */}

                <section className="owner-settings-card">

                    <div className="owner-settings-card-header">

                        <div className="settings-section-icon">
                            <Bell size={20} />
                        </div>

                        <div>

                            <h2>
                                Notification Preferences
                            </h2>

                            <p>
                                Choose which notifications you want to receive.
                            </p>

                        </div>

                    </div>

                    <form onSubmit={handleNotificationSubmit}>

                        <div className="settings-options">

                            {/* EMAIL */}

                            <label className="settings-option">

                                <div className="settings-option-text">

                                    <strong>
                                        Email Notifications
                                    </strong>

                                    <span>
                                        Receive important system updates by email.
                                    </span>

                                </div>

                                <input
                                    type="checkbox"
                                    checked={notifications.email}
                                    onChange={(e) =>
                                        setNotifications({
                                            ...notifications,
                                            email: e.target.checked,
                                        })
                                    }
                                />

                            </label>


                            {/* APPOINTMENTS */}

                            <label className="settings-option">

                                <div className="settings-option-text">

                                    <strong>
                                        Appointment Notifications
                                    </strong>

                                    <span>
                                        Receive notifications about appointments.
                                    </span>

                                </div>

                                <input
                                    type="checkbox"
                                    checked={
                                        notifications.appointments
                                    }
                                    onChange={(e) =>
                                        setNotifications({
                                            ...notifications,
                                            appointments:
                                                e.target.checked,
                                        })
                                    }
                                />

                            </label>


                            {/* MAINTENANCE */}

                            <label className="settings-option">

                                <div className="settings-option-text">

                                    <strong>
                                        Maintenance Notifications
                                    </strong>

                                    <span>
                                        Receive updates about maintenance requests.
                                    </span>

                                </div>

                                <input
                                    type="checkbox"
                                    checked={
                                        notifications.maintenance
                                    }
                                    onChange={(e) =>
                                        setNotifications({
                                            ...notifications,
                                            maintenance:
                                                e.target.checked,
                                        })
                                    }
                                />

                            </label>


                            {/* PAYMENTS */}

                            <label className="settings-option">

                                <div className="settings-option-text">

                                    <strong>
                                        Payment Notifications
                                    </strong>

                                    <span>
                                        Receive notifications about payments.
                                    </span>

                                </div>

                                <input
                                    type="checkbox"
                                    checked={
                                        notifications.payments
                                    }
                                    onChange={(e) =>
                                        setNotifications({
                                            ...notifications,
                                            payments:
                                                e.target.checked,
                                        })
                                    }
                                />

                            </label>

                        </div>

                        <div className="settings-form-actions">

                            <button
                                type="submit"
                                className="settings-save-btn"
                            >
                                <Save size={17} />
                                Save Preferences
                            </button>

                        </div>

                    </form>

                </section>

            </main>

        </div>
    );
};

export default OwnerSettings;

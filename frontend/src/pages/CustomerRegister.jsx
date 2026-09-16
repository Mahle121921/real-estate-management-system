import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Building2, UserPlus } from "lucide-react";

import "./CustomerAuth.css";

const API_BASE = "http://localhost:5000/api";

function CustomerRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.fullName ||
            !formData.email ||
            !formData.phone ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setError("Please fill in all fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        try {
            setLoading(true);

            await axios.post(
                `${API_BASE}/auth/register`,
                {
                    FullName: formData.fullName,
                    Email: formData.email,
                    Phone: formData.phone,
                    Password: formData.password,
                    Role: "Customer",
                }
            );

            setSuccess(
                "Registration successful. Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/customer-login");
            }, 1500);
        } catch (err) {
            console.error(
                "Customer registration error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="customer-auth-page">
            <div className="customer-auth-card">

                <div className="customer-auth-logo">
                    <Building2 size={38} />

                    <div>
                        <h1>REAL ESTATE</h1>
                        <span>
                            PROPERTY SALES, RENTAL
                            & MANAGEMENT SYSTEM
                        </span>
                    </div>
                </div>

                <div className="customer-auth-title">
                    <UserPlus size={24} />

                    <div>
                        <h2>Create Customer Account</h2>
                        <p>
                            Register to browse and manage
                            your property activities.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="customer-auth-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="customer-auth-success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="customer-form-group">
                        <label>Full Name</label>

                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="customer-form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="customer-form-group">
                        <label>Phone Number</label>

                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                        />
                    </div>

                    <div className="customer-form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="customer-form-group">
                        <label>Confirm Password</label>

                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="customer-auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>
                </form>

                <div className="customer-auth-footer">
                    <span>
                        Already have an account?
                    </span>

                    <Link to="/customer-login">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default CustomerRegister;

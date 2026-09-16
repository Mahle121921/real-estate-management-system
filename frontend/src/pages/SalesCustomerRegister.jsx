
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    UserPlus,
    ArrowLeft,
    Save,
    X,
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import "./SalesCustomerRegister.css";

const API_URL = "http://localhost:5000/api/customers";

function SalesCustomerRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        address: "",
        idType: "",
        idNumber: "",
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.fullName.trim()) {
            setError("Full name is required.");
            return;
        }

        if (!formData.phoneNumber.trim()) {
            setError("Phone number is required.");
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                API_URL,
                {
                    fullName: formData.fullName.trim(),
                    phoneNumber: formData.phoneNumber.trim(),
                    email: formData.email.trim() || null,
                    address: formData.address.trim() || null,
                    idType: formData.idType || null,
                    idNumber: formData.idNumber.trim() || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Customer created:", response.data);

            setSuccess("Customer registered successfully.");

            setFormData({
                fullName: "",
                phoneNumber: "",
                email: "",
                address: "",
                idType: "",
                idNumber: "",
            });

        } catch (err) {
            console.error("Customer registration error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to register customer. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/sales/customers");
    };

    return (
        <div className="scr-page">

            <div className="scr-header">

                <button
                    className="scr-back-btn"
                    onClick={handleCancel}
                >
                    <ArrowLeft size={18} />
                    Back to Customers
                </button>

                <div className="scr-title">

                    <div className="scr-title-icon">
                        <UserPlus size={24} />
                    </div>

                    <div>
                        <h1>Register Customer</h1>
                        <p>
                            Register a new customer for property
                            sales and rental services
                        </p>
                    </div>

                </div>

            </div>

            <div className="scr-content">

                <div className="scr-card">

                    <div className="scr-card-header">

                        <div>
                            <h2>Customer Information</h2>
                            <p>
                                Enter the customer's information below.
                            </p>
                        </div>

                        <span className="scr-required">
                            * Required
                        </span>

                    </div>

                    {success && (
                        <div className="scr-alert success">
                            <CheckCircle2 size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    {error && (
                        <div className="scr-alert error">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* Full Name */}

                        <div className="scr-form-group">

                            <label>
                                <User size={16} />
                                Full Name <span>*</span>
                            </label>

                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter customer's full name"
                                required
                            />

                        </div>

                        {/* Phone + Email */}

                        <div className="scr-form-row">

                            <div className="scr-form-group">

                                <label>
                                    <Phone size={16} />
                                    Phone Number <span>*</span>
                                </label>

                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="09XXXXXXXX"
                                    required
                                />

                            </div>

                            <div className="scr-form-group">

                                <label>
                                    <Mail size={16} />
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="customer@example.com"
                                />

                            </div>

                        </div>

                        {/* ID Type + ID Number */}

                        <div className="scr-form-row">

                            <div className="scr-form-group">

                                <label>
                                    <CreditCard size={16} />
                                    ID Type
                                </label>

                                <select
                                    name="idType"
                                    value={formData.idType}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Select ID type
                                    </option>

                                    <option value="National ID">
                                        National ID
                                    </option>

                                    <option value="Passport">
                                        Passport
                                    </option>

                                    <option value="Driving License">
                                        Driving License
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>

                            </div>

                            <div className="scr-form-group">

                                <label>
                                    <CreditCard size={16} />
                                    ID Number
                                </label>

                                <input
                                    type="text"
                                    name="idNumber"
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                    placeholder="Enter ID number"
                                />

                            </div>

                        </div>

                        {/* Address */}

                        <div className="scr-form-group">

                            <label>
                                <MapPin size={16} />
                                Address
                            </label>

                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter customer's address"
                                rows="4"
                            />

                        </div>

                        {/* Buttons */}

                        <div className="scr-actions">

                            <button
                                type="button"
                                className="scr-cancel-btn"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                <X size={18} />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="scr-save-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="scr-spinner"
                                        />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Register Customer
                                    </>
                                )}
                            </button>

                        </div>

                    </form>

                </div>

                <div className="scr-info-card">

                    <div className="scr-info-header">
                        <UserPlus size={20} />
                        <h3>Customer Registration</h3>
                    </div>

                    <p>
                        Sales Staff can register customers before
                        creating reservations, sales, rental agreements,
                        appointments, or payments.
                    </p>

                    <div className="scr-info-item">
                        <User size={18} />

                        <div>
                            <strong>Customer Name</strong>
                            <span>
                                Full name is required.
                            </span>
                        </div>
                    </div>

                    <div className="scr-info-item">
                        <Phone size={18} />

                        <div>
                            <strong>Contact</strong>
                            <span>
                                Phone number is required.
                            </span>
                        </div>
                    </div>

                    <div className="scr-info-item">
                        <CreditCard size={18} />

                        <div>
                            <strong>Identification</strong>
                            <span>
                                ID information can be recorded.
                            </span>
                        </div>
                    </div>

                    <div className="scr-info-item">
                        <MapPin size={18} />

                        <div>
                            <strong>Address</strong>
                            <span>
                                Customer address is optional.
                            </span>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default SalesCustomerRegister;

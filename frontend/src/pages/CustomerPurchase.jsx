import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    Loader2,
    MapPin,
    ShoppingCart,
    XCircle,
} from "lucide-react";

import "./CustomerPurchase.css";

const API_BASE = "http://localhost:5000/api";

function CustomerPurchase() {
    const { propertyId } = useParams();
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [customerId, setCustomerId] = useState(null);

    const [saleDate, setSaleDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // =====================================================
    // FORMAT TODAY
    // =====================================================
    useEffect(() => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        setSaleDate(`${year}-${month}-${day}`);
    }, []);

    // =====================================================
    // LOAD PROPERTY + CUSTOMER
    // =====================================================
    useEffect(() => {
        const loadData = async () => {
            if (!propertyId) {
                setError("Property was not specified.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                // -----------------------------------------
                // LOAD PROPERTY
                // -----------------------------------------
                const propertyResponse = await axios.get(
                    `${API_BASE}/properties/${propertyId}`,
                    config
                );

                const propertyData =
                    propertyResponse.data?.property ||
                    propertyResponse.data?.data ||
                    propertyResponse.data;

                if (!propertyData) {
                    throw new Error("Property information not found.");
                }

                setProperty(propertyData);

                // -----------------------------------------
                // LOAD CUSTOMER RESERVATIONS
                //
                // /reservations/my already returns CustomerID
                // -----------------------------------------
                const reservationResponse = await axios.get(
                    `${API_BASE}/reservations/my`,
                    config
                );

                const reservations =
                    reservationResponse.data?.reservations ||
                    reservationResponse.data?.data ||
                    [];

                const customerReservation = Array.isArray(reservations)
                    ? reservations.find(
                          (reservation) =>
                              Number(
                                  reservation.PropertyID ||
                                      reservation.propertyId
                              ) === Number(propertyId)
                      )
                    : null;

                if (customerReservation?.CustomerID) {
                    setCustomerId(customerReservation.CustomerID);
                } else if (Array.isArray(reservations) && reservations.length) {
                    // We can still obtain CustomerID from any reservation
                    // belonging to this customer.
                    const firstCustomerId =
                        reservations[0]?.CustomerID ||
                        reservations[0]?.customerId;

                    if (firstCustomerId) {
                        setCustomerId(firstCustomerId);
                    }
                }
            } catch (err) {
                console.error("Load purchase data error:", err);

                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to load purchase information."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [propertyId]);

    // =====================================================
    // SUBMIT PURCHASE
    // =====================================================
    const handlePurchase = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!property) {
            setError("Property information is not available.");
            return;
        }

        if (!customerId) {
            setError(
                "Your customer profile could not be identified. Please contact the administrator."
            );
            return;
        }

        if (!saleDate) {
            setError("Please select a purchase date.");
            return;
        }

        const propertyStatus =
            property.Status || property.status || "Available";

        if (propertyStatus === "Sold") {
            setError("This property has already been sold.");
            return;
        }

        if (propertyStatus === "Rented") {
            setError("This property is currently rented.");
            return;
        }

        if (
            propertyStatus !== "Available" &&
            propertyStatus !== "Reserved"
        ) {
            setError(
                `This property is currently ${propertyStatus} and cannot be purchased.`
            );
            return;
        }

        const salePrice =
            property.SalePrice ??
            property.salePrice ??
            property.Price ??
            property.price;

        if (
            salePrice === undefined ||
            salePrice === null ||
            salePrice === ""
        ) {
            setError("Sale price is not available for this property.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to submit a purchase request for ${
                property.PropertyName ||
                property.propertyName ||
                "this property"
            }?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post(
                `${API_BASE}/sales`,
                {
                    PropertyID: Number(propertyId),
                    CustomerID: Number(customerId),
                    SaleDate: saleDate,
                    SalePrice: Number(salePrice),
                    PaymentStatus: "Pending",
                },
                config
            );

            console.log("Purchase response:", response.data);

            setSuccess(
                response.data?.message ||
                    "Purchase request submitted successfully."
            );

            // Refresh property so status changes to Reserved
            try {
                const refreshed = await axios.get(
                    `${API_BASE}/properties/${propertyId}`,
                    config
                );

                const refreshedProperty =
                    refreshed.data?.property ||
                    refreshed.data?.data ||
                    refreshed.data;

                if (refreshedProperty) {
                    setProperty(refreshedProperty);
                }
            } catch {
                // Property refresh is optional
            }
        } catch (err) {
            console.error("Purchase error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to submit purchase request."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // =====================================================
    // LOADING
    // =====================================================
    if (loading) {
        return (
            <div className="customer-purchase-page">
                <div className="purchase-loading">
                    <Loader2 size={35} className="spin" />
                    <p>Loading purchase information...</p>
                </div>
            </div>
        );
    }

    // =====================================================
    // NO PROPERTY
    // =====================================================
    if (!property) {
        return (
            <div className="customer-purchase-page">
                <div className="purchase-empty">
                    <XCircle size={48} />

                    <h2>Property Not Found</h2>

                    <p>
                        The property information could not be loaded.
                    </p>

                    <Link
                        to="/customer/properties"
                        className="purchase-btn primary"
                    >
                        Browse Properties
                    </Link>
                </div>
            </div>
        );
    }

    const propertyName =
        property.PropertyName ||
        property.propertyName ||
        "Property";

    const propertyType =
        property.PropertyType ||
        property.propertyType ||
        "Property";

    const address =
        property.Address ||
        property.address ||
        property.Location ||
        "Address not available";

    const salePrice =
        property.SalePrice ??
        property.salePrice ??
        property.Price ??
        property.price;

    const status =
        property.Status ||
        property.status ||
        "Available";

    const isAvailable =
        status === "Available" || status === "Reserved";

    return (
        <div className="customer-purchase-page">

            {/* =================================================
                HEADER
            ================================================= */}
            <div className="purchase-header">
                <Link
                    to={`/customer/properties/${propertyId}`}
                    className="purchase-back-link"
                >
                    <ArrowLeft size={18} />
                    Back to Property
                </Link>

                <div>
                    <h1>Purchase Property</h1>

                    <p>
                        Submit your purchase request for this property.
                    </p>
                </div>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}
            {error && (
                <div className="purchase-alert error">
                    <XCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="purchase-alert success">
                    <CheckCircle2 size={20} />
                    <span>{success}</span>
                </div>
            )}

            {/* =================================================
                MAIN GRID
            ================================================= */}
            <div className="purchase-grid">

                {/* =============================================
                    PROPERTY SUMMARY
                ============================================= */}
                <div className="purchase-property-card">

                    <div className="purchase-property-icon">
                        <Building2 size={30} />
                    </div>

                    <span className="purchase-property-type">
                        {propertyType}
                    </span>

                    <h2>{propertyName}</h2>

                    <div className="purchase-location">
                        <MapPin size={17} />

                        <span>{address}</span>
                    </div>

                    <div
                        className={`purchase-property-status ${String(
                            status
                        ).toLowerCase()}`}
                    >
                        {status}
                    </div>

                    <div className="purchase-price-box">
                        <span>Sale Price</span>

                        <strong>
                            ETB{" "}
                            {Number(
                                salePrice || 0
                            ).toLocaleString()}
                        </strong>
                    </div>
<div className="purchase-notice">
    <CreditCard size={18} />

    <div>
        <strong>Manual Payment</strong>

        <p>
            Your purchase request will be submitted as pending.
            Payment must be confirmed by an authorized administrator
            or sales agent.
        </p>
    </div>
</div>
                </div>

                {/* =============================================
                    PURCHASE FORM
                ============================================= */}
                <div className="purchase-form-card">

                    <div className="purchase-form-title">
                        <ShoppingCart size={23} />

                        <div>
                            <h2>Purchase Request</h2>

                            <p>
                                Review the information before submitting
                                your purchase request.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handlePurchase}>

                        {/* PROPERTY */}
                        <div className="purchase-form-group">
                            <label>Property</label>

                            <input
                                type="text"
                                value={propertyName}
                                readOnly
                            />
                        </div>

                        {/* PRICE */}
                        <div className="purchase-form-group">
                            <label>Purchase Price</label>

                            <div className="purchase-price-input">
                                <span>ETB</span>

                                <input
                                    type="text"
                                    value={Number(
                                        salePrice || 0
                                    ).toLocaleString()}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* DATE */}
                        <div className="purchase-form-group">
                            <label>Purchase Date</label>

                            <div className="purchase-date-input">
                                <Calendar size={17} />

                                <input
                                    type="date"
                                    value={saleDate}
                                    max={
                                        new Date()
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                    onChange={(e) =>
                                        setSaleDate(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* PAYMENT STATUS */}
                        <div className="purchase-status-box">
                            <div className="status-icon">
                                <CreditCard size={18} />
                            </div>

                            <div>
                                <strong>
                                    Payment Status: Pending
                                </strong>

                                <p>
                                    After submitting this request,
                                    an Administrator or Sales Agent
                                    can record your payment.
                                </p>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            className="purchase-submit-btn"
                            disabled={
                                submitting ||
                                !isAvailable ||
                                !customerId
                            }
                        >
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={19}
                                        className="spin"
                                    />

                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={19} />

                                    Submit Purchase Request
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            className="purchase-cancel-btn"
                            onClick={() =>
                                navigate(
                                    `/customer/properties/${propertyId}`
                                )
                            }
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>

            {/* =================================================
                PURCHASE INFORMATION
            ================================================= */}
            <div className="purchase-process-card">

                <h2>What happens next?</h2>

                <div className="purchase-steps">

                    <div className="purchase-step">
                        <span>1</span>

                        <div>
                            <strong>Submit Request</strong>

                            <p>
                                Your purchase request is recorded
                                as pending.
                            </p>
                        </div>
                    </div>

                    <div className="purchase-step">
                        <span>2</span>

                        <div>
                            <strong>Payment</strong>

                            <p>
                                An authorized staff member records
                                your payment.
                            </p>
                        </div>
                    </div>

                    <div className="purchase-step">
                        <span>3</span>

                        <div>
                            <strong>Confirmation</strong>

                            <p>
                                Once payment is confirmed, the sale
                                becomes paid.
                            </p>
                        </div>
                    </div>

                    <div className="purchase-step">
                        <span>4</span>

                        <div>
                            <strong>Property Sold</strong>

                            <p>
                                The property status changes to Sold.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default CustomerPurchase;
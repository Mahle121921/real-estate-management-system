import { useEffect, useState } from "react";
import axios from "axios";
import {
    ShoppingCart,
    Building2,
    Calendar,
    CreditCard,
    Loader2,
    XCircle,
    CheckCircle2
} from "lucide-react";

import "./CustomerPurchases.css";

const API_BASE = "http://localhost:5000/api";

function CustomerPurchases() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    useEffect(() => {
        const loadPurchases = async () => {
           try {
    setLoading(true);
    setError("");

    const response = await axios.get(
        `${API_BASE}/sales/my`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    console.log("Customer sales response:", response.data);

    const sales =
        response.data?.sales ||
        response.data?.data ||
        response.data ||
        [];

    setPurchases(
        Array.isArray(sales) ? sales : []
    );

} catch (err) {
                console.error(
                    "Load customer purchases error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load your purchases."
                );
            } finally {
                setLoading(false);
            }
        };

        loadPurchases();
    }, []);

    const getPropertyName = (purchase) =>
        purchase.PropertyName ||
        purchase.propertyName ||
        purchase.Property?.PropertyName ||
        "Property";

    const getSalePrice = (purchase) =>
        purchase.SalePrice ??
        purchase.salePrice ??
        purchase.Price ??
        0;

    const getStatus = (purchase) =>
        purchase.PaymentStatus ||
        purchase.paymentStatus ||
        purchase.Status ||
        purchase.status ||
        "Pending";

    const getSaleDate = (purchase) =>
        purchase.SaleDate ||
        purchase.saleDate ||
        "";

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString();
    };

    const getStatusClass = (status) => {
        const normalized = String(status)
            .toLowerCase()
            .replace(/\s+/g, "-");

        return `purchase-status ${normalized}`;
    };

    if (loading) {
        return (
            <div className="customer-purchases-page">
                <div className="customer-purchases-loading">
                    <Loader2
                        size={36}
                        className="spin"
                    />

                    <p>
                        Loading your purchases...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-purchases-page">

            {/* HEADER */}
            <div className="customer-purchases-header">

                <div className="customer-purchases-title">

                    <div className="customer-purchases-title-icon">
                        <ShoppingCart size={26} />
                    </div>

                    <div>
                        <h1>My Purchases</h1>

                        <p>
                            View your property purchase requests
                            and payment status.
                        </p>
                    </div>

                </div>

            </div>

            {/* ERROR */}
            {error && (
                <div className="customer-purchases-alert error">
                    <XCircle size={20} />

                    <span>
                        {error}
                    </span>
                </div>
            )}

            {/* EMPTY */}
            {!error && purchases.length === 0 && (
                <div className="customer-purchases-empty">

                    <ShoppingCart size={50} />

                    <h2>
                        No Purchases Yet
                    </h2>

                    <p>
                        You have not submitted any
                        property purchase requests yet.
                    </p>
                </div>
            )}

            {/* PURCHASES */}
            {purchases.length > 0 && (
                <div className="customer-purchases-grid">

                    {purchases.map((purchase, index) => {

                        const propertyName =
                            getPropertyName(purchase);

                        const salePrice =
                            getSalePrice(purchase);

                        const status =
                            getStatus(purchase);

                        return (
                            <div
                                className="customer-purchase-card"
                                key={
                                    purchase.SaleID ||
                                    purchase.saleId ||
                                    index
                                }
                            >

                                {/* CARD HEADER */}
                                <div className="customer-purchase-card-header">

                                    <div className="customer-purchase-property-icon">
                                        <Building2 size={24} />
                                    </div>

                                    <div>
                                        <h2>
                                            {propertyName}
                                        </h2>

                                        <span>
                                            Purchase Request
                                        </span>
                                    </div>

                                </div>

                                {/* DETAILS */}
                                <div className="customer-purchase-details">

                                    <div className="customer-purchase-detail">

                                        <Calendar size={18} />

                                        <div>
                                            <span>
                                                Purchase Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    getSaleDate(
                                                        purchase
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="customer-purchase-detail">

                                        <CreditCard size={18} />

                                        <div>
                                            <span>
                                                Purchase Price
                                            </span>

                                            <strong>
                                                ETB{" "}
                                                {Number(
                                                    salePrice
                                                ).toLocaleString()}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* STATUS */}
                                <div className="customer-purchase-card-footer">

                                    <span>
                                        Payment Status
                                    </span>

                                    <div
                                        className={getStatusClass(
                                            status
                                        )}
                                    >
                                        {String(status).toLowerCase() ===
                                        "paid" ? (
                                            <CheckCircle2
                                                size={17}
                                            />
                                        ) : (
                                            <CreditCard
                                                size={17}
                                            />
                                        )}

                                        {status}
                                    </div>

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

        </div>
    );
}

export default CustomerPurchases;

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FileText,
  Search,
  RefreshCw,
  Calendar,
  User,
  Building2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import "./OwnerRentalAgreements.css";

const OwnerRentalAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  const fetchRentalAgreements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      const ownerResponse = await axios.get(
        "http://localhost:5000/api/owners/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const owner =
        ownerResponse.data?.owner ||
        ownerResponse.data?.data ||
        ownerResponse.data;

      const ownerId =
        owner?.OwnerID ||
        owner?.ownerID ||
        owner?.id;

      if (!ownerId) {
        setError("Unable to identify the current owner.");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/owners/${ownerId}/rental-agreements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        response.data?.rentalAgreements ||
        response.data?.agreements ||
        response.data?.data ||
        [];

      setAgreements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading rental agreements:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load rental agreements."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAgreements = async () => {
      await fetchRentalAgreements();
    };

    loadAgreements();
  }, [fetchRentalAgreements]);

  const filteredAgreements = useMemo(() => {
    let result = [...agreements];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter((agreement) =>
        [
          agreement.PropertyName,
          agreement.propertyName,
          agreement.Property,
          agreement.property,
          agreement.TenantName,
          agreement.tenantName,
          agreement.FullName,
          agreement.fullName,
          agreement.CustomerName,
          agreement.AgreementID,
          agreement.agreementID,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(search)
          )
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((agreement) => {
        const status =
          agreement.Status ||
          agreement.status ||
          "";

        return (
          String(status).toLowerCase() ===
          statusFilter.toLowerCase()
        );
      });
    }

    return result;
  }, [agreements, searchTerm, statusFilter]);

  const getStatusClass = (status) => {
    if (!status) return "status-default";

    switch (String(status).toLowerCase()) {
      case "active":
      case "approved":
      case "completed":
        return "status-active";

      case "pending":
        return "status-pending";

      case "expired":
      case "cancelled":
      case "canceled":
      case "terminated":
        return "status-expired";

      default:
        return "status-default";
    }
  };

  const getStatusIcon = (status) => {
    if (!status) {
      return <AlertCircle size={15} />;
    }

    switch (String(status).toLowerCase()) {
      case "active":
      case "approved":
      case "completed":
        return <CheckCircle size={15} />;

      case "pending":
        return <Clock size={15} />;

      case "expired":
      case "cancelled":
      case "canceled":
      case "terminated":
        return <XCircle size={15} />;

      default:
        return <AlertCircle size={15} />;
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "—";
    }

    const number = Number(amount);

    if (Number.isNaN(number)) {
      return amount;
    }

    return `${number.toLocaleString()} ETB`;
  };

  const getValue = (
    agreement,
    fields,
    fallback = "—"
  ) => {
    for (const field of fields) {
      if (
        agreement[field] !== undefined &&
        agreement[field] !== null &&
        agreement[field] !== ""
      ) {
        return agreement[field];
      }
    }

    return fallback;
  };

  const activeCount = agreements.filter((agreement) => {
    const status = getValue(
      agreement,
      ["Status", "status"],
      ""
    );

    return ["active", "approved"].includes(
      String(status).toLowerCase()
    );
  }).length;

  const pendingCount = agreements.filter((agreement) => {
    const status = getValue(
      agreement,
      ["Status", "status"],
      ""
    );

    return String(status).toLowerCase() === "pending";
  }).length;

  const expiredCount = agreements.filter((agreement) => {
    const status = getValue(
      agreement,
      ["Status", "status"],
      ""
    );

    return [
      "expired",
      "terminated",
      "cancelled",
      "canceled",
    ].includes(String(status).toLowerCase());
  }).length;

  return (
    <div className="owner-rental-page">
      <div className="owner-rental-header">
        <div className="owner-rental-title">
          <FileText size={28} />

          <div>
            <h1>Rental Agreements</h1>
            <p>
              View and manage rental agreements for your
              properties.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="owner-refresh-btn"
          onClick={fetchRentalAgreements}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "spinning" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="owner-rental-stats">
        <div className="owner-rental-stat-card">
          <div className="stat-icon total">
            <FileText size={21} />
          </div>

          <div>
            <span>Total Agreements</span>
            <strong>{agreements.length}</strong>
          </div>
        </div>

        <div className="owner-rental-stat-card">
          <div className="stat-icon active">
            <CheckCircle size={21} />
          </div>

          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="owner-rental-stat-card">
          <div className="stat-icon pending">
            <Clock size={21} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="owner-rental-stat-card">
          <div className="stat-icon expired">
            <XCircle size={21} />
          </div>

          <div>
            <span>Expired</span>
            <strong>{expiredCount}</strong>
          </div>
        </div>
      </div>

      <div className="owner-rental-toolbar">
        <div className="owner-rental-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search property, tenant, or agreement..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>

        <select
          className="owner-status-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="owner-rental-error">
          <AlertCircle size={20} />

          <div>
            <strong>
              Unable to load rental agreements
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="owner-rental-table-card">
        <div className="owner-rental-table-header">
          <div>
            <h2>Rental Agreement Records</h2>

            <span>
              {filteredAgreements.length} agreement
              {filteredAgreements.length !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="owner-rental-loading">
            <RefreshCw
              size={30}
              className="spinning"
            />

            <p>Loading rental agreements...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="owner-rental-empty">
            <FileText size={45} />

            <h3>No rental agreements found</h3>

            <p>
              There are no rental agreements matching
              your search.
            </p>
          </div>
        ) : (
          <div className="owner-rental-table-wrapper">
            <table className="owner-rental-table">
              <thead>
                <tr>
                  <th>Agreement</th>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Rent</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAgreements.map(
                  (agreement, index) => {
                    const agreementId = getValue(
                      agreement,
                      [
                        "AgreementID",
                        "agreementID",
                        "id",
                      ],
                      `#${index + 1}`
                    );

                    const propertyName = getValue(
                      agreement,
                      [
                        "PropertyName",
                        "propertyName",
                        "Property",
                        "property",
                      ]
                    );

                    const tenantName = getValue(
                      agreement,
                      [
                        "TenantName",
                        "tenantName",
                        "FullName",
                        "fullName",
                        "CustomerName",
                      ]
                    );

                    const startDate = getValue(
                      agreement,
                      [
                        "StartDate",
                        "startDate",
                        "RentalStartDate",
                      ]
                    );

                    const endDate = getValue(
                      agreement,
                      [
                        "EndDate",
                        "endDate",
                        "RentalEndDate",
                      ]
                    );

                    const rent = getValue(
                      agreement,
                      [
                        "MonthlyRent",
                        "monthlyRent",
                        "RentAmount",
                        "rentAmount",
                        "Rent",
                        "rent",
                      ]
                    );

                    const status = getValue(
                      agreement,
                      ["Status", "status"],
                      "Unknown"
                    );

                    return (
                      <tr
                        key={
                          agreementId ||
                          index
                        }
                      >
                        <td>
                          <div className="agreement-id">
                            <FileText size={17} />
                            <strong>
                              #{agreementId}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <div className="table-property">
                            <div className="table-icon">
                              <Building2
                                size={17}
                              />
                            </div>

                            <span>
                              {propertyName}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="table-tenant">
                            <div className="table-icon">
                              <User size={17} />
                            </div>

                            <span>
                              {tenantName}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="date-cell">
                            <Calendar size={15} />
                            {formatDate(
                              startDate
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="date-cell">
                            <Calendar size={15} />
                            {formatDate(
                              endDate
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="rent-cell">
                            <DollarSign
                              size={15}
                            />
                            {formatCurrency(
                              rent
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`agreement-status ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusIcon(
                              status
                            )}
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerRentalAgreements;
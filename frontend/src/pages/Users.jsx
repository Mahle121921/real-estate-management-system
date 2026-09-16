import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Search,
    Bell,
    Settings,
    Users as UsersIcon,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Edit,
    Power,
    X
} from "lucide-react";
import "./Users.css";

function Users() {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Search and pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "Customer"
    });

    const token = localStorage.getItem("token");

    const loggedInUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const loggedInRole =
        loggedInUser.role ||
        loggedInUser.Role ||
        "";

    // ==========================================
    // GET USERS
    // ==========================================

   const fetchUsers = async () => {
    try {
        setLoading(true);
        setMessage("");

        const response = await axios.get(
            "http://localhost:5000/api/users",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.success) {
            setUsers(response.data.users || []);
        } else {
            setMessage(
                response.data.message ||
                "Failed to load users."
            );
        }

    } catch (error) {
        console.error("Error fetching users:", error);

        if (error.response?.status === 401) {
            setMessage(
                "Unauthorized. Please login again."
            );
        } else if (error.response?.status === 403) {
            setMessage(
                "You are not authorized to manage users."
            );
        } else {
            setMessage(
                error.response?.data?.message ||
                "Failed to load users."
            );
        }

    } finally {
        setLoading(false);
    }
};
    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
        try {
            setLoading(true);
            setMessage("");

            const response = await axios.get(
                "http://localhost:5000/api/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (cancelled) {
                return;
            }

            if (response.data.success) {
                setUsers(response.data.users || []);
            } else {
                setMessage(
                    response.data.message ||
                    "Failed to load users."
                );
            }

        } catch (error) {
            if (cancelled) {
                return;
            }

            console.error(
                "Error fetching users:",
                error
            );

            if (error.response?.status === 401) {
                setMessage(
                    "Unauthorized. Please login again."
                );
            } else if (error.response?.status === 403) {
                setMessage(
                    "You are not authorized to manage users."
                );
            } else {
                setMessage(
                    error.response?.data?.message ||
                    "Failed to load users."
                );
            }

        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }
    };

    loadUsers();

    return () => {
        cancelled = true;
    };
}, [token]);

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredUsers = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return users;
        }

        return users.filter((user) =>
            String(user.UserID || "")
                .toLowerCase()
                .includes(search) ||

            String(user.FullName || "")
                .toLowerCase()
                .includes(search) ||

            String(user.Email || "")
                .toLowerCase()
                .includes(search) ||

            String(user.Role || "")
                .toLowerCase()
                .includes(search) ||

            String(user.Status || "")
                .toLowerCase()
                .includes(search)
        );
    }, [users, searchTerm]);

    // ==========================================
    // PAGINATION
    // ==========================================

    const totalPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / rowsPerPage)
    );

    const safeCurrentPage = Math.min(
        currentPage,
        totalPages
    );

    const startIndex =
        (safeCurrentPage - 1) * rowsPerPage;

    const endIndex = Math.min(
        startIndex + rowsPerPage,
        filteredUsers.length
    );

    const paginatedUsers = filteredUsers.slice(
        startIndex,
        endIndex
    );

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1
    );

    // ==========================================
    // SUMMARY DATA
    // ==========================================

    const totalUsers = users.length;

    const newUsersThisMonth = useMemo(() => {
        const now = new Date();

        return users.filter((user) => {
            const dateValue =
                user.CreatedAt ||
                user.createdAt ||
                user.RegistrationDate ||
                user.registrationDate;

            if (!dateValue) {
                return false;
            }

            const createdDate = new Date(dateValue);

            return (
                createdDate.getFullYear() ===
                    now.getFullYear() &&
                createdDate.getMonth() ===
                    now.getMonth()
            );
        }).length;
    }, [users]);

    // ==========================================
    // FORM HANDLER
    // ==========================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ==========================================
    // OPEN CREATE FORM
    // ==========================================

    const openCreateForm = () => {
        setEditingUser(null);

        setFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
            role: "Customer"
        });

        setMessage("");
        setShowForm(true);
    };

    // ==========================================
    // OPEN EDIT FORM
    // ==========================================

    const openEditForm = (user) => {
        setEditingUser(user);

        setFormData({
            fullName: user.FullName || "",
            email: user.Email || "",
            phoneNumber: user.PhoneNumber || "",
            password: "",
            role: user.Role || "Customer"
        });

        setMessage("");
        setShowForm(true);
    };

    // ==========================================
    // CLOSE FORM
    // ==========================================

    const closeForm = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    // ==========================================
    // CREATE / UPDATE USER
    // ==========================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setMessage("");

            // UPDATE USER
            if (editingUser) {
                const response = await axios.put(
                    `http://localhost:5000/api/users/${editingUser.UserID}`,
                    {
                        fullName: formData.fullName,
                        email: formData.email,
                        phoneNumber: formData.phoneNumber,
                        role: formData.role
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    setMessage(
                        "User updated successfully."
                    );

                    closeForm();
                    await fetchUsers();
                }

            // CREATE USER
            } else {

                if (!formData.password) {
                    setMessage(
                        "Password is required when creating a user."
                    );
                    return;
                }

                const response = await axios.post(
                    "http://localhost:5000/api/users",
                    {
                        fullName: formData.fullName,
                        email: formData.email,
                        phoneNumber: formData.phoneNumber,
                        password: formData.password,
                        role: formData.role
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    setMessage(
                        "User created successfully."
                    );

                    closeForm();
                    await fetchUsers();
                }
            }

        } catch (error) {
            console.error(
                "Error saving user:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Failed to save user."
            );
        }
    };

    // ==========================================
    // ACTIVATE / DEACTIVATE
    // ==========================================

    const handleStatusChange = async (
        userId,
        currentStatus
    ) => {
        const newStatus =
            currentStatus === "Active"
                ? "Inactive"
                : "Active";

        try {
            setMessage("");

            const response = await axios.patch(
                `http://localhost:5000/api/users/${userId}/status`,
                {
                    status: newStatus
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessage(
                    `User status changed to ${newStatus}.`
                );

                await fetchUsers();
            }

        } catch (error) {
            console.error(
                "Error updating user status:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Failed to update user status."
            );
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="users-page">

                <div className="users-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading users...</p>
                </div>

            </div>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="users-page">

            {/* ==================================
                TOP HEADER
            ================================== */}

            <header className="users-top-header">

                <div className="welcome-section">

                    <h1>Welcome Back!</h1>

                    <p>
                        Real Estate management system
                    </p>

                </div>

                <div className="header-actions">

                    <div className="user-search">

                        <Search
                            size={19}
                            className="search-icon"
                        />

                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                           onChange={(event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
}}
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() =>
                                    setSearchTerm("")
                                }
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}

                    </div>

                    <button
                        type="button"
                        className="header-icon-button"
                        title="Notifications"
                    >
                        <Bell size={20} />

                        <span className="notification-badge">
                            3
                        </span>
                    </button>

                    <button
                        type="button"
                        className="header-icon-button"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>

                </div>

            </header>


            {/* ==================================
                MESSAGE
            ================================== */}

            {message && (
                <div className="message">
                    {message}
                </div>
            )}


            {/* ==================================
                SUMMARY CARDS
            ================================== */}

            <section className="summary-cards">

                <div className="summary-card">

                    <div className="summary-card-icon">
                        <UsersIcon size={24} />
                    </div>

                    <div className="summary-card-content">

                        <span className="summary-label">
                            Total System Users
                        </span>

                        <strong>
                            {totalUsers}
                        </strong>

                    </div>

                </div>


                <div className="summary-card">

                    <div className="summary-card-icon">
                        <UserPlus size={24} />
                    </div>

                    <div className="summary-card-content">

                        <span className="summary-label">
                            New User Registrations
                        </span>

                        <strong>
                            {newUsersThisMonth}
                        </strong>

                        <small>
                            This Month
                        </small>

                    </div>

                </div>


                <button
                    type="button"
                    className="add-user-card"
                    onClick={openCreateForm}
                >

                    <div className="add-user-card-icon">
                        <UserPlus size={24} />
                    </div>

                    <div>
                        <strong>
                            Add New User
                        </strong>

                        <span>
                            Create a system account
                        </span>
                    </div>

                </button>

            </section>


            {/* ==================================
                USERS SECTION HEADER
            ================================== */}

            <section className="users-section">

                <div className="users-section-header">

                    <div>

                        <h2>
                            All System Users
                        </h2>

                        <p>
                            Manage system users, roles,
                            and account status.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="add-user-button"
                        onClick={openCreateForm}
                    >
                        <UserPlus size={18} />
                        Add New User
                    </button>

                </div>


                {/* ==================================
                    SEARCH RESULT INFO
                ================================== */}

                <div className="table-toolbar">

                    <span>
                        {searchTerm
                            ? `${filteredUsers.length} users found`
                            : `${users.length} total users`}
                    </span>

                </div>


                {/* ==================================
                    USER FORM
                ================================== */}

                {showForm && (
                    <div className="user-form-container">

                        <div className="user-form-header">

                            <div>
                                <h2>
                                    {editingUser
                                        ? "Edit User"
                                        : "Add New User"}
                                </h2>

                                <p>
                                    {editingUser
                                        ? "Update the user account information."
                                        : "Create a new system user account."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-form-button"
                                onClick={closeForm}
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <form onSubmit={handleSubmit}>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                    />

                                </div>


                                {!editingUser && (
                                    <div className="form-group">

                                        <label>
                                            Password
                                        </label>

                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                        />

                                    </div>
                                )}


                                <div className="form-group">

                                    <label>
                                        Role
                                    </label>

                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >

                                        <option value="Customer">
                                            Customer
                                        </option>

                                        <option value="Sales Agent">
                                            Sales Agent
                                        </option>

                                        <option value="Maintenance Staff">
                                            Maintenance Staff
                                        </option>

{loggedInRole === "Owner" && (
    <option value="Administrator">
        Administrator
    </option>
)}

                                    </select>

                                </div>

                            </div>


                            <div className="form-actions">

                                <button
                                    type="submit"
                                    className="save-user-button"
                                >
                                    {editingUser
                                        ? "Update User"
                                        : "Create User"}
                                </button>

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeForm}
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </div>
                )}


                {/* ==================================
                    USERS TABLE
                ================================== */}

                <div className="users-table-container">

                    <table className="users-table">

                        <thead>

                            <tr>
                                <th>User ID</th>
                                <th>Name</th>
                                <th>Email Address</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>

                        </thead>


                        <tbody>

 {paginatedUsers.length > 0 ? (

    paginatedUsers.map((user) => {

        return (
            <tr key={user.UserID}>

                {/* USER ID */}
                <td>
                    <span className="user-id">
                        #{user.UserID}
                    </span>
                </td>

                {/* NAME */}
                <td>
                    <div className="user-name-cell">

                        <div className="user-avatar">
                            {(
                                user.FullName || "U"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <span>
                            {user.FullName || "-"}
                        </span>

                    </div>
                </td>

                {/* EMAIL */}
                <td>
                    {user.Email || "-"}
                </td>

                {/* ROLE */}
                <td>
                    <span className="role-badge">
                        {user.Role || "-"}
                    </span>
                </td>

                {/* STATUS */}
                <td>
                    <span
                        className={
                            user.Status === "Active"
                                ? "status-active"
                                : "status-inactive"
                        }
                    >
                        <span className="status-dot"></span>

                        {user.Status || "-"}
                    </span>
                </td>

                {/* ACTIONS */}
                <td>
                    <div className="action-buttons">

                        <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                                openEditForm(user)
                            }
                            title="Edit user"
                        >
                            <Edit size={15} />
                            Edit
                        </button>

                        <button
                            type="button"
                            className={
                                user.Status === "Active"
                                    ? "deactivate-button"
                                    : "activate-button"
                            }
                            onClick={() =>
                                handleStatusChange(
                                    user.UserID,
                                    user.Status
                                )
                            }
                            title={
                                user.Status === "Active"
                                    ? "Deactivate user"
                                    : "Activate user"
                            }
                        >
                            <Power size={15} />

                            {user.Status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                        </button>

                    </div>
                </td>

            </tr>
        );
    })

) : (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="no-users"
                                    >
                                        <UsersIcon size={35} />

                                        <strong>
                                            No users found
                                        </strong>

                                        <span>
                                            {searchTerm
                                                ? "Try a different search term."
                                                : "There are no system users to display."}
                                        </span>
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ==================================
                    PAGINATION
                ================================== */}

                <div className="pagination-container">

                    <div className="pagination-info">

                        Showing{" "}

                        <strong>
                            {filteredUsers.length === 0
                                ? 0
                                : startIndex + 1}
                        </strong>

                        {" "}to{" "}

                        <strong>
                            {endIndex}
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {filteredUsers.length}
                        </strong>

                        {" "}entries

                    </div>


                    <div className="pagination-controls">

                        <label className="rows-per-page">

                            Rows per page

                            <select
                                value={rowsPerPage}
onChange={(event) => {
    setRowsPerPage(
        Number(event.target.value)
    );
    setCurrentPage(1);
}}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>

                        </label>


                        <button
                            type="button"
                            className="pagination-button"
                            disabled={safeCurrentPage === 1}
                            onClick={() =>
                                setCurrentPage(
                                    (previous) =>
                                        Math.max(
                                            previous - 1,
                                            1
                                        )
                                )
                            }
                        >
                            <ChevronLeft size={17} />
                            Previous
                        </button>


                        <div className="page-numbers">

                            {pageNumbers.map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={
                                        safeCurrentPage === page
                                            ? "page-number active"
                                            : "page-number"
                                    }
                                    onClick={() =>
                                        setCurrentPage(page)
                                    }
                                >
                                    {page}
                                </button>
                            ))}

                        </div>


                        <button
                            type="button"
                            className="pagination-button"
                            disabled={
                                safeCurrentPage === totalPages ||
                                filteredUsers.length === 0
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (previous) =>
                                        Math.min(
                                            previous + 1,
                                            totalPages
                                        )
                                )
                            }
                        >
                            Next
                            <ChevronRight size={17} />
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Users;

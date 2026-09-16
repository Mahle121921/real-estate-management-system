import { Link, useNavigate } from "react-router-dom";
import {
    Home,
    Users,
    UserCircle,
    Building2,
    UserRound,
    Calendar,
    CalendarDays,
    ShoppingCart,
    FileText,
    CreditCard,
    CalendarCheck,
    Wrench,
    BarChart3,
    Bell,
    ClipboardList,
    Settings,
    LogOut,
    Layers,
    ShieldCheck
} from "lucide-react";

function Sidebar() {
    const navigate = useNavigate();

    // ==========================================
    // GET CURRENT USER
    // ==========================================
    let currentUser = {};

    try {
        currentUser = JSON.parse(
            localStorage.getItem("user") || "{}"
        );
    } catch (error) {
        console.error(
            "Failed to read user from localStorage:",
            error
        );

        currentUser = {};
    }

    // ==========================================
    // GET USER ROLE
    // ==========================================
    const userRole =
        currentUser?.role ||
        currentUser?.Role ||
        currentUser?.RoleName ||
        currentUser?.roleName ||
        "";

    const normalizedRole = String(userRole)
        .trim()
        .toLowerCase();

    const isOwner = normalizedRole === "owner";

    // ==========================================
    // DEBUG
    // ==========================================
    console.log("SIDEBAR CURRENT USER:", currentUser);
    console.log("SIDEBAR USER ROLE:", userRole);
    console.log("SIDEBAR IS OWNER:", isOwner);

    // ==========================================
    // OWNER MENU
    // ==========================================
    const ownerMenuItems = [
        {
            name: "Dashboard",
            path: "/owner-dashboard",
            icon: Home
        },
        {
            name: "Users",
            path: "/owner/users",
            icon: Users
        },
        {
            name: "Property Owners",
            path: "/owner/owners",
            icon: UserCircle
        },
        {
            name: "My Properties",
            path: "/owner/properties",
            icon: Building2
        },
        {
            name: "Property Structure",
            path: "/owner/property-structure",
            icon: Layers
        },
        {
            name: "Customers",
            path: "/owner/customers",
            icon: UserRound
        },
        {
            name: "Reservations",
            path: "/owner/reservations",
            icon: CalendarDays
        },
        {
            name: "Sales",
            path: "/owner/sales",
            icon: ShoppingCart
        },
        {
            name: "Rental Agreements",
            path: "/owner/rental-agreements",
            icon: FileText
        },
        {
            name: "Payments",
            path: "/owner/payments",
            icon: CreditCard
        },
        {
            name: "Maintenance",
            path: "/owner/maintenance",
            icon: Wrench
        },
        {
            name: "Appointments",
            path: "/owner/appointments",
            icon: CalendarCheck
        },
        {
            name: "Revenue & Expenses",
            path: "/owner/revenue",
            icon: BarChart3
        },
        {
            name: "Reports",
            path: "/owner/reports",
            icon: BarChart3
        },
        {
            name: "Activity Logs",
            path: "/owner/activity-logs",
            icon: ClipboardList
        },
        {
            name: "Notifications",
            path: "/owner/notifications",
            icon: Bell
        },
        {
            name: "Settings",
            path: "/owner/settings",
            icon: Settings
        }
    ];

    // ==========================================
    // ADMIN MENU
    // ==========================================
    const adminMenuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: Home
        },
        {
            name: "Properties",
            path: "/properties",
            icon: Building2
        },
        {
            name: "Property Structure",
            path: "/property-structure",
            icon: Layers
        },
        {
            name: "Customers",
            path: "/customers",
            icon: UserRound
        },
        {
            name: "Reservations",
            path: "/reservations",
            icon: CalendarDays
        },
        {
            name: "Sales",
            path: "/sales",
            icon: ShoppingCart
        },
        {
            name: "Rental Agreements",
            path: "/rental-agreements",
            icon: FileText
        },
        {
            name: "Payments",
            path: "/payments",
            icon: CreditCard
        },
        {
            name: "Appointments",
            path: "/appointments",
            icon: CalendarCheck
        },
        {
            name: "Maintenance",
            path: "/maintenance",
            icon: Wrench
        },
        {
            name: "Maintenance Staff",
            path: "/maintenance-staff",
            icon: Users
        },
        {
            name: "Reports",
            path: "/reports",
            icon: BarChart3
        },
        {
            name: "Activity Logs",
            path: "/activity-logs",
            icon: ClipboardList
        },
        {
        name: "Activity Log Access",
        path: "/activity-log-permissions",
        icon: ShieldCheck
        },
        {
            name: "Notifications",
            path: "/notifications",
            icon: Bell
        }
    ];
    // ==========================================
// SALES AGENT MENU
// ==========================================
const salesAgentMenuItems = [
    {
        name: "Dashboard",
        path: "/sales-agent-dashboard",
        icon: Home
    },
    {
        name: "Customers",
        path: "/sales/customer-register",
        icon: UserRound
    },
    {
        name: "Properties",
        path: "/sales/properties",
        icon: Building2
    },
   {
        name: "Rental Agreements",
        path: "/sales/rental-agreements",
        icon: FileText
    },
    {
        name: "Sales",
        path: "/sales",
        icon: ShoppingCart
    },
    {
        name: "Payments",
        path: "/sales/payments",
        icon: CreditCard
    },
    {
        name: "Appointments",
        path: "/sales/appointments",
        icon: CalendarCheck
    },
    {
        name: "Notifications",
        path: "/sales/notifications",
        icon: Bell
    },
    {
        name: "Settings",
        path: "/sales/settings",
        icon: Settings
    }
];
// ==========================================
// MAINTENANCE STAFF MENU
// ==========================================
const maintenanceStaffMenuItems = [
    {
        name: "Dashboard",
        path: "/staff-dashboard",
        icon: Home
    },
    {
        name: "My Requests",
        path: "/staff-dashboard",
        icon: ClipboardList
    },
    {
        name: "Maintenance History",
        path: "/staff/maintenance-history",
        icon: FileText
    },
    {
        name: "Settings",
        path: "/staff/settings",
        icon: Settings
    }
];
// ==========================================
// CUSTOMER MENU
// ==========================================
const customerMenuItems = [
    {
        name: "Dashboard",
        path: "/customer-dashboard",
        icon: Home,
    },
    {
        name: "Browse Properties",
        path: "/customer/properties",
        icon: Building2,
    },
    {
        name: "My Reservations",
        path: "/customer/reservations",
        icon: CalendarCheck,
    },
    {
        name: "My Purchases",
        path: "/customer/purchases",
        icon: ShoppingCart,
    },
    {
        name: "My Rentals",
        path: "/customer/rentals",
        icon: FileText,
    },
    {
        name: "Appointments",
        path: "/customer/appointments",
        icon: Calendar,
    },
    {
        name: "Payments",
        path: "/customer/payments",
        icon: CreditCard,
    },
];
    // ==========================================
    // SELECT MENU
    // ==========================================
const isSalesAgent = normalizedRole === "sales agent";

const isMaintenanceStaff =
    normalizedRole === "maintenance staff";

const isCustomer =
    normalizedRole === "customer";

const menuItems = isOwner
    ? ownerMenuItems
    : isSalesAgent
        ? salesAgentMenuItems
        : isMaintenanceStaff
            ? maintenanceStaffMenuItems
            : isCustomer
                ? customerMenuItems
                : adminMenuItems;

    // ==========================================
    // LOGOUT
    // ==========================================
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        navigate("/", { replace: true });
    };

    // ==========================================
    // SIDEBAR
    // ==========================================
    return (
        <aside className="sidebar">

            {/* SIDEBAR HEADER */}
            <div className="sidebar-header">
                <h2>REAL ESTATE</h2>

                <p>
                    PROPERTY SALES, RENTAL &amp; MANAGEMENT SYSTEM
                </p>
            </div>

            {/* NAVIGATION */}
            <nav className="sidebar-nav">

                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            to={item.path}
                            key={`${item.name}-${item.path}`}
                        >
                            <span className="sidebar-icon">
                                <Icon size={20} />
                            </span>

                            <span>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}

            </nav>

            {/* SIDEBAR FOOTER */}
            <div className="sidebar-footer">

                <button
                    type="button"
                    className="menu-item logout-btn"
                    onClick={handleLogout}
                >
                    <span className="menu-icon">
                        <LogOut size={18} />
                    </span>

                    <span>
                        Logout
                    </span>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;
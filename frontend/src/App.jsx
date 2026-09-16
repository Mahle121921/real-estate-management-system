import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import OwnerDashboard from "./pages/OwnerDashboard";
import Owners from "./pages/Owners";
import OwnerProperties from "./pages/OwnerProperties";
import OwnerAddProperty from "./pages/OwnerAddProperty";
import OwnerPropertyStructure from "./pages/OwnerPropertyStructure";
import OwnerCustomers from "./pages/OwnerCustomers";
import OwnerRevenue from "./pages/OwnerRevenue";
import OwnerMaintenance from "./pages/OwnerMaintenance";
import OwnerAppointments from "./pages/OwnerAppointments";
import OwnerReservations from "./pages/OwnerReservations";
import OwnerSales from "./pages/OwnerSales";
import OwnerRentalAgreements from "./pages/OwnerRentalAgreements";
import OwnerPayments from "./pages/OwnerPayments";
import OwnerReports from "./pages/OwnerReports";
import OwnerSettings from "./pages/OwnerSettings";
import OwnerNotifications from "./pages/OwnerNotifications";
import OwnerActivityLogs from "./pages/OwnerActivityLogs";
import Properties from "./pages/Properties";
import AdminAddProperty from "./pages/AdminAddProperty";
import PropertyDetails from "./pages/PropertyDetails";
import Buildings from "./pages/Buildings";
import Floors from "./pages/Floors";
import Rooms from "./pages/Rooms";
import Customers from "./pages/Customers";
import Reservations from "./pages/Reservations";
import Sales from "./pages/Sales";
import RentalAgreements from "./pages/RentalAgreements";
import Payments from "./pages/Payments";
import Maintenance from "./pages/Maintenance";
import MaintenanceStaff from "./pages/MaintenanceStaffHistory";
import Appointments from "./pages/Appointments";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import ActivityLogs from "./pages/ActivityLogs";
import ActivityLogPermissions from "./pages/ActivityLogPermissions";
import SalesAgentDashboard from "./pages/SalesAgentDashboard";
import SalesCustomerRegister from "./pages/SalesCustomerRegister";
import SalesAgentProperties from "./pages/SalesAgentProperties";
import SalesAgentSales from "./pages/SalesAgentSales";
import SalesAgentRentalAgreements from "./pages/SalesAgentRentalAgreements";
import SalesAgentPayments from "./pages/SalesAgentPayments";
import SalesAgentAppointments from "./pages/SalesAgentAppointments";
import MaintenanceStaffDashboard from "./pages/MaintenanceStaffDashboard";
import MaintenanceStaffHistory from "./pages/MaintenanceStaffHistory";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerProperties from "./pages/CustomerProperties";
import CustomerPropertyDetails from "./pages/CustomerPropertyDetails";
import CustomerReservations from "./pages/CustomerReservations";
import CustomerReservationForm from "./pages/CustomerReservationForm";
import CustomerPurchases from "./pages/CustomerPurchases";
import CustomerRental from "./pages/CustomerRental";
import CustomerPurchase from "./pages/CustomerPurchase";
import CustomerRentals from "./pages/CustomerRentals";
import CustomerAppointments from "./pages/CustomerAppointments";
import CustomerAppointmentForm from "./pages/CustomerAppointmentForm";
import CustomerPayments from "./pages/CustomerPayments";
import CustomerPaymentReceipt from "./pages/CustomerPaymentReceipt";
import Layout from "./components/Layout";


function App() {
    const token = localStorage.getItem("token");

    const storedUser = localStorage.getItem("user");

    const user = storedUser
        ? JSON.parse(storedUser)
        : null;

    const role = user?.Role || user?.role;

    return (
        <BrowserRouter>
            <Routes>

                {/* ================= LOGIN ================= */}
<Route
    path="/"
    element={
        token
            ? (
                role === "Owner"
                    ? (
                        <Navigate
                            to="/owner-dashboard"
                            replace
                        />
                    )
                    : role === "Sales Agent"
                        ? (
                            <Navigate 
                            to="/sales-agent-dashboard" 
                                replace
                            />
                             )
    : role === "Maintenance Staff"
    ? (
        <Navigate
            to="/staff-dashboard"
            replace
        />
    )
    : role === "Customer"
        ? (
            <Navigate
                to="/customer-dashboard"
                replace
            />
        )
        : (
            <Navigate
                to="/dashboard"
                replace
            />
        )
            )
            : <Login />
    }
/>


{/* ================= OWNER DASHBOARD ================= */}

<Route
    path="/owner-dashboard"
    element={
        token && role === "Owner"
            ? <OwnerDashboard />
            : <Navigate to="/" replace />
    }
/>


{/* ================= OWNER USER MANAGEMENT ================= */}

<Route
    path="/owner/users"
    element={
        token && role === "Owner"
            ? <Users />
            : <Navigate to="/" replace />
    }
/>
{/* ================= OWNER PROPERTY OWNERS ================= */}

<Route
    path="/owner/owners"
    element={
        token && role === "Owner"
            ? <Owners />
            : <Navigate to="/" replace />
    }
/>

{/* ================= OWNER PROPERTIES ================= */}

<Route
    path="/owner/properties"
    element={
        token && role === "Owner"
            ? <OwnerProperties />
            : <Navigate to="/" replace />
    }
/>

 {/* ================= OWNER ADD PROPERTY ================= */}

<Route
    path="/owner/properties/add"
    element={
        token && role === "Owner"
            ? <OwnerAddProperty />
            : <Navigate to="/" replace />
    }
/>

{/* ================= OWNER PROPERTY STRUCTURE ================= */}

<Route
    path="/owner/property-structure"
    element={
        token && role === "Owner"
            ? <OwnerPropertyStructure />
            : <Navigate to="/" replace />
    }
/>
<Route
    path="/owner/customers"
    element={
    token && role === "Owner"
     ? <OwnerCustomers />
    : <Navigate to="/" replace />
    }
/>

{/* ================= OWNER REVENUE ================= */}

<Route
    path="/owner/revenue"
    element={
        token && role === "Owner"
            ? <OwnerRevenue />
            : <Navigate to="/" replace />
    }
/>


                {/* ================= OWNER MAINTENANCE ================= */}

                <Route
                    path="/owner/maintenance"
                    element={
                        token && role === "Owner"
                            ? <OwnerMaintenance />
                            : <Navigate to="/" replace />
                    }
                />


                {/* ================= OWNER APPOINTMENTS ================= */}

                <Route
                    path="/owner/appointments"
                    element={
                        token && role === "Owner"
                            ? <OwnerAppointments />
                            : <Navigate to="/" replace />
                    }
                />


                {/* ================= OWNER RESERVATIONS ================= */}

                <Route
                    path="/owner/reservations"
                    element={
                        token && role === "Owner"
                            ? <OwnerReservations />
                            : <Navigate to="/" replace />
                    }
                />


                {/* ================= OWNER RENTAL AGREEMENTS ================= */}

                <Route
                    path="/owner/rental-agreements"
                    element={
                        token && role === "Owner"
                            ? <OwnerRentalAgreements />
                            : <Navigate to="/" replace />
                    }
                />
{/* ================= OWNER SALES ================= */}

<Route
    path="/owner/sales"
    element={
        token && role === "Owner"
            ? <OwnerSales />
            : <Navigate to="/" replace />
    }
/>

{/* ================= OWNER PAYMENTS ================= */}

<Route
    path="/owner/payments"
    element={
        token && role === "Owner"
            ? <OwnerPayments />
            : <Navigate to="/" replace />
    }
/>

{/* ================= OWNER REPORTS ================= */}

<Route
    path="/owner/reports"
    element={
        token && role === "Owner"
            ? <OwnerReports />
            : <Navigate to="/" replace />
    }
/>

{/* ================= OWNER SETTINGS ================= */}

<Route
    path="/owner/settings"
    element={
        token && role === "Owner"
            ? <OwnerSettings />
            : <Navigate to="/" replace />
    }
/>
<Route
    path="/owner/notifications"
    element={
    token && role === "Owner"
       ?<OwnerNotifications />
       : <Navigate to="/" replace />
    }
/>
{/* ================= OWNER ACTIVITY LOGS ================= */}

<Route
    path="/owner/activity-logs"
    element={
        token && role === "Owner"
            ? <OwnerActivityLogs />
            : <Navigate to="/" replace />
    }
/>{/* ================= SALES AGENT DASHBOARD ================= */}

<Route
    path="/sales-agent-dashboard"
    element={
        token && role === "Sales Agent"
            ? <SalesAgentDashboard />
            : <Navigate to="/" replace />
    }
/>

{/* ================= SALES AGENT CUSTOMER REGISTRATION ================= */}

<Route
    path="/sales/customer-register"
    element={
        token && role === "Sales Agent"
            ? <SalesCustomerRegister />
            : <Navigate to="/" replace />
    }
/>

{/* ================= SALES AGENT PROPERTIES ================= */}

<Route
    path="/sales/properties"
    element={
        token && role === "Sales Agent"
            ? <SalesAgentProperties />
            : <Navigate to="/" replace />
    }
/>

{/* ================= SALES AGENT SALES ================= */}

<Route
    path="/sales"
    element={
        token && role === "Sales Agent"
            ? <SalesAgentSales />
            : <Navigate to="/" replace />
    }
/>

{/* ================= SALES AGENT RENTAL AGREEMENTS ================= */}

<Route
    path="/sales/rental-agreements"
    element={
        token && role === "Sales Agent"
            ? <SalesAgentRentalAgreements />
            : <Navigate to="/" replace />
    }
/>

{/* ================= SALES AGENT PAYMENTS ================= */}

<Route
    path="/sales/payments"
    element={
        token && role === "Sales Agent"
            ? <SalesAgentPayments />
            : <Navigate to="/" replace />
    }
/>

{/* ================= SALES AGENT APPOINTMENTS ================= */}

<Route
    path="/sales/appointments"
    element={
        token && role === "Sales Agent"
            ? <SalesAgentAppointments />
            : <Navigate to="/" replace />
    }
/>

{/* ================= MAINTENANCE STAFF DASHBOARD ================= */}

<Route
    path="/staff-dashboard"
    element={
        token && role === "Maintenance Staff"
            ? <MaintenanceStaffDashboard />
            : <Navigate to="/" replace />
    }
/>

{/* ================= MAINTENANCE STAFF HISTORY ================= */}

<Route
    path="/staff/maintenance-history"
    element={
        token && role === "Maintenance Staff"
            ? <MaintenanceStaffHistory />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER DASHBOARD ================= */}

<Route
    path="/customer-dashboard"
    element={
        token && role === "Customer"
            ? <CustomerDashboard />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER REGISTRATION ================= */}

<Route
    path="/customer-register"
    element={<CustomerRegister />}
/>

{/* ================= CUSTOMER PROPERTIES ================= */}

<Route
    path="/customer/properties"
    element={
        token && role === "Customer"
            ? <CustomerProperties />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER PROPERTY DETAILS ================= */}

<Route
    path="/customer/properties/:id"
    element={
        token && role === "Customer"
            ? <CustomerPropertyDetails />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER RESERVATIONS ================= */}

<Route
    path="/customer/reservations"
    element={
        token && role === "Customer"
            ? <CustomerReservations />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER RESERVATION FORM ================= */}

<Route
    path="/customer/reservations/new"
    element={
        token && role === "Customer"
            ? <CustomerReservationForm />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER PURCHASES ================= */}

<Route
    path="/customer/purchases"
    element={
        token && role === "Customer"
            ? <CustomerPurchases />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER PURCHASE ================= */}

<Route
    path="/customer/purchase/:propertyId"
    element={
        token && role === "Customer"
            ? <CustomerPurchase />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER RENTALS ================= */}

<Route
    path="/customer/rentals"
    element={
        token && role === "Customer"
            ? <CustomerRentals />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER RENTAL - SPECIFIC PROPERTY ================= */}

<Route
    path="/customer/rental/:propertyId"
    element={
        token && role === "Customer"
            ? <CustomerRental />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER APPOINTMENTS ================= */}

<Route
    path="/customer/appointments"
    element={
        token && role === "Customer"
            ? <CustomerAppointments />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER APPOINTMENT FORM ================= */}

<Route
    path="/customer/appointments/new/:propertyId"
    element={
        token && role === "Customer"
            ? <CustomerAppointmentForm />
            : <Navigate to="/" replace />
    }
/>

{/* ================= CUSTOMER PAYMENTS ================= */}

<Route
    path="/customer/payments"
    element={
        token && role === "Customer"
            ? <CustomerPayments />
            : <Navigate to="/" replace />
    }
/>

<Route
    path="/customer/payments/receipt/:id"
    element={
        token && role === "Customer"
            ? <CustomerPaymentReceipt />
            : <Navigate to="/" replace />
    }
/>

{/* ================= ADMIN / STAFF PAGES ================= */}
 

                <Route
                    element={
                        token
                            ? <Layout />
                            : <Navigate
                                to="/"
                                replace
                            />
                    }
                >

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />


                   <Route
    path="/properties"
    element={
        token && role === "Administrator"
            ? <Properties />
            : <Navigate to="/" replace />
    }
/>

<Route
    path="/properties/add"
    element={
        token && role === "Administrator"
            ? <AdminAddProperty />
            : <Navigate to="/" replace />
    }
/>

{/* ================= ADMIN PROPERTY STRUCTURE ================= */}

<Route
    path="/property-structure"
    element={
        token && role === "Administrator"
            ? <OwnerPropertyStructure />
            : <Navigate to="/" replace />
    }
/>

<Route
    path="/properties/:id"
    element={<PropertyDetails />}
/>

<Route
    path="/buildings"
    element={
        token ? <Buildings /> : <Navigate to="/" replace />
    }
/>
<Route 
    path="/floors" 
    element={ 
        token ? <Floors /> : <Navigate to="/" replace /> 
    } 
/>
<Route
    path="/rooms"
    element={
        token ? <Rooms /> : <Navigate to="/" replace />
    }
/>
<Route 
    path="/customers" 
    element={
        token ? <Customers /> : <Navigate to="/" replace />
   } 
   
/>
                    <Route
                        path="/reservations"
                        element={
                        token ? <Reservations /> : <Navigate to="/" replace />
                    }
                    />

<Route
    path="/admin/sales"
    element={
        token && role === "Administrator"
            ? <Sales />
            : <Navigate to="/" replace />
    }
/>
                     <Route
    path="/rental-agreements"
    element={
    token ? <RentalAgreements />: <Navigate to="/" replace /> 
}
/>
<Route
                        path="/payments"
                        element={
                        token ? <Payments /> : <Navigate to="/" replace />
                    }
                    />
<Route
    path="/maintenance"
    element={
    token ? <Maintenance /> : <Navigate to="/" replace />
    }
/>
<Route
    path="/maintenance-staff"
    element={
    token ? <MaintenanceStaff /> : <Navigate to="/" replace />
    }
/>
<Route
    path="/appointments"
    element={
       token ?
            <Appointments /> : <Navigate to="/" replace />
    }
/>
<Route
    path="/reports"
    element={ 
        token ?
            <Reports /> : <Navigate to="/" replace />
    }
/>
<Route
    path="/notifications"
    element={
    token ? 
    <Notifications /> : <Navigate to="/" replace />
    }
/>
<Route
    path="/activity-logs"
    element={
        token && role === "Administrator"
            ? <ActivityLogs />
            : <Navigate to="/" replace />
    }
/>

<Route
    path="/activity-log-permissions"
    element={
        token && role === "Administrator"
            ? <ActivityLogPermissions />
            : <Navigate to="/" replace />
    }
/>


</Route>

 {/* ================= UNKNOWN URL ================= */}

<Route
    path="*"
    element={
        <Navigate
            to={
                token
                    ? (
                        role === "Owner"
                            ? "/owner-dashboard"
                            : role === "Sales Agent"
                                ? "/sales-agent-dashboard"
                                : role === "Maintenance Staff"
                                    ? "/staff-dashboard"
                                    : role === "Customer"
                                        ? "/customer-dashboard"
                                        : "/dashboard"
                    )
                    : "/"
            }
            replace
        />
    }
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
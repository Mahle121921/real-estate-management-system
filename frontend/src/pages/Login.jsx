import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Building2 } from "lucide-react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      // Login failed
      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password"
        );
      }

      // Check that token exists
      if (!data.token) {
        throw new Error("Login successful, but token was not received.");
      }

// Save JWT token
localStorage.setItem("token", data.token);

// Save user information
if (data.user) {
  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );
}

// Get logged-in user's role
const role = data.user?.role || data.user?.Role;

// Navigate according to role
if (role === "Owner") {
  navigate("/owner-dashboard");
} else if (role === "Administrator") {
  navigate("/dashboard");
} else if (role === "Manager") {
  navigate("/manager-dashboard");
} else if (role === "Sales Agent") {
  navigate("/sales-agent-dashboard");
} else {
  navigate("/dashboard");
}

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}
      <div className="login-left">
        <div className="overlay"></div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="login-right">

        <div className="login-card">

          {/* ================= LOGO ================= */}
          <div className="login-logo">

            <Building2
              size={42}
              strokeWidth={1.5}
            />

            <h1>
              REAL ESTATE PROPERTY
              <br />
              MANAGEMENT SYSTEM
            </h1>

          </div>

          {/* ================= TITLE ================= */}
          <h2>
            Welcome Back!
          </h2>

          <p className="subtitle">
            Please sign in to your account
          </p>

          {/* ================= ERROR ================= */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          <form onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="input-group">

              <Mail
                size={18}
                className="input-icon"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

            {/* PASSWORD */}
            <div className="input-group">

              <Lock
                size={18}
                className="input-icon"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <a
                href="#"
                className="forgot-password"
                onClick={(e) => {
                  e.preventDefault();

                  setError(
                    "Please contact the administrator to reset your password."
                  );
                }}
              >
                Forgot Password?
              </a>

            </div>

            {/* ================= SIGN IN ================= */}
            <button
              type="submit"
              className="sign-in-btn"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          {/* ================= CONTACT ADMIN ================= */}
          <p className="contact-admin">

            Don't have an account?{" "}

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();

                setError(
                  "Please contact the administrator to create an account."
                );
              }}
            >
              Contact administrator
            </a>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;
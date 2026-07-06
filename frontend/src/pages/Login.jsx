import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordStrength from "../components/PasswordStrength";
import {
  validateEmailOrPhone,
  validateForm,
  validatePassword,
  getPasswordStrength,
} from "../utils/validation";
import {
  Database,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { seedDatabase } from "../seed";
import "../styles/login.css";

const Login = () => {
  const [role, setRole] = useState("patient");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const roles = [
    { id: "patient", label: "Patient", icon: User },
    { id: "doctor", label: "Doctor", icon: Stethoscope },
    { id: "staff", label: "Staff", icon: ShieldCheck },
    { id: "district", label: "District", icon: Database },
  ];

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Email or phone number is required.";
      if (!validateEmailOrPhone(value)) {
        return "Enter a valid email or 10-digit mobile number.";
      }
    }

    if (name === "password") {
      if (!value) return "Password is required.";
      if (!validatePassword(value)) {
        return "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character.";
      }
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValue),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handlePasswordKeyUp = (e) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const formErrors = validateForm(formData);
    setErrors(formErrors);
    setTouched({
      email: true,
      password: true,
    });

    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);

    window.setTimeout(() => {
      localStorage.setItem("userRole", role);
      localStorage.setItem("rememberLogin", String(formData.rememberMe));
      navigate("/dashboard");
    }, 700);
  };

  return (
    <div className="login-page">
      <Navbar />

      <div className="container">
        <div className="card login-card animate-fade-in">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to MeraAspatal Portal</p>

          <div className="role-grid">
            {roles.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={`btn ${role === id ? "btn-primary" : "btn-outline"}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin}>
            <InputField
              label="Email or Phone Number"
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email or phone"
              icon={Mail}
              error={touched.email ? errors.email : ""}
              success={touched.email && !errors.email && formData.email}
              autoComplete="username"
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyUp={handlePasswordKeyUp}
              placeholder="Enter your password"
              icon={Lock}
              error={touched.password ? errors.password : ""}
              success={
                touched.password &&
                !errors.password &&
                validatePassword(formData.password)
              }
              autoComplete="current-password"
            />

            {isCapsLockOn && (
              <div className="caps-warning">Caps Lock is on.</div>
            )}

            <PasswordStrength
              password={formData.password}
              strength={passwordStrength}
            />

            <div className="remember-row">
              <label>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                Remember me
              </label>

              <a href="/forgot-password">Forgot your password?</a>
            </div>

            <button
              type="submit"
              className="btn btn-secondary login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner text="Signing in..." />
              ) : (
                `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`
              )}
            </button>
          </form>

          <div className="security-box">
            <h4>
              <ShieldCheck size={16} />
              Secure Login
            </h4>
            <p>
              Your credentials are checked before sign in. Role access is saved
              for the dashboard session.
            </p>
          </div>

          <div className="dev-tools">
            <button
              type="button"
              onClick={seedDatabase}
              className="btn btn-outline"
            >
              <Database size={14} /> Initialize Demo Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordStrength from "../components/PasswordStrength";
import {
  validateEmailOrPhone,
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
  Phone,
} from "lucide-react";
import "../styles/login.css";

import { api } from "../utils/api";
import { toast } from "react-hot-toast";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("patient");
  
  // Login Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Signup Form State (Forced Patient role)
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "Male",
    bloodGroup: "O+",
    address: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { id: "patient", label: "Patient", icon: User },
    { id: "doctor", label: "Doctor", icon: Stethoscope },
    { id: "staff", label: "Staff", icon: ShieldCheck },
    { id: "district", label: "District", icon: Database },
  ];

  const passwordStrength = useMemo(
    () => getPasswordStrength(isSignUp ? signUpData.password : formData.password),
    [isSignUp, signUpData.password, formData.password]
  );

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value.trim()) return "Email or phone number is required.";
      if (!validateEmailOrPhone(value)) {
        return "Enter a valid email or 10-digit mobile number.";
      }
    }
    if (name === "password") {
      if (!value) return "Password is required.";
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

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordKeyUp = (e) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const formErrors = {};
    if (!formData.email.trim()) formErrors.email = "Email/Phone is required.";
    if (!formData.password) formErrors.password = "Password is required.";

    setErrors(formErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);

    try {
      const user = await api.login(formData.email, formData.password, role);
      toast.success(`Welcome back, ${user.name}!`);
      localStorage.setItem("rememberLogin", String(formData.rememberMe));
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failure:", error);
      toast.error(error.message || "Invalid credentials.");
      setErrors({ email: "Invalid credentials or role mismatch." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    if (!signUpData.name.trim() || !signUpData.email.trim() || !signUpData.password) {
      toast.error("Name, email, and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      await api.register({
        ...signUpData,
        role: "patient", // Fixed role for public signup
        age: parseInt(signUpData.age) || null
      });

      toast.success("Patient profile created! Please log in.");
      setFormData((prev) => ({ ...prev, email: signUpData.email }));
      setRole("patient");
      setIsSignUp(false);
    } catch (error) {
      console.error("Signup failure:", error);
      toast.error(error.message || "Registration failed. Email might be in use.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofillDemo = () => {
    let demoEmail = "";
    if (role === "patient") demoEmail = "patient@meraaspatal.gov.in";
    else if (role === "doctor") demoEmail = "doctor@meraaspatal.gov.in";
    else if (role === "staff") demoEmail = "staff@meraaspatal.gov.in";
    else if (role === "district") demoEmail = "district@meraaspatal.gov.in";

    setFormData({
      email: demoEmail,
      password: "Password123!",
      rememberMe: true,
    });
    toast.success(`Demo credentials filled for role: ${role}`);
  };

  return (
    <div className="login-page">
      <Navbar />

      <div className="container" style={{ padding: "2rem 0" }}>
        <div className="card login-card animate-fade-in" style={{ maxWidth: "500px", margin: "0 auto" }}>
          <h2>{isSignUp ? "Patient Registration" : "Welcome Back"}</h2>
          <p className="login-subtitle">
            {isSignUp ? "Sign up for a secure patient portal account" : "Sign in to MeraAspatal Portal"}
          </p>

          {/* Toggle Tab */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              style={{
                flex: 1, padding: "0.75rem", background: "none", border: "none", cursor: "pointer",
                borderBottom: !isSignUp ? "2px solid var(--accent)" : "none",
                color: !isSignUp ? "var(--accent)" : "var(--text-muted)", fontWeight: "bold"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              style={{
                flex: 1, padding: "0.75rem", background: "none", border: "none", cursor: "pointer",
                borderBottom: isSignUp ? "2px solid var(--accent)" : "none",
                color: isSignUp ? "var(--accent)" : "var(--text-muted)", fontWeight: "bold"
              }}
            >
              Register (Patient Only)
            </button>
          </div>

          {!isSignUp ? (
            /* ==================== LOGIN FORM ==================== */
            <>
              <div className="role-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {roles.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={`btn ${role === id ? "btn-primary" : "btn-outline"}`}
                    style={{ padding: "0.5rem", fontSize: "0.8rem", display: "flex", gap: "0.25rem", justifyContent: "center" }}
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
                  success={touched.password && !errors.password && validatePassword(formData.password)}
                  autoComplete="current-password"
                />

                {isCapsLockOn && <div className="caps-warning">Caps Lock is on.</div>}

                <PasswordStrength password={formData.password} strength={passwordStrength} />

                <div className="remember-row">
                  <label>
                    <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
                    Remember me
                  </label>
                  <a href="/forgot-password">Forgot your password?</a>
                </div>

                <button type="submit" className="btn btn-secondary login-btn" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner text="Signing in..." /> : "Sign In"}
                </button>
              </form>
            </>
          ) : (
            /* ==================== SIGNUP FORM (PATIENT ONLY) ==================== */
            <form onSubmit={handleSignUpSubmit}>
              <InputField
                label="Full Name"
                type="text"
                name="name"
                value={signUpData.name}
                onChange={handleSignUpChange}
                placeholder="Enter your full name"
                icon={User}
              />

              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={signUpData.email}
                onChange={handleSignUpChange}
                placeholder="patient@example.com"
                icon={Mail}
              />

              <InputField
                label="Mobile Phone"
                type="tel"
                name="phone"
                value={signUpData.phone}
                onChange={handleSignUpChange}
                placeholder="Enter 10 digit number"
                icon={Phone}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <InputField
                  label="Age"
                  type="number"
                  name="age"
                  value={signUpData.age}
                  onChange={handleSignUpChange}
                  placeholder="30"
                />

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" className="form-input" value={signUpData.gender} onChange={handleSignUpChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select name="bloodGroup" className="form-input" value={signUpData.bloodGroup} onChange={handleSignUpChange}>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <InputField
                label="Home Address"
                type="text"
                name="address"
                value={signUpData.address}
                onChange={handleSignUpChange}
                placeholder="Enter residential address"
              />

              <InputField
                label="Choose Password"
                type="password"
                name="password"
                value={signUpData.password}
                onChange={handleSignUpChange}
                placeholder="Create secure password"
                icon={Lock}
              />

              <PasswordStrength password={signUpData.password} strength={passwordStrength} />

              <button type="submit" className="btn btn-secondary login-btn" style={{ marginTop: "1rem" }} disabled={isLoading}>
                {isLoading ? <LoadingSpinner text="Registering..." /> : "Register Account"}
              </button>
            </form>
          )}

          <div className="security-box" style={{ marginTop: "1.5rem" }}>
            <h4>
              <ShieldCheck size={16} /> Secure Portal
            </h4>
            <p>
              Your credentials are checked securely before login. Patient registration is encrypted and compliant with NDHM guidelines.
            </p>
          </div>

          <div className="dev-tools">
            <button type="button" onClick={handleAutofillDemo} className="btn btn-outline">
              <Database size={14} /> Autofill Demo Credentials
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

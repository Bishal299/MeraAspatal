// =========================
// EMAIL VALIDATION
// =========================

export const validateEmail = (email) => {
  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email);
};

// =========================
// INDIAN PHONE VALIDATION
// =========================

export const validatePhone = (phone) => {
  const regex = /^[6-9]\d{9}$/;

  return regex.test(phone);
};

// =========================
// EMAIL OR PHONE
// =========================

export const validateEmailOrPhone = (value) => {
  return validateEmail(value) || validatePhone(value);
};

// =========================
// PASSWORD VALIDATION
// =========================

export const validatePassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  return regex.test(password);
};

// =========================
// PASSWORD STRENGTH
// =========================

export const getPasswordStrength = (password) => {

  let score = 0;

  if (password.length >= 8) score++;

  if (/[a-z]/.test(password)) score++;

  if (/[A-Z]/.test(password)) score++;

  if (/\d/.test(password)) score++;

  if (/[@$!%*#?&]/.test(password)) score++;

  switch (score) {

    case 0:
    case 1:
      return {
        label: "Very Weak",
        color: "#ef4444",
        width: "20%"
      };

    case 2:
      return {
        label: "Weak",
        color: "#f97316",
        width: "40%"
      };

    case 3:
      return {
        label: "Medium",
        color: "#eab308",
        width: "60%"
      };

    case 4:
      return {
        label: "Strong",
        color: "#3b82f6",
        width: "80%"
      };

    case 5:
      return {
        label: "Very Strong",
        color: "#22c55e",
        width: "100%"
      };

    default:
      return {
        label: "",
        color: "#e5e7eb",
        width: "0%"
      };
  }
};

// =========================
// VALIDATE WHOLE FORM
// =========================

export const validateForm = (formData) => {

  const errors = {};

  if (!formData.email.trim()) {
    errors.email = "Email or phone number is required.";
  } else if (!validateEmailOrPhone(formData.email)) {
    errors.email =
      "Enter a valid email or 10-digit mobile number.";
  }

  if (!formData.password) {
    errors.password = "Password is required.";
  } else if (!validatePassword(formData.password)) {
    errors.password =
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character.";
  }

  return errors;
};
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  icon: Icon,
  error,
  success,
  autoComplete = "off",
  onKeyUp,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password"
      ? showPassword
        ? "text"
        : "password"
      : type;

  return (
    <div className="input-group fade-up">
      <label className="input-label">
        {label}
      </label>

      <div className="input-wrapper">

        {/* Left Icon */}
        {Icon && (
          <span className="input-icon">
            <Icon size={18} />
          </span>
        )}

        {/* Input */}
        <input
          type={inputType}
          name={name}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={onChange}
          onBlur={onBlur}
          onKeyUp={onKeyUp}
          className={`input-field
            ${error ? "input-error" : ""}
            ${success ? "input-valid" : ""}
          `}
        />

        {/* Success Tick */}
        {success && !error && (
          <span className="input-success">
            <CheckCircle2
              size={18}
              color="#22c55e"
            />
          </span>
        )}

        {/* Password Eye */}
        {type === "password" && (
          <span
            className="password-toggle"
            onClick={() =>
              setShowPassword(!showPassword)
            }
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="error-text">
          {error}
        </div>
      )}

      {/* Success */}
      {!error && success && (
        <div className="success-text">
          Looks good!
        </div>
      )}
    </div>
  );
};

export default InputField;
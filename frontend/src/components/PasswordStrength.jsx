import React from "react";

const PasswordStrength = ({ strength, password }) => {
  if (!password) return null;

  return (
    <div className="password-strength fade-up">
      <div className="strength-bar">
        <div
          className="strength-fill"
          style={{
            width: strength.width,
            background: strength.color,
          }}
        ></div>
      </div>

      <div
        className="strength-text"
        style={{
          color: strength.color,
        }}
      >
        Password Strength: {strength.label}
      </div>
    </div>
  );
};

export default PasswordStrength;
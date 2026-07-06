import React from "react";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
      }}
    >
      <div className="spinner"></div>
      <span>{text}</span>
    </div>
  );
};

export default LoadingSpinner;
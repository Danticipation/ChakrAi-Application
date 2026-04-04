import React from 'react';
import './Welcome.css'; // Optional: for styling

const Welcome = ({ name = "User" }) => {
  return (
    <div className="welcome-container">
      <h1 className="welcome-title">Welcome, {name}!</h1>
      <p className="welcome-message">
        We're glad to have you here. Ready to get started?
      </p>
      <div className="welcome-actions">
        <button className="btn-primary" onClick={() => console.log('Getting started...')}>
          Get Started
        </button>
        <button className="btn-secondary" onClick={() => console.log('Learning more...')}>
          Learn More
        </button>
      </div>
    </div>
  );
};

export default Welcome;

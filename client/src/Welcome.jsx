```jsx import React from 'react'; import './Welcome.css'; // Optional: for styling const Welcome = ({ name = "User" }) => { return (
    Welcome, {name}!
    We're glad to have you here. Ready to get started?
    
    console.log('Getting started...')}> Get Started console.log('Learning more...')}> Learn More
    ); }; export default Welcome; ``` ## Optional CSS file (src/Welcome.css) ```css .welcome-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; max-width: 600px; margin: 0 auto; } .welcome-title { font-size: 2.5rem; color: #333; margin-bottom: 1rem; } .welcome-message { font-size: 1.2rem; color: #666; margin-bottom: 2rem; line-height: 1.5; } .welcome-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; } .btn-primary, .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; transition: background-color 0.3s ease; } .btn-primary { background-color: #007bff; color: white; } .btn-primary:hover { background-color: #0056b3; } .btn-secondary { background-color: #6c757d; color: white; } .btn-secondary:hover { background-color: #545b62; } ``` ## How to use the component: ```jsx // In your App.js or another component import Welcome from './Welcome'; function App() { return (
    {/* Or without props for default "User" */}
    ); } ``` ## For Business Automation & Mental Wellness Apps: If you're building business automation systems or mental wellness apps, you might want to customize the Welcome component: ### Business Automation Version: ```jsx const Welcome = ({ userRole, companyName }) => { return (
    Welcome to {companyName} Dashboard
    Role: {userRole}
    
    window.location.href = '/dashboard'}> Go to Dashboard
    ); }; ``` ### Mental Wellness Version: ```jsx const Welcome = ({ userName, streak }) => { return (
    Welcome back, {userName}!
    You're on a {streak}-day wellness streak! 🌟
    
    window.location.href = '/daily-check-in'}> Start Today's Check-in
    ); }; ```
import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) return <p>Please log in to view the dashboard.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <div className="user-profile">
        <h3>Welcome, {user.name}!</h3>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      <hr />

      {/* Role-Based UI Rendering */}
      {user.role === 'DOCTOR' && (
        <section>
          <h4>Doctor Panel</h4>
          <ul>
            <li>View Appointments</li>
            <li>Write Prescriptions</li>
          </ul>
        </section>
      )}

      {user.role === 'PATIENT' && (
        <section>
          <h4>Patient Portal</h4>
          <ul>
            <li>Book Appointment</li>
            <li>My Medical Records</li>
          </ul>
        </section>
      )}

      {user.role === 'NURSE' && (
        <section>
          <h4>Nursing Station</h4>
          <ul>
            <li>Record Vitals</li>
            <li>Manage Ward Beds</li>
          </ul>
        </section>
      )}

      <button onClick={logout} style={{ marginTop: '20px', color: 'red' }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
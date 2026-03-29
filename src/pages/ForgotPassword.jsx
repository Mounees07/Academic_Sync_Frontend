import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Home } from 'lucide-react';
import './Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setMessage("");
            setError("");
            setLoading(true);
            await resetPassword(email);
            setMessage("Check your inbox for password reset instructions.");
        } catch (err) {
            console.error("Reset Error:", err);
            setError("Failed to reset password. " + (err.message || "Please check the email provided."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-shell">
            <nav className="page-nav">
                <Link to="/" className="home-icon"><Home size={20} /></Link>
            </nav>

            <div className="login-container login-container-email forgot-password-layout">
                <div className="email-login-card forgot-password-card">
                    <div className="login-header">
                        <h2>Reset Password</h2>
                        <p>Enter your email to receive reset instructions.</p>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="success-message">
                            <CheckCircle size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-label-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="btn btn-primary btn-block">
                            {loading ? "Sending..." : "Reset Password"}
                        </button>

                        <div className="forgot-password-back">
                            <Link to="/login" className="forgot-password-back-link">
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

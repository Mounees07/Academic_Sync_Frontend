import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronDown, Eye, EyeOff, Home, Mail, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const LOGIN_VIEW = {
    LANDING: 'landing',
    EMAIL: 'email'
};

const Login = () => {
    const [activeView, setActiveView] = useState(LOGIN_VIEW.LANDING);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [showContact, setShowContact] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { loginWithGoogle, loginWithEmail, error } = useAuth();
    const navigate = useNavigate();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'GOOD MORNING..!';
        if (hour < 17) return 'GOOD AFTERNOON..!';
        return 'GOOD EVENING..!';
    }, []);

    const authError = formError || error;

    const handleGoogleLogin = async () => {
        setFormError('');
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            console.error('Google login failed:', err);
            setFormError(err.message || 'Google login failed. Check your network connection.');
        }
    };

    const handleEmailLogin = async (event) => {
        event.preventDefault();
        setFormError('');
        try {
            await loginWithEmail(email, password);
            navigate('/dashboard');
        } catch (err) {
            setFormError(err.message || 'Unable to sign in with email and password.');
        }
    };

    const openEmailView = () => {
        setFormError('');
        setActiveView(LOGIN_VIEW.EMAIL);
    };

    const goBackToLanding = () => {
        setFormError('');
        setActiveView(LOGIN_VIEW.LANDING);
    };

    return (
        <div className="login-shell">
            <nav className="page-nav">
                <button type="button" className="nav-link-button" onClick={() => setShowContact(true)}>Contact us</button>
                <button type="button" className="nav-link-button nav-link-with-icon">
                    English <ChevronDown size={14} />
                </button>
                <Link to="/" className="home-icon" aria-label="Go to home">
                    <Home size={20} />
                </Link>
            </nav>

            <div className={`login-container ${activeView === LOGIN_VIEW.EMAIL ? 'login-container-email' : ''}`}>
                {activeView === LOGIN_VIEW.LANDING ? (
                    <section className="welcome-card">
                        <header className="welcome-banner">
                            <h1>WELCOME BACK!</h1>
                            <p>{greeting}</p>
                        </header>

                        <div className="brand-panel">
                            <div className="brand-mark">
                                <BrandLogo alt="Academic Sync" className="login-brand-logo" />
                            </div>
                            <div className="brand-copy">
                                <h2>ACADEMIC SYNC</h2>
                                <span>BRIGHT ⭐ BRAVE ⭐ PATRIOTIC</span>
                            </div>
                        </div>

                        {authError && (
                            <div className="error-message landing-error">
                                <AlertCircle size={18} />
                                <span>{authError}</span>
                            </div>
                        )}

                        <div className="welcome-actions">
                            <button type="button" onClick={handleGoogleLogin} className="welcome-google-btn">
                                <span className="google-icon" aria-hidden="true">G</span>
                                <span>SIGN IN WITH GOOGLE</span>
                            </button>

                            <button type="button" onClick={openEmailView} className="welcome-email-link">
                                Sign in with Email and Password
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="email-login-card">
                        <button type="button" className="back-button" onClick={goBackToLanding}>
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>

                        <div className="login-header">
                            <h2>WELCOME BACK!</h2>
                            <p>Enter your credentials to access your account.</p>
                        </div>

                        {authError && (
                            <div className="error-message">
                                <AlertCircle size={18} />
                                <span>{authError}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="auth-form">
                            <div className="input-label-group">
                                <label htmlFor="login-email">Username</label>
                                <div className="input-wrapper">
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="kumarmounees@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-label-group">
                                <label htmlFor="login-password">Password</label>
                                <div className="input-wrapper">
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword((current) => !current)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="remember-me">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="forgot-password">Forget password?</Link>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block">
                                SIGN IN
                            </button>
                        </form>
                    </section>
                )}
            </div>

            {showContact && (
                <div className="modal-overlay" onClick={() => setShowContact(false)}>
                    <div className="contact-card" onClick={(e) => e.stopPropagation()}>
                        <div className="contact-header">
                            <h3>Contact Support</h3>
                            <button onClick={() => setShowContact(false)} className="close-btn" type="button">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="contact-body">
                            <p>For any queries or assistance, please contact:</p>
                            <div className="contact-detail">
                                <Mail size={20} className="contact-icon" />
                                <a href="mailto:sankavi8881@gmail.com">sankavi8881@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;

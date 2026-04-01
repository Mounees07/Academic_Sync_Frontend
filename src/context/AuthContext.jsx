import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    googleProvider,
    auth,
    sendPasswordResetEmail
} from '../firebase/firebase';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sessionConflict, setSessionConflict] = useState(false);

    // ── Session registration helper ───────────────────────────────────────────
    // Called immediately after any successful login (email or Google).
    // Contacts the backend, which stores a UUID in the user row and returns it.
    // We persist it in sessionStorage (tab-local; clears on browser close).
    const registerSession = useCallback(async () => {
        try {
            const res = await api.post('/users/session/register');
            if (res.data?.sessionToken) {
                sessionStorage.setItem('sessionToken', res.data.sessionToken);
            }
        } catch (err) {
            console.warn('Session registration failed (non-critical):', err.message);
        }
    }, []);

    const loginWithGoogle = async () => {
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // registerSession is called inside onAuthStateChanged after
            // Firebase confirms auth state and we have a valid token
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const loginWithEmail = async (email, password) => {
        setError('');
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            // registerSession is called inside onAuthStateChanged
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signupWithEmail = async (email, password, fullName, role = 'STUDENT') => {
        setError('');
        try {
            let userCredential;
            try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (createError) {
                if (createError.code === 'auth/email-already-in-use') {
                    userCredential = await signInWithEmailAndPassword(auth, email, password);
                } else {
                    throw createError;
                }
            }

            const token = await userCredential.user.getIdToken();
            const regData = {
                firebaseUid: userCredential.user.uid,
                email: email,
                fullName: fullName,
                role: role
            };

            const response = await api.post('/users/register', regData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUserData(response.data);
            await registerSession();
            return userCredential;
        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.message);
            throw err;
        }
    };

    const logout = useCallback(() => {
        setError('');
        setSessionConflict(false);
        sessionStorage.removeItem('sessionToken');
        return signOut(auth);
    }, []);

    // ── onAuthStateChanged ────────────────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    // 1. Register (or re-register) session FIRST.
                    //    This stores X-Session-Token in sessionStorage so every
                    //    subsequent API call includes it and won't get a 409.
                    await registerSession();

                    // 2. Now fetch user profile — token is already in sessionStorage
                    const response = await api.get(`/users/${user.uid}`);
                    setUserData(response.data);
                } catch (err) {
                    console.error('Auth state user load error:', err);

                    // UID-mismatch: try to fix via email lookup
                    if (user.providerData[0]?.providerId === 'google.com') {
                        try {
                            const regRes = await api.post('/users/register', {
                                firebaseUid: user.uid,
                                email: user.email,
                                fullName: user.displayName,
                                profilePictureUrl: user.photoURL,
                                role: 'STUDENT'
                            });
                            setUserData(regRes.data);
                        } catch (regErr) {
                            console.error('Google auto-registration failed', regErr);
                        }
                    }
                }
            } else {
                setUserData(null);
                sessionStorage.removeItem('sessionToken');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [registerSession]);

    // ── Session-conflict listener ─────────────────────────────────────────────
    // api.js fires this event when it receives a 409 SESSION_CONFLICT response.
    // We force-logout and show a notice to the user.
    useEffect(() => {
        const handleConflict = () => {
            setSessionConflict(true);
            sessionStorage.removeItem('sessionToken');
            signOut(auth);
        };
        window.addEventListener('session-conflict', handleConflict);
        return () => window.removeEventListener('session-conflict', handleConflict);
    }, []);

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    const [systemSettings, setSystemSettings] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings/public/features');
                setSystemSettings(res.data);
            } catch (err) {
                console.error('Failed to fetch system settings', err);
                setSystemSettings({
                    'feature.leave.enabled': 'true',
                    'feature.result.enabled': 'true',
                    'feature.analytics.enabled': 'true',
                    'feature.messaging.enabled': 'true'
                });
            }
        };
        fetchSettings();
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        error,
        sessionConflict,
        systemSettings,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {/* Session-conflict full-screen notice */}
            {sessionConflict && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#1e1b2e',
                        border: '1px solid rgba(239,68,68,0.5)',
                        borderRadius: 16,
                        padding: '40px 48px',
                        maxWidth: 460,
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                        <h2 style={{ color: '#ef4444', marginBottom: 12, fontSize: '1.4rem' }}>
                            Session Ended
                        </h2>
                        <p style={{ color: '#c4b5d0', marginBottom: 24, lineHeight: 1.6 }}>
                            Your account was logged in on another device or browser.
                            For security, this session has been terminated.
                        </p>
                        <button
                            onClick={() => { setSessionConflict(false); window.location.href = '/login'; }}
                            style={{
                                background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
                                color: '#fff', border: 'none', borderRadius: 8,
                                padding: '12px 32px', fontSize: '1rem',
                                fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

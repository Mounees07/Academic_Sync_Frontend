import React, { useEffect, useState } from 'react';
import './SessionTimeoutModal.css';

/**
 * SessionTimeoutModal
 * Shows a countdown warning before auto-logout.
 *
 * Props:
 *  visible      - boolean, whether to show the modal
 *  secondsLeft  - initial seconds remaining when modal appears
 *  onStay       - callback when user clicks "Stay Logged In"
 *  onLogout     - callback when user clicks "Logout Now"
 */
const SessionTimeoutModal = ({ visible, secondsLeft = 60, onStay, onLogout }) => {
    const [count, setCount] = useState(secondsLeft);

    // Reset counter whenever the modal becomes visible
    useEffect(() => {
        if (!visible) return;
        setCount(secondsLeft);

        const interval = setInterval(() => {
            setCount(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, secondsLeft]);

    if (!visible) return null;

    const pct = (count / secondsLeft) * 100;
    const isUrgent = count <= 15;

    return (
        <div className="sto-backdrop" role="dialog" aria-modal="true" aria-labelledby="sto-title">
            <div className={`sto-modal ${isUrgent ? 'sto-urgent' : ''}`}>
                {/* Pulsing ring */}
                <div className="sto-ring-wrapper">
                    <svg className="sto-ring" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" className="sto-ring-bg" />
                        <circle
                            cx="60" cy="60" r="52"
                            className="sto-ring-fg"
                            style={{
                                strokeDasharray: `${2 * Math.PI * 52}`,
                                strokeDashoffset: `${2 * Math.PI * 52 * (1 - pct / 100)}`,
                            }}
                        />
                    </svg>
                    <span className="sto-count">{count}</span>
                </div>

                <div className="sto-icon">⏱️</div>
                <h2 className="sto-title" id="sto-title">Session Expiring Soon</h2>
                <p className="sto-body">
                    Your session will automatically expire due to inactivity.
                    <br />
                    <strong>You'll be logged out in {count} second{count !== 1 ? 's' : ''}.</strong>
                </p>

                <div className="sto-actions">
                    <button className="sto-btn sto-btn-stay" onClick={onStay}>
                        Stay Logged In
                    </button>
                    <button className="sto-btn sto-btn-logout" onClick={onLogout}>
                        Logout Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;

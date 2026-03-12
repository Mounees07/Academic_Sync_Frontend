import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Download, CheckCircle, XCircle, Clock, CreditCard, RefreshCw } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentFeeHistory.css';

const STATUS_CONFIG = {
    SUCCESS: { label: 'Success', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
    FAILED: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
    PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
    REFUNDED: { label: 'Refunded', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: RefreshCw },
};


const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const generateReceiptHTML = (txn, studentName) => `
<!DOCTYPE html><html><head>
<style>
body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; color: #1e293b; }
.header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px; }
.header h1 { color: #6366f1; margin: 0; font-size: 1.4rem; }
.header p { margin: 4px 0; color: #64748b; font-size: 0.85rem; }
.badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
  color: #10b981; background: rgba(16,185,129,0.1); border: 1px solid #10b981; }
table { width: 100%; border-collapse: collapse; }
td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
td:first-child { color: #64748b; width: 40%; }
td:last-child { font-weight: 600; }
.total-row td { font-size: 1rem; font-weight: 800; color: #6366f1; }
.footer { margin-top: 24px; text-align: center; color: #94a3b8; font-size: 0.8rem; }
</style></head>
<body>
<div class="header">
  <h1>AcaSync — Payment Receipt</h1>
  <p>Issued by AcaSync Academic Platform</p>
  <span class="badge">✔ ${txn.status}</span>
</div>
<table>
  <tr><td>Student Name</td><td>${studentName}</td></tr>
  <tr><td>Transaction ID</td><td>${txn.transactionId}</td></tr>
  <tr><td>Order ID</td><td>${txn.razorpayOrderId || '-'}</td></tr>
  <tr><td>Payment Date</td><td>${new Date(txn.paymentDate).toLocaleString()}</td></tr>
  <tr><td>Payment Method</td><td>${txn.paymentMethod || '-'}</td></tr>
  <tr><td>Academic Year</td><td>${txn.academicYear || '-'}</td></tr>
  <tr><td>Semester</td><td>${txn.semester || '-'}</td></tr>
  <tr><td>Description</td><td>${txn.remarks || 'Semester Fee'}</td></tr>
  <tr class="total-row"><td>Amount Paid</td><td>₹${Number(txn.amount).toLocaleString('en-IN')}</td></tr>
</table>
<div class="footer">This is a computer-generated receipt. No signature required. — AcaSync ERP v2.0</div>
</body></html>`;

const StudentFeeHistory = () => {
    const { currentUser, userData } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (!currentUser) return;
        api.get(`/fee-transactions/student/${currentUser.uid}`)
            .then(res => setTransactions(res.data || []))
            .catch(() => setTransactions([]))
            .finally(() => setLoading(false));
    }, [currentUser]);

    const downloadReceipt = (txn) => {
        const html = generateReceiptHTML(txn, userData?.fullName || 'Student');
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${txn.transactionId}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = filter === 'ALL' ? transactions
        : transactions.filter(t => t.status === filter);

    const totalPaid = transactions
        .filter(t => t.status === 'SUCCESS')
        .reduce((s, t) => s + Number(t.amount), 0);

    if (loading) return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;

    return (
        <div className="fee-history-page">
            <div className="fh-header">
                <div>
                    <h1><CreditCard size={22} style={{ display: 'inline', marginRight: 8, color: '#3b82f6' }} />Fee Payment History</h1>
                    <p className="fh-subtitle">All your payment transactions and receipts</p>
                </div>
                <div className="fh-total-badge">
                    Total Paid: <strong>₹{totalPaid.toLocaleString('en-IN')}</strong>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="fh-filters">
                {['ALL', 'SUCCESS', 'FAILED', 'PENDING', 'REFUNDED'].map(f => (
                    <button key={f}
                        className={`fh-filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}>
                        {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f}
                        <span className="fh-count">
                            {f === 'ALL' ? transactions.length : transactions.filter(t => t.status === f).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="fh-card">
                {filtered.length === 0 ? (
                    <div className="fh-empty">
                        <CreditCard size={48} opacity={0.2} />
                        <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} transactions found.</p>
                    </div>
                ) : (
                    <div className="fh-table-wrap">
                        <table className="fh-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Transaction ID</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((txn) => {
                                    const cfg = STATUS_CONFIG[txn.status] || STATUS_CONFIG.PENDING;
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={txn.id}>
                                            <td className="fh-date">{formatDate(txn.paymentDate)}</td>
                                            <td className="fh-txn-id">{txn.transactionId?.slice(0, 18)}…</td>
                                            <td className="fh-desc">{txn.remarks || `Sem ${txn.semester} Fee`}</td>
                                            <td className="fh-amount">
                                                ₹{Number(txn.amount).toLocaleString('en-IN')}
                                            </td>
                                            <td className="fh-method">{txn.paymentMethod || '-'}</td>
                                            <td>
                                                <span className="fh-status-badge"
                                                    style={{ color: cfg.color, background: cfg.bg }}>
                                                    <Icon size={12} /> {cfg.label}
                                                </span>
                                            </td>
                                            <td>
                                                {txn.status === 'SUCCESS' ? (
                                                    <button className="btn-receipt" onClick={() => downloadReceipt(txn)}>
                                                        <Download size={14} /> Download
                                                    </button>
                                                ) : (
                                                    <span className="fh-na">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentFeeHistory;

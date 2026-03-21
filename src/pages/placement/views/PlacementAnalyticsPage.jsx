import React from 'react';
import { Clock3, IndianRupee, Ribbon } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const PlacementAnalyticsPage = ({
    analyticsSummary,
    departmentPlacementRows,
    monthlyHiringTrendData,
    packageDistributionData,
    recruiterBreakdown
}) => (
    <div className="pc-analytics-page">
        <div className="pc-analytics-summary-grid">
            <article className="pc-analytics-kpi-card">
                <div className="pc-analytics-kpi-head">
                    <span>Overall Placement</span>
                    <Clock3 size={18} />
                </div>
                <strong>{analyticsSummary.overallPlacement.toFixed(1)}%</strong>
                <small>Current academic year performance</small>
            </article>
            <article className="pc-analytics-kpi-card">
                <div className="pc-analytics-kpi-head">
                    <span>Average Package</span>
                    <IndianRupee size={18} />
                </div>
                <strong>{analyticsSummary.averagePackage.toFixed(1)} LPA</strong>
                <small>Average from tracked drive outcomes</small>
            </article>
            <article className="pc-analytics-kpi-card">
                <div className="pc-analytics-kpi-head">
                    <span>Highest Package</span>
                    <Ribbon size={18} />
                </div>
                <strong>{analyticsSummary.highestPackage.toFixed(1)} LPA</strong>
                <small>Offered by {analyticsSummary.highestPackageCompany}</small>
            </article>
        </div>

        <div className="pc-analytics-top-grid">
            <section className="pc-panel pc-analytics-chart-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Monthly Hiring Trends</h2>
                        <p>Number of students placed per month</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyHiringTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="offers" radius={[10, 10, 0, 0]}>
                            {monthlyHiringTrendData.map((entry) => (
                                <Cell key={entry.month} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </section>

            <section className="pc-panel pc-analytics-chart-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Top Recruiters</h2>
                        <p>Company-wise hiring breakdown</p>
                    </div>
                </div>
                <div className="pc-recruiter-donut-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={recruiterBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92}>
                                {recruiterBreakdown.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pc-donut-center-text">
                        <strong>{recruiterBreakdown.reduce((sum, item) => sum + Number(item.value || 0), 0)}</strong>
                        <span>Offers</span>
                    </div>
                </div>
                <div className="pc-recruiter-list">
                    {recruiterBreakdown.map((item) => (
                        <div key={item.name} className="pc-recruiter-row">
                            <div className="pc-recruiter-name">
                                <span className="pc-recruiter-dot" style={{ background: item.fill }} />
                                <span>{item.name}</span>
                            </div>
                            <strong>{item.percentage}% <small>({item.value})</small></strong>
                        </div>
                    ))}
                </div>
            </section>
        </div>

        <div className="pc-analytics-bottom-grid">
            <section className="pc-panel pc-analytics-chart-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Department-wise Placement</h2>
                        <p>Percentage of eligible students placed</p>
                    </div>
                </div>
                <div className="pc-department-progress-list">
                    {departmentPlacementRows.map((department) => (
                        <div key={department.name} className="pc-department-progress-row">
                            <div className="pc-department-progress-head">
                                <span>{department.name}</span>
                                <strong>{Number(department.value || 0).toFixed(0)}% <small>({department.placed}/{department.eligible || 0})</small></strong>
                            </div>
                            <div className="pc-department-progress-bar">
                                <div style={{ width: `${Math.max(0, Math.min(100, Number(department.value || 0)))}%`, background: department.fill }} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="pc-panel pc-analytics-chart-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Package Distribution</h2>
                        <p>Number of students across CTC brackets</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={packageDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="students" radius={[10, 10, 0, 0]}>
                            {packageDistributionData.map((entry) => (
                                <Cell key={entry.range} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </section>
        </div>
    </div>
);

export default PlacementAnalyticsPage;

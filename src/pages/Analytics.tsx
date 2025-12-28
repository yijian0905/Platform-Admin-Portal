import { useEffect, useState, useCallback } from 'react';
import { api, type Subscriber } from '../api';
import './Analytics.css';

interface TierDistribution {
    tier: string;
    count: number;
    percentage: number;
}

interface MonthlyGrowth {
    month: string;
    count: number;
}

export function AnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
    const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowth[]>([]);
    const [stats, setStats] = useState({
        activeRate: 0,
        avgUsersPerTenant: 0,
        totalRevenue: 0,
    });

    const loadAnalytics = useCallback(async () => {
        setIsLoading(true);

        // Fetch all subscribers to calculate analytics
        const result = await api.subscribers.list({ pageSize: 1000 });

        if (result.success && result.data) {
            const subscribers = result.data.items;

            // Calculate tier distribution
            const tierCounts: Record<string, number> = { L1: 0, L2: 0, L3: 0 };
            subscribers.forEach((s: Subscriber) => {
                if (tierCounts[s.tier] !== undefined) {
                    tierCounts[s.tier]++;
                }
            });

            const total = subscribers.length || 1;
            setTierDistribution([
                { tier: 'Basic (L1)', count: tierCounts.L1, percentage: (tierCounts.L1 / total) * 100 },
                { tier: 'Pro (L2)', count: tierCounts.L2, percentage: (tierCounts.L2 / total) * 100 },
                { tier: 'Enterprise (L3)', count: tierCounts.L3, percentage: (tierCounts.L3 / total) * 100 },
            ]);

            // Calculate monthly growth (last 6 months)
            const now = new Date();
            const months: MonthlyGrowth[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                const count = subscribers.filter((s: Subscriber) => {
                    const created = new Date(s.createdAt);
                    return created.getMonth() === date.getMonth() &&
                        created.getFullYear() === date.getFullYear();
                }).length;
                months.push({ month: monthStr, count });
            }
            setMonthlyGrowth(months);

            // Calculate other stats
            const activeCount = subscribers.filter((s: Subscriber) => s.status === 'ACTIVE').length;
            const totalUsers = subscribers.reduce((sum: number, s: Subscriber) => sum + (s.userCount || 0), 0);

            setStats({
                activeRate: (activeCount / total) * 100,
                avgUsersPerTenant: totalUsers / total,
                totalRevenue: tierCounts.L1 * 99 + tierCounts.L2 * 299 + tierCounts.L3 * 999, // Placeholder pricing
            });
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const maxGrowth = Math.max(...monthlyGrowth.map(m => m.count), 1);

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div className="page-title">
                    <h1>Analytics</h1>
                    <span className="page-subtitle">數據分析</span>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner-lg"></div>
                    <p>Loading analytics...</p>
                </div>
            ) : (
                <div className="analytics-grid">
                    {/* Quick Stats */}
                    <div className="analytics-card stats-card">
                        <h3>Quick Stats</h3>
                        <div className="quick-stats">
                            <div className="stat-item">
                                <span className="stat-value">{stats.activeRate.toFixed(1)}%</span>
                                <span className="stat-label">Active Rate</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.avgUsersPerTenant.toFixed(1)}</span>
                                <span className="stat-label">Avg Users/Tenant</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">${stats.totalRevenue.toLocaleString()}</span>
                                <span className="stat-label">Est. MRR</span>
                            </div>
                        </div>
                    </div>

                    {/* Tier Distribution */}
                    <div className="analytics-card">
                        <h3>Tier Distribution</h3>
                        <div className="tier-chart">
                            {tierDistribution.map((tier) => (
                                <div key={tier.tier} className="tier-bar-item">
                                    <div className="tier-bar-label">
                                        <span>{tier.tier}</span>
                                        <span className="tier-count">{tier.count}</span>
                                    </div>
                                    <div className="tier-bar-container">
                                        <div
                                            className="tier-bar"
                                            style={{ width: `${tier.percentage}%` }}
                                        />
                                    </div>
                                    <span className="tier-percentage">{tier.percentage.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Growth */}
                    <div className="analytics-card growth-card">
                        <h3>New Subscribers (Last 6 Months)</h3>
                        <div className="growth-chart">
                            {monthlyGrowth.map((month) => (
                                <div key={month.month} className="growth-bar-item">
                                    <div
                                        className="growth-bar"
                                        style={{ height: `${(month.count / maxGrowth) * 100}%` }}
                                    >
                                        <span className="growth-value">{month.count}</span>
                                    </div>
                                    <span className="growth-label">{month.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalyticsPage;

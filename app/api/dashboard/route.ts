import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import Product from '@/models/Product';
import Plan from '@/models/Plan';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function GET() {
  try {
    await dbConnect();

    // Real KPIs: MRR, New Subs, Churn
    const mrrAgg = await Subscription.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const mrr = mrrAgg[0]?.total || 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const newSubsThisMonth = await Subscription.countDocuments({ createdAt: { $gte: startOfMonth } });

    const totalCustomersEver = await User.countDocuments({ role: 'customer' });
    const churnedThisMonth = await Subscription.countDocuments({ status: 'Closed', updatedAt: { $gte: startOfMonth } });
    const churnRate = totalCustomersEver > 0 ? (churnedThisMonth / totalCustomersEver) * 100 : 0;

    // Revenue tracking
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const overdueAgg = await Invoice.aggregate([
      { $match: { status: { $in: ['draft', 'confirmed'] }, dueDate: { $lt: new Date() } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    const overdueTotal = overdueAgg[0]?.total || 0;
    const overdueCount = overdueAgg[0]?.count || 0;

    // Upcoming Renewals (Next 7 Days)
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const upcomingRenewalsCount = await Subscription.countDocuments({ 
       status: 'Active', 
       nextBillingDate: { $gte: new Date(), $lte: in7Days } 
    });

    const totalSubscriptions = await Subscription.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalPlans = await Plan.countDocuments();
    const activeSubscriptionsCount = await Subscription.countDocuments({ status: 'Active' });

    // Pending invoices
    const pendingInvoices = await Invoice.countDocuments({
      status: { $in: ['draft', 'confirmed'] },
      dueDate: { $gte: new Date() },
    });

    const forecastedRevenue = mrr; // Simplified for now

    // Health aggregation
    const healthyCount = activeSubscriptionsCount; // Simplified: Active = Healthy for now
    const warningCount = await Subscription.countDocuments({ status: 'Suspended' });
    const highRiskCount = await Subscription.countDocuments({ status: 'Quotation' });

    // Monthly metrics for charts
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Subscription.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const statusDistribution = await Subscription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const typeDistribution = await Subscription.aggregate([
      { $group: { _id: '$subscriptionType', count: { $sum: 1 } } },
    ]);

    const mrrByType = await Subscription.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$subscriptionType', total: { $sum: '$totalAmount' } } },
    ]);

    const topPlansAgg = await Subscription.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topPlans = await Plan.populate(topPlansAgg, { path: '_id', select: 'name price' });
    const formattedTopPlans = topPlans.map((tp: any) => ({
      count: tp.count,
      plan: tp._id || { name: 'Custom Plan', price: 0 },
    }));

    const recentSubscriptions = await Subscription.find()
      .populate('customer', 'name email shadow')
      .populate('plan', 'name price')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find()
      .populate('customer', 'name')
      .populate('invoice', 'invoiceNumber')
      .sort({ paidAt: -1 })
      .limit(5);

    // Intelligent Insights logic (SaaS specific)
    const insights: any[] = [];
    if (mrr > 10000) insights.push({ type: 'positive', message: 'MRR has crossed ₹10k benchmark. Healthy recurring growth detected.' });
    if (churnRate < 2) insights.push({ type: 'positive', message: 'Churn rate is exceptionally low (<2%). Product-market fit is strong.' });
    if (overdueCount > 0) insights.push({ type: 'warning', message: `Attention: ${overdueCount} invoices are overdue. Action required on ₹${overdueTotal.toLocaleString()} capital.` });
    if (upcomingRenewalsCount > 0) insights.push({ type: 'info', message: `${upcomingRenewalsCount} subscriptions are renewing in next 7 days. Monitor balances.` });
    if (activeSubscriptionsCount < 5) insights.push({ type: 'info', message: 'Focus on activation: Convert Draft cycles to Active stages to grow MRR.' });

    return jsonResponse({
      stats: {
        totalRevenue,
        mrr,
        newSubsThisMonth,
        churnRate,
        activeSubscriptions: activeSubscriptionsCount,
        totalSubscriptions,
        totalCustomers: totalCustomersEver,
        totalProducts,
        totalPlans,
        overdueInvoices: overdueCount,
        overdueTotal,
        upcomingRenewalsCount,
        pendingInvoices,
        forecastedRevenue,
      },
      health: { healthy: healthyCount, warning: warningCount, highRisk: highRiskCount },
      monthlyRevenue,
      statusDistribution,
      typeDistribution,
      mrrByType,
      topPlans: formattedTopPlans,
      recentSubscriptions,
      recentPayments,
      insights,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

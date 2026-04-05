import { NextResponse } from 'next/server';

export function jsonResponse(data: any, status = 200) {
  const response = {
    success: status >= 200 && status < 300,
    message: data.message || 'Operation successful',
    ...data
  };
  return NextResponse.json(response, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ 
    success: false, 
    message: message || 'Something went wrong',
    error: message 
  }, { status });
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateSubscriptionId(): string {
  const prefix = 'SUB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateSubscriptionNumber(): string {
  const prefix = 'SUB';
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
}

// Cycle -> number of days in that cycle
export function cycleToDays(cycle: string): number {
  switch (cycle) {
    case 'daily':   return 1;
    case 'weekly':  return 7;
    case 'monthly': return 30;
    case 'yearly':  return 365;
    default:        return 30;
  }
}

// Daily rate = plan price / cycle days
export function calculateDailyRate(planPrice: number, cycle: string): number {
  return planPrice / cycleToDays(cycle);
}

// Price for N custom days
export function calculatePriceForDays(planPrice: number, cycle: string, days: number): number {
  const dailyRate = calculateDailyRate(planPrice, cycle);
  return Math.round(dailyRate * days * 100) / 100;
}

// End date = start + N days
export function calculateEndDateByDays(startDate: Date, days: number): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);
  return end;
}

// Logic: Monthly -> add 1 month, Yearly -> add 1 year etc.
export function calculateNextBillingDate(startDate: Date, cycle: string, customDays?: number): Date {
  const next = new Date(startDate);
  if (customDays && customDays > 0) {
    next.setDate(next.getDate() + customDays);
    return next;
  }
  switch (cycle) {
    case 'daily':   next.setDate(next.getDate() + 1); break;
    case 'weekly':  next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'yearly':  next.setFullYear(next.getFullYear() + 1); break;
    default:        next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export function calculateEndDate(startDate: Date, cycle: string, customDays?: number): Date {
  return calculateNextBillingDate(startDate, cycle, customDays);
}

export function calculateTax(amount: number, taxRate: number): number {
  return Math.round((amount * taxRate / 100) * 100) / 100;
}

export function calculateDiscount(amount: number, discountType: string, discountValue: number): number {
  if (discountType === 'percentage') {
    return Math.round((amount * discountValue / 100) * 100) / 100;
  }
  return Math.min(discountValue, amount);
}

export function getSubscriptionHealth(subscription: {
  status: string;
  endDate: Date;
  unpaidInvoices: number;
}): 'healthy' | 'warning' | 'high-risk' {
  const daysUntilExpiry = Math.ceil(
    (new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (subscription.unpaidInvoices > 2 || daysUntilExpiry < 0) {
    return 'high-risk';
  }
  if (subscription.unpaidInvoices > 0 || daysUntilExpiry < 7) {
    return 'warning';
  }
  return 'healthy';
}

export function forecastRevenue(pastMonths: number[]): number {
  if (pastMonths.length === 0) return 0;
  if (pastMonths.length === 1) return pastMonths[0];
  
  // Weighted moving average (recent months weighted more)
  const weights = pastMonths.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = pastMonths.reduce((sum, val, i) => sum + val * weights[i], 0);
  
  return Math.round(weightedSum / totalWeight);
}

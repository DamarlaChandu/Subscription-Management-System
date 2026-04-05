import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const { selectedServices } = await req.json();
    
    if (!selectedServices || !Array.isArray(selectedServices)) {
      return jsonResponse({ baseAmount: 0, savings: 0, finalAmount: 0, tier: 'None', efficiency: 0 }, 400);
    }

    const baseAmount = selectedServices.reduce((sum: number, s: any) => sum + (s.monthlyPrice || 0), 0);
    const count = selectedServices.length;

    let discountPercent = 0;
    let tier = 'Standard';
    
    if (count >= 5) {
      discountPercent = 0.15;
      tier = 'Enterprise Bundle';
    } else if (count >= 3) {
      discountPercent = 0.10;
      tier = 'Standard Bundle';
    } else if (count >= 2) {
      discountPercent = 0.05;
      tier = 'Entry Bundle';
    }

    const savings = baseAmount * discountPercent;
    const platformFee = baseAmount > 0 ? 99 : 0; // Small fixed strategy fee
    const finalAmount = baseAmount - savings + platformFee;
    const efficiency = Math.round((savings / (baseAmount || 1)) * 100) + 75; // Arbitrary high-value scoring (82+ range)

    return jsonResponse({
      baseAmount,
      savings,
      platformFee,
      finalAmount,
      tier,
      efficiency: Math.min(98, efficiency),
      nextTierCount: count < 2 ? 2 : count < 3 ? 3 : count < 5 ? 5 : 0
    });
  } catch (err: any) {
    return jsonResponse({ error: 'Strategy Computation Failure' }, 500);
  }
}

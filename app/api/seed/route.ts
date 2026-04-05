import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Plan from '@/models/Plan';
import Subscription from '@/models/Subscription';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import Setting from '@/models/Setting';
import { hashPassword } from '@/lib/auth';
import { generateSubscriptionId, generateInvoiceNumber } from '@/lib/helpers';
import { jsonResponse, errorResponse } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { action } = await req.json();

    if (action !== 'seed') {
      return errorResponse('Invalid action');
    }

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Plan.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Setting.deleteMany({}),
    ]);

    // Drop indexes that might cause conflicts (SKU_1, subscriptionId etc)
    try {
      await Product.collection.dropIndexes();
      await Subscription.collection.dropIndexes();
    } catch (e) {
      console.log('Skipping index drop as it might not exist');
    }

    const hashedPw = await hashPassword('password123');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@subsaas.com',
      password: hashedPw,
      role: 'admin',
      company: 'SubSaaS Inc.',
    });

    const internal = await User.create({
      name: 'John Manager',
      email: 'john@subsaas.com',
      password: hashedPw,
      role: 'internal',
      company: 'SubSaaS Inc.',
    });

    const customers = await User.create([
      { name: 'Alice Johnson', email: 'alice@example.com', password: hashedPw, role: 'customer', company: 'Acme Corp', phone: '+1234567890' },
      { name: 'Bob Smith', email: 'bob@example.com', password: hashedPw, role: 'customer', company: 'TechStart Inc', phone: '+0987654321' },
      { name: 'Carol White', email: 'carol@example.com', password: hashedPw, role: 'customer', company: 'Design Studio', phone: '+1122334455' },
      { name: 'David Brown', email: 'david@example.com', password: hashedPw, role: 'customer', company: 'Growth Labs', phone: '+5566778899' },
      { name: 'Eve Wilson', email: 'eve@example.com', password: hashedPw, role: 'customer', company: 'CloudNine LLC', phone: '+1231231234' },
    ]);

    // Create products
    const products = await Product.create([
      {
        name: 'Cloud Hosting',
        description: 'Enterprise-grade cloud hosting with 99.9% uptime',
        sku: 'CLOUD-HOST-001',
        type: 'service',
        salesPrice: 99,
        costPrice: 30,
        variants: [
          { attribute: 'Storage', value: '100GB', extraPrice: 0 },
          { attribute: 'Storage', value: '500GB', extraPrice: 50 },
          { attribute: 'Storage', value: '1TB', extraPrice: 100 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'AI Analytics Suite',
        description: 'Advanced analytics with AI-powered insights',
        sku: 'AI-ANLY-002',
        type: 'digital',
        salesPrice: 199,
        costPrice: 50,
        variants: [
          { attribute: 'Users', value: '5', extraPrice: 0 },
          { attribute: 'Users', value: '25', extraPrice: 100 },
          { attribute: 'Users', value: 'Unlimited', extraPrice: 300 },
        ],
        createdBy: admin._id,
      },
      {
        name: 'CRM Platform',
        description: 'Complete customer relationship management',
        sku: 'CRM-PLT-003',
        type: 'service',
        salesPrice: 149,
        costPrice: 40,
        createdBy: admin._id,
      },
      {
        name: 'Email Marketing Tool',
        description: 'Automated email campaigns with templates',
        sku: 'EMAIL-MKT-004',
        type: 'digital',
        salesPrice: 49,
        costPrice: 10,
        createdBy: admin._id,
      },
      {
        name: 'Security Suite',
        description: 'Enterprise security with threat detection',
        sku: 'SEC-STE-005',
        type: 'service',
        salesPrice: 299,
        costPrice: 80,
        createdBy: admin._id,
      },
    ]);

    // Create plans
    const plans = await Plan.create([
      {
        name: 'Cloud Starter',
        description: 'Perfect for small teams',
        price: 99,
        billingCycle: 'monthly',
        product: products[0]._id,
        features: ['100GB Storage', '5 Users', 'Basic Support', '99.9% Uptime'],
        isRenewable: true,
        isPausable: true,
        createdBy: admin._id,
      },
      {
        name: 'Cloud Enterprise',
        description: 'For large organizations',
        price: 499,
        billingCycle: 'monthly',
        product: products[0]._id,
        features: ['1TB Storage', 'Unlimited Users', 'Priority Support', '99.99% Uptime', 'Custom Domain'],
        isRenewable: true,
        isPausable: false,
        createdBy: admin._id,
      },
      {
        name: 'AI Analytics Pro',
        description: 'Full analytics power',
        price: 299,
        billingCycle: 'monthly',
        product: products[1]._id,
        features: ['25 Users', 'Real-time Dashboard', 'Custom Reports', 'API Access'],
        isRenewable: true,
        isPausable: true,
        createdBy: admin._id,
      },
      {
        name: 'CRM Annual',
        description: 'Save with annual billing',
        price: 1499,
        billingCycle: 'yearly',
        product: products[2]._id,
        features: ['All Features', 'Priority Support', 'Custom Integrations', 'Data Export'],
        isRenewable: true,
        autoClose: true,
        createdBy: admin._id,
      },
      {
        name: 'Email Basic',
        description: 'Essential email marketing',
        price: 29,
        billingCycle: 'monthly',
        product: products[3]._id,
        features: ['1000 Contacts', '5 Campaigns/month', 'Basic Templates'],
        isRenewable: true,
        createdBy: admin._id,
      },
      {
        name: 'Security Shield',
        description: 'Complete protection',
        price: 599,
        billingCycle: 'monthly',
        product: products[4]._id,
        features: ['Threat Detection', 'Firewall', 'DDoS Protection', '24/7 Monitoring'],
        isRenewable: true,
        createdBy: admin._id,
      },
    ]);

    // Create subscriptions with invoices and payments
    const now = new Date();
    const subscriptionsData: { customer: any; plan: any; status: string; daysAgo: number; }[] = [
      { customer: customers[0]._id, plan: plans[0]._id, status: 'Active', daysAgo: 60 },
      { customer: customers[0]._id, plan: plans[2]._id, status: 'Active', daysAgo: 30 },
      { customer: customers[1]._id, plan: plans[1]._id, status: 'Active', daysAgo: 45 },
      { customer: customers[1]._id, plan: plans[4]._id, status: 'Active', daysAgo: 20 },
      { customer: customers[2]._id, plan: plans[3]._id, status: 'Active', daysAgo: 90 },
      { customer: customers[2]._id, plan: plans[5]._id, status: 'Confirmed', daysAgo: 5 },
      { customer: customers[3]._id, plan: plans[0]._id, status: 'Active', daysAgo: 120 },
      { customer: customers[3]._id, plan: plans[2]._id, status: 'Quotation', daysAgo: 2 },
      { customer: customers[4]._id, plan: plans[1]._id, status: 'Active', daysAgo: 15 },
      { customer: customers[4]._id, plan: plans[5]._id, status: 'Draft', daysAgo: 1 },
    ];

    for (const sub of subscriptionsData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = plans.find((p: any) => p._id.toString() === sub.plan.toString());
      if (!plan) continue;

      const startDate = new Date(now.getTime() - sub.daysAgo * 24 * 60 * 60 * 1000);
      const expirationDate = new Date(startDate);
      if (plan.billingCycle === 'yearly') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      const subId = generateSubscriptionId();
      const subscription = await Subscription.create({
        subscriptionId: subId,
        subscriptionNumber: subId, 
        customer: sub.customer,
        product: plan.product,
        plan: sub.plan,
        subscriptionType: 'Standard',
        status: sub.status,
        startDate,
        expirationDate,
        autoRenew: true,
        totalAmount: plan.price,
        createdBy: internal._id,
      });

      // Create invoice
      const taxRate = 18;
      const taxAmount = Math.round(plan.price * taxRate / 100 * 100) / 100;
      const total = plan.price + taxAmount;

      const invoice = await Invoice.create({
        invoiceNumber: generateInvoiceNumber(),
        subscription: subscription._id,
        customer: sub.customer,
        items: [{
          description: `${plan.name} subscription`,
          quantity: 1,
          unitPrice: plan.price,
          total: plan.price,
        }],
        subtotal: plan.price,
        taxRate,
        taxAmount,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        total,
        status: sub.status === 'Active' ? 'paid' : 
                sub.status === 'Draft' ? 'draft' : 'confirmed',
        dueDate: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        paidDate: sub.status === 'Active' ? new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000) : undefined,
        createdBy: internal._id,
      });

      // Create payment for paid invoices
      if (invoice.status === 'paid') {
        await Payment.create({
          invoice: invoice._id,
          customer: sub.customer,
          amount: total,
          method: ['credit_card', 'bank_transfer', 'upi'][Math.floor(Math.random() * 3)],
          transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: 'completed',
          paidAt: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          createdBy: internal._id,
        });
      }
    }

    // Create additional historical payments for chart data
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - i);
      
      const paymentCount = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < paymentCount; j++) {
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        const randomInvoice = await Invoice.findOne({ customer: randomCustomer._id });
        if (randomInvoice) {
          await Payment.create({
            invoice: randomInvoice._id,
            customer: randomCustomer._id,
            amount: [99, 199, 299, 499, 599][Math.floor(Math.random() * 5)] * 1.18,
            method: ['credit_card', 'bank_transfer', 'upi'][Math.floor(Math.random() * 3)],
            transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            status: 'completed',
            paidAt: new Date(monthDate.getTime() + Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
            createdBy: internal._id,
          });
        }
      }
    }

    // Create default settings
    await Setting.create([
      { key: 'tax_rate', value: '18', label: 'Tax Rate (%)', type: 'number', updatedBy: admin._id },
      { key: 'currency', value: 'INR', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'INR'], updatedBy: admin._id },
      { key: 'company_name', value: 'SubSaaS Inc.', label: 'Company Name', type: 'text', updatedBy: admin._id },
      { key: 'upi_id', value: 'merchant@upi', label: 'UPI ID (VPA)', type: 'text', updatedBy: admin._id },
      { key: 'upi_merchant_name', value: 'SubSaaS Inc.', label: 'UPI Merchant Name', type: 'text', updatedBy: admin._id },
      { key: 'invoice_prefix', value: 'INV', label: 'Invoice Prefix', type: 'text', updatedBy: admin._id },
      { key: 'auto_invoice', value: 'true', label: 'Auto-generate Invoices', type: 'boolean', updatedBy: admin._id },
      { key: 'payment_terms', value: '30', label: 'Payment Terms (days)', type: 'number', updatedBy: admin._id },
    ]);

    return jsonResponse({
      message: 'Database seeded successfully!',
      credentials: {
        admin: { email: 'admin@subsaas.com', password: 'password123' },
        internal: { email: 'john@subsaas.com', password: 'password123' },
        customer: { email: 'alice@example.com', password: 'password123' },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return errorResponse(message, 500);
  }
}

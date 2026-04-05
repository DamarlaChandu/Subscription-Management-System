const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function seedBilling() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Seeding...');

        // Clear existing to avoid duplicates
        await mongoose.connection.db.collection('subscriptions').deleteMany({});
        
        const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String }));
        const Plan = mongoose.model('Plan', new mongoose.Schema({ name: String, price: Number, billingCycle: String }));
        const Product = mongoose.model('Product', new mongoose.Schema({ name: String, salesPrice: Number }));

        const customer = await User.findOne({ role: 'customer' });
        const plans = await Plan.find().limit(2);
        const products = await Product.find().limit(2);

        if (!customer || plans.length < 1) {
            console.error('Missing Seed Prerequisites: Ensure users and plans are seeded first.');
            process.exit(1);
        }

        const subs = [
            {
                subscriptionNumber: 'SUB-2024-001',
                customer: customer._id,
                plan: plans[0]._id,
                status: 'Active',
                startDate: new Date(),
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Manually 1 mo
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                totalAmount: plans[0].price,
                orderLines: [],
                paymentTerm: 'NET 30',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                subscriptionNumber: 'SUB-2024-002',
                customer: customer._id,
                plan: plans[1]._id,
                status: 'Draft',
                startDate: new Date(),
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                totalAmount: (products[0]?.salesPrice || 100) * 2,
                orderLines: [
                    {
                        product: products[0]?._id,
                        quantity: 2,
                        unitPrice: products[0]?.salesPrice || 100,
                        discount: 0,
                        tax: 10,
                        amount: (products[0]?.salesPrice || 100) * 2 + 10
                    }
                ],
                paymentTerm: 'Immediate',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await mongoose.connection.db.collection('subscriptions').insertMany(subs);
        console.log('Successfully seeded 2 realistic subscriptions with calculated amounts!');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedBilling();

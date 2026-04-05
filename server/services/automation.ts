import cron from 'node-cron';
import Subscription from '../../models/Subscription';
import { sendExpirationEmail } from './email';

/**
 * Tactical Lifecycle Automation Service
 * Runs every hour to check for expired active streams.
 */
export const initLifecycleAutomation = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('🔄 [CRON] Commencing tactical lifecycle check for expired active streams...');
        try {
            const now = new Date();
            
            // Find subscriptions that have reached the end of their lifecycle
            const expiredSubscriptions = await Subscription.find({
                status: 'Active',
                endDate: { $lte: now }
            }).populate('customer', 'name email');

            if (expiredSubscriptions.length > 0) {
                console.log(`📡 [CRON] Identified ${expiredSubscriptions.length} expired cycles. Terminating and orchestrating notification...`);
                
                for (const sub of expiredSubscriptions) {
                    // 1. Update status to Closed
                    sub.status = 'Closed';
                    await sub.save();
                    
                    // 2. Dispatch Expiration Email
                    const customer = sub.customer as any;
                    if (customer && customer.email) {
                        await sendExpirationEmail(customer.email, sub.subscriptionNumber, customer.name);
                    }
                }
                console.log(`🟢 [CRON] Lifecycle termination successfully completed for ${expiredSubscriptions.length} records.`);
            } else {
                console.log('⚪ [CRON] No expired streams identified in current scan.');
            }
        } catch (error) {
            console.error('🔴 [CRON] Lifecycle automation failure:', error);
        }
    });

    console.log('🚀 [CRON] SubSaaS Automation Service activated (Hourly Expiry Check engaged)');
};

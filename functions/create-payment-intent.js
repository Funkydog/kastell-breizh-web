/**
 * Kastell Breizh — Serverless Function: Create Stripe Payment Intent
 *
 * Deploy this file as a serverless function:
 *   - Netlify: place in /netlify/functions/ folder, accessible at /.netlify/functions/create-payment-intent
 *   - Vercel: place in /api/ folder as create-payment-intent.js
 *   - Node.js: use with Express as a POST route
 *
 * SETUP:
 *   1. Install Stripe: npm install stripe
 *   2. Set environment variable STRIPE_SECRET_KEY (sk_live_...)
 *   3. Set environment variable STRIPE_PLATFORM_FEE_PERCENT (e.g. 15 for 15%)
 *   4. Configure each property's Stripe Connected Account ID in PROPERTY_ACCOUNTS below
 *
 * STRIPE CONNECT (for direct-to-owner payments):
 *   Each property owner must create a Stripe account and connect it to your platform.
 *   See: https://stripe.com/docs/connect/standard-accounts
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Map property IDs to their Stripe Connected Account IDs
// Owner obtains their account ID from their Stripe dashboard
const PROPERTY_ACCOUNTS = {
    'kerollivier':  process.env.STRIPE_ACCOUNT_KEROLLIVIER  || null, // e.g. 'acct_1Abc...'
    'saint-guy':    process.env.STRIPE_ACCOUNT_SAINT_GUY    || null,
    'maison-art':   process.env.STRIPE_ACCOUNT_MAISON_ART   || null,
    'pont-dorniol': process.env.STRIPE_ACCOUNT_PONT_DORNIOL || null,
};

const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '15');

// ─── Netlify/Vercel handler ───
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { amount, currency = 'eur', propertyId, guestEmail, metadata = {} } = body;

    if (!amount || amount < 50) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    if (!propertyId || !PROPERTY_ACCOUNTS[propertyId]) {
        // Fallback: process payment to platform account (owner not yet connected via Stripe)
        // In this case the concierge transfers funds manually
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe uses cents
                currency,
                receipt_email: guestEmail,
                metadata: { propertyId, ...metadata },
                automatic_payment_methods: { enabled: true },
            });

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            };
        } catch (err) {
            console.error('Stripe error:', err);
            return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
        }
    }

    // Preferred path: Stripe Connect — payment goes directly to owner
    const ownerAccountId = PROPERTY_ACCOUNTS[propertyId];
    const applicationFeeAmount = Math.round(amount * 100 * PLATFORM_FEE_PERCENT / 100);

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            receipt_email: guestEmail,
            metadata: { propertyId, ...metadata },
            automatic_payment_methods: { enabled: true },
            // Stripe Connect: payment goes to owner, platform fee deducted
            on_behalf_of: ownerAccountId,
            transfer_data: {
                destination: ownerAccountId,
            },
            application_fee_amount: applicationFeeAmount,
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
        };
    } catch (err) {
        console.error('Stripe Connect error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};

/*
 * ─── Express.js version (if using a Node.js server) ───
 *
 * const express = require('express');
 * const app = express();
 * app.use(express.json());
 *
 * app.post('/api/create-payment-intent', async (req, res) => {
 *     const { amount, currency, propertyId, guestEmail, metadata } = req.body;
 *     // ... same logic as above, use res.json() instead of return {...}
 * });
 */

/**
 * Kastell Breizh — Booking Page Logic
 *
 * STRIPE SETUP:
 *   1. Create a Stripe account at stripe.com
 *   2. Replace STRIPE_PUBLISHABLE_KEY with your publishable key (pk_live_...)
 *   3. Deploy functions/create-payment-intent.js as a serverless function
 *      (Netlify Functions, Vercel Functions, or any Node.js server)
 *   4. Update PAYMENT_INTENT_ENDPOINT below
 *
 * GOOGLE CALENDAR SETUP:
 *   No setup required — we use the Google Calendar URL format to generate
 *   an "Add to Calendar" link after booking confirmation.
 *   The concierge receives a booking email with a similar link.
 *
 * FORMSPREE SETUP (for email notifications):
 *   1. Create a free account at formspree.io
 *   2. Create a new form and get your form endpoint
 *   3. Replace FORMSPREE_ENDPOINT below
 */

// ─────────────────────────────────────────────
// CONFIGURATION — Update these values
// ─────────────────────────────────────────────
const CONFIG = {
    STRIPE_PUBLISHABLE_KEY: 'pk_test_YOUR_KEY_HERE', // Replace with your Stripe key
    PAYMENT_INTENT_ENDPOINT: '/api/create-payment-intent', // Your serverless function URL
    FORMSPREE_ENDPOINT: 'https://formspree.io/f/YOUR_FORM_ID', // Replace with your Formspree endpoint
    CONCIERGE_EMAIL: 'contact@kastellbreizh.fr',

    // Google Calendar ICS feeds (one per property, set to public ICS URL from Google Calendar settings)
    CALENDAR_ICS: {
        'kerollivier': null,  // e.g. 'https://calendar.google.com/calendar/ical/...ics'
        'saint-guy': null,
        'maison-art': null,
        'pont-dorniol': null,
    },

    // CORS proxy to fetch ICS feeds from the browser
    CORS_PROXY: 'https://corsproxy.io/?',
};

// ─────────────────────────────────────────────
// PROPERTY DATA
// ─────────────────────────────────────────────
const PROPERTIES = {
    'kerollivier': {
        name: 'Manoir de Kerollivier',
        subtitle: 'Gîtes de caractère · XVIIIe siècle',
        location: 'Saint-Gilles-Pligeaux, Côtes d\'Armor',
        capacity: 6,
        pricePerNight: 185,
        cleaningFee: 80,
        minNights: 2,
        rating: 4.96,
        reviews: 48,
        badge: 'Coup de cœur',
        image: 'images/Kerollivier.jpg',
        features: [
            { icon: 'fas fa-wifi', label: 'WiFi inclus' },
            { icon: 'fas fa-tree', label: 'Grand jardin' },
            { icon: 'fas fa-parking', label: 'Parking privé' },
            { icon: 'fas fa-fire', label: 'Cheminée' },
        ],
    },
    'saint-guy': {
        name: 'Le Gîte de Saint Guy',
        subtitle: 'Gîte familial · Argoat',
        location: 'Gommenec\'h, Côtes d\'Armor',
        capacity: 6,
        pricePerNight: 220,
        cleaningFee: 90,
        minNights: 3,
        rating: 4.88,
        reviews: 36,
        badge: 'Familial',
        image: 'images/StGuy.jpg',
        features: [
            { icon: 'fas fa-wifi', label: 'WiFi inclus' },
            { icon: 'fas fa-swimming-pool', label: 'Piscine privée' },
            { icon: 'fas fa-child', label: 'Équipements enfants' },
            { icon: 'fas fa-seedling', label: 'Potager' },
        ],
    },
    'maison-art': {
        name: 'Maison d\'Art et Nature',
        subtitle: '3 gîtes indépendants · 18 pers.',
        location: 'Saint-Connan, Côtes d\'Armor',
        capacity: 18,
        pricePerNight: 280,
        cleaningFee: 120,
        minNights: 3,
        rating: 5.0,
        reviews: 22,
        badge: 'Note parfaite',
        image: 'images/MaieBail.jpg',
        features: [
            { icon: 'fas fa-wifi', label: 'WiFi inclus' },
            { icon: 'fas fa-palette', label: 'Atelier d\'art' },
            { icon: 'fas fa-hiking', label: 'Sentiers privés' },
            { icon: 'fas fa-users', label: 'Idéal séminaires' },
        ],
    },
    'pont-dorniol': {
        name: 'Manoir de Pont Dorniol',
        subtitle: 'Demeure d\'exception · Noblayau',
        location: 'Laniscat, Côtes d\'Armor',
        capacity: 8,
        pricePerNight: 250,
        cleaningFee: 100,
        minNights: 2,
        rating: 4.95,
        reviews: 41,
        badge: 'Exclusif',
        image: 'images/Pont Dorniol.jpg',
        features: [
            { icon: 'fas fa-wifi', label: 'WiFi inclus' },
            { icon: 'fas fa-spa', label: 'Sauna & bien-être' },
            { icon: 'fas fa-water', label: 'Bord de rivière' },
            { icon: 'fas fa-tree', label: 'Forêt privée' },
        ],
    },
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let state = {
    currentStep: 1,
    selectedProperty: 'kerollivier',
    checkinDate: null,
    checkoutDate: null,
    guests: 2,
    guestDetails: {},
    services: [],
    servicesTotal: 0,
    bookedDates: [],
    calendarInstance: null,
};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Read URL params (e.g. from homepage booking widget)
    const params = new URLSearchParams(window.location.search);
    if (params.get('property') && PROPERTIES[params.get('property')]) {
        state.selectedProperty = params.get('property');
    }
    if (params.get('checkin')) state.checkinDate = params.get('checkin');
    if (params.get('checkout')) state.checkoutDate = params.get('checkout');
    if (params.get('guests')) state.guests = parseInt(params.get('guests')) || 2;

    // Update guests counter display
    document.getElementById('guests-count').textContent = state.guests;

    // Activate the correct property tab
    document.querySelectorAll('.prop-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.property === state.selectedProperty) {
            tab.classList.add('active');
        }
    });

    // Init calendar
    initCalendar();

    // Update summary panel
    updateSummary();

    // Bind events
    bindEvents();
});

// ─────────────────────────────────────────────
// CALENDAR (Flatpickr + ICS)
// ─────────────────────────────────────────────
async function fetchBookedDates(propertyId) {
    const icsUrl = CONFIG.CALENDAR_ICS[propertyId];
    const statusEl = document.getElementById('cal-sync-status');

    if (!icsUrl) {
        statusEl.innerHTML = '<i class="fas fa-calendar-check"></i> Calendrier non synchronisé — toutes les dates disponibles';
        statusEl.className = 'calendar-sync-status success';
        return [];
    }

    try {
        const proxyUrl = CONFIG.CORS_PROXY + encodeURIComponent(icsUrl);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        const icsText = await response.text();
        const events = parseICS(icsText);

        const bookedRanges = events.map(e => ({ from: e.start, to: e.end }));
        statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Disponibilités à jour · ${events.length} réservation(s)`;
        statusEl.className = 'calendar-sync-status success';
        return bookedRanges;
    } catch (err) {
        console.warn('ICS fetch failed:', err);
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Impossible de charger le calendrier';
        statusEl.className = 'calendar-sync-status error';
        return [];
    }
}

function parseICS(icsText) {
    const events = [];
    const lines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let currentEvent = null;

    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
        } else if (line === 'END:VEVENT') {
            if (currentEvent && currentEvent.start && currentEvent.end) {
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            if (line.startsWith('DTSTART')) {
                const val = line.split(':').slice(1).join(':').trim();
                currentEvent.start = parseICalDate(val);
            } else if (line.startsWith('DTEND')) {
                const val = line.split(':').slice(1).join(':').trim();
                currentEvent.end = parseICalDate(val);
            } else if (line.startsWith('SUMMARY')) {
                currentEvent.summary = line.substring(line.indexOf(':') + 1).trim();
            }
        }
    }
    return events;
}

function parseICalDate(str) {
    if (!str) return null;
    const y = parseInt(str.substring(0, 4));
    const m = parseInt(str.substring(4, 6)) - 1;
    const d = parseInt(str.substring(6, 8));
    return new Date(y, m, d);
}

function dateToString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function initCalendar() {
    const prop = PROPERTIES[state.selectedProperty];
    document.getElementById('cal-sync-status').innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Vérification des disponibilités…';
    document.getElementById('cal-sync-status').className = 'calendar-sync-status';

    state.bookedDates = await fetchBookedDates(state.selectedProperty);

    // Build disabled dates array for Flatpickr
    const disabledRanges = state.bookedDates.map(range => ({
        from: dateToString(range.from),
        to: dateToString(new Date(range.to.getTime() - 86400000)), // end is exclusive
    }));

    if (state.calendarInstance) {
        state.calendarInstance.destroy();
    }

    state.calendarInstance = flatpickr('#booking-calendar', {
        inline: true,
        mode: 'range',
        locale: 'fr',
        minDate: 'today',
        minRange: prop.minNights,
        disable: disabledRanges,
        defaultDate: (state.checkinDate && state.checkoutDate) ? [state.checkinDate, state.checkoutDate] : undefined,
        onReady: function() {
            if (state.checkinDate && state.checkoutDate) {
                state.checkinDate = state.checkinDate;
                state.checkoutDate = state.checkoutDate;
                updateDatesDisplay();
                updatePricingInSummary();
            }
        },
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                state.checkinDate = dateToString(selectedDates[0]);
                state.checkoutDate = dateToString(selectedDates[1]);
                updateDatesDisplay();
                updatePricingInSummary();
            } else {
                state.checkinDate = null;
                state.checkoutDate = null;
                document.getElementById('dates-display').style.display = 'none';
                document.getElementById('price-breakdown').style.display = 'none';
                document.getElementById('summary-price-divider').style.display = 'none';
            }
        },
    });
}

// ─────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────
function formatDateFR(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getNights() {
    if (!state.checkinDate || !state.checkoutDate) return 0;
    const d1 = new Date(state.checkinDate);
    const d2 = new Date(state.checkoutDate);
    return Math.round((d2 - d1) / 86400000);
}

function updateDatesDisplay() {
    const nights = getNights();
    document.getElementById('display-checkin').textContent = formatDateFR(state.checkinDate);
    document.getElementById('display-checkout').textContent = formatDateFR(state.checkoutDate);
    document.getElementById('display-nights').textContent = nights + ' nuit' + (nights > 1 ? 's' : '');
    document.getElementById('dates-display').style.display = 'flex';
    document.getElementById('summary-checkin').textContent = formatDateFR(state.checkinDate);
    document.getElementById('summary-checkout').textContent = formatDateFR(state.checkoutDate);
}

function updatePricingInSummary() {
    const prop = PROPERTIES[state.selectedProperty];
    const nights = getNights();
    if (nights <= 0) return;

    const nightsTotal = prop.pricePerNight * nights;
    const total = nightsTotal + prop.cleaningFee + state.servicesTotal;

    document.getElementById('price-nights-label').textContent = `${prop.pricePerNight}€ × ${nights} nuit${nights > 1 ? 's' : ''}`;
    document.getElementById('price-nights-total').textContent = nightsTotal + '€';
    document.getElementById('price-cleaning').textContent = prop.cleaningFee + '€';
    document.getElementById('price-total').textContent = total + '€';
    document.getElementById('pay-amount').textContent = '— ' + total + '€';

    if (state.servicesTotal > 0) {
        document.getElementById('services-total-line').style.display = 'flex';
        document.getElementById('price-services').textContent = state.servicesTotal + '€';
    } else {
        document.getElementById('services-total-line').style.display = 'none';
    }

    document.getElementById('price-breakdown').style.display = 'block';
    document.getElementById('summary-price-divider').style.display = 'block';
}

function updateSummary() {
    const prop = PROPERTIES[state.selectedProperty];
    document.getElementById('summary-img').src = prop.image;
    document.getElementById('summary-img').alt = prop.name;
    document.getElementById('summary-property-name').textContent = prop.name;
    document.getElementById('summary-property-location').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${prop.location}`;
    document.getElementById('summary-rating').textContent = prop.rating;
    document.getElementById('summary-reviews').textContent = `(${prop.reviews} avis)`;
    document.getElementById('summary-badge').textContent = prop.badge;

    const featuresHtml = prop.features.map(f =>
        `<div class="feature-tag"><i class="${f.icon}"></i> ${f.label}</div>`
    ).join('');
    document.getElementById('summary-features').innerHTML = featuresHtml;

    document.getElementById('guests-capacity-note').textContent =
        `Capacité maximale de cette propriété : ${prop.capacity} personnes.`;

    // Clamp guests to capacity
    if (state.guests > prop.capacity) {
        state.guests = prop.capacity;
        document.getElementById('guests-count').textContent = state.guests;
    }
}

// ─────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────
function bindEvents() {
    // Property tabs
    document.querySelectorAll('.prop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.prop-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.selectedProperty = tab.dataset.property;
            state.checkinDate = null;
            state.checkoutDate = null;
            updateSummary();
            initCalendar();
        });
    });

    // Guests counter
    document.getElementById('guests-plus').addEventListener('click', () => {
        const prop = PROPERTIES[state.selectedProperty];
        if (state.guests < prop.capacity) {
            state.guests++;
            document.getElementById('guests-count').textContent = state.guests;
        }
    });
    document.getElementById('guests-minus').addEventListener('click', () => {
        if (state.guests > 1) {
            state.guests--;
            document.getElementById('guests-count').textContent = state.guests;
        }
    });

    // Step 1 → 2
    document.getElementById('step1-next').addEventListener('click', () => {
        const err = document.getElementById('step1-error');
        const prop = PROPERTIES[state.selectedProperty];
        const nights = getNights();

        if (!state.checkinDate || !state.checkoutDate) {
            showError(err, 'Veuillez sélectionner vos dates d\'arrivée et de départ.');
            return;
        }
        if (nights < prop.minNights) {
            showError(err, `La durée minimale de séjour pour cette propriété est de ${prop.minNights} nuits.`);
            return;
        }
        hideError(err);
        goToStep(2);
    });

    // Step 2 → 3
    document.getElementById('step2-next').addEventListener('click', () => {
        const form = document.getElementById('guest-form');
        const err = document.getElementById('step2-error');

        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!firstName || !lastName || !email || !phone) {
            showError(err, 'Veuillez remplir tous les champs obligatoires (*).');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError(err, 'Veuillez saisir une adresse e-mail valide.');
            return;
        }

        // Collect services
        state.servicesTotal = 0;
        state.services = [];
        const serviceChecks = document.querySelectorAll('input[name="services"]:checked');
        const servicePrices = {
            'panier-bienvenue': { label: 'Panier de bienvenue', price: 45 },
            'petit-dejeuner': { label: 'Petit-déjeuner d\'accueil', price: 18 * state.guests },
            'picnic-artisan': { label: 'Pique-nique artisan', price: 35 * state.guests },
            'rom-pack': { label: 'Pack romantique', price: 95 },
        };
        serviceChecks.forEach(s => {
            const sp = servicePrices[s.value];
            if (sp) {
                state.services.push(sp.label);
                state.servicesTotal += sp.price;
            }
        });

        state.guestDetails = {
            firstName, lastName, email, phone,
            arrivalTime: document.getElementById('arrival-time').value,
            specialRequests: document.getElementById('special-requests').value,
        };

        updatePricingInSummary();
        hideError(err);
        goToStep(3);
    });

    // Back buttons
    document.getElementById('step2-back').addEventListener('click', () => goToStep(1));
    document.getElementById('step3-back').addEventListener('click', () => goToStep(2));

    // Pay button
    document.getElementById('pay-button').addEventListener('click', handlePayment);
}

// ─────────────────────────────────────────────
// STEP NAVIGATION
// ─────────────────────────────────────────────
function goToStep(n) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach((s, i) => {
        s.classList.remove('active', 'completed');
        if (i + 1 < n) s.classList.add('completed');
        if (i + 1 === n) s.classList.add('active');
    });
    document.getElementById(`step-${n}`).classList.add('active');
    state.currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// PAYMENT HANDLER
// ─────────────────────────────────────────────
async function handlePayment() {
    const termsCheck = document.getElementById('terms-accept');
    const err = document.getElementById('step3-error');

    if (!termsCheck.checked) {
        showError(err, 'Veuillez accepter les conditions générales de vente.');
        return;
    }
    hideError(err);

    const payBtn = document.getElementById('pay-button');
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Traitement en cours…';

    try {
        // Submit booking to Formspree for email notification
        await submitBookingForm();

        // Simulate payment processing (replace with real Stripe integration)
        await simulatePayment();

        // Show confirmation
        showConfirmation();
    } catch (error) {
        console.error('Payment error:', error);
        showError(err, 'Une erreur est survenue lors du traitement. Veuillez réessayer ou nous contacter.');
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-lock"></i> Confirmer et payer <span id="pay-amount">' + document.getElementById('pay-amount').textContent + '</span>';
    }
}

async function submitBookingForm() {
    if (!CONFIG.FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
        const prop = PROPERTIES[state.selectedProperty];
        const nights = getNights();
        const total = (prop.pricePerNight * nights) + prop.cleaningFee + state.servicesTotal;

        const calLink = buildGoogleCalendarLink();

        const formData = {
            _subject: `Nouvelle Réservation — ${prop.name}`,
            property: prop.name,
            location: prop.location,
            checkin: formatDateFR(state.checkinDate),
            checkout: formatDateFR(state.checkoutDate),
            nights: nights,
            guests: state.guests,
            total: total + '€',
            guest_name: `${state.guestDetails.firstName} ${state.guestDetails.lastName}`,
            guest_email: state.guestDetails.email,
            guest_phone: state.guestDetails.phone,
            arrival_time: state.guestDetails.arrivalTime || 'Non précisé',
            special_requests: state.guestDetails.specialRequests || 'Aucune',
            services: state.services.join(', ') || 'Aucun',
            calendar_link: calLink,
            _replyto: state.guestDetails.email,
        };

        await fetch(CONFIG.FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(formData),
        });
    }
}

async function simulatePayment() {
    // In production, replace this with real Stripe integration:
    //
    // const stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    // const { clientSecret } = await fetch(CONFIG.PAYMENT_INTENT_ENDPOINT, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ amount: totalCents, currency: 'eur', propertyId: state.selectedProperty }),
    // }).then(r => r.json());
    //
    // const elements = stripe.elements({ clientSecret });
    // const paymentElement = elements.create('payment');
    // paymentElement.mount('#payment-element');
    // const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: window.location.href } });

    await new Promise(resolve => setTimeout(resolve, 1500));
}

// ─────────────────────────────────────────────
// CONFIRMATION
// ─────────────────────────────────────────────
function buildGoogleCalendarLink() {
    const prop = PROPERTIES[state.selectedProperty];
    const nights = getNights();
    const total = (prop.pricePerNight * nights) + prop.cleaningFee + state.servicesTotal;
    const guestName = `${state.guestDetails.firstName} ${state.guestDetails.lastName}`;

    const title = encodeURIComponent(`Séjour — ${prop.name} (${guestName})`);
    const details = encodeURIComponent(
        `Voyageurs: ${state.guests}\n` +
        `Contact: ${state.guestDetails.email} · ${state.guestDetails.phone}\n` +
        `Total: ${total}€\n` +
        `Heure d'arrivée estimée: ${state.guestDetails.arrivalTime || 'Non précisée'}\n` +
        `Demandes spéciales: ${state.guestDetails.specialRequests || 'Aucune'}`
    );
    const location = encodeURIComponent(prop.location);

    // Format dates for Google Calendar: YYYYMMDD
    const checkinFormatted = state.checkinDate.replace(/-/g, '');
    const checkoutFormatted = state.checkoutDate.replace(/-/g, '');
    const dates = `${checkinFormatted}/${checkoutFormatted}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

function showConfirmation() {
    const prop = PROPERTIES[state.selectedProperty];
    const nights = getNights();
    const total = (prop.pricePerNight * nights) + prop.cleaningFee + state.servicesTotal;
    const ref = 'KB-' + Date.now().toString().slice(-6);

    document.getElementById('conf-guest-name').textContent = state.guestDetails.firstName;
    document.getElementById('conf-ref').textContent = ref;

    document.getElementById('confirmation-summary').innerHTML = `
        <div class="conf-row"><i class="fas fa-home"></i><div><strong>${prop.name}</strong><span>${prop.location}</span></div></div>
        <div class="conf-row"><i class="fas fa-calendar-alt"></i><div><strong>${formatDateFR(state.checkinDate)} → ${formatDateFR(state.checkoutDate)}</strong><span>${nights} nuit${nights > 1 ? 's' : ''} · ${state.guests} voyageur${state.guests > 1 ? 's' : ''}</span></div></div>
        <div class="conf-row total-conf-row"><i class="fas fa-euro-sign"></i><div><strong>Total réglé : ${total}€</strong><span>Paiement traité par Stripe, versé directement au propriétaire</span></div></div>
    `;

    document.getElementById('gcal-link').href = buildGoogleCalendarLink();
    goToStep(4);
}

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function hideError(el) {
    el.style.display = 'none';
}

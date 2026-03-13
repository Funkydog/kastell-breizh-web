// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

function toggleMenu() {
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
}

if (mobileMenuBtn && closeMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });
}

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Booking widget — redirect to booking.html with URL params
const bookingForm = document.getElementById('reservation');
if (bookingForm) {
    const bookingSubmit = document.getElementById('booking-widget-submit') || bookingForm.querySelector('.booking-submit');

    if (bookingSubmit) {
        bookingSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            const destination = document.getElementById('destination')?.value || '';
            const checkIn = document.getElementById('check-in')?.value || '';
            const checkOut = document.getElementById('check-out')?.value || '';
            const guests = document.getElementById('guests')?.value || '2';

            // Map destination to property ID
            const destToProperty = {
                'guingamp': 'kerollivier',
                'cotes-darmor': 'kerollivier',
            };
            const propertyParam = destToProperty[destination] || '';

            // Build params
            const params = new URLSearchParams();
            if (propertyParam) params.set('property', propertyParam);
            if (checkIn) params.set('checkin', checkIn);
            if (checkOut) params.set('checkout', checkOut);
            if (guests) params.set('guests', guests);

            const bookingUrl = 'booking.html' + (params.toString() ? '?' + params.toString() : '');

            // Loading animation then redirect
            const originalText = bookingSubmit.innerHTML;
            bookingSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification...';
            bookingSubmit.disabled = true;

            setTimeout(() => {
                window.location.href = bookingUrl;
            }, 800);
        });
    }
}

// ==========================================
// Google Calendar Sync Logic (Skeleton)
// ==========================================

// Example structure for parsing an iCal feed or Google Calendar API response
// to block out dates on the booking widget.
async function fetchCalendarAvailability(calendarUrl) {
    try {
        // In a real implementation, you would fetch the iCal .ics file
        // or query the Google Calendar API here.
        // const response = await fetch(calendarUrl);
        // const data = await response.text();

        // Mock data: Returns an array of blocked date strings 'YYYY-MM-DD'
        console.log("Fetching calendar availability...");

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return some mock blocked dates (e.g., next weekend)
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return [
            nextWeek.toISOString().split('T')[0]
        ];
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return [];
    }
}

function disableBookedDates(bookedDates) {
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');

    if (!checkInInput || !checkOutInput) return;

    // Set minimum date to today
    const todayStr = new Date().toISOString().split('T')[0];
    checkInInput.setAttribute('min', todayStr);
    checkOutInput.setAttribute('min', todayStr);

    // Note: Standard HTML <input type="date"> does not support disabling specific arbitrary dates 
    // natively across all browsers using HTML attributes alone. 
    // For a robust implementation, a third-party library like Flatpickr or Litepicker is recommended.

    // Basic validation on change
    checkInInput.addEventListener('change', function () {
        const selectedDate = this.value;
        if (bookedDates.includes(selectedDate)) {
            alert("Cette date est déjà réservée. Veuillez choisir une autre date.");
            this.value = ''; // Reset
        } else {
            // Check-out must be after Check-in
            checkOutInput.setAttribute('min', selectedDate);
        }
    });

    checkOutInput.addEventListener('change', function () {
        const selectedDate = this.value;
        if (bookedDates.includes(selectedDate)) {
            alert("Cette date est déjà réservée. Veuillez choisir une autre date.");
            this.value = ''; // Reset
        }
    });
}

// ==========================================
// Scroll Animation (Intersection Observer)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Animate elements on scroll
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Apply to service cards, property cards, tourism categories
    document.querySelectorAll('.service-card, .property-card, .tourism-category, .hiw-step, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        animateOnScroll.observe(el);
    });
});

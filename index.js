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

// Reservation form basic handling
const bookingForm = document.getElementById('reservation');
if (bookingForm) {
    const bookingSubmit = bookingForm.querySelector('.booking-submit');

    bookingSubmit.addEventListener('click', (e) => {
        e.preventDefault();

        // Add a simple loading effect
        const originalText = bookingSubmit.innerHTML;
        bookingSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recherche...';
        bookingSubmit.disabled = true;

        // Simulate network request
        setTimeout(() => {
            bookingSubmit.innerHTML = '<i class="fas fa-check"></i> Disponible';
            bookingSubmit.classList.remove('btn-primary');
            bookingSubmit.style.backgroundColor = '#2ecc71';
            bookingSubmit.style.color = 'white';

            setTimeout(() => {
                bookingSubmit.innerHTML = originalText;
                bookingSubmit.disabled = false;
                bookingSubmit.classList.add('btn-primary');
                bookingSubmit.style = '';
            }, 2000);
        }, 1500);
    });
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

// Initialize Calendar Sync (Example URL)
const googleCalendarUrl = "https://calendar.google.com/calendar/ical/example/public/basic.ics";

// Run sync on load
document.addEventListener('DOMContentLoaded', async () => {
    const bookedDates = await fetchCalendarAvailability(googleCalendarUrl);
    disableBookedDates(bookedDates);
});

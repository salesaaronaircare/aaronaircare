// ===== PAGE LOADER =====
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        // Set to 200ms (0.2s) for instant opening
        const timeout = 200;
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300); // Fast fade out
        }, timeout);
    }
});

// ===== GLOBAL IMAGE FALLBACK (Fixes 404s) =====
document.addEventListener('error', function (e) {
    if (e.target.tagName.toLowerCase() === 'img') {
        // Industrial-grade placeholder
        e.target.src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400';
    }
}, true);

// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    if (header) {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
}

function closeMobileNav() {
    if (hamburger && mobileNav) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Close mobile nav on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileNav();
    }
});

// ===== SCROLL REVEAL ANIMATION =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    revealObserver.observe(el);
});

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav.main-nav a.nav-link, .mobile-nav a.mob-nav-link');

function setActiveNav() {
    let current = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', setActiveNav);
window.addEventListener('load', setActiveNav);

// ===== COUNTER ANIMATION =====
function animateCounter(el, target) {
    const duration = window.innerWidth < 768 ? 1500 : 2000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        // Start from 1 as requested, and ensure it hits the target
        const current = Math.max(1, Math.floor(eased * target));

        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            el.textContent = target;
        }
    }

    requestAnimationFrame(updateCounter);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number[data-target]');
            statNumbers.forEach(num => {
                const target = parseInt(num.getAttribute('data-target'));
                if (!isNaN(target)) {
                    animateCounter(num, target);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// ===== APPOINTMENT FORM WITH FORMSPREE =====
const appointmentForm = document.getElementById('appointmentForm');

if (appointmentForm) {
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;

        // Get form data
        const formData = new FormData(appointmentForm);

        // Show loading state
        submitBtn.innerHTML = '⏳ Sending...';
        submitBtn.disabled = true;

        try {
            // Submit to Formspree
            const response = await fetch(appointmentForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success
                submitBtn.innerHTML = '✅ Request Submitted Successfully!';
                submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                appointmentForm.reset();

                // Reset button after 4 seconds
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 4000);
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            // Error
            submitBtn.innerHTML = '❌ Error! Please try again.';
            submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        }
    });
}

// ===== REVIEWS SYSTEM =====
// Initialize reviews from localStorage
let reviews = JSON.parse(localStorage.getItem('aac_reviews')) || [];

// Default reviews if none exist
if (reviews.length === 0) {
    reviews = [
        {
            id: 1,
            name: 'Rajesh Sharma',
            company: 'Medico Pharma',
            rating: 5,
            text: 'Aaron Air Care Engineering delivered exceptional results for our pharmaceutical facility. Their team\'s attention to detail and commitment to GMP compliance was outstanding.',
            date: '2025-01-15'
        },
        {
            id: 2,
            name: 'Prakash Kumar',
            company: 'Kumar Textiles',
            rating: 5,
            text: 'The modular AHU system they installed has significantly improved our production quality. Humidity control is precise, and we\'ve seen a 30% reduction in yarn breakage.',
            date: '2026-01-10'
        },
        {
            id: 3,
            name: 'Amit Gupta',
            company: 'Gupta Chemicals',
            rating: 5,
            text: 'Professional team, on-time delivery, and excellent after-sales support. Their AMC service keeps our systems running at peak efficiency.',
            date: '2025-01-05'
        }
    ];
    localStorage.setItem('aac_reviews', JSON.stringify(reviews));
}

// Display reviews
async function displayReviews() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    try {
        // Fetch only APPROVED reviews from Firestore
        const snap = await db.collection("reviews").where("status", "==", "approved").orderBy("date", "desc").get();
        
        if (snap.empty) {
            reviewsList.innerHTML = '<div class="no-reviews">No verified reviews yet. Be the first to share your experience!</div>';
            return;
        }

        let reviewsData = [];
        snap.forEach(doc => reviewsData.push(doc.data()));

        const reviewsHtml = reviewsData.map(review => `
            <div class="review-item">
              <div class="review-header">
                <div class="review-author-info">
                  <h4>${escapeHtml(review.name)}</h4>
                  <span>${escapeHtml(review.company || 'Customer')}</span>
                </div>
                <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
              </div>
              <p class="review-text">${escapeHtml(review.text)}</p>
              <div class="review-date">${formatDate(review.date)}</div>
            </div>
        `).join('');

        // Marquee looping logic
        let finalHtml = reviewsHtml;
        if (reviewsData.length < 5) {
            finalHtml = reviewsHtml.repeat(4);
        } else {
            finalHtml = reviewsHtml.repeat(2);
        }

        reviewsList.innerHTML = finalHtml;
    } catch (e) {
        console.error("Reviews Load Error:", e);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Handle review form submission
const reviewForm = document.getElementById('reviewForm');

if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('reviewName').value.trim();
        const company = document.getElementById('reviewCompany').value.trim();
        const text = document.getElementById('reviewText').value.trim();
        const rating = document.querySelector('input[name="rating"]:checked');

        if (!name || !text || !rating) {
            alert('Please fill in all required fields and select a rating.');
            return;
        }

        const submitBtn = reviewForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Submitting...';

        try {
            const newReview = {
                name: name,
                company: company,
                rating: parseInt(rating.value),
                text: text,
                date: new Date().toISOString().split('T')[0],
                status: 'pending' // Admin must approve
            };

            // Save to Firestore
            await db.collection("reviews").add(newReview);

            // Show success message
            submitBtn.innerHTML = '✅ Review Sent for Approval!';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

            // Reset form
            reviewForm.reset();

            // Reset button after 4 seconds
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 4000);
        } catch (error) {
            submitBtn.innerHTML = '❌ Error. Try again.';
            submitBtn.disabled = false;
        }
    });
}

// Display reviews on page load
document.addEventListener('DOMContentLoaded', displayReviews);

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();

            const headerHeight = header ? header.offsetHeight : 76;
            const targetPosition = target.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            closeMobileNav();
        }
    });
});

// ===== PHONE INPUT FORMATTING =====
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 0 && !e.target.value.startsWith('+')) {
            if (value.startsWith('91')) {
                value = '+' + value;
            } else if (value.length >= 10) {
                value = '+91' + value;
            }
        }

        if (value.startsWith('+91') && value.length > 3) {
            const rest = value.slice(3);
            if (rest.length > 5) {
                value = '+91 ' + rest.slice(0, 5) + ' ' + rest.slice(5, 10);
            } else {
                value = '+91 ' + rest;
            }
        }

        e.target.value = value;
    });
}

// ===== LAZY LOADING FOR IMAGES =====
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

// ===== DEBOUNCE SCROLL EVENTS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedScrollHandler = debounce(() => {
    // Any heavy scroll operations here
}, 16);

// Note: renderDynamicProjects is now handled in index.html to avoid duplication.

window.addEventListener('scroll', debouncedScrollHandler);

// ===== PROJECT FILTERING & SHOW MORE =====
const filterButtons = document.querySelectorAll('.filter-btn');
const btnShowMore = document.getElementById('btnShowMore');

let isShowingAll = false;

function updateProjectVisibility() {
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    if (!activeFilterBtn) return;

    const activeFilter = activeFilterBtn.getAttribute('data-filter');
    const allCards = document.querySelectorAll('.project-card'); // Query ALL cards (static + dynamic)
    let visibleCount = 0;

    allCards.forEach((card) => {
        const matchesFilter = activeFilter === 'all' || card.classList.contains(activeFilter);

        if (matchesFilter) {
            visibleCount++;
            // Show if "Showing All" OR if it's within the first 2 matching projects
            if (isShowingAll || visibleCount <= 2) {
                card.style.display = 'flex';
                // Minor delay to ensure display:flex is applied before animation
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                    card.classList.add('visible');
                }, 50);
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
                card.classList.remove('visible');
            }
        } else {
            card.style.display = 'none';
            card.style.opacity = '0';
            card.classList.remove('visible');
        }
    });

    // Handle "View All" Button visibility
    const totalMatching = Array.from(allCards).filter(card =>
        activeFilter === 'all' || card.classList.contains(activeFilter)
    ).length;

    if (btnShowMore) {
        const container = btnShowMore.parentElement;
        // Always show if there are more than 2 matching projects
        if (totalMatching > 2) {
            container.style.display = 'flex';
            // Update text based on state
            if (isShowingAll) {
                btnShowMore.innerHTML = `View Less <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px; transform: rotate(180deg);"><path d="M6 9l6 6 6-6"/></svg>`;
            } else {
                btnShowMore.innerHTML = `View All Projects <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;"><path d="M6 9l6 6 6-6"/></svg>`;
            }
        } else {
            container.style.display = 'none';
        }
    }
}

if (btnShowMore) {
    btnShowMore.addEventListener('click', () => {
        const allCards = document.querySelectorAll('.project-card');
        if (!isShowingAll) {
            isShowingAll = true;
            updateProjectVisibility();

            // Smooth scroll to the 4th project
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            const matchingCards = Array.from(allCards).filter(card => activeFilter === 'all' || card.classList.contains(activeFilter));
            if (matchingCards[3]) {
                matchingCards[3].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            isShowingAll = false;
            updateProjectVisibility();

            // Scroll back to top of projects
            const section = document.getElementById('projects');
            if (section) {
                const headerHeight = document.getElementById('header')?.offsetHeight || 80;
                window.scrollTo({
                    top: section.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        }
    });
}

if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            isShowingAll = false; // Reset "Show More" when category changes
            updateProjectVisibility();
        });
    });
}

// Run initially
document.addEventListener('DOMContentLoaded', () => {
    updateProjectVisibility(); // Handle visibility/show-more
    
    // Dynamic Copyright Year
    const footerCopy = document.querySelector('.footer-copy');
    if (footerCopy) {
        const year = new Date().getFullYear();
        footerCopy.innerHTML = `&copy; ${year} Aaron Air Care Engineering. All Rights Reserved.`;
    }
});

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🔧 Aaron Air Care Engineering', 'font-size: 24px; font-weight: bold; color: #1e6fc4;');
console.log('%cProfessional HVAC Services', 'font-size: 14px; color: #4faee8;');
console.log('%c📞 Contact: +91 70782 84202', 'font-size: 12px; color: #666;');

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.message);
});

// ===== PRODUCTION READY =====
console.log('%c✅ Aaron Air Care Engineering - Website Live & Optimized', 'font-size: 14px; color: #10b981;');

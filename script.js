// ==========================================
// FIREBASE REALTIME DATABASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBf4D-K8Cbrc9rDPIPmAQILNFTEmjuFvx4",
  authDomain: "bitecritics-efd34.firebaseapp.com",
  databaseURL: "https://bitecritics-efd34-default-rtdb.firebaseio.com/",
  projectId: "bitecritics-efd34",
  storageBucket: "bitecritics-efd34.firebasestorage.app",
  messagingSenderId: "270155025553",
  appId: "1:270155025553:web:24df6a099d008e7fcac330",
  measurementId: "G-P7CC6G32KT"
};

let useFirebase = firebaseConfig.apiKey !== "AIzaSyBf4D-K8Cbrc9rDPIPmAQILNFTEmjuFvx4";
let db = null;

// Initialize Firebase only if valid config is provided
if (useFirebase && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database(); // Realtime Database initialization
}

// Global State
let allReviews = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // Page: Home Screen
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        fetchReviews();
        setupHomeEventListeners();
    }

    // Page: Submit Screen
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        setupSubmitEventListeners();
    }
});

// Fetch reviews from Realtime Database or LocalStorage fallback
function fetchReviews() {
    if (useFirebase && db) {
        db.ref('reviews').orderByChild('createdAt').once('value')
            .then((snapshot) => {
                allReviews = [];
                snapshot.forEach((childSnapshot) => {
                    allReviews.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });
                // Reverse to show newest reviews first
                allReviews.reverse();
                renderReviews();
            })
            .catch((error) => {
                console.error("Error getting reviews from Firebase Realtime DB: ", error);
                loadFallbackReviews();
            });
    } else {
        loadFallbackReviews();
    }
}

function loadFallbackReviews() {
    const saved = JSON.parse(localStorage.getItem('localReviews'));
    if (saved && saved.length > 0) {
        allReviews = saved;
    } else {
        allReviews = [
            { id: '1', title: 'Bella Italia', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', rating: 5, review: 'Absolute best pasta in town! Authentic flavors and great ambiance.', createdAt: Date.now() - 86400000 },
            { id: '2', title: 'Burger Shack', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349', rating: 4, review: 'Juicy burgers, crispy fries. Highly recommend the truffle fries.', createdAt: Date.now() }
        ];
    }
    renderReviews();
}

// Render reviews to grid based on active filter
function renderReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    let filtered = [...allReviews];

    if (currentFilter === '5-stars') {
        filtered = filtered.filter(r => r.rating === 5);
    } else if (currentFilter === 'recent') {
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<p>No reviews found.</p>';
        return;
    }

    filtered.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <img src="${review.image}" alt="${review.title}">
            <div class="card-content">
                <h3>${review.title}</h3>
                <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <p class="snippet">${review.review.substring(0, 80)}...</p>
            </div>
        `;
        card.addEventListener('click', () => openModal(review));
        container.appendChild(card);
    });
}

// Home Event Listeners
function setupHomeEventListeners() {
    document.getElementById('add-review-btn').addEventListener('click', () => {
        window.location.href = 'submit.html';
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderReviews();
        });
    });

    document.getElementById('close-modal').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('review-modal');
        if (e.target === modal) closeModal();
    });
}

function openModal(review) {
    document.getElementById('modal-img').src = review.image;
    document.getElementById('modal-title').textContent = review.title;
    document.getElementById('modal-stars').textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    document.getElementById('modal-review').textContent = review.review;
    document.getElementById('modal-date').textContent = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Just now';
    
    document.getElementById('review-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('review-modal').classList.add('hidden');
}

// Submit Event Listeners
function setupSubmitEventListeners() {
    const starPicker = document.getElementById('star-picker');
    const ratingInput = document.getElementById('rating-value');
    const stars = starPicker.querySelectorAll('span');

    stars.forEach(s => s.classList.add('selected'));

    starPicker.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            const val = parseInt(e.target.getAttribute('data-value'));
            ratingInput.value = val;
            stars.forEach((s, index) => {
                if (index < val) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
        }
    });

    document.getElementById('review-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const newReview = {
            title: document.getElementById('restaurant-name').value,
            image: document.getElementById('restaurant-image').value,
            rating: parseInt(document.getElementById('rating-value').value),
            review: document.getElementById('restaurant-review').value,
            createdAt: Date.now()
        };

        if (useFirebase && db) {
            // Push to Realtime Database
            db.ref('reviews').push(newReview)
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error adding review to Realtime DB: ", error);
                    alert("Firebase Error: " + error.message);
                });
        } else {
            // LocalStorage fallback if config is default
            let localReviews = JSON.parse(localStorage.getItem('localReviews')) || [];
            newReview.id = Date.now().toString();
            localReviews.unshift(newReview);
            localStorage.setItem('localReviews', JSON.stringify(localReviews));
            window.location.href = 'index.html';
        }
    });
}
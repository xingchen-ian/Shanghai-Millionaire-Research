// Mobile nav toggle
document.querySelector('.nav-toggle')?.addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('open');
});

// Close nav on link click (mobile)
document.querySelectorAll('.nav-links a').forEach(function(link) {
    link.addEventListener('click', function() {
        document.querySelector('.nav-links').classList.remove('open');
    });
});

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

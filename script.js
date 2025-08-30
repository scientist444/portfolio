// Tab Navigation System
let currentTab = 'about';

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    const targetContent = document.getElementById(tabName + '-content');
    if (targetContent) {
        targetContent.classList.add('active');
        currentTab = tabName;
    }
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Tab button event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            showTab(tabName);
        });
    });
});

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Page Navigation background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.page-navigation');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.backdropFilter = 'blur(12px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    }
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.project-card, .skill-category, .achievement-card, .service-card, .timeline-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-in-out';
        observer.observe(el);
    });
});

// Form handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // Simple validation
        if (!name || !email || !subject || !message) {
            alert('Please fill in all fields.');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        
        // Create mailto link
        const mailtoLink = `mailto:umersajid20208@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message
        alert('Email client opened! Please send the email to complete your message.');
        
        // Reset form
        contactForm.reset();
    });
}

// Typing animation for header title
const nameTitle = document.querySelector('.name-title');
if (nameTitle) {
    const text = nameTitle.textContent;
    nameTitle.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            nameTitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };
    
    // Start typing animation after a short delay
    setTimeout(typeWriter, 1500);
}

// Add glitch effect to hero title on hover
const titleLines = document.querySelectorAll('.title-line');
titleLines.forEach(line => {
    line.addEventListener('mouseenter', () => {
        line.style.textShadow = '2px 0 #00ff88, -2px 0 #0066ff';
        setTimeout(() => {
            line.style.textShadow = 'none';
        }, 200);
    });
});

// Stats counter animation for header showcase
const animateHeaderStats = () => {
    const headerStats = document.querySelectorAll('.stats-showcase .stat-number');
    headerStats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const increment = target / 30;
        let current = 0;
        
        const updateStat = () => {
            if (current < target) {
                current += increment;
                stat.textContent = Math.floor(current);
                requestAnimationFrame(updateStat);
            } else {
                stat.textContent = target;
            }
        };
        
        updateStat();
    });
};

// Stats counter animation for about section
const statsNumbers = document.querySelectorAll('.about-stats .stat-number');
const animateAboutStats = () => {
    statsNumbers.forEach(stat => {
        const target = parseInt(stat.textContent.replace('+', ''));
        const increment = target / 20;
        let current = 0;
        
        const updateStat = () => {
            if (current < target) {
                current += increment;
                stat.textContent = Math.floor(current) + '+';
                setTimeout(updateStat, 100);
            } else {
                stat.textContent = target + '+';
            }
        };
        
        updateStat();
    });
};

// Trigger header stats animation on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateHeaderStats, 2000);
});

// Trigger about stats animation when about section is visible
const aboutSection = document.querySelector('#about-content');
if (aboutSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateAboutStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(aboutSection);
}

// Add dynamic circuit animation
const addCircuitNodes = () => {
    const circuitBoard = document.querySelector('.circuit-board');
    if (!circuitBoard) return;
    
    for (let i = 0; i < 5; i++) {
        const node = document.createElement('div');
        node.className = 'circuit-node';
        node.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--primary-color);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: nodePulse 2s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        circuitBoard.appendChild(node);
    }
};

// Add CSS for circuit nodes
const addCircuitNodeStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes nodePulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
        }
    `;
    document.head.appendChild(style);
};

// Initialize circuit animation
document.addEventListener('DOMContentLoaded', () => {
    addCircuitNodeStyles();
    addCircuitNodes();
});

// Parallax effect for header section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const headerBackground = document.querySelector('.header-background');
    if (headerBackground) {
        headerBackground.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
    
    // Fade out header on scroll
    const header = document.querySelector('.portfolio-header');
    if (header && scrolled > 0) {
        const opacity = Math.max(1 - scrolled / (window.innerHeight * 0.5), 0);
        header.style.opacity = opacity;
    }
});

// Add hover effects to project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        const techTags = card.querySelectorAll('.tech-tag');
        techTags.forEach((tag, index) => {
            setTimeout(() => {
                tag.style.transform = 'translateY(-2px)';
                tag.style.backgroundColor = 'rgba(0, 255, 136, 0.2)';
            }, index * 50);
        });
    });
    
    card.addEventListener('mouseleave', () => {
        const techTags = card.querySelectorAll('.tech-tag');
        techTags.forEach(tag => {
            tag.style.transform = 'translateY(0)';
            tag.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
        });
    });
});

// Add click to copy email functionality
const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
emailLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const email = 'umersajid20208@gmail.com';
        
        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(email).then(() => {
                // Show temporary tooltip
                const tooltip = document.createElement('div');
                tooltip.textContent = 'Email copied to clipboard!';
                tooltip.style.cssText = `
                    position: fixed;
                    background: var(--primary-color);
                    color: var(--dark-bg);
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    z-index: 10000;
                    pointer-events: none;
                    left: ${e.clientX}px;
                    top: ${e.clientY - 40}px;
                    transform: translateX(-50%);
                `;
                document.body.appendChild(tooltip);
                
                setTimeout(() => {
                    document.body.removeChild(tooltip);
                }, 2000);
            });
        }
    });
});

// Loading animation
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in-out';
        document.body.style.opacity = '1';
    }, 100);
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Performance optimization: Lazy load heavy animations
const lazyAnimations = () => {
    const circuitAnimation = document.querySelector('.circuit-animation');
    if (circuitAnimation) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    animationObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        animationObserver.observe(circuitAnimation);
    }
};

// Initialize lazy animations
document.addEventListener('DOMContentLoaded', lazyAnimations);

// Image Modal Functionality
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.querySelector('.modal-caption');
    const closeModal = document.querySelector('.close-modal');
    
    // Make all project and achievement images clickable
    const clickableImages = document.querySelectorAll('.project-image img, .achievement-image img');
    
    clickableImages.forEach(img => {
        img.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'block';
            modalImage.src = img.src;
            modalCaption.textContent = img.alt;
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        });
    });
    
    // Close modal functionality
    const closeModalFunc = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    };
    
    closeModal.addEventListener('click', closeModalFunc);
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalFunc();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModalFunc();
        }
    });
    
    // Prevent modal image from closing when clicked
    modalImage.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
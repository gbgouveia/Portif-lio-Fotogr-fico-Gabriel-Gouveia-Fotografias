document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     0. SCROLL-CONTROLLED HERO VIDEO
     ========================================================================== */
  const video = document.getElementById('hero-video');
  const heroTrack = document.getElementById('hero-track');

  let videoDuration = 0;

  if (video && heroTrack) {
    if (prefersReducedMotion) {
      // Accessibility fallback: Play video automatically, no scroll control
      heroTrack.style.height = 'auto';
      video.autoplay = true;
      video.loop = true;
      video.play().catch(err => console.log("Autoplay blocked or failed:", err));
    } else {
      // Wait for video metadata to get duration
      video.addEventListener('loadedmetadata', () => {
        videoDuration = video.duration;
        updateVideoSeek();
      });

      // Backup check if metadata is already loaded
      if (video.readyState >= 1) {
        videoDuration = video.duration;
        updateVideoSeek();
      }

      // Synchronize video currentTime with scroll progress
      let ticking = false;

      function updateVideoSeek() {
        if (videoDuration === 0) return;

        const rect = heroTrack.getBoundingClientRect();
        const trackHeight = heroTrack.scrollHeight;
        const viewportHeight = window.innerHeight;

        const scrollableRange = trackHeight - viewportHeight;
        const scrolled = -rect.top;

        // Progress fraction from 0 (top of track) to 1 (bottom of track)
        let progress = scrolled / scrollableRange;
        progress = Math.max(0, Math.min(1, progress));

        // Set video time matching progress
        video.currentTime = progress * videoDuration;
        ticking = false;
      }

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(updateVideoSeek);
          ticking = true;
        }
      }, { passive: true });
      
      window.addEventListener('resize', updateVideoSeek);
    }
  }

  /* ==========================================================================
     1. HEADER SCROLL STATE
     ========================================================================== */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.backgroundColor = 'rgba(18, 18, 18, 0.95)';
      header.style.padding = '0.2rem 0';
    } else {
      header.style.backgroundColor = 'rgba(18, 18, 18, 0.75)';
      header.style.padding = '0';
    }
  });

  /* ==========================================================================
     2. RESPONSIVE MOBILE MENU
     ========================================================================== */
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  function toggleMenu() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Prevent body scrolling when menu is active
    document.body.style.overflow = !isExpanded ? 'hidden' : '';
  }

  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', toggleMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu if resize above mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 991) {
      closeMenu();
    }
  });

  /* ==========================================================================
     3. SCROLL REVEAL OBSERVER
     ========================================================================== */
  const reveals = document.querySelectorAll('.reveal');
  
  // Only init observer if prefers-reduced-motion is not set
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Once revealed, no need to track it anymore
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // triggers slightly before entering viewport fully
    });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    // If browser doesn't support or user prefers reduced motion, show immediately
    reveals.forEach(el => el.classList.add('active'));
  }

  /* ==========================================================================
     4. INTERACTIVE LIGHTBOX GALLERY
     ========================================================================== */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  
  // Extract gallery images data
  const imagesData = Array.from(galleryItems).map(item => {
    const img = item.querySelector('img');
    return {
      src: img.src,
      alt: img.alt
    };
  });
  
  let currentImageIndex = 0;

  function openLightbox(index) {
    currentImageIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus close button for accessibility
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    const data = imagesData[currentImageIndex];
    lightboxImg.src = data.src;
    lightboxImg.alt = data.alt;
  }

  function showPrev() {
    currentImageIndex = (currentImageIndex - 1 + imagesData.length) % imagesData.length;
    updateLightboxImage();
  }

  function showNext() {
    currentImageIndex = (currentImageIndex + 1) % imagesData.length;
    updateLightboxImage();
  }

  // Bind clicks to gallery items
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  // Bind lightbox controls
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
  });
  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showNext();
  });

  // Close when clicking outside of image
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      showPrev();
    } else if (e.key === 'ArrowRight') {
      showNext();
    }
  });

  /* ==========================================================================
     5. AGENDAMENTO FORM VALIDATION & SUBMISSION
     ========================================================================== */
  const bookingForm = document.getElementById('booking-form');
  const submitBtn = document.getElementById('submit-btn');
  const toast = document.getElementById('toast');

  // Input elements
  const inputs = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    serviceType: document.getElementById('service-type'),
    eventDate: document.getElementById('event-date')
  };

  // Error messages elements
  const errors = {
    name: document.getElementById('name-error'),
    email: document.getElementById('email-error'),
    phone: document.getElementById('phone-error'),
    serviceType: document.getElementById('service-type-error'),
    eventDate: document.getElementById('event-date-error')
  };

  // Basic regex validation patterns
  const validationRules = {
    name: (val) => val.trim().length > 2,
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    phone: (val) => val.trim().replace(/\D/g, '').length >= 10,
    serviceType: (val) => val !== '',
    eventDate: (val) => {
      if (!val) return false;
      const selectDate = new Date(val);
      const today = new Date();
      // Set hours to 0 to compare dates only
      today.setHours(0,0,0,0);
      return selectDate >= today;
    }
  };

  function validateField(fieldId) {
    const input = inputs[fieldId];
    const errorMsg = errors[fieldId];
    const isValid = validationRules[fieldId](input.value);

    if (isValid) {
      input.classList.remove('invalid');
      if (errorMsg) errorMsg.style.display = 'none';
      return true;
    } else {
      input.classList.add('invalid');
      if (errorMsg) errorMsg.style.display = 'block';
      return false;
    }
  }

  // Clear individual field errors on input/change
  Object.keys(inputs).forEach(key => {
    const eventType = inputs[key].tagName === 'SELECT' ? 'change' : 'input';
    inputs[key].addEventListener(eventType, () => {
      if (inputs[key].classList.contains('invalid')) {
        validateField(key);
      }
    });
  });

  // Handle Form Submit
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Trigger validation on all fields
    let formIsValid = true;
    Object.keys(inputs).forEach(key => {
      const fieldValid = validateField(key);
      if (!fieldValid) {
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      // Focus first invalid element
      const firstInvalid = bookingForm.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // If valid, simulate loading and submit
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    // Simulate Server Request (e.g. 1.8 seconds)
    setTimeout(() => {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      
      // Show Success Toast
      toast.classList.add('active');
      
      // Clear Form
      bookingForm.reset();
      
      // Hide Toast after 4 seconds
      setTimeout(() => {
        toast.classList.remove('active');
      }, 4000);

    }, 1800);
  });

  /* ==========================================================================
     6. PREMIUM CREATIVE DEVELOPER ENHANCEMENTS (Inspired by Breedlove.xyz)
     ========================================================================== */
  
  if (!prefersReducedMotion) {
    // A. LENIS SMOOTH PAGE SCROLL
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      // Support page anchor links smoothly
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          const targetId = this.getAttribute('href');
          if (targetId === '#') return;
          
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl);
          }
        });
      });
    }

    // B. INTERACTIVE 3D CARD TILT EFFECT
    const tiltElements = document.querySelectorAll('.portfolio-item, .gallery-item');
    tiltElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;

        const maxTilt = 8; // elegant and subtle tilt

        const rotateX = -percentY * maxTilt;
        const rotateY = percentX * maxTilt;

        el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        el.style.transition = 'transform 0.08s ease-out';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'rotateX(0deg) rotateY(0deg)';
        el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      });

      el.addEventListener('mouseenter', () => {
        el.style.transition = 'transform 0.2s ease-out';
      });
    });

    // C. INTERACTIVE CONSTELLATION CANVAS
    const canvas = document.getElementById('constellation-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let width = canvas.width = canvas.offsetWidth;
      let height = canvas.height = canvas.offsetHeight;

      const particles = [];
      const particleCount = 45;
      const maxDistance = 110;
      const mouse = { x: null, y: null, active: false };

      window.addEventListener('resize', () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      });

      const heroOverlay = document.querySelector('.hero-overlay');
      if (heroOverlay) {
        heroOverlay.addEventListener('mousemove', (e) => {
          const rect = heroOverlay.getBoundingClientRect();
          mouse.x = e.clientX - rect.left;
          mouse.y = e.clientY - rect.top;
          mouse.active = true;
        });

        heroOverlay.addEventListener('mouseleave', () => {
          mouse.x = null;
          mouse.y = null;
          mouse.active = false;
        });
      }

      class Particle {
        constructor() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.vx = (Math.random() - 0.5) * 0.35;
          this.vy = (Math.random() - 0.5) * 0.35;
          this.radius = Math.random() * 1.2 + 0.6;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;

          if (mouse.active && mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              this.x += dx * 0.008;
              this.y += dy * 0.008;
            }
          }
        }

        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(230, 200, 156, 0.45)'; // ACCENT COLOR
          ctx.fill();
        }
      }

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }

      function animateParticles() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
          p.update();
          p.draw();
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDistance) {
              const alpha = (1 - dist / maxDistance) * 0.12;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(230, 200, 156, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }

          if (mouse.active && mouse.x !== null && mouse.y !== null) {
            const p = particles[i];
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 140) {
              const alpha = (1 - dist / 140) * 0.22;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(230, 200, 156, ${alpha})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }

        requestAnimationFrame(animateParticles);
      }

      animateParticles();
    }

    // D. CELESTIAL THEME TOGGLE (Inspired by Breedlove.xyz)
    const themeToggle = document.getElementById('theme-toggle');
    const logoImg = document.querySelector('.logo img');
    
    if (themeToggle && logoImg) {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeUI(savedTheme);

      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeUI(newTheme);
      });

      function updateThemeUI(theme) {
        if (theme === 'light') {
          logoImg.src = 'assets/logo-dark.png';
          themeToggle.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-toggle-svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          `;
        } else {
          logoImg.src = 'assets/logo-white.png';
          themeToggle.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-toggle-svg">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          `;
        }
      }
    }
  }
});

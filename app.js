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
});

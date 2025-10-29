/**
 * Parallax scrolling effects
 * Adds smooth parallax movement to elements with .parallax-* classes
 */

document.addEventListener('DOMContentLoaded', () => {
  const parallaxElements = {
    slow: document.querySelectorAll('.parallax-slow'),
    medium: document.querySelectorAll('.parallax-medium'),
    fast: document.querySelectorAll('.parallax-fast')
  };

  let ticking = false;

  function updateParallax() {
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;

    // Update parallax elements with different speeds
    parallaxElements.slow.forEach(el => {
      const speed = 0.2;
      const yPos = -(scrollY * speed);
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });

    parallaxElements.medium.forEach(el => {
      const speed = 0.4;
      const yPos = -(scrollY * speed);
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });

    parallaxElements.fast.forEach(el => {
      const speed = 0.6;
      const yPos = -(scrollY * speed);
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });

    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  // Throttle scroll events
  window.addEventListener('scroll', requestTick, { passive: true });

  // Initial update
  updateParallax();
});
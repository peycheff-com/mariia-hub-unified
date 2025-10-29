// Booksy Data Extractor - Content Script
// Extracts appointment and client data from Booksy UI

(function() {
  'use strict';

  let extractButton = null;
  let isExtracting = false;

  // Helper function to safely create download icon SVG
  function createDownloadIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    svg.appendChild(path1);

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '7 10 12 15 17 10');
    svg.appendChild(polyline);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '12');
    line.setAttribute('x2', '12');
    line.setAttribute('y1', '15');
    line.setAttribute('y2', '3');
    svg.appendChild(line);

    return svg;
  }

  // Helper function to create download icon with arrow
  function createDownloadIconWithArrow() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '20 6 9 17 9');
    svg.appendChild(polyline);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M20 16l-4 4 4-4');
    svg.appendChild(path);

    return svg;
  }

  // Helper function to create error icon
  function createErrorIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    svg.appendChild(circle);

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '12');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y1', '8');
    line1.setAttribute('y2', '12');
    svg.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '12');
    line2.setAttribute('x2', '12');
    line2.setAttribute('y1', '16');
    line2.setAttribute('y2', '12');
    svg.appendChild(line2);

    return svg;
  }

  // Helper function to safely update button content
  function updateButtonContent(text, icon = null) {
    // Clear existing content
    while (extractButton.firstChild) {
      extractButton.removeChild(extractButton.firstChild);
    }

    // Add icon if provided or create default
    const svg = icon || createDownloadIcon();
    extractButton.appendChild(svg);

    // Add text
    const textNode = document.createTextNode(` ${text}`);
    extractButton.appendChild(textNode);
  }

  // Function to extract appointments from current page
  function extractAppointments() {
    const appointments = [];

    // Different selector patterns for Booksy pages
    const appointmentSelectors = [
      '.appointment-item',
      '.booking-item',
      '.appointment-row',
      '[data-test*="appointment"]',
      '.calendar-event',
      '.day-view-item',
      '.timeline-item'
    ];

    let items = [];
    for (const selector of appointmentSelectors) {
      items = document.querySelectorAll(selector);
      if (items.length > 0) {
        console.log(`Found ${items.length} items with selector: ${selector}`);
        break;
      }
    }

    // If no structured items found, try to extract from tables
    if (items.length === 0) {
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const rows = table.querySelectorAll('tbody tr');
        if (rows.length > 1) { // More than header row
          items = rows;
          console.log(`Found ${rows.length} rows in table`);
          break;
        }
      }
    }

    // Extract data from found elements
    items.forEach((item, index) => {
      try {
        const appointment = extractAppointmentData(item);
        if (appointment) {
          appointments.push(appointment);
        }
      } catch (error) {
        console.error(`Error extracting item ${index}:`, error);
      }
    });

    return appointments;
  }

  // Extract data from a single appointment element
  function extractAppointmentData(element) {
    const data = {};

    // Helper to get text content
    function getText(selector) {
      const el = element.querySelector(selector);
      return el ? el.textContent.trim() : '';
    }

    function getAttribute(attr) {
      return element.getAttribute(attr) || '';
    }

    // Try multiple selector patterns for different data points
    const selectors = {
      clientName: [
        '.client-name',
        '.customer-name',
        '.user-name',
        '[data-field*="client"]',
        'td:nth-child(2)', // Table column assumption
        'div[class*="client"]',
        'span[class*="customer"]'
      ],
      service: [
        '.service-name',
        '.treatment-name',
        '.appointment-service',
        '[data-field*="service"]',
        'td:nth-child(3)',
        'div[class*="service"]'
      ],
      date: [
        '.appointment-date',
        '.booking-date',
        '[data-field*="date"]',
        'td:nth-child(1)',
        'time[data-date]',
        'div[class*="date"]'
      ],
      time: [
        '.appointment-time',
        '.booking-time',
        '[data-field*="time"]',
        'td:nth-child(4)',
        'div[class*="time"]'
      ],
      duration: [
        '.duration',
        '.service-duration',
        '[data-field*="duration"]',
        'td:nth-child(5)'
      ],
      price: [
        '.price',
        '.appointment-price',
        '.service-price',
        '[data-field*="price"]',
        'td:nth-child(6)'
      ],
      status: [
        '.status',
        '.appointment-status',
        '[data-field*="status"]',
        'td:nth-child(7)',
        '.badge',
        '.tag'
      ],
      email: [
        '.client-email',
        '.customer-email',
        '[data-field*="email"]'
      ],
      phone: [
        '.client-phone',
        '.customer-phone',
        '[data-field*="phone"]'
      ],
      notes: [
        '.notes',
        '.appointment-notes',
        '[data-field*="notes"]',
        'td:nth-last-child'
      ]
    };

    // Extract each field with fallback selectors
    for (const [field, fieldSelectors] of Object.entries(selectors)) {
      for (const selector of fieldSelectors) {
        const value = getText(selector);
        if (value) {
          data[field] = value;
          break;
        }
      }
    }

    // Try to get data from attributes
    if (!data.clientName) {
      data.clientName = getAttribute('data-client') || getAttribute('data-name');
    }
    if (!data.service) {
      data.service = getAttribute('data-service');
    }
    if (!data.date) {
      data.date = getAttribute('data-date');
    }
    if (!data.time) {
      data.time = getAttribute('data-time');
    }

    // Extract from text content using regex patterns
    const fullText = element.textContent || '';

    // Phone number pattern
    const phoneMatch = fullText.match(/(\+?\d{2,3}[-.\s]?\d{2,4}[-.\s]?\d{2,4})/);
    if (phoneMatch && !data.phone) {
      data.phone = phoneMatch[1];
    }

    // Email pattern
    const emailMatch = fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && !data.email) {
      data.email = emailMatch[1];
    }

    // Time pattern (24-hour or 12-hour)
    const timeMatch = fullText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/);
    if (timeMatch && !data.time) {
      data.time = timeMatch[1];
    }

    // Date pattern (various formats)
    const datePatterns = [
      /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/, // YYYY-MM-DD or YYYY/MM/DD
      /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/, // DD-MM-YYYY or DD/MM/YYYY
      /(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = fullText.match(pattern);
      if (match && !data.date) {
        data.date = match[1] || match[0];
        break;
      }
    }

    // Price pattern (including PLN)
    const priceMatch = fullText.match(/(PLN\s*)?(\d+(?:[.,]\d{2})?)/);
    if (priceMatch && !data.price) {
      data.price = priceMatch[2] + ' PLN';
    }

    // Duration pattern
    const durationMatch = fullText.match(/(\d+)\s*(?:min|minutes?|godz)/i);
    if (durationMatch && !data.duration) {
      data.duration = durationMatch[1] + ' min';
    }

    // Only return if we have meaningful data
    if (data.clientName || data.service || data.date) {
      return {
        ...data,
        extractedAt: new Date().toISOString(),
        pageUrl: window.location.href
      };
    }

    return null;
  }

  // Create and add extract button
  function createExtractButton() {
    if (document.getElementById('booksy-extractor-btn')) return;

    extractButton = document.createElement('button');
    extractButton.id = 'booksy-extractor-btn';
    // Create SVG element safely
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    svg.appendChild(path1);

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '7 10 12 15 17 10');
    svg.appendChild(polyline);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '12');
    line.setAttribute('x2', '12');
    line.setAttribute('y1', '15');
    line.setAttribute('y2', '3');
    svg.appendChild(line);

    // Use the safe update function
    updateButtonContent('Extract Appointments', svg);
    extractButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #6366f1;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;

    extractButton.onmouseover = () => {
      extractButton.style.background = '#7c3aed';
      extractButton.style.transform = 'translateY(-2px)';
    };

    extractButton.onmouseout = () => {
      extractButton.style.background = '#6366f1';
      extractButton.style.transform = 'translateY(0)';
    };

    extractButton.onclick = () => {
      if (!isExtracting) {
        performExtraction();
      }
    };

    document.body.appendChild(extractButton);
  }

  // Main extraction function
  async function performExtraction() {
    if (isExtracting) return;

    isExtracting = true;
    updateButtonContent('Extracting...');
    extractButton.disabled = true;

    try {
      // Wait for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Scroll to load more content
      const scrollHeight = document.documentElement.scrollHeight;
      window.scrollTo(0, scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract appointments
      const appointments = extractAppointments();

      if (appointments.length > 0) {
        // Store in Chrome storage
        chrome.storage.local.set({
          booksyAppointments: appointments,
          lastExtracted: new Date().toISOString()
        }, () => {
          console.log(`Extracted ${appointments.length} appointments`);

          // Update button with download icon
          const downloadIcon = createDownloadIconWithArrow();
          updateButtonContent(`Download CSV (${appointments.length})`, downloadIcon);
          extractButton.style.background = '#10b981';
          extractButton.disabled = false;
          isExtracting = false;

          // Auto-download
          downloadCSV(appointments);
        });
      } else {
        // No appointments found
        updateButtonContent('No Appointments', createErrorIcon());
        extractButton.style.background = '#ef4444';
        setTimeout(() => {
          updateButtonContent('Extract Appointments');
          extractButton.style.background = '#6366f1';
          extractButton.disabled = false;
          isExtracting = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      updateButtonContent('Error', createErrorIcon());
      extractButton.style.background = '#ef4444';
      setTimeout(() => {
        updateButtonContent('Extract Appointments');
        extractButton.style.background = '#6366f1';
        extractButton.disabled = false;
        isExtracting = false;
      }, 3000);
    }
  }

  // Convert appointments to CSV and download
  function downloadCSV(appointments) {
    const headers = [
      'Client Name',
      'Email',
      'Phone',
      'Service',
      'Date',
      'Time',
      'Duration',
      'Price',
      'Status',
      'Notes',
      'Extracted At'
    ];

    const csvContent = [
      headers.join(','),
      ...appointments.map(apt => [
        `"${(apt.clientName || '').replace(/"/g, '""')}"`,
        `"${(apt.email || '').replace(/"/g, '""')}"`,
        `"${(apt.phone || '').replace(/"/g, '""')}"`,
        `"${(apt.service || '').replace(/"/g, '""')}"`,
        `"${(apt.date || '').replace(/"/g, '""')}"`,
        `"${(apt.time || '').replace(/"/g, '""')}"`,
        `"${(apt.duration || '').replace(/"/g, '""')}"`,
        `"${(apt.price || '').replace(/"/g, '""')}"`,
        `"${(apt.status || '').replace(/"/g, '""')}"`,
        `"${(apt.notes || '').replace(/"/g, '""')}"`,
        `"${apt.extractedAt}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booksy-appointments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Initialize when page loads
  function initialize() {
    // Wait for page to fully load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
      return;
    }

    // Check if we're on a Booksy page
    if (!window.location.hostname.includes('booksy.com')) {
      return;
    }

    // Create extract button
    setTimeout(() => {
      createExtractButton();

      // Check if we have stored data
      chrome.storage.local.get(['booksyAppointments'], (result) => {
        if (result.booksyAppointments && result.booksyAppointments.length > 0) {
          const daysSince = Math.floor((new Date() - new Date(result.lastExtracted)) / (1000 * 60 * 60 * 24));
          updateButtonContent(`Update (${result.booksyAppointments.length})`, createDownloadIconWithArrow());
        }
      });
    }, 2000);
  }

  // Auto-extract when navigating to appointment pages
  let lastUrl = '';
  setInterval(() => {
    if (window.location.href !== lastUrl && window.location.href.includes('booksy.com')) {
      lastUrl = window.location.href;
      setTimeout(performExtraction, 3000);
    }
  }, 5000);

  // Start
  initialize();
})();
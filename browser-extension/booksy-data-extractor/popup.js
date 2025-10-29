// Booksy Data Extractor - Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extract-current');
  const viewBtn = document.getElementById('view-extracted');
  const clearBtn = document.getElementById('clear-data');
  const statusDiv = document.getElementById('status');
  const countDiv = document.getElementById('count');
  const lastExtractDiv = document.getElementById('last-extract');

  // Load stored data
  function loadStoredData() {
    chrome.storage.local.get(['booksyAppointments', 'lastExtracted'], (result) => {
      if (result.booksyAppointments) {
        statusDiv.textContent = '✅ Data available';
        countDiv.textContent = `${result.booksyAppointments.length} appointments extracted`;
        countDiv.style.display = 'block';

        if (result.lastExtracted) {
          const lastDate = new Date(result.lastExtracted).toLocaleDateString();
          lastExtractDiv.textContent = `Last extracted: ${lastDate}`;
        }
      } else {
        statusDiv.textContent = '⏳ No data extracted yet';
        countDiv.style.display = 'none';
      }
    });
  }

  // Extract current tab
  extractBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Inject and execute extraction script
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }, () => {
          // Close popup after injection
          window.close();
        });
      }
    });
  });

  // View extracted data
  viewBtn.addEventListener('click', function() {
    chrome.storage.local.get(['booksyAppointments'], (result) => {
      if (result.booksyAppointments) {
        const csv = convertToCSV(result.booksyAppointments);
        downloadCSV(csv);
      }
    });
  });

  // Clear all data
  clearBtn.addEventListener('click', function() {
    chrome.storage.local.remove(['booksyAppointments', 'lastExtracted'], () => {
      statusDiv.textContent = '✅ Data cleared';
      countDiv.style.display = 'none';
      lastExtractDiv.textContent = '';
    });
  });

  // Convert to CSV
  function convertToCSV(data) {
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

    const rows = data.map(item => [
      item.clientName || '',
      item.email || '',
      item.phone || '',
      item.service || '',
      item.date || '',
      item.time || '',
      item.duration || '',
      item.price || '',
      item.status || '',
      item.notes || '',
      item.extractedAt || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
    ].join('\n');
  }

  // Download CSV
  function downloadCSV(csv) {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booksy-extract-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Initial load
  loadStoredData();
});
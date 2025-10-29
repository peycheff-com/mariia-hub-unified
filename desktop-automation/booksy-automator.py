"""
Booksy Data Automator
Desktop automation tool for extracting data from Booksy when manual export isn't feasible

REQUIREMENTS:
- Python 3.8+
- Chrome browser (for automated extraction)
- Selenium WebDriver
- Windows/Mac/Linux

USAGE:
1. Install dependencies: pip install selenium beautifulsoup4 pandas
2. Run: python booksy_automator.py
3. Booksy login page will open automatically
4. Script will navigate and extract data
"""

import time
import csv
import json
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import pandas as pd

class BooksyDataExtractor:
    def __init__(self, headless=False):
        self.driver = None
        self.headless = headless
        self.extracted_data = []

    def setup_driver(self):
        """Initialize Chrome WebDriver with stealth options"""
        chrome_options = Options()

        # Stealth options to avoid detection
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        if self.headless:
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')

        # User agent to appear more human
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    def login(self, email, password):
        """Automated login to Booksy"""
        try:
            print("Opening Booksy login page...")
            self.driver.get("https://biz.booksy.com/login")

            # Wait for login form
            time.sleep(3)

            # Find and fill email
            email_field = self.driver.find_element(By.ID, "email")
            email_field.clear()
            email_field.send_keys(email)

            # Find and fill password
            password_field = self.driver.find_element(By.ID, "password")
            password_field.clear()
            password_field.send_keys(password)

            # Click login button
            login_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_btn.click()

            print("Login successful!")
            time.sleep(3)
            return True

        except Exception as e:
            print(f"Login failed: {str(e)}")
            return False

    def navigate_to_appointments(self):
        """Navigate to appointments/calendar page"""
        try:
            print("Navigating to appointments...")
            self.driver.get("https://biz.booksy.com/calendar")
            time.sleep(3)
            return True
        except Exception as e:
            print(f"Navigation failed: {str(e)}")
            return False

    def extract_appointments_month(self, year=None, month=None):
        """Extract all appointments for a given month"""
        appointments = []

        # Navigate to specific month if specified
        if year and month:
            url = f"https://biz.booksy.com/calendar?year={year}&month={month}"
            self.driver.get(url)
            time.sleep(3)

        # Scroll to load all appointments
        print("Loading appointments...")
        for i in range(5):
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)

        # Get page source
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')

        # Find appointment elements
        appointment_elements = soup.find_all(['div', 'tr', 'li'], class_=lambda x: any(
            cls in str(x.get('class', '')).lower() for cls in
            ['appointment', 'booking', 'event', 'calendar-item']
        ))

        for element in appointment_elements:
            try:
                appointment = self.parse_appointment_element(element)
                if appointment:
                    appointments.append(appointment)
                    print(f"Extracted: {appointment['client_name']} - {appointment['service']}")
            except Exception as e:
                print(f"Error parsing appointment: {str(e)}")
                continue

        return appointments

    def parse_appointment_element(self, element):
        """Parse single appointment element"""
        try:
            data = {}

            # Try multiple selector patterns
            selectors = {
                'client_name': [
                    '.client-name', '.customer-name', '.user-name',
                    '[data-field*="client"]', 'td:nth-child(2)'
                ],
                'service': [
                    '.service-name', '.treatment-name', '.appointment-service',
                    '[data-field*="service"]', 'td:nth-child(3)'
                ],
                'date': [
                    '.appointment-date', '.booking-date', '[data-field*="date"]',
                    'td:nth-child(1)'
                ],
                'time': [
                    '.appointment-time', '.booking-time', '[data-field*="time"]',
                    'td:nth-child(4)'
                ],
                'price': [
                    '.price', '.appointment-price', '.service-price',
                    '[data-field*="price"]', 'td:nth-child(6)'
                ],
                'email': [
                    '.client-email', '.customer-email', '[data-field*="email"]'
                ],
                'phone': [
                    '.client-phone', '.customer-phone', '[data-field*="phone"]'
                ]
            }

            for field, field_selectors in selectors.items():
                value = None
                for selector in field_selectors:
                    found = element.select_one(selector)
                    if found:
                        value = found.text.strip()
                        data[field] = value
                        break

                # Try attributes if text not found
                if not value:
                    value = element.get(f'data-{field}', '')
                    if value:
                        data[field] = value
                        break

            # Only return if we have meaningful data
            if data.get('client_name') and data.get('service'):
                data['extracted_at'] = datetime.now().isoformat()
                return data

            return None

        except Exception as e:
            print(f"Parse error: {str(e)}")
            return None

    def extract_multiple_months(self, months=6):
        """Extract data for multiple months"""
        all_appointments = []

        for i in range(months):
            # Calculate target month
            target_date = datetime.now() - timedelta(days=30*i)
            year = target_date.year
            month = target_date.month

            print(f"\n{'='*50}")
            print(f"Extracting month {month+1}/{year}...")

            appointments = self.extract_appointments_month(year, month)
            if appointments:
                all_appointments.extend(appointments)
                print(f"Found {len(appointments)} appointments")

            # Clear cookies occasionally to avoid session timeouts
            if i % 3 == 0:
                print("Clearing cookies...")
                self.driver.delete_all_cookies()
                self.login(self.email, self.password)

        return all_appointments

    def save_to_csv(self, appointments, filename=None):
        """Save extracted data to CSV"""
        if not filename:
            filename = f"booksy_extract_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        # Create DataFrame
        df = pd.DataFrame(appointments)

        # Reorder columns
        columns_order = [
            'client_name', 'email', 'phone', 'service', 'date', 'time',
            'duration', 'price', 'status', 'notes', 'extracted_at'
        ]
        df = df.reindex(columns=columns_order, fill_value='')

        # Save to CSV
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\nSaved {len(appointments)} appointments to {filename}")
        return filename

    def run_extraction(self, email, password, months=6):
        """Main extraction method"""
        try:
            print("="*60)
            print("BOOKSY DATA EXTRACTOR")
            print("="*60)

            # Setup driver
            self.setup_driver()

            # Login
            if not self.login(email, password):
                print("❌ Login failed. Check credentials.")
                return []

            # Store credentials for re-login
            self.email = email
            self.password = password

            # Extract data
            appointments = self.extract_multiple_months(months)

            # Save results
            if appointments:
                filename = self.save_to_csv(appointments)

                # Create summary
                self.create_summary_report(appointments, filename)

                print(f"\n{'='*60}")
                print(f"✅ SUCCESS: Extracted {len(appointments)} total appointments")
                print(f"💾 Saved to: {filename}")

            return appointments

        except KeyboardInterrupt:
            print("\n\n⚠️ Extraction cancelled by user")
            return []
        except Exception as e:
            print(f"\n❌ Fatal error: {str(e)}")
            return []
        finally:
            if self.driver:
                print("\nClosing browser...")
                self.driver.quit()

    def create_summary_report(self, appointments, filename):
        """Create summary report"""
        summary = f"""
BOOKSY DATA EXTRACTION SUMMARY
=============================
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Total Appointments: {len(appointments)}
File: {filename}

Breakdown by Service:
"""

        # Count by service
        service_counts = {}
        for apt in appointments:
            service = apt.get('service', 'Unknown')
            service_counts[service] = service_counts.get(service, 0) + 1

        for service, count in sorted(service_counts.items(), key=lambda x: x[1], reverse=True):
            summary += f"  {service}: {count}\n"

        summary += f"""
Tips for Import:
1. Open the CSV in Excel or Google Sheets
2. Review data for accuracy
3. Import using our platform's CSV import tool
4. Schedule staff training
5. Test with a few appointments first

⚠️ LEGAL WARNING:
This tool extracts data you own from your Booksy account.
Use responsibly and in accordance with Booksy's Terms of Service.
"""

        # Save summary
        with open('extraction_summary.txt', 'w', encoding='utf-8') as f:
            f.write(summary)


def main():
    """Main execution"""
    print("\n" + "="*60)
    print("BOOKSY DATA EXTRACTOR")
    print("="*60)
    print("\nThis tool helps extract appointment data from Booksy.")
    print("⚠️ Use responsibly and in compliance with Booksy's Terms of Service.")
    print("\n" + "="*60)

    # Get credentials
    import getpass
    email = input("Enter Booksy email: ").strip()
    password = getpass.getpass("Enter Booksy password: ")

    # Get extraction parameters
    print("\nExtraction Options:")
    print("1. Extract current month only (faster)")
    print("2. Extract last 6 months (default)")
    print("3. Extract last 12 months")
    print("4. Custom number of months")

    option = input("\nSelect option (1-4) [default: 2]: ").strip()

    months_map = {'1': 1, '2': 6, '3': 12}
    if option in months_map:
        months = months_map[option]
    elif option == '4':
        try:
            months = int(input("Enter number of months to extract: "))
        except:
            months = 6
    else:
        months = 6

    # Create extractor and run
    extractor = BooksyDataExtractor(headless=False)

    print(f"\n{'='*60}")
    print(f"Starting extraction for {months} month(s)...")
    print(f"This will take approximately {months * 2} minutes")
    print("="*60)

    # Run extraction
    appointments = extractor.run_extraction(email, password, months)

    print(f"\n{'='*60}")
    print("Extraction complete!")
    print("="*60)


if __name__ == "__main__":
    main()
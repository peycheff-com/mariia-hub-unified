# Booksy Migration Guide

## 📋 Overview

This guide provides step-by-step instructions for migrating your business and client data from Booksy to your new booking platform. Since Booksy doesn't provide a public API or export functionality, we've developed a comprehensive CSV-based migration solution.

## 🎯 Before You Begin

### What You'll Need
- ✅ Admin access to your Booksy business account
- ✅ Your new platform admin access
- ✅ Basic spreadsheet software (Excel, Google Sheets)
- ✅ About 2-4 hours for initial data entry

### Data Priority Order
1. **High-value clients** (most recent and loyal customers)
2. **Upcoming appointments** (next 30-60 days)
3. **Service catalog** (full price list and descriptions)
4. **Staff schedules** (availability and specializations)
5. **Historical data** (past appointments for analytics)

## 📊 Step-by-Step Migration

### Step 1: Prepare Your Data Template

1. Download the import template from your admin panel:
   - Go to Admin → Data Operations → Import/Export
   - Click "Download Template"
   - Save as `booking-import-template.csv`

2. Open in Excel or Google Sheets

### Step 2: Extract Data from Booksy

#### Method A: Manual Data Entry (Recommended for < 200 appointments)
1. **Open Booksy Business Dashboard** in your browser
2. **Go to Appointments** section
3. **For each appointment:**
   - Copy client name, email, phone
   - Copy service name
   - Copy date and time
   - Note any special requests
4. **Paste into your spreadsheet**
5. **Save as CSV** when complete

#### Method B: Copy/Paste Export (Faster for large datasets)
1. **Display 100 appointments per page** in Booksy
2. **Select All** (Ctrl+A) and Copy (Ctrl+C)
3. **Paste into Excel**
4. **Use Text to Columns** feature (Data > Text to Columns)
   - Delimiter: Comma
   - Format headers properly
5. **Clean up data** (remove extra columns)

#### Method C: Browser Developer Tools (Technical)
```javascript
// Paste this in Booksy's console (F12)
const appointments = [];
document.querySelectorAll('.appointment-item').forEach(item => {
  appointments.push({
    name: item.querySelector('.client-name')?.textContent,
    service: item.querySelector('.service-name')?.textContent,
    date: item.querySelector('.appointment-date')?.textContent,
    time: item.querySelector('.appointment-time')?.textContent,
    email: item.querySelector('.client-email')?.textContent,
    phone: item.querySelector('.client-phone')?.textContent
  });
});
console.table(appointments);
copy(JSON.stringify(appointments));
```

### Step 3: Clean and Format Your Data

1. **Required Fields:**
   - `Client Name` ✅
   - `Service Name` ✅
   - `Date (YYYY-MM-DD)` ✅
   - `Time (HH:MM)` ✅

2. **Optional Fields:**
   - `Client Email`
   - `Client Phone`
   - `Duration (minutes)`
   - `Price (PLN)`
   - `Status` (confirmed, cancelled, completed)
   - `Notes`

3. **Common Issues and Fixes:**

| Issue | Fix |
|--------|------|
| Date format wrong | Use YYYY-MM-DD (e.g., 2024-01-15) |
| Time with AM/PM | Convert to 24-hour format (e.g., 2:30 PM = 14:30) |
| Names with commas | Enclose in quotes (e.g., "Doe, John") |
| Polish characters | Save CSV as UTF-8 |
| Multiple services | Create separate rows for each service |

### Step 4: Import Your Data

1. **Go to Admin → Data Operations → Import/Export**
2. **Select your CSV file**
3. **Run "Preview Import" first**
   - Check for errors
   - Validate data
   - Fix any issues
4. **Click "Import Bookings"**
   - Monitor progress
   - Address any errors

### Step 5: Verify Import

1. **Check recent bookings** in your calendar
2. **Verify client information** in client list
3. **Confirm service prices** match
4. **Test booking process** with sample data

## 📅 Migration Timeline

### Week 1: Preparation
- [ ] Download template
- [ ] Train staff on data extraction
- [ ] Schedule dedicated migration time
- [ ] Communicate with staff

### Week 2: Data Extraction
- [ ] Export upcoming appointments (Days 1-15)
- [ ] Extract high-value client list
- [ ] Document service catalog
- [ ] Clean and validate data

### Week 3: Import & Verification
- [ ] Import appointments
- [ ] Verify all data
- [ ] Run test bookings
- [ ] Fix any issues

### Week 4: Go Live
- [ ] Switch all new bookings to your platform
- [ ] Update website booking buttons
- [ ] Train staff on new system
- [ ] Notify clients of change

## 🎓 Client Communication Templates

### Email Template 1: Announcement
```
Subject: Important Update: New Booking System!

Dear [Client Name],

We're excited to announce that we're upgrading to a new,
more convenient booking system!

Starting [Date], all appointments will be managed through:
- Our website: [Your Website URL]
- Phone: [Your Phone Number]
- Our new booking portal: [Portal URL if applicable]

Benefits for you:
- ✅ Easier online booking 24/7
- ✅ Automated appointment reminders
- ✅ Loyalty rewards program
- ✅ Direct communication with us

Your upcoming appointments have been transferred and remain as scheduled.
No action needed from you.

We can't wait to serve you better!

Best regards,
[Your Name]
[Your Business]
```

### SMS Template 2: Quick Reminder
```
Hi [Client Name]! We're moving to a new booking system.
All future bookings at: [Your Website].
Your upcoming appointments are already saved! Questions? Call us: [Phone].
```

### In-Store Signage Template
```
📢 NOTICE
We're upgrading our booking system!
🗓️ Starting [Date]: Book at [Website URL]
📱 Or call: [Phone Number]
✨ New features: Online booking 24/7, reminders, rewards!
Thank you for your understanding! ❤️
```

## 🔧 Technical Implementation Details

### Our Import Service Features

**Location**: `src/services/dataImportExport.service.ts`

#### Supported CSV Formats
- Standard CSV with comma delimiter
- Automatic delimiter detection
- UTF-8 encoding support
- Field mapping for Polish headers

#### Validation Rules
- Required field checking
- Email format validation
- Phone number validation
- Date format detection
- Duplicate detection

#### Import Options
- **Dry run**: Preview imports without saving
- **Skip duplicates**: Avoid double bookings
- **Update existing**: Modify existing bookings
- **Bulk processing**: Handle large files efficiently

#### Error Handling
- Row-by-row error reporting
- Validation warnings
- Detailed error messages
- Rollback capability

## ⚡ Pro Tips

### For Faster Migration

1. **Use two screens**:
   - Booksy on left screen for data
   - Spreadsheet on right for entry

2. **Keyboard shortcuts**:
   - Tab between fields
   - Ctrl+C/V for copy/paste
   - Ctrl+S to save frequently

3. **Batch by date ranges**:
   - Week 1: Import next 14 days
   - Week 2: Following 14 days
   - Continue in batches

4. **Use the preview feature**:
   - Catch errors before full import
   - Validate mapping
   - Save time on corrections

### Data Quality Checklist

- [ ] No duplicate bookings
- [ ] All emails valid
- [ ] Phone numbers have 9 digits
- [ ] Dates in correct format
- [ ] Service names match exactly
- [ ] Special characters preserved
- [ ] Polish diacritics (ą, ę, ć, etc.) display correctly

## 📞 Support

### If You Need Help

1. **Technical Support**:
   - Email: support@yourdomain.com
   - Response time: < 24 hours
   - Include: Screenshots of errors

2. **Migration Assistance**:
   - We offer paid migration service
   - Includes data extraction and import
   - Contact: migration@yourdomain.com

3. **Training Resources**:
   - Video tutorials available
   - Staff training sessions
   - Quick reference guide

## 📊 Success Metrics

Track your migration success:

| Metric | Target | Actual |
|---------|--------|--------|
| Appointments migrated | 100% | |
| Client data accuracy | 95% | |
| Error rate | < 2% | |
| Staff adoption | 100% | |
| System downtime | < 4 hours | |

## 🚨 Common Pitfalls to Avoid

1. **Don't delete Booksy immediately**
   - Keep as backup for 30 days
   - Verify all imports first
   - Check against reports

2. **Don't import all at once**
   - Use smaller batches (100-200 records)
   - Easier to spot errors
   - Faster to fix issues

3. **Don't forget special cases**
   - Recurring appointments
   - Package deals
   - Prepaid sessions
   - Staff-specific bookings

4. **Don't skip communication**
   - Tell clients what's happening
   - Provide clear instructions
   - Offer support for questions

## ✅ Migration Complete Checklist

- [ ] All appointments imported
- [ ] Client database updated
- [ ] Service catalog transferred
- [ ] Staff trained on new system
- [ ] Clients notified
- [ ] Booksy subscription cancelled
- [ ] Website updated with new booking links
- [ ] Test bookings successful
- [ ] Reports match expectations

## 🎉 Next Steps

1. **Cancel Booksy Subscription**
   - Contact Booksy support
   - Provide required notice period
   - Confirm data deletion request

2. **Update All Marketing Materials**
   - Website "Book Now" buttons
   - Social media links
   - Email signatures
   - Business cards

3. **Leverage New Features**
   - Setup automated reminders
   - Configure waitlist system
   - Enable group bookings
   - Setup analytics reporting

4. **Monitor Performance**
   - Check booking conversion rates
   - Monitor client satisfaction
   - Track revenue changes
   - Adjust as needed

---

**Remember**: This is a one-time migration effort. Once complete, you'll have full control over your booking data, advanced features, and no dependency on Booksy's limitations.

For questions or assistance, contact our support team.
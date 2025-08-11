const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,          // 465 if you set secure: true
  secure: true,      // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Optional: verify transporter at startup (logs only)
transporter.verify()
  .then(() => console.log('[mailer] Transporter verified and ready'))
  .catch(err => console.warn('[mailer] Transporter verify failed:', err?.message || err));

// Optional: route logger for quick debugging
router.use((req, _res, next) => {
  console.log('[email routes]', req.method, req.path);
  next();
});

// Utilities
const formatArray = (arr) => Array.isArray(arr) ? arr.filter(Boolean).join(', ') : '';
const safe = (val) => (val === 0 ? '0' : (val || '[Missing]'));

// ✅ 1. Onboarding Submission Route
router.post('/send-form', async (req, res) => {
  const formData = req.body;

  const mailOptions = {
    // many providers require the "from" to be your authenticated user
    from: `"${safe(formData.firstName)} ${safe(formData.lastName)}" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    replyTo: formData.email,
    subject: `New ${safe(formData.selectedPlan)} Plan Submission`,
    html: `
      <h3>New Onboarding Submission</h3>
      <ul>
        <li><strong>First Name:</strong> ${safe(formData.firstName)}</li>
        <li><strong>Last Name:</strong> ${safe(formData.lastName)}</li>
        <li><strong>Email:</strong> ${safe(formData.email)}</li>
        <li><strong>Phone:</strong> ${safe(formData.phone)}</li>
        <li><strong>License Number:</strong> ${safe(formData.licenseNumber)}</li>
        <li><strong>MLS ID:</strong> ${safe(formData.mlsId)}</li>
        <li><strong>Broker Name:</strong> ${safe(formData.brokerName)}</li>
        <li><strong>Brokerage Name:</strong> ${safe(formData.brokerageName)}</li>
        <li><strong>Office Email:</strong> ${safe(formData.officeEmail)}</li>
        <li><strong>Office Phone:</strong> ${safe(formData.officePhone)}</li>
        <li><strong>Office Address:</strong> ${safe(formData.officeAddress)}</li>
        <li><strong>City:</strong> ${safe(formData.city)}</li>
        <li><strong>State:</strong> ${safe(formData.state)}</li>
        <li><strong>Main Zip Code:</strong> ${safe(formData.zipcode)}</li>
        <li><strong>Zip Codes (Service Area):</strong> ${formatArray(formData.zipCodes)}</li>
        <li><strong>Counties (if Brokerage):</strong> ${formatArray(formData.counties)}</li>
        <li><strong>Radius:</strong> ${safe(formData.radius)}</li>
        <li><strong>How Did You Hear About Us:</strong> ${safe(formData.howDidYouHear)}</li>
        <li><strong>Account Executive:</strong> ${safe(formData.accountExec)}</li>
        <li><strong>Selected Plan:</strong> ${safe(formData.selectedPlan)}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Application sent successfully' });
  } catch (err) {
    console.error('Error sending onboarding email:', err);
    res.status(500).json({ success: false, error: 'Application sending failed' });
  }
});

// ✅ 2. Home Page Contact Form Route
router.post('/send-home-form', async (req, res) => {
  const { name, email, phone, message, consent } = req.body;

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: "New Message from Home Page Contact Form",
    html: `
      <h3>New Home Page Contact Submission</h3>
      <ul>
        <li><strong>Name:</strong> ${name || '[Missing]'}</li>
        <li><strong>Email:</strong> ${email || '[Missing]'}</li>
        <li><strong>Phone:</strong> ${phone || '[Not Provided]'}</li>
        <li><strong>Consent Given:</strong> ${consent ? 'Yes' : 'No'}</li>
        <li><strong>Message:</strong><br/>${message || '[No Message]'}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending home form email:', err);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// ✅ 3. Contact Us Page Form Route
router.post('/send-contact-form', async (req, res) => {
  const { name, email, phone, message, consent } = req.body;

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: "New Message from Contact Us Page",
    html: `
      <h3>New Contact Page Submission</h3>
      <ul>
        <li><strong>Name:</strong> ${name || '[Missing]'}</li>
        <li><strong>Email:</strong> ${email || '[Missing]'}</li>
        <li><strong>Phone:</strong> ${phone || '[Not Provided]'}</li>
        <li><strong>Consent Given:</strong> ${consent ? 'Yes' : 'No'}</li>
        <li><strong>Message:</strong><br/>${message || '[No Message]'}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error("Error sending contact page email:", err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ✅ 4. CRM Form Route (connects your CRM form to email)
router.post('/send-crm-form', async (req, res) => {
  const {
    // personal/org
    fullName, email, phone, company, address, website, state, city, zipcode, timezone,
    // CRM prefs
    contactMethod, crmTool, existingCRMName,
    notificationPreference, notificationEmail, notificationPhone,
    referralSource, referralSalesRep,
    selectedServices = [], otherService,
    // plan metadata (from frontend)
    plan, planTitle, planPrice,
  } = req.body;

  // Normalize services (handles single value vs array)
  const servicesList = Array.isArray(selectedServices)
    ? selectedServices.filter(Boolean)
    : (selectedServices ? [selectedServices] : []);
  const servicesHtml = servicesList.length ? servicesList.join(', ') : '[None Selected]';
  const otherText = otherService ? ` (Other: ${otherService})` : '';

  // Normalize/trim preference + values so they always show correctly
  const pref = (notificationPreference || '').toString().trim().toLowerCase();
  const includeEmail = pref === 'email' || pref === 'both';
  const includePhone = pref === 'sms' || pref === 'both';
  const notifEmail = (notificationEmail || '').toString().trim();
  const notifPhone = (notificationPhone || '').toString().trim();

  const mailOptions = {
    from: `"${safe(fullName)}" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: `New CRM Form Submission — ${safe(planTitle)}${planPrice ? ` (${planPrice})` : ''}`,
    html: `
      <h3>New CRM Form Submission</h3>
      <ul>
        <li><strong>Plan:</strong> ${safe(planTitle)} ${planPrice ? `(${planPrice})` : ''} | Key: ${safe(plan)}</li>
        <li><strong>Full Name:</strong> ${safe(fullName)}</li>
        <li><strong>Email:</strong> ${safe(email)}</li>
        <li><strong>Phone:</strong> ${safe(phone)}</li>
        <li><strong>Company:</strong> ${safe(company)}</li>
        <li><strong>Office Address:</strong> ${safe(address)}</li>
        <li><strong>Website:</strong> ${safe(website)}</li>
        <li><strong>State:</strong> ${safe(state)}</li>
        <li><strong>City:</strong> ${safe(city)}</li>
        <li><strong>Zipcode:</strong> ${safe(zipcode)}</li>
        <li><strong>Timezone:</strong> ${safe(timezone)}</li>
        <li><strong>Selected Services:</strong> ${servicesHtml}${otherText}</li>
        <li><strong>Preferred Lead Contact Method:</strong> ${safe(contactMethod)}</li>
        <li><strong>Existing CRM Tool?:</strong> ${safe(crmTool)}</li>
        ${crmTool === 'yes' ? `<li><strong>Existing CRM Name:</strong> ${safe(existingCRMName)}</li>` : ''}
        <li><strong>Notification Preference:</strong> ${safe(notificationPreference)}</li>
        ${includeEmail ? `<li><strong>Notification Email:</strong> ${safe(notifEmail)}</li>` : ''}
        ${includePhone ? `<li><strong>Notification Phone:</strong> ${safe(notifPhone)}</li>` : ''}
        <li><strong>Referral Source:</strong> ${safe(referralSource)}</li>
        <li><strong>Sales Rep:</strong> ${safe(referralSalesRep)}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'CRM Application sent Successfully' });
  } catch (err) {
    console.error('Error sending CRM form email:', err);
    res.status(500).json({ success: false, error: 'Failed to send CRM Application' });
  }
});

module.exports = router;

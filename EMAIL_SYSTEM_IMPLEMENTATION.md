# EMAIL SYSTEM IMPLEMENTATION DOCUMENTATION

## **📧 Overview**

The LyricArt Studio email system provides comprehensive email functionality for customer communications, order confirmations, and administrative notifications. Built with Nodemailer and integrated with Namecheap Private Email, the system supports HTML templates and automatic email triggers.

---

## **🏗️ Architecture**

### **Technology Stack**
- **Email Library**: Nodemailer v6.9.7
- **SMTP Provider**: Namecheap Private Email (smtp.privateemail.com)
- **Template Engine**: Custom HTML templates with CSS styling
- **Integration**: Express.js API endpoints
- **Security**: TLS encryption for email transmission

### **File Structure**
```
server-railway-production.js
├── Email Configuration
├── Email Templates
├── Email Helper Functions
└── Email API Endpoints
```

---

## **⚙️ Configuration**

### **Environment Variables**

Add these variables to your Railway environment:

```env
# Email Server Configuration
EMAIL_HOST=smtp.privateemail.com
EMAIL_PORT=587
EMAIL_USER=admin@lyricartstudio.shop
EMAIL_PASS=your_email_password_here

# Email Sender Configuration
EMAIL_FROM=admin@lyricartstudio.shop
EMAIL_FROM_NAME=LyricArt Studio

# Support Email Addresses
ADMIN_EMAIL=admin@lyricartstudio.shop
SUPPORT_EMAIL=info@lyricartstudio.shop

# Site Configuration
SITE_URL=https://lyricartstudio.shop
```

### **SMTP Configuration**

```javascript
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.privateemail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'admin@lyricartstudio.shop',
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};
```

---

## **📝 Email Templates**

### **1. Order Confirmation Template**

**Purpose**: Sent to customers after successful payment
**Trigger**: Payment completion
**Template**: `orderConfirmation`

**Features**:
- Professional HTML design with brand colors
- Order details (ID, date, items, total)
- Download links and account access
- Support contact information
- Responsive design for mobile devices

**Template Data**:
```javascript
{
    customerEmail: "customer@example.com",
    customerName: "John Doe",
    orderId: "PAY-123456789",
    items: [
        {
            title: "AC/DC Back in Black Guitar",
            format: "SVG",
            price: 3.00
        }
    ],
    total: 3.00
}
```

### **2. Contact Form Template**

**Purpose**: Notify admin of contact form submissions
**Trigger**: Contact form submission
**Template**: `contactForm`

**Features**:
- Form submission details
- Customer contact information
- Timestamp of submission
- Professional formatting

**Template Data**:
```javascript
{
    name: "John Doe",
    email: "john@example.com",
    subject: "General Inquiry",
    message: "I have a question about your designs..."
}
```

### **3. Welcome Email Template**

**Purpose**: Welcome new users to the platform
**Trigger**: User registration
**Template**: `welcomeEmail`

**Features**:
- Welcome message with user's name
- Platform features overview
- Quick action buttons
- Support information

**Template Data**:
```javascript
{
    email: "newuser@example.com",
    name: "New User"
}
```

### **4. Password Reset Template**

**Purpose**: Send password reset links to users
**Trigger**: Password reset request
**Template**: `passwordReset`

**Features**:
- Secure reset link
- Expiration warning (1 hour)
- Security notice
- Professional styling

**Template Data**:
```javascript
{
    email: "user@example.com",
    name: "User Name"
}
// resetLink: "https://lyricartstudio.shop/reset-password?token=abc123"
```

---

## **🔧 Email Helper Functions**

### **Core Email Function**

```javascript
const sendEmail = async (to, template, data = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailContent = emailTemplates[template](data);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"LyricArt Studio" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};
```

**Parameters**:
- `to`: Recipient email address
- `template`: Template name (orderConfirmation, contactForm, welcomeEmail, passwordReset)
- `data`: Template-specific data object

**Returns**:
- `{ success: true, messageId: "..." }` on success
- `{ success: false, error: "..." }` on failure

---

## **🌐 API Endpoints**

### **1. Contact Form Email**

**Endpoint**: `POST /api/email/contact`

**Purpose**: Send contact form submissions to admin

**Request Body**:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "General Inquiry",
    "message": "I have a question about your designs..."
}
```

**Response**:
```json
{
    "success": true,
    "message": "Message sent successfully"
}
```

### **2. Order Confirmation Email**

**Endpoint**: `POST /api/email/order-confirmation`

**Purpose**: Send order confirmation to customer

**Request Body**:
```json
{
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "orderId": "PAY-123456789",
    "items": [
        {
            "title": "AC/DC Back in Black Guitar",
            "format": "SVG",
            "price": 3.00
        }
    ],
    "total": 3.00
}
```

**Response**:
```json
{
    "success": true,
    "message": "Order confirmation sent"
}
```

### **3. Welcome Email**

**Endpoint**: `POST /api/email/welcome`

**Purpose**: Send welcome email to new users

**Request Body**:
```json
{
    "userEmail": "newuser@example.com",
    "userName": "New User"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Welcome email sent"
}
```

### **4. Password Reset Email**

**Endpoint**: `POST /api/email/password-reset`

**Purpose**: Send password reset link to user

**Request Body**:
```json
{
    "userEmail": "user@example.com",
    "userName": "User Name",
    "resetToken": "abc123def456"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Password reset email sent"
}
```

### **5. Test Email**

**Endpoint**: `POST /api/email/test`

**Purpose**: Test email functionality

**Request Body**:
```json
{
    "testEmail": "test@example.com"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Test email sent successfully"
}
```

---

## **🔄 Automatic Email Triggers**

### **1. Payment Success Trigger**

**Location**: `/payment/success` route
**Trigger**: Successful PayPal payment
**Email**: Order confirmation
**Data Source**: Session cart and user data

```javascript
// Automatic trigger in payment success route
if (req.session.userEmail) {
    const cart = req.session.cart || { items: [], total: 0 };
    try {
        await sendEmail(req.session.userEmail, 'orderConfirmation', {
            customerEmail: req.session.userEmail,
            customerName: req.session.userName || 'Valued Customer',
            orderId: captureResult.capture.id,
            items: cart.items,
            total: cart.total
        });
        console.log('✅ Order confirmation email sent');
    } catch (emailError) {
        console.error('❌ Failed to send order confirmation email:', emailError);
    }
}
```

### **2. PayPal Webhook Trigger**

**Location**: `/api/payment/paypal-webhook` route
**Trigger**: PayPal payment events
**Email**: Order confirmations for completed payments
**Data Source**: PayPal webhook payload

---

## **🎨 Template Styling**

### **Design System**

**Colors**:
- Primary: `#667eea` (Blue gradient)
- Secondary: `#764ba2` (Purple gradient)
- Success: `#4ade80` (Green)
- Error: `#f87171` (Red)
- Text: `#333333` (Dark gray)
- Background: `#f9f9f9` (Light gray)

**Typography**:
- Font Family: Arial, sans-serif
- Line Height: 1.6
- Responsive sizing

**Layout**:
- Max Width: 600px
- Centered design
- Mobile-responsive
- Professional spacing

### **CSS Classes**

```css
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
.button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
.footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
```

---

## **🔒 Security Features**

### **1. TLS Encryption**
- All emails transmitted over encrypted connection
- `rejectUnauthorized: false` for development flexibility

### **2. Input Validation**
- Required field validation on all endpoints
- Email format validation
- XSS protection through proper HTML encoding

### **3. Error Handling**
- Graceful failure handling
- Detailed error logging
- No sensitive data exposure in error messages

### **4. Rate Limiting**
- Consider implementing rate limiting for email endpoints
- Prevent spam and abuse

---

## **📊 Monitoring & Logging**

### **Success Logs**
```
✅ Email sent successfully: <messageId>
✅ Order confirmation email sent
✅ Contact form email sent to admin
```

### **Error Logs**
```
❌ Email sending failed: <error message>
❌ Failed to send order confirmation email: <error>
❌ Contact form email failed: <error>
```

### **Debug Information**
- Message IDs for tracking
- Template rendering status
- SMTP connection status
- Email delivery confirmation

---

## **🧪 Testing**

### **1. Test Email Endpoint**
```bash
curl -X POST https://lyricartstudio.shop/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "your-email@example.com"}'
```

### **2. Contact Form Test**
```bash
curl -X POST https://lyricartstudio.shop/api/email/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Message",
    "message": "This is a test message"
  }'
```

### **3. Order Confirmation Test**
```bash
curl -X POST https://lyricartstudio.shop/api/email/order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "customer@example.com",
    "customerName": "Test Customer",
    "orderId": "TEST-123",
    "items": [{"title": "Test Design", "format": "SVG", "price": 3.00}],
    "total": 3.00
  }'
```

---

## **🚀 Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variables configured in Railway
- [ ] Email credentials verified
- [ ] SMTP settings tested
- [ ] Templates reviewed and approved

### **Post-Deployment**
- [ ] Test email functionality
- [ ] Verify contact form emails
- [ ] Test order confirmation flow
- [ ] Monitor email delivery rates
- [ ] Check spam folder placement

### **Ongoing Maintenance**
- [ ] Monitor email delivery success rates
- [ ] Review and update templates as needed
- [ ] Check SMTP provider status
- [ ] Update email credentials if needed

---

## **📈 Performance Optimization**

### **1. Email Queue System**
Consider implementing a queue system for high-volume scenarios:
- Redis-based email queue
- Background job processing
- Retry mechanisms for failed emails

### **2. Template Caching**
- Cache rendered templates
- Reduce template processing time
- Improve response times

### **3. Batch Processing**
- Group multiple emails
- Reduce SMTP connections
- Improve efficiency

---

## **🔧 Troubleshooting**

### **Common Issues**

**1. Email Not Sending**
- Check SMTP credentials
- Verify environment variables
- Check network connectivity
- Review error logs

**2. Emails Going to Spam**
- Configure SPF records
- Set up DKIM authentication
- Use consistent sender addresses
- Monitor sender reputation

**3. Template Rendering Issues**
- Check HTML syntax
- Verify CSS compatibility
- Test with different email clients
- Validate template data

### **Debug Commands**

```javascript
// Test SMTP connection
const transporter = createEmailTransporter();
transporter.verify((error, success) => {
    if (error) {
        console.log('SMTP Error:', error);
    } else {
        console.log('SMTP Server is ready');
    }
});
```

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready ✅ 
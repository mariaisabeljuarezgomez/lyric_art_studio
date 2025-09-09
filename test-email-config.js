require('dotenv').config();
const nodemailer = require('nodemailer');

// Test email configuration
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.privateemail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'admin@lyricartstudio.shop',
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Test newsletter welcome email template
const newsletterWelcomeEmail = (subscriberData) => ({
    subject: `🎵 Welcome to Lyric Art Studio - Your 25% Discount Code Inside!`,
    html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to Lyric Art Studio</title>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #ffffff; background-color: #0a0a0a; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00FFFF 0%, #000000 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; color: #ffffff; }
                .discount-box { background: #000000; border: 2px solid #00FFFF; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
                .discount-code { font-size: 24px; font-weight: bold; color: #00FFFF; letter-spacing: 2px; }
                .button { display: inline-block; background: #00FFFF; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; transition: all 0.3s ease; }
                .button:hover { background: #00CCCC; transform: translateY(-2px); }
                .footer { text-align: center; margin-top: 30px; color: #cccccc; font-size: 14px; }
                .highlight { color: #00FFFF; font-weight: bold; }
                .feature-list { background: #000000; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #00FFFF; }
                .feature-list ul { margin: 0; padding-left: 20px; }
                .feature-list li { margin: 5px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎵 Welcome to Lyric Art Studio!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Where Lyrics Become Art</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Professional Design Services by Maria Juarez</p>
                </div>
                <div class="content">
                    <h2 style="color: #00FFFF; margin-top: 0;">Hello ${subscriberData.name || 'Music Lover'}! 👋</h2>
                    
                    <p style="color: #ffffff;">Welcome to the Lyric Art Studio family! We're thrilled to have you join our community of music enthusiasts and art lovers.</p>
                    
                    <div class="discount-box">
                        <h3 style="color: #00FFFF; margin-top: 0;">🎉 Your Welcome Gift: 25% OFF!</h3>
                        <p style="margin: 10px 0;">Use this exclusive discount code on your first purchase:</p>
                        <div class="discount-code">WELCOME100</div>
                        <p style="font-size: 14px; margin: 10px 0; opacity: 0.8;">*Valid on downloadable designs only. One-time use per customer.</p>
                    </div>

                    <h3 style="color: #00FFFF;">✨ What Makes Us Special</h3>
                    <div class="feature-list">
                        <ul>
                            <li><strong>Custom Design Requests:</strong> Any artist, any song - we create it for you!</li>
                            <li><strong>Lightning Fast Turnaround:</strong> Usually less than 24 hours, often within 2 hours!</li>
                            <li><strong>Personal Touch:</strong> Every design is manually crafted by Maria Juarez personally</li>
                            <li><strong>100% Satisfaction Guaranteed:</strong> We ensure your complete satisfaction</li>
                            <li><strong>Daily Catalog Updates:</strong> New designs added every day</li>
                            <li><strong>Bulk Order Discounts:</strong> Up to 50% off for larger orders</li>
                        </ul>
                    </div>

                    <h3 style="color: #00FFFF;">🎨 Our Premium Services</h3>
                    <p style="color: #ffffff;">Transform your favorite song lyrics into stunning visual art. Our designs are perfect for:</p>
                    <ul style="color: #ffffff;">
                        <li>T-shirts, hoodies, and apparel</li>
                        <li>Wall art and home decor</li>
                        <li>Vinyl decals and stickers</li>
                        <li>Laser engraving projects</li>
                        <li>Embroidery designs</li>
                        <li>And so much more!</li>
                    </ul>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.SITE_URL || 'https://lyricartstudio.shop'}/browse" class="button">🎵 Browse Our Gallery</a>
                        <a href="${process.env.SITE_URL || 'https://lyricartstudio.shop'}/custom-request" class="button">🎨 Custom Request</a>
                    </div>

                    <h3 style="color: #00FFFF;">📧 Stay Connected</h3>
                    <p style="color: #ffffff;">Don't miss out on our latest designs and exclusive offers! Make sure to:</p>
                    <ul style="color: #ffffff;">
                        <li>Turn on notifications in your Purchase Dashboard</li>
                        <li>Follow us for daily design updates</li>
                        <li>Contact us for bulk order inquiries</li>
                    </ul>

                    <div style="background: #000000; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #00FFFF;">
                        <h4 style="color: #00FFFF; margin-top: 0;">💡 Pro Tip</h4>
                        <p style="color: #ffffff; margin: 0;">For bulk orders and special pricing, send us a message with your requirements. We handle each case individually to give you the best possible deal!</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="mailto:${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}" class="button">📧 Contact Us</a>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2025 Lyric Art Studio. All rights reserved.</p>
                    <p>Professional Design Services by Maria Juarez</p>
                    <p>This email was sent to ${subscriberData.email}</p>
                    <p style="font-size: 12px; opacity: 0.7;">
                        You're receiving this email because you subscribed to our newsletter. 
                        <a href="#" style="color: #00FFFF;">Unsubscribe</a> if you no longer wish to receive these emails.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `
});

// Test email sending function
const sendEmail = async (to, template, data = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailContent = newsletterWelcomeEmail(data);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Lyric Art Studio" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        console.log('📧 Email configuration:');
        console.log('  Host:', process.env.EMAIL_HOST || 'smtp.privateemail.com');
        console.log('  Port:', process.env.EMAIL_PORT || 587);
        console.log('  User:', process.env.EMAIL_USER || 'admin@lyricartstudio.shop');
        console.log('  From:', mailOptions.from);
        console.log('  To:', to);

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Test the email configuration
async function testEmailConfig() {
    console.log('🧪 Testing email configuration...');
    
    // Test with a sample email (replace with your email for testing)
    const testEmail = 'test@example.com'; // Replace with your email
    const testData = {
        email: testEmail,
        name: 'Test User'
    };
    
    console.log('📧 Sending test newsletter welcome email to:', testEmail);
    const result = await sendEmail(testEmail, 'newsletterWelcomeEmail', testData);
    
    if (result.success) {
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
    } else {
        console.log('❌ Test email failed:');
        console.log('📧 Error:', result.error);
    }
}

// Run the test
testEmailConfig().catch(console.error); 
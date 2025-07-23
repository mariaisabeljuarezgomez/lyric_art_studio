// File Delivery Service for Lyric Art Studio
// Automatically sends purchased design files to customers

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const archiver = require('archiver');
const nodemailer = require('nodemailer');

class FileDeliveryService {
    constructor() {
        this.designsPath = path.join(__dirname, 'music_lyricss');
        this.tempPath = path.join(__dirname, 'temp');
    }

    // Get all available files for a design
    async getDesignFiles(designId) {
        try {
            const designFolder = path.join(this.designsPath, designId);
            const files = await fs.readdir(designFolder);
            
            // Filter for design files (SVG, PNG, PDF, EPS)
            const designFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.svg', '.png', '.pdf', '.eps'].includes(ext);
            });

            return designFiles.map(file => ({
                name: file,
                path: path.join(designFolder, file),
                size: fs.stat(path.join(designFolder, file)).then(stat => stat.size)
            }));
        } catch (error) {
            console.error(`❌ Error getting files for design ${designId}:`, error);
            throw new Error(`Design files not found for ${designId}`);
        }
    }

    // Create a ZIP file with all design formats
    async createDesignZip(designId, designName) {
        try {
            // Ensure temp directory exists
            await fs.mkdir(this.tempPath, { recursive: true });

            const zipFileName = `${designId}_${Date.now()}.zip`;
            const zipPath = path.join(this.tempPath, zipFileName);
            
            const output = fsSync.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    console.log(`📦 ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
                    resolve(zipPath);
                });

                archive.on('error', (err) => {
                    reject(err);
                });

                archive.pipe(output);

                // Add design files to ZIP
                const designFolder = path.join(this.designsPath, designId);
                archive.directory(designFolder, designName);

                archive.finalize();
            });
        } catch (error) {
            console.error(`❌ Error creating ZIP for design ${designId}:`, error);
            throw error;
        }
    }

    // Send design files via email
    async sendDesignFiles(customerEmail, customerName, orderData) {
        try {
            console.log(`📧 Sending design files to ${customerEmail} for order ${orderData.orderId}`);

            const emailTransporter = this.createEmailTransporter();
            
            // Create ZIP file for the order
            const zipPath = await this.createDesignZip(orderData.designId, orderData.designName);

            // Prepare email content
            const emailContent = this.createDeliveryEmail(orderData);

            // Send email with attachment
            const mailOptions = {
                from: process.env.EMAIL_FROM || `"Lyric Art Studio" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: `Your Design Files - Order #${orderData.orderId}`,
                html: emailContent.html,
                attachments: [{
                    filename: `${orderData.designName}_Files.zip`,
                    path: zipPath
                }]
            };

            const result = await emailTransporter.sendMail(mailOptions);
            
            // Clean up temporary ZIP file
            await fs.unlink(zipPath);
            
            console.log(`✅ Design files sent successfully to ${customerEmail}`);
            return result;

        } catch (error) {
            console.error(`❌ Error sending design files to ${customerEmail}:`, error);
            throw error;
        }
    }

    // Create email transporter
    createEmailTransporter() {
        return nodemailer.createTransporter({
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
    }

    // Create delivery email template
    createDeliveryEmail(orderData) {
        return {
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Your Design Files - Lyric Art Studio</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .design-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
                        .download-info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎵 Lyric Art Studio</h1>
                            <p>Your Design Files Are Ready!</p>
                        </div>
                        <div class="content">
                            <h2>Thank you for your purchase!</h2>
                            <p>Hi ${orderData.customerName || 'Valued Customer'},</p>
                            <p>Your design files are ready for download! We've attached all the formats you purchased in a ZIP file.</p>
                            
                            <div class="design-info">
                                <h3>Order Details:</h3>
                                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                                <p><strong>Design:</strong> ${orderData.designName}</p>
                                <p><strong>Formats Included:</strong> SVG, PNG, PDF, EPS</p>
                                <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>

                            <div class="download-info">
                                <h3>📁 Your Files Are Attached</h3>
                                <p>The ZIP file contains all formats of your design:</p>
                                <ul>
                                    <li><strong>SVG</strong> - Vector format for scaling</li>
                                    <li><strong>PNG</strong> - High-quality raster format</li>
                                    <li><strong>PDF</strong> - Print-ready format</li>
                                    <li><strong>EPS</strong> - Professional vector format</li>
                                </ul>
                            </div>

                            <h3>How to Use Your Files:</h3>
                            <ul>
                                <li><strong>Personal Use:</strong> Print, frame, or use in personal projects</li>
                                <li><strong>Digital Use:</strong> Use on websites, social media, or digital displays</li>
                                <li><strong>Printing:</strong> Use PDF or EPS for professional printing</li>
                                <li><strong>Scaling:</strong> Use SVG or EPS for any size without quality loss</li>
                            </ul>

                            <div style="text-align: center; margin: 30px 0;">
                                <p><strong>Your design files are attached to this email!</strong></p>
                                <p>Simply download the ZIP file and extract it to access all formats.</p>
                            </div>

                            <h3>Need Help?</h3>
                            <p>If you have any questions about using your files or need assistance, please don't hesitate to contact us.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="mailto:admin@lyricartstudio.shop" class="button">Contact Support</a>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>© 2025 Lyric Art Studio. All Rights Reserved.</p>
                            <p>Thank you for choosing Lyric Art Studio!</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
    }

    // Process order and send files
    async processOrder(orderData) {
        try {
            console.log(`🔄 Processing order ${orderData.orderId} for design ${orderData.designId}`);

            // Validate order data
            if (!orderData.designId || !orderData.customerEmail) {
                throw new Error('Missing required order data');
            }

            // Check if design files exist
            const designFolder = path.join(this.designsPath, orderData.designId);
            try {
                await fs.access(designFolder);
            } catch (error) {
                throw new Error(`Design folder not found: ${orderData.designId}`);
            }

            // Send files to customer
            const result = await this.sendDesignFiles(
                orderData.customerEmail,
                orderData.customerName,
                orderData
            );

            console.log(`✅ Order ${orderData.orderId} processed successfully`);
            return result;

        } catch (error) {
            console.error(`❌ Error processing order ${orderData.orderId}:`, error);
            throw error;
        }
    }
}

module.exports = FileDeliveryService; 
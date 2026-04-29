const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // Use Gmail as the service
        auth: {
            user: process.env.SMTP_USER || 'olfixandaman@gmail.com',
            pass: process.env.SMTP_PASS || '', // App password goes here
        },
    });
};

exports.sendAdminRequestEmail = async (requestData) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_USER || 'olfixandaman@gmail.com',
            to: 'olfixandaman@gmail.com',
            subject: `New Service Request: ${requestData.service_name} (${requestData.category_name})`,
            html: `
                <h2>New Service Request Received</h2>
                <p>A new request has been submitted for the "Others" category.</p>
                
                <h3>User Details:</h3>
                <ul>
                    <li><strong>Name:</strong> ${requestData.user_name || 'N/A'}</li>
                    <li><strong>Email:</strong> ${requestData.user_email || 'N/A'}</li>
                    <li><strong>Phone:</strong> ${requestData.user_phone || 'N/A'}</li>
                </ul>

                <h3>Service Details:</h3>
                <ul>
                    <li><strong>Category:</strong> ${requestData.category_name || 'N/A'}</li>
                    <li><strong>Subcategory:</strong> ${requestData.subcategory_name || 'N/A'}</li>
                    <li><strong>Service Name:</strong> ${requestData.service_name || 'N/A'}</li>
                    <li><strong>Description:</strong> ${requestData.description || 'N/A'}</li>
                    <li><strong>Preferred Date:</strong> ${requestData.preferred_date || 'N/A'}</li>
                    <li><strong>Preferred Time:</strong> ${requestData.preferred_time || 'N/A'}</li>
                </ul>

                <h3>Location:</h3>
                <ul>
                    <li><strong>Type:</strong> ${requestData.location_type || 'N/A'}</li>
                    <li><strong>Address:</strong> ${requestData.location_address || 'N/A'}</li>
                </ul>
                
                ${requestData.attachment_url ? `<p><strong>Attachment:</strong> <a href="${requestData.attachment_url}">View File</a></p>` : ''}
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // We don't want to break the application if email sending fails, just log it.
    }
};

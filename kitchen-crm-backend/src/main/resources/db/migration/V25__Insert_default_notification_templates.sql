-- Migration: Insert default notification templates
-- Purpose: Seed initial templates for quotation signature workflow
-- Author: HOCH Team
-- Date: 2025-01-15

-- Ensure required columns exist on notification_templates (handles legacy tables)
SET @tbl := 'notification_templates';

-- template_code
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'template_code');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN template_code VARCHAR(50) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- template_name
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'template_name');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN template_name VARCHAR(100) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- template_category
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'template_category');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN template_category VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- email_subject
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'email_subject');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN email_subject VARCHAR(200) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- email_body
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'email_body');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN email_body TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- email_template_id
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'email_template_id');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN email_template_id VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- whatsapp_template_name
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'whatsapp_template_name');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN whatsapp_template_name VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- whatsapp_message
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'whatsapp_message');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN whatsapp_message TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- whatsapp_template_params
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'whatsapp_template_params');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN whatsapp_template_params TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- is_active
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'is_active');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- requires_approval
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'requires_approval');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- created_at
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'created_at');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- updated_at
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'updated_at');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Normalize defaults for created_at/updated_at (safe if already matching)
ALTER TABLE notification_templates
  MODIFY COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- created_by
SET @exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = @tbl AND column_name = 'created_by');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD COLUMN created_by VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- unique and indexes
SET @exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @tbl AND index_name = 'template_code');
SET @sql := IF(@exists = 0, 'ALTER TABLE notification_templates ADD UNIQUE (template_code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @tbl AND index_name = 'idx_code');
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_code ON notification_templates(template_code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @tbl AND index_name = 'idx_category');
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_category ON notification_templates(template_category)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @tbl AND index_name = 'idx_active');
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_active ON notification_templates(is_active)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Template 1: Quotation Signature Request
INSERT IGNORE INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    whatsapp_template_name,
    whatsapp_message,
    is_active
) VALUES (
    'QUOTATION_SIGNATURE_REQUEST',
    'Quotation Signature Request',
    'SIGNATURE',
    'Please approve your Kitchen Quotation - {{quotationNumber}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F39C12; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #F39C12; color: white;
                  padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #F39C12; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Kitchen Quotation is Ready!</h1>
        </div>
        <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Thank you for choosing HOCH for your kitchen project!</p>
            <p>Your quotation is ready for review and approval. Please click the button below to review and approve:</p>
            <div style="text-align: center;">
                <a href="{{signingLink}}" class="button">📝 Review & Approve Quotation</a>
            </div>
            <div class="details">
                <h3>Quotation Details:</h3>
                <ul>
                    <li><strong>Quotation Number:</strong> {{quotationNumber}}</li>
                    <li><strong>Total Amount:</strong> ₹{{totalAmount}}</li>
                    <li><strong>Valid Until:</strong> {{validUntil}}</li>
                </ul>
            </div>
            <p><strong>Important:</strong> This approval link will expire in 7 days. If you have any questions, please contact us.</p>
            <p>We are excited to work with you on your dream kitchen!</p>
            <p>Best regards,<br><strong>HOCH Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
            <p>For support, contact us at support@kitchencrm.com</p>
        </div>
    </div>
</body>
</html>',
    'quotation_signature_request',
    'Hi {{1}}! 👋\n\nYour kitchen quotation {{2}} is ready for approval.\n\n💰 Amount: ₹{{3}}\n📅 Valid until: {{4}}\n\n👉 Approve now: {{5}}\n\n- HOCH Team',
    TRUE
);

-- Template 2: Signature Reminder (3 days)
INSERT IGNORE INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    whatsapp_template_name,
    whatsapp_message,
    is_active
) VALUES (
    'SIGNATURE_REMINDER_3_DAYS',
    'Signature Reminder - 3 Days',
    'SIGNATURE',
    'Reminder: Please approve quotation {{quotationNumber}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #3498db; color: white;
                  padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Friendly Reminder</h1>
        </div>
        <div class="content">
            <p>Dear {{customerName}},</p>
            <p>We noticed that your quotation <strong>{{quotationNumber}}</strong> is still pending approval.</p>
            <div class="details">
                <p><strong>Quotation Amount:</strong> ₹{{totalAmount}}</p>
                <p><strong>Expires on:</strong> {{validUntil}}</p>
            </div>
            <div style="text-align: center;">
                <a href="{{signingLink}}" class="button">📝 Approve Now</a>
            </div>
            <p>If you have any questions or need clarification, please contact us.</p>
            <p>Best regards,<br><strong>HOCH Team</strong></p>
        </div>
    </div>
</body>
</html>',
    'signature_reminder',
    'Hi {{1}}! ⏰\n\nReminder: Your quotation {{2}} is pending approval.\n\n💰 Amount: ₹{{3}}\n⏳ Expires: {{4}}\n\n👉 Approve: {{5}}\n\n- HOCH',
    TRUE
);

-- Template 3: Signature Reminder (6 days - Urgent)
INSERT IGNORE INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    whatsapp_template_name,
    whatsapp_message,
    is_active
) VALUES (
    'SIGNATURE_REMINDER_6_DAYS',
    'Signature Reminder - 6 Days (Urgent)',
    'SIGNATURE',
    '⚠️ URGENT: Quotation {{quotationNumber}} expires tomorrow!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #e74c3c; color: white;
                  padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .urgent { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ URGENT REMINDER</h1>
        </div>
        <div class="content">
            <p>Dear {{customerName}},</p>
            <div class="urgent">
                <p><strong>⚠️ Your quotation expires TOMORROW!</strong></p>
                <p>Quotation <strong>{{quotationNumber}}</strong> for ₹{{totalAmount}} will expire on <strong>{{validUntil}}</strong>.</p>
            </div>
            <p>Please approve your quotation today to avoid delays in starting your kitchen project.</p>
            <div style="text-align: center;">
                <a href="{{signingLink}}" class="button">📝 Approve NOW</a>
            </div>
            <p>If you need assistance, please call us immediately.</p>
            <p>Best regards,<br><strong>HOCH Team</strong></p>
        </div>
    </div>
</body>
</html>',
    'signature_urgent_reminder',
    '⚠️ URGENT {{1}}!\n\nYour quotation {{2}} expires TOMORROW!\n\n💰 ₹{{3}}\n\n👉 Approve NOW: {{4}}\n\nNeed help? Reply to this message.\n\n- HOCH',
    TRUE
);

-- Template 4: Signature Received Confirmation
INSERT IGNORE INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    whatsapp_template_name,
    whatsapp_message,
    is_active
) VALUES (
    'SIGNATURE_RECEIVED',
    'Signature Received Confirmation',
    'SIGNATURE',
    'Thank you for approving quotation {{quotationNumber}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #27ae60; color: white;
                  padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .next-steps { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #27ae60; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Approval Received!</h1>
        </div>
        <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Thank you for approving quotation <strong>{{quotationNumber}}</strong>!</p>
            <p>Your approved quotation is attached to this email.</p>
            <div class="next-steps">
                <h3>Next Steps:</h3>
                <ol>
                    <li>Our design team will start working on detailed plans</li>
                    <li>You will receive design drafts for approval within 3-5 days</li>
                    <li>Once designs are approved, we will schedule installation</li>
                </ol>
            </div>
            <p>We are excited to bring your dream kitchen to life!</p>
            <div style="text-align: center;">
                <a href="{{downloadLink}}" class="button">📥 Download Approved Quotation</a>
            </div>
            <p>Best regards,<br><strong>HOCH Team</strong></p>
        </div>
    </div>
</body>
</html>',
    'signature_confirmation',
    'Thank you {{1}}! ✅\n\nYour quotation {{2}} has been approved.\n\n📄 Download: {{3}}\n\nWe will start your kitchen project soon!\n\n- HOCH Team',
    TRUE
);

-- Template 5: Work Completion Signature Request
INSERT IGNORE INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    whatsapp_template_name,
    whatsapp_message,
    is_active
) VALUES (
    'WORK_COMPLETION_SIGNATURE',
    'Work Completion Signature Request',
    'SIGNATURE',
    'Please sign your Work Completion Certificate',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #9b59b6; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #9b59b6; color: white;
                  padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Your Kitchen is Complete!</h1>
        </div>
        <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Congratulations! Your kitchen project has been completed.</p>
            <p>Please review the work completion certificate and sign to confirm your satisfaction:</p>
            <div style="text-align: center;">
                <a href="{{signingLink}}" class="button">📝 Review & Sign Certificate</a>
            </div>
            <p>The certificate includes:</p>
            <ul>
                <li>Project summary</li>
                <li>Materials used</li>
                <li>Before/after photos</li>
                <li>Quality checklist</li>
            </ul>
            <p>Once signed, we will proceed with final billing.</p>
            <p>Thank you for choosing us!</p>
            <p>Best regards,<br><strong>HOCH Team</strong></p>
        </div>
    </div>
</body>
</html>',
    'work_completion_signature',
    'Hi {{1}}! 🎉\n\nYour kitchen is complete!\n\nPlease sign completion certificate:\n👉 {{2}}\n\nIncludes photos & checklist.\n\n- HOCH Team',
    TRUE
);

-- Template 6: Final Bill Signature Request
INSERT INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    whatsapp_template_name,
    whatsapp_message,
    is_active
) VALUES (
    'FINAL_BILL_SIGNATURE',
    'Final Bill Signature Request',
    'SIGNATURE',
    'Please sign your Final Bill {{billNumber}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #2c3e50; color: white;
                  padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .amount { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Final Bill Ready</h1>
        </div>
        <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Your final bill is ready for review and acknowledgment.</p>
            <div class="amount">
                <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
                <p><strong>Balance Due:</strong> ₹{{balanceDue}}</p>
            </div>
            <div style="text-align: center;">
                <a href="{{signingLink}}" class="button">📝 Review & Sign Bill</a>
            </div>
            <p>Please review and sign to acknowledge the final amount.</p>
            <p>Best regards,<br><strong>HOCH Team</strong></p>
        </div>
    </div>
</body>
</html>',
    'final_bill_signature',
    'Hi {{1}}!\n\nYour final bill is ready.\n\n💰 Total: ₹{{2}}\n💳 Balance: ₹{{3}}\n\n👉 Review & sign: {{4}}\n\n- HOCH Team',
    TRUE
);

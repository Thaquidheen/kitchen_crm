-- Repeatable migration: Ensure QUOTATION_SIGNATURE_REQUEST template exists and is active

INSERT INTO notification_templates (
    template_code,
    template_name,
    template_category,
    email_subject,
    email_body,
    is_active
)
SELECT 'QUOTATION_SIGNATURE_REQUEST', 'Quotation Signature Request', 'SIGNATURE',
       'Please approve your Kitchen Quotation - {{quotationNumber}}',
       '<!DOCTYPE html>\n<html>\n<body>\n    <h2>Dear {{customerName}},</h2>\n    <p>Your quotation <strong>{{quotationNumber}}</strong> is ready for approval.</p>\n    <p><strong>Amount:</strong> ₹{{totalAmount}}</p>\n    <p><a href="{{signingLink}}" style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;">Review & Approve</a></p>\n    <p>Link expires on {{validUntil}}</p>\n    <p>Thank you!<br><strong>HOCH Team</strong></p>\n</body>\n</html>',
       TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM notification_templates WHERE template_code = 'QUOTATION_SIGNATURE_REQUEST'
);

-- If it exists but is inactive, activate it
UPDATE notification_templates
SET is_active = TRUE
WHERE template_code = 'QUOTATION_SIGNATURE_REQUEST' AND (is_active IS NULL OR is_active = FALSE);



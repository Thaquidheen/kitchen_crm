-- Add miscellaneous (other expenses) default margin to system settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('miscellaneous_margin_percentage', '0.00', 'Default margin percentage for miscellaneous/other expenses category');

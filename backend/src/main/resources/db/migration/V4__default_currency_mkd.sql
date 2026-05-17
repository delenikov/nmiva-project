ALTER TABLE user_settings ALTER COLUMN currency SET DEFAULT 'мкд';

UPDATE user_settings
SET currency = 'мкд'
WHERE currency IN ('EUR', 'MKD', 'МКД');

-- Seed user: demo@angularbank.com / password123
INSERT INTO users (id, name, email, password, created_at) VALUES
(1, 'Demo User', 'demo@angularbank.com', '$2a$10$2UG3k8jaTQsqyR67kku/8e4IbgYFMxYmkqMGT79iD2QOeQmKOcqxK', CURRENT_TIMESTAMP);

ALTER TABLE users ALTER COLUMN id RESTART WITH 2;

INSERT INTO accounts (id, user_id, name, type, account_number, balance, currency, version) VALUES
(1, 1, 'Primary Checking', 'CHECKING', '****4521', 12450.75, 'USD', 0),
(2, 1, 'Savings Account', 'SAVINGS', '****8832', 45200.00, 'USD', 0),
(3, 1, 'Business Checking', 'CHECKING', '****1190', 8320.50, 'USD', 0),
(4, 1, 'Credit Card', 'CREDIT', '****6743', -1520.30, 'USD', 0),
(5, 1, 'Emergency Fund', 'SAVINGS', '****3301', 15000.00, 'USD', 0);

ALTER TABLE accounts ALTER COLUMN id RESTART WITH 6;

INSERT INTO transactions (id, account_id, date, description, amount, type) VALUES
(1, 1, '2026-04-16', 'Grocery Store', -82.45, 'DEBIT'),
(2, 1, '2026-04-15', 'Direct Deposit - Payroll', 3200.00, 'CREDIT'),
(3, 1, '2026-04-14', 'Electric Company', -145.20, 'DEBIT'),
(4, 2, '2026-04-13', 'Transfer from Checking', 500.00, 'CREDIT'),
(5, 1, '2026-04-12', 'Coffee Shop', -6.50, 'DEBIT'),
(6, 3, '2026-04-11', 'Client Payment', 2500.00, 'CREDIT'),
(7, 4, '2026-04-10', 'Online Subscription', -14.99, 'DEBIT'),
(8, 1, '2026-04-09', 'Restaurant', -48.75, 'DEBIT'),
(9, 4, '2026-04-08', 'Gas Station', -52.30, 'DEBIT'),
(10, 2, '2026-04-07', 'Interest Payment', 12.50, 'CREDIT');

ALTER TABLE transactions ALTER COLUMN id RESTART WITH 11;

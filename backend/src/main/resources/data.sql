-- Seed users, all with the password `password123`
INSERT INTO users (id, name, email, password, created_at) VALUES
(1, 'Demo User', 'demo@angularbank.com', '$2a$10$2UG3k8jaTQsqyR67kku/8e4IbgYFMxYmkqMGT79iD2QOeQmKOcqxK', CURRENT_TIMESTAMP),
(2, 'Riya Sharma', 'retail@angularbank.com', '$2a$10$2UG3k8jaTQsqyR67kku/8e4IbgYFMxYmkqMGT79iD2QOeQmKOcqxK', CURRENT_TIMESTAMP),
(3, 'Marcus Webb', 'advisor@angularbank.com', '$2a$10$2UG3k8jaTQsqyR67kku/8e4IbgYFMxYmkqMGT79iD2QOeQmKOcqxK', CURRENT_TIMESTAMP);

ALTER TABLE users ALTER COLUMN id RESTART WITH 4;

-- Entitlement tiers. Marcus holds two roles; new sign-ups default to RETAIL in AuthService.
INSERT INTO user_roles (user_id, role) VALUES
(1, 'PREMIUM'),
(2, 'RETAIL'),
(3, 'ADVISOR'),
(3, 'PREMIUM');

INSERT INTO accounts (id, user_id, name, type, account_number, balance, currency, version) VALUES
(1, 1, 'Primary Checking', 'CHECKING', '****4521', 12450.75, 'USD', 0),
(2, 1, 'Savings Account', 'SAVINGS', '****8832', 45200.00, 'USD', 0),
(3, 1, 'Business Checking', 'CHECKING', '****1190', 8320.50, 'USD', 0),
(4, 1, 'Credit Card', 'CREDIT', '****6743', -1520.30, 'USD', 0),
(5, 1, 'Emergency Fund', 'SAVINGS', '****3301', 15000.00, 'USD', 0),
(6, 2, 'Everyday Chequing', 'CHECKING', '****7712', 3180.45, 'USD', 0),
(7, 2, 'TFSA Savings', 'SAVINGS', '****9043', 9650.00, 'USD', 0),
(8, 3, 'Advisory Cash', 'CHECKING', '****2288', 58900.10, 'USD', 0),
(9, 3, 'Model Portfolio', 'SAVINGS', '****6610', 124300.00, 'USD', 0);

ALTER TABLE accounts ALTER COLUMN id RESTART WITH 10;

INSERT INTO transactions (id, account_id, date, description, amount, type, symbol) VALUES
(1, 1, '2026-04-16', 'Grocery Store', -82.45, 'DEBIT', NULL),
(2, 1, '2026-04-15', 'Direct Deposit - Payroll', 3200.00, 'CREDIT', NULL),
(3, 1, '2026-04-14', 'Electric Company', -145.20, 'DEBIT', NULL),
(4, 2, '2026-04-13', 'Transfer from Checking', 500.00, 'CREDIT', NULL),
(5, 1, '2026-04-12', 'Coffee Shop', -6.50, 'DEBIT', NULL),
(6, 3, '2026-04-11', 'Client Payment', 2500.00, 'CREDIT', NULL),
(7, 4, '2026-04-10', 'Online Subscription', -14.99, 'DEBIT', NULL),
(8, 1, '2026-04-09', 'Restaurant', -48.75, 'DEBIT', NULL),
(9, 4, '2026-04-08', 'Gas Station', -52.30, 'DEBIT', NULL),
(10, 2, '2026-04-07', 'Interest Payment', 12.50, 'CREDIT', NULL),
(11, 6, '2026-04-15', 'Direct Deposit - Payroll', 2100.00, 'CREDIT', NULL),
(12, 6, '2026-04-14', 'Transit Pass', -156.00, 'DEBIT', NULL),
(13, 7, '2026-04-12', 'Transfer from Chequing', 400.00, 'CREDIT', NULL),
(14, 8, '2026-04-15', 'Advisory Fee Credit', 4200.00, 'CREDIT', NULL),
(15, 8, '2026-04-11', 'Research Subscription', -249.00, 'DEBIT', NULL),
(16, 9, '2026-04-09', 'Quarterly Rebalance Inflow', 15000.00, 'CREDIT', NULL);

ALTER TABLE transactions ALTER COLUMN id RESTART WITH 17;

-- Opening holdings so the Positions panel has content before the first trade
INSERT INTO positions (id, account_id, symbol, name, currency, quantity, average_cost, version) VALUES
(1, 1, 'NVDA', 'NVIDIA Corporation', 'USD', 5.00000, 189.3300, 0),
(2, 2, 'AAPL', 'Apple Inc.', 'USD', 12.00000, 198.4200, 0),
(3, 2, 'VOO', 'Vanguard S&P 500 ETF', 'USD', 8.50000, 512.7500, 0),
(4, 6, 'AAPL', 'Apple Inc.', 'USD', 6.00000, 221.4000, 0),
(5, 7, 'VOO', 'Vanguard S&P 500 ETF', 'USD', 3.00000, 548.1200, 0),
(6, 9, 'NVDA', 'NVIDIA Corporation', 'USD', 40.00000, 203.7500, 0),
(7, 9, 'MSFT', 'Microsoft Corporation', 'USD', 18.00000, 402.1000, 0);

ALTER TABLE positions ALTER COLUMN id RESTART WITH 8;

-- Server-side feature flags. A flag is on when enabled_for_all, or when the user holds one of
-- the roles listed against it in feature_flag_roles.
INSERT INTO feature_flags (flag_key, description, enabled_for_all) VALUES
('research.analyst_ratings', 'Analyst ratings tab in the Quotes & Research overlay', TRUE),
('research.news', 'Company news tab in the Quotes & Research overlay', FALSE);

INSERT INTO feature_flag_roles (flag_key, role) VALUES
('research.news', 'PREMIUM'),
('research.news', 'ADVISOR');

/*
  # Initial SplitGroup Database Schema

  1. New Tables
    - `users` - User accounts
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `transactions` - Expense transactions
      - `id` (bigserial, primary key)
      - `description` (text)
      - `amount` (numeric)
      - `category` (text)
      - `paid_by` (bigint, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text)
    
    - `transaction_participants` - Users involved in a transaction
      - `id` (bigserial, primary key)
      - `transaction_id` (bigint, foreign key)
      - `user_id` (bigint)
      - `amount` (numeric)
      - `settled` (boolean)
      - `created_at` (timestamptz)
    
    - `balances` - User-to-user balances
      - `id` (bigserial, primary key)
      - `user1_id` (bigint)
      - `user2_id` (bigint)
      - `amount` (numeric)
      - `description` (text)
      - `is_settled` (boolean)
      - `last_updated` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Restrict access based on user ownership and participation
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  paid_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SETTLED', 'CANCELLED'))
);

-- Create transaction_participants table
CREATE TABLE IF NOT EXISTS transaction_participants (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  settled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transaction_id, user_id)
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id BIGSERIAL PRIMARY KEY,
  user1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  is_settled BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT now(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_by ON transactions(paid_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_participants_transaction_id ON transaction_participants(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_participants_user_id ON transaction_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_user1 ON balances(user1_id);
CREATE INDEX IF NOT EXISTS idx_balances_user2 ON balances(user2_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.user_id')::bigint))
  WITH CHECK (id = (current_setting('app.user_id')::bigint));

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    paid_by = (current_setting('app.user_id')::bigint)
    OR EXISTS (
      SELECT 1 FROM transaction_participants
      WHERE transaction_participants.transaction_id = transactions.id
      AND transaction_participants.user_id = (current_setting('app.user_id')::bigint)
    )
  );

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (paid_by = (current_setting('app.user_id')::bigint));

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (paid_by = (current_setting('app.user_id')::bigint))
  WITH CHECK (paid_by = (current_setting('app.user_id')::bigint));

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (paid_by = (current_setting('app.user_id')::bigint));

-- RLS Policies for transaction_participants table
CREATE POLICY "Users can view participants in their transactions"
  ON transaction_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_participants.transaction_id
      AND (transactions.paid_by = (current_setting('app.user_id')::bigint)
        OR user_id = (current_setting('app.user_id')::bigint))
    )
  );

CREATE POLICY "Transaction creators can insert participants"
  ON transaction_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_participants.transaction_id
      AND transactions.paid_by = (current_setting('app.user_id')::bigint)
    )
  );

CREATE POLICY "Transaction creators can update participants"
  ON transaction_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_participants.transaction_id
      AND transactions.paid_by = (current_setting('app.user_id')::bigint)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_participants.transaction_id
      AND transactions.paid_by = (current_setting('app.user_id')::bigint)
    )
  );

-- RLS Policies for balances table
CREATE POLICY "Users can view own balances"
  ON balances FOR SELECT
  TO authenticated
  USING (
    user1_id = (current_setting('app.user_id')::bigint)
    OR user2_id = (current_setting('app.user_id')::bigint)
  );

CREATE POLICY "System can manage balances"
  ON balances FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update balances after transaction
CREATE OR REPLACE FUNCTION update_balances_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payer_id BIGINT;
  participant_record RECORD;
  smaller_id BIGINT;
  larger_id BIGINT;
  balance_amount NUMERIC;
BEGIN
  -- Get the payer
  SELECT paid_by INTO payer_id FROM transactions WHERE id = NEW.transaction_id;
  
  -- For each participant, update or create balance
  FOR participant_record IN 
    SELECT user_id, amount FROM transaction_participants WHERE transaction_id = NEW.transaction_id
  LOOP
    -- Skip if participant is the payer
    IF participant_record.user_id = payer_id THEN
      CONTINUE;
    END IF;
    
    -- Determine smaller and larger IDs for consistent ordering
    IF payer_id < participant_record.user_id THEN
      smaller_id := payer_id;
      larger_id := participant_record.user_id;
      balance_amount := participant_record.amount;
    ELSE
      smaller_id := participant_record.user_id;
      larger_id := payer_id;
      balance_amount := -participant_record.amount;
    END IF;
    
    -- Insert or update balance
    INSERT INTO balances (user1_id, user2_id, amount, description, last_updated)
    VALUES (
      smaller_id,
      larger_id,
      balance_amount,
      'Balance from transactions',
      now()
    )
    ON CONFLICT (user1_id, user2_id)
    DO UPDATE SET
      amount = balances.amount + balance_amount,
      last_updated = now(),
      is_settled = false;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update balances
CREATE TRIGGER trigger_update_balances
AFTER INSERT ON transaction_participants
FOR EACH ROW
EXECUTE FUNCTION update_balances_on_transaction();

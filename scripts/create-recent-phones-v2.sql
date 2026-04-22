-- Create recent_phones table if it doesn't exist
CREATE TABLE IF NOT EXISTS recent_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recent_phones_user_created 
ON recent_phones(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE recent_phones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see their own recent phones" ON recent_phones;
DROP POLICY IF EXISTS "Users can insert their own recent phones" ON recent_phones;
DROP POLICY IF EXISTS "Users can update their own recent phones" ON recent_phones;
DROP POLICY IF EXISTS "Users can delete their own recent phones" ON recent_phones;

-- Create RLS policies
CREATE POLICY "Users can see their own recent phones" ON recent_phones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recent phones" ON recent_phones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recent phones" ON recent_phones
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recent phones" ON recent_phones
  FOR DELETE USING (auth.uid() = user_id);

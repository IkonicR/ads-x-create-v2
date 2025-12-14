-- Function to safely deduct credits with atomic locking
CREATE OR REPLACE FUNCTION deduct_credits(p_business_id TEXT, p_amount INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  current_credits INT;
  new_credits INT;
BEGIN
  -- Lock the row for update to prevent race conditions
  -- This will fail if RLS prevents the user from seeing this row
  SELECT credits INTO current_credits 
  FROM businesses 
  WHERE id = p_business_id 
  FOR UPDATE;
  
  IF current_credits IS NULL THEN
    RETURN -2; -- Business not found or access denied
  END IF;

  IF current_credits < p_amount THEN
    RETURN -1; -- Insufficient funds
  END IF;

  new_credits := current_credits - p_amount;

  UPDATE businesses 
  SET credits = new_credits 
  WHERE id = p_business_id;
  
  RETURN new_credits;
END;
$$;

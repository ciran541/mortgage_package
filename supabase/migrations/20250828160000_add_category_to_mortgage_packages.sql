-- Add 'category' column to mortgage_packages table
ALTER TABLE public.mortgage_packages
ADD COLUMN category text NOT NULL DEFAULT 'Fixed';

-- Optionally, update existing rows to a specific value if needed
-- UPDATE public.mortgage_packages SET category = 'Fixed';

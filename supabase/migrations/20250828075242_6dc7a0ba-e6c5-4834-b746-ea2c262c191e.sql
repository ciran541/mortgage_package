-- Create mortgage_packages table
CREATE TABLE public.mortgage_packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bank TEXT NOT NULL,
    property_type TEXT NOT NULL,
    min_loan_size NUMERIC NOT NULL,
    package_name TEXT NOT NULL,
    lockin_period TEXT NOT NULL,
    rates TEXT NOT NULL,
    features TEXT,
    subsidies TEXT,
    remarks TEXT,
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable Row Level Security
ALTER TABLE public.mortgage_packages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (mortgage packages are typically public information)
CREATE POLICY "Allow public read access to mortgage packages" 
ON public.mortgage_packages 
FOR SELECT 
USING (true);

-- Insert the OCBC sample data
INSERT INTO public.mortgage_packages (
    bank,
    property_type,
    min_loan_size,
    package_name,
    lockin_period,
    rates,
    features,
    subsidies,
    remarks,
    last_updated
) VALUES (
    'OCBC',
    'HDB / Private',
    200000,
    'OCBC 1Y Fixed Rates – 2 Years Lock-In (Subject to Approval)',
    '2 Years',
    'Year 1: 2.0% Fixed <br> Year 2: 3M SORA + 0.35% <br> Thereafter: 3M SORA + 0.55%',
    '- One free conversion after 12 months <br> - 100% Waiver Due to Sale after 12M <br> - Limited Tranche Promo <br> - Purchase cases only',
    'Subsidy for refinancing available',
    'Some internal remarks here',
    '2025-08-28'
);
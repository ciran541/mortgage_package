-- Insert sample mortgage package data
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
) VALUES 
(
    'DBS',
    'HDB',
    150000,
    'DBS Fixed Home Rate Package',
    '3 Years',
    'Year 1-2: 1.88% Fixed <br> Year 3: 3M SORA + 0.40% <br> Thereafter: 3M SORA + 0.65%',
    '- Free fire insurance for first year <br> - Legal fee subsidy up to $2,500 <br> - No early repayment penalty after lock-in',
    'Legal fee subsidy available',
    'Popular package for HDB buyers',
    '2025-08-27'
),
(
    'UOB',
    'Private',
    500000,
    'UOB Home Smart Package',
    '2 Years',
    'Year 1: 2.38% Fixed <br> Thereafter: 3M SORA + 0.75%',
    '- Free valuation <br> - 50% discount on home insurance <br> - Priority banking privileges',
    'Refinancing cashback available',
    'Premium package for private properties',
    '2025-08-26'
),
(
    'POSB',
    'HDB / Private',
    200000,
    'POSB Home Plus Package',
    '1 Year',
    'Year 1: 1.99% Fixed <br> Thereafter: 3M SORA + 0.50%',
    '- No processing fee <br> - Free MCST management <br> - Flexible repayment options',
    'First-time buyer rebate',
    'Suitable for young families',
    '2025-08-25'
),
(
    'Maybank',
    'Private',
    800000,
    'Maybank PropertyFirst',
    '3 Years',
    'Year 1-3: Board Rate - 2.50% <br> Thereafter: Board Rate - 2.25%',
    '- Wealth management consultation <br> - Premium credit card waiver <br> - Investment advisory services',
    'High net worth client benefits',
    'Exclusive package for high-value properties',
    '2025-08-24'
),
(
    'Standard Chartered',
    'HDB',
    180000,
    'SC HomeSaver Package',
    '2 Years',
    'Year 1-2: 1.95% Fixed <br> Thereafter: 3M SORA + 0.55%',
    '- Cashback on mortgage payments <br> - Free home insurance <br> - Priority customer service',
    'Cashback rewards program',
    'Good for cost-conscious borrowers',
    '2025-08-23'
);
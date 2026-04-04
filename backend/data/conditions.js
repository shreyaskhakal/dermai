// ============================================================
//  DermAI — Skin Condition Database
//  Realistic AI analysis data for 15 common skin conditions
// ============================================================

const CONDITIONS = {
  eczema: {
    id: 'eczema',
    name: 'Eczema',
    medicalName: 'Atopic Dermatitis',
    category: 'Inflammatory',
    emoji: '🔴',
    emergencyLevel: 'low',
    description: 'A chronic inflammatory skin condition characterized by itchy, red, and cracked skin.',
    warning: 'Avoid scratching. If skin cracks and weeps, risk of secondary bacterial infection increases.',
    causes: ['Genetic predisposition', 'Immune system dysfunction', 'Dry skin barrier', 'Environmental triggers'],
    triggers: ['Soaps & detergents', 'Stress', 'Sweat', 'Wool clothing', 'Pet dander', 'Dust mites'],
    symptoms: ['Itching', 'Redness', 'Dry scaly skin', 'Rashes', 'Skin thickening'],
    similarConditions: [
      { name: 'Contact Dermatitis', pct: 68 },
      { name: 'Psoriasis', pct: 42 },
      { name: 'Seborrheic Dermatitis', pct: 31 }
    ],
    actionPlan: [
      { urgency: 'urgent', title: 'Apply emollient NOW', desc: 'Immediately apply a thick unscented moisturizer to affected area. This restores the skin barrier.', tag: 'now' },
      { urgency: 'today', title: 'Avoid all irritants', desc: 'Stop using fragranced soaps, switch to gentle cleanser (Cetaphil or CeraVe).', tag: 'today' },
      { urgency: 'today', title: 'Use cold compress', desc: 'Apply cold damp cloth for 10 mins to reduce inflammation and itching.', tag: 'today' },
      { urgency: 'ongoing', title: 'Moisturize 3x daily', desc: 'Apply moisturizer consistently — after shower, mid-day, before bed.', tag: 'ongoing' },
      { urgency: 'ongoing', title: 'Monitor and track triggers', desc: 'Keep a skin diary. Identify and avoid your personal triggers.', tag: 'week' }
    ],
    products: [
      { icon: '🧴', name: 'CeraVe Moisturizing Cream', type: 'Moisturizer', desc: 'Ceramide-rich formula restores skin barrier. Apply generously 3x daily.' },
      { icon: '🛁', name: 'Cetaphil Gentle Cleanser', type: 'Cleanser', desc: 'Soap-free, fragrance-free. Safe for sensitive eczema-prone skin.' },
      { icon: '💊', name: 'Hydrocortisone 1% Cream', type: 'OTC Topical', desc: 'Short-term use (max 7 days) for flare-ups. Do not use on face.' },
      { icon: '🌿', name: 'Colloidal Oatmeal Lotion', type: 'Natural Relief', desc: 'Anti-inflammatory properties to soothe itching naturally.' }
    ],
    avoidList: [
      { icon: '🧼', name: 'Fragranced Soaps', reason: 'Strip skin oils and trigger inflammation', severity: 'HIGH' },
      { icon: '🌡️', name: 'Hot Showers', reason: 'Heat dehydrates skin and worsens itching', severity: 'HIGH' },
      { icon: '🐑', name: 'Wool Clothing', reason: 'Rough fibers irritate inflamed skin', severity: 'MEDIUM' },
      { icon: '😤', name: 'Stress', reason: 'Triggers immune response and flare-ups', severity: 'MEDIUM' }
    ],
    timeline: [
      { period: 'Day 1–3', title: 'Acute Phase', desc: 'Maximum inflammation. Focus on emollients and avoiding triggers.', status: 'active' },
      { period: 'Week 1–2', title: 'Stabilization', desc: 'Redness and itching reduce with consistent moisturizing.', status: 'future' },
      { period: 'Week 3–4', title: 'Improvement', desc: 'Skin barrier begins repairing. Maintain skincare routine.', status: 'future' },
      { period: 'Month 2+', title: 'Management', desc: 'Ongoing management with trigger avoidance. See dermatologist if not improving.', status: 'future' }
    ],
    doctorNote: 'See a dermatologist if no improvement in 2 weeks or if skin becomes infected (pus, fever).'
  },

  psoriasis: {
    id: 'psoriasis',
    name: 'Psoriasis',
    medicalName: 'Psoriasis Vulgaris',
    category: 'Autoimmune',
    emoji: '🟠',
    emergencyLevel: 'medium',
    description: 'A chronic autoimmune condition causing rapid buildup of skin cells, resulting in thick, scaly plaques.',
    warning: 'Psoriasis can affect joints (psoriatic arthritis). Seek medical attention if joints become painful or swollen.',
    causes: ['Overactive immune system', 'Genetic factors', 'Environmental triggers'],
    triggers: ['Stress', 'Infections', 'Alcohol', 'Smoking', 'Certain medications'],
    symptoms: ['Thick silvery scales', 'Dry cracked skin', 'Burning or soreness', 'Thickened nails', 'Swollen stiff joints'],
    similarConditions: [
      { name: 'Eczema', pct: 52 },
      { name: 'Seborrheic Dermatitis', pct: 38 },
      { name: 'Fungal Infection', pct: 22 }
    ],
    actionPlan: [
      { urgency: 'urgent', title: 'Consult a dermatologist', desc: 'Psoriasis requires medical treatment. Book an appointment within the week.', tag: 'now' },
      { urgency: 'today', title: 'Moisturize thick plaques', desc: 'Apply petroleum jelly or thick cream to soften scales. Cover with wrap overnight.', tag: 'today' },
      { urgency: 'today', title: 'Avoid picking scales', desc: 'Do not pick or scratch. This triggers Koebner phenomenon — worsening psoriasis.', tag: 'today' },
      { urgency: 'ongoing', title: 'Try phototherapy', desc: 'Controlled UV light therapy is clinically proven effective for plaque psoriasis.', tag: 'week' },
      { urgency: 'ongoing', title: 'Reduce alcohol & stress', desc: 'These are the two biggest lifestyle triggers of psoriasis flares.', tag: 'ongoing' }
    ],
    products: [
      { icon: '💊', name: 'Coal Tar Cream', type: 'OTC Topical', desc: 'Reduces scaling and inflammation. Apply to plaques as directed.' },
      { icon: '🧴', name: 'Salicylic Acid Shampoo', type: 'Shampoo', desc: 'Removes scale buildup on scalp psoriasis.' },
      { icon: '☀️', name: 'Vitamin D Analogue Cream', type: 'Prescription', desc: 'Calcipotriol slows skin cell growth. Requires prescription.' },
      { icon: '🌿', name: 'Dead Sea Salt Bath', type: 'Natural Relief', desc: 'Soaking in mineral-rich water softens plaques.' }
    ],
    avoidList: [
      { icon: '🍺', name: 'Alcohol', reason: 'Major trigger — worsens inflammation systemically', severity: 'HIGH' },
      { icon: '🚬', name: 'Smoking', reason: 'Triggers and worsens psoriasis significantly', severity: 'HIGH' },
      { icon: '😤', name: 'Stress', reason: 'Immune system activation causes flares', severity: 'HIGH' },
      { icon: '💊', name: 'NSAIDs (Ibuprofen)', reason: 'Can trigger psoriasis flares in some patients', severity: 'MEDIUM' }
    ],
    timeline: [
      { period: 'Week 1', title: 'Start Treatment', desc: 'Begin OTC topicals and book dermatologist appointment.', status: 'active' },
      { period: 'Month 1', title: 'Medical Review', desc: 'Dermatologist may prescribe stronger topicals or biologics.', status: 'future' },
      { period: 'Month 2–3', title: 'Improvement Phase', desc: 'Plaques should reduce with consistent treatment.', status: 'future' },
      { period: 'Ongoing', title: 'Long-term Management', desc: 'Psoriasis is chronic. Focus on trigger avoidance and maintenance.', status: 'future' }
    ],
    doctorNote: 'Psoriasis is a chronic condition requiring ongoing medical management. Do not self-treat long term.'
  },

  acne: {
    id: 'acne',
    name: 'Acne',
    medicalName: 'Acne Vulgaris',
    category: 'Skin Disorder',
    emoji: '🟡',
    emergencyLevel: 'low',
    description: 'A skin condition causing pimples, blackheads, and whiteheads due to clogged hair follicles.',
    warning: 'Severe acne with cysts or nodules should be treated by a dermatologist to prevent scarring.',
    causes: ['Excess sebum production', 'Bacterial overgrowth (C. acnes)', 'Dead skin cells', 'Hormonal changes'],
    triggers: ['Hormonal changes', 'Certain foods (high glycemic)', 'Stress', 'Cosmetics', 'Medications'],
    symptoms: ['Whiteheads', 'Blackheads', 'Papules', 'Pimples', 'Nodules/Cysts'],
    similarConditions: [
      { name: 'Rosacea', pct: 41 },
      { name: 'Folliculitis', pct: 35 },
      { name: 'Perioral Dermatitis', pct: 28 }
    ],
    actionPlan: [
      { urgency: 'today', title: 'Start a 3-step routine', desc: 'Cleanser → Toner → Non-comedogenic moisturizer. Morning and night, consistently.', tag: 'today' },
      { urgency: 'today', title: 'Apply Benzoyl Peroxide', desc: '2.5% BP gel on active spots — kills C. acnes bacteria. Apply after moisturizer.', tag: 'today' },
      { urgency: 'urgent', title: 'Stop touching your face', desc: 'Hands transfer bacteria. This is the single most impactful free change you can make.', tag: 'now' },
      { urgency: 'ongoing', title: 'Introduce Retinol (PM)', desc: 'Start 0.25% retinol 2–3x/week. Increases cell turnover, reduces comedones.', tag: 'week' },
      { urgency: 'ongoing', title: 'Diet: cut high-GI foods', desc: 'Reduce dairy, sugar, and refined carbs. These spike insulin and increase sebum.', tag: 'ongoing' }
    ],
    products: [
      { icon: '🧼', name: 'La Roche-Posay Effaclar', type: 'Cleanser', desc: 'Salicylic acid cleanser for acne-prone skin. Use twice daily.' },
      { icon: '🧪', name: 'Benzoyl Peroxide 2.5%', type: 'Treatment', desc: 'Kills acne bacteria. Start low to avoid irritation.' },
      { icon: '⚗️', name: 'Niacinamide 10% Serum', type: 'Serum', desc: 'Reduces sebum, minimizes pores, fades acne marks.' },
      { icon: '🌙', name: 'Tretinoin 0.025%', type: 'Prescription', desc: 'Gold standard for acne. Requires dermatologist prescription.' }
    ],
    avoidList: [
      { icon: '🤲', name: 'Touching Face', reason: 'Transfers bacteria and spreads breakouts', severity: 'HIGH' },
      { icon: '🥛', name: 'Dairy Products', reason: 'Linked to increased acne in studies', severity: 'MEDIUM' },
      { icon: '🍫', name: 'High-Sugar Foods', reason: 'Spikes insulin, increases sebum production', severity: 'MEDIUM' },
      { icon: '💄', name: 'Comedogenic Cosmetics', reason: 'Clogs pores, triggers breakouts', severity: 'HIGH' }
    ],
    timeline: [
      { period: 'Week 1–2', title: 'Initial Adjustment', desc: 'Purge phase possible with actives. Stick with the routine.', status: 'active' },
      { period: 'Month 1', title: 'Visible Reduction', desc: 'Existing spots begin to clear. New formation slows.', status: 'future' },
      { period: 'Month 2–3', title: 'Clear Skin Phase', desc: 'Significant improvement. Maintain routine consistently.', status: 'future' },
      { period: 'Month 3+', title: 'Maintenance', desc: 'Continue prevention routine. Address any remaining marks.', status: 'future' }
    ],
    doctorNote: 'See a dermatologist if acne is cystic/nodular, leaves scars, or doesn\'t respond to OTC treatment in 3 months.'
  },

  ringworm: {
    id: 'ringworm',
    name: 'Ringworm',
    medicalName: 'Tinea Corporis',
    category: 'Fungal Infection',
    emoji: '🟤',
    emergencyLevel: 'low',
    description: 'A highly contagious fungal infection of the skin causing ring-shaped rashes. Not caused by a worm.',
    warning: 'Ringworm is contagious! Avoid sharing towels, clothing, or direct skin contact until fully treated.',
    causes: ['Dermatophyte fungi (Tinea species)', 'Direct skin contact', 'Contact with infected animals', 'Damp shared surfaces'],
    triggers: ['Warm humid environments', 'Sweating', 'Close contact sports', 'Weakened immune system'],
    symptoms: ['Ring-shaped rash', 'Scaly edges', 'Central clearing', 'Itching', 'Redness'],
    similarConditions: [
      { name: 'Eczema', pct: 45 },
      { name: 'Psoriasis', pct: 30 },
      { name: 'Granuloma Annulare', pct: 25 }
    ],
    actionPlan: [
      { urgency: 'urgent', title: 'Apply antifungal cream NOW', desc: 'Use clotrimazole 1% or terbinafine cream on the rash and 2cm around it. Twice daily.', tag: 'now' },
      { urgency: 'urgent', title: 'Stop sharing personal items', desc: 'Separate towels, clothing, and bedding. Wash these in hot water immediately.', tag: 'now' },
      { urgency: 'today', title: 'Keep area dry', desc: 'Fungi thrive in moisture. Pat dry after washing. Change sweaty clothes promptly.', tag: 'today' },
      { urgency: 'ongoing', title: 'Complete full treatment course', desc: 'Continue antifungal for 2 weeks after rash clears (usually 4–6 weeks total).', tag: 'week' }
    ],
    products: [
      { icon: '💊', name: 'Clotrimazole 1% Cream', type: 'Antifungal OTC', desc: 'First-line treatment. Apply twice daily for 4–6 weeks.' },
      { icon: '💊', name: 'Terbinafine Cream', type: 'Antifungal OTC', desc: 'Faster acting. Once daily application for 1–4 weeks.' },
      { icon: '🧼', name: 'Antifungal Body Wash', type: 'Cleanser', desc: 'Ketoconazole 2% wash to prevent spread.' },
      { icon: '🌿', name: 'Tea Tree Oil (diluted)', type: 'Natural', desc: 'Antifungal properties. Dilute 1:10 with coconut oil before applying.' }
    ],
    avoidList: [
      { icon: '🤝', name: 'Skin-to-Skin Contact', reason: 'Highly contagious — spreads to others', severity: 'HIGH' },
      { icon: '🏊', name: 'Swimming Pools', reason: 'Spreads infection and worsens condition', severity: 'HIGH' },
      { icon: '👗', name: 'Tight Synthetic Clothing', reason: 'Traps moisture, accelerates fungal growth', severity: 'MEDIUM' },
      { icon: '🐱', name: 'Pet Contact', reason: 'Animals can be carriers and re-infect you', severity: 'MEDIUM' }
    ],
    timeline: [
      { period: 'Day 1–3', title: 'Begin Treatment', desc: 'Start antifungal cream immediately. Itching begins to reduce.', status: 'active' },
      { period: 'Week 2', title: 'Visible Improvement', desc: 'Rash edges begin to fade. Continue treatment.', status: 'future' },
      { period: 'Week 4', title: 'Rash Clears', desc: 'Visible rash gone, but continue cream for 2 more weeks.', status: 'future' },
      { period: 'Week 6', title: 'Full Cure', desc: 'Fungal infection completely eliminated.', status: 'future' }
    ],
    doctorNote: 'See a doctor if ringworm doesn\'t respond after 4 weeks or is on the scalp/nails (requires oral antifungals).'
  },

  melanoma: {
    id: 'melanoma',
    name: 'Suspected Melanoma',
    medicalName: 'Cutaneous Melanoma',
    category: 'Skin Cancer (Suspected)',
    emoji: '🔴',
    emergencyLevel: 'high',
    description: 'A serious form of skin cancer that develops from melanocyte cells. Early detection is critical for survival.',
    warning: '⚠️ EMERGENCY: This AI result is NOT a diagnosis. See a dermatologist or doctor IMMEDIATELY. Melanoma is life-threatening if not treated early.',
    causes: ['UV radiation exposure', 'Genetic mutations', 'Fair skin type', 'Family history', 'Many moles'],
    triggers: ['Excessive sun exposure', 'Tanning beds', 'Weakened immune system'],
    symptoms: ['Asymmetric mole', 'Irregular border', 'Multiple colors', 'Large diameter (>6mm)', 'Evolving/changing appearance'],
    similarConditions: [
      { name: 'Benign Melanocytic Nevus', pct: 35 },
      { name: 'Basal Cell Carcinoma', pct: 28 },
      { name: 'Seborrheic Keratosis', pct: 20 }
    ],
    actionPlan: [
      { urgency: 'urgent', title: '🚨 See a dermatologist TODAY', desc: 'Do not delay. Book an emergency appointment immediately. Melanoma staging depends on early action.', tag: 'now' },
      { urgency: 'urgent', title: 'Do NOT try to remove this yourself', desc: 'Never pick, cut, or attempt home removal of suspected skin cancer.', tag: 'now' },
      { urgency: 'today', title: 'Document with photos', desc: 'Take dated photos from multiple angles. Monitor any change in size, color, or shape.', tag: 'today' },
      { urgency: 'today', title: 'Block all UV exposure', desc: 'Cover area completely. Apply SPF 50+ and wear protective clothing immediately.', tag: 'today' },
      { urgency: 'ongoing', title: 'Full body skin check', desc: 'Get a professional full-body dermoscopy examination to check all moles.', tag: 'week' }
    ],
    products: [
      { icon: '☀️', name: 'SPF 50+ Mineral Sunscreen', type: 'Protection', desc: 'Physical sunscreen (zinc oxide/titanium dioxide). Apply and reapply every 2 hours.' },
      { icon: '🩺', name: 'Dermatoscope Examination', type: 'Medical Procedure', desc: 'Required for diagnosis — only a doctor can perform this.' },
      { icon: '🧪', name: 'Skin Biopsy', type: 'Medical Procedure', desc: 'Definitive diagnosis requires tissue biopsy by a dermatologist/surgeon.' }
    ],
    avoidList: [
      { icon: '☀️', name: 'Sun Exposure', reason: 'UV radiation accelerates melanoma progression', severity: 'HIGH' },
      { icon: '🏖️', name: 'Tanning Beds', reason: 'Dramatically increases melanoma risk', severity: 'HIGH' },
      { icon: '🤲', name: 'Self-examination delay', reason: 'Time to treatment is critical for survival outcomes', severity: 'HIGH' },
      { icon: '🌐', name: 'Relying only on AI', reason: 'This AI result requires immediate professional confirmation', severity: 'HIGH' }
    ],
    timeline: [
      { period: 'TODAY', title: '🚨 Seek Medical Care', desc: 'Contact a dermatologist or hospital immediately for evaluation.', status: 'active' },
      { period: 'Day 1–7', title: 'Medical Evaluation', desc: 'Dermoscopy + possible biopsy ordered by physician.', status: 'future' },
      { period: 'Week 2', title: 'Biopsy Results', desc: 'Pathology lab confirms or rules out diagnosis.', status: 'future' },
      { period: 'Week 2–4', title: 'Treatment Plan', desc: 'If confirmed, oncologist/surgeon creates treatment plan.', status: 'future' }
    ],
    doctorNote: 'URGENT: This result warrants immediate professional medical evaluation. This app does not diagnose cancer.'
  },

  rosacea: {
    id: 'rosacea',
    name: 'Rosacea',
    medicalName: 'Rosacea Vulgaris',
    category: 'Chronic Inflammatory',
    emoji: '🌸',
    emergencyLevel: 'low',
    description: 'A chronic inflammatory skin condition primarily affecting the face, causing redness, visible blood vessels, and sometimes acne-like bumps.',
    warning: 'Rosacea can worsen without treatment. Identify and avoid your personal triggers to prevent flares.',
    causes: ['Immune system abnormalities', 'Genetic factors', 'Demodex mites', 'H. pylori bacteria'],
    triggers: ['Sun exposure', 'Hot drinks', 'Spicy food', 'Alcohol', 'Temperature extremes', 'Exercise'],
    symptoms: ['Facial redness', 'Visible blood vessels', 'Acne-like bumps', 'Eye irritation', 'Skin thickening'],
    similarConditions: [
      { name: 'Acne', pct: 58 },
      { name: 'Lupus', pct: 35 },
      { name: 'Seborrheic Dermatitis', pct: 30 }
    ],
    actionPlan: [
      { urgency: 'urgent', title: 'Apply Mineral SPF immediately', desc: 'Sun is the #1 rosacea trigger. Apply SPF 30+ mineral sunscreen every morning.', tag: 'now' },
      { urgency: 'today', title: 'Switch to gentle cleanser', desc: 'Stop all active ingredients (AHA, BHA, retinol). Use only gentle, non-foaming cleanser.', tag: 'today' },
      { urgency: 'today', title: 'Cold compress for flares', desc: 'Cold water compress reduces visible redness during a flare within minutes.', tag: 'today' },
      { urgency: 'ongoing', title: 'Identify your triggers', desc: 'Keep a trigger diary. Common culprits: red wine, hot showers, spicy food, exercise.', tag: 'week' },
      { urgency: 'ongoing', title: 'See a dermatologist', desc: 'Metronidazole or Azelaic acid (prescription) are highly effective first-line treatments.', tag: 'ongoing' }
    ],
    products: [
      { icon: '☀️', name: 'EltaMD UV Clear SPF 46', type: 'Sunscreen', desc: 'Niacinamide-containing mineral sunscreen specifically for rosacea-prone skin.' },
      { icon: '🧴', name: 'Avène Cicalfate Cream', type: 'Moisturizer', desc: 'Ultra-gentle, thermal spring water formula. Perfect for reactive skin.' },
      { icon: '💊', name: 'Metronidazole Gel 0.75%', type: 'Prescription', desc: 'First-line medical treatment for rosacea. Requires prescription.' },
      { icon: '⚗️', name: 'Azelaic Acid 20%', type: 'Prescription', desc: 'Reduces redness and bumps. Also improves skin tone.' }
    ],
    avoidList: [
      { icon: '🍷', name: 'Alcohol (especially red wine)', reason: 'Dilates blood vessels, causes immediate flushing', severity: 'HIGH' },
      { icon: '☀️', name: 'UV Exposure', reason: 'Major trigger — accelerates rosacea progression', severity: 'HIGH' },
      { icon: '🌶️', name: 'Spicy Foods', reason: 'Triggers vasodilation and flushing', severity: 'MEDIUM' },
      { icon: '🧪', name: 'Acids & Retinoids', reason: 'Irritate already sensitive rosacea-affected skin', severity: 'HIGH' }
    ],
    timeline: [
      { period: 'Week 1–2', title: 'Trigger Control', desc: 'Eliminate top triggers, start gentle skincare. Redness may reduce noticeably.', status: 'active' },
      { period: 'Month 1', title: 'Treatment Response', desc: 'Prescription topicals begin to visibly reduce redness and bumps.', status: 'future' },
      { period: 'Month 2–3', title: 'Significant Improvement', desc: 'Skin tone evens, flare frequency reduces.', status: 'future' },
      { period: 'Ongoing', title: 'Long-term Management', desc: 'Rosacea is chronic. Maintenance treatment and trigger avoidance prevent flares.', status: 'future' }
    ],
    doctorNote: 'Prescription treatment significantly improves outcomes. Untreated rosacea can progress to permanent skin thickening.'
  },

  hives: {
    id: 'hives',
    name: 'Urticaria (Hives)',
    medicalName: 'Urticaria',
    category: 'Allergic Reaction',
    emoji: '🔶',
    emergencyLevel: 'medium',
    description: 'Raised, itchy welts (wheals) on the skin triggered by an allergic reaction or immune response.',
    warning: 'Seek EMERGENCY care if hives are accompanied by difficulty breathing, throat swelling, or dizziness — this indicates anaphylaxis.',
    causes: ['Allergic reactions', 'Medications (NSAIDs, antibiotics)', 'Foods (nuts, shellfish)', 'Infections', 'Insect stings'],
    triggers: ['Food allergens', 'Medications', 'Heat or cold', 'Stress', 'Pressure on skin'],
    symptoms: ['Raised welts', 'Severe itching', 'Red or skin-colored patches', 'Swelling', 'Symptoms may move around body'],
    similarConditions: [
      { name: 'Angioedema', pct: 55 },
      { name: 'Contact Dermatitis', pct: 40 },
      { name: 'Insect Bite Reaction', pct: 35 }
    ],
    actionPlan: [
      { urgency: 'urgent', title: 'Take antihistamine NOW', desc: 'Take non-drowsy antihistamine (cetirizine/loratadine) immediately. This is the fastest relief.', tag: 'now' },
      { urgency: 'urgent', title: 'Monitor for anaphylaxis', desc: 'If throat tightens, you feel dizzy, or have trouble breathing — CALL EMERGENCY SERVICES.', tag: 'now' },
      { urgency: 'today', title: 'Identify and remove trigger', desc: 'Think about what changed in last 2 hours: new food, medication, insect bite, product.', tag: 'today' },
      { urgency: 'today', title: 'Cool the skin', desc: 'Cold compress or cool shower significantly reduces hive intensity.', tag: 'today' },
      { urgency: 'ongoing', title: 'See a doctor for chronic hives', desc: 'If hives recur for more than 6 weeks, see a doctor for testing and prescription antihistamines.', tag: 'week' }
    ],
    products: [
      { icon: '💊', name: 'Cetirizine (Zyrtec) 10mg', type: 'OTC Antihistamine', desc: 'Fast-acting, 24-hour relief. Take at first sign of hives.' },
      { icon: '💊', name: 'Loratadine (Claritin) 10mg', type: 'OTC Antihistamine', desc: 'Non-drowsy option. Take with cetirizine for severe cases.' },
      { icon: '🌿', name: 'Calamine Lotion', type: 'Topical Relief', desc: 'Soothes itching, cools skin, reduces discomfort.' },
      { icon: '❄️', name: 'Cold Compress', type: 'Home Remedy', desc: 'Ice pack wrapped in cloth. Apply 10 mins on, 10 mins off.' }
    ],
    avoidList: [
      { icon: '🦞', name: 'Known Allergens', reason: 'Will immediately retrigger hives', severity: 'HIGH' },
      { icon: '🌡️', name: 'Hot Water / Heat', reason: 'Heat dilates blood vessels, worsens hives', severity: 'HIGH' },
      { icon: '🧪', name: 'Fragranced Products', reason: 'Chemical irritants can trigger or worsen reaction', severity: 'MEDIUM' },
      { icon: '😤', name: 'Stress', reason: 'Psychological stress triggers histamine release', severity: 'MEDIUM' }
    ],
    timeline: [
      { period: 'Hours 1–6', title: 'Acute Phase', desc: 'Take antihistamine, avoid trigger, apply cold compress.', status: 'active' },
      { period: 'Day 1–2', title: 'Resolution', desc: 'Most acute hives resolve within 24–48 hours with antihistamines.', status: 'future' },
      { period: 'Week 1', title: 'Trigger Identification', desc: 'Work with doctor to identify allergen via allergy testing.', status: 'future' },
      { period: 'Ongoing', title: 'Allergen Avoidance', desc: 'Once trigger identified, strict avoidance prevents recurrence.', status: 'future' }
    ],
    doctorNote: 'EMERGENCY: If experiencing throat swelling, difficulty breathing, or dizziness alongside hives — call emergency services immediately (anaphylaxis).'
  },

  seborrheic_dermatitis: {
    id: 'seborrheic_dermatitis',
    name: 'Seborrheic Dermatitis',
    medicalName: 'Seborrheic Dermatitis',
    category: 'Inflammatory Skin Condition',
    emoji: '🟡',
    emergencyLevel: 'low',
    description: 'A common skin condition causing scaly patches, red skin, and stubborn dandruff, mainly on oily areas.',
    warning: 'While not dangerous, untreated seborrheic dermatitis can become secondarily infected. Maintain consistent treatment.',
    causes: ['Malassezia yeast overgrowth', 'Excess oil production', 'Immune response', 'Neurological conditions'],
    triggers: ['Stress', 'Weather changes', 'Oily skin', 'Fatigue', 'Hormonal changes'],
    symptoms: ['Flaky skin/dandruff', 'White or yellow scales', 'Red skin patches', 'Itching', 'Affected areas: scalp, face, chest'],
    similarConditions: [
      { name: 'Psoriasis', pct: 62 },
      { name: 'Eczema', pct: 48 },
      { name: 'Rosacea', pct: 35 }
    ],
    actionPlan: [
      { urgency: 'today', title: 'Use medicated shampoo', desc: 'Start ketoconazole 2% or selenium sulfide shampoo. Leave on 5 minutes before rinsing.', tag: 'today' },
      { urgency: 'today', title: 'Apply antifungal cream to face', desc: 'Ketoconazole cream to affected face areas. Avoid eyes. Once daily for 4 weeks.', tag: 'today' },
      { urgency: 'ongoing', title: 'Maintenance washing', desc: 'Use medicated shampoo 2x/week ongoing after initial treatment.', tag: 'ongoing' },
      { urgency: 'ongoing', title: 'Manage stress levels', desc: 'Stress is a major flare trigger. Practice stress reduction techniques.', tag: 'week' }
    ],
    products: [
      { icon: '🧴', name: 'Nizoral (Ketoconazole 2%) Shampoo', type: 'Antifungal Shampoo', desc: 'First-line treatment. Use 3x/week for 4 weeks, then 1x/week maintenance.' },
      { icon: '🧴', name: 'Selsun Blue (Selenium Sulfide)', type: 'OTC Shampoo', desc: 'Reduces Malassezia yeast on scalp.' },
      { icon: '💊', name: 'Ketoconazole Cream 2%', type: 'Prescription/OTC', desc: 'For facial seborrheic dermatitis. Once daily for 4 weeks.' },
      { icon: '🌿', name: 'Zinc Pyrithione Bar', type: 'Cleanser', desc: 'Antifungal properties for face and body wash.' }
    ],
    avoidList: [
      { icon: '🧼', name: 'Harsh Soaps', reason: 'Disrupt skin microbiome and worsen condition', severity: 'MEDIUM' },
      { icon: '🌡️', name: 'Extreme Temperatures', reason: 'Temperature changes trigger flares', severity: 'MEDIUM' },
      { icon: '😤', name: 'Stress', reason: 'Immune dysregulation worsens Malassezia growth', severity: 'HIGH' },
      { icon: '🍷', name: 'Alcohol (topical products)', reason: 'Drying alcohol worsens flaking and irritation', severity: 'MEDIUM' }
    ],
    timeline: [
      { period: 'Week 1–2', title: 'Initial Treatment', desc: 'Medicated shampoo starts killing yeast. Scaling reduces.', status: 'active' },
      { period: 'Month 1', title: 'Significant Improvement', desc: 'Flaking and redness substantially reduced.', status: 'future' },
      { period: 'Month 2', title: 'Clear Skin', desc: 'Condition clears. Switch to maintenance dosing.', status: 'future' },
      { period: 'Ongoing', title: 'Maintenance', desc: '1x/week medicated shampoo prevents recurrence.', status: 'future' }
    ],
    doctorNote: 'See a doctor if condition does not improve in 4 weeks or spreads to unusual areas.'
  }
};

// All conditions list for random selection
const CONDITION_KEYS = Object.keys(CONDITIONS);

// Confidence ranges by skin type for realism
const CONFIDENCE_BY_CONDITION = {
  eczema: { min: 72, max: 95 },
  psoriasis: { min: 68, max: 91 },
  acne: { min: 83, max: 97 },
  ringworm: { min: 74, max: 93 },
  melanoma: { min: 55, max: 78 },
  rosacea: { min: 70, max: 90 },
  hives: { min: 79, max: 96 },
  seborrheic_dermatitis: { min: 66, max: 89 }
};

module.exports = { CONDITIONS, CONDITION_KEYS, CONFIDENCE_BY_CONDITION };

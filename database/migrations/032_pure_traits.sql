-- ============================================================
-- Migration 032: Pure Traits (4 new single-dimension archetypes)
--
-- Adds the 4 single-DISC-dimension "Pure Trait" archetypes alongside the
-- existing 12 two-letter blends, in BOTH trait-content tables:
--   * personality_traits  (drives the corporate dashboard + the exam-engine
--                           dominant_trait_id lookup by code)
--   * aci_traits           (ACI content set, keyed by trait_code)
--
-- The engine emits one of these codes (D/I/S/C) when a single DISC dimension is
-- dominant enough — see backend/exam-engine/internal/service/disc_trait.go.
--
-- Archetype names + content below MATCH the style of the existing 12 rows:
--   - personality_traits: a short archetype name + a 3-sentence blended_style_desc
--     (metadata stays '{}', exactly like all 12 existing rows).
--   - aci_traits: a "The <Name>" title + a multi-paragraph personalized_insight +
--     a score_overview_interpretation = opener + the shared ACI band table +
--     a tailored micro-habit table. short_summary stays NULL and
--     detailed_overview stays '' to match the existing rows.
--   No DISC letters (D/I/S/C) appear in any name or copy.
--
-- Idempotent / re-runnable: rows are inserted only when missing, then every
-- pure row's content is (re)set by UPDATE — so re-running converges to the
-- canonical content with no duplicates and no FK-breaking deletes.
-- Additive only: no existing blend row is modified or removed.
-- Rollback: UPDATE ... SET is_deleted=true WHERE code/trait_code IN ('D','I','S','C').
-- ============================================================
BEGIN;

-- ── personality_traits ──────────────────────────────────────────────────────
-- 1) ensure the 4 rows exist
INSERT INTO personality_traits (code, blended_style_name, color_rgb, metadata, is_active, is_deleted)
SELECT v.code, v.name, v.color, '{}'::jsonb, true, false
FROM (VALUES
        ('D', 'Bold Driver',           '255,49,49'),
        ('I', 'Inspiring Motivator',   '232,178,54'),
        ('S', 'Steadfast Anchor',      '0,173,76'),
        ('C', 'Precise Perfectionist', '74,198,234')
     ) AS v(code, name, color)
WHERE NOT EXISTS (SELECT 1 FROM personality_traits p WHERE p.code = v.code);

-- 2) set canonical content for the 4 rows (fixes any pre-existing pure rows too)
UPDATE personality_traits p SET
    blended_style_name = v.name,
    blended_style_desc = v.descr,
    color_rgb          = v.color,
    is_active          = true,
    is_deleted         = false
FROM (VALUES
    ('D', 'Bold Driver', '255,49,49',
     $pd_d$Direct, driven, and results-focused, Bold Drivers take charge of challenges and push decisively toward their goals. They make fast decisions, thrive under pressure, and are energised by competition and ownership. Their drive moves things forward, though they may come across as blunt or impatient when others need more time.$pd_d$),
    ('I', 'Inspiring Motivator', '232,178,54',
     $pd_i$Outgoing, expressive, and people-first, Inspiring Motivators light up a room and win others over with optimism and warmth. They build rapport quickly, spark enthusiasm, and thrive on collaboration and recognition. Their persuasive energy creates momentum, though they may favour connection over detail or follow-through.$pd_i$),
    ('S', 'Steadfast Anchor', '0,173,76',
     $pd_s$Calm, patient, and dependable, Steadfast Anchors bring steadiness and harmony to the teams they join. They listen closely, support others consistently, and value stability, trust, and a measured pace. Their reliability holds groups together, though they may resist sudden change or set their own needs aside to keep the peace.$pd_s$),
    ('C', 'Precise Perfectionist', '74,198,234',
     $pd_c$Analytical, careful, and quality-driven, Precise Perfectionists hold a high bar for accuracy and structure. They think things through, rely on evidence, and produce work that stands up to scrutiny. Their precision raises standards, though they may over-analyse or hold back until the information feels complete.$pd_c$)
) AS v(code, name, color, descr)
WHERE p.code = v.code;

-- ── aci_traits ──────────────────────────────────────────────────────────────
-- 1) ensure the 4 rows exist (detailed_overview '' / short_summary NULL match existing)
INSERT INTO aci_traits (trait_code, trait_title, detailed_overview, is_active, is_deleted)
SELECT v.code, v.title, '', true, false
FROM (VALUES
        ('D', 'The Bold Driver'),
        ('I', 'The Inspiring Motivator'),
        ('S', 'The Steadfast Anchor'),
        ('C', 'The Precise Perfectionist')
     ) AS v(code, title)
WHERE NOT EXISTS (SELECT 1 FROM aci_traits a WHERE a.trait_code = v.code);

-- 2) set canonical content. score_overview_interpretation is assembled as
--    opener + the shared ACI band table (s.bands) + the trait's micro-habit table.
UPDATE aci_traits a SET
    trait_title                    = v.title,
    personalized_insight           = v.insight,
    score_overview_interpretation  = v.opener || E'\n' || s.bands || E'\n' || v.micro,
    detailed_overview              = '',
    is_active                      = true,
    is_deleted                     = false
FROM (VALUES
    ('D', 'The Bold Driver',
     $ins_d$You bring a natural drive for results, ownership, and forward motion into everything you do. When you set a goal, you pursue it decisively — making quick calls, removing obstacles, and keeping momentum even when others hesitate. You thrive in environments that reward initiative, autonomy, and measurable progress.
The Agile Compatibility Index reveals how this drive translates into sustainable outcomes — how well you stay open to other views, how you keep teams with you while moving fast, and how you respond when progress stalls.
Your results reflect a personality that leads through action and decisiveness. You are likely to set direction confidently and hold a high bar for delivery. Your courage and bias for action are among your strongest Agile strengths.
At times, your challenge lies in pacing — slowing down enough to listen, to invite input, and to let others contribute at their own speed. Building patience and shared ownership turns individual drive into lasting team performance.
When your ACI score is high, it shows you have learned to pair drive with empathy — delivering results while bringing people with you. A moderate or developing score points to the next step: listening more deeply, delegating with trust, and valuing the process as much as the outcome.$ins_d$,
     $op_d$You lead with decisiveness and drive, showing strong Courage and initiative. Continue building Openness and Respect to bring others fully along with you.$op_d$,
     $mh_d$Agile Value
Behavioral Reflection
Suggested Micro-habit for Growth
Commitment
You drive hard toward goals and rarely let things stall.
🎯 End each week by checking which commitments you kept, not just what you started.
Focus
You move fast and decisively on what matters most.
🕐 Pause before the next push to confirm the current priority is the right one.
Openness
You back your own judgement strongly.
💬 Invite one dissenting view on each big decision before you commit.
Respect
You are direct and results-first.
👂 Open conversations by acknowledging the other person's effort before steering to outcomes.
Courage
You take bold, decisive action.
💡 Use that courage to make space for quieter voices, not only to push your own.$mh_d$),

    ('I', 'The Inspiring Motivator',
     $ins_i$You bring a natural spark of energy, optimism, and connection into everything you do. When something excites you, you draw others in — building relationships, lifting morale, and turning ideas into shared momentum. You thrive in open, collaborative settings where expression and recognition are welcome.
The Agile Compatibility Index reveals how this people-energy becomes results — how well you sustain focus, follow through once the excitement fades, and stay grounded when feedback is critical.
Your results reflect a personality that leads through influence and enthusiasm. You are likely to communicate openly, rally teams, and adapt quickly to new situations. Your openness and warmth are among your strongest Agile strengths.
At times, your challenge lies in consistency — staying with the detail and the finish when the spotlight moves on. Building focus and steady routines helps you convert bright starts into strong finishes.
When your ACI score is high, it shows you have learned to combine passion with discipline — inspiring others while staying accountable. A moderate or developing score points to the next step: deepening focus, honouring commitments, and balancing expression with listening.$ins_i$,
     $op_i$You energise others and adapt with ease, showing strong Openness and Courage. Continue building Focus and Commitment to turn enthusiasm into consistent delivery.$op_i$,
     $mh_i$Agile Value
Behavioral Reflection
Suggested Micro-habit for Growth
Commitment
You start with energy; finishing is where your growth lies.
🎯 Set a weekly "done review" to close out tasks before chasing new ones.
Focus
Your ideas flow fast; channelling them adds power.
🕐 Pick one priority each morning and protect it from distraction.
Openness
You embrace new people and ideas naturally.
💬 Balance enthusiasm by asking "what could go wrong?" on each new idea.
Respect
You connect warmly and inclusively.
👂 Make space to listen fully before adding your own view.
Courage
You speak up and rally others fearlessly.
💡 Use that voice to surface hard truths, not only to inspire.$mh_i$),

    ('S', 'The Steadfast Anchor',
     $ins_s$You bring a natural sense of calm, reliability, and care into everything you do. You support the people around you, keep your commitments, and create the steady rhythm that teams depend on. You thrive in stable, trusting environments where cooperation matters more than competition.
The Agile Compatibility Index reveals how this steadiness adapts to change — how you respond when priorities shift suddenly, how you voice your own views, and how you keep momentum when the path is uncertain.
Your results reflect a personality that leads through consistency and trust. You are likely to follow through dependably and bring harmony to the group. Your commitment and respect for others are among your strongest Agile strengths.
At times, your challenge lies in flexibility — adjusting quickly when plans change and speaking up for your own ideas. Practising small, low-risk changes builds your comfort with ambiguity and pace.
When your ACI score is high, it shows you have learned to pair dependability with adaptability — staying steady while embracing change. A moderate or developing score points to the next step: welcoming change sooner, sharing your perspective openly, and trusting yourself to move faster.$ins_s$,
     $op_s$You bring steadiness and trust to every team, showing strong Commitment and Respect. Continue building Courage and Openness to adapt confidently when priorities change.$op_s$,
     $mh_s$Agile Value
Behavioral Reflection
Suggested Micro-habit for Growth
Commitment
You follow through dependably and keep your word.
🎯 Acknowledge your steady wins openly — consistency is worth celebrating.
Focus
You stay calm and on-task under pressure.
🕐 When priorities shift, re-plan quickly rather than waiting for certainty.
Openness
You value stability and proven approaches.
💬 Try one small new method each week to stretch your comfort with change.
Respect
You support others patiently and listen well.
👂 Share your own needs and views as openly as you honour others'.
Courage
You hold steady through difficulty.
💡 Practise voicing disagreement early, while it is still easy to address.$mh_s$),

    ('C', 'The Precise Perfectionist',
     $ins_c$You bring a natural commitment to accuracy, structure, and quality into everything you do. You think carefully, rely on evidence, and hold high standards for the work you produce. You thrive in environments where precision, fairness, and clear expectations are valued.
The Agile Compatibility Index reveals how this rigour meets agility — how openly you embrace new ideas, how you balance analysis with speed, and how you collaborate when others work less methodically.
Your results reflect a personality that leads through quality and reliability. You are likely to uphold standards and bring discipline to the team. Your commitment and focus are among your strongest Agile strengths.
At times, your challenge lies in flexibility — acting before every detail is certain and staying open to imperfect but workable ideas. Setting review cut-offs and inviting other viewpoints helps you add speed to your precision.
When your ACI score is high, it shows you have learned to combine discipline with openness — upholding standards while adapting with ease. A moderate or developing score points to the next step: trusting momentum, welcoming experimentation, and adding warmth to your communication.$ins_c$,
     $op_c$You combine discipline with high standards, showing strong Commitment and Focus. Continue building Openness and Respect to pair precision with flexibility.$op_c$,
     $mh_c$Agile Value
Behavioral Reflection
Suggested Micro-habit for Growth
Commitment
You never compromise on quality. Consistency is your signature.
🎯 Set a weekly "done review" to celebrate completed work before starting new tasks.
Focus
Your clarity is a strength; flexibility will add speed.
🕐 Schedule short "review cut-off" times to avoid over-analysis.
Openness
You tend to value facts over feelings.
💬 Ask a peer for one creative idea each week and try it without judging the outcome.
Respect
You communicate formally; adding warmth builds connection.
👂 Start feedback with appreciation before suggesting improvement.
Courage
You hold strong, principled standards.
💡 Encourage others to speak openly by modelling calm, transparent dialogue.$mh_c$)
) AS v(code, title, insight, opener, micro),
(VALUES ($bands$Score Range
Level Name
Compatibility Tag
Interpretation (for report or tooltip)
100 – 125
Agile Naturalist
🌿 Embodies agility instinctively; thrives in collaboration and adapts with ease.
You live the Agile mindset naturally — showing balance between speed, empathy, and accountability. You take initiative, adapt fast, and sustain performance even under pressure. Continue mentoring others to bring this maturity into your team culture.
75 – 99
Agile Adaptive
⚡ Shows strong energy, adaptability, and creative courage with growing consistency.
You are quick to learn and adjust to change. You work well in dynamic situations and often motivate others through your enthusiasm. Focus on sustaining effort over time and grounding your pace with structure — that is where long-term excellence will grow.
50 – 74
Agile Learner
🌱 Understands Agile values conceptually but applies them inconsistently.
You show openness to Agile ideas and collaboration but may need guidance or structured environments to stay consistent. Practice patience, feedback acceptance, and steady follow-through — agility will grow stronger with discipline and reflection.
Below 50
Agile Resistant
🧩 Prefers control and predictability; finds comfort in fixed systems and routines.
You may feel uncertain when faced with change or fast-moving teamwork. This does not mean resistance to learning — it indicates the need for more trust and gradual exposure to flexible environments. Begin with small experiments: shorter plans, open discussions, and shared decisions.$bands$)) AS s(bands)
WHERE a.trait_code = v.code;

COMMIT;

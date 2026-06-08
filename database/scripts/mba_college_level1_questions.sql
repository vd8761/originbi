-- ============================================================
-- MBA College Level-1 main questions import (auto-generated)
-- Source: C:\Users\Sriharan\Downloads\MBA Questions (2).xlsx
-- Sets: Set 1, Set 2, Set 3
-- Program: COLLEGE_STUDENT | Level: 1 | marker: mba_xlsx_v1
-- Re-runnable: the preamble removes any prior rows with this marker.
-- ============================================================
BEGIN;

-- Idempotency: clear any previous import of THIS batch (by source marker).
DELETE FROM assessment_question_options o
 USING assessment_questions q
 WHERE o.question_id = q.id AND q.metadata->>'source' = 'mba_xlsx_v1';
DELETE FROM assessment_questions WHERE metadata->>'source' = 'mba_xlsx_v1';

-- ---------- Set 1 (40 questions) ----------
-- Set 1 Q1
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are three weeks into your MBA term. You have a case analysis due in 36 hours, an unread research paper that forms the foundation of it, and a consulting club meeting tonight that could lead to a live project opportunity. You cannot do all three properly.', 'What is your first move?', 'உங்கள் MBA பருவத்தில் மூன்று வாரங்கள் முடிந்துவிட்டன. 36 மணி நேரத்தில் ஒரு வழக்கு ஆய்வைச் சமர்ப்பிக்க வேண்டும், அதற்கு அடித்தளமாக அமையும் படிக்கப்படாத ஒரு ஆய்வுக் கட்டுரை உள்ளது, மேலும் இன்று இரவு நடைபெறும் ஆலோசனை மன்றக் கூட்டம் ஒரு நேரடித் திட்ட வாய்ப்பிற்கு வழிவகுக்கக்கூடும். இந்த மூன்றையும் உங்களால் முறையாகச் செய்ய முடியாது.', 'உங்கள் முதல் நகர்வு என்ன?',
     '{"theme": "Academic Pressure & Performance", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Drop the club meeting without overthinking it - the submission is what matters and I will chase the next opportunity when it comes.', 'அதிகமாக யோசிக்காமல் மன்றக் கூட்டத்தை விட்டுவிடுங்கள் - சமர்ப்பிப்புதான் முக்கியம், அடுத்த வாய்ப்பு வரும்போது அதைத் தேடிக்கொள்வேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Attend the meeting for the first hour, make the connection count, then pull an all-nighter on the case - I can manage both if I''m sharp about it.', 'முதல் ஒரு மணி நேரத்திற்கு கூட்டத்தில் கலந்துகொள்வது, கிடைத்த தொடர்பை சரியாகப் பயன்படுத்திக்கொள்வது, பிறகு அந்த வழக்கில் இரவு முழுவதும் கண்விழித்திருப்பது - நான் சுறுசுறுப்பாக இருந்தால் இரண்டையும் என்னால் சமாளிக்க முடியும்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Check with a batchmate first - if someone can share notes from the meeting, I can protect both without sacrificing either.', 'முதலில் சக வகுப்பு மாணவரிடம் கேட்டுப் பாருங்கள் - யாராவது கூட்டத்தின் குறிப்புகளைப் பகிர முடிந்தால், எதையும் இழக்காமல் இரண்டையும் என்னால் பாதுகாக்க முடியும்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Block the next two hours to read the paper before deciding anything - I cannot make a good call without knowing what the case actually requires.', 'எதையும் முடிவு செய்வதற்கு முன், அந்த அறிக்கையைப் படிப்பதற்காக அடுத்த இரண்டு மணி நேரத்தை ஒதுக்குங்கள் - இந்த வழக்கிற்கு உண்மையில் என்ன தேவை என்பதை அறியாமல் என்னால் ஒரு நல்ல முடிவை எடுக்க முடியாது.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q2
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your professor returns your individual case assignment. You scored in the middle of the curve. Your analysis was solid but your recommendation, according to the feedback, was "safe and insufficiently bold." Two of your batchmates who took a riskier position scored significantly higher.', 'What do you do with this feedback?', 'உங்கள் பேராசிரியர் உங்களுக்கான தனிப்பட்ட வழக்கு ஆய்வைத் திருப்பித் தருகிறார். நீங்கள் சராசரி மதிப்பெண் வளைவின் நடுவில் பெற்றீர்கள். உங்கள் பகுப்பாய்வு சிறப்பாக இருந்தது, ஆனால் பின்னூட்டத்தின்படி, உங்கள் பரிந்துரை "பாதுகாப்பானதாகவும், போதுமான அளவு துணிச்சல் அற்றதாகவும்" இருந்தது. அதிக இடர் நிறைந்த ஒரு நிலைப்பாட்டை எடுத்த உங்கள் சக மாணவர்களில் இருவர், உங்களை விடக் கணிசமாக அதிக மதிப்பெண்களைப் பெற்றனர்.', 'இந்தக் கருத்துக்களைக் கொண்டு நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Academic Pressure & Performance", "dimension": "accuracy_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Note it and move on - I will recalibrate in the next assignment. Dwelling on one grade is a waste of energy.', 'இதைக் குறித்துக்கொண்டு அடுத்த வேலைக்குச் செல்லுங்கள் - அடுத்தப் பணியில் நான் சரிசெய்துகொள்வேன். ஒரே மதிப்பெண்ணைப் பற்றியே சிந்தித்துக்கொண்டிருப்பது ஆற்றலை வீணடிப்பதாகும்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'Talk to the batchmates who scored higher - I want to understand what their thinking process looked like.', 'அதிக மதிப்பெண் பெற்ற சக மாணவர்களிடம் பேசுங்கள் - அவர்களின் சிந்தனைப் போக்கு எப்படி இருந்தது என்பதை நான் தெரிந்துகொள்ள விரும்புகிறேன்.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'Sit with the feedback for a day before responding to it - I want to absorb it properly, not react to it.', 'பின்னூட்டத்திற்குப் பதிலளிக்கும் முன், அதை ஒரு நாள் யோசித்துப் பாருங்கள் - நான் அதற்கு எதிர்வினையாற்ற விரும்பவில்லை, அதைச் சரியாக உள்வாங்கிக்கொள்ள விரும்புகிறேன்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'Go back through my original analysis and identify exactly where my reasoning became conservative - I need to locate the precise moment I pulled back.', 'எனது அசல் பகுப்பாய்வை மீண்டும் படித்துப் பார்த்து, எனது பகுத்தறிவு எப்போது பழமைவாதமாக மாறியது என்பதைத் துல்லியமாகக் கண்டறியுங்கள் - நான் எப்போது பின்வாங்கினேன் என்ற சரியான தருணத்தை நான் கண்டுபிடிக்க வேண்டும்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q3
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are preparing for your end-term presentation. Two hours before, you realize your central argument rests on a data point you can no longer verify. Correcting it properly would take three hours and force you to restructure your entire narrative. Leaving it means presenting something you cannot fully stand behind.', 'Which of these feels more unacceptable to you?', 'நீங்கள் உங்கள் பருவத் தேர்வு விளக்கக்காட்சிக்குத் தயாராகிக் கொண்டிருக்கிறீர்கள். இரண்டு மணி நேரத்திற்கு முன்பு, உங்கள் மைய வாதம் உங்களால் இனி சரிபார்க்க முடியாத ஒரு தரவுப் புள்ளியைச் சார்ந்துள்ளது என்பதை உணர்கிறீர்கள். அதை முறையாகச் சரிசெய்வதற்கு மூன்று மணி நேரம் ஆகும், மேலும் அது உங்கள் முழு விளக்கமுறையையும் மறுசீரமைக்க உங்களைக் கட்டாயப்படுத்தும். அதை அப்படியே விட்டுவிடுவது என்பது, உங்களால் முழுமையாக ஆதரிக்க முடியாத ஒன்றை முன்வைப்பதாகும்.', 'இவற்றில் எது உங்களுக்கு மிகவும் ஏற்றுக்கொள்ள முடியாததாகத் தோன்றுகிறது?',
     '{"theme": "Academic Pressure & Performance", "dimension": "control_need vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Presenting with a structural gap - I would rather restructure under pressure than knowingly present something weak.', 'கட்டமைப்பு இடைவெளியுடன் முன்வைப்பது - தெரிந்தே பலவீனமான ஒன்றை முன்வைப்பதை விட, நெருக்கடியின் கீழ் அதை மறுசீரமைப்பதே மேல்.', 'C', '{"raw_factor": "C over D", "dimension": "control_need vs accuracy_need"}'),
  (2, 'Missing the presentation slot entirely - the audience and the moment matter more than achieving perfection in the content.', 'விளக்கக்காட்சி நேரத்தை முற்றிலுமாகத் தவறவிடுதல் - உள்ளடக்கத்தில் முழுமை அடைவதை விட, பார்வையாளர்களுக்கும் அந்தத் தருணத்திற்கும் அதிக முக்கியத்துவம்.', 'D', '{"raw_factor": "D over C", "dimension": "control_need vs accuracy_need"}'),
  (3, 'Letting the team down by changing course this late - they prepared around this structure and I owe them stability.', 'இவ்வளவு தாமதமாகத் திட்டத்தை மாற்றுவதன் மூலம் அணியைக் கைவிடுகிறீர்கள் - அவர்கள் இந்தக் கட்டமைப்பைச் சுற்றியே தங்களைத் தயார்படுத்திக் கொண்டார்கள், அவர்களுக்கு நிலைத்தன்மையைக் கொடுக்க நான் கடமைப்பட்டுள்ளேன்.', 'S', '{"dimension": "control_need vs accuracy_need"}'),
  (4, 'Being seen struggling in public - I need to find a way to present confidently regardless of what''s underneath.', 'பொதுவெளியில் சிரமப்படுவதாகக் கருதப்படுவதால் - என் உள்மனம் எப்படி இருந்தாலும், நம்பிக்கையுடன் வெளிப்பட ஒரு வழியைக் கண்டுபிடிக்க வேண்டும்.', 'I', '{"dimension": "control_need vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q4
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You worked harder on this term''s case competition than on anything else so far. Your team did not make it past the first rounThe winning team''s approach was bolder but, in your honest assessment, less rigorous than yours.', 'Before you say anything to your team - what is actually happening inside you?', 'இதுவரை நடந்தவற்றில், இந்தப் பருவத்தின் வழக்கு ஆய்வுப் போட்டியில் நீங்கள் மற்ற எதையும் விடக் கடினமாக உழைத்தீர்கள். உங்கள் அணி முதல் சுற்றைத் தாண்டவில்லை. வெற்றி பெற்ற அணியின் அணுகுமுறை துணிச்சலானதாக இருந்தது, ஆனால் உங்கள் நேர்மையான மதிப்பீட்டின்படி, உங்களுடையதை விடக் கடுமை குறைந்ததாக இருந்தது.', 'உங்கள் குழுவிடம் எதையும் சொல்வதற்கு முன் - உங்களுக்குள் உண்மையில் என்ன நடக்கிறது?',
     '{"theme": "Academic Pressure & Performance", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A quiet, cold determination - I am already thinking about what I will do differently next time and I do not want to process the emotion right now.', 'அமைதியான, உணர்ச்சியற்ற ஒரு உறுதி - அடுத்த முறை என்ன வித்தியாசமாகச் செய்யப் போகிறேன் என்று இப்போதே யோசிக்கத் தொடங்கிவிட்டேன், அந்த உணர்வை இப்போது உள்வாங்கிக்கொள்ள நான் விரும்பவில்லை.', 'D', '{"dimension": "approval_need"}'),
  (2, 'Genuine hurt - not about losing but about the fact that the room did not see what we built as worthy.', 'உண்மையான வருத்தம் - தோற்றதினால் அல்ல, மாறாக நாங்கள் உருவாக்கியதை அந்த அறை தகுதியானதாகக் கருதவில்லை என்பதனால்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'Concern for your teammates - you are watching their faces and wondering who is taking this hardest and whether you held the team together well enough.', 'உங்கள் அணி வீரர்கள் மீதான அக்கறை - நீங்கள் அவர்களின் முகங்களைப் பார்த்து, இதை யார் மிகவும் கடினமாக எடுத்துக்கொள்கிறார்கள் என்றும், அணியை நீங்கள் போதுமான அளவு ஒன்றுசேர்த்து வைத்திருந்தீர்களா என்றும் யோசிப்பீர்கள்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'A specific frustration - you keep returning to the exact decision point where you think the evaluation went wrong, and you want to understand the logic that produced this result.', 'ஒரு குறிப்பிட்ட விரக்தி - மதிப்பீடு தவறாகிவிட்டது என்று நீங்கள் நினைக்கும் அதே முடிவெடுக்கும் இடத்திற்கே மீண்டும் மீண்டும் வந்துவிடுகிறீர்கள், மேலும் இந்த முடிவை உருவாக்கிய தர்க்கத்தைப் புரிந்துகொள்ள விரும்புகிறீர்கள்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q5
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your five-person study group has an unspoken problem. One member consistently produces below-standard work, and the others are quietly compensating. Nobody has said anything directly. Submissions are in four days.', 'What do you do today?', 'உங்கள் ஐந்து பேர் கொண்ட படிப்புக் குழுவில் ஒரு சொல்லப்படாத சிக்கல் உள்ளது. உறுப்பினர்களில் ஒருவர் தொடர்ந்து தரம் குறைந்த படைப்புகளைச் சமர்ப்பிக்கிறார், மற்றவர்கள் அதை அமைதியாக ஈடுசெய்கிறார்கள். யாரும் நேரடியாக எதுவும் சொல்லவில்லை. படைப்புகளைச் சமர்ப்பிக்க இன்னும் நான்கு நாட்கள் உள்ளன.', 'நீங்கள் இன்று என்ன செய்கிறீர்கள்?',
     '{"theme": "Team & Group Dynamics", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Bring it into the open at the next team meeting - the silence is making it worse and someone has to name it.', 'அடுத்த குழு கூட்டத்தில் இதை வெளிப்படையாகப் பேசுங்கள் - இந்த மௌனம் நிலைமையை மேலும் மோசமாக்குகிறது, யாராவது ஒருவர் இதற்குப் பெயரிட்டாக வேண்டும்.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Have an informal coffee conversation with the underperforming member - a private, low-pressure conversation often moves things that a formal one cannot.', 'செயல்திறன் குறைந்த உறுப்பினருடன் இயல்பாகக் காபி அருந்திக்கொண்டே உரையாடுங்கள் - ஒரு முறையான உரையாடலால் சாதிக்க முடியாததை, தனிப்பட்ட, அழுத்தமற்ற உரையாடல் பெரும்பாலும் சாதிக்கும்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Talk to the other three members first to understand how they are feeling before doing anything - I do not want to act in a way that fractures the group.', 'எதையும் செய்வதற்கு முன், மற்ற மூன்று உறுப்பினர்களிடம் முதலில் பேசி அவர்கள் எப்படி உணர்கிறார்கள் என்பதைப் புரிந்துகொள் - நான் குழுவைப் பிளவுபடுத்தும் விதத்தில் செயல்பட விரும்பவில்லை.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Redistribute the work based on actual competency for this submission and raise the structural issue after - the immediate deliverable comes first.', 'இந்தச் சமர்ப்பிப்பிற்காக, உண்மையான தகுதியின் அடிப்படையில் பணியைப் பகிர்ந்தளித்து, கட்டமைப்புச் சிக்கலை அதன் பிறகு எழுப்புங்கள் - உடனடிப் பணி நிறைவே முதன்மையானது.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q6
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your closest friend in the batch is also in your study group. During a late-night working session, they give you feedback on your section that you find unfair and slightly publiOthers heard it.', 'How do you respond?', 'உங்கள் வகுப்பில் உங்களுக்கு மிகவும் நெருங்கிய நண்பர் உங்கள் படிப்புக் குழுவிலும் இருக்கிறார். ஒரு நள்ளிரவுப் படிப்பு அமர்வின்போது, ​​உங்கள் பாடப்பகுதி குறித்து அவர் வழங்கும் கருத்து உங்களுக்கு நியாயமற்றதாகவும், சற்றே பகிரங்கமானதாகவும் தோன்றுகிறது. மற்றவர்களும் அதைக் கேட்டிருக்கிறார்கள்.', 'நீங்கள் எப்படிப் பதிலளிக்கிறீர்கள்?',
     '{"theme": "Team & Group Dynamics", "dimension": "relationship_dependency", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Address it in the moment - I will not let something I disagree with stand unchallenged just because it came from a frien', 'அதை அந்தத் தருணத்திலேயே கையாளுங்கள் - ஒரு நண்பரிடமிருந்து வந்தது என்பதற்காக மட்டும், நான் உடன்படாத ஒரு விஷயத்தை கேள்விக்குட்படுத்தாமல் விடமாட்டேன்.', 'D', '{"dimension": "relationship_dependency"}'),
  (2, 'Make a light remark that signals I noticed without escalating - then have a real conversation with them later privately.', 'பிரச்சனையை பெரிதாக்காமல், நான் கவனித்தேன் என்பதை உணர்த்தும் வகையில் இயல்பாகக் கூறிவிட்டு, பின்னர் தனிப்பட்ட முறையில் அவர்களுடன் உண்மையாக உரையாடுங்கள்.', 'I', '{"dimension": "relationship_dependency"}'),
  (3, 'Let it go in the room - but I will need to have an honest conversation with them one-on-one before this affects how I work with them.', 'இதை அந்த அறைக்குள் விட்டுவிடுவோம் - ஆனால், இது நான் அவர்களுடன் பணிபுரியும் விதத்தைப் பாதிப்பதற்கு முன்பு, நான் அவர்களுடன் தனிப்பட்ட முறையில் நேர்மையாகப் பேச வேண்டியிருக்கும்.', 'S', '{"dimension": "relationship_dependency"}'),
  (4, 'Finish the session professionally and review whether their feedback had any merit before deciding how to respond - emotion should not drive my reaction.', 'அமர்வை தொழில்முறையாக முடித்து, எவ்வாறு பதிலளிப்பது என முடிவு செய்வதற்கு முன், அவர்களின் கருத்தில் ஏதேனும் தகுதி உள்ளதா என்பதை மதிப்பாய்வு செய்யுங்கள் - என் எதிர்வினையை உணர்ச்சி தீர்மானிக்கக் கூடாது.', 'C', '{"dimension": "relationship_dependency"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q7
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your group is two days from a major submission. The team has reached a genuine impasse - two members want to go in one direction, two in another, and everyone is waiting for you to decide. Both directions are defensible. Making a call will upset someone either way.', 'What matters more to you in this moment?', 'உங்கள் குழு ஒரு முக்கிய சமர்ப்பிப்பிற்கு இன்னும் இரண்டு நாட்களே உள்ளது. குழுவில் ஒரு உண்மையான முட்டுக்கட்டை ஏற்பட்டுள்ளது - இரண்டு உறுப்பினர்கள் ஒரு திசையிலும், மற்ற இருவர் மற்றொரு திசையிலும் செல்ல விரும்புகிறார்கள், மேலும் அனைவரும் உங்கள் முடிவிற்காகக் காத்திருக்கிறார்கள். இரண்டு திசைகளுமே நியாயமானவையே. எப்படியிருந்தாலும் ஒரு முடிவை எடுப்பது யாரையாவது அதிருப்தி அடையச் செய்யும்.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Team & Group Dynamics", "dimension": "stability_need vs decision_speed", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Making the call decisively - a clear decision made now is better than the right decision made too late.', 'தீர்க்கமான முடிவை எடுத்தல் - சரியான முடிவை மிகவும் தாமதமாக எடுப்பதை விட, இப்போது எடுக்கப்படும் ஒரு தெளிவான முடிவு சிறந்தது.', 'D', '{"raw_factor": "D over S", "dimension": "stability_need vs decision_speed"}'),
  (2, 'Taking another hour to find a synthesis that nobody feels forced into - I would rather lose an hour than lose a person.', 'யாரும் கட்டாயப்படுத்தப்பட்டதாக உணராத ஒரு தொகுப்பைக் கண்டறிய மேலும் ஒரு மணிநேரம் எடுத்துக்கொள்வது - ஒரு நபரை இழப்பதை விட ஒரு மணிநேரத்தை இழப்பதே மேல்.', 'S', '{"raw_factor": "S over D", "dimension": "stability_need vs decision_speed"}'),
  (3, 'Understanding which direction the most influential person in the room is leaning - alignment matters as much as the decision itself.', 'அந்த அறையில் மிகவும் செல்வாக்கு மிக்க நபர் எந்தப் பக்கம் சாய்கிறார் என்பதைப் புரிந்துகொள்வது - முடிவைப் போலவே அவரது நிலைப்பாடும் முக்கியமானது.', 'I', '{"dimension": "stability_need vs decision_speed"}'),
  (4, 'Identifying which option has the stronger logical foundation and making the case for it clearly - the team should follow the better argument.', 'எந்த விருப்பத்திற்கு வலுவான தர்க்கரீதியான அடிப்படை உள்ளது என்பதைக் கண்டறிந்து, அதற்கான வாதத்தைத் தெளிவாக முன்வைக்க வேண்டும் - குழு சிறந்த வாதத்தைப் பின்பற்ற வேண்டும்.', 'C', '{"dimension": "stability_need vs decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q8
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You find out that two members of your study group have been meeting separately and making decisions about the project without including you. Nothing malicious - they were just being efficient. But you were not in the room.', 'Before you do anything about it - what does this situation actually feel like?', 'உங்கள் படிப்புக் குழுவின் இரண்டு உறுப்பினர்கள், உங்களைச் சேர்க்காமல் தனித்தனியாகச் சந்தித்து, திட்டம் குறித்து முடிவெடுத்து வருவதை நீங்கள் கண்டறிகிறீர்கள். இதில் எந்தத் தீய நோக்கமும் இல்லை - அவர்கள் தங்கள் வேலையைச் சரியாகச் செய்யவே அவ்வாறு செய்தார்கள். ஆனால், நீங்கள் அந்த அறையில் இல்லை.', 'நீங்கள் இதைப்பற்றி எதுவும் செய்வதற்கு முன் - இந்தச் சூழ்நிலை உண்மையில் எப்படிப்பட்ட உணர்வைத் தருகிறது?',
     '{"theme": "Team & Group Dynamics", "dimension": "relationship_dependency", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Like a gap in control - decisions were made in your domain without your input and that needs to be correcte', 'கட்டுப்பாட்டில் உள்ள இடைவெளியைப் போல - உங்கள் கருத்து கேட்கப்படாமல் உங்கள் அதிகார வரம்பில் முடிவுகள் எடுக்கப்பட்டுள்ளன, அதைச் சரிசெய்ய வேண்டும்.', 'D', '{"dimension": "relationship_dependency"}'),
  (2, 'Like a social signal - you are wondering whether this means something about how they see you within the group.', 'ஒரு சமூக சமிக்ஞையைப் போல - அந்தக் குழுவில் அவர்கள் உங்களை எப்படிப் பார்க்கிறார்கள் என்பதை இது உணர்த்துகிறதா என்று நீங்கள் யோசிக்கிறீர்கள்.', 'I', '{"dimension": "relationship_dependency"}'),
  (3, 'Like a quiet rupture - you thought you had a certain kind of trust with these people and this makes you question it.', 'ஒரு அமைதியான முறிவு போல - இந்த நபர்களிடம் உங்களுக்கு ஒருவித நம்பிக்கை இருப்பதாக நீங்கள் நினைத்திருந்தீர்கள், ஆனால் இது அந்த நம்பிக்கையைக் கேள்விக்குள்ளாக்குகிறது.', 'S', '{"dimension": "relationship_dependency"}'),
  (4, 'Like an information gap - you are not sure what was decided and you need to get current before you can respond to anything else.', 'தகவல் இடைவெளியைப் போல - என்ன முடிவு எடுக்கப்பட்டது என்பது உங்களுக்கு உறுதியாகத் தெரியாது, மேலும் வேறு எதற்கும் பதிலளிப்பதற்கு முன்பு நீங்கள் தற்போதைய நிலவரங்களைத் தெரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "relationship_dependency"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q9
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have been elected section representative. Three weeks in, you realize the faculty coordinator is making decisions that affect your batch without consulting you - not out of malice, simply out of habit. Your batchmates are starting to notice and some are asking why you are not doing more.', 'What do you do?', 'நீங்கள் பிரிவுப் பிரதிநிதியாகத் தேர்ந்தெடுக்கப்பட்டுள்ளீர்கள். மூன்று வாரங்கள் கழித்து, துறை ஒருங்கிணைப்பாளர் உங்களிடம் கலந்தாலோசிக்காமல் உங்கள் குழுவைப் பாதிக்கும் முடிவுகளை எடுக்கிறார் என்பதை நீங்கள் உணர்கிறீர்கள் - அது தீய எண்ணத்தினால் அல்ல, மாறாக ஒரு பழக்கத்தின் காரணமாகவே. உங்கள் குழுத் தோழர்கள் இதைக் கவனிக்கத் தொடங்கியுள்ளனர், மேலும் சிலர் நீங்கள் ஏன் இன்னும் அதிகமாகச் செயல்படவில்லை என்று கேட்கிறார்கள்.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Leadership & Authority", "dimension": "control_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Request a formal meeting with the coordinator and clearly establish what decisions should come through you - the role needs to have real function or it means nothing.', 'ஒருங்கிணைப்பாளருடன் ஒரு முறையான சந்திப்பைக் கோருங்கள், மேலும் எந்தெந்த முடிவுகள் உங்கள் மூலமாகவே எடுக்கப்பட வேண்டும் என்பதைத் தெளிவாக வரையறுத்துக் கொள்ளுங்கள் - அந்தப் பதவிக்கு உண்மையான செயல்பாடு இருக்க வேண்டும், இல்லையெனில் அதற்கு அர்த்தமில்லை.', 'D', '{"dimension": "control_need"}'),
  (2, 'Build a stronger informal relationship with the coordinator first - influence through rapport is more sustainable than influence through structure.', 'முதலில் ஒருங்கிணைப்பாளருடன் ஒரு வலுவான முறைசாரா உறவை உருவாக்குங்கள் - கட்டமைப்பு மூலம் செல்வாக்கு செலுத்துவதை விட, நல்லுறவின் மூலம் செல்வாக்கு செலுத்துவது அதிக காலம் நீடிக்கும்.', 'I', '{"dimension": "control_need"}'),
  (3, 'Talk to your batchmates first and understand their actual concerns before escalating anything - I represent them and I need to know what they really want.', 'எந்தப் பிரச்சினையையும் பெரிதாகப் பேசுவதற்கு முன், முதலில் உங்கள் வகுப்புத் தோழர்களிடம் பேசி, அவர்களின் உண்மையான கவலைகளைப் புரிந்து கொள்ளுங்கள் - நான் அவர்களின் பிரதிநிதி, அவர்களுக்கு உண்மையில் என்ன வேண்டும் என்பதை நான் தெரிந்துகொள்ள வேண்டும்.', 'S', '{"dimension": "control_need"}'),
  (4, 'Document the specific decisions that bypassed you and present a clear case for a revised communication protocol - this needs a structural fix, not just a conversation.', 'உங்களைத் தாண்டி எடுக்கப்பட்ட குறிப்பிட்ட முடிவுகளை ஆவணப்படுத்தி, திருத்தப்பட்ட தகவல் தொடர்பு நெறிமுறைக்கான தெளிவான வாதத்தை முன்வையுங்கள் - இதற்கு வெறும் உரையாடல் அல்ல, ஒரு கட்டமைப்பு ரீதியான சீரமைப்பு தேவை.', 'C', '{"dimension": "control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q10
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are leading your team through a live consulting project for a real client. Midway through, your team discovers that the approach you committed to in week one is producing weak results. Changing course now means going back to the client and admitting the pivot.', 'What is your call?', 'நீங்கள் ஒரு உண்மையான வாடிக்கையாளருக்காக, உங்கள் குழுவை ஒரு நேரடி ஆலோசனைத் திட்டத்தில் வழிநடத்துகிறீர்கள். திட்டத்தின் பாதியில், முதல் வாரத்தில் நீங்கள் உறுதியளித்த அணுகுமுறை பலவீனமான முடிவுகளைத் தருகிறது என்பதை உங்கள் குழு கண்டறிகிறது. இப்போது போக்கை மாற்றுவது என்பது, வாடிக்கையாளரிடம் திரும்பிச் சென்று இந்த மாற்றத்தை ஒப்புக்கொள்வதாகும்.', 'உங்கள் அழைப்பு என்ன?',
     '{"theme": "Leadership & Authority", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Pivot immediately and own the conversation with the client - a weak result delivered confidently is still a weak result.', 'உடனடியாகத் திசைமாறி, வாடிக்கையாளருடனான உரையாடலை உங்கள் கட்டுப்பாட்டில் கொண்டு வாருங்கள் - நம்பிக்கையுடன் வழங்கப்படும் ஒரு பலவீனமான முடிவு, இன்னமும் ஒரு பலவீனமான முடிவே ஆகும்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Have an honest conversation with the client framed around new insights - most clients respect transparency more than they are given credit for.', 'புதிய புரிதல்களை மையமாகக் கொண்டு வாடிக்கையாளருடன் நேர்மையான உரையாடலை மேற்கொள்ளுங்கள் - பெரும்பாலான வாடிக்கையாளர்கள், அவர்கள் நினைப்பதை விட வெளிப்படைத்தன்மைக்கு அதிக மதிப்பு கொடுக்கிறார்கள்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Consult the full team before deciding - this affects everyone and a shared decision is one everyone can stand behin', 'முடிவெடுப்பதற்கு முன் முழு குழுவுடனும் கலந்தாலோசிக்கவும் - இது அனைவரையும் பாதிக்கும், மேலும் அனைவரும் ஆதரிக்கக்கூடிய ஒரு முடிவே ஒருமித்த முடிவாகும்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Spend 48 hours stress-testing the new direction before saying anything to the client - I will not pivot into another dead en', 'வாடிக்கையாளரிடம் எதையும் கூறுவதற்கு முன், புதிய திசையை 48 மணி நேரம் தீவிரமாகச் சோதித்துப் பாருங்கள் - நான் மீண்டும் ஒரு முட்டுச்சந்திற்குத் திரும்ப மாட்டேன்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q11
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are leading a team presentation to a senior industry panel. Midway through, a panelist interrupts and challenges your central thesis directly and somewhat aggressively. Your team is watching you.Two things are pulling at you simultaneously.', 'Which one is stronger?', 'நீங்கள் ஒரு மூத்த தொழில் வல்லுநர்கள் குழுவிடம் உங்கள் குழு விளக்கக்காட்சியை வழிநடத்துகிறீர்கள். விளக்கக்காட்சியின் நடுவில், குழு உறுப்பினர் ஒருவர் குறுக்கிட்டு, உங்கள் மையக் கருத்தை நேரடியாகவும் ஓரளவு ஆக்ரோஷமாகவும் சவால் விடுகிறார். உங்கள் குழுவினர் உங்களைக் கவனித்துக் கொண்டிருக்கிறார்கள். ஒரே நேரத்தில் இரண்டு விஷயங்கள் உங்களை அலைக்கழிக்கின்றன.', 'எது வலிமையானது?',
     '{"theme": "Leadership & Authority", "dimension": "control_need vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The need to hold your position clearly - backing down publicly signals to your team and the panel that you did not believe what you presente', 'உங்கள் நிலைப்பாட்டைத் தெளிவாக நிலைநிறுத்த வேண்டியதன் அவசியம் - பகிரங்கமாகப் பின்வாங்குவது, நீங்கள் முன்வைத்ததை நீங்களே நம்பவில்லை என்பதை உங்கள் குழுவிற்கும் நடுவர் குழுவிற்கும் உணர்த்திவிடும்.', 'D', '{"raw_factor": "D over I", "dimension": "control_need vs approval_need"}'),
  (2, 'The need to handle this in a way that keeps the room''s energy positive - how you respond matters as much as what you say.', 'அறையின் ஆற்றலை நேர்மறையாக வைத்திருக்கும் வகையில் இதைக் கையாள வேண்டிய அவசியம் உள்ளது - நீங்கள் என்ன சொல்கிறீர்கள் என்பதைப் போலவே, எப்படிப் பதிலளிக்கிறீர்கள் என்பதும் முக்கியம்.', 'I', '{"raw_factor": "I over D", "dimension": "control_need vs approval_need"}'),
  (3, 'The need to protect your team - they worked hard on this and a public dismantling affects them too, not just you.', 'உங்கள் குழுவைப் பாதுகாக்க வேண்டிய அவசியம் உள்ளது - அவர்கள் இதற்காகக் கடுமையாக உழைத்துள்ளனர், மேலும் ஒரு பொதுவெளியில் இதைச் சிதைப்பது உங்களை மட்டுமல்ல, அவர்களையும் பாதிக்கும்.', 'S', '{"dimension": "control_need vs approval_need"}'),
  (4, 'The need to assess whether the challenge has merit - if the panelist is right, the intellectually honest response is to acknowledge it.', 'அந்த சவாலில் தகுதி உள்ளதா என்பதை மதிப்பிட வேண்டிய அவசியம் உள்ளது - குழு உறுப்பினர் கூறுவது சரி என்றால், அதை ஏற்றுக்கொள்வதே அறிவுப்பூர்வமான நேர்மையான பதிலாகும்.', 'C', '{"dimension": "control_need vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q12
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You led a team initiative that your batch genuinely respecteA faculty member publicly attributes the success to the overall team structure rather than to your leadership specifically. Nobody corrects them. Your contribution is effectively invisible in the room.', 'What is happening inside you in that moment?', 'உங்கள் குழுவினர் உண்மையாகவே மதிக்கும் ஒரு குழு முன்னெடுப்பிற்கு நீங்கள் தலைமை தாங்கினீர்கள். ஒரு பேராசிரியர், அந்த வெற்றிக்குக் குறிப்பாக உங்கள் தலைமைத்துவத்தைக் காரணம் காட்டாமல், ஒட்டுமொத்தக் குழுவின் கட்டமைப்பையே பகிரங்கமாகக் காரணமாகக் கூறுகிறார். யாரும் அவர்களைத் திருத்துவதில்லை. அந்த அறையில் உங்கள் பங்களிப்பு கண்ணுக்குத் தெரியாததாகவே இருக்கிறது.', 'அந்தத் தருணத்தில் உங்களுக்குள் என்ன நிகழ்ந்துகொண்டிருக்கிறது?',
     '{"theme": "Leadership & Authority", "dimension": "control_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A sharp, clean frustration - you know what you did and the record should reflect it, even if you say nothing right now.', 'ஒரு கூர்மையான, தெளிவான விரக்தி - நீங்கள் என்ன செய்தீர்கள் என்பது உங்களுக்குத் தெரியும், இப்போது நீங்கள் எதுவும் சொல்லாவிட்டாலும், அந்தப் பதிவு அதைப் பிரதிபலிக்க வேண்டும்.', 'D', '{"dimension": "control_need"}'),
  (2, 'A social discomfort - you are aware of how others in the room are processing this and wondering what they now think.', 'ஒரு சமூக சங்கடம் - அறையில் உள்ள மற்றவர்கள் இதை எப்படி எடுத்துக்கொள்கிறார்கள் என்பதை நீங்கள் உணர்ந்து, அவர்கள் இப்போது என்ன நினைப்பார்கள் என்று யோசிப்பீர்கள்.', 'I', '{"dimension": "control_need"}'),
  (3, 'A quiet acceptance with a small ache - you are glad the team was recognized and you will let this one go.', 'ஒரு சிறு வலியுடன் கூடிய அமைதியான ஏற்பு - அணி அங்கீகரிக்கப்பட்டதில் நீங்கள் மகிழ்ச்சியடைகிறீர்கள், மேலும் இதை நீங்கள் விட்டுவிடுவீர்கள்.', 'S', '{"dimension": "control_need"}'),
  (4, 'A clinical noting - the attribution was factually incorrect and you are deciding whether correcting it is worth the social cost.', 'ஒரு மருத்துவக் குறிப்பு - குற்றம் சாட்டியது உண்மையில் தவறானது, மேலும் அதைச் சரிசெய்வது அதனால் ஏற்படும் சமூகச் செலவுக்கு மதிப்புள்ளதா என்பதை நீங்கள் தீர்மானிக்கிறீர்கள்.', 'C', '{"dimension": "control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q13
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are shortlisted for two internship interviews in the same week. The first is at a firm perfectly aligned with your stated career goal - structured, prestigious, and exactly what you planned for. The second is an unexpected opportunity at an early-stage company where the role is ambiguous but the potential is significant.', 'How do you approach this week?', 'ஒரே வாரத்தில் இரண்டு உள்ளகப் பயிற்சி நேர்காணல்களுக்கு நீங்கள் தேர்வு செய்யப்பட்டுள்ளீர்கள். முதலாவது, நீங்கள் குறிப்பிட்ட தொழில் இலக்குடன் கச்சிதமாகப் பொருந்தக்கூடிய ஒரு நிறுவனத்தில் நடைபெறுகிறது - அது கட்டமைக்கப்பட்ட, மதிப்புமிக்க, மற்றும் நீங்கள் திட்டமிட்டபடியே அமைந்ததாகும். இரண்டாவது, ஒரு ஆரம்ப நிலை நிறுவனத்தில் கிடைத்த எதிர்பாராத வாய்ப்பாகும்; அங்குப் பணியின் தன்மை தெளிவற்றதாக இருந்தாலும், அதற்கான சாத்தியக்கூறுகள் குறிப்பிடத்தக்கவை.', 'இந்த வாரத்தை நீங்கள் எப்படி அணுகுகிறீர்கள்?',
     '{"theme": "Career Decisions & Internships", "dimension": "change_tolerance", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Prioritize the first - I came to this MBA with a plan and I am not going to be distracted by a shiny alternative.', 'முதலாவதற்கு முன்னுரிமை கொடுங்கள் - நான் ஒரு திட்டத்துடன்தான் இந்த MBA-க்கு வந்திருக்கிறேன், கவர்ச்சிகரமான மாற்று வழியால் என் கவனம் சிதறப் போவதில்லை.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'Treat both seriously - I will let the conversations themselves tell me which one I actually want.', 'இரண்டையும் தீவிரமாக எடுத்துக்கொள்ளுங்கள் - எனக்கு உண்மையில் எது வேண்டும் என்பதை உரையாடல்களே எனக்குத் தெரிவிக்கும்.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'Talk to people who have taken similar pivots before deciding how much energy to give the second one - I do not want to chase something based on excitement alone.', 'இரண்டாவது முயற்சிக்கு எவ்வளவு ஆற்றலைச் செலவிடுவது என்று தீர்மானிப்பதற்கு முன், இதே போன்ற மாற்றங்களைச் செய்தவர்களிடம் பேசுங்கள் - நான் வெறும் உற்சாகத்தை மட்டும் அடிப்படையாகக் கொண்டு எதையும் பின்தொடர விரும்பவில்லை.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'Map out both roles against a set of defined criteria before either interview - I need an objective framework or I will make an emotionally driven decision.', 'இரண்டு நேர்காணல்களில் ஏதேனும் ஒன்றிற்கு முன்பாக, வரையறுக்கப்பட்ட அளவுகோல்களின் அடிப்படையில் இருவரின் பணிகளையும் ஆராய்ந்து பாருங்கள் - எனக்கு ஒரு புறநிலையான கட்டமைப்பு தேவை, இல்லையெனில் நான் உணர்ச்சிவசப்பட்டு முடிவெடுப்பேன்.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q14
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You did not convert your summer internship into a placement offer. Most of your batch diThe placement season opens in six weeks.', 'What is your immediate focus?', 'உங்கள் கோடைகாலப் பயிற்சியை நீங்கள் வேலைவாய்ப்பு வாய்ப்பாக மாற்றிக்கொள்ளவில்லை. உங்கள் குழுவில் பெரும்பாலானோர்... வேலைவாய்ப்புப் பருவம் இன்னும் ஆறு வாரங்களில் தொடங்குகிறது.', 'உங்கள் உடனடி கவனம் எதில் உள்ளது?',
     '{"theme": "Career Decisions & Internships", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Identify the two or three firms I want most and go after them with everything - I am not going to dilute my effort across too many options.', 'எனக்கு மிகவும் விருப்பமான இரண்டு அல்லது மூன்று நிறுவனங்களைக் கண்டறிந்து, என் முழு முயற்சியையும் கொண்டு அவற்றை அணுகுவேன் - என் முயற்சியை அதிகமான விருப்பங்களில் சிதறடிக்கப் போவதில்லை.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Activate every relationship I built during the internship and in the batch - someone in my network knows someone at every firm I want.', 'பயிற்சியின்போதும், நமது குழுவிலும் நான் ஏற்படுத்திக்கொண்ட ஒவ்வொரு உறவையும் புதுப்பித்துக் கொள்ளுங்கள் - நான் விரும்பும் ஒவ்வொரு நிறுவனத்திலும், எனது தொடர்பு வட்டத்தில் உள்ள ஒருவருக்கு ஒருவரைத் தெரிந்திருக்கும்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Take a week to genuinely process what happened before deciding my next move - I need to be clear-headed before I start, not reactive.', 'என் அடுத்த நகர்வை முடிவு செய்வதற்கு முன், நடந்ததை முழுமையாக உள்வாங்கிக்கொள்ள ஒரு வாரம் எடுத்துக்கொள்ள வேண்டும் - நான் தொடங்குவதற்கு முன் தெளிவான மனநிலையுடன் இருக்க வேண்டுமே தவிர, உணர்ச்சிவசப்பட்டு செயல்படக்கூடாது.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Do a forensic review of where the internship went wrong before I apply anywhere - I need to understand the failure before I risk repeating it.', 'நான் எங்கும் விண்ணப்பிப்பதற்கு முன், எனது உள்ளகப் பயிற்சியில் எங்கே தவறு நடந்தது என்பதை முழுமையாக ஆய்வு செய்ய வேண்டும் - அந்தத் தவறை மீண்டும் செய்யும் அபாயத்தை எடுப்பதற்கு முன், நான் அதைப் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q15
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A partner at a firm you respect calls you personally after your interview and offers you a role. It is not the role you interviewed for - it is a different function, different city, and a slightly lower package than you expecteBut the person calling you is someone you would want to work with and learn from.', 'What is the conflict you feel most?', 'நீங்கள் மதிக்கும் ஒரு நிறுவனத்தின் பங்குதாரர், உங்கள் நேர்காணலுக்குப் பிறகு உங்களைத் தனிப்பட்ட முறையில் அழைத்து ஒரு பதவியை வழங்குகிறார். அது நீங்கள் நேர்காணல் செய்த பதவி அல்ல - அது வேறு ஒரு பணி, வேறு நகரம், மேலும் நீங்கள் எதிர்பார்த்ததை விட சற்றுக் குறைவான சம்பளத் தொகுப்பு. ஆனால், உங்களை அழைக்கும் அந்த நபருடன் நீங்கள் இணைந்து பணியாற்றவும், அவரிடமிருந்து கற்றுக்கொள்ளவும் விரும்புவீர்கள்.', 'நீங்கள் மிகவும் உணரும் முரண்பாடு என்ன?',
     '{"theme": "Career Decisions & Internships", "dimension": "change_tolerance vs stability_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Between taking control of the outcome now versus trusting that the process will deliver something better.', 'இப்போதே முடிவைக் கட்டுப்படுத்துவதற்கும், அந்தச் செயல்முறை சிறந்த ஒன்றை வழங்கும் என்று நம்புவதற்கும் இடையே உள்ள தேர்வு.', 'D', '{"raw_factor": "D vs D - control vs ideal", "dimension": "change_tolerance vs stability_need"}'),
  (2, 'Between the excitement of the unexpected and the fear of what people in your batch will think about the package and role.', 'எதிர்பாராத ஒன்றின் உற்சாகத்திற்கும், உங்கள் குழுவில் உள்ளவர்கள் உங்கள் சம்பளத் தொகுப்பு மற்றும் பதவியைப் பற்றி என்ன நினைப்பார்களோ என்ற பயத்திற்கும் இடையில்.', 'I', '{"dimension": "change_tolerance vs stability_need"}'),
  (3, 'Between the genuine pull toward this person and the discomfort of uprooting your life for a role you did not plan for.', 'அந்த நபரின் மீதான உண்மையான ஈர்ப்புக்கும், நீங்கள் திட்டமிடாத ஒரு பாத்திரத்திற்காக உங்கள் வாழ்க்கையை வேரோடு பிடுங்குவதால் ஏற்படும் அசௌகரியத்திற்கும் இடையில்.', 'S', '{"dimension": "change_tolerance vs stability_need"}'),
  (4, 'Between the strategic logic of taking what is offered and the discomfort of accepting something you cannot fully evaluate yet.', 'வழங்கப்படுவதை ஏற்றுக்கொள்வதற்கான வியூக ரீதியான தர்க்கத்திற்கும், இன்னும் முழுமையாக மதிப்பிட முடியாத ஒன்றை ஏற்றுக்கொள்வதில் உள்ள சங்கடத்திற்கும் இடையில்.', 'C', '{"dimension": "change_tolerance vs stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q16
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your closest competitor in the batch - someone you genuinely respect - lands the exact role you wanted, at the exact firm you wanted, with a better package. You did not even make it to the final round.Nobody knows how much you wanted this specific outcome.', 'What is the honest internal experience - the one before the version you will eventually tell people?', 'அந்தப் பிரிவில் உங்களுக்கு மிக நெருங்கிய போட்டியாளர் - நீங்கள் உண்மையாகவே மதிக்கும் ஒருவர் - நீங்கள் விரும்பிய அதே நிறுவனத்தில், நீங்கள் விரும்பிய அதே வேலையை, சிறந்த சம்பளத் தொகுப்புடன் பெற்றுவிடுகிறார். உங்களால் இறுதிச் சுற்றுக்குக் கூடத் தகுதி பெற முடியவில்லை. இந்த ஒரு குறிப்பிட்ட முடிவை நீங்கள் எவ்வளவு விரும்பினீர்கள் என்பது யாருக்கும் தெரியாது.', 'உண்மையான அக அனுபவம் என்பது என்ன - அதாவது, நீங்கள் இறுதியில் மற்றவர்களிடம் சொல்லப்போகும் பதிப்பிற்கு முந்தைய அனுபவம்?',
     '{"theme": "Career Decisions & Internships", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A hard, quiet competitiveness - you are already calculating what you will build that makes this comparison irrelevant in three years.', 'ஒரு கடுமையான, அமைதியான போட்டி மனப்பான்மை - மூன்று ஆண்டுகளில் இந்த ஒப்பீட்டைப் பொருத்தமற்றதாக ஆக்கப்போகும் ஒன்றை நீங்கள் இப்போதே கணக்கிடத் தொடங்கிவிடுகிறீர்கள்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'A social self-consciousness - you are thinking about how people will read this side-by-side and what story the batch will tell about the two of you.', 'ஒரு சமூக சுய விழிப்புணர்வு - இதை மற்றவர்கள் எப்படிப் படிப்பார்கள் என்றும், உங்கள் இருவரைப் பற்றியும் அந்தக் குழு என்ன கதையைச் சொல்லும் என்றும் நீங்கள் சிந்திக்கிறீர்கள்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A genuine sadness - not about the role but about the feeling that you gave it everything and it still was not enough.', 'உண்மையான சோகம் - அது கதாபாத்திரத்தைப் பற்றியதல்ல, மாறாக, அதற்காக உங்கள் முழு உழைப்பையும் கொடுத்தும் அது போதவில்லை என்ற உணர்வைப் பற்றியது.', 'S', '{"dimension": "approval_need"}'),
  (4, 'A methodical dissatisfaction - you want to understand exactly where the process failed so you can correct the variable, not just accept the outcome.', 'ஒரு திட்டமிட்ட அதிருப்தி - நீங்கள் முடிவை வெறுமனே ஏற்றுக்கொள்வதோடு நின்றுவிடாமல், அந்த செயல்முறை எங்கு துல்லியமாகத் தோல்வியடைந்தது என்பதைத் தெரிந்துகொண்டு, அதில் உள்ள பிழையைச் சரிசெய்ய விரும்புகிறீர்கள்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q17
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Rankings within your MBA batch are informal but everyone knows them. You have just realized through a series of small signals that your standing in the batch has quietly shifted downward - not dramatically, but noticeably to those paying attention.', 'What is your response?', 'உங்கள் MBA குழுவிற்குள் இருக்கும் தரவரிசைகள் முறைசாராதவை, ஆனால் அவை அனைவருக்கும் தெரியும். தொடர்ச்சியான சிறிய அறிகுறிகள் மூலம், உங்கள் குழுவில் உங்கள் நிலை மெதுவாகக் கீழ்நோக்கிச் சரிந்திருப்பதை நீங்கள் இப்போதுதான் உணர்ந்திருக்கிறீர்கள் - அது பெரிய அளவில் இல்லை, ஆனால் கவனிப்பவர்களுக்குத் தெளிவாகத் தெரிகிறது.', 'உங்கள் பதில் என்ன?',
     '{"theme": "Peer Comparison & Competition", "dimension": "approval_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Identify the two or three moments that caused the shift and correct them directly - perception is manageable if you are deliberate about it.', 'மாற்றத்தை ஏற்படுத்திய இரண்டு அல்லது மூன்று தருணங்களைக் கண்டறிந்து அவற்றை நேரடியாகச் சரிசெய்யுங்கள் - நீங்கள் திட்டமிட்டுச் செயல்பட்டால், புலனுணர்வைக் கையாள முடியும்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'Invest more in the relationships that matter - visibility and warmth rebuild standing faster than performance alone.', 'முக்கியமான உறவுகளில் அதிகம் முதலீடு செய்யுங்கள் - செயல்திறனை விட, வெளிப்படைத்தன்மையும் அன்பும் மதிப்பை விரைவாக மீட்டெடுக்கின்றன.', 'I', '{"dimension": "approval_need"}'),
  (3, 'Do not try to manage it - focus on the people you trust and let the broader perception settle on its own.', 'அதைச் சமாளிக்க முயற்சிக்காதீர்கள் - நீங்கள் நம்பும் நபர்கள் மீது கவனம் செலுத்துங்கள், பரந்த கண்ணோட்டம் தானாகவே நிலைபெறட்டும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'Assess whether the shift reflects something real about your performance or only something about perception - the response depends on the diagnosis.', 'இந்த மாற்றம் உங்கள் செயல்திறனில் உள்ள உண்மையான ஒன்றைப் பிரதிபலிக்கிறதா அல்லது அது உங்கள் பார்வை சார்ந்த விஷயம் மட்டும்தானா என்பதை மதிப்பிடுங்கள் - இதற்கான பதில், கண்டறியப்பட்ட நோயைப் பொறுத்தது.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q18
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate you are close to starts pulling away - less available, shorter responses, subtly less warm in group settings. Nothing was saiNothing obvious happeneBut something has shifted.', 'How do you handle this?', 'உங்களுக்கு நெருக்கமான ஒரு வகுப்புத் தோழர் விலகத் தொடங்குகிறார் - குறைவாகப் பழகுகிறார், சுருக்கமாகப் பதிலளிக்கிறார், குழுச் சூழல்களில் மெல்ல மெல்ல அன்பைக் குறைக்கிறார். வெளிப்படையாக எதுவும் சொல்லப்படவில்லை. எதுவும் நடக்கவில்லை. ஆனால் ஏதோ ஒன்று மாறிவிட்டது.', 'நீங்கள் இதை எப்படி கையாளுகிறீர்கள்?',
     '{"theme": "Peer Comparison & Competition", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Ask them directly - I would rather have an uncomfortable conversation than let something quietly erode.', 'அவர்களிடம் நேரடியாகக் கேளுங்கள் - ஒரு விஷயம் மெல்ல மெல்லச் சிதைவதை விட, ஒரு சங்கடமான உரையாடலை மேற்கொள்வதே மேல்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Find a low-pressure moment and create an opportunity for them to open up naturally - a direct question might close them further.', 'அழுத்தம் குறைந்த ஒரு தருணத்தைக் கண்டறிந்து, அவர்கள் இயல்பாக மனம் திறந்து பேச ஒரு வாய்ப்பை உருவாக்குங்கள் - ஒரு நேரடிக் கேள்வி அவர்களை மேலும் உள்முகமாகச் சுருங்கச் செய்துவிடக்கூடும்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Give them space but stay consistently present - I want them to know the door is open without making them feel pressure', 'அவர்களுக்கு இடம் கொடுங்கள், ஆனால் தொடர்ந்து உடனிருங்கள் - அவர்கள் மீது எந்த அழுத்தத்தையும் ஏற்படுத்தாமல், கதவு திறந்திருக்கிறது என்பதை அவர்கள் உணர வேண்டும் என நான் விரும்புகிறேன்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Observe for another week before doing anything - one data point is not a pattern and I do not want to misread the situation.', 'எதையும் செய்வதற்கு முன் இன்னும் ஒரு வாரம் கவனியுங்கள் - ஒரே ஒரு தரவுப் புள்ளி ஒரு போக்காக ஆகாது, மேலும் நான் நிலைமையைத் தவறாகப் புரிந்துகொள்ள விரும்பவில்லை.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q19
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'In a class discussion, you make a point that you believe is correct. A batchmate who is generally well-regarded by the group contradicts you publicly with a confident counter-argument. The room seems to shift toward them.You have about four seconds before you need to respond.', 'What is pulling at you most strongly?', 'வகுப்புக் கலந்துரையாடலில், நீங்கள் சரியென நம்பும் ஒரு கருத்தை முன்வைக்கிறீர்கள். பொதுவாகக் குழுவினரால் நன்கு மதிக்கப்படும் உங்கள் சக மாணவர் ஒருவர், நம்பிக்கையான ஒரு எதிர்வாதத்துடன் பகிரங்கமாக உங்களை மறுக்கிறார். அந்த அறை அவர் பக்கம் சாய்வது போல் தெரிகிறது. நீங்கள் பதிலளிப்பதற்கு முன் உங்களுக்குச் சுமார் நான்கு வினாடிகள் உள்ளன.', 'உங்களை மிகவும் வலுவாக ஈர்ப்பது எது?',
     '{"theme": "Peer Comparison & Competition", "dimension": "approval_need vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The need to hold your position - you were right before they spoke and a confident room does not make them correct.', 'உங்கள் நிலைப்பாட்டில் உறுதியாக இருக்க வேண்டியதன் அவசியம் - அவர்கள் பேசுவதற்கு முன்பு நீங்கள் சொன்னதுதான் சரி, மேலும் ஒரு அறையில் நிலவும் தன்னம்பிக்கை அவர்களைச் சரியானவர்கள் என்று ஆக்கிவிடாது.', 'D', '{"raw_factor": "D over I", "dimension": "approval_need vs accuracy_need"}'),
  (2, 'The need to read the room and respond in a way that keeps you credible regardless of who wins the argument.', 'விவாதத்தில் யார் வெற்றி பெற்றாலும், சூழலைப் புரிந்துகொண்டு, உங்கள் நம்பகத்தன்மையை நிலைநிறுத்தும் வகையில் பதிலளிக்க வேண்டிய அவசியம்.', 'I', '{"raw_factor": "I over D", "dimension": "approval_need vs accuracy_need"}'),
  (3, 'The discomfort of public tension - you want to find a way to acknowledge their point without fully conceding yours.', 'பொது பதற்றத்தால் ஏற்படும் சங்கடம் - உங்கள் கருத்தை முழுமையாக ஒப்புக்கொள்ளாமல், அவர்களின் கருத்தை ஏற்றுக்கொள்வதற்கான ஒரு வழியைக் கண்டறிய விரும்புவீர்கள்.', 'S', '{"dimension": "approval_need vs accuracy_need"}'),
  (4, 'A genuine internal review - you are actually asking yourself in those four seconds whether they have a point you misse', 'ஒரு உண்மையான உள் ஆய்வு - அந்த நான்கு வினாடிகளில், அவர்கள் சொல்வதில் நீங்கள் கவனிக்கத் தவறிய ஏதேனும் ஒரு விஷயம் இருக்கிறதா என்று நீங்களே உங்களைக் கேட்டுக்கொள்வதுதான் அது.', 'C', '{"dimension": "approval_need vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q20
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have been working toward a specific leadership position in a prestigious campus cluThe selection happens and someone else is chosen - someone you mentored, helped onboard, and genuinely likeThey did not know you wanted the role.', 'Before you congratulate them - what is the internal experience?', 'நீங்கள் ஒரு மதிப்புமிக்க வளாகக் கழகத்தில் ஒரு குறிப்பிட்ட தலைமைப் பதவிக்காகப் பணியாற்றி வருகிறீர்கள். தேர்வு நடைபெறுகிறது, ஆனால் நீங்கள் வழிகாட்டிய, பணியில் சேர உதவிய, உண்மையாகவே விரும்பிய வேறொருவர் தேர்ந்தெடுக்கப்படுகிறார். உங்களுக்கு அந்தப் பதவி வேண்டும் என்பது அவர்களுக்குத் தெரிந்திருக்கவில்லை.', 'நீங்கள் அவர்களை வாழ்த்துவதற்கு முன் - அவர்களின் உள்ளுணர்வு என்ன?',
     '{"theme": "Peer Comparison & Competition", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A flash of something sharp - not at them, but at the situation. You want the feeling to pass quickly and you are already redirecting toward what comes next.', 'கூர்மையான ஏதோ ஒன்றின் மின்னல் போன்ற தாக்கம் - அவர்கள் மீது அல்ல, அந்தச் சூழ்நிலையின் மீது. அந்த உணர்வு விரைவாகக் கடந்துபோக வேண்டும் என நீங்கள் விரும்புகிறீர்கள், மேலும் அடுத்து என்ன நடக்கப் போகிறது என்பதை நோக்கி உங்கள் கவனத்தை ஏற்கெனவே திருப்புகிறீர்கள்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A complicated mix - you are genuinely happy for them and also aware that how you respond in the next ten minutes will define something about how people see you.', 'இது ஒரு சிக்கலான கலவை - நீங்கள் அவர்களுக்காக உண்மையாகவே மகிழ்ச்சியடைகிறீர்கள், அதே சமயம், அடுத்த பத்து நிமிடங்களில் நீங்கள் எவ்வாறு பதிலளிக்கிறீர்கள் என்பது, மற்றவர்கள் உங்களை எப்படிப் பார்க்கிறார்கள் என்பதை வரையறுக்கும் என்பதையும் நீங்கள் அறிந்திருக்கிறீர்கள்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A deep, quiet ache - there is something uniquely painful about being passed over by someone you invested in, and you need a moment before you can be fully present for them.', 'ஆழ்ந்த, அமைதியான ஒரு வலி - நீங்கள் அக்கறை காட்டிய ஒருவரால் புறக்கணிக்கப்படுவதில் ஒரு தனித்துவமான வேதனை இருக்கிறது, மேலும் அவர்களுக்காக முழுமையாக உங்களை அர்ப்பணிப்பதற்கு உங்களுக்கு ஒரு கணம் தேவைப்படுகிறது.', 'S', '{"dimension": "stability_need"}'),
  (4, 'A detached assessment - you are already wondering what the selection process valued that you did not demonstrate, and whether the outcome was actually correct.', 'ஒரு பற்றற்ற மதிப்பீடு - தேர்வுச் செயல்முறை நீங்கள் வெளிப்படுத்தாத எதை மதித்தது என்றும், அதன் விளைவு உண்மையில் சரியானதா என்றும் நீங்கள் ஏற்கெனவே யோசிக்கத் தொடங்கிவிடுவீர்கள்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q21
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'During a group assignment, you discover that a significant portion of your team''s analysis was lifted from a published report without attribution. The submission is in six hours. The two members responsible are not responding to messages. The other two are asking you what to do.', 'What do you decide?', 'ஒரு குழுப் பணியின் போது, ​​உங்கள் குழுவின் பகுப்பாய்வின் ஒரு குறிப்பிடத்தக்க பகுதி, வெளியிடப்பட்ட ஒரு அறிக்கையிலிருந்து அதன் மூலத்தைக் குறிப்பிடாமல் எடுக்கப்பட்டிருப்பதை நீங்கள் கண்டறிகிறீர்கள். சமர்ப்பிப்பதற்கு இன்னும் ஆறு மணி நேரம் உள்ளது. இதற்குப் பொறுப்பான இரண்டு உறுப்பினர்களும் செய்திகளுக்குப் பதிலளிப்பதில்லை. மற்ற இருவரும் என்ன செய்வதென்று உங்களிடம் கேட்கிறார்கள்.', 'நீங்கள் என்ன முடிவு செய்கிறீர்கள்?',
     '{"theme": "Ethical Pressure", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Rewrite the section yourself in the time available - submitting plagiarized work is not something I will attach my name to regardless of who caused it.', 'கிடைக்கும் நேரத்தில் அந்தப் பகுதியை நீங்களே மீண்டும் எழுதுங்கள் - படைப்புத் திருட்டுப் படைப்பைச் சமர்ப்பிப்பது என்பது, அதை யார் செய்திருந்தாலும் சரி, நான் என் பெயரை இணைத்துக்கொள்ளாத ஒரு செயலாகும்.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Try harder to reach the two members - this decision should not be made without them and I need five minutes with them before I do anything drasti', 'அந்த இரண்டு உறுப்பினர்களையும் தொடர்புகொள்ள இன்னும் கடுமையாக முயற்சி செய்யுங்கள் - அவர்கள் இல்லாமல் இந்த முடிவு எடுக்கப்படக்கூடாது, மேலும் நான் கடுமையான எதையும் செய்வதற்கு முன்பு அவர்களுடன் எனக்கு ஐந்து நிமிடங்கள் தேவை.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Talk to the two present members and make a decision together - whatever we do, we do it as a group.', 'இங்குள்ள இரண்டு உறுப்பினர்களுடன் பேசி, ஒன்றாக ஒரு முடிவெடுங்கள் - நாம் என்ன செய்தாலும், அதை ஒரு குழுவாகவே செய்வோம்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Flag it to the faculty coordinator before submission with full context - the ethical breach needs to be on record even if it costs us the grade.', 'சமர்ப்பிக்கும் முன், முழுமையான சூழலுடன் இதைத் துறை ஒருங்கிணைப்பாளரிடம் தெரிவிக்கவும் - இந்த நெறிமுறை மீறலால் நமது மதிப்பெண் குறைந்தாலும், அது பதிவேட்டில் இடம்பெற வேண்டும்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q22
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A professor you respect makes a factual error during a lecture - not a matter of interpretation but a clear, verifiable mistake. Thirty students heard it. Nobody says anything.', 'What do you do?', 'நீங்கள் மதிக்கும் ஒரு பேராசிரியர், விரிவுரையின் போது ஒரு உண்மைப் பிழையைச் செய்கிறார் - அது பொருள்விளக்கப் பிழை அல்ல, மாறாகத் தெளிவான, சரிபார்க்கக்கூடிய ஒரு தவறு. முப்பது மாணவர்கள் அதைக் கேட்டார்கள். யாரும் எதுவும் சொல்லவில்லை.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Ethical Pressure", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Raise it in the moment - letting a factual error stand in a learning environment is worse than the discomfort of correcting a professor.', 'அதை அந்தத் தருணத்திலேயே எழுப்புங்கள் - ஒரு கற்றல் சூழலில் ஒரு உண்மைப் பிழையை அப்படியே விட்டுவிடுவது, பேராசிரியரைத் திருத்துவதால் ஏற்படும் சங்கடத்தை விட மோசமானது.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Find a way to raise it that protects the professor''s standing - maybe frame it as a clarifying question rather than a direct correction.', 'பேராசிரியரின் மதிப்பைப் பாதுகாக்கும் வகையில் அதை எழுப்ப ஒரு வழியைக் கண்டறியுங்கள் - ஒருவேளை அதை ஒரு நேரடித் திருத்தமாகக் கேட்பதற்குப் பதிலாக, தெளிவுபடுத்தும் கேள்வியாக முன்வைக்கலாம்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Raise it after class privately - the relationship and the professor''s dignity matter and this can be corrected without a public moment.', 'வகுப்பு முடிந்ததும் தனிப்பட்ட முறையில் இதைப் பற்றிப் பேசுங்கள் - உறவும் பேராசிரியரின் கண்ணியமும் முக்கியமானவை, மேலும் இதை ஒரு பொது நிகழ்வு இல்லாமலேயே சரிசெய்துவிட முடியும்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Confirm the error independently first, then raise it through the most appropriate channel - I will not correct someone publicly without being certain.', 'முதலில் பிழையை நீங்களே உறுதிசெய்து கொள்ளுங்கள், பின்னர் மிகவும் பொருத்தமான வழிமுறையின் மூலம் அதைத் தெரிவிக்கவும் - உறுதியாகத் தெரியாமல் நான் ஒருவரைப் பொதுவெளியில் திருத்த மாட்டேன்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q23
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A senior student who has been genuinely helpful to you asks you to put in a good word for them with a faculty member for a research position. You do not honestly think they are the strongest candidate. You know a batchmate who is significantly better suited.', 'What pulls at you most?', 'உங்களுக்கு உண்மையாகவே உதவிய ஒரு மூத்த மாணவர், ஒரு ஆராய்ச்சிப் பதவிக்காகத் தமக்காகப் பேராசிரியர் ஒருவரிடம் பரிந்துரை செய்யுமாறு உங்களிடம் கேட்கிறார். ஆனால், அவர்தான் மிகச் சிறந்த வேட்பாளர் என்று நீங்கள் உண்மையாகவே நினைக்கவில்லை. அந்தப் பதவிக்கு மிகவும் பொருத்தமான உங்கள் சக மாணவர் ஒருவரை உங்களுக்குத் தெரியும்.', 'உங்களை மிகவும் கவர்வது எது?',
     '{"theme": "Ethical Pressure", "dimension": "conflict_response vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The straightforward answer - I will not compromise my honest assessment for a relationship, even a valuable one.', 'நேரடியான பதில் - ஒரு உறவுக்காக, அது மதிப்புமிக்கதாக இருந்தாலும் சரி, எனது நேர்மையான மதிப்பீட்டில் நான் சமரசம் செய்துகொள்ள மாட்டேன்.', 'D', '{"raw_factor": "D over I", "dimension": "conflict_response vs approval_need"}'),
  (2, 'The relational cost - this person helped me and saying no feels like a betrayal of something real, even if I know it is the right call.', 'உறவு ரீதியான விலை - அந்த நபர் எனக்கு உதவினார், அதுதான் சரியான முடிவு என்று தெரிந்தாலும், ''வேண்டாம்'' என்று சொல்வது உண்மையான ஒன்றிற்குச் செய்யும் துரோகம் போல் உணர்கிறேன்.', 'I', '{"raw_factor": "I over D", "dimension": "conflict_response vs approval_need"}'),
  (3, 'The discomfort of being in the middle - I genuinely care about both people and I do not want my action to damage either relationship.', 'நடுவில் நிற்பதிலுள்ள சங்கடம் - நான் இருவர் மீதும் உண்மையாகவே அக்கறை கொண்டிருக்கிறேன், மேலும் எனது செயல் எந்த உறவையும் சேதப்படுத்த நான் விரும்பவில்லை.', 'S', '{"dimension": "conflict_response vs approval_need"}'),
  (4, 'The principle - a recommendation should reflect honest assessment, not reciprocity, and I need to be clear about that regardless of the social cost.', 'கொள்கை என்னவென்றால், ஒரு பரிந்துரையானது நேர்மையான மதிப்பீட்டைப் பிரதிபலிக்க வேண்டுமே தவிர, கைமாறாக அல்ல; சமூக ரீதியாக என்ன விலை கொடுக்கப்பட்டாலும், நான் அதைப்பற்றித் தெளிவாக இருக்க வேண்டும்.', 'C', '{"dimension": "conflict_response vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q24
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You submitted a project that received strong praise from the faculty. Privately, you know the quality of your contribution was lower than your team members'' - you were stretched thin that week and they carried more weight. Nobody else knows this.', 'What is the honest internal experience of receiving the praise?', 'பேராசிரியர்களிடமிருந்து பெரும் பாராட்டைப் பெற்ற ஒரு செயல்திட்டத்தை நீங்கள் சமர்ப்பித்தீர்கள். உங்கள் பங்களிப்பின் தரம், உங்கள் குழு உறுப்பினர்களின் பங்களிப்பை விடக் குறைவாக இருந்தது என்பது உங்களுக்குத் தனிப்பட்ட முறையில் தெரியும் - அந்த வாரம் உங்களுக்குப் பணிச்சுமை அதிகமாக இருந்தது, அவர்களோ அதிகப் பொறுப்புகளைச் சுமந்தனர். இது வேறு யாருக்கும் தெரியாது.', 'பாராட்டைப் பெறும்போது ஏற்படும் உண்மையான அக அனுபவம் என்ன?',
     '{"theme": "Ethical Pressure", "dimension": "accuracy_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Mild discomfort - but you move through it quickly. Results are collaborative and you have contributed more than your share at other points.', 'லேசான அசௌகரியம் - ஆனால் நீங்கள் அதிலிருந்து விரைவாக மீண்டுவிடுவீர்கள். முடிவுகள் கூட்டு முயற்சியால் உருவாகின்றன, மேலும் மற்ற சமயங்களில் நீங்கள் உங்கள் பங்கிற்கு மேலாகவே பங்களித்துள்ளீர்கள்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'A slight anxiety - you are wondering if anyone on the team is thinking what you are thinking, and whether it shows.', 'ஒரு லேசான பதட்டம் - அணியில் உள்ள வேறு யாராவது நீங்கள் நினைப்பதையே நினைக்கிறார்களா என்றும், அது வெளிப்படுமா என்றும் நீங்கள் யோசிப்பதுண்டு.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'A genuine unease - you feel you owe your teammates a private acknowledgment of what they did, even if nobody else requires it.', 'ஒரு உண்மையான சங்கடம் - வேறு யாரும் அதைக் கோராவிட்டாலும், உங்கள் அணி வீரர்கள் செய்ததை அவர்களுக்குத் தனிப்பட்ட முறையில் பாராட்ட வேண்டும் என்று நீங்கள் உணர்கிறீர்கள்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'A specific discomfort with the inaccuracy of it - praise that does not match reality is uncomfortable regardless of the social benefit.', 'அதன் துல்லியமின்மையால் ஏற்படும் ஒரு குறிப்பிட்ட சங்கடம் - சமூகப் பயனைப் பொருட்படுத்தாமல், யதார்த்தத்துடன் பொருந்தாத பாராட்டு சங்கடமானதே.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q25
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You need to convince a skeptical faculty member to approve an unconventional format for your dissertation. Every previous request of this kind has been rejecteYou have one scheduled meeting.', 'How do you walk in?', 'உங்கள் ஆய்வறிக்கைக்கு ஒரு வழக்கத்திற்கு மாறான வடிவத்தை அங்கீகரிக்க, சந்தேக மனப்பான்மை கொண்ட ஒரு பேராசிரியரை நீங்கள் சம்மதிக்க வைக்க வேண்டும். இது போன்ற முந்தைய கோரிக்கைகள் அனைத்தும் நிராகரிக்கப்பட்டுள்ளன. உங்களுக்கு ஒரு சந்திப்பு திட்டமிடப்பட்டுள்ளது.', 'நீங்கள் எப்படி உள்ளே நுழைவீர்கள்?',
     '{"theme": "Communication & Influence", "dimension": "approval_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'With a clear, confident position and a prepared response to every objection I anticipate - I am going in to win this, not to explore it.', 'தெளிவான, நம்பிக்கையான நிலைப்பாட்டுடனும், நான் எதிர்பார்க்கும் ஒவ்வொரு எதிர்ப்புக்கும் தயாரான பதிலுடனும் - நான் இதை ஆராய்வதற்காக அல்ல, வெல்வதற்காகவே உள்ளே செல்கிறேன்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'With a strong opening that establishes personal connection before I make any case - people approve things for people they like.', 'நான் என் தரப்பை முன்வைப்பதற்கு முன்பே, ஒரு தனிப்பட்ட தொடர்பை ஏற்படுத்தும் வலுவான தொடக்கத்தின் மூலம், மக்கள் தங்களுக்குப் பிடித்தமானவர்களின் செயல்களுக்கு ஒப்புதல் அளிக்கிறார்கள்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'With genuine curiosity about their concerns - if I understand what made them reject previous requests, I can address the real objection rather than the stated one.', 'அவர்களின் கவலைகள் குறித்து உண்மையான ஆர்வத்துடன், முந்தைய கோரிக்கைகளை அவர்கள் ஏன் நிராகரித்தார்கள் என்பதை நான் புரிந்துகொண்டால், அவர்கள் கூறிய ஆட்சேபனைக்கு பதிலாக உண்மையான ஆட்சேபனைக்கு என்னால் தீர்வு காண முடியும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'With documented precedent from other institutions and a structured argument - I want the decision to be based on evidence, not on personal preference.', 'பிற நிறுவனங்களின் ஆவணப்படுத்தப்பட்ட முன்னுதாரணங்கள் மற்றும் ஒரு கட்டமைக்கப்பட்ட வாதத்தின் அடிப்படையில் - இந்த முடிவு தனிப்பட்ட விருப்பத்தின் அடிப்படையில் அல்லாமல், ஆதாரங்களின் அடிப்படையில் எடுக்கப்பட வேண்டும் என நான் விரும்புகிறேன்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q26
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are presenting your internship findings to a room that includes both your manager and a senior partner. Midway through, you realize your recommendation contradicts a decision the senior partner made six months ago. They have not reacted yet but you can see they have noticed.', 'What do you do?', 'உங்கள் மேலாளர் மற்றும் ஒரு மூத்த பங்குதாரர் இருவரும் இருக்கும் ஓர் அறையில், உங்கள் உள்ளகப் பயிற்சி ஆய்வுகளின் முடிவுகளை நீங்கள் சமர்ப்பிக்கிறீர்கள். பாதி வழியில், ஆறு மாதங்களுக்கு முன்பு அந்த மூத்த பங்குதாரர் எடுத்த ஒரு முடிவுக்கு உங்கள் பரிந்துரை முரணாக இருப்பதை உணர்கிறீர்கள். அவர்கள் இன்னும் எந்த எதிர்வினையும் ஆற்றவில்லை, ஆனால் அவர்கள் அதைக் கவனித்துவிட்டார்கள் என்பதை உங்களால் காண முடிகிறது.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Communication & Influence", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Stay the course - my analysis is my analysis and I will let the data speak regardless of who is in the room.', 'என் போக்கில் உறுதியாக இருங்கள் - எனது பகுப்பாய்வு என்னுடையதுதான், அறையில் யார் இருந்தாலும் தரவுகளே பேசட்டும்.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Acknowledge the tension directly but lightly - something that signals I am aware without making it a confrontation.', 'பதற்றத்தை நேரடியாகவும் அதே சமயம் மென்மையாகவும் ஒப்புக்கொள்ளுங்கள் - அது ஒரு மோதலாக மாறாமல், நான் அதை உணர்ந்திருக்கிறேன் என்பதை உணர்த்தும் விதமாக இருக்க வேண்டும்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Soften the framing of the recommendation slightly - I can preserve the substance while reducing the likelihood of a defensive reaction.', 'பரிந்துரையின் தொனியைச் சற்றே மென்மையாக்குங்கள் - அதன் சாராம்சத்தைப் பாதுகாத்துக்கொண்டே, எதிர்வாதம் ஏற்படுவதற்கான வாய்ப்பைக் குறைக்க முடியும்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Add a qualification that acknowledges the previous decision as reasonable given the information available then - intellectually honest and professionally safe.', 'அப்போது கிடைத்த தகவல்களின் அடிப்படையில் முந்தைய முடிவு நியாயமானது என்பதை அங்கீகரிக்கும் ஒரு தகுதியைச் சேர்க்கவும் - அது அறிவுசார் நேர்மையுடனும் தொழில்ரீதியான பாதுகாப்புடனும் இருக்க வேண்டும்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q27
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are in the final round of a prestigious competition. Your team wants to change a section of the presentation based on feedback from a mock panel. You believe the original version was stronger. You have forty minutes left.', 'The pull you feel most is between:', 'நீங்கள் ஒரு மதிப்புமிக்க போட்டியின் இறுதிச் சுற்றில் இருக்கிறீர்கள். ஒரு மாதிரி நடுவர் குழுவிடமிருந்து பெற்ற பின்னூட்டத்தின் அடிப்படையில், உங்கள் குழு விளக்கக்காட்சியின் ஒரு பகுதியை மாற்ற விரும்புகிறது. அசல் பதிப்பே சிறப்பாக இருந்தது என்று நீங்கள் நம்புகிறீர்கள். உங்களுக்கு இன்னும் நாற்பது நிமிடங்கள் உள்ளன.', 'நீங்கள் மிகவும் உணரும் ஈர்ப்பு இவற்றுக்கு இடையே உள்ளது:',
     '{"theme": "Communication & Influence", "dimension": "approval_need vs control_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Holding your position and delivering what you believe in - a presentation you do not fully stand behind will show.', 'உங்கள் நிலைப்பாட்டில் உறுதியாக இருந்து, நீங்கள் நம்புவதை எடுத்துரைக்கும்போது, ​​நீங்கள் முழுமையாக ஆதரிக்காத ஒரு விளக்கக்காட்சி வெளிப்பட்டுவிடும்.', 'D', '{"raw_factor": "D over I", "dimension": "approval_need vs control_need"}'),
  (2, 'Incorporating the feedback and keeping the team aligned - a unified team delivers better than a divided one with a superior script.', 'கருத்துக்களை உள்வாங்கி, குழுவை ஒருங்கிணைத்து வைத்திருத்தல் - சிறந்த செயல்திட்டத்தைக் கொண்ட பிளவுபட்ட குழுவை விட, ஒன்றுபட்ட குழுவே சிறப்பாகச் செயல்படும்.', 'I', '{"raw_factor": "I over D", "dimension": "approval_need vs control_need"}'),
  (3, 'Finding a version that everyone can genuinely commit to, even if it takes twenty of your forty minutes - the relationship inside the room matters.', 'உங்கள் நாற்பது நிமிடங்களில் இருபது நிமிடங்கள் எடுத்தாலும், அனைவரும் உண்மையாகவே ஏற்றுக்கொள்ளக்கூடிய ஒரு வடிவத்தைக் கண்டறிவது அவசியம் - அந்த அறைக்குள் இருக்கும் உறவுமுறை முக்கியமானது.', 'S', '{"dimension": "approval_need vs control_need"}'),
  (4, 'Evaluating the feedback against specific criteria and making a recommendation the team can accept logically - remove the emotion from the decision.', 'குறிப்பிட்ட அளவுகோல்களின் அடிப்படையில் பின்னூட்டத்தை மதிப்பீடு செய்து, குழுவினர் தர்க்கரீதியாக ஏற்றுக்கொள்ளக்கூடிய ஒரு பரிந்துரையை வழங்குதல் - முடிவெடுப்பதில் இருந்து உணர்ச்சிகளை நீக்குங்கள்.', 'C', '{"dimension": "approval_need vs control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q28
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You delivered a presentation you were genuinely proud of. The feedback from the panel was positive but contained one line of criticism that you cannot stop returning to - even though thirteen other things they said were good.', 'What is actually happening?', 'நீங்கள் வழங்கிய விளக்கக்காட்சி உங்களுக்கு உண்மையாகவே பெருமையளித்தது. நடுவர் குழுவின் கருத்துகள் நேர்மறையாக இருந்தன, ஆனால் அவர்கள் கூறிய மற்ற பதின்மூன்று விஷயங்கள் நன்றாக இருந்தபோதிலும், உங்களால் திரும்பத் திரும்பச் சுட்டிக்காட்டாமல் இருக்க முடியாத ஒரு விமர்சன வரியும் அதில் இருந்தது.', 'உண்மையில் என்னதான் நடக்கிறது?',
     '{"theme": "Communication & Influence", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'You are not bothered by the criticism itself - you are bothered that it exists at all in an otherwise strong performance.', 'விமர்சனம் உங்களைக் கவலையடையச் செய்யவில்லை; மற்றபடி வலுவான ஒரு நடிப்பில், அப்படி ஒரு விமர்சனம் இருப்பதே உங்களைக் கவலையடையச் செய்கிறது.', 'D', '{"dimension": "approval_need"}'),
  (2, 'You are replaying how the room received that moment - wondering whether the others in the audience noticed it or whether it shaped how they see you.', 'அந்தத் தருணத்தை அந்த அறை எப்படி எடுத்துக்கொண்டது என்று நீங்கள் மீண்டும் அசைபோடுகிறீர்கள் - பார்வையாளர்களில் இருந்த மற்றவர்கள் அதைக் கவனித்தார்களா அல்லது அது அவர்கள் உங்களைப் பார்க்கும் விதத்தை வடிவமைத்ததா என்று யோசிக்கிறீர்கள்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'You are thinking about a specific person in the room whose opinion matters to you, and wondering how they processed that one line.', 'அறையில் உள்ள, உங்கள் கருத்துக்கு மதிப்பளிக்கும் ஒரு குறிப்பிட்ட நபரைப் பற்றி நீங்கள் சிந்தித்துக் கொண்டிருக்கிறீர்கள், மேலும் அந்த ஒரு வரியை அவர் எப்படி உள்வாங்கிக் கொண்டார் என்றும் யோசித்துக் கொண்டிருக்கிறீர்கள்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'You are working through whether the criticism was valid - if it was, you need to correct something. If it was not, you need to understand why they said it.', 'அந்த விமர்சனம் நியாயமானதா என்பதை நீங்கள் ஆராய்ந்து கொண்டிருக்கிறீர்கள் - அது நியாயமானதாக இருந்தால், நீங்கள் எதையாவது சரிசெய்ய வேண்டும். அது நியாயமற்றதாக இருந்தால், அவர்கள் ஏன் அப்படிச் சொன்னார்கள் என்பதை நீங்கள் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q29
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your MBA program offers a semester exchange at a partner school abroaThe academics are less rigorous than your home program, the career outcomes data is unclear, and you would miss a key recruitment cycle. But the experience would be entirely different from anything you have done.', 'What is your honest position on this?', 'உங்கள் MBA திட்டம், வெளிநாட்டில் உள்ள ஒரு கூட்டாளர் கல்வி நிறுவனத்தில் ஒரு செமஸ்டர் பரிமாற்றத் திட்டத்தை வழங்குகிறது. அதன் கல்வித் தரம் உங்கள் சொந்த ஊர் திட்டத்தை விடக் குறைவான கடுமை கொண்டது, தொழில் வாழ்க்கைப் பலன்கள் குறித்த தரவுகள் தெளிவாக இல்லை, மேலும் நீங்கள் ஒரு முக்கிய ஆட்சேர்ப்புச் சுழற்சியைத் தவறவிடுவீர்கள். ஆனால், அந்த அனுபவம் நீங்கள் இதுவரை செய்த எதிலிருந்தும் முற்றிலும் மாறுபட்டதாக இருக்கும்.', 'இது குறித்த உங்கள் நேர்மையான நிலைப்பாடு என்ன?',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'I am not going - I came here with a specific outcome in mind and this exchange does not serve it clearly enough.', 'நான் போகவில்லை - நான் ஒரு குறிப்பிட்ட நோக்கத்தை மனதில் கொண்டு இங்கு வந்தேன், ஆனால் இந்த உரையாடல் அதை போதுமான அளவு தெளிவாக நிறைவேற்றவில்லை.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'I am seriously considering it - the relationships and perspectives I would build are not things I can replicate in a classroom.', 'நான் அதைப்பற்றி தீவிரமாக யோசித்து வருகிறேன் - அங்கு நான் உருவாக்கும் உறவுகளையும் கண்ணோட்டங்களையும் ஒரு வகுப்பறையில் என்னால் மீண்டும் உருவாக்க முடியாது.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'I want to understand how it affected the people who went before I decide - their lived experience matters more than the brochure.', 'நான் முடிவெடுப்பதற்கு முன், அது அங்கு சென்ற மக்களை எவ்வாறு பாதித்தது என்பதைப் புரிந்துகொள்ள விரும்புகிறேன் - கையேட்டை விட அவர்களின் நேரடி அனுபவமே முக்கியமானது.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'I need the placement outcome data broken down by cohort, firm type, and role before I can make a rational assessment.', 'ஒரு பகுத்தறிவு மதிப்பீட்டைச் செய்வதற்கு முன், வேலைவாய்ப்பு முடிவுத் தரவுகள் குழு, நிறுவன வகை மற்றும் பதவி வாரியாகப் பிரிக்கப்பட்டு எனக்குத் தேவை.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q30
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are three months into a summer internship. You have been quietly building a business idea on the side - something with real potential. A former professor reaches out and says he has a seed investor interested in meeting you next week. Taking the meeting seriously would require meaningful time and mental energy during your internship''s most critical phase.', 'What do you do?', 'நீங்கள் கோடைகாலப் பயிற்சியில் மூன்று மாதங்கள் நிறைவு செய்துள்ளீர்கள். உண்மையான வளர்ச்சி சாத்தியங்கள் கொண்ட ஒரு வணிக யோசனையை நீங்கள் யாருக்கும் தெரியாமல் தனியாக உருவாக்கி வருகிறீர்கள். உங்கள் முன்னாள் பேராசிரியர் ஒருவர் உங்களைத் தொடர்புகொண்டு, அடுத்த வாரம் உங்களைச் சந்திக்க ஒரு தொடக்க முதலீட்டாளர் ஆர்வமாக இருப்பதாகக் கூறுகிறார். உங்கள் பயிற்சியின் மிக முக்கியமான காலகட்டத்தில், அந்தச் சந்திப்பைத் தீவிரமாக எடுத்துக்கொள்வதற்கு அர்த்தமுள்ள நேரமும் மன ஆற்றலும் தேவைப்படும்.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Ambiguity & Risk", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Take the meeting - if I am always waiting for perfect timing I will never move.', 'சந்திப்பை ஏற்றுக்கொள்ளுங்கள் - நான் எப்போதும் சரியான நேரத்திற்காகக் காத்திருந்தால், என்னால் ஒருபோதும் நகர முடியாது.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Take the meeting and tell my manager - transparency protects me and most managers respect ambition when it is handled honestly.', 'கூட்டத்தை ஏற்றுக்கொண்டு என் மேலாளரிடம் சொல்லுங்கள் - வெளிப்படைத்தன்மை என்னைப் பாதுகாக்கிறது, மேலும் ஒரு லட்சியம் நேர்மையாகக் கையாளப்படும்போது பெரும்பாலான மேலாளர்கள் அதை மதிக்கிறார்கள்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Talk to one or two people I trust before deciding - I want a perspective outside my own excitement before I commit to something this significant.', 'முடிவெடுப்பதற்கு முன், நான் நம்பும் ஒன்று அல்லது இரண்டு பேரிடம் பேசுங்கள் - இவ்வளவு முக்கியமான ஒரு விஷயத்தில் ஈடுபடுவதற்கு முன், எனது சொந்த உற்சாகத்திற்கு அப்பாற்பட்ட ஒரு கண்ணோட்டத்தை நான் விரும்புகிறேன்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Spend two evenings stress-testing the idea before the meeting - I will not walk in underprepared and I need to know if this is real before I risk anything for it.', 'சந்திப்புக்கு முன்பு இரண்டு மாலை நேரங்களை அந்த யோசனையை முழுமையாகச் சோதித்துப் பார்ப்பதில் செலவிடுங்கள் - நான் போதிய தயாரிப்பின்றி உள்ளே செல்ல மாட்டேன், மேலும் இதற்காக எதையும் பணயம் வைப்பதற்கு முன் இது உண்மையானதா என்பதை நான் தெரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q31
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have been offered an early placement with a firm you respect but did not rank as your first choice. If you accept, you opt out of the main placement process. If you decline, you take the risk of the full process with no guarantee.', 'What is the genuine conflict?', 'நீங்கள் மதிக்கும், ஆனால் உங்கள் முதல் தேர்வாகக் கருதாத ஒரு நிறுவனத்தில் உங்களுக்கு முன்கூட்டிய வேலைவாய்ப்பு வழங்கப்பட்டுள்ளது. நீங்கள் இதை ஏற்றுக்கொண்டால், பிரதான வேலைவாய்ப்புச் செயல்முறையிலிருந்து விலகிக்கொள்கிறீர்கள். நீங்கள் இதை மறுத்தால், எந்தவித உத்தரவாதமும் இன்றி முழு செயல்முறையிலும் பங்கேற்கும் அபாயத்தை ஏற்கிறீர்கள்.', 'உண்மையான முரண்பாடு என்ன?',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Between taking control of the outcome now versus trusting that the process will deliver something better.', 'இப்போதே முடிவைக் கட்டுப்படுத்துவதற்கும், அந்தச் செயல்முறை சிறந்த ஒன்றை வழங்கும் என்று நம்புவதற்கும் இடையே உள்ள தேர்வு.', 'D', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (2, 'Between what feels exciting to pursue and what you can honestly tell people you chose - the story matters to you.', 'பின்தொடர உற்சாகமாகத் தோன்றுவதற்கும், நீங்கள் தேர்ந்தெடுத்ததை மக்களிடம் நேர்மையாகச் சொல்வதற்கும் இடையே - அந்தப் பின்னணிக் கதை உங்களுக்கு முக்கியமானது.', 'I', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (3, 'Between the security of a certain outcome and the anxiety of not knowing whether you left something better on the table.', 'ஒரு குறிப்பிட்ட விளைவின் பாதுகாப்புக்கும், அதைவிடச் சிறந்த ஒன்றை நாம் தவறவிட்டுவிட்டோமோ என்ற கவலைக்கும் இடையில்.', 'S', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (4, 'Between accepting an option you can partially evaluate and continuing a process where the outcomes are genuinely unknown - one is analytically safer even if emotionally harder.', 'ஓரளவு மதிப்பீடு செய்யக்கூடிய ஒரு விருப்பத்தை ஏற்றுக்கொள்வதற்கும், அதன் விளைவுகள் உண்மையாகவே அறியப்படாத ஒரு செயல்முறையைத் தொடர்வதற்கும் இடையே, உணர்வுப்பூர்வமாக கடினமாக இருந்தாலும், ஒன்று பகுப்பாய்வு ரீதியாகப் பாதுகாப்பானது.', 'C', '{"dimension": "change_tolerance vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q32
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have arrived at a fork in your career thinking. The path you planned - the one you built your MBA choices around - is technically still available but no longer excites you the way it once diA different direction has been quietly growing in your thinking, but it is less certain and harder to explain to the people who matter to you.', 'What is the honest feeling underneath this?', 'உங்கள் தொழில் வாழ்க்கைச் சிந்தனையில் ஒரு திருப்புமுனையை அடைந்துள்ளீர்கள். நீங்கள் திட்டமிட்ட பாதை - அதாவது உங்கள் MBA தேர்வுகளை அடிப்படையாகக் கொண்ட பாதை - தொழில்நுட்ப ரீதியாக இன்னும் சாத்தியமாக இருந்தாலும், அது முன்பு போல இப்போது உங்களை உற்சாகப்படுத்துவதில்லை. உங்கள் சிந்தனையில் ஒரு மாற்றுத் திசை மெதுவாக வளர்ந்து வருகிறது, ஆனால் அது இப்போது அவ்வளவு உறுதியாக இல்லை, மேலும் உங்களுக்கு முக்கியமானவர்களிடம் அதை விளக்குவதும் கடினமாக உள்ளது.', 'இதன் அடிப்படையிலான உண்மையான உணர்வு என்ன?',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A restlessness - you are not afraid of the new direction, you are impatient with yourself for not having committed to it already.', 'ஒருவித அமைதியின்மை - நீங்கள் புதிய திசையைக் கண்டு அஞ்சவில்லை, மாறாக, அதற்கு இன்னும் உங்களை அர்ப்பணிக்காததற்காக உங்கள் மீதே பொறுமையிழந்து இருக்கிறீர்கள்.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'A social complexity - you know what you want but you are aware of how the pivot will land with people who invested in your original story.', 'ஒரு சமூகச் சிக்கல் - உங்களுக்கு என்ன வேண்டும் என்பது உங்களுக்குத் தெரியும், ஆனால் உங்கள் அசல் கதையில் முதலீடு செய்தவர்களிடம் இந்தத் திடீர் மாற்றம் எப்படிப்பட்ட தாக்கத்தை ஏற்படுத்தும் என்பதையும் நீங்கள் உணர்ந்திருக்கிறீர்கள்.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'A grief of sorts - you built something real around the original plan and letting it go feels like losing a version of yourself, not just a career choice.', 'ஒருவிதமான துக்கம் - அசல் திட்டத்தைச் சுற்றி நீங்கள் ஒரு உண்மையான விஷயத்தைக் கட்டமைத்தீர்கள், அதை விட்டுவிடுவது என்பது ஒரு தொழில் தேர்வை இழப்பது மட்டுமல்ல, உங்களின் ஒரு வடிவத்தையே இழப்பது போன்ற உணர்வைத் தருகிறது.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'An analytical discomfort - you cannot yet build a rigorous case for the new direction, and committing to something you cannot defend fully goes against how you make decisions.', 'ஒரு பகுப்பாய்வு ரீதியான சங்கடம் - புதிய திசைக்கான வலுவான வாதத்தை உங்களால் இன்னும் முன்வைக்க முடியவில்லை, மேலும் உங்களால் முழுமையாகப் பாதுகாக்க முடியாத ஒரு விஷயத்திற்கு உறுதியளிப்பது, நீங்கள் முடிவெடுக்கும் முறைக்கு முரணானது.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q33
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your mentor - someone whose opinion you genuinely value - gives you a piece of developmental feedback that surprises you. They say you are harder to read than you realize and that this creates distance in professional relationships. You did not see this coming.', 'What is your immediate response?', 'நீங்கள் உண்மையாகவே மதிக்கும் உங்கள் வழிகாட்டி, உங்களை ஆச்சரியப்படுத்தும் ஒரு வளர்ச்சி சார்ந்த கருத்தைத் தெரிவிக்கிறார். நீங்கள் நினைப்பதை விட உங்களைப் புரிந்துகொள்வது கடினம் என்றும், இது தொழில்முறை உறவுகளில் இடைவெளியை உருவாக்குகிறது என்றும் அவர் கூறுகிறார். இப்படி ஒன்று நடக்கும் என்று நீங்கள் சற்றும் எதிர்பார்க்கவில்லை.', 'உங்கள் உடனடி பதில் என்ன?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Ask them for specific examples - I need concrete data before I can do anything with feedback this general.', 'அவர்களிடம் குறிப்பிட்ட உதாரணங்களைக் கேளுங்கள் - இவ்வளவு பொதுவான பின்னூட்டத்தின் அடிப்படையில் நான் எதையும் செய்வதற்கு முன், எனக்கு உறுதியான தரவுகள் தேவை.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Ask them who else sees this - if it is pattern-level feedback I want to understand the full picture before I react.', 'இதை வேறு யார் பார்க்கிறார்கள் என்று அவர்களிடம் கேளுங்கள் - இது ஒரு போக்கு சார்ந்த பின்னூட்டமாக இருந்தால், நான் எதிர்வினையாற்றுவதற்கு முன் முழு நிலவரத்தையும் புரிந்துகொள்ள விரும்புகிறேன்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Sit with it quietly - my first instinct is that they might be right, and I need to feel into that before I respon', 'அமைதியாக அதைப் பற்றி யோசியுங்கள் - அவர்கள் சொல்வது சரியாக இருக்கலாம் என்பதுதான் என் முதல் உள்ளுணர்வு, பதிலளிப்பதற்கு முன் நான் அதை ஆழமாகப் புரிந்துகொள்ள வேண்டும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Ask them to help you map the specific behaviors driving this perception - I cannot correct something I cannot see clearly.', 'இந்தப் புரிதலுக்கு வழிவகுக்கும் குறிப்பிட்ட நடத்தைகளைப் பட்டியலிட உதவுமாறு அவர்களிடம் கேளுங்கள் - என்னால் தெளிவாகப் பார்க்க முடியாத ஒன்றை என்னால் சரிசெய்ய முடியாது.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q34
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A case competition judge gives you pointed feedback in front of your team - your logic was strong but your delivery was flat and you lost the room in the middle. You felt the room shifting while it was happening but could not correct it in real time.', 'How do you process this?', 'ஒரு வழக்குப் போட்டி நடுவர் உங்கள் குழுவின் முன்னிலையில் உங்களுக்குக் கூர்மையான கருத்தைத் தெரிவிக்கிறார் - உங்கள் தர்க்கம் வலுவாக இருந்தது, ஆனால் அதை நீங்கள் வெளிப்படுத்திய விதம் உணர்ச்சியற்றதாக இருந்தது, மேலும் இடையில் நீங்கள் அனைவரின் கவனத்தையும் ஈர்த்துவிடவில்லை. அந்த நிகழ்வு நடந்துகொண்டிருக்கும்போதே அரங்கம் மாறுவதை உங்களால் உணர முடிந்தது, ஆனால் அதை உடனுக்குடன் சரிசெய்ய முடியவில்லை.', 'நீங்கள் இதை எப்படி கையாளுகிறீர்கள்?',
     '{"theme": "Feedback & Failure", "dimension": "accuracy_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Accept it and move on - I know what I need to work on and extended reflection is just delayed action.', 'அதை ஏற்றுக்கொண்டு முன்னேறு - நான் எதில் கவனம் செலுத்த வேண்டும் என்று எனக்குத் தெரியும், மேலும் நீண்ட நேரம் சிந்திப்பது என்பது செயலைத் தாமதப்படுத்துவதே ஆகும்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'Talk it through with a teammate who was in the room - processing it together helps me understand what I could not see while I was presenting.', 'அறையில் இருந்த சக அணி வீரருடன் இதைப் பற்றி கலந்துரையாடுங்கள் - ஒன்றாக அதை அலசி ஆராய்வது, நான் விளக்கமளித்துக் கொண்டிருந்தபோது என்னால் கவனிக்க முடியாத விஷயங்களைப் புரிந்துகொள்ள எனக்கு உதவுகிறது.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'Let it settle for a day - I want to come back to this feedback when I am not still feeling the room.', 'ஒரு நாள் அது நிலைபெறட்டும் - அந்தச் சூழல் எனக்கு இன்னும் முழுமையாகப் புரியாதபோது, ​​இந்தக் கருத்துக்கு மீண்டும் வர விரும்புகிறேன்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'Watch the recording if there is one and identify the exact moments the room shifted - I need to know precisely what caused it.', 'பதிவு இருந்தால் அதைப் பார்த்து, அறை நகர்ந்த சரியான தருணங்களைக் கண்டறியுங்கள் - அதற்குக் காரணம் என்னவென்று எனக்குத் துல்லியமாகத் தெரிய வேண்டும்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q35
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your closest mentor and a respected faculty member give you contradictory feedback on the same piece of work. Your mentor says it is your strongest yet. The faculty member says the core argument is flaweBoth are people whose opinion genuinely matters to you.', 'What pulls at you most?', 'உங்களுக்கு மிகவும் நெருக்கமான வழிகாட்டியும், மதிக்கப்படும் ஒரு பேராசிரியரும் ஒரே படைப்பு குறித்து உங்களுக்கு முரண்பட்ட கருத்துக்களைத் தெரிவிக்கின்றனர். அதுவே இதுவரை நீங்கள் உருவாக்கியதிலேயே மிகவும் வலிமையானது என்று உங்கள் வழிகாட்டி கூறுகிறார். அதன் மையக்கருத்தில் குறைபாடு உள்ளது என்று அந்தப் பேராசிரியரோ கூறுகிறார். இவர்கள் இருவரின் கருத்தும் உங்களுக்கு உண்மையாகவே முக்கியமானது.', 'உங்களை மிகவும் கவர்வது எது?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The need to form your own view independently - both opinions are data but neither is the verdict.', 'சுயமாக உங்கள் சொந்தக் கருத்தை உருவாக்க வேண்டிய அவசியம் - இரண்டு கருத்துக்களுமே தரவுகள்தான், ஆனால் எதுவுமே இறுதித் தீர்ப்பு அல்ல.', 'D', '{"dimension": "stability_need vs approval_need"}'),
  (2, 'The social discomfort of the contradiction itself - you are now aware that two people who may talk to each other see your work very differently.', 'அந்த முரண்பாட்டினால் ஏற்படும் சமூக சங்கடம் - ஒருவருக்கொருவர் பேசிக்கொள்ளும் இருவர் உங்கள் படைப்பை முற்றிலும் மாறுபட்ட கோணத்தில் பார்க்கிறார்கள் என்பதை நீங்கள் இப்போது உணர்கிறீர்கள்.', 'I', '{"dimension": "stability_need vs approval_need"}'),
  (3, 'The relational difficulty - you cannot fully accept one view without implicitly rejecting someone whose relationship you value.', 'உறவுமுறைச் சிக்கல் - நீங்கள் மதிக்கும் ஒருவரது உறவை மறைமுகமாக நிராகரிக்காமல், ஒருவரின் கருத்தை உங்களால் முழுமையாக ஏற்றுக்கொள்ள முடியாது.', 'S', '{"dimension": "stability_need vs approval_need"}'),
  (4, 'The intellectual problem - one of them is closer to correct and you need to work out which one through the substance of the argument, not through the authority of the person.', 'அறிவுசார் சிக்கல் - அவற்றுள் ஒன்று சரியானதற்கு மிக நெருக்கமானது, மேலும் அது எது என்பதை நீங்கள் ஒரு நபரின் அதிகாரத்தைக் கொண்டு அல்லாமல், வாதத்தின் சாராம்சத்தின் மூலம் கண்டறிய வேண்டும்.', 'C', '{"dimension": "stability_need vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q36
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You made a significant error in judgment on a live consulting project - not a technical mistake but a strategic call that turned out to be wrong. The client noticeYour faculty advisor was in the room.The project has moved on. Everyone has been professional about it. But you are carrying it.', 'What is the honest internal experience three days later?', 'செயல்பாட்டில் உள்ள ஒரு ஆலோசனைத் திட்டத்தில் நீங்கள் முடிவெடுப்பதில் ஒரு பெரிய தவறு செய்துவிட்டீர்கள் - அது தொழில்நுட்பத் தவறல்ல, மாறாகத் தவறானது என நிரூபிக்கப்பட்ட ஒரு வியூக முடிவு. வாடிக்கையாளர் அதைக் கவனித்துவிட்டார். உங்கள் துறை ஆலோசகர் அந்த அறையில் இருந்தார். திட்டம் அடுத்த கட்டத்திற்கு நகர்ந்துவிட்டது. அனைவரும் அதைத் தொழில்முறையாக எடுத்துக்கொண்டனர். ஆனால், நீங்கள் தான் அதைச் சுமந்துகொண்டிருக்கிறீர்கள்.', 'மூன்று நாட்கள் கழித்து உண்மையான அக அனுபவம் என்ன?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A residual frustration - mostly at yourself for not seeing what you should have seen, and a quiet drive to make sure it does not happen again.', 'கவனிக்க வேண்டியதைக் கவனிக்கத் தவறியதற்காக உங்கள் மீதே எழும் ஒரு விரக்தி, மற்றும் அது மீண்டும் நிகழாமல் பார்த்துக் கொள்வதற்கான ஒரு அமைதியான உந்துதல்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'An awareness of how it landed - you keep returning to the moment the client and advisor exchanged a look, and wondering what it has done to how they see you.', 'அது எவ்வாறு தாக்கத்தை ஏற்படுத்தியது என்பது குறித்த ஒரு விழிப்புணர்வு - வாடிக்கையாளரும் ஆலோசகரும் ஒருவரையொருவர் பார்த்துக் கொண்ட அந்தத் தருணத்திற்கே நீங்கள் மீண்டும் மீண்டும் சென்று, அது அவர்கள் உங்களைப் பார்க்கும் விதத்தில் என்ன மாற்றத்தை ஏற்படுத்தியிருக்கிறது என்று யோசிப்பீர்கள்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A heaviness that is hard to name - it is less about the mistake and more about the feeling that you let people down who were depending on you.', 'பெயரிடக் கடினமான ஒரு பாரம் - அது தவறைப் பற்றியதை விட, உங்களைச் சார்ந்திருந்தவர்களை நீங்கள் கைவிட்டுவிட்டீர்கள் என்ற உணர்வைப் பற்றியது.', 'S', '{"dimension": "stability_need"}'),
  (4, 'An unresolved analytical loop - you are still working through the exact reasoning that led to the wrong call, because you cannot fully close this until you understand it completely.', 'தீர்க்கப்படாத பகுப்பாய்வுச் சுழல் - தவறான முடிவுக்கு வழிவகுத்த துல்லியமான காரணத்தை நீங்கள் இன்னும் ஆராய்ந்து கொண்டிருக்கிறீர்கள், ஏனெனில் அதை முழுமையாகப் புரிந்து கொள்ளும் வரை உங்களால் இதை முழுமையாக முடிக்க முடியாது.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q37
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are six weeks into term two. You are performing well academically, your club commitments are meaningful, and your placement preparation is on track. But you have not had a single unstructured day in eleven weeks. You are not failing - but you can feel something quietly depleting.', 'What do you do?', 'இரண்டாம் பருவம் தொடங்கி ஆறு வாரங்கள் ஆகிவிட்டன. நீங்கள் கல்வியில் சிறப்பாகச் செயல்படுகிறீர்கள், உங்கள் மன்றப் பொறுப்புகள் அர்த்தமுள்ளதாக இருக்கின்றன, மேலும் உங்கள் பயிற்சிப் பணிக்கான தயாரிப்பும் திட்டமிட்டபடி செல்கிறது. ஆனால், கடந்த பதினொரு வாரங்களில் உங்களுக்கு ஒரு நாள் கூட திட்டமிடப்படாத நாள் அமையவில்லை. நீங்கள் தேர்வில் தோல்வியடையவில்லை - ஆனால் ஏதோ ஒன்று மெல்ல மெல்ல உங்களைச் சோர்வடையச் செய்வதை உங்களால் உணர முடிகிறது.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Self-Management & Burnout", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Push through to the next natural break - this level of intensity is temporary and I will recover when there is actual space to do so.', 'அடுத்த இயல்பான ஓய்வு வரை தொடர்ந்து செயல்படுங்கள் - இந்த அளவிலான தீவிரம் தற்காலிகமானது, அதற்கான உண்மையான சூழல் அமையும்போது நான் மீண்டுவிடுவேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Build in something social that does not feel like networking - an evening with people I genuinely enjoy is restorative in a way that rest alone is not.', 'புதிய தொடர்புகளை ஏற்படுத்துவது போல் தோன்றாத, சமூக ரீதியான ஒன்றை உங்கள் நிகழ்வில் இணைத்துக் கொள்ளுங்கள் - தனியாக ஓய்வெடுப்பதைப் போலல்லாமல், நான் உண்மையாகவே விரும்பும் நபர்களுடன் செலவிடும் ஒரு மாலைப் பொழுது புத்துணர்ச்சி அளிக்கும்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Block one morning this week and protect it - not for productivity, just to exist without an agend', 'இந்த வாரம் ஒரு காலைப் பொழுதை ஒதுக்கிப் பாதுகாத்துக் கொள்ளுங்கள் - அது உற்பத்தித்திறனுக்காக அல்ல, எந்த ஒரு திட்டமும் இல்லாமல் வெறுமனே இருப்பதற்காக.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Audit my calendar and identify which commitments are actually optional - I will not recover by resting harder, I need to reduce the load systematically.', 'என் நாட்காட்டியைச் சரிபார்த்து, உண்மையில் விருப்பத்திற்குரிய கடமைகள் எவை என்பதைக் கண்டறியுங்கள் - கடினமாக ஓய்வெடுப்பதால் நான் மீண்டுவிட முடியாது, நான் பணிச்சுமையை முறையாகக் குறைக்க வேண்டும்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q38
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate you barely know approaches you privately and tells you they are struggling - not academically but personally. They are not asking for anything specifiThey just needed to tell someone.', 'What do you do with this?', 'உங்களுக்கு அவ்வளவாகத் தெரியாத உங்கள் வகுப்புத் தோழர் ஒருவர், உங்களிடம் தனிப்பட்ட முறையில் வந்து, தான் கல்வி ரீதியாக அல்ல, தனிப்பட்ட முறையில் சிரமப்படுவதாகக் கூறுகிறார். அவர் குறிப்பாக எதையும் கேட்கவில்லை; யாரிடமாவது இதைச் சொல்ல வேண்டும் என்று அவருக்குத் தோன்றியது.', 'இதை வைத்து நீங்கள் என்ன செய்வீர்கள்?',
     '{"theme": "Self-Management & Burnout", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Ask them directly what kind of support would actually help them - I want to be useful, not just present.', 'அவர்களுக்கு உண்மையில் எந்த வகையான ஆதரவு உதவும் என்று நேரடியாகக் கேளுங்கள் - நான் வெறுமனே உடனிருப்பவனாக அல்ல, பயனுள்ளவனாக இருக்க விரும்புகிறேன்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Stay in the conversation and let it go where it needs to go - sometimes being heard is the whole thing.', 'உரையாடலில் தொடர்ந்து பங்கேற்று, அது செல்ல வேண்டிய இடத்திற்குச் செல்ல விடுங்கள் - சில சமயங்களில் உங்கள் குரல் கேட்கப்படுவதே எல்லாமே ஆகும்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Make sure they know they are not alone and that you will check in on them - quietly and without making it a bigger thing than they want it to be.', 'அவர்கள் தனியாக இல்லை என்பதையும், அவர்கள் விரும்பாத அளவுக்கு அதை ஒரு பெரிதுபடுத்தாமல், அமைதியாக நீங்கள் அவர்களை நலம் விசாரிப்பீர்கள் என்பதையும் அவர்களுக்குத் தெரியப்படுத்துங்கள்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Help them think through whether there are specific resources or people better positioned to support them - I want to point them toward what will actually help.', 'அவர்களுக்கு ஆதரவளிக்க சிறந்த நிலையில் உள்ள குறிப்பிட்ட வளங்கள் அல்லது நபர்கள் இருக்கிறார்களா என்பதைப் பற்றி சிந்திக்க அவர்களுக்கு உதவுங்கள் - உண்மையில் எது உதவும் என்பதை நோக்கி அவர்களை வழிநடத்த நான் விரும்புகிறேன்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q39
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have been offered a leadership role in a club you care about. Taking it would be meaningful but it would also push you past what you can honestly sustain right now. You know yourself well enough to know you will not do it at half-effort - which means something else will have to give.', 'The conflict you feel most is:', 'நீங்கள் விரும்பும் ஒரு மன்றத்தில் தலைமைப் பொறுப்பு உங்களுக்கு வழங்கப்பட்டுள்ளது. அதை ஏற்றுக்கொள்வது அர்த்தமுள்ளதாக இருக்கும், ஆனால் அது தற்போதைக்கு உங்களால் உண்மையாகத் தாங்கிக்கொள்ளக்கூடிய எல்லையைத் தாண்டி உங்களை உந்தித் தள்ளும். நீங்கள் அதை அரைகுறை முயற்சியுடன் செய்ய மாட்டீர்கள் என்பது உங்களைப் பற்றி உங்களுக்கு நன்றாகவே தெரியும் - அதாவது, வேறு எதையாவது நீங்கள் விட்டுக்கொடுக்க வேண்டியிருக்கும்.', 'நீங்கள் மிகவும் உணரும் முரண்பாடு இதுதான்:',
     '{"theme": "Self-Management & Burnout", "dimension": "decision_speed vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Between wanting the role and knowing that wanting it is not the same as having the capacity for it right now.', 'அந்தப் பதவியை விரும்புவதற்கும், அதை விரும்புவதும் தற்சமயம் அதற்கான திறனைக் கொண்டிருப்பதும் ஒன்றல்ல என்பதை அறிந்துகொள்வதற்கும் இடையே உள்ள இடைவெளி.', 'D', '{"raw_factor": "D vs D - honest self-assessment", "dimension": "decision_speed vs accuracy_need"}'),
  (2, 'Between the social pull of being the person who leads this and the private knowledge that you are already stretche', 'இதற்குத் தலைமை தாங்கும் நபர் என்ற சமூக ஈர்ப்புக்கும், நீங்கள் ஏற்கனவே சிரமத்தில் இருக்கிறீர்கள் என்ற தனிப்பட்ட அறிவுக்கும் இடையில்...', 'I', '{"dimension": "decision_speed vs accuracy_need"}'),
  (3, 'Between not wanting to let the club down and not wanting to let yourself down - both feel like real obligations.', 'கிளப்பை ஏமாற்ற விரும்பாததற்கும், உங்களை நீங்களே ஏமாற்றிக் கொள்ள விரும்பாததற்கும் இடையில் - இந்த இரண்டுமே உண்மையான கடமைகளாகத் தோன்றுகின்றன.', 'S', '{"dimension": "decision_speed vs accuracy_need"}'),
  (4, 'Between the inability to calculate the actual cost clearly enough to make a rational decision - the variables are too uncertain.', 'பகுத்தறிவுடன் முடிவெடுக்கும் அளவிற்கு உண்மையான செலவைத் தெளிவாகக் கணக்கிட முடியாததற்கும், மாறிகள் மிகவும் நிச்சயமற்றவையாக இருப்பதற்கும் இடையில் இந்த நிலை உள்ளது.', 'C', '{"dimension": "decision_speed vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 1 Q40
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 1, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are near the end of your first year. You are succeeding by most external measures. But in quiet moments - late nights, early mornings - there is a version of yourself you are aware of not being yet. Not a failure. Just not fully the person you came here to become.Nobody else can see this gap. You are not sure you have the words for it yet.', 'What is the honest feeling underneath this?', 'நீங்கள் உங்கள் முதலாம் ஆண்டின் இறுதியை நெருங்கிக் கொண்டிருக்கிறீர்கள். பெரும்பாலான வெளித்தோற்ற அளவுகோல்களின்படி, நீங்கள் வெற்றி பெற்று வருகிறீர்கள். ஆனால், அமைதியான தருணங்களில் - நள்ளிரவுகளிலும், அதிகாலைகளிலும் - உங்களுள் இருக்கும் ஏதோவொரு வடிவம் இன்னும் உங்களிடம் இல்லை என்பதை நீங்கள் உணர்கிறீர்கள். அது ஒரு தோல்வியல்ல. நீங்கள் இங்கு வந்து ஆக விரும்பிய நபராக இன்னும் முழுமையாக இல்லை, அவ்வளவுதான். இந்த இடைவெளியை வேறு யாராலும் பார்க்க முடியாது. அதை விவரிக்க உங்களிடம் சரியான வார்த்தைகள் இன்னும் இருக்கின்றனவா என்பது உங்களுக்கே உறுதியாகத் தெரியவில்லை.', 'இதன் அடிப்படையிலான உண்மையான உணர்வு என்ன?',
     '{"theme": "Self-Management & Burnout", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'An impatience - you know where you are going and the distance between here and there is something to be closed, not contemplate', 'ஒரு பொறுமையின்மை - நீங்கள் எங்கே செல்கிறீர்கள் என்பது உங்களுக்குத் தெரியும், மேலும் இங்கிருந்து அங்கு செல்வதற்கான தூரம் என்பது சிந்திக்கப்பட வேண்டிய ஒன்றல்ல, மாறாகக் கடக்கப்பட வேண்டிய ஒன்றாகும்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A loneliness of sorts - you are performing well in every room but there are very few people who see the version of you that is still figuring things out.', 'ஒருவிதமான தனிமை - நீங்கள் எல்லா இடங்களிலும் சிறப்பாகச் செயல்படுகிறீர்கள், ஆனால் இன்னும் பல விஷயங்களைக் கற்றுக்கொண்டிருக்கும் உங்கள் இயல்பைப் பார்ப்பவர்கள் மிகச் சிலரே.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A quiet tenderness toward yourself - you are doing more than you give yourself credit for, and part of you knows that, even if you cannot say it out lou', 'உங்கள் மீது நீங்களே காட்டும் ஒரு அமைதியான மென்மை - நீங்கள் உங்களை மதிப்பிடுவதை விட அதிகமாகவே செய்கிறீர்கள், அதை உங்களால் சத்தமாகச் சொல்ல முடியாவிட்டாலும், உங்கள் உள்ளிருக்கும் ஒரு பகுதிக்கு அது தெரியும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'A precision problem - you cannot close the gap between where you are and where you want to be until you can define both with enough clarity to work with.', 'இது ஒரு துல்லியப் பிரச்சினை - நீங்கள் செயல்படும் அளவிற்குத் தேவையான தெளிவுடன் நீங்கள் இருக்கும் இடத்தையும் இருக்க விரும்பும் இடத்தையும் வரையறுக்கும் வரை, அவற்றுக்கிடையேயான இடைவெளியை உங்களால் குறைக்க முடியாது.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- ---------- Set 2 (40 questions) ----------
-- Set 2 Q1
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are bidding for electives and the window closes in two hours. Your carefully planned combination requires you to win three specific courses. A batchmate has just told you that one of your target electives is massively oversubscribed and you will almost certainly lose it. Changing your bid now means rethinking your entire second year plan under pressure.', NULL, 'நீங்கள் விருப்பப் பாடங்களுக்கு விண்ணப்பித்துள்ளீர்கள், அதற்கான காலக்கெடு இன்னும் இரண்டு மணி நேரத்தில் முடிவடைகிறது. நீங்கள் கவனமாகத் திட்டமிட்ட பாடங்களின் தொகுப்பிற்கு, மூன்று குறிப்பிட்ட பாடங்களில் வெற்றி பெற வேண்டும். உங்கள் இலக்கு விருப்பப் பாடங்களில் ஒன்றிற்கு மிக அதிக விண்ணப்பங்கள் வந்துவிட்டதாகவும், நீங்கள் அதை கிட்டத்தட்ட நிச்சயமாக இழந்துவிடுவீர்கள் என்றும் உங்கள் வகுப்புத் தோழர் ஒருவர் சற்று முன்பு உங்களிடம் கூறியுள்ளார். இப்போது உங்கள் விண்ணப்பத்தை மாற்றுவது என்பது, அழுத்தத்தின் கீழ் உங்கள் இரண்டாம் ஆண்டுக்கான முழுத் திட்டத்தையும் மறுபரிசீலனை செய்வதாகும்.', NULL,
     '{"theme": "Academic Pressure & Performance", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Submit the original bid. I built this plan for a reason and I will not abandon it based on rumour.', 'அசல் ஏலத்தைச் சமர்ப்பிக்கவும். நான் இந்தத் திட்டத்தை ஒரு காரணத்திற்காகவே உருவாக்கினேன், வதந்திகளின் அடிப்படையில் இதை நான் கைவிட மாட்டேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Quickly message five people who have already submitted to get a sense of the real picture before I touch anything.', 'நான் எதையும் தொடுவதற்கு முன், உண்மையான நிலவரத்தை அறிந்துகொள்வதற்காக, ஏற்கனவே சமர்ப்பித்த ஐந்து பேருக்கு விரைவாகச் செய்தி அனுப்புகிறேன்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Talk to my academic advisor first - this decision affects too much to make alone in two hours.', 'முதலில் எனது கல்வி ஆலோசகரிடம் பேசுங்கள் - இந்த முடிவை இரண்டு மணி நேரத்தில் தனியாக எடுப்பதற்கு இது மிகவும் பாதிப்பை ஏற்படுத்தும்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Pull up the course capacity data and historical bid scores before making any change. I need facts not hearsay.', 'எந்த மாற்றமும் செய்வதற்கு முன், பாடநெறியின் கொள்ளளவு தரவுகளையும் முந்தைய ஏல மதிப்பெண்களையும் சரிபார்க்கவும். எனக்கு உண்மைகள் வேண்டும், வதந்திகள் அல்ல.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q2
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your capstone team has submitted the first draft to your real client, a mid-sized manufacturing firm. The client has come back saying one of your core recommendations is based on an industry benchmark that does not apply to their sector. Your team lead wants to defend it. You have a client call in forty minutes.', NULL, 'உங்கள் கேப்ஸ்டோன் குழு, அதன் முதல் வரைவை ஒரு நடுத்தர உற்பத்தி நிறுவனமான உங்கள் உண்மையான வாடிக்கையாளரிடம் சமர்ப்பித்துள்ளது. உங்கள் முக்கியப் பரிந்துரைகளில் ஒன்று, தங்களது துறைக்குப் பொருந்தாத ஒரு தொழில் துறை அளவுகோலை அடிப்படையாகக் கொண்டது என்று அந்த வாடிக்கையாளர் தெரிவித்துள்ளார். உங்கள் குழுத் தலைவர் அதை நியாயப்படுத்த விரும்புகிறார். இன்னும் நாற்பது நிமிடங்களில் உங்களுக்கு ஒரு வாடிக்கையாளர் அழைப்பு உள்ளது.', NULL,
     '{"theme": "Academic Pressure & Performance", "dimension": "accuracy_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Tell the team lead directly before the call that we cannot walk into that room defending something the client has already challenged. We either fix it or acknowledge it.', 'வாடிக்கையாளர் ஏற்கனவே ஆட்சேபித்த ஒரு விஷயத்தை நியாயப்படுத்திக்கொண்டு நம்மால் அந்த அறைக்குள் நுழைய முடியாது என்பதை, அழைப்புக்கு முன்பாகவே குழுத் தலைவரிடம் நேரடியாகக் கூறிவிடுங்கள். நாம் ஒன்று அதைச் சரிசெய்ய வேண்டும் அல்லது அதை ஒப்புக்கொள்ள வேண்டும்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'Suggest on the call that we treat this as new information the client has helpfully surfaced and offer to revise - frame it as collaboration not error.', 'வாடிக்கையாளர் உதவிகரமாக வெளிப்படுத்திய புதிய தகவலாக இதைக் கருதி, திருத்தம் செய்ய முன்வரலாம் என அழைப்பின்போதே பரிந்துரை செய்யுங்கள் - இதை ஒரு பிழையாகக் கருதாமல், ஒத்துழைப்பாக முன்வையுங்கள்.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'Let the team lead take the lead on the call but quietly prepare a revised version to share with the client afterwards.', 'குழுத் தலைவர் அழைப்பை முன்னின்று நடத்தட்டும், ஆனால் பின்னர் வாடிக்கையாளருடன் பகிர்வதற்காக திருத்தப்பட்ட பதிப்பை அமைதியாகத் தயார் செய்யுங்கள்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'Spend the next thirty minutes finding the correct benchmark so we walk in with the right answer, not a defence of the wrong one.', 'அடுத்த முப்பது நிமிடங்களைச் சரியான அளவுகோலைக் கண்டறியச் செலவிடுங்கள். அப்போதுதான் நாம் தவறான பதிலுக்கு ஆதரவாகப் பேசாமல், சரியான பதிலுடன் உள்ளே நுழைவோம்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q3
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are three months into the MBA. Your study group has built a strong rhythm - the work is solid, the trust is real, and everyone is performing. A faculty member has privately offered you a spot on a selective independent research project that would take you out of the group for eight weeks. It is a genuine opportunity. Your group does not know yet.', 'Two things are pulling at you. Which is stronger?', 'நீங்கள் MBA படித்து மூன்று மாதங்கள் ஆகிவிட்டன. உங்கள் படிப்புக் குழு ஒரு வலுவான தாளக்கட்டைக் கண்டறிந்துள்ளது - பணிகள் சிறப்பாக உள்ளன, நம்பிக்கை உண்மையானது, மேலும் அனைவரும் திறம்படச் செயல்படுகிறார்கள். ஒரு பேராசிரியர், உங்களை எட்டு வாரங்களுக்குக் குழுவிலிருந்து வெளியே அழைத்துச்செல்லும் ஒரு தேர்ந்தெடுக்கப்பட்ட சுயாதீன ஆராய்ச்சித் திட்டத்தில் உங்களுக்கு ஓர் இடத்தை தனிப்பட்ட முறையில் வழங்கியுள்ளார். இது ஒரு உண்மையான வாய்ப்பு. உங்கள் குழுவுக்கு இது இன்னும் தெரியாது.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Academic Pressure & Performance", "dimension": "control_need vs stability_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The pull to take the opportunity without overthinking the group - rare chances do not wait and relationships survive temporary absence.', 'குழுவைப் பற்றி அதிகமாகச் சிந்திக்காமல் வாய்ப்பைப் பயன்படுத்திக்கொள்ள வேண்டும் என்ற உந்துதல் - அரிய வாய்ப்புகள் காத்திருக்காது, தற்காலிகப் பிரிவையும் உறவுகள் கடந்து நிலைத்திருக்கும்.', 'D', '{"dimension": "control_need vs stability_need"}'),
  (2, 'The worry about how the group will react and whether stepping away will quietly change how they see you.', 'குழு எப்படி எதிர்வினையாற்றும் என்பதும், நாம் விலகிச் செல்வது அவர்கள் நம்மைப் பார்க்கும் விதத்தை மெதுவாக மாற்றிவிடுமா என்பதும் குறித்த கவலை.', 'I', '{"dimension": "control_need vs stability_need"}'),
  (3, 'The genuine discomfort of leaving a functioning team mid-stride - you feel responsible for the stability you helped build.', 'சிறப்பாகச் செயல்படும் ஒரு அணியை பாதியிலேயே விட்டுச் செல்வதில் உள்ள உண்மையான சங்கடம் - நீங்கள் உருவாக்க உதவிய அந்த நிலைத்தன்மைக்கு நீங்களே பொறுப்பு என உணர்கிறீர்கள்.', 'S', '{"dimension": "control_need vs stability_need"}'),
  (4, 'The need to properly evaluate what the research project actually offers before making any decision that disrupts multiple people.', 'பலரையும் பாதிக்கும் எந்தவொரு முடிவையும் எடுப்பதற்கு முன், அந்த ஆராய்ச்சித் திட்டம் உண்மையில் என்ன வழங்குகிறது என்பதை முறையாக மதிப்பீடு செய்ய வேண்டிய அவசியம் உள்ளது.', 'C', '{"dimension": "control_need vs stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q4
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: your peer evaluation scores have just come back. Three anonymous batchmates have rated your contribution to group work as below expectations. You have been one of the more present and vocal members of your group all term and genuinely believed you were carrying your share.', 'What is actually happening inside you before you say anything to anyone?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: உங்கள் சக மதிப்பீட்டு மதிப்பெண்கள் இப்போதுதான் வந்துள்ளன. பெயர் குறிப்பிட விரும்பாத மூன்று வகுப்புத் தோழர்கள், குழுப் பணிகளில் உங்கள் பங்களிப்பு எதிர்பார்ப்புகளுக்குக் குறைவாக இருப்பதாக மதிப்பிட்டுள்ளனர். பருவம் முழுவதும் உங்கள் குழுவில் மிகவும் சுறுசுறுப்பாகவும், தங்கள் கருத்துக்களை வெளிப்படையாகவும் தெரிவித்த உறுப்பினர்களில் ஒருவராக நீங்கள் இருந்தீர்கள்; மேலும், உங்கள் பங்கை நீங்கள் சரியாகச் செய்ததாக உண்மையாகவே நம்பினீர்கள்.', 'நீங்கள் யாரிடமும் எதையும் சொல்வதற்கு முன்பு, உங்களுக்குள் உண்மையில் என்ன நடந்துகொண்டிருக்கிறது?',
     '{"theme": "Academic Pressure & Performance", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A cold resolve. Whatever they saw I will correct through my next actions. Processing this feeling is not the priority right now.', 'ஒரு உறுதியான தீர்மானம். அவர்கள் என்ன கண்டாலும், எனது அடுத்தகட்டச் செயல்கள் மூலம் அதைச் சரிசெய்வேன். இந்த உணர்வை ஆராய்வது இப்போது முன்னுரிமை அல்ல.', 'D', '{"dimension": "approval_need"}'),
  (2, 'A scanning of faces - you are already trying to work out who wrote what and what this means for how you are actually perceived in the batch.', 'முகங்களை உற்று நோக்குதல் - யார் எதை எழுதினார் என்பதையும், அதன் விளைவாக அந்தக் குழுவில் நீங்கள் உண்மையில் எவ்வாறு பார்க்கப்படுகிறீர்கள் என்பதையும் நீங்கள் ஏற்கெனவே கண்டறிய முயற்சிக்கிறீர்கள்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A quiet deflating hurt. You thought you had built real relationships in this group and this result makes you question whether you read them correctly.', 'அமைதியான, மனமுறிவு தரும் ஒரு வலி. இந்தக் குழுவில் உண்மையான உறவுகளை நீங்கள் கட்டியெழுப்பியதாக நினைத்திருந்தீர்கள்; ஆனால் இந்த முடிவு, அவர்களை நீங்கள் சரியாகப் புரிந்துகொண்டீர்களா என்ற கேள்வியை எழுப்புகிறது.', 'S', '{"dimension": "approval_need"}'),
  (4, 'A need to understand the criteria before you accept or reject anything. You cannot respond to feedback you cannot yet evaluate.', 'எதையும் ஏற்றுக்கொள்வதற்கு அல்லது நிராகரிப்பதற்கு முன், அதற்கான அளவுகோல்களைப் புரிந்துகொள்ள வேண்டிய அவசியம் உள்ளது. உங்களால் இன்னும் மதிப்பீடு செய்ய முடியாத பின்னூட்டத்திற்கு உங்களால் பதிலளிக்க முடியாது.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q5
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your team is preparing a final presentation for a live client. One high-performing member has quietly rewritten sections that two other members drafted, without telling them. The rewritten versions are stronger, but the original authors do not know their work was replaced. You found out by accident. Submission is tomorrow.', NULL, 'உங்கள் குழு ஒரு நேரடி வாடிக்கையாளருக்காக இறுதி விளக்கக்காட்சியைத் தயாரித்துக் கொண்டிருக்கிறது. சிறப்பாகச் செயல்படும் ஒரு உறுப்பினர், மற்ற இரண்டு உறுப்பினர்கள் வரைந்திருந்த சில பகுதிகளை, அவர்களுக்குத் தெரிவிக்காமல் ரகசியமாகத் திருத்தி எழுதியுள்ளார். திருத்தி எழுதப்பட்ட பதிப்புகள் வலுவாக உள்ளன, ஆனால் தங்கள் படைப்பு மாற்றப்பட்டது அசல் ஆசிரியர்களுக்குத் தெரியாது. நீங்கள் தற்செயலாக இதைக் கண்டுபிடித்துவிட்டீர்கள். நாளை சமர்ப்பிக்க வேண்டும்.', NULL,
     '{"theme": "Team & Group Dynamics", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Go to the person who rewrote the sections and tell them directly - quality does not justify going around your teammates.', 'பகுதிகளைத் திருத்தி எழுதிய நபரிடம் நேரடியாகச் சென்று சொல்லுங்கள் - தரத்திற்காக உங்கள் சக ஊழியர்களைப் புறக்கணித்துச் செயல்பட முடியாது.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Bring it up lightly in tonight''s team check-in, framing it as a process question rather than a confrontation.', 'இன்றிரவு நடைபெறும் குழு சந்திப்பின்போது, ​​இதை ஒரு மோதலாகக் கருதாமல், ஒரு செயல்முறை சார்ந்த கேள்வியாக முன்வைத்து, இலகுவாகக் கேளுங்கள்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Say nothing until after submission, then raise it as a team norms conversation so it does not happen again.', 'சமர்ப்பிக்கும் வரை எதுவும் கூறாதீர்கள், பின்னர் இது மீண்டும் நிகழாமல் இருக்க, இதை ஒரு குழு நெறிமுறை உரையாடலாக எழுப்புங்கள்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Review both versions yourself first to assess whether the rewrite actually improved the work before deciding how seriously to treat this.', 'இதை எவ்வளவு தீவிரமாக எடுத்துக்கொள்வது என்று தீர்மானிப்பதற்கு முன், திருத்தம் உண்மையில் படைப்பை மேம்படுத்தியதா என்பதை மதிப்பிடுவதற்கு, முதலில் இரண்டு பதிப்புகளையும் நீங்களே மதிப்பாய்வு செய்யுங்கள்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q6
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your team has rotating leadership and this week it is your turn. Midway through a client-facing call, two of your teammates begin contradicting each other on a factual point in front of the client. The tension is visible. You are the one holding the meeting.', NULL, 'உங்கள் குழுவில் தலைமைப் பொறுப்பு சுழற்சி முறையில் வருகிறது, இந்த வாரம் அது உங்கள் முறை. வாடிக்கையாளருடனான ஒரு தொலைபேசி உரையாடலின் நடுவில், உங்கள் குழு உறுப்பினர்களில் இருவர் வாடிக்கையாளரின் முன்னிலையில் ஒரு உண்மை சார்ந்த விஷயத்தில் ஒருவருக்கொருவர் முரண்படத் தொடங்குகிறார்கள். அங்கு நிலவும் பதற்றம் தெளிவாகத் தெரிகிறது. அந்தக் கூட்டத்தை நடத்துபவர் நீங்கள்தான்.', NULL,
     '{"theme": "Team & Group Dynamics", "dimension": "relationship_dependency", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Step in immediately and redirect - I will acknowledge the point is being clarified and move the conversation forward without letting it sit.', 'உடனடியாகத் தலையிட்டு, விஷயத்தைத் திசைதிருப்புங்கள் - விஷயம் தெளிவுபடுத்தப்படுகிறது என்பதை நான் ஏற்றுக்கொண்டு, உரையாடலை அப்படியே விட்டுவிடாமல் முன்னோக்கி நகர்த்துவேன்.', 'D', '{"dimension": "relationship_dependency"}'),
  (2, 'Lighten the moment with a brief comment that acknowledges the complexity and signals to the client that the team is being thorough.', 'சிக்கலான தன்மையை ஒப்புக்கொண்டு, குழுவினர் முழுமையாக ஆராய்ந்து வருகிறார்கள் என்பதை வாடிக்கையாளருக்கு உணர்த்தும் ஒரு சுருக்கமான கருத்தைக் கூறி, அந்தத் தருணத்தை இலகுவாக்குங்கள்.', 'I', '{"dimension": "relationship_dependency"}'),
  (3, 'Let one of them finish their point, then gently bridge to the next agenda item - intervening too sharply could embarrass them further.', 'அவர்களில் ஒருவர் தனது கருத்தை முடித்துக் கொள்ளட்டும், பிறகு மென்மையாக அடுத்த நிகழ்ச்சி நிரல் விடயத்திற்கு மாறுங்கள் - மிகவும் கடுமையாகக் குறுக்கிடுவது அவர்களை மேலும் சங்கடப்படுத்தக்கூடும்.', 'S', '{"dimension": "relationship_dependency"}'),
  (4, 'Ask both teammates to hold the point, tell the client you will confirm and follow up in writing, then move on cleanly.', 'இரு அணி உறுப்பினர்களையும் அந்த விஷயத்தை அப்படியே வைத்திருக்கச் சொல்லுங்கள், எழுத்துப்பூர்வமாக உறுதிசெய்து பின்தொடர்வதாக வாடிக்கையாளரிடம் கூறுங்கள், பின்னர் நேர்த்தியாக அடுத்த கட்டத்திற்குச் செல்லுங்கள்.', 'C', '{"dimension": "relationship_dependency"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q7
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate on your team has been sharing your group''s internal strategy documents with members of a rival team in the same cohort. You found out through a third party. The inter-team competition ends in four days. The rest of your team does not know yet.', 'What matters more to you in this moment?', 'உங்கள் அணியில் உள்ள ஒருவர், உங்கள் குழுவின் உள் உத்திகள் குறித்த ஆவணங்களை, அதே குழுவில் உள்ள ஒரு போட்டி அணியின் உறுப்பினர்களுடன் பகிர்ந்து வருகிறார். இதை நீங்கள் ஒரு மூன்றாம் நபர் மூலம் அறிந்துகொண்டீர்கள். அணிகளுக்கு இடையேயான போட்டி இன்னும் நான்கு நாட்களில் முடிவடைகிறது. உங்கள் அணியின் மற்றவர்களுக்கு இது இன்னும் தெரியாது.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Team & Group Dynamics", "dimension": "stability_need vs conflict_response", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Confronting the person directly and immediately - this is a breach of trust and sitting on it is not something I can do regardless of the timing.', 'அந்த நபரை நேரடியாகவும் உடனடியாகவும் எதிர்கொள்வது நம்பிக்கைத் துரோகம். நேரம் எதுவாக இருந்தாலும், இதை அப்படியே கிடப்பில் போடுவதை என்னால் செய்ய முடியாது.', 'D', '{"dimension": "stability_need vs conflict_response"}'),
  (2, 'Managing how this information lands with the rest of the team - the way you tell them matters as much as the fact itself.', 'இந்தத் தகவல் குழுவின் மற்ற உறுப்பினர்களுக்கு எவ்வாறு சென்றடைகிறது என்பதை நிர்வகிப்பதில், அந்தத் தகவலைப் போலவே அதை நீங்கள் அவர்களிடம் தெரிவிக்கும் விதமும் முக்கியத்துவம் பெறுகிறது.', 'I', '{"dimension": "stability_need vs conflict_response"}'),
  (3, 'Protecting the team''s ability to finish strong - you want to handle this in a way that does not fracture the group four days before the finish line.', 'இறுதி இலக்கை அடைவதற்கு நான்கு நாட்களுக்கு முன்பு குழு பிளவுபடாத வகையில், அணி வலுவாகப் போட்டியை முடிக்கும் திறனைப் பாதுகாக்க வேண்டும்.', 'S', '{"dimension": "stability_need vs conflict_response"}'),
  (4, 'Establishing exactly what was shared and what the actual competitive damage is before deciding on any course of action.', 'எந்தவொரு நடவடிக்கை குறித்தும் முடிவெடுப்பதற்கு முன், என்ன பகிரப்பட்டது என்பதையும், உண்மையான போட்டி ரீதியான பாதிப்பு என்ன என்பதையும் துல்லியமாக உறுதிப்படுத்திக்கொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need vs conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q8
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Before you say anything - one of your closest friends in the batch has just been removed from your project team by the faculty coordinator for non-performance. You were aware they were struggling but said nothing to the faculty, the team, or to them directly. The rest of the team is relieved. Your friend is devastated.', 'What is actually happening inside you right now?', 'நீங்கள் எதையும் சொல்வதற்கு முன் - உங்கள் குழுவில் உள்ள உங்கள் நெருங்கிய நண்பர்களில் ஒருவரை, செயல்திறன் குறைபாடு காரணமாகத் துறை ஒருங்கிணைப்பாளர் உங்கள் திட்டக் குழுவிலிருந்து நீக்கிவிட்டார். அவர் சிரமப்பட்டுக் கொண்டிருந்தார் என்பது உங்களுக்குத் தெரிந்திருந்தும், துறையிடமோ, குழுவிடமோ, அல்லது அவரிடமோ நேரடியாக எதுவும் சொல்லவில்லை. குழுவில் உள்ள மற்றவர்கள் நிம்மதியடைந்துள்ளனர். உங்கள் நண்பர் மிகவும் மனமுடைந்து போயிருக்கிறார்.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Team & Group Dynamics", "dimension": "relationship_dependency", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A clear-eyed acceptance that this outcome was inevitable and probably correct, even if it is uncomfortable to watch.', 'இதைப் பார்ப்பது சங்கடமாக இருந்தாலும், இந்த விளைவு தவிர்க்க முடியாதது மற்றும் அநேகமாக சரியானது என்ற தெளிவான ஏற்றுக்கொள்ளல்.', 'D', '{"dimension": "relationship_dependency"}'),
  (2, 'An acute awareness of how your silence looks - to your friend, to the team, and to anyone who knows you knew.', 'உங்கள் மௌனம் உங்கள் நண்பருக்கு, அணிக்கு, மற்றும் நீங்கள் அறிந்திருந்தீர்கள் என்று தெரிந்த எவருக்கும் எப்படித் தோன்றும் என்பது குறித்த ஆழ்ந்த விழிப்புணர்வு.', 'I', '{"dimension": "relationship_dependency"}'),
  (3, 'A deep guilt that has nothing to do with the outcome and everything to do with the fact that you did not show up for your friend when it mattered.', 'விளைவுக்கும் இதற்கும் எந்த சம்பந்தமும் இல்லை; மாறாக, தேவைப்பட்ட நேரத்தில் உங்கள் நண்பருக்காக நீங்கள் துணை நிற்கவில்லை என்பதாலேயே இது ஏற்படுகிறது.', 'S', '{"dimension": "relationship_dependency"}'),
  (4, 'A need to understand whether your silence was the right call or a failure of judgment - and you cannot close that loop yet.', 'உங்கள் மௌனம் சரியான முடிவா அல்லது தவறான கணிப்பா என்பதைப் புரிந்துகொள்ள வேண்டிய தேவை உள்ளது - ஆனால், உங்களால் அந்தச் சுழற்சியை இப்போதைக்கு முடிக்க முடியாது.', 'C', '{"dimension": "relationship_dependency"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q9
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are leading a cross-batch initiative with no formal budget. You have been trying to get the student affairs office to allocate a small fund for three weeks. They keep redirecting you. The initiative launches in ten days and you need a decision now.', NULL, 'முறையான நிதி ஒதுக்கீடு இல்லாத, பல்வேறு குழுக்களை உள்ளடக்கிய ஒரு முன்னெடுப்பை நீங்கள் வழிநடத்துகிறீர்கள். கடந்த மூன்று வாரங்களாக, ஒரு சிறிய நிதியை ஒதுக்கீடு செய்யுமாறு மாணவர் நல அலுவலகத்திடம் நீங்கள் முயற்சி செய்து வருகிறீர்கள். ஆனால், அவர்கள் உங்களைத் தொடர்ந்து வேறு இடத்திற்கு அனுப்புகிறார்கள். இந்த முன்னெடுப்பு இன்னும் பத்து நாட்களில் தொடங்குகிறது, உங்களுக்கு இப்போதே ஒரு முடிவு தேவை.', NULL,
     '{"theme": "Leadership & Authority", "dimension": "control_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Escalate directly to the Dean''s office - three weeks of redirection is enough and I need someone with authority to make a call.', 'நேரடியாக டீன் அலுவலகத்திற்குப் புகாரைக் கொண்டு செல்லுங்கள் - மூன்று வார கால திசைமாற்றமே போதும், அதிகாரம் உள்ள ஒருவர் முடிவெடுக்க வேண்டும்.', 'D', '{"dimension": "control_need"}'),
  (2, 'Get three other batch representatives to co-sign the request with me - a coalition is harder to redirect than an individual.', 'மற்ற மூன்று தொகுதிப் பிரதிநிதிகளையும் என்னுடன் இந்தக் கோரிக்கையில் கையொப்பமிடச் செய்யுங்கள் - ஒரு தனிநபரை விட ஒரு கூட்டணியை வழிமாற்றுவது கடினம்.', 'I', '{"dimension": "control_need"}'),
  (3, 'Go back to the student affairs office one more time with a stripped-down version of the request that is easier for them to say yes to.', 'அவர்கள் எளிதில் ஏற்றுக்கொள்ளக்கூடிய வகையில், கோரிக்கையின் சுருக்கப்பட்ட வடிவத்துடன் மீண்டும் ஒருமுறை மாணவர் நல அலுவலகத்திற்குச் செல்லுங்கள்.', 'S', '{"dimension": "control_need"}'),
  (4, 'Document the full three-week paper trail and present it formally with a clear cost-benefit case - make it impossible to redirect without a written reason.', 'மூன்று வார கால முழுமையான ஆவணப் பதிவுகளையும் பதிவு செய்து, தெளிவான செலவு-பயன் விளக்கத்துடன் அதனை முறையாகச் சமர்ப்பிக்கவும் - எழுத்துப்பூர்வமான காரணம் இல்லாமல் அதனை வேறு பணிக்கு மாற்றுவதை சாத்தியமற்றதாக்கவும்.', 'C', '{"dimension": "control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q10
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are representing your batch in a faculty grievance about a course that has been consistently poorly managed. The faculty panel has asked for your response in writing by end of day. You have not yet consulted the full batch on the specific wording. You have two hours.', NULL, 'தொடர்ந்து மோசமாக நிர்வகிக்கப்பட்டு வரும் ஒரு பாடநெறி குறித்த பேராசிரியர்களின் குறைதீர்ப்பில், நீங்கள் உங்கள் மாணவர் குழுவின் சார்பாகப் பங்கேற்கிறீர்கள். பேராசிரியர்கள் குழு, அன்றைய தினத்தின் முடிவுக்குள் உங்கள் பதிலை எழுத்துப்பூர்வமாக வழங்குமாறு கேட்டுள்ளது. குறிப்பிட்ட வார்த்தைகள் குறித்து நீங்கள் இன்னும் முழு மாணவர் குழுவிடமும் கலந்தாலோசிக்கவில்லை. உங்களுக்கு இரண்டு மணி நேரம் உள்ளது.', NULL,
     '{"theme": "Leadership & Authority", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Submit the response today with what I know - I was elected to represent them and I understand the issue well enough to act.', 'எனக்குத் தெரிந்தவற்றைக் கொண்டு இன்றே பதிலைச் சமர்ப்பிக்கவும் - நான் அவர்களைப் பிரதிநிதித்துவப்படுத்தவே தேர்ந்தெடுக்கப்பட்டேன், மேலும் நடவடிக்கை எடுக்கும் அளவுக்கு இந்தப் பிரச்சினையை நான் நன்கு புரிந்துகொண்டுள்ளேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Send a quick message to the batch''s WhatsApp group summarising my draft and asking for a thumbs up before I send - five minutes of alignment is worth it.', 'அனுப்புவதற்கு முன், எனது வரைவைச் சுருக்கமாக விளக்கி, அதற்கு ஒப்புதல் கேட்டுப் பிரிவின் வாட்ஸ்அப் குழுவிற்கு ஒரு சிறு செய்தி அனுப்புவேன் - ஐந்து நிமிடச் சீரமைப்பு அதற்குத் தகுதியானதுதான்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Delay submission by one day and properly consult the batch first - I cannot put words in their mouths on something this important.', 'சமர்ப்பிப்பை ஒரு நாள் தாமதப்படுத்தி, முதலில் குழுவினருடன் முறையாகக் கலந்தாலோசிக்கவும் - இவ்வளவு முக்கியமான ஒரு விஷயத்தில் அவர்கள் சொல்லாததை நான் திணிக்க முடியாது.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Submit today but frame the response carefully as preliminary, noting that a fuller batch consultation is underway - buy time without missing the deadline.', 'இன்றே சமர்ப்பிக்கவும், ஆனால் ஒரு முழுமையான குழு கலந்தாய்வு நடைபெற்று வருகிறது என்பதைக் குறிப்பிட்டு, உங்கள் பதிலை ஒரு பூர்வாங்கப் பதில் என கவனமாக வடிவமைக்கவும் - இதன் மூலம் காலக்கெடுவைத் தவறவிடாமல் அவகாசம் பெறலாம்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q11
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You asked for a 360-feedback session as part of your leadership development. The results are in. The consistent theme across seven respondents is that your leadership style is directive to the point of being exclusionary - people feel they cannot push back on you. You did not see this coming.', 'Two things are pulling at you. Which is stronger?', 'உங்கள் தலைமைத்துவ மேம்பாட்டின் ஒரு பகுதியாக, நீங்கள் ஒரு 360-கருத்துப் பகிர்வு அமர்வைக் கோரியிருந்தீர்கள். அதன் முடிவுகள் வந்துவிட்டன. பதிலளித்த ஏழு பேரிடமும் பொதுவாகக் காணப்படும் கருத்து என்னவென்றால், உங்கள் தலைமைத்துவப் பாணி, மற்றவர்களை ஒதுக்கும் அளவிற்கு நேரடியாக வழிநடத்துவதாக உள்ளது - அதாவது, உங்களை எதிர்த்துப் பேச முடியாது என்று மக்கள் உணர்கிறார்கள். இது இப்படி நடக்கும் என்று நீங்கள் சற்றும் எதிர்பார்க்கவில்லை.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Leadership & Authority", "dimension": "approval_need vs control_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The instinct to interrogate the feedback - seven people agreeing does not make them right, and you want to understand the specific situations before you accept the framing.', 'பின்னூட்டத்தைக் கேள்விக்குட்படுத்தும் உள்ளுணர்வு - ஏழு பேர் ஒப்புக்கொள்வதால் அவர்கள் சொல்வது சரியாகிவிடாது, மேலும் முன்வைக்கப்படும் கருத்தை ஏற்றுக்கொள்வதற்கு முன், குறிப்பிட்ட சூழ்நிலைகளை நீங்கள் புரிந்துகொள்ள வேண்டும்.', 'D', '{"dimension": "approval_need vs control_need"}'),
  (2, 'The social discomfort of knowing that seven people in your network privately hold this view and have now put it on record.', 'உங்கள் வட்டாரத்தில் உள்ள ஏழு பேர் இந்தக் கருத்தைத் தனிப்பட்ட முறையில் கொண்டிருப்பதோடு, இப்போது அதைப் பதிவும் செய்திருக்கிறார்கள் என்பதை அறிவதால் ஏற்படும் சமூக சங்கடம்.', 'I', '{"dimension": "approval_need vs control_need"}'),
  (3, 'The genuine desire to understand the impact on the people who work with you - if they felt they could not push back, something real was lost in those conversations.', 'உங்களுடன் பணிபுரிபவர்கள் மீது ஏற்படும் தாக்கத்தைப் புரிந்துகொள்ள வேண்டும் என்ற உண்மையான ஆர்வம் - அவர்களால் எதிர்த்துப் பேச முடியாது என்று உணர்ந்தால், அந்த உரையாடல்களில் ஏதோவொரு உண்மையான விஷயம் விடுபட்டுப் போனது.', 'S', '{"dimension": "approval_need vs control_need"}'),
  (4, 'The analytical need to map the feedback against specific behavioural patterns before deciding what, if anything, to change.', 'எதையேனும் மாற்ற வேண்டுமா எனத் தீர்மானிப்பதற்கு முன், பின்னூட்டத்தை குறிப்பிட்ட நடத்தை முறைகளுடன் ஒப்பிட்டுப் பார்க்க வேண்டிய பகுப்பாய்வுத் தேவை உள்ளது.', 'C', '{"dimension": "approval_need vs control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q12
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: a junior batch member came to you last week asking you to publicly sponsor their initiative. You gave qualified support - enough to be helpful but not enough to put your name fully behind something you had reservations about. Their initiative has just failed publicly and they have told mutual friends that you let them down.', 'What is actually happening inside you right now?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: கடந்த வாரம், தங்களுக்குக் கீழ் படிக்கும் மாணவர் ஒருவர், தங்களது முயற்சிக்கு பகிரங்கமாக ஆதரவளிக்குமாறு உங்களிடம் வந்தார். நீங்கள் நிபந்தனைக்குட்பட்ட ஆதரவை வழங்கினீர்கள் - அது உதவியாக இருக்கப் போதுமானதாக இருந்தது, ஆனால் உங்களுக்குச் சில சந்தேகங்கள் இருந்த ஒரு விஷயத்திற்கு முழுமையாக உங்கள் பெயரைப் பரிந்துரைக்கும் அளவிற்குப் போதுமானதாக இல்லை. இப்போது அவர்களுடைய முயற்சி பகிரங்கமாகத் தோல்வியடைந்துள்ளது, மேலும் நீங்கள் அவர்களைக் கைவிட்டுவிட்டதாக அவர்கள் தங்களது பொதுவான நண்பர்களிடம் கூறியுள்ளனர்.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Leadership & Authority", "dimension": "control_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A sharp irritation - you were careful precisely to avoid this and the characterisation of what you did is not accurate.', 'கடுமையான எரிச்சல் - இதைத் தவிர்ப்பதில் நீங்கள் மிகத் துல்லியமாகக் கவனமாக இருந்தீர்கள், மேலும் நீங்கள் செய்ததை விவரித்த விதம் துல்லியமானதல்ல.', 'D', '{"dimension": "control_need"}'),
  (2, 'An uncomfortable awareness of how this story is now circulating and what it is quietly doing to your reputation among people who only heard one side.', 'ஒரு தரப்பு வாதத்தை மட்டுமே கேட்ட மக்களிடையே, இந்தக் கதை தற்போது எவ்வாறு பரவி வருகிறது என்பதும், அது உங்கள் நற்பெயருக்கு மறைமுகமாக என்ன செய்து கொண்டிருக்கிறது என்பதும் குறித்த ஒரு சங்கடமான உணர்வு.', 'I', '{"dimension": "control_need"}'),
  (3, 'A genuine ache - not because the criticism is fair but because you liked this person and you can feel the relationship has been damaged by something you tried to handle well.', 'ஒரு உண்மையான வலி - அந்த விமர்சனம் நியாயமானது என்பதற்காக அல்ல, மாறாக நீங்கள் அந்த நபரை விரும்பியதாலும், நீங்கள் சிறப்பாகக் கையாள முயன்ற ஒரு விஷயத்தால் அந்த உறவு சேதமடைந்துவிட்டது என்பதை உங்களால் உணர முடிவதாலும் தான்.', 'S', '{"dimension": "control_need"}'),
  (4, 'A methodical need to reconstruct exactly what you said and what you agreed to - because you will not accept a characterisation of your conduct that does not match the facts.', 'நீங்கள் என்ன சொன்னீர்கள், எதற்கு ஒப்புக்கொண்டீர்கள் என்பதைத் துல்லியமாக மீட்டுருவாக்கம் செய்ய வேண்டிய ஒரு முறையான தேவை உள்ளது - ஏனெனில், உண்மைகளுடன் பொருந்தாத உங்கள் நடத்தை குறித்த சித்தரிப்பை நீங்கள் ஏற்றுக்கொள்ள மாட்டீர்கள்.', 'C', '{"dimension": "control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q13
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are three months into your MBA. A headhunter has reached out with a full-time role at a firm you genuinely respect - senior to anything you could expect from campus placement and starting immediately after graduation. Taking it seriously means stepping back from the placement process your batch is fully engaged in. The offer has a two-week response window.', NULL, 'நீங்கள் உங்கள் MBA படிப்பைத் தொடங்கி மூன்று மாதங்கள் ஆகின்றன. நீங்கள் உண்மையாகவே மதிக்கும் ஒரு நிறுவனத்தில், ஒரு வேலைவாய்ப்பு முகவர் உங்களைத் தொடர்புகொண்டுள்ளார். வளாகத் தேர்வில் நீங்கள் எதிர்பார்க்கக்கூடியதை விட உயர்வான பதவியாகவும், பட்டப்படிப்பு முடிந்த உடனேயே தொடங்கும் வகையிலும் இந்தப் பணி அமைந்துள்ளது. இதைத் தீவிரமாக எடுத்துக்கொள்வதென்றால், உங்கள் குழுவினர் முழுமையாக ஈடுபட்டுள்ள வேலைவாய்ப்புச் செயல்முறையிலிருந்து நீங்கள் சற்று விலகி நிற்க வேண்டும். இந்த வாய்ப்பு குறித்துப் பதிலளிக்க இரண்டு வார கால அவகாசம் உள்ளது.', NULL,
     '{"theme": "Career Decisions & Internships", "dimension": "change_tolerance", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Engage with the headhunter seriously and in parallel - I did not come to this MBA to follow a default path if a better one presents itself.', 'வேலை தேடித் தரும் நிறுவனத்துடன் தீவிரமாகவும் அதே சமயம் கலந்துரையாடுங்கள் - ஒரு சிறந்த வழி கிடைக்கும்போது, ​​ஏற்கனவே உள்ள ஒரு வழியைப் பின்பற்றுவதற்காக நான் இந்த MBA-க்கு வரவில்லை.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'Talk to as many people as I can who know this firm before deciding how much energy to give this - I want a real picture, not a recruiter pitch.', 'இதற்கு எவ்வளவு முக்கியத்துவம் கொடுப்பது என்று தீர்மானிப்பதற்கு முன், இந்த நிறுவனத்தைப் பற்றித் தெரிந்த பலரிடம் என்னால் முடிந்தவரை பேச வேண்டும் - எனக்கு ஒரு உண்மையான சித்திரம் வேண்டும், ஆள்சேர்ப்பாளரின் பேச்சு அல்ல.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'Discuss it with two or three people whose judgment I trust before committing any time to it - I do not want to chase something that disrupts my focus without good reason.', 'இதற்கு நேரம் ஒதுக்குவதற்கு முன், நான் நம்பும் இரண்டு அல்லது மூன்று நபர்களுடன் கலந்துரையாடுங்கள் - முறையான காரணம் இல்லாமல் என் கவனத்தைச் சிதறடிக்கும் ஒன்றை நான் பின்தொடர விரும்பவில்லை.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'Map the role against a clear set of criteria - compensation, growth trajectory, risk - before deciding whether it deserves serious attention.', 'ஒரு பணிக்குத் தீவிர கவனம் தேவைதானா என்பதைத் தீர்மானிப்பதற்கு முன், ஊதியம், வளர்ச்சிப் பாதை, இடர் போன்ற தெளிவான அளவுகோல்களின் அடிப்படையில் அப்பணியை மதிப்பிடுங்கள்.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q14
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your internship manager has submitted the final performance review. You find out through a colleague that the review significantly understates your contributions on a project that you drove almost entirely. Your manager has taken prominent credit for the outcome in their own review. The internship ends in two weeks.', NULL, 'உங்கள் பயிற்சி மேலாளர் இறுதி செயல்திறன் மதிப்பீட்டைச் சமர்ப்பித்துள்ளார். நீங்கள் கிட்டத்தட்ட முழுமையாக முன்னின்று நடத்திய ஒரு திட்டத்தில், உங்கள் பங்களிப்புகளை அந்த மதிப்பீடு கணிசமாகக் குறைத்துக் காட்டுகிறது என்பதை ஒரு சக ஊழியர் மூலம் நீங்கள் அறிந்துகொள்கிறீர்கள். உங்கள் மேலாளர் தனது சொந்த மதிப்பீட்டில், அந்த முடிவிற்கான பெருமையை முக்கியமாக எடுத்துக்கொண்டுள்ளார். இன்னும் இரண்டு வாரங்களில் பயிற்சி முடிவடைகிறது.', NULL,
     '{"theme": "Career Decisions & Internships", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Request a meeting with my manager before the review is finalised and put my contributions on record directly - I will not let this stand without at least saying it clearly.', 'மதிப்பாய்வு இறுதி செய்யப்படுவதற்கு முன்பு என் மேலாளருடன் ஒரு சந்திப்பைக் கோரி, எனது பங்களிப்புகளை நேரடியாகப் பதிவு செய்யுங்கள் - குறைந்தபட்சம் அதைத் தெளிவாகச் சொல்லாமல் நான் இதை அனுமதிக்க மாட்டேன்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Speak to the colleague who told me and see if they would be willing to speak to their work on my behalf - having a corroborating voice changes this conversation.', 'எனக்குத் தெரிவித்த சக ஊழியரிடம் பேசி, என் சார்பாக அவர் தனது வேலையைப் பற்றிப் பேச முன்வருவாரா என்று கேளுங்கள் - ஒரு உறுதிப்படுத்தும் குரல் இந்த உரையாடலை மாற்றும்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Let the review stand for now and focus on making the final two weeks count - a confrontation this late could cost me more than the credit is worth.', 'தற்போதைக்கு இந்த மதிப்பாய்வை அப்படியே விட்டுவிட்டு, கடைசி இரண்டு வாரங்களைச் சிறப்பாகப் பயன்படுத்துவதில் கவனம் செலுத்துவோம் - இவ்வளவு தாமதமாக ஏற்படும் ஒரு மோதல், கிடைக்கும் நன்மையை விட எனக்கு அதிக இழப்பை ஏற்படுத்தக்கூடும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Document every deliverable I owned on that project before the review is finalised, so I have a complete record regardless of what the review says.', 'மதிப்பாய்வு இறுதி செய்யப்படுவதற்கு முன்பு, அந்தத் திட்டத்தில் நான் பொறுப்பேற்றிருந்த ஒவ்வொரு பணியையும் ஆவணப்படுத்த வேண்டும். அப்போதுதான், மதிப்பாய்வில் என்ன கூறப்பட்டாலும் என்னிடம் ஒரு முழுமையான பதிவு இருக்கும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q15
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You turned down a placement offer three weeks ago to hold out for your first-choice firm. The first-choice process has just concluded and you did not make the final round. The firm you turned down has already filled the role. You are now without an offer while most of your batch has one.', 'The conflict you feel most is between:', 'மூன்று வாரங்களுக்கு முன்பு, உங்களுக்கு மிகவும் விருப்பமான நிறுவனத்திற்காகக் காத்திருப்பதற்காக, ஒரு வேலைவாய்ப்பு வாய்ப்பை நீங்கள் நிராகரித்தீர்கள். அந்த முதல் விருப்பத் தேர்வு செயல்முறை இப்போதுதான் முடிவடைந்துள்ளது, ஆனால் நீங்கள் இறுதிச் சுற்றுக்குத் தேர்ந்தெடுக்கப்படவில்லை. நீங்கள் நிராகரித்த நிறுவனம் அந்தப் பணியிடத்தை ஏற்கெனவே நிரப்பிவிட்டது. உங்கள் குழுவில் உள்ள பெரும்பாலானோருக்கு வேலைவாய்ப்பு கிடைத்துள்ள நிலையில், உங்களுக்கு இப்போது எந்த வேலைவாய்ப்பும் இல்லை.', 'நீங்கள் மிகவும் உணரும் முரண்பாடு இவற்றுக்கு இடையே உள்ளது:',
     '{"theme": "Career Decisions & Internships", "dimension": "change_tolerance vs stability_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The urge to move fast and target every viable option immediately versus the risk of making a poor decision out of panic.', 'வேகமாகச் செயல்பட்டு, சாத்தியமான ஒவ்வொரு வழியையும் உடனடியாகக் குறிவைக்க வேண்டும் என்ற உந்துதலுக்கும், பதற்றத்தால் தவறான முடிவை எடுக்கும் அபாயத்திற்கும் இடையிலான ஒப்பீடு.', 'D', '{"dimension": "change_tolerance vs stability_need"}'),
  (2, 'Wanting to project confidence to the batch while privately feeling exposed in a way you did not expect to feel.', 'சக மாணவர்களிடம் தன்னம்பிக்கையை வெளிப்படுத்த விரும்பினாலும், உள்ளுக்குள் நீங்கள் சற்றும் எதிர்பாராத விதத்தில் பாதுகாப்பற்றதாக உணர்வது.', 'I', '{"dimension": "change_tolerance vs stability_need"}'),
  (3, 'The discomfort of having no safety net and the need to give yourself enough time to make a decision you will not regret.', 'பாதுகாப்பு வலை இல்லாததால் ஏற்படும் சங்கடமும், வருந்தாத ஒரு முடிவை எடுப்பதற்கு உங்களுக்குப் போதுமான அவகாசம் தேவைப்படுவதும்.', 'S', '{"dimension": "change_tolerance vs stability_need"}'),
  (4, 'The need to honestly diagnose why the first-choice process failed before applying anywhere new - repeating an unknown mistake is the real risk.', 'புதிதாக எங்கும் முயற்சி செய்வதற்கு முன், முதல் தேர்வு செயல்முறை ஏன் தோல்வியடைந்தது என்பதை நேர்மையாகக் கண்டறிய வேண்டிய அவசியம் உள்ளது - தெரியாத ஒரு தவறை மீண்டும் செய்வதே உண்மையான ஆபத்து.', 'C', '{"dimension": "change_tolerance vs stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q16
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: a firm you accepted an offer from has just been publicly named in a business press article as having a toxic culture and high attrition among MBA hires. Several batchmates have seen the article. Some have privately asked if you saw it. You start in four months.', 'What is actually happening inside you before you respond to anyone?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: நீங்கள் வேலைக்குச் சேர ஒப்புக்கொண்ட ஒரு நிறுவனம், நச்சுத்தன்மை வாய்ந்த பணிச்சூழலையும், MBA பட்டதாரிகள் மத்தியில் அதிகப்படியான பணி விலகல் விகிதத்தையும் கொண்டிருப்பதாக ஒரு வணிகப் பத்திரிகைக் கட்டுரையில் பகிரங்கமாகக் குறிப்பிடப்பட்டுள்ளது. உங்கள் சக வகுப்பு மாணவர்கள் பலர் அந்தக் கட்டுரையைப் பார்த்திருக்கிறார்கள். சிலர், நீங்கள் அதைப் பார்த்தீர்களா என்று தனிப்பட்ட முறையில் கேட்டிருக்கிறார்கள். இன்னும் நான்கு மாதங்களில் நீங்கள் பணியில் சேரப் போகிறீர்கள்.', 'நீங்கள் யாருக்காவது பதிலளிப்பதற்கு முன்பு, உங்களுக்குள் உண்மையில் என்ன நிகழ்ந்துகொண்டிருக்கிறது?',
     '{"theme": "Career Decisions & Internships", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A quick, practical calculation - one article does not define a firm and I am going in with my eyes open. What matters is what I do when I get there.', 'ஒரு விரைவான, நடைமுறை கணக்கீடு - ஒரே ஒரு கட்டுரை ஒரு நிறுவனத்தை வரையறுத்துவிடாது, மேலும் நான் முழு விழிப்புணர்வுடன் இதில் இறங்குகிறேன். நான் அங்கு சென்றதும் என்ன செய்கிறேன் என்பதுதான் முக்கியம்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'An acute awareness of how this looks to the batch and a discomfort with the idea that the offer you were proud of is now being quietly reassessed by people around you.', 'இது சக குழுவினருக்கு எப்படித் தோன்றும் என்பது குறித்த ஆழ்ந்த விழிப்புணர்வும், நீங்கள் பெருமைப்பட்ட ஒரு முன்மொழிவு இப்போது உங்களைச் சுற்றியுள்ளவர்களால் இரகசியமாக மறுமதிப்பீடு செய்யப்படுகிறது என்ற எண்ணத்தால் ஏற்படும் ஒருவித சங்கடமும்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A private anxiety that sits differently from the public question - not about reputation but about whether you made the right call for yourself.', 'பொதுக் கேள்வியிலிருந்து மாறுபட்ட ஒரு தனிப்பட்ட கவலை - அது நற்பெயரைப் பற்றியது அல்ல, மாறாக உங்களுக்காக நீங்கள் எடுத்த முடிவு சரியானதா என்பது பற்றியது.', 'S', '{"dimension": "approval_need"}'),
  (4, 'An immediate need to find more data - one article is one data point and you want a fuller picture before you decide how seriously to take this.', 'மேலும் தரவுகளைக் கண்டறிய வேண்டிய உடனடித் தேவை உள்ளது - ஒரு கட்டுரை என்பது ஒரு தரவுப் புள்ளி, மேலும் இதை எந்த அளவிற்குத் தீவிரமாக எடுத்துக்கொள்வது என்று தீர்மானிப்பதற்கு முன் உங்களுக்கு ஒரு முழுமையான சித்திரம் தேவை.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q17
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate has published a LinkedIn thought piece that is getting significant traction. You recognise two of the central ideas from a group discussion your study group had three weeks ago - ideas you contributed. The article does not reference the conversation or anyone in the group. Several batchmates have already shared it.', NULL, 'என் வகுப்புத் தோழர் ஒருவர் லிங்க்ட்இன் தளத்தில் வெளியிட்ட ஒரு சிந்தனைக் கட்டுரை குறிப்பிடத்தக்க வரவேற்பைப் பெற்று வருகிறது. மூன்று வாரங்களுக்கு முன்பு உங்கள் படிப்புக் குழு நடத்திய ஒரு கலந்துரையாடலில் இடம்பெற்ற, நீங்கள் பங்களித்த இரண்டு மையக் கருத்துக்களை நீங்கள் அடையாளம் காண்கிறீர்கள். அந்தக் கட்டுரை, அந்த உரையாடலையோ அல்லது குழுவில் இருந்த யாரையுமோ குறிப்பிடவில்லை. பல வகுப்புத் தோழர்கள் ஏற்கனவே அதைப் பகிர்ந்துள்ளனர்.', NULL,
     '{"theme": "Peer Comparison & Competition", "dimension": "approval_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Message the batchmate directly and privately - not aggressively, but I want them to know I noticed and I would like an acknowledgment.', 'சக வகுப்பு மாணவருக்கு நேரடியாகவும் தனிப்பட்ட முறையிலும் செய்தி அனுப்புங்கள் - ஆக்ரோஷமாக அல்ல, ஆனால் நான் கவனித்ததை அவர் தெரிந்துகொள்ள வேண்டும், மேலும் அவர் அதை ஏற்றுக்கொண்டதற்கான ஒப்புதலையும் நான் விரும்புகிறேன்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'Comment on the post in a way that surfaces your connection to the ideas - a public, warm comment that lets people draw their own conclusions.', 'அந்தப் பதிவில் உள்ள கருத்துக்களுடன் உங்கள் தொடர்பை வெளிப்படுத்தும் விதத்தில் கருத்துத் தெரிவிக்கவும் - அது மற்றவர்கள் தங்கள் சொந்த முடிவுகளுக்கு வர அனுமதிக்கும் ஒரு பொதுவான, அன்பான கருத்தாக இருக்க வேண்டும்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'Say nothing - ideas evolve and I cannot prove origination. Making this a thing will cost more than it gains.', 'ஒன்றும் சொல்ல வேண்டாம் - எண்ணங்கள் காலப்போக்கில் மாறும், அவற்றின் தோற்றத்தை என்னால் நிரூபிக்க முடியாது. இதைச் சாத்தியமாக்குவதால் கிடைக்கும் பலனை விட செலவு அதிகமாகும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'Document the original discussion in writing - dates, participants, content - before doing anything else. If I raise it, I want to be able to back it.', 'வேறு எதையும் செய்வதற்கு முன், அசல் கலந்துரையாடலை - தேதிகள், பங்கேற்பாளர்கள், உள்ளடக்கம் - எழுத்துப்பூர்வமாக ஆவணப்படுத்தவும். நான் ஒரு விஷயத்தை எழுப்பினால், அதை என்னால் ஆதரிக்க முடிய வேண்டும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q18
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A peer is spreading a version of something you said in a casual conversation that strips the context and makes you sound dismissive of a group of people you genuinely respect. It has reached four or five batchmates. Nobody has come to you directly but you can feel the temperature change in a few interactions this week.', NULL, 'நீங்கள் ஒரு சாதாரண உரையாடலில் சொன்ன ஒரு விஷயத்தை, அதன் சூழலைத் திரித்து, நீங்கள் உண்மையாகவே மதிக்கும் ஒரு குழுவினரை அலட்சியப்படுத்துவது போலக் காட்டும் ஒரு பதிப்பை உங்கள் சக மாணவர் ஒருவர் பரப்பி வருகிறார். இது நான்கு அல்லது ஐந்து வகுப்புத் தோழர்களைச் சென்றடைந்துள்ளது. யாரும் நேரடியாக உங்களிடம் வரவில்லை, ஆனால் இந்த வாரத்தில் நடந்த சில உரையாடல்களில் சூழ்நிலை மாறுவதை உங்களால் உணர முடிகிறது.', NULL,
     '{"theme": "Peer Comparison & Competition", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Find the peer and address it directly - I would rather have an uncomfortable conversation than let a false version of me circulate.', 'சக வயதினரைக் கண்டறிந்து நேரடியாகப் பேசுங்கள் - என்னைப் பற்றிய ஒரு பொய்யான பிம்பம் பரவுவதை அனுமதிப்பதை விட, ஒரு சங்கடமான உரையாடலை மேற்கொள்வதே மேல்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Reach out to the batchmates I feel the shift with and have a genuine conversation - I want to correct the record with the people it actually reached.', 'என்னுடன் இந்த மாற்றத்தை உணரும் சக வகுப்பு மாணவர்களைத் தொடர்புகொண்டு ஒரு உண்மையான உரையாடலை மேற்கொள்ள வேண்டும் - உண்மையில் இந்த விஷயம் அவர்களைச் சென்றடைந்தவர்களிடம் உண்மையை தெளிவுபடுத்த விரும்புகிறேன்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Give it a week and see if it settles on its own - responding now might amplify something that would otherwise fade.', 'ஒரு வாரம் பொறுத்திருந்து அது தானாகவே சரியாகிவிடுகிறதா என்று பாருங்கள் - இப்போது பதிலளிப்பது, இல்லையெனில் மங்கிவிடும் ஒரு விஷயத்தை மேலும் பெரிதுபடுத்திவிடக்கூடும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'First establish exactly what was said and to whom before deciding how to respond - I need to understand the actual spread before I react.', 'எப்படிப் பதிலளிப்பது என்று தீர்மானிக்கும் முன், என்ன சொல்லப்பட்டது, யாரிடம் சொல்லப்பட்டது என்பதை முதலில் துல்லியமாக உறுதிப்படுத்திக் கொள்ள வேண்டும் - நான் எதிர்வினையாற்றுவதற்கு முன், உண்மையான பரவலைப் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q19
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are in a seminar and you make a point that you believe is well-founded. A batchmate who is generally regarded as one of the sharper minds in the cohort disagrees with you publicly and confidently. The room shifts toward them. You have about four seconds.', 'What matters more to you in this moment?', 'நீங்கள் ஒரு கருத்தரங்கில் இருக்கிறீர்கள். அங்கே, வலுவான ஆதாரம் இருப்பதாக நீங்கள் நம்பும் ஒரு கருத்தை முன்வைக்கிறீர்கள். உங்கள் குழுவில் பொதுவாகக் கூர்மையான புத்தி கொண்டவர்களில் ஒருவராகக் கருதப்படும் உங்கள் சக மாணவர் ஒருவர், பகிரங்கமாகவும் நம்பிக்கையுடனும் உங்கள் கருத்தை மறுக்கிறார். அறையில் உள்ளவர்களின் கவனம் அவர் பக்கம் திரும்புகிறது. உங்களுக்குச் சுமார் நான்கு வினாடிகள் மட்டுமே உள்ளன.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Peer Comparison & Competition", "dimension": "approval_need vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Holding your position clearly - the room shifting does not make them right and I am not going to fold because of social pressure.', 'உங்கள் நிலைப்பாட்டில் தெளிவாக உறுதியாக இருக்கிறேன் - அறையில் ஏற்படும் மாற்றங்கள் அவர்களைச் சரியாக்கிவிடாது, மேலும் சமூக அழுத்தத்திற்காக நான் மண்டியிடப் போவதில்லை.', 'D', '{"dimension": "approval_need vs accuracy_need"}'),
  (2, 'Staying credible in the room - how I handle the next four seconds will shape how people see me more than who wins the argument.', 'அந்த அறையில் நம்பகத்தன்மையுடன் இருப்பது - விவாதத்தில் யார் வெற்றி பெறுகிறார்கள் என்பதை விட, அடுத்த நான்கு வினாடிகளை நான் எப்படிக் கையாள்கிறேன் என்பதே மக்கள் என்னைப் பற்றி என்ன நினைக்கிறார்கள் என்பதை அதிகம் தீர்மானிக்கும்.', 'I', '{"dimension": "approval_need vs accuracy_need"}'),
  (3, 'Finding a way to acknowledge their point without fully conceding - I want to reduce the tension without losing the substance of what I said.', 'முழுமையாக ஒப்புக்கொள்ளாமல், அவர்கள் சொல்ல வந்ததை ஏற்றுக்கொள்வதற்கான ஒரு வழியைக் கண்டறிவது - நான் சொன்னதன் சாராம்சத்தை இழக்காமல், பதற்றத்தைக் குறைக்க விரும்புகிறேன்.', 'S', '{"dimension": "approval_need vs accuracy_need"}'),
  (4, 'Actually asking myself in those four seconds whether they have a point I missed - because if they are right, the intellectually honest thing is to say so.', 'உண்மையில், அந்த நான்கு வினாடிகளில், அவர்கள் சொல்வதில் நான் கவனிக்கத் தவறிய ஏதேனும் ஒரு கருத்து இருக்கிறதா என்று என்னை நானே கேட்டுக்கொள்வேன் - ஏனென்றால், அவர்கள் சொல்வது சரியாக இருந்தால், அதை வெளிப்படையாகச் சொல்வதுதான் அறிவுப்பூர்வமான நேர்மை.', 'C', '{"dimension": "approval_need vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q20
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Before you say anything - you have just found out that a peer you have quietly measured yourself against all year has been nominated for the programme''s leadership award. You were not nominated. You thought you had a stronger case. Nobody knows you expected to be considered.', 'What is actually happening inside you right now?', 'நீங்கள் எதையும் சொல்வதற்கு முன் - இந்த ஆண்டு முழுவதும் நீங்கள் யாருக்கும் தெரியாமல் உங்களை ஒப்பிட்டுப் பார்த்த உங்கள் சக போட்டியாளர் ஒருவர், அந்தத் திட்டத்தின் தலைமைத்துவ விருதுக்குப் பரிந்துரைக்கப்பட்டிருக்கிறார் என்பதை இப்போதுதான் தெரிந்துகொண்டீர்கள். நீங்கள் பரிந்துரைக்கப்படவில்லை. உங்களுக்குத்தான் வலுவான வாய்ப்பு இருப்பதாக நீங்கள் நினைத்தீர்கள். நீங்கள் பரிசீலிக்கப்படுவீர்கள் என்று எதிர்பார்த்தது யாருக்கும் தெரியாது.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Peer Comparison & Competition", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A hard, immediate redirect - I am already thinking about what I will build in year two that makes this comparison irrelevant.', 'ஒரு உறுதியான, உடனடித் திசைதிருப்பல் - இரண்டாம் ஆண்டில் நான் என்ன உருவாக்கப் போகிறேன் என்பதைப் பற்றி இப்போதே சிந்திக்கத் தொடங்கிவிட்டேன், அது இந்த ஒப்பீட்டைப் பொருத்தமற்றதாக்குகிறது.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A social awareness of how this will read to the batch - who knows you wanted it, who is watching, and what story is now being written.', 'இந்தக் குழுவினருக்கு இது எப்படிப் புரியும் என்பது குறித்த ஒரு சமூக விழிப்புணர்வு – அதாவது, நீங்கள் இதை விரும்பினீர்கள் என்பது யாருக்குத் தெரியும், யார் இதைக் கவனிக்கிறார்கள், இப்போது என்ன கதை எழுதப்படுகிறது என்பனவற்றைப் பற்றிய புரிதல்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A genuine, private sadness that has nothing to do with the award and everything to do with the feeling of being passed over by someone who was running the same race.', 'விருதுடன் எந்த சம்பந்தமும் இல்லாத, ஆனால் அதே பந்தயத்தில் ஓடிய ஒருவரால் புறக்கணிக்கப்பட்ட உணர்வினால் ஏற்பட்ட ஒரு உண்மையான, தனிப்பட்ட சோகம்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'A detached need to understand the selection criteria - because if the process was sound and they were the stronger candidate, you need to know what that means about your own gaps.', 'தேர்வுக்கான அளவுகோல்களைப் பற்றற்ற முறையில் புரிந்துகொள்ள வேண்டிய தேவை உள்ளது - ஏனெனில், அந்த செயல்முறை சரியானதாக இருந்து, அவர்களே சிறந்த வேட்பாளராக இருந்தால், அது உங்கள் சொந்தக் குறைபாடுகளைப் பற்றி என்ன சொல்கிறது என்பதை நீங்கள் தெரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q21
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'During an open-book group exam, you notice that a team from another study group is sharing answers through a group chat in a way that clearly violates the exam rules. You are in the same room. The invigilator has not noticed. The exam ends in ninety minutes.', NULL, 'புத்தகத்தைப் பார்த்து எழுதும் குழுத் தேர்வின் போது, ​​மற்றொரு படிப்புக் குழுவைச் சேர்ந்த ஒரு குழுவினர், தேர்வு விதிகளைத் தெளிவாக மீறும் வகையில் குழு அரட்டை மூலம் விடைகளைப் பகிர்வதை நீங்கள் கவனிக்கிறீர்கள். நீங்கள் அதே அறையில்தான் இருக்கிறீர்கள். தேர்வுக் கண்காணிப்பாளர் அதைக் கவனிக்கவில்லை. இன்னும் தொண்ணூறு நிமிடங்களில் தேர்வு முடிவடைகிறது.', NULL,
     '{"theme": "Ethical Pressure", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Flag it to the invigilator immediately - I am not going to sit on an integrity violation because it is uncomfortable to report.', 'இதை உடனடியாகக் கண்காணிப்பாளரிடம் தெரிவிக்கவும் - புகாரளிப்பது சங்கடமாக இருக்கிறது என்பதற்காக, ஒரு நேர்மை மீறலை நான் கண்டுகொள்ளாமல் இருக்கப் போவதில்லை.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Send a quiet message to someone I trust in that group first - give them a chance to stop before it becomes a formal issue.', 'முதலில் அந்தக் குழுவில் நான் நம்பும் ஒருவருக்கு ஒரு அமைதியான செய்தியை அனுப்பு - அது ஒரு முறையான பிரச்சனையாக மாறுவதற்கு முன்பு, அவர்கள் நிறுத்துவதற்கு ஒரு வாய்ப்பு கொடு.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Say nothing during the exam but raise it with the programme office afterwards - I want to report it without disrupting the room or creating a scene.', 'தேர்வின் போது எதுவும் சொல்லாமல், தேர்வு முடிந்த பிறகு திட்ட அலுவலகத்தில் தெரிவிக்க வேண்டும் - அறையைக் குழப்பாமலோ அல்லது எந்தக் கூச்சலையும் உருவாக்காமலோ நான் இதைப் புகாரளிக்க விரும்புகிறேன்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Note exactly what I observed, when, and who was involved before doing anything - if I am going to report this it needs to be factual and specific.', 'எதையும் செய்வதற்கு முன், நான் என்ன கவனித்தேன், எப்போது, ​​இதில் யார் ஈடுபட்டிருந்தனர் என்பதைத் துல்லியமாகக் குறித்துக்கொள்ள வேண்டும் - நான் இதைப் பதிவு செய்வதாக இருந்தால், அது உண்மைத் தகவல்களுடனும் குறிப்பாகவும் இருக்க வேண்டும்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q22
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your team is finalising a deliverable for a real client. Under deadline pressure, one team member has filled a data gap with a figure they have described as estimated but presented in the document as verified. The client will use this report to make a resourcing decision. Submission is in three hours.', NULL, 'உங்கள் குழு ஒரு உண்மையான வாடிக்கையாளருக்கான ஒப்படைப்பை இறுதி செய்து கொண்டிருக்கிறது. காலக்கெடுவின் நெருக்கடியில், ஒரு குழு உறுப்பினர், ஒரு தரவு இடைவெளியை நிரப்புவதற்காக, மதிப்பிடப்பட்டதாகக் குறிப்பிட்ட ஒரு எண்ணை ஆவணத்தில் சரிபார்த்ததாகக் காட்டியுள்ளார். வாடிக்கையாளர், பணியாளர் ஒதுக்கீடு குறித்த முடிவை எடுக்க இந்த அறிக்கையைப் பயன்படுத்துவார். சமர்ப்பிப்பதற்கான கடைசி நேரம் மூன்று மணி நேரம்.', NULL,
     '{"theme": "Ethical Pressure", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Tell the team member directly that the figure needs to be either verified or clearly labelled as an estimate before this goes to the client. Non-negotiable.', 'வாடிக்கையாளரிடம் அனுப்புவதற்கு முன், இந்தத் தொகை சரிபார்க்கப்பட வேண்டும் அல்லது இது ஒரு மதிப்பீடு என்று தெளிவாகக் குறிப்பிடப்பட வேண்டும் என்பதை குழு உறுப்பினரிடம் நேரடியாகக் கூறுங்கள். இதில் எந்த சமரசமும் இல்லை.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Suggest to the team that we add a methodology footnote that covers all data sources and their confidence levels - frame it as quality, not accusation.', 'அனைத்துத் தரவு மூலங்களையும் அவற்றின் நம்பகத்தன்மை அளவுகளையும் உள்ளடக்கிய ஒரு வழிமுறை அடிக்குறிப்பைச் சேர்க்குமாறு குழுவிற்குப் பரிந்துரைக்கவும் - அதை ஒரு குற்றச்சாட்டாக அல்லாமல், தரத்தின் மேம்பாடாக முன்வைக்கவும்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Raise it with the team lead and let them make the call - I do not want to go over the team member''s head but I also cannot stay silent.', 'இதை அணித் தலைவரிடம் தெரிவித்து, அவரை முடிவெடுக்க விடுங்கள் - நான் அணி உறுப்பினரை மீறிச் செயல்பட விரும்பவில்லை, ஆனால் என்னால் அமைதியாகவும் இருக்க முடியாது.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Spend the next hour trying to verify or replace the figure myself - the cleanest solution is fixing the problem rather than managing the politics of it.', 'அடுத்த ஒரு மணி நேரத்தை அந்த எண்ணிக்கையை நானே சரிபார்க்க அல்லது மாற்றுவதற்குச் செலவிடுங்கள் - அதன் அரசியல் சூழ்ச்சிகளைக் கையாள்வதை விட, பிரச்சனையைச் சரிசெய்வதே மிகத் தெளிவான தீர்வாகும்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q23
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A professor has privately offered you additional flexibility on a deadline in exchange for your help recruiting students to a paid workshop they run outside the programme. The offer is framed as informal and mutually beneficial. You need the deadline extension. The workshop is not inappropriate - but the exchange feels off.', 'Two things are pulling at you. Which is stronger?', 'பாடத்திட்டத்திற்கு வெளியே அவர்கள் நடத்தும் கட்டணப் பயிலரங்கிற்கு மாணவர்களைச் சேர்க்க நீங்கள் உதவுவதற்குப் பதிலாக, ஒரு பேராசிரியர் காலக்கெடுவில் கூடுதல் நெகிழ்வுத்தன்மையை உங்களுக்குத் தனிப்பட்ட முறையில் வழங்கியுள்ளார். இந்தச் சலுகை முறைசாராததாகவும், இருவருக்கும் பரஸ்பர நன்மை பயக்கும் வகையிலும் அமைந்துள்ளது. உங்களுக்குக் காலக்கெடு நீட்டிப்பு தேவைப்படுகிறது. அந்தப் பயிலரங்கம் பொருத்தமற்றதல்ல - ஆனால் இந்த பரிமாற்றம் சரியில்லாததாகத் தோன்றுகிறது.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Ethical Pressure", "dimension": "conflict_response vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The instinct that this is a line I should not cross regardless of how it is framed - and I need to decline clearly even if it costs me the extension.', 'அது எப்படிச் சொல்லப்பட்டாலும், இது நான் தாண்டக்கூடாத ஒரு எல்லை என்ற உள்ளுணர்வு; கால அவகாசம் பறிபோனாலும் சரி, நான் இதைத் தெளிவாக மறுக்க வேண்டும்.', 'D', '{"dimension": "conflict_response vs approval_need"}'),
  (2, 'The anxiety about how declining lands with the professor and whether it quietly affects how they see you for the rest of the term.', 'நமது மதிப்பெண் குறைவது பேராசிரியருக்கு எப்படிப் படும் என்பதும், அது இந்தப் பருவத்தின் மீதமுள்ள நாட்களில் அவர் உங்களைப் பார்க்கும் விதத்தை மறைமுகமாகப் பாதிக்குமா என்பது பற்றிய கவலையும்.', 'I', '{"dimension": "conflict_response vs approval_need"}'),
  (3, 'The discomfort of being put in this position at all - you do not want to damage the relationship but you also do not want to agree to something that does not feel right.', 'இந்த நிலைக்குத் தள்ளப்படுவதே ஒரு சங்கடமான விஷயம் - நீங்கள் உறவைச் சேதப்படுத்த விரும்பவில்லை, அதே சமயம் சரியெனத் தோன்றாத ஒரு விஷயத்திற்கு ஒப்புக்கொள்ளவும் விரும்பவில்லை.', 'S', '{"dimension": "conflict_response vs approval_need"}'),
  (4, 'The need to think through exactly what is being asked and whether it technically violates any programme policy before deciding how to respond.', 'எவ்வாறு பதிலளிப்பது எனத் தீர்மானிப்பதற்கு முன், என்ன கேட்கப்படுகிறது என்பதையும், அது தொழில்நுட்ப ரீதியாக ஏதேனும் திட்டக் கொள்கையை மீறுகிறதா என்பதையும் முழுமையாகச் சிந்தித்துப் பார்க்க வேண்டிய அவசியம் உள்ளது.', 'C', '{"dimension": "conflict_response vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q24
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you signed off on a team deliverable under time pressure without reading one section carefully. That section contained a significant factual error. The client has now flagged it. The team is being asked to explain how it happened. Nobody on the team knows you did not read it.', 'What is actually happening inside you before the team call?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: நேர நெருக்கடியில், ஒரு குழுவின் ஒப்படைப்புத் திட்டத்தில் உள்ள ஒரு பகுதியை நீங்கள் கவனமாகப் படிக்காமலேயே ஒப்புதல் அளித்துவிட்டீர்கள். அந்தப் பகுதியில் ஒரு முக்கியமான உண்மைப் பிழை இருந்தது. வாடிக்கையாளர் இப்போது அதைக் குறிப்பிட்டுள்ளார். அது எப்படி நடந்தது என்று விளக்குமாறு குழுவிடம் கேட்கப்படுகிறது. நீங்கள் அதைப் படிக்கவில்லை என்பது குழுவில் உள்ள யாருக்கும் தெரியாது.', 'அணி அழைப்பிற்கு முன்பு உங்களுக்குள் உண்மையில் என்ன நடக்கிறது?',
     '{"theme": "Ethical Pressure", "dimension": "accuracy_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A clean decision already forming - I am going to own my part in this on the call. Letting the team carry something that is partly my failure is not something I can do.', 'ஒரு தெளிவான முடிவு ஏற்கனவே உருவாகி வருகிறது - இந்த அழைப்பின்போது இதில் எனது பங்கை நான் ஏற்றுக்கொள்வேன். ஓரளவிற்கு எனது தோல்வியின் சுமையை அணியின் மீது சுமத்துவதை என்னால் செய்ய முடியாது.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'A heightened awareness of how the call is going to go and how each person in the room will be reading each other''s responses.', 'அழைப்பு எவ்வாறு செல்லப் போகிறது என்பதையும், அறையில் உள்ள ஒவ்வொருவரும் ஒருவருக்கொருவரின் பதில்களை எவ்வாறு புரிந்துகொள்வார்கள் என்பதையும் பற்றிய ஒரு மேம்பட்ட விழிப்புணர்வு.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'A heavy guilt that is less about the error and more about the fact that your teammates are going into this call not knowing the full picture.', 'அந்தத் தவறைப் பற்றியதை விட, முழுமையான நிலவரம் தெரியாமல் உங்கள் சக வீரர்கள் இந்த முடிவை எடுக்கிறார்கள் என்பதே அதிக குற்றவுணர்வைத் தருகிறது.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'A precise replay of the moment you chose not to read that section - you need to understand the decision you made before you can explain or account for it.', 'நீங்கள் அந்தப் பகுதியைப் படிக்க வேண்டாம் என்று முடிவு செய்த தருணத்தின் துல்லியமான மீள்பார்வை - நீங்கள் எடுத்த முடிவை விளக்கவோ அல்லது அதற்கான காரணத்தைக் கூறவோ செய்வதற்கு முன்பு, அந்த முடிவை நீங்கள் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q25
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are pitching a student initiative to a VC panel as part of a programme competition. One of the panellists - a well-known investor - is visibly unengaged from the first slide. They are checking their phone. The rest of the panel is attentive. You have eight minutes left.', NULL, 'ஒரு நிகழ்ச்சிப் போட்டியின் ஒரு பகுதியாக, நீங்கள் ஒரு மாணவர் முன்னெடுப்பு ஒன்றை துணிகர முதலீட்டாளர் குழுவிடம் முன்வைக்கிறீர்கள். குழு உறுப்பினர்களில் ஒருவரான, நன்கு அறியப்பட்ட முதலீட்டாளர், முதல் ஸ்லைடிலிருந்தே வெளிப்படையாக ஆர்வமின்றி இருக்கிறார். அவர் தனது கைப்பேசியைப் பார்த்துக் கொண்டிருக்கிறார். குழுவின் மற்ற உறுப்பினர்கள் கவனத்துடன் இருக்கிறார்கள். உங்களுக்கு இன்னும் எட்டு நிமிடங்கள் உள்ளன.', NULL,
     '{"theme": "Communication & Influence", "dimension": "approval_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Speak directly to the disengaged panellist - make a point specifically designed to pull them back in, even if it means departing from the script.', 'ஆர்வமில்லாத குழு உறுப்பினரிடம் நேரடியாகப் பேசுங்கள் - திட்டமிடப்பட்ட உரையிலிருந்து விலக நேர்ந்தாலும், அவர்களை மீண்டும் ஈர்ப்பதற்காகவே பிரத்யேகமாக ஒரு கருத்தை முன்வையுங்கள்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'Increase the energy in the room - if I lift the pitch''s momentum the whole panel will shift, including them.', 'அறையின் ஆற்றலை அதிகரியுங்கள் - நான் சுருதியின் வேகத்தை உயர்த்தினால், அவர்கள் உட்பட முழு குழுவும் நிலை குலைந்துவிடும்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'Stay the course and deliver to the engaged panellists - trying to win back someone who has checked out mid-pitch risks losing the ones you already have.', 'தொடர்ந்து முயற்சி செய்து, ஆர்வமுள்ள குழு உறுப்பினர்களுக்கு வழங்குங்கள் - விளக்கக்காட்சியின் பாதியிலேயே ஆர்வம் இழந்த ஒருவரை மீண்டும் ஈர்க்க முயற்சிப்பது, உங்களிடம் ஏற்கனவே உள்ளவர்களை இழக்கும் அபாயத்தை ஏற்படுத்தும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'Move quickly to the data slide - if anything will re-engage an investor it is numbers, and I know that section is strong.', 'விரைவாகத் தரவு ஸ்லைடுக்குச் செல்லுங்கள் - ஒரு முதலீட்டாளரை மீண்டும் ஈர்க்கக்கூடிய விஷயம் எதுவென்றால், அது எண்கள்தான், மேலும் அந்தப் பிரிவு வலுவானது என்று எனக்குத் தெரியும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q26
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are delivering a town hall update to your batch on a facilities issue that has been handled poorly by the administration. You have been asked by the administration to present their position. You personally believe the administration is wrong and the batch''s grievance is legitimate.', NULL, 'நிர்வாகத்தால் மோசமாகக் கையாளப்பட்ட ஒரு வசதிகள் பிரச்சினை குறித்து, உங்கள் குழுவினருக்கு நீங்கள் ஒரு பொதுக்கூட்டம் நடத்துகிறீர்கள். அவர்களின் நிலைப்பாட்டை முன்வைக்குமாறு நிர்வாகம் உங்களைக் கேட்டுக்கொண்டுள்ளது. நிர்வாகம் தவறு செய்கிறது என்றும், உங்கள் குழுவினரின் குறை நியாயமானது என்றும் நீங்கள் தனிப்பட்ட முறையில் நம்புகிறீர்கள்.', NULL,
     '{"theme": "Communication & Influence", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Present the facts honestly and let the batch draw their own conclusions - I will not be a mouthpiece for a position I do not believe in.', 'உண்மைகளை நேர்மையாக முன்வையுங்கள், குழுவினர் தங்கள் சொந்த முடிவுகளை எடுக்கட்டும் - நான் நம்பாத ஒரு நிலைப்பாட்டிற்கு நான் குரல் கொடுக்க மாட்டேன்.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Present the administration''s position but create space in the Q&A for the batch to voice their concerns - hold the room without shutting it down.', 'நிர்வாகத்தின் நிலைப்பாட்டை முன்வையுங்கள், ஆனால் கேள்வி-பதில் அமர்வில் புதிய குழுவினர் தங்கள் கவலைகளை வெளிப்படுத்த இடம் அளியுங்கள் - சூழலை முடக்கிவிடாமல், அதில் பங்கேற்பாளர்களின் கவனத்தை ஈர்க்கவும்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Deliver what was asked of me today and raise my own reservations with the administration privately afterwards - this is not the moment to create a public split.', 'இன்று என்னிடம் கோரப்பட்டதை நிறைவேற்றிவிட்டு, அதன் பிறகு எனது ஆட்சேபணைகளை நிர்வாகத்திடம் தனிப்பட்ட முறையில் தெரிவிக்க வேண்டும் - இது பகிரங்கப் பிளவை உருவாக்குவதற்கான தருணம் அல்ல.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Present both the administration''s position and the counterarguments explicitly - the batch deserves the complete picture to form their own view.', 'நிர்வாகத்தின் நிலைப்பாட்டையும் எதிர்வாதங்களையும் தெளிவாக முன்வையுங்கள் - அந்தத் தொகுதி மக்கள் தங்கள் சொந்தக் கருத்தை உருவாக்கிக்கொள்ள முழுமையான விவரங்களைப் பெறத் தகுதியுடையவர்கள்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q27
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are in a high-stakes negotiation with a faculty panel over a group grade appeal. You prepared a detailed case. Midway through, the panel asks a question that reveals they have misunderstood a key element of your argument. Correcting them directly will slow the session down and may feel confrontational. Letting it pass means your case will be evaluated on a false premise.', 'What matters more to you in this moment?', 'குழு மதிப்பெண் மேல்முறையீடு தொடர்பாக, பேராசிரியர்கள் குழுவுடன் நீங்கள் ஒரு முக்கியமான பேச்சுவார்த்தையில் ஈடுபட்டுள்ளீர்கள். நீங்கள் ஒரு விரிவான வாதத்தைத் தயாரித்துள்ளீர்கள். பேச்சுவார்த்தையின் நடுவில், உங்கள் வாதத்தின் ஒரு முக்கிய அம்சத்தை அவர்கள் தவறாகப் புரிந்துகொண்டதை வெளிப்படுத்தும் ஒரு கேள்வியை அந்தக் குழு கேட்கிறது. அவர்களை நேரடியாகத் திருத்துவது அமர்வின் வேகத்தைக் குறைப்பதோடு, ஒரு மோதல் போக்கையும் ஏற்படுத்தக்கூடும். அதை அப்படியே விட்டுவிட்டால், உங்கள் வாதம் ஒரு தவறான முன்முடிவின் அடிப்படையில் மதிப்பிடப்படும்.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Communication & Influence", "dimension": "approval_need vs control_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Correcting the misunderstanding clearly and immediately - I would rather slow this down than have the outcome hinge on something they got wrong.', 'தவறான புரிதலைத் தெளிவாகவும் உடனடியாகவும் சரிசெய்வது - அவர்கள் தவறாகப் புரிந்துகொண்ட ஒரு விஷயத்தைப் பொறுத்து முடிவு அமைவதை விட, இதை மெதுவாகக் கொண்டு செல்வதே மேல்.', 'D', '{"dimension": "approval_need vs control_need"}'),
  (2, 'Finding a way to reframe the point that makes the correction feel like a natural continuation rather than a challenge to what they said.', 'அவர்கள் சொன்னதற்கு ஒரு சவாலாகத் தோன்றுவதற்குப் பதிலாக, அந்தத் திருத்தத்தை ஒரு இயல்பான தொடர்ச்சியாக உணரவைக்கும் வகையில், அந்தக் கருத்தை வேறு கோணத்தில் முன்வைப்பதற்கான ஒரு வழியைக் கண்டறிதல்.', 'I', '{"dimension": "approval_need vs control_need"}'),
  (3, 'Letting it pass for now and addressing it in a follow-up submission - pushing back on a panel mid-session risks creating friction that hurts the outcome.', 'தற்போதைக்கு இதைக் கண்டுகொள்ளாமல் விட்டுவிட்டு, அடுத்தகட்ட சமர்ப்பிப்பில் இதைக் கையாள்வது - அமர்வின் நடுவில் ஒரு குழுவை எதிர்ப்பது, முடிவைப் பாதிக்கும் உராய்வை உருவாக்கும் அபாயத்தைக் கொண்டுள்ளது.', 'S', '{"dimension": "approval_need vs control_need"}'),
  (4, 'Pausing and asking a clarifying question that draws out the misunderstanding without directly saying they got it wrong - let them arrive at the correction themselves.', 'அவர்கள் தவறு செய்துவிட்டார்கள் என்று நேரடியாகக் கூறாமல், தவறான புரிதலை வெளிக்கொணரும் ஒரு தெளிவுபடுத்தும் கேள்வியைக் கேட்டு, சற்று நிறுத்தி, அவர்களாகவே திருத்திக்கொள்ளட்டும்.', 'C', '{"dimension": "approval_need vs control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q28
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you gave a presentation last week that you felt good about. A media outlet covering student innovation at your school ran a short piece on it, but the quote they used from you was taken slightly out of context and made your argument sound simpler than it was. Several faculty members have seen it.', 'What is actually happening inside you?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: கடந்த வாரம் நீங்கள் வழங்கிய விளக்கக்காட்சி உங்களுக்கு திருப்தியளித்தது. உங்கள் பள்ளியில் மாணவர்களின் புத்தாக்கத்தைப் பற்றி செய்தி வெளியிடும் ஒரு ஊடகம், அதுகுறித்து ஒரு சிறு செய்தியை வெளியிட்டது. ஆனால், அதில் அவர்கள் பயன்படுத்திய உங்கள் மேற்கோள், சூழலிலிருந்து சற்றே விலகி எடுக்கப்பட்டு, உங்கள் வாதத்தை இருந்ததை விட எளிமையாகக் காட்டியது. பல பேராசிரியர்கள் அதைப் பார்த்திருக்கிறார்கள்.', 'உங்களுக்குள் உண்மையில் என்னதான் நடக்கிறது?',
     '{"theme": "Communication & Influence", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A mild irritation that you move through quickly - media simplifies things, this is not a crisis, and I have better things to focus on.', 'விரைவாகக் கடந்துசெல்லக்கூடிய ஒரு லேசான எரிச்சல் - ஊடகங்கள் விஷயங்களை எளிமைப்படுத்துகின்றன, இது ஒரு நெருக்கடி அல்ல, மேலும் கவனம் செலுத்த எனக்கு இதைவிட முக்கியமான விஷயங்கள் உள்ளன.', 'D', '{"dimension": "approval_need"}'),
  (2, 'A heightened self-consciousness about which faculty members saw it and whether it has quietly shifted how they think about the depth of your thinking.', 'பேராசிரியர்கள் அதை எப்படிப் பார்த்தார்கள் என்பது பற்றியும், அது உங்கள் சிந்தனையின் ஆழத்தைப் பற்றி அவர்கள் சிந்திக்கும் விதத்தை அமைதியாக மாற்றிவிட்டதா என்பது குறித்தும் ஒரு அதிகரித்த சுய விழிப்புணர்வு.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A specific discomfort about one faculty member whose opinion matters to you and whose impression of you this article may have slightly altered.', 'உங்கள் கருத்துக்கு மதிப்பளிக்கும் ஒரு பேராசிரியர் குறித்த ஒரு குறிப்பிட்ட சங்கடம்; மேலும், இந்தக் கட்டுரை உங்களைப் பற்றிய அவரது எண்ணத்தை சற்றே மாற்றியிருக்கக்கூடும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'An almost editorial frustration - you know exactly which sentence should have been used instead and the gap between what was printed and what you actually meant is specific and rankles.', 'இது கிட்டத்தட்ட ஒரு பதிப்பாசிரியரின் விரக்தி போன்றது - அதற்குப் பதிலாக எந்த வாக்கியத்தைப் பயன்படுத்தியிருக்க வேண்டும் என்பது உங்களுக்குத் துல்லியமாகத் தெரியும், ஆனால் அச்சிடப்பட்டதற்கும் நீங்கள் உண்மையில் கூற விரும்பியதற்கும் இடையிலான வேறுபாடு மிகத் தெளிவாகவும் உறுத்தலாகவும் இருக்கும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q29
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate you respect has approached you about co-founding a startup together. The idea is early but credible. They want a commitment in principle within the next two weeks - they are talking to one other potential co-founder and want to know if you are in before they decide. You came to this MBA with a clear corporate career plan. This is not part of it.', NULL, 'நீங்கள் மதிக்கும் உங்கள் சக வகுப்பு மாணவர் ஒருவர், உங்களுடன் இணைந்து ஒரு ஸ்டார்ட்அப் நிறுவனத்தைத் தொடங்குவது குறித்துப் பேசியுள்ளார். இந்த யோசனை ஆரம்ப நிலையில் இருந்தாலும், நம்பகமானது. அடுத்த இரண்டு வாரங்களுக்குள் கொள்கை ரீதியான ஒப்புதலை அவர்கள் எதிர்பார்க்கிறார்கள். மற்றொரு சாத்தியமான இணை நிறுவனருடனும் அவர்கள் பேசி வருகிறார்கள், முடிவெடுப்பதற்கு முன்பு நீங்கள் இதில் இணைகிறீர்களா என்பதைத் தெரிந்துகொள்ள விரும்புகிறார்கள். நீங்கள் ஒரு தெளிவான கார்ப்பரேட் தொழில் திட்டத்துடன்தான் இந்த MBA-விற்கு வந்தீர்கள். இது அதன் ஒரு பகுதியல்ல.', NULL,
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Give them a clear answer within the week - either I am in or I am not, and sitting on it helps neither of us.', 'ஒரு வாரத்திற்குள் அவர்களுக்கு ஒரு தெளிவான பதிலைக் கொடுங்கள் - ஒன்று நான் பங்கேற்கிறேன் அல்லது இல்லை, தாமதிப்பதால் நம் இருவருக்கும் எந்தப் பயனும் இல்லை.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'Have a longer conversation with them first - I want to understand the vision, the dynamic, and what this would actually mean for us before I say anything.', 'முதலில் அவர்களுடன் நீண்ட நேரம் உரையாடுங்கள் - நான் எதையும் சொல்வதற்கு முன், அவர்களின் தொலைநோக்குப் பார்வை, அதன் செயல்முறை மற்றும் இது உண்மையில் நமக்கு என்னவாக அமையும் என்பதைப் புரிந்துகொள்ள விரும்புகிறேன்.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'Tell them I am seriously interested but need a bit more time to think it through - I do not want to commit to something this significant without sitting with it properly.', 'எனக்கு இதில் மிகுந்த ஆர்வம் உள்ளது, ஆனால் இதைப்பற்றி முழுமையாக யோசிக்க இன்னும் சிறிது நேரம் தேவை என்று அவர்களிடம் சொல்லுங்கள். இவ்வளவு முக்கியமான ஒரு விஷயத்தைப் பற்றி முறையாக யோசிக்காமல் நான் ஒப்புக்கொள்ள விரும்பவில்லை.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'Ask for the full picture - business model, division of responsibilities, financial projections - before I can have any meaningful conversation about being in.', 'இதில் இணைவது குறித்து அர்த்தமுள்ள உரையாடலை மேற்கொள்வதற்கு முன், வணிக மாதிரி, பொறுப்புப் பங்கீடு, நிதி முன்னறிவிப்புகள் போன்ற முழுமையான விவரங்களைக் கேளுங்கள்.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q30
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A scholarship has come up that would fund the rest of your MBA in full. The condition is a two-year commitment to work in a geography you are uncertain about after graduation. Applications close in four days. Taking it means locking in a post-graduation path you have not yet decided you want.', NULL, 'உங்கள் MBA படிப்பின் மீதமுள்ள முழுச் செலவிற்கும் நிதியளிக்கும் ஒரு கல்வி உதவித்தொகை அறிவிக்கப்பட்டுள்ளது. பட்டப்படிப்பு முடிந்த பிறகு, நீங்கள் உறுதியாகத் தேர்ந்தெடுக்காத ஒரு புவியியல் பகுதியில் இரண்டு ஆண்டுகள் பணிபுரிய வேண்டும் என்பதே இதற்கான நிபந்தனையாகும். விண்ணப்பங்கள் நான்கு நாட்களில் முடிவடைகின்றன. இந்த உதவித்தொகையை ஏற்றுக்கொள்வதன் மூலம், நீங்கள் இன்னும் தேர்ந்தெடுக்க விரும்பாத ஒரு பட்டப்படிப்புக்குப் பிந்தைய பாதையை உறுதி செய்துகொள்ளலாம்.', NULL,
     '{"theme": "Ambiguity & Risk", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Apply now and figure out the geography question later - funding is real and opportunities are not. I can always reassess the post-graduation decision closer to the time.', 'இப்போதே விண்ணப்பியுங்கள், புவியியல் சார்ந்த விஷயத்தை பிறகு பார்த்துக்கொள்ளலாம் - நிதி உதவி என்பது உண்மையானது, ஆனால் வாய்ப்புகள் அப்படியல்ல. பட்டப்படிப்புக்குப் பிந்தைய முடிவை, உரிய நேரத்தில் நான் எப்போது வேண்டுமானாலும் மறுபரிசீலனை செய்துகொள்ளலாம்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Reach out to alumni who took similar scholarships and talk to people who know the geography before I decide anything.', 'எதையும் முடிவு செய்வதற்கு முன், இதே போன்ற கல்வி உதவித்தொகைகளைப் பெற்ற முன்னாள் மாணவர்களைத் தொடர்புகொண்டு, அப்பகுதியின் புவியியல் பற்றி அறிந்தவர்களுடன் பேச வேண்டும்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Discuss it with my family and one or two people who know me well before applying - this affects more than just me.', 'விண்ணப்பிப்பதற்கு முன் என் குடும்பத்தினருடனும், என்னை நன்கு அறிந்த ஓரிருவருடனும் இது குறித்துக் கலந்துரையாடுங்கள் - இது என்னை மட்டுமல்ல, பலரையும் பாதிக்கும்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Map out the actual implications of the two-year commitment against my career goals before touching the application - I will not apply to something I have not properly evaluated.', 'விண்ணப்பத்தைத் தொடுவதற்கு முன், இந்த இரண்டு வருட கால அர்ப்பணிப்பின் உண்மையான தாக்கங்களை எனது தொழில் இலக்குகளுடன் ஒப்பிட்டுப் பாருங்கள் - நான் முறையாக மதிப்பீடு செய்யாத ஒன்றிற்கு விண்ணப்பிக்க மாட்டேன்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q31
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'An accelerator programme has accepted you for a cohort that runs directly through placement season. The programme is prestigious and the startup opportunity is real. But participating means missing most of the structured placement process your school runs, and the outcome on the other side of the accelerator is genuinely uncertain.', 'The conflict you feel most is between:', 'வேலைவாய்ப்புப் பருவம் முடியும் வரை நேரடியாகச் செயல்படும் ஒரு குழுவிற்காக, ஒரு முடுக்கித் திட்டம் உங்களை ஏற்றுக்கொண்டுள்ளது. இந்தத் திட்டம் மதிப்புமிக்கது, மேலும் புத்தொழில் தொடங்கும் வாய்ப்பும் உண்மையானது. ஆனால் இதில் பங்கேற்பதன் மூலம், உங்கள் கல்வி நிறுவனம் நடத்தும் கட்டமைக்கப்பட்ட வேலைவாய்ப்புச் செயல்முறையின் பெரும்பகுதியை நீங்கள் தவறவிட நேரிடும். மேலும், இந்த முடுக்கித் திட்டத்தின் மறுபக்கத்தில் கிடைக்கும் முடிவு உண்மையாகவே நிச்சயமற்றது.', 'நீங்கள் மிகவும் உணரும் முரண்பாடு இவற்றுக்கு இடையே உள்ளது:',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The pull of the certain placement path versus the pull of the uncertain but potentially more meaningful accelerator - and the frustration that you cannot have both.', 'ஒரு நிச்சயமான வேலைவாய்ப்புப் பாதையின் ஈர்ப்புக்கும், நிச்சயமற்ற ஆனால் சாத்தியமான வகையில் அதிக அர்த்தமுள்ளதாக இருக்கக்கூடிய ஒரு உந்துசக்தியின் ஈர்ப்புக்கும் இடையிலான போராட்டம் - மற்றும் இரண்டையும் ஒரே நேரத்தில் பெற முடியாது என்ற விரக்தி.', 'D', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (2, 'What excites you privately and what you can confidently explain to your family and batchmates without feeling like you are justifying a gamble.', 'தனிப்பட்ட முறையில் உங்களை உற்சாகப்படுத்துவது எது, மேலும் ஒரு சூதாட்டத்தை நியாயப்படுத்துவது போன்ற உணர்வின்றி உங்கள் குடும்பத்தினரிடமும் சக மாணவர்களிடமும் நம்பிக்கையுடன் விளக்கக்கூடியது எது.', 'I', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (3, 'The security of a structured outcome and the anxiety of not knowing whether stepping off that path will leave you exposed in ways you cannot yet see.', 'ஒரு கட்டமைக்கப்பட்ட விளைவின் பாதுகாப்பு மற்றும் அந்தப் பாதையிலிருந்து விலகினால், நம்மால் இன்னும் காண முடியாத வழிகளில் அது நம்மைப் பாதிப்புக்குள்ளாக்குமா என்ற கவலை.', 'S', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (4, 'The fact that the accelerator outcome is too uncertain to model - and committing to something you cannot evaluate properly goes against how you make decisions.', 'முடுக்கித் திட்டத்தின் விளைவு மாதிரியாகக் காட்ட முடியாத அளவுக்கு நிச்சயமற்றது என்பதும், உங்களால் சரியாக மதிப்பிட முடியாத ஒரு விஷயத்திற்கு உறுதியளிப்பதும், நீங்கள் முடிவெடுக்கும் முறைக்கு முரணானது.', 'C', '{"dimension": "change_tolerance vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q32
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Before you say anything - a family health situation has escalated and you may need to take a leave of absence from the programme for six to eight weeks. You are midway through the year. You have not told your study group, your faculty advisor, or your placement contact. You do not yet know how serious this will be.', 'What is actually happening inside you right now?', 'நீங்கள் எதையும் சொல்வதற்கு முன் - உங்கள் குடும்பத்தில் உடல்நலப் பிரச்சினை தீவிரமடைந்துள்ளது, அதனால் நீங்கள் இந்தப் பாடத்திட்டத்திலிருந்து ஆறு முதல் எட்டு வாரங்களுக்கு விடுப்பு எடுக்க வேண்டியிருக்கலாம். நீங்கள் ஆண்டின் பாதியில் இருக்கிறீர்கள். உங்கள் படிப்புக் குழுவிடமோ, துறை ஆலோசகரிடமோ, அல்லது உங்கள் பணி நியமனத் தொடர்பாளரிடமோ நீங்கள் இன்னும் தெரிவிக்கவில்லை. இது எவ்வளவு தீவிரமானதாக இருக்கும் என்பது உங்களுக்கு இன்னும் தெரியாது.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A practical sequencing already forming - who needs to know first, what needs to be put in place, and how do I protect as much of this year as possible.', 'யாருக்கு முதலில் தெரியப்படுத்த வேண்டும், என்னென்ன ஏற்பாடுகளைச் செய்ய வேண்டும், இந்த ஆண்டை என்னால் முடிந்தவரை எப்படிப் பாதுகாப்பது என்பது குறித்த ஒரு நடைமுறை வரிசைமுறை ஏற்கனவே உருவாகி வருகிறது.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'An awareness of how this will land with different people and whether the relationships you have built can hold through an extended absence.', 'இது வெவ்வேறு நபர்களிடம் எவ்வாறு தாக்கத்தை ஏற்படுத்தும் என்பதையும், நீண்டகாலப் பிரிவின்போது நீங்கள் உருவாக்கிய உறவுகள் நீடிக்குமா என்பதையும் பற்றிய ஒரு விழிப்புணர்வு.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'A grief that has nothing to do with the programme - the situation at home is what it is and everything else feels very small right now.', 'நிகழ்ச்சிக்கும் இதற்கும் எந்த சம்பந்தமும் இல்லை - வீட்டில் நிலைமை அப்படித்தான் இருக்கிறது, மற்ற எல்லாமே இப்போது மிகவும் அற்பமாகத் தெரிகிறது.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'An urgent need to understand the actual timeline and implications before you tell anyone anything - you will not raise this until you know what you are actually dealing with.', 'யாரிடமும் எதையும் சொல்வதற்கு முன், உண்மையான காலவரிசை மற்றும் அதன் விளைவுகளைப் புரிந்துகொள்ள வேண்டிய அவசரத் தேவை உள்ளது - நீங்கள் உண்மையில் எதைக் கையாளுகிறீர்கள் என்பதைத் தெரிந்துகொள்ளும் வரை இதை எழுப்பக் கூடாது.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q33
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your faculty advisor has given you written feedback on your thesis proposal saying your research question is interesting but your methodology is not yet defensible. The proposal is due for formal submission in three weeks. Two months of framing have gone into the current approach.', NULL, 'உங்கள் ஆய்வுக் கேள்வி சுவாரஸ்யமாக உள்ளது, ஆனால் உங்கள் ஆய்வு முறை இன்னும் ஏற்றுக்கொள்ளத்தக்கதாக இல்லை என்று உங்கள் துறை ஆலோசகர் உங்கள் ஆய்வறிக்கை முன்மொழிவு குறித்து எழுத்துப்பூர்வமான கருத்தை வழங்கியுள்ளார். இந்த முன்மொழிவை இன்னும் மூன்று வாரங்களில் முறைப்படி சமர்ப்பிக்க வேண்டும். தற்போதைய அணுகுமுறையை வடிவமைப்பதற்கு இரண்டு மாதங்கள் செலவிடப்பட்டுள்ளன.', NULL,
     '{"theme": "Feedback & Failure", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Set up a meeting with the advisor within 48 hours and get a clear steer on what defensible looks like - I need direction not just a diagnosis.', '48 மணி நேரத்திற்குள் ஆலோசகருடன் ஒரு சந்திப்பை ஏற்பாடு செய்து, தற்காப்புக்கு உகந்தது எது என்பது குறித்துத் தெளிவான வழிகாட்டுதலைப் பெறுங்கள் - எனக்கு வெறும் நோயறிதல் அல்ல, வழிகாட்டுதல் தேவை.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Talk to two or three PhD students who have been through the process and find out what advisors in this department typically want to see.', 'இந்தச் செயல்முறையை ஏற்கனவே கடந்து வந்த இரண்டு அல்லது மூன்று முனைவர் பட்ட மாணவர்களிடம் பேசி, இந்தத் துறையில் உள்ள ஆலோசகர்கள் பொதுவாக என்ன எதிர்பார்க்கிறார்கள் என்பதைத் தெரிந்துகொள்ளுங்கள்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Sit with the feedback for a day before responding - I want to understand it fully rather than react immediately and go in the wrong direction.', 'பதிலளிப்பதற்கு முன், அந்தக் கருத்தை ஒரு நாள் யோசித்துப் பாருங்கள் - உடனடியாக எதிர்வினையாற்றித் தவறான திசையில் செல்வதை விட, அதை நான் முழுமையாகப் புரிந்துகொள்ள விரும்புகிறேன்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Go back through the methodology section line by line and identify every point of vulnerability before I speak to anyone - I want to come to the next conversation having done my own audit first.', 'நான் யாரிடமும் பேசுவதற்கு முன்பு, வழிமுறைப் பகுதியை வரிக்கு வரி மீண்டும் படித்து, பாதிப்புக்குள்ளாகக்கூடிய ஒவ்வொரு இடத்தையும் கண்டறியுங்கள் - நான் முதலில் எனது சொந்த தணிக்கையைச் செய்த பின்னரே அடுத்த உரையாடலுக்கு வர விரும்புகிறேன்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q34
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You delivered a negotiation role-play in class. Your faculty observer''s feedback was that you were analytically strong but that you conceded too early under pressure and signalled your floor before you needed to. You felt you were being strategic in the moment. You did not see it as early concession.', NULL, 'நீங்கள் வகுப்பில் ஒரு பேச்சுவார்த்தை தொடர்பான பாத்திரமேற்று நடித்துக் காட்டினீர்கள். உங்கள் துறைசார் கண்காணிப்பாளரின் பின்னூட்டத்தின்படி, நீங்கள் பகுப்பாய்வுத் திறனில் வலுவாக இருந்தீர்கள், ஆனால் அழுத்தத்தின் காரணமாக மிக விரைவாக விட்டுக்கொடுத்தீர்கள், மேலும் தேவைப்படுவதற்கு முன்பே உங்கள் நிலைப்பாட்டைத் தெளிவுபடுத்திவிட்டீர்கள். அந்தத் தருணத்தில் நீங்கள் வியூகத்துடன் செயல்படுவதாக உணர்ந்தீர்கள். அதை நீங்கள் முன்கூட்டிய விட்டுக்கொடுப்பாகக் கருதவில்லை.', NULL,
     '{"theme": "Feedback & Failure", "dimension": "accuracy_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Accept the feedback and move on - one exercise is one data point and extended reflection is just delayed practice.', 'பின்னூட்டத்தை ஏற்றுக்கொண்டு அடுத்த கட்டத்திற்குச் செல்லுங்கள் - ஒரு பயிற்சி என்பது ஒரு தரவுப் புள்ளி, மேலும் விரிவான சிந்தனை என்பது தாமதப்படுத்தப்பட்ட பயிற்சியே ஆகும்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'Talk it through with a batchmate who was watching - I want a second perspective from someone who was in the room before I decide how much weight to give this.', 'இதைப் பார்த்துக் கொண்டிருந்த உங்கள் வகுப்புத் தோழருடன் கலந்துரையாடுங்கள் - இதற்கு எவ்வளவு முக்கியத்துவம் கொடுப்பது என்று தீர்மானிப்பதற்கு முன், அந்த அறையில் இருந்த ஒருவரிடமிருந்து இரண்டாவது கண்ணோட்டத்தை நான் விரும்புகிறேன்.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'Let it sit for a day before revisiting - feedback lands differently when you are not still in the room where it happened.', 'ஒரு நாள் அப்படியே விட்டுவிட்டு மீண்டும் பார்க்கவும் - சம்பவம் நடந்த அறையில் நீங்கள் இல்லாதபோது, ​​பின்னூட்டம் வேறுவிதமாகப் புரியும்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'Write out the exact sequence of the negotiation as I remember it and map it against the feedback - I need to know whether they are right before I change anything.', 'எனக்கு நினைவில் உள்ளபடி பேச்சுவார்த்தையின் சரியான வரிசையை எழுதி, அதை பின்னூட்டத்துடன் ஒப்பிட்டுப் பார்க்க வேண்டும் - நான் எதையும் மாற்றுவதற்கு முன் அவர்கள் சொல்வது சரியா என்பதை நான் தெரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q35
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have received anonymous peer feedback that is almost certainly from a specific batchmate - the phrasing is recognisable and the observations are too precise to be coincidental. The feedback is critical but not unfair. The batchmate does not know that you have identified them.', 'Two things are pulling at you. Which is stronger?', 'நீங்கள் அநாமதேய சக மாணவர் கருத்தைப் பெற்றுள்ளீர்கள், இது கிட்டத்தட்ட நிச்சயமாக ஒரு குறிப்பிட்ட வகுப்புத் தோழரிடமிருந்து வந்ததாகும் - அதன் சொற்கள் அடையாளம் காணக்கூடியவையாக உள்ளன, மேலும் அதில் உள்ள கருத்துகள் தற்செயலாக நிகழ்ந்திருக்க முடியாத அளவுக்குத் துல்லியமாக இருக்கின்றன. அந்தக் கருத்து விமர்சன ரீதியானது, ஆனால் நியாயமற்றது அல்ல. நீங்கள் அவர்களை அடையாளம் கண்டுகொண்டது அந்த வகுப்புத் தோழருக்குத் தெரியாது.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The pull to use the feedback on its merits and say nothing - whether I know who wrote it is irrelevant to whether it is true.', 'கிடைத்த பின்னூட்டத்தை அதன் தகுதியின் அடிப்படையில் பயன்படுத்திக்கொண்டு, எதுவும் கூறாமல் இருந்துவிட வேண்டும் என்ற ஒரு உந்துதல் உள்ளது - அதை எழுதியவர் யார் என்பது எனக்குத் தெரிந்ததா இல்லையா என்பது, அது உண்மையா இல்லையா என்பதற்குத் தொடர்பில்லாதது.', 'D', '{"dimension": "stability_need vs approval_need"}'),
  (2, 'The social awkwardness of knowing something they do not know you know and having to interact with them normally while carrying that.', 'உங்களுக்குத் தெரியும் என்று அவர்களுக்குத் தெரியாத ஒரு விஷயம் உங்களுக்கும் தெரியும் என்பதாலும், அதைச் சுமந்துகொண்டே அவர்களுடன் இயல்பாகப் பழக வேண்டியதாலும் ஏற்படும் சமூக சங்கடம்.', 'I', '{"dimension": "stability_need vs approval_need"}'),
  (3, 'The relational question underneath the feedback - if this person felt this way, you want to know whether the relationship is in a different place than you thought.', 'பின்னூட்டத்தின் அடிப்படையிலான உறவுமுறை சார்ந்த கேள்வி இதுதான் - அந்த நபர் இப்படி உணர்ந்தால், நீங்கள் நினைத்ததை விட அந்த உறவு வேறு நிலையில் இருக்கிறதா என்பதை நீங்கள் தெரிந்துகொள்ள விரும்புகிறீர்கள்.', 'S', '{"dimension": "stability_need vs approval_need"}'),
  (4, 'The integrity question of whether to tell them you identified them - anonymous feedback is supposed to be anonymous and you are not sure what to do with the fact that it failed to be.', 'நீங்கள் அவர்களை அடையாளம் கண்டுகொண்டீர்கள் என்பதை அவர்களிடம் தெரிவிப்பதா வேண்டாமா என்பது ஒரு நேர்மை சார்ந்த கேள்வி - அநாமதேயப் பின்னூட்டம் என்பது அநாமதேயமாகத்தான் இருக்க வேண்டும், ஆனால் அது அவ்வாறு இல்லாத நிலையில் என்ன செய்வதென்று உங்களுக்குத் தெரியவில்லை.', 'C', '{"dimension": "stability_need vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q36
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you were told in a performance conversation that your communication style is perceived as exclusionary by some of your peers. Specific examples were given. You did not intend any of them the way they landed. The person giving the feedback was someone you respect and trust.', 'What is actually happening inside you three days later?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: உங்கள் சக ஊழியர்களில் சிலர், உங்களின் தகவல் தொடர்பு பாணியை மற்றவர்களை ஒதுக்குவதாகக் கருதுவதாக ஒரு செயல்திறன் கலந்துரையாடலில் உங்களிடம் கூறப்பட்டது. அதற்கான குறிப்பிட்ட உதாரணங்களும் கொடுக்கப்பட்டன. அவை வெளிப்பட்ட விதத்தில் எதையும் நீங்கள் எண்ணியிருக்கவில்லை. அந்தக் கருத்தைத் தெரிவித்தவர், நீங்கள் மதிக்கும் மற்றும் நம்பும் ஒருவராக இருந்தார்.', 'மூன்று நாட்கள் கழித்து உங்களுக்குள் உண்மையில் என்ன நடக்கிறது?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A residual frustration at the gap between your intent and the impact - you know what you meant and the distance between that and what was received still bothers you.', 'உங்கள் நோக்கத்திற்கும் அதன் விளைவிற்கும் இடையிலான இடைவெளியால் ஏற்படும் தீராத விரக்தி - நீங்கள் என்ன கூற விரும்பினீர்கள் என்பது உங்களுக்குத் தெரியும், ஆனால் அதற்கும் பெறப்பட்டதற்கும் இடையிலான அந்த இடைவெளி உங்களை இன்னமும் உறுத்துகிறது.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A self-consciousness that keeps surfacing in group settings - you are now monitoring yourself in conversations in a way that feels unfamiliar and slightly exhausting.', 'குழுச் சூழல்களில் மீண்டும் மீண்டும் வெளிப்படும் ஒருவித சுய விழிப்புணர்வு - உரையாடல்களில், உங்களுக்குப் பழக்கமில்லாததாகவும் சற்றே சோர்வூட்டுவதாகவும் தோன்றும் வகையில், இப்போது உங்களை நீங்களே கண்காணித்துக் கொள்கிறீர்கள்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A heaviness that is more relational than professional - it is not the label that stays with you but the specific people who felt excluded and what that means for those relationships.', 'தொழில்ரீதியானதை விட உறவுரீதியான ஒரு பாரம் - நம்முடன் தங்கிவிடுவது அந்தப் பதவிப்பெயர் அல்ல, மாறாக ஒதுக்கப்பட்டதாக உணர்ந்த குறிப்பிட்ட நபர்களும், அது அந்த உறவுகளுக்கு என்ன அர்த்தம் தருகிறது என்பதுமே ஆகும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'An unresolved analytical loop - you have been going back through the examples given and you are still not certain you fully understand the mechanism that produced the impact.', 'தீர்க்கப்படாத பகுப்பாய்வுச் சுழல் - கொடுக்கப்பட்ட எடுத்துக்காட்டுகளை நீங்கள் மீண்டும் மீண்டும் படித்துப் பார்த்தும், அந்தத் தாக்கத்தை ஏற்படுத்திய செயல்முறையை முழுமையாகப் புரிந்துகொண்டீர்களா என்பதில் உங்களுக்கு இன்னும் உறுதியாகத் தெரியவில்லை.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q37
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You slept through your alarm and missed a core class where cold-calling is a significant part of the participation grade. The professor has a strict attendance policy. It is the first time you have missed this class. You have been running on four to five hours of sleep for eleven consecutive days.', NULL, 'நீங்கள் அலாரத்தை கவனிக்காமல் தூங்கிவிட்டதால், பங்கேற்பு மதிப்பெண்ணில் முன்பின் தெரியாதவர்களைக் கேள்வி கேட்பது ஒரு முக்கியப் பங்கு வகிக்கும் ஒரு முக்கிய வகுப்பைத் தவறவிட்டுவிட்டீர்கள். பேராசிரியருக்குக் கண்டிப்பான வருகைக் கொள்கை உள்ளது. நீங்கள் இந்த வகுப்பைத் தவறவிடுவது இதுவே முதல் முறை. தொடர்ந்து பதினொரு நாட்களாக, நீங்கள் நான்கு முதல் ஐந்து மணி நேரத் தூக்கத்துடன்தான் இருந்து வருகிறீர்கள்.', NULL,
     '{"theme": "Self-Management & Burnout", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Email the professor immediately, own it directly, and ask if there is any way to make it up - I will not hide it or over-explain it.', 'பேராசிரியருக்கு உடனடியாக மின்னஞ்சல் அனுப்புங்கள், அதை நேரடியாக ஒப்புக்கொண்டு, அதைச் சரிசெய்ய ஏதேனும் வழி இருக்கிறதா என்று கேளுங்கள் - நான் அதை மறைக்கவோ அல்லது அளவுக்கு அதிகமாக விளக்கவோ மாட்டேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Reach out to two batchmates who were in the class to find out what happened and get notes before I decide how to handle the professor conversation.', 'பேராசிரியருடனான உரையாடலை எப்படிக் கையாள்வது என்று முடிவெடுப்பதற்கு முன், என்ன நடந்தது என்பதைத் தெரிந்துகொள்ளவும் குறிப்புகளைப் பெறவும் அந்த வகுப்பில் இருந்த இரண்டு வகுப்புத் தோழர்களைத் தொடர்புகொள்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Send the professor a brief, honest note today acknowledging the absence - not asking for anything specific, just making sure I am not invisible on this.', 'நான் வராததை ஒப்புக்கொண்டு, பேராசிரியருக்கு இன்று ஒரு சுருக்கமான, நேர்மையான குறிப்பை அனுப்புங்கள் - குறிப்பாக எதையும் கேட்கவில்லை, இந்த விஷயத்தில் நான் கவனிக்கப்படாமல் போய்விடக் கூடாது என்பதை உறுதிப்படுத்திக் கொள்கிறேன்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Review the syllabus policy on absences and understand the exact grade implications before I decide what to say and how to say it.', 'என்ன சொல்வது, எப்படிச் சொல்வது என்று தீர்மானிப்பதற்கு முன், வருகைப்பதிவின்மை தொடர்பான பாடத்திட்டக் கொள்கையை மதிப்பாய்வு செய்து, அதன் துல்லியமான மதிப்பெண் தாக்கங்களைப் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q38
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have committed to three clubs this term, each with real deliverables. You are now at the point where none of the three is getting your genuine best. One club''s event is in two weeks. One has a deliverable due this Friday. One has a leadership transition you promised to support. You cannot sustain all three.', NULL, 'இந்தப் பருவத்தில் நீங்கள் மூன்று மன்றங்களுக்கு உறுதியளித்துள்ளீர்கள், ஒவ்வொன்றிலும் நிறைவேற்றப்பட வேண்டிய இலக்குகள் உள்ளன. ஆனால் இப்போது, ​​அந்த மூன்றில் எதுவுமே உங்களின் உண்மையான முழு உழைப்பையும் தராத ஒரு நிலைக்கு வந்துள்ளீர்கள். ஒரு மன்றத்தின் நிகழ்ச்சி இன்னும் இரண்டு வாரங்களில் வரவிருக்கிறது. மற்றொன்றில், இந்த வெள்ளிக்கிழமை ஒரு இலக்கை அடைய வேண்டியுள்ளது. இன்னொன்றில், நீங்கள் ஆதரவளிப்பதாக உறுதியளித்த ஒரு தலைமைப் பரிமாற்ற நிகழ்வு நடைபெறுகிறது. இந்த மூன்றையும் உங்களால் தொடர்ந்து ஒரே நேரத்தில் சமாளிக்க முடியாது.', NULL,
     '{"theme": "Self-Management & Burnout", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Decide today which one gets my full commitment and have honest conversations with the other two - a clean withdrawal is better than a slow fade.', 'இன்று யாருக்கு எனது முழு அர்ப்பணிப்பு தேவை என்பதை முடிவு செய்யுங்கள், மற்ற இருவருடனும் நேர்மையான உரையாடல்களை நடத்துங்கள் - மெதுவாக விலகுவதை விட, முழுமையாக விலகிக்கொள்வதே சிறந்தது.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Have an informal conversation with the leads of all three clubs this week - I want to understand their actual needs before I decide what to step back from.', 'இந்த வாரம் மூன்று மன்றங்களின் தலைவர்களுடனும் ஒரு முறைசாரா உரையாடலை மேற்கொள்ளுங்கள் - எதிலிருந்து பின்வாங்க வேண்டும் என்று தீர்மானிப்பதற்கு முன், அவர்களின் உண்மையான தேவைகளை நான் புரிந்துகொள்ள விரும்புகிறேன்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Honour the most immediate commitment first and reassess after Friday - making a big structural decision in a high-pressure week is rarely the right call.', 'முதலில் மிக உடனடியான கடமையை நிறைவேற்றி, வெள்ளிக்கிழமைக்குப் பிறகு மறுமதிப்பீடு செய்யுங்கள் - அதிக அழுத்தம் நிறைந்த வாரத்தில் ஒரு பெரிய கட்டமைப்பு முடிவை எடுப்பது அரிதாகவே சரியான முடிவாக இருக்கும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Map out the actual time and energy requirements of each commitment for the next four weeks before making any changes - I need the full picture to make a decision I will not have to revisit.', 'எந்த மாற்றங்களையும் செய்வதற்கு முன், அடுத்த நான்கு வாரங்களுக்கு ஒவ்வொரு செயலுக்கும் தேவைப்படும் உண்மையான நேரம் மற்றும் ஆற்றல் தேவைகளைத் திட்டமிடுங்கள் - நான் மீண்டும் பரிசீலிக்கத் தேவையில்லாத ஒரு முடிவை எடுக்க, எனக்கு முழுமையான விவரம் தேவை.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q39
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have been the person your batch comes to when things get hard. Three people have leaned on you heavily in the last two weeks - one through a family crisis, one through placement anxiety, one through a relationship breakdown. You are genuinely glad they came to you. You are also quietly emptying out. You have placement interviews starting in five days.', 'What matters more to you in this moment?', 'உங்கள் குழுவினர் கடினமான சூழ்நிலைகளை எதிர்கொள்ளும்போது, ​​அவர்கள் நாடி வரும் நபராக நீங்கள் இருந்திருக்கிறீர்கள். கடந்த இரண்டு வாரங்களில் மூன்று பேர் உங்களை மிகவும் சார்ந்திருந்திருக்கிறார்கள் - ஒருவர் குடும்ப நெருக்கடியின்போதும், மற்றொருவர் வேலைவாய்ப்பு குறித்த பதற்றத்தின்போதும், இன்னொருவர் உறவு முறிவின்போதும். அவர்கள் உங்களிடம் வந்ததில் நீங்கள் உண்மையாகவே மகிழ்ச்சியடைகிறீர்கள். அதே சமயம், நீங்கள் மெல்ல மெல்ல உங்கள் மனச்சுமையைக் குறைத்து வருகிறீர்கள். இன்னும் ஐந்து நாட்களில் உங்களுக்கு வேலைவாய்ப்பு நேர்காணல்கள் தொடங்குகின்றன.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Self-Management & Burnout", "dimension": "decision_speed vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Being honest with yourself that you need to step back from being available right now, even though it means people who need you may feel the withdrawal.', 'உங்களைச் சார்ந்திருப்பவர்கள் அந்தப் பிரிவின் வலியை உணர்ந்தாலும், தற்போதைக்கு நீங்கள் கிடைப்பதிலிருந்து சற்று விலகிக்கொள்ள வேண்டும் என்பதை உங்களுக்கு நீங்களே நேர்மையாக ஏற்றுக்கொள்வது.', 'D', '{"dimension": "decision_speed vs accuracy_need"}'),
  (2, 'Managing this carefully so that the people who depend on you do not feel abandoned while you are also protecting yourself.', 'உங்களைச் சார்ந்திருப்பவர்கள் கைவிடப்பட்டதாக உணராதவாறும், அதே சமயம் நீங்கள் உங்களைப் பாதுகாத்துக் கொள்ளும் வகையிலும் இதை கவனமாக நிர்வகிக்க வேண்டும்.', 'I', '{"dimension": "decision_speed vs accuracy_need"}'),
  (3, 'Continuing to show up for the people who need you - stepping back feels like a betrayal of something you genuinely value about yourself.', 'உங்களுக்குத் தேவைப்படும் நபர்களுக்குத் தொடர்ந்து ஆதரவளிப்பதில் இருந்து பின்வாங்குவது, உங்களைப் பற்றி நீங்கள் உண்மையாகவே மதிக்கும் ஒரு விஷயத்திற்குச் செய்யும் துரோகம் போல் உணர்த்தும்.', 'S', '{"dimension": "decision_speed vs accuracy_need"}'),
  (4, 'Understanding what specifically is depleting you and whether there is a way to restructure the support you are giving so it costs you less - before making any decision about pulling back.', 'பின்வாங்குவது குறித்து எந்தவொரு முடிவையும் எடுப்பதற்கு முன், குறிப்பாக எது உங்களைச் சோர்வடையச் செய்கிறது என்பதையும், நீங்கள் வழங்கும் ஆதரவிற்கான செலவைக் குறைக்கும் வகையில் அதை மறுசீரமைக்க வழி உள்ளதா என்பதையும் புரிந்துகொள்ளுங்கள்.', 'C', '{"dimension": "decision_speed vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 2 Q40
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 2, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you have a health issue you have been managing quietly for six weeks. It is not critical but it is affecting your energy, your concentration, and your sleep. Your team does not know. Your placement contacts do not know. You have been performing adequately from the outside but you know the gap between what you are producing and what you are capable of.', 'What is actually happening inside you right now?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: கடந்த ஆறு வாரங்களாக நீங்கள் ஒரு உடல்நலப் பிரச்சினையை அமைதியாகச் சமாளித்து வருகிறீர்கள். அது உயிருக்கு ஆபத்தானதல்ல, ஆனால் அது உங்கள் ஆற்றல், கவனம் மற்றும் உறக்கத்தைப் பாதிக்கிறது. உங்கள் குழுவினருக்கு இது தெரியாது. உங்கள் பணி நியமனத் தொடர்பாளர்களுக்கும் இது தெரியாது. வெளிப்படையாகப் பார்க்கும்போது உங்கள் செயல்பாடு போதுமானதாகவே இருக்கிறது, ஆனால் நீங்கள் வெளிப்படுத்தும் திறனுக்கும் உங்கள் உண்மையான திறனுக்கும் இடையிலான இடைவெளியை நீங்கள் அறிவீர்கள்.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Self-Management & Burnout", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A functional determination to get through the next four weeks and deal with the health issue properly once placement is done - I know what I am doing and why.', 'அடுத்த நான்கு வாரங்களைக் கடந்து, பயிற்சி முடிந்தவுடன் உடல்நலப் பிரச்சினையை முறையாகச் சமாளிப்பதற்கான ஒரு செயல்மிகு உறுதிப்பாடு - நான் என்ன செய்கிறேன், ஏன் செய்கிறேன் என்பது எனக்குத் தெரியும்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A low-grade anxiety about whether anyone can tell - whether the gap between your output and your capability is visible to the people who are evaluating you.', 'உங்களை மதிப்பிடுபவர்களுக்கு உங்கள் செயல்திறனுக்கும் திறனுக்கும் இடையிலான இடைவெளி தெரிகிறதா என்பது போன்ற, யாராவது அதைக் கண்டுபிடித்துவிடுவார்களோ என்ற ஒருவித லேசான பதட்டம்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A private exhaustion that is less about the health issue itself and more about the weight of carrying something real completely alone for six weeks.', 'உடல்நலப் பிரச்சினையை விட, ஆறு வாரங்களாக ஒரு நிஜமான விஷயத்தை முற்றிலும் தனியாகச் சுமந்ததன் பாரத்தாலேயே ஏற்பட்ட ஒரு தனிப்பட்ட சோர்வு.', 'S', '{"dimension": "stability_need"}'),
  (4, 'A growing discomfort with the fact that you are making decisions about your performance and commitments on incomplete information - your own body is a variable you are not accounting for properly.', 'முழுமையற்ற தகவல்களின் அடிப்படையில் உங்கள் செயல்திறன் மற்றும் கடமைகள் குறித்த முடிவுகளை எடுக்கிறீர்கள் என்ற உண்மையால் ஏற்படும் ஒரு வளர்ந்து வரும் அசௌகரியம் - உங்கள் சொந்த உடலே நீங்கள் சரியாகக் கணக்கில் கொள்ளாத ஒரு காரணியாக உள்ளது.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- ---------- Set 3 (40 questions) ----------
-- Set 3 Q1
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are bidding for electives and the window closes in two hours. Your carefully planned combination requires you to win three specific courses. A batchmate has just told you that one of your target electives is massively oversubscribed and you will almost certainly lose it. Changing your bid now means rethinking your entire second year plan under pressure.', NULL, 'நீங்கள் விருப்பப் பாடங்களுக்கு விண்ணப்பித்துள்ளீர்கள், அதற்கான காலக்கெடு இன்னும் இரண்டு மணி நேரத்தில் முடிவடைகிறது. நீங்கள் கவனமாகத் திட்டமிட்ட பாடங்களின் தொகுப்பிற்கு, மூன்று குறிப்பிட்ட பாடங்களில் வெற்றி பெற வேண்டும். உங்கள் இலக்கு விருப்பப் பாடங்களில் ஒன்றிற்கு மிக அதிக விண்ணப்பங்கள் வந்துவிட்டதாகவும், நீங்கள் அதை கிட்டத்தட்ட நிச்சயமாக இழந்துவிடுவீர்கள் என்றும் உங்கள் வகுப்புத் தோழர் ஒருவர் சற்று முன்பு உங்களிடம் கூறியுள்ளார். இப்போது உங்கள் விண்ணப்பத்தை மாற்றுவது என்பது, அழுத்தத்தின் கீழ் உங்கள் இரண்டாம் ஆண்டுக்கான முழுத் திட்டத்தையும் மறுபரிசீலனை செய்வதாகும்.', NULL,
     '{"theme": "Academic Pressure & Performance", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Submit the original bid. I built this plan for a reason and I will not abandon it based on rumour.', 'அசல் ஏலத்தைச் சமர்ப்பிக்கவும். நான் இந்தத் திட்டத்தை ஒரு காரணத்திற்காகவே உருவாக்கினேன், வதந்திகளின் அடிப்படையில் இதை நான் கைவிட மாட்டேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Quickly message five people who have already submitted to get a sense of the real picture before I touch anything.', 'நான் எதையும் தொடுவதற்கு முன், உண்மையான நிலவரத்தை அறிந்துகொள்வதற்காக, ஏற்கனவே சமர்ப்பித்த ஐந்து பேருக்கு விரைவாகச் செய்தி அனுப்புகிறேன்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Talk to my academic advisor first - this decision affects too much to make alone in two hours.', 'முதலில் எனது கல்வி ஆலோசகரிடம் பேசுங்கள் - இந்த முடிவை இரண்டு மணி நேரத்தில் தனியாக எடுப்பதற்கு இது மிகவும் பாதிப்பை ஏற்படுத்தும்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Pull up the course capacity data and historical bid scores before making any change. I need facts not hearsay.', 'எந்த மாற்றமும் செய்வதற்கு முன், பாடநெறியின் கொள்ளளவு தரவுகளையும் முந்தைய ஏல மதிப்பெண்களையும் சரிபார்க்கவும். எனக்கு உண்மைகள் வேண்டும், வதந்திகள் அல்ல.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q2
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your capstone team has submitted the first draft to your real client, a mid-sized manufacturing firm. The client has come back saying one of your core recommendations is based on an industry benchmark that does not apply to their sector. Your team lead wants to defend it. You have a client call in forty minutes.', NULL, 'உங்கள் கேப்ஸ்டோன் குழு, அதன் முதல் வரைவை ஒரு நடுத்தர உற்பத்தி நிறுவனமான உங்கள் உண்மையான வாடிக்கையாளரிடம் சமர்ப்பித்துள்ளது. உங்கள் முக்கியப் பரிந்துரைகளில் ஒன்று, தங்களது துறைக்குப் பொருந்தாத ஒரு தொழில் துறை அளவுகோலை அடிப்படையாகக் கொண்டது என்று அந்த வாடிக்கையாளர் தெரிவித்துள்ளார். உங்கள் குழுத் தலைவர் அதை நியாயப்படுத்த விரும்புகிறார். இன்னும் நாற்பது நிமிடங்களில் உங்களுக்கு ஒரு வாடிக்கையாளர் அழைப்பு உள்ளது.', NULL,
     '{"theme": "Academic Pressure & Performance", "dimension": "accuracy_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Tell the team lead directly before the call that we cannot walk into that room defending something the client has already challenged. We either fix it or acknowledge it.', 'வாடிக்கையாளர் ஏற்கனவே ஆட்சேபித்த ஒரு விஷயத்தை நியாயப்படுத்திக்கொண்டு நம்மால் அந்த அறைக்குள் நுழைய முடியாது என்பதை, அழைப்புக்கு முன்பாகவே குழுத் தலைவரிடம் நேரடியாகக் கூறிவிடுங்கள். நாம் ஒன்று அதைச் சரிசெய்ய வேண்டும் அல்லது அதை ஒப்புக்கொள்ள வேண்டும்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'Suggest on the call that we treat this as new information the client has helpfully surfaced and offer to revise - frame it as collaboration not error.', 'வாடிக்கையாளர் உதவிகரமாக வெளிப்படுத்திய புதிய தகவலாக இதைக் கருதி, திருத்தம் செய்ய முன்வரலாம் என அழைப்பின்போதே பரிந்துரை செய்யுங்கள் - இதை ஒரு பிழையாகக் கருதாமல், ஒத்துழைப்பாக முன்வையுங்கள்.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'Let the team lead take the lead on the call but quietly prepare a revised version to share with the client afterwards.', 'குழுத் தலைவர் அழைப்பை முன்னின்று நடத்தட்டும், ஆனால் பின்னர் வாடிக்கையாளருடன் பகிர்வதற்காக திருத்தப்பட்ட பதிப்பை அமைதியாகத் தயார் செய்யுங்கள்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'Spend the next thirty minutes finding the correct benchmark so we walk in with the right answer, not a defence of the wrong one.', 'அடுத்த முப்பது நிமிடங்களைச் சரியான அளவுகோலைக் கண்டறியச் செலவிடுங்கள். அப்போதுதான் நாம் தவறான பதிலுக்கு ஆதரவாகப் பேசாமல், சரியான பதிலுடன் உள்ளே நுழைவோம்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q3
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are three months into the MBA. Your study group has built a strong rhythm - the work is solid, the trust is real, and everyone is performing. A faculty member has privately offered you a spot on a selective independent research project that would take you out of the group for eight weeks. It is a genuine opportunity. Your group does not know yet.', 'Two things are pulling at you. Which is stronger?', 'நீங்கள் MBA படித்து மூன்று மாதங்கள் ஆகிவிட்டன. உங்கள் படிப்புக் குழு ஒரு வலுவான தாளக்கட்டைக் கண்டறிந்துள்ளது - பணிகள் சிறப்பாக உள்ளன, நம்பிக்கை உண்மையானது, மேலும் அனைவரும் திறம்படச் செயல்படுகிறார்கள். ஒரு பேராசிரியர், உங்களை எட்டு வாரங்களுக்குக் குழுவிலிருந்து வெளியே அழைத்துச்செல்லும் ஒரு தேர்ந்தெடுக்கப்பட்ட சுயாதீன ஆராய்ச்சித் திட்டத்தில் உங்களுக்கு ஓர் இடத்தை தனிப்பட்ட முறையில் வழங்கியுள்ளார். இது ஒரு உண்மையான வாய்ப்பு. உங்கள் குழுவுக்கு இது இன்னும் தெரியாது.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Academic Pressure & Performance", "dimension": "control_need vs stability_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The pull to take the opportunity without overthinking the group - rare chances do not wait and relationships survive temporary absence.', 'குழுவைப் பற்றி அதிகமாகச் சிந்திக்காமல் வாய்ப்பைப் பயன்படுத்திக்கொள்ள வேண்டும் என்ற உந்துதல் - அரிய வாய்ப்புகள் காத்திருக்காது, தற்காலிகப் பிரிவையும் உறவுகள் கடந்து நிலைத்திருக்கும்.', 'D', '{"dimension": "control_need vs stability_need"}'),
  (2, 'The worry about how the group will react and whether stepping away will quietly change how they see you.', 'குழு எப்படி எதிர்வினையாற்றும் என்பதும், நாம் விலகிச் செல்வது அவர்கள் நம்மைப் பார்க்கும் விதத்தை மெதுவாக மாற்றிவிடுமா என்பதும் குறித்த கவலை.', 'I', '{"dimension": "control_need vs stability_need"}'),
  (3, 'The genuine discomfort of leaving a functioning team mid-stride - you feel responsible for the stability you helped build.', 'சிறப்பாகச் செயல்படும் ஒரு அணியை பாதியிலேயே விட்டுச் செல்வதில் உள்ள உண்மையான சங்கடம் - நீங்கள் உருவாக்க உதவிய அந்த நிலைத்தன்மைக்கு நீங்களே பொறுப்பு என உணர்கிறீர்கள்.', 'S', '{"dimension": "control_need vs stability_need"}'),
  (4, 'The need to properly evaluate what the research project actually offers before making any decision that disrupts multiple people.', 'பலரையும் பாதிக்கும் எந்தவொரு முடிவையும் எடுப்பதற்கு முன், அந்த ஆராய்ச்சித் திட்டம் உண்மையில் என்ன வழங்குகிறது என்பதை முறையாக மதிப்பீடு செய்ய வேண்டிய அவசியம் உள்ளது.', 'C', '{"dimension": "control_need vs stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q4
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: your peer evaluation scores have just come back. Three anonymous batchmates have rated your contribution to group work as below expectations. You have been one of the more present and vocal members of your group all term and genuinely believed you were carrying your share.', 'What is actually happening inside you before you say anything to anyone?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: உங்கள் சக மதிப்பீட்டு மதிப்பெண்கள் இப்போதுதான் வந்துள்ளன. பெயர் குறிப்பிட விரும்பாத மூன்று வகுப்புத் தோழர்கள், குழுப் பணிகளில் உங்கள் பங்களிப்பு எதிர்பார்ப்புகளுக்குக் குறைவாக இருப்பதாக மதிப்பிட்டுள்ளனர். பருவம் முழுவதும் உங்கள் குழுவில் மிகவும் சுறுசுறுப்பாகவும், தங்கள் கருத்துக்களை வெளிப்படையாகவும் தெரிவித்த உறுப்பினர்களில் ஒருவராக நீங்கள் இருந்தீர்கள்; மேலும், உங்கள் பங்கை நீங்கள் சரியாகச் செய்ததாக உண்மையாகவே நம்பினீர்கள்.', 'நீங்கள் யாரிடமும் எதையும் சொல்வதற்கு முன்பு, உங்களுக்குள் உண்மையில் என்ன நடந்துகொண்டிருக்கிறது?',
     '{"theme": "Academic Pressure & Performance", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A cold resolve. Whatever they saw I will correct through my next actions. Processing this feeling is not the priority right now.', 'ஒரு உறுதியான தீர்மானம். அவர்கள் என்ன கண்டாலும், எனது அடுத்தகட்டச் செயல்கள் மூலம் அதைச் சரிசெய்வேன். இந்த உணர்வை ஆராய்வது இப்போது முன்னுரிமை அல்ல.', 'D', '{"dimension": "approval_need"}'),
  (2, 'A scanning of faces - you are already trying to work out who wrote what and what this means for how you are actually perceived in the batch.', 'முகங்களை உற்று நோக்குதல் - யார் எதை எழுதினார் என்பதையும், அதன் விளைவாக அந்தக் குழுவில் நீங்கள் உண்மையில் எவ்வாறு பார்க்கப்படுகிறீர்கள் என்பதையும் நீங்கள் ஏற்கெனவே கண்டறிய முயற்சிக்கிறீர்கள்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A quiet deflating hurt. You thought you had built real relationships in this group and this result makes you question whether you read them correctly.', 'அமைதியான, மனமுறிவு தரும் ஒரு வலி. இந்தக் குழுவில் உண்மையான உறவுகளை நீங்கள் கட்டியெழுப்பியதாக நினைத்திருந்தீர்கள்; ஆனால் இந்த முடிவு, அவர்களை நீங்கள் சரியாகப் புரிந்துகொண்டீர்களா என்ற கேள்வியை எழுப்புகிறது.', 'S', '{"dimension": "approval_need"}'),
  (4, 'A need to understand the criteria before you accept or reject anything. You cannot respond to feedback you cannot yet evaluate.', 'எதையும் ஏற்றுக்கொள்வதற்கு அல்லது நிராகரிப்பதற்கு முன், அதற்கான அளவுகோல்களைப் புரிந்துகொள்ள வேண்டிய அவசியம் உள்ளது. உங்களால் இன்னும் மதிப்பீடு செய்ய முடியாத பின்னூட்டத்திற்கு உங்களால் பதிலளிக்க முடியாது.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q5
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your team is preparing a final presentation for a live client. One high-performing member has quietly rewritten sections that two other members drafted, without telling them. The rewritten versions are stronger, but the original authors do not know their work was replaced. You found out by accident. Submission is tomorrow.', NULL, 'உங்கள் குழு ஒரு நேரடி வாடிக்கையாளருக்காக இறுதி விளக்கக்காட்சியைத் தயாரித்துக் கொண்டிருக்கிறது. சிறப்பாகச் செயல்படும் ஒரு உறுப்பினர், மற்ற இரண்டு உறுப்பினர்கள் வரைந்திருந்த சில பகுதிகளை, அவர்களுக்குத் தெரிவிக்காமல் ரகசியமாகத் திருத்தி எழுதியுள்ளார். திருத்தி எழுதப்பட்ட பதிப்புகள் வலுவாக உள்ளன, ஆனால் தங்கள் படைப்பு மாற்றப்பட்டது அசல் ஆசிரியர்களுக்குத் தெரியாது. நீங்கள் தற்செயலாக இதைக் கண்டுபிடித்துவிட்டீர்கள். நாளை சமர்ப்பிக்க வேண்டும்.', NULL,
     '{"theme": "Team & Group Dynamics", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Go to the person who rewrote the sections and tell them directly - quality does not justify going around your teammates.', 'பகுதிகளைத் திருத்தி எழுதிய நபரிடம் நேரடியாகச் சென்று சொல்லுங்கள் - தரத்திற்காக உங்கள் சக ஊழியர்களைப் புறக்கணித்துச் செயல்பட முடியாது.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Bring it up lightly in tonight''s team check-in, framing it as a process question rather than a confrontation.', 'இன்றிரவு நடைபெறும் குழு சந்திப்பின்போது, ​​இதை ஒரு மோதலாகக் கருதாமல், ஒரு செயல்முறை சார்ந்த கேள்வியாக முன்வைத்து, இலகுவாகக் கேளுங்கள்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Say nothing until after submission, then raise it as a team norms conversation so it does not happen again.', 'சமர்ப்பிக்கும் வரை எதுவும் கூறாதீர்கள், பின்னர் இது மீண்டும் நிகழாமல் இருக்க, இதை ஒரு குழு நெறிமுறை உரையாடலாக எழுப்புங்கள்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Review both versions yourself first to assess whether the rewrite actually improved the work before deciding how seriously to treat this.', 'இதை எவ்வளவு தீவிரமாக எடுத்துக்கொள்வது என்று தீர்மானிப்பதற்கு முன், திருத்தம் உண்மையில் படைப்பை மேம்படுத்தியதா என்பதை மதிப்பிடுவதற்கு, முதலில் இரண்டு பதிப்புகளையும் நீங்களே மதிப்பாய்வு செய்யுங்கள்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q6
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your team has rotating leadership and this week it is your turn. Midway through a client-facing call, two of your teammates begin contradicting each other on a factual point in front of the client. The tension is visible. You are the one holding the meeting.', NULL, 'உங்கள் குழுவில் தலைமைப் பொறுப்பு சுழற்சி முறையில் வருகிறது, இந்த வாரம் அது உங்கள் முறை. வாடிக்கையாளருடனான ஒரு தொலைபேசி உரையாடலின் நடுவில், உங்கள் குழு உறுப்பினர்களில் இருவர் வாடிக்கையாளரின் முன்னிலையில் ஒரு உண்மை சார்ந்த விஷயத்தில் ஒருவருக்கொருவர் முரண்படத் தொடங்குகிறார்கள். அங்கு நிலவும் பதற்றம் தெளிவாகத் தெரிகிறது. அந்தக் கூட்டத்தை நடத்துபவர் நீங்கள்தான்.', NULL,
     '{"theme": "Team & Group Dynamics", "dimension": "relationship_dependency", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Step in immediately and redirect - I will acknowledge the point is being clarified and move the conversation forward without letting it sit.', 'உடனடியாகத் தலையிட்டு, விஷயத்தைத் திசைதிருப்புங்கள் - விஷயம் தெளிவுபடுத்தப்படுகிறது என்பதை நான் ஏற்றுக்கொண்டு, உரையாடலை அப்படியே விட்டுவிடாமல் முன்னோக்கி நகர்த்துவேன்.', 'D', '{"dimension": "relationship_dependency"}'),
  (2, 'Lighten the moment with a brief comment that acknowledges the complexity and signals to the client that the team is being thorough.', 'சிக்கலான தன்மையை ஒப்புக்கொண்டு, குழுவினர் முழுமையாக ஆராய்ந்து வருகிறார்கள் என்பதை வாடிக்கையாளருக்கு உணர்த்தும் ஒரு சுருக்கமான கருத்தைக் கூறி, அந்தத் தருணத்தை இலகுவாக்குங்கள்.', 'I', '{"dimension": "relationship_dependency"}'),
  (3, 'Let one of them finish their point, then gently bridge to the next agenda item - intervening too sharply could embarrass them further.', 'அவர்களில் ஒருவர் தனது கருத்தை முடித்துக் கொள்ளட்டும், பிறகு மென்மையாக அடுத்த நிகழ்ச்சி நிரல் விடயத்திற்கு மாறுங்கள் - மிகவும் கடுமையாகக் குறுக்கிடுவது அவர்களை மேலும் சங்கடப்படுத்தக்கூடும்.', 'S', '{"dimension": "relationship_dependency"}'),
  (4, 'Ask both teammates to hold the point, tell the client you will confirm and follow up in writing, then move on cleanly.', 'இரு அணி உறுப்பினர்களையும் அந்த விஷயத்தை அப்படியே வைத்திருக்கச் சொல்லுங்கள், எழுத்துப்பூர்வமாக உறுதிசெய்து பின்தொடர்வதாக வாடிக்கையாளரிடம் கூறுங்கள், பின்னர் நேர்த்தியாக அடுத்த கட்டத்திற்குச் செல்லுங்கள்.', 'C', '{"dimension": "relationship_dependency"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q7
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate on your team has been sharing your group''s internal strategy documents with members of a rival team in the same cohort. You found out through a third party. The inter-team competition ends in four days. The rest of your team does not know yet.', 'What matters more to you in this moment?', 'உங்கள் அணியில் உள்ள ஒருவர், உங்கள் குழுவின் உள் உத்திகள் குறித்த ஆவணங்களை, அதே குழுவில் உள்ள ஒரு போட்டி அணியின் உறுப்பினர்களுடன் பகிர்ந்து வருகிறார். இதை நீங்கள் ஒரு மூன்றாம் நபர் மூலம் அறிந்துகொண்டீர்கள். அணிகளுக்கு இடையேயான போட்டி இன்னும் நான்கு நாட்களில் முடிவடைகிறது. உங்கள் அணியின் மற்றவர்களுக்கு இது இன்னும் தெரியாது.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Team & Group Dynamics", "dimension": "stability_need vs conflict_response", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Confronting the person directly and immediately - this is a breach of trust and sitting on it is not something I can do regardless of the timing.', 'அந்த நபரை நேரடியாகவும் உடனடியாகவும் எதிர்கொள்வது நம்பிக்கைத் துரோகம். நேரம் எதுவாக இருந்தாலும், இதை அப்படியே கிடப்பில் போடுவதை என்னால் செய்ய முடியாது.', 'D', '{"dimension": "stability_need vs conflict_response"}'),
  (2, 'Managing how this information lands with the rest of the team - the way you tell them matters as much as the fact itself.', 'இந்தத் தகவல் குழுவின் மற்ற உறுப்பினர்களுக்கு எவ்வாறு சென்றடைகிறது என்பதை நிர்வகிப்பதில், அந்தத் தகவலைப் போலவே அதை நீங்கள் அவர்களிடம் தெரிவிக்கும் விதமும் முக்கியத்துவம் பெறுகிறது.', 'I', '{"dimension": "stability_need vs conflict_response"}'),
  (3, 'Protecting the team''s ability to finish strong - you want to handle this in a way that does not fracture the group four days before the finish line.', 'இறுதி இலக்கை அடைவதற்கு நான்கு நாட்களுக்கு முன்பு குழு பிளவுபடாத வகையில், அணி வலுவாகப் போட்டியை முடிக்கும் திறனைப் பாதுகாக்க வேண்டும்.', 'S', '{"dimension": "stability_need vs conflict_response"}'),
  (4, 'Establishing exactly what was shared and what the actual competitive damage is before deciding on any course of action.', 'எந்தவொரு நடவடிக்கை குறித்தும் முடிவெடுப்பதற்கு முன், என்ன பகிரப்பட்டது என்பதையும், உண்மையான போட்டி ரீதியான பாதிப்பு என்ன என்பதையும் துல்லியமாக உறுதிப்படுத்திக்கொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need vs conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q8
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Before you say anything - one of your closest friends in the batch has just been removed from your project team by the faculty coordinator for non-performance. You were aware they were struggling but said nothing to the faculty, the team, or to them directly. The rest of the team is relieved. Your friend is devastated.', 'What is actually happening inside you right now?', 'நீங்கள் எதையும் சொல்வதற்கு முன் - உங்கள் குழுவில் உள்ள உங்கள் நெருங்கிய நண்பர்களில் ஒருவரை, செயல்திறன் குறைபாடு காரணமாகத் துறை ஒருங்கிணைப்பாளர் உங்கள் திட்டக் குழுவிலிருந்து நீக்கிவிட்டார். அவர் சிரமப்பட்டுக் கொண்டிருந்தார் என்பது உங்களுக்குத் தெரிந்திருந்தும், துறையிடமோ, குழுவிடமோ, அல்லது அவரிடமோ நேரடியாக எதுவும் சொல்லவில்லை. குழுவில் உள்ள மற்றவர்கள் நிம்மதியடைந்துள்ளனர். உங்கள் நண்பர் மிகவும் மனமுடைந்து போயிருக்கிறார்.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Team & Group Dynamics", "dimension": "relationship_dependency", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A clear-eyed acceptance that this outcome was inevitable and probably correct, even if it is uncomfortable to watch.', 'இதைப் பார்ப்பது சங்கடமாக இருந்தாலும், இந்த விளைவு தவிர்க்க முடியாதது மற்றும் அநேகமாக சரியானது என்ற தெளிவான ஏற்றுக்கொள்ளல்.', 'D', '{"dimension": "relationship_dependency"}'),
  (2, 'An acute awareness of how your silence looks - to your friend, to the team, and to anyone who knows you knew.', 'உங்கள் மௌனம் உங்கள் நண்பருக்கு, அணிக்கு, மற்றும் நீங்கள் அறிந்திருந்தீர்கள் என்று தெரிந்த எவருக்கும் எப்படித் தோன்றும் என்பது குறித்த ஆழ்ந்த விழிப்புணர்வு.', 'I', '{"dimension": "relationship_dependency"}'),
  (3, 'A deep guilt that has nothing to do with the outcome and everything to do with the fact that you did not show up for your friend when it mattered.', 'விளைவுக்கும் இதற்கும் எந்த சம்பந்தமும் இல்லை; மாறாக, தேவைப்பட்ட நேரத்தில் உங்கள் நண்பருக்காக நீங்கள் துணை நிற்கவில்லை என்பதாலேயே இது ஏற்படுகிறது.', 'S', '{"dimension": "relationship_dependency"}'),
  (4, 'A need to understand whether your silence was the right call or a failure of judgment - and you cannot close that loop yet.', 'உங்கள் மௌனம் சரியான முடிவா அல்லது தவறான கணிப்பா என்பதைப் புரிந்துகொள்ள வேண்டிய தேவை உள்ளது - ஆனால், உங்களால் அந்தச் சுழற்சியை இப்போதைக்கு முடிக்க முடியாது.', 'C', '{"dimension": "relationship_dependency"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q9
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are leading a cross-batch initiative with no formal budget. You have been trying to get the student affairs office to allocate a small fund for three weeks. They keep redirecting you. The initiative launches in ten days and you need a decision now.', NULL, 'முறையான நிதி ஒதுக்கீடு இல்லாத, பல்வேறு குழுக்களை உள்ளடக்கிய ஒரு முன்னெடுப்பை நீங்கள் வழிநடத்துகிறீர்கள். கடந்த மூன்று வாரங்களாக, ஒரு சிறிய நிதியை ஒதுக்கீடு செய்யுமாறு மாணவர் நல அலுவலகத்திடம் நீங்கள் முயற்சி செய்து வருகிறீர்கள். ஆனால், அவர்கள் உங்களைத் தொடர்ந்து வேறு இடத்திற்கு அனுப்புகிறார்கள். இந்த முன்னெடுப்பு இன்னும் பத்து நாட்களில் தொடங்குகிறது, உங்களுக்கு இப்போதே ஒரு முடிவு தேவை.', NULL,
     '{"theme": "Leadership & Authority", "dimension": "control_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Escalate directly to the Dean''s office - three weeks of redirection is enough and I need someone with authority to make a call.', 'நேரடியாக டீன் அலுவலகத்திற்குப் புகாரைக் கொண்டு செல்லுங்கள் - மூன்று வார கால திசைமாற்றமே போதும், அதிகாரம் உள்ள ஒருவர் முடிவெடுக்க வேண்டும்.', 'D', '{"dimension": "control_need"}'),
  (2, 'Get three other batch representatives to co-sign the request with me - a coalition is harder to redirect than an individual.', 'மற்ற மூன்று தொகுதிப் பிரதிநிதிகளையும் என்னுடன் இந்தக் கோரிக்கையில் கையொப்பமிடச் செய்யுங்கள் - ஒரு தனிநபரை விட ஒரு கூட்டணியை வழிமாற்றுவது கடினம்.', 'I', '{"dimension": "control_need"}'),
  (3, 'Go back to the student affairs office one more time with a stripped-down version of the request that is easier for them to say yes to.', 'அவர்கள் எளிதில் ஏற்றுக்கொள்ளக்கூடிய வகையில், கோரிக்கையின் சுருக்கப்பட்ட வடிவத்துடன் மீண்டும் ஒருமுறை மாணவர் நல அலுவலகத்திற்குச் செல்லுங்கள்.', 'S', '{"dimension": "control_need"}'),
  (4, 'Document the full three-week paper trail and present it formally with a clear cost-benefit case - make it impossible to redirect without a written reason.', 'மூன்று வார கால முழுமையான ஆவணப் பதிவுகளையும் பதிவு செய்து, தெளிவான செலவு-பயன் விளக்கத்துடன் அதனை முறையாகச் சமர்ப்பிக்கவும் - எழுத்துப்பூர்வமான காரணம் இல்லாமல் அதனை வேறு பணிக்கு மாற்றுவதை சாத்தியமற்றதாக்கவும்.', 'C', '{"dimension": "control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q10
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are representing your batch in a faculty grievance about a course that has been consistently poorly managed. The faculty panel has asked for your response in writing by end of day. You have not yet consulted the full batch on the specific wording. You have two hours.', NULL, 'தொடர்ந்து மோசமாக நிர்வகிக்கப்பட்டு வரும் ஒரு பாடநெறி குறித்த பேராசிரியர்களின் குறைதீர்ப்பில், நீங்கள் உங்கள் மாணவர் குழுவின் சார்பாகப் பங்கேற்கிறீர்கள். பேராசிரியர்கள் குழு, அன்றைய தினத்தின் முடிவுக்குள் உங்கள் பதிலை எழுத்துப்பூர்வமாக வழங்குமாறு கேட்டுள்ளது. குறிப்பிட்ட வார்த்தைகள் குறித்து நீங்கள் இன்னும் முழு மாணவர் குழுவிடமும் கலந்தாலோசிக்கவில்லை. உங்களுக்கு இரண்டு மணி நேரம் உள்ளது.', NULL,
     '{"theme": "Leadership & Authority", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Submit the response today with what I know - I was elected to represent them and I understand the issue well enough to act.', 'எனக்குத் தெரிந்தவற்றைக் கொண்டு இன்றே பதிலைச் சமர்ப்பிக்கவும் - நான் அவர்களைப் பிரதிநிதித்துவப்படுத்தவே தேர்ந்தெடுக்கப்பட்டேன், மேலும் நடவடிக்கை எடுக்கும் அளவுக்கு இந்தப் பிரச்சினையை நான் நன்கு புரிந்துகொண்டுள்ளேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Send a quick message to the batch''s WhatsApp group summarising my draft and asking for a thumbs up before I send - five minutes of alignment is worth it.', 'அனுப்புவதற்கு முன், எனது வரைவைச் சுருக்கமாக விளக்கி, அதற்கு ஒப்புதல் கேட்டுப் பிரிவின் வாட்ஸ்அப் குழுவிற்கு ஒரு சிறு செய்தி அனுப்புவேன் - ஐந்து நிமிடச் சீரமைப்பு அதற்குத் தகுதியானதுதான்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Delay submission by one day and properly consult the batch first - I cannot put words in their mouths on something this important.', 'சமர்ப்பிப்பை ஒரு நாள் தாமதப்படுத்தி, முதலில் குழுவினருடன் முறையாகக் கலந்தாலோசிக்கவும் - இவ்வளவு முக்கியமான ஒரு விஷயத்தில் அவர்கள் சொல்லாததை நான் திணிக்க முடியாது.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Submit today but frame the response carefully as preliminary, noting that a fuller batch consultation is underway - buy time without missing the deadline.', 'இன்றே சமர்ப்பிக்கவும், ஆனால் ஒரு முழுமையான குழு கலந்தாய்வு நடைபெற்று வருகிறது என்பதைக் குறிப்பிட்டு, உங்கள் பதிலை ஒரு பூர்வாங்கப் பதில் என கவனமாக வடிவமைக்கவும் - இதன் மூலம் காலக்கெடுவைத் தவறவிடாமல் அவகாசம் பெறலாம்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q11
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You asked for a 360-feedback session as part of your leadership development. The results are in. The consistent theme across seven respondents is that your leadership style is directive to the point of being exclusionary - people feel they cannot push back on you. You did not see this coming.', 'Two things are pulling at you. Which is stronger?', 'உங்கள் தலைமைத்துவ மேம்பாட்டின் ஒரு பகுதியாக, நீங்கள் ஒரு 360-கருத்துப் பகிர்வு அமர்வைக் கோரியிருந்தீர்கள். அதன் முடிவுகள் வந்துவிட்டன. பதிலளித்த ஏழு பேரிடமும் பொதுவாகக் காணப்படும் கருத்து என்னவென்றால், உங்கள் தலைமைத்துவப் பாணி, மற்றவர்களை ஒதுக்கும் அளவிற்கு நேரடியாக வழிநடத்துவதாக உள்ளது - அதாவது, உங்களை எதிர்த்துப் பேச முடியாது என்று மக்கள் உணர்கிறார்கள். இது இப்படி நடக்கும் என்று நீங்கள் சற்றும் எதிர்பார்க்கவில்லை.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Leadership & Authority", "dimension": "approval_need vs control_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The instinct to interrogate the feedback - seven people agreeing does not make them right, and you want to understand the specific situations before you accept the framing.', 'பின்னூட்டத்தைக் கேள்விக்குட்படுத்தும் உள்ளுணர்வு - ஏழு பேர் ஒப்புக்கொள்வதால் அவர்கள் சொல்வது சரியாகிவிடாது, மேலும் முன்வைக்கப்படும் கருத்தை ஏற்றுக்கொள்வதற்கு முன், குறிப்பிட்ட சூழ்நிலைகளை நீங்கள் புரிந்துகொள்ள வேண்டும்.', 'D', '{"dimension": "approval_need vs control_need"}'),
  (2, 'The social discomfort of knowing that seven people in your network privately hold this view and have now put it on record.', 'உங்கள் வட்டாரத்தில் உள்ள ஏழு பேர் இந்தக் கருத்தைத் தனிப்பட்ட முறையில் கொண்டிருப்பதோடு, இப்போது அதைப் பதிவும் செய்திருக்கிறார்கள் என்பதை அறிவதால் ஏற்படும் சமூக சங்கடம்.', 'I', '{"dimension": "approval_need vs control_need"}'),
  (3, 'The genuine desire to understand the impact on the people who work with you - if they felt they could not push back, something real was lost in those conversations.', 'உங்களுடன் பணிபுரிபவர்கள் மீது ஏற்படும் தாக்கத்தைப் புரிந்துகொள்ள வேண்டும் என்ற உண்மையான ஆர்வம் - அவர்களால் எதிர்த்துப் பேச முடியாது என்று உணர்ந்தால், அந்த உரையாடல்களில் ஏதோவொரு உண்மையான விஷயம் விடுபட்டுப் போனது.', 'S', '{"dimension": "approval_need vs control_need"}'),
  (4, 'The analytical need to map the feedback against specific behavioural patterns before deciding what, if anything, to change.', 'எதையேனும் மாற்ற வேண்டுமா எனத் தீர்மானிப்பதற்கு முன், பின்னூட்டத்தை குறிப்பிட்ட நடத்தை முறைகளுடன் ஒப்பிட்டுப் பார்க்க வேண்டிய பகுப்பாய்வுத் தேவை உள்ளது.', 'C', '{"dimension": "approval_need vs control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q12
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: a junior batch member came to you last week asking you to publicly sponsor their initiative. You gave qualified support - enough to be helpful but not enough to put your name fully behind something you had reservations about. Their initiative has just failed publicly and they have told mutual friends that you let them down.', 'What is actually happening inside you right now?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: கடந்த வாரம், தங்களுக்குக் கீழ் படிக்கும் மாணவர் ஒருவர், தங்களது முயற்சிக்கு பகிரங்கமாக ஆதரவளிக்குமாறு உங்களிடம் வந்தார். நீங்கள் நிபந்தனைக்குட்பட்ட ஆதரவை வழங்கினீர்கள் - அது உதவியாக இருக்கப் போதுமானதாக இருந்தது, ஆனால் உங்களுக்குச் சில சந்தேகங்கள் இருந்த ஒரு விஷயத்திற்கு முழுமையாக உங்கள் பெயரைப் பரிந்துரைக்கும் அளவிற்குப் போதுமானதாக இல்லை. இப்போது அவர்களுடைய முயற்சி பகிரங்கமாகத் தோல்வியடைந்துள்ளது, மேலும் நீங்கள் அவர்களைக் கைவிட்டுவிட்டதாக அவர்கள் தங்களது பொதுவான நண்பர்களிடம் கூறியுள்ளனர்.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Leadership & Authority", "dimension": "control_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A sharp irritation - you were careful precisely to avoid this and the characterisation of what you did is not accurate.', 'கடுமையான எரிச்சல் - இதைத் தவிர்ப்பதில் நீங்கள் மிகத் துல்லியமாகக் கவனமாக இருந்தீர்கள், மேலும் நீங்கள் செய்ததை விவரித்த விதம் துல்லியமானதல்ல.', 'D', '{"dimension": "control_need"}'),
  (2, 'An uncomfortable awareness of how this story is now circulating and what it is quietly doing to your reputation among people who only heard one side.', 'ஒரு தரப்பு வாதத்தை மட்டுமே கேட்ட மக்களிடையே, இந்தக் கதை தற்போது எவ்வாறு பரவி வருகிறது என்பதும், அது உங்கள் நற்பெயருக்கு மறைமுகமாக என்ன செய்து கொண்டிருக்கிறது என்பதும் குறித்த ஒரு சங்கடமான உணர்வு.', 'I', '{"dimension": "control_need"}'),
  (3, 'A genuine ache - not because the criticism is fair but because you liked this person and you can feel the relationship has been damaged by something you tried to handle well.', 'ஒரு உண்மையான வலி - அந்த விமர்சனம் நியாயமானது என்பதற்காக அல்ல, மாறாக நீங்கள் அந்த நபரை விரும்பியதாலும், நீங்கள் சிறப்பாகக் கையாள முயன்ற ஒரு விஷயத்தால் அந்த உறவு சேதமடைந்துவிட்டது என்பதை உங்களால் உணர முடிவதாலும் தான்.', 'S', '{"dimension": "control_need"}'),
  (4, 'A methodical need to reconstruct exactly what you said and what you agreed to - because you will not accept a characterisation of your conduct that does not match the facts.', 'நீங்கள் என்ன சொன்னீர்கள், எதற்கு ஒப்புக்கொண்டீர்கள் என்பதைத் துல்லியமாக மீட்டுருவாக்கம் செய்ய வேண்டிய ஒரு முறையான தேவை உள்ளது - ஏனெனில், உண்மைகளுடன் பொருந்தாத உங்கள் நடத்தை குறித்த சித்தரிப்பை நீங்கள் ஏற்றுக்கொள்ள மாட்டீர்கள்.', 'C', '{"dimension": "control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q13
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are three months into your MBA. A headhunter has reached out with a full-time role at a firm you genuinely respect - senior to anything you could expect from campus placement and starting immediately after graduation. Taking it seriously means stepping back from the placement process your batch is fully engaged in. The offer has a two-week response window.', NULL, 'நீங்கள் உங்கள் MBA படிப்பைத் தொடங்கி மூன்று மாதங்கள் ஆகின்றன. நீங்கள் உண்மையாகவே மதிக்கும் ஒரு நிறுவனத்தில், ஒரு வேலைவாய்ப்பு முகவர் உங்களைத் தொடர்புகொண்டுள்ளார். வளாகத் தேர்வில் நீங்கள் எதிர்பார்க்கக்கூடியதை விட உயர்வான பதவியாகவும், பட்டப்படிப்பு முடிந்த உடனேயே தொடங்கும் வகையிலும் இந்தப் பணி அமைந்துள்ளது. இதைத் தீவிரமாக எடுத்துக்கொள்வதென்றால், உங்கள் குழுவினர் முழுமையாக ஈடுபட்டுள்ள வேலைவாய்ப்புச் செயல்முறையிலிருந்து நீங்கள் சற்று விலகி நிற்க வேண்டும். இந்த வாய்ப்பு குறித்துப் பதிலளிக்க இரண்டு வார கால அவகாசம் உள்ளது.', NULL,
     '{"theme": "Career Decisions & Internships", "dimension": "change_tolerance", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Engage with the headhunter seriously and in parallel - I did not come to this MBA to follow a default path if a better one presents itself.', 'வேலை தேடித் தரும் நிறுவனத்துடன் தீவிரமாகவும் அதே சமயம் கலந்துரையாடுங்கள் - ஒரு சிறந்த வழி கிடைக்கும்போது, ​​ஏற்கனவே உள்ள ஒரு வழியைப் பின்பற்றுவதற்காக நான் இந்த MBA-க்கு வரவில்லை.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'Talk to as many people as I can who know this firm before deciding how much energy to give this - I want a real picture, not a recruiter pitch.', 'இதற்கு எவ்வளவு முக்கியத்துவம் கொடுப்பது என்று தீர்மானிப்பதற்கு முன், இந்த நிறுவனத்தைப் பற்றித் தெரிந்த பலரிடம் என்னால் முடிந்தவரை பேச வேண்டும் - எனக்கு ஒரு உண்மையான சித்திரம் வேண்டும், ஆள்சேர்ப்பாளரின் பேச்சு அல்ல.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'Discuss it with two or three people whose judgment I trust before committing any time to it - I do not want to chase something that disrupts my focus without good reason.', 'இதற்கு நேரம் ஒதுக்குவதற்கு முன், நான் நம்பும் இரண்டு அல்லது மூன்று நபர்களுடன் கலந்துரையாடுங்கள் - முறையான காரணம் இல்லாமல் என் கவனத்தைச் சிதறடிக்கும் ஒன்றை நான் பின்தொடர விரும்பவில்லை.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'Map the role against a clear set of criteria - compensation, growth trajectory, risk - before deciding whether it deserves serious attention.', 'ஒரு பணிக்குத் தீவிர கவனம் தேவைதானா என்பதைத் தீர்மானிப்பதற்கு முன், ஊதியம், வளர்ச்சிப் பாதை, இடர் போன்ற தெளிவான அளவுகோல்களின் அடிப்படையில் அப்பணியை மதிப்பிடுங்கள்.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q14
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your internship manager has submitted the final performance review. You find out through a colleague that the review significantly understates your contributions on a project that you drove almost entirely. Your manager has taken prominent credit for the outcome in their own review. The internship ends in two weeks.', NULL, 'உங்கள் பயிற்சி மேலாளர் இறுதி செயல்திறன் மதிப்பீட்டைச் சமர்ப்பித்துள்ளார். நீங்கள் கிட்டத்தட்ட முழுமையாக முன்னின்று நடத்திய ஒரு திட்டத்தில், உங்கள் பங்களிப்புகளை அந்த மதிப்பீடு கணிசமாகக் குறைத்துக் காட்டுகிறது என்பதை ஒரு சக ஊழியர் மூலம் நீங்கள் அறிந்துகொள்கிறீர்கள். உங்கள் மேலாளர் தனது சொந்த மதிப்பீட்டில், அந்த முடிவிற்கான பெருமையை முக்கியமாக எடுத்துக்கொண்டுள்ளார். இன்னும் இரண்டு வாரங்களில் பயிற்சி முடிவடைகிறது.', NULL,
     '{"theme": "Career Decisions & Internships", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Request a meeting with my manager before the review is finalised and put my contributions on record directly - I will not let this stand without at least saying it clearly.', 'மதிப்பாய்வு இறுதி செய்யப்படுவதற்கு முன்பு என் மேலாளருடன் ஒரு சந்திப்பைக் கோரி, எனது பங்களிப்புகளை நேரடியாகப் பதிவு செய்யுங்கள் - குறைந்தபட்சம் அதைத் தெளிவாகச் சொல்லாமல் நான் இதை அனுமதிக்க மாட்டேன்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Speak to the colleague who told me and see if they would be willing to speak to their work on my behalf - having a corroborating voice changes this conversation.', 'எனக்குத் தெரிவித்த சக ஊழியரிடம் பேசி, என் சார்பாக அவர் தனது வேலையைப் பற்றிப் பேச முன்வருவாரா என்று கேளுங்கள் - ஒரு உறுதிப்படுத்தும் குரல் இந்த உரையாடலை மாற்றும்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Let the review stand for now and focus on making the final two weeks count - a confrontation this late could cost me more than the credit is worth.', 'தற்போதைக்கு இந்த மதிப்பாய்வை அப்படியே விட்டுவிட்டு, கடைசி இரண்டு வாரங்களைச் சிறப்பாகப் பயன்படுத்துவதில் கவனம் செலுத்துவோம் - இவ்வளவு தாமதமாக ஏற்படும் ஒரு மோதல், கிடைக்கும் நன்மையை விட எனக்கு அதிக இழப்பை ஏற்படுத்தக்கூடும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Document every deliverable I owned on that project before the review is finalised, so I have a complete record regardless of what the review says.', 'மதிப்பாய்வு இறுதி செய்யப்படுவதற்கு முன்பு, அந்தத் திட்டத்தில் நான் பொறுப்பேற்றிருந்த ஒவ்வொரு பணியையும் ஆவணப்படுத்த வேண்டும். அப்போதுதான், மதிப்பாய்வில் என்ன கூறப்பட்டாலும் என்னிடம் ஒரு முழுமையான பதிவு இருக்கும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q15
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You turned down a placement offer three weeks ago to hold out for your first-choice firm. The first-choice process has just concluded and you did not make the final round. The firm you turned down has already filled the role. You are now without an offer while most of your batch has one.', 'The conflict you feel most is between:', 'மூன்று வாரங்களுக்கு முன்பு, உங்களுக்கு மிகவும் விருப்பமான நிறுவனத்திற்காகக் காத்திருப்பதற்காக, ஒரு வேலைவாய்ப்பு வாய்ப்பை நீங்கள் நிராகரித்தீர்கள். அந்த முதல் விருப்பத் தேர்வு செயல்முறை இப்போதுதான் முடிவடைந்துள்ளது, ஆனால் நீங்கள் இறுதிச் சுற்றுக்குத் தேர்ந்தெடுக்கப்படவில்லை. நீங்கள் நிராகரித்த நிறுவனம் அந்தப் பணியிடத்தை ஏற்கெனவே நிரப்பிவிட்டது. உங்கள் குழுவில் உள்ள பெரும்பாலானோருக்கு வேலைவாய்ப்பு கிடைத்துள்ள நிலையில், உங்களுக்கு இப்போது எந்த வேலைவாய்ப்பும் இல்லை.', 'நீங்கள் மிகவும் உணரும் முரண்பாடு இவற்றுக்கு இடையே உள்ளது:',
     '{"theme": "Career Decisions & Internships", "dimension": "change_tolerance vs stability_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The urge to move fast and target every viable option immediately versus the risk of making a poor decision out of panic.', 'வேகமாகச் செயல்பட்டு, சாத்தியமான ஒவ்வொரு வழியையும் உடனடியாகக் குறிவைக்க வேண்டும் என்ற உந்துதலுக்கும், பதற்றத்தால் தவறான முடிவை எடுக்கும் அபாயத்திற்கும் இடையிலான ஒப்பீடு.', 'D', '{"dimension": "change_tolerance vs stability_need"}'),
  (2, 'Wanting to project confidence to the batch while privately feeling exposed in a way you did not expect to feel.', 'சக மாணவர்களிடம் தன்னம்பிக்கையை வெளிப்படுத்த விரும்பினாலும், உள்ளுக்குள் நீங்கள் சற்றும் எதிர்பாராத விதத்தில் பாதுகாப்பற்றதாக உணர்வது.', 'I', '{"dimension": "change_tolerance vs stability_need"}'),
  (3, 'The discomfort of having no safety net and the need to give yourself enough time to make a decision you will not regret.', 'பாதுகாப்பு வலை இல்லாததால் ஏற்படும் சங்கடமும், வருந்தாத ஒரு முடிவை எடுப்பதற்கு உங்களுக்குப் போதுமான அவகாசம் தேவைப்படுவதும்.', 'S', '{"dimension": "change_tolerance vs stability_need"}'),
  (4, 'The need to honestly diagnose why the first-choice process failed before applying anywhere new - repeating an unknown mistake is the real risk.', 'புதிதாக எங்கும் முயற்சி செய்வதற்கு முன், முதல் தேர்வு செயல்முறை ஏன் தோல்வியடைந்தது என்பதை நேர்மையாகக் கண்டறிய வேண்டிய அவசியம் உள்ளது - தெரியாத ஒரு தவறை மீண்டும் செய்வதே உண்மையான ஆபத்து.', 'C', '{"dimension": "change_tolerance vs stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q16
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: a firm you accepted an offer from has just been publicly named in a business press article as having a toxic culture and high attrition among MBA hires. Several batchmates have seen the article. Some have privately asked if you saw it. You start in four months.', 'What is actually happening inside you before you respond to anyone?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: நீங்கள் வேலைக்குச் சேர ஒப்புக்கொண்ட ஒரு நிறுவனம், நச்சுத்தன்மை வாய்ந்த பணிச்சூழலையும், MBA பட்டதாரிகள் மத்தியில் அதிகப்படியான பணி விலகல் விகிதத்தையும் கொண்டிருப்பதாக ஒரு வணிகப் பத்திரிகைக் கட்டுரையில் பகிரங்கமாகக் குறிப்பிடப்பட்டுள்ளது. உங்கள் சக வகுப்பு மாணவர்கள் பலர் அந்தக் கட்டுரையைப் பார்த்திருக்கிறார்கள். சிலர், நீங்கள் அதைப் பார்த்தீர்களா என்று தனிப்பட்ட முறையில் கேட்டிருக்கிறார்கள். இன்னும் நான்கு மாதங்களில் நீங்கள் பணியில் சேரப் போகிறீர்கள்.', 'நீங்கள் யாருக்காவது பதிலளிப்பதற்கு முன்பு, உங்களுக்குள் உண்மையில் என்ன நிகழ்ந்துகொண்டிருக்கிறது?',
     '{"theme": "Career Decisions & Internships", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A quick, practical calculation - one article does not define a firm and I am going in with my eyes open. What matters is what I do when I get there.', 'ஒரு விரைவான, நடைமுறை கணக்கீடு - ஒரே ஒரு கட்டுரை ஒரு நிறுவனத்தை வரையறுத்துவிடாது, மேலும் நான் முழு விழிப்புணர்வுடன் இதில் இறங்குகிறேன். நான் அங்கு சென்றதும் என்ன செய்கிறேன் என்பதுதான் முக்கியம்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'An acute awareness of how this looks to the batch and a discomfort with the idea that the offer you were proud of is now being quietly reassessed by people around you.', 'இது சக குழுவினருக்கு எப்படித் தோன்றும் என்பது குறித்த ஆழ்ந்த விழிப்புணர்வும், நீங்கள் பெருமைப்பட்ட ஒரு முன்மொழிவு இப்போது உங்களைச் சுற்றியுள்ளவர்களால் இரகசியமாக மறுமதிப்பீடு செய்யப்படுகிறது என்ற எண்ணத்தால் ஏற்படும் ஒருவித சங்கடமும்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A private anxiety that sits differently from the public question - not about reputation but about whether you made the right call for yourself.', 'பொதுக் கேள்வியிலிருந்து மாறுபட்ட ஒரு தனிப்பட்ட கவலை - அது நற்பெயரைப் பற்றியது அல்ல, மாறாக உங்களுக்காக நீங்கள் எடுத்த முடிவு சரியானதா என்பது பற்றியது.', 'S', '{"dimension": "approval_need"}'),
  (4, 'An immediate need to find more data - one article is one data point and you want a fuller picture before you decide how seriously to take this.', 'மேலும் தரவுகளைக் கண்டறிய வேண்டிய உடனடித் தேவை உள்ளது - ஒரு கட்டுரை என்பது ஒரு தரவுப் புள்ளி, மேலும் இதை எந்த அளவிற்குத் தீவிரமாக எடுத்துக்கொள்வது என்று தீர்மானிப்பதற்கு முன் உங்களுக்கு ஒரு முழுமையான சித்திரம் தேவை.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q17
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate has published a LinkedIn thought piece that is getting significant traction. You recognise two of the central ideas from a group discussion your study group had three weeks ago - ideas you contributed. The article does not reference the conversation or anyone in the group. Several batchmates have already shared it.', NULL, 'என் வகுப்புத் தோழர் ஒருவர் லிங்க்ட்இன் தளத்தில் வெளியிட்ட ஒரு சிந்தனைக் கட்டுரை குறிப்பிடத்தக்க வரவேற்பைப் பெற்று வருகிறது. மூன்று வாரங்களுக்கு முன்பு உங்கள் படிப்புக் குழு நடத்திய ஒரு கலந்துரையாடலில் இடம்பெற்ற, நீங்கள் பங்களித்த இரண்டு மையக் கருத்துக்களை நீங்கள் அடையாளம் காண்கிறீர்கள். அந்தக் கட்டுரை, அந்த உரையாடலையோ அல்லது குழுவில் இருந்த யாரையுமோ குறிப்பிடவில்லை. பல வகுப்புத் தோழர்கள் ஏற்கனவே அதைப் பகிர்ந்துள்ளனர்.', NULL,
     '{"theme": "Peer Comparison & Competition", "dimension": "approval_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Message the batchmate directly and privately - not aggressively, but I want them to know I noticed and I would like an acknowledgment.', 'சக வகுப்பு மாணவருக்கு நேரடியாகவும் தனிப்பட்ட முறையிலும் செய்தி அனுப்புங்கள் - ஆக்ரோஷமாக அல்ல, ஆனால் நான் கவனித்ததை அவர் தெரிந்துகொள்ள வேண்டும், மேலும் அவர் அதை ஏற்றுக்கொண்டதற்கான ஒப்புதலையும் நான் விரும்புகிறேன்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'Comment on the post in a way that surfaces your connection to the ideas - a public, warm comment that lets people draw their own conclusions.', 'அந்தப் பதிவில் உள்ள கருத்துக்களுடன் உங்கள் தொடர்பை வெளிப்படுத்தும் விதத்தில் கருத்துத் தெரிவிக்கவும் - அது மற்றவர்கள் தங்கள் சொந்த முடிவுகளுக்கு வர அனுமதிக்கும் ஒரு பொதுவான, அன்பான கருத்தாக இருக்க வேண்டும்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'Say nothing - ideas evolve and I cannot prove origination. Making this a thing will cost more than it gains.', 'ஒன்றும் சொல்ல வேண்டாம் - எண்ணங்கள் காலப்போக்கில் மாறும், அவற்றின் தோற்றத்தை என்னால் நிரூபிக்க முடியாது. இதைச் சாத்தியமாக்குவதால் கிடைக்கும் பலனை விட செலவு அதிகமாகும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'Document the original discussion in writing - dates, participants, content - before doing anything else. If I raise it, I want to be able to back it.', 'வேறு எதையும் செய்வதற்கு முன், அசல் கலந்துரையாடலை - தேதிகள், பங்கேற்பாளர்கள், உள்ளடக்கம் - எழுத்துப்பூர்வமாக ஆவணப்படுத்தவும். நான் ஒரு விஷயத்தை எழுப்பினால், அதை என்னால் ஆதரிக்க முடிய வேண்டும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q18
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A peer is spreading a version of something you said in a casual conversation that strips the context and makes you sound dismissive of a group of people you genuinely respect. It has reached four or five batchmates. Nobody has come to you directly but you can feel the temperature change in a few interactions this week.', NULL, 'நீங்கள் ஒரு சாதாரண உரையாடலில் சொன்ன ஒரு விஷயத்தை, அதன் சூழலைத் திரித்து, நீங்கள் உண்மையாகவே மதிக்கும் ஒரு குழுவினரை அலட்சியப்படுத்துவது போலக் காட்டும் ஒரு பதிப்பை உங்கள் சக மாணவர் ஒருவர் பரப்பி வருகிறார். இது நான்கு அல்லது ஐந்து வகுப்புத் தோழர்களைச் சென்றடைந்துள்ளது. யாரும் நேரடியாக உங்களிடம் வரவில்லை, ஆனால் இந்த வாரத்தில் நடந்த சில உரையாடல்களில் சூழ்நிலை மாறுவதை உங்களால் உணர முடிகிறது.', NULL,
     '{"theme": "Peer Comparison & Competition", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Find the peer and address it directly - I would rather have an uncomfortable conversation than let a false version of me circulate.', 'சக வயதினரைக் கண்டறிந்து நேரடியாகப் பேசுங்கள் - என்னைப் பற்றிய ஒரு பொய்யான பிம்பம் பரவுவதை அனுமதிப்பதை விட, ஒரு சங்கடமான உரையாடலை மேற்கொள்வதே மேல்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Reach out to the batchmates I feel the shift with and have a genuine conversation - I want to correct the record with the people it actually reached.', 'என்னுடன் இந்த மாற்றத்தை உணரும் சக வகுப்பு மாணவர்களைத் தொடர்புகொண்டு ஒரு உண்மையான உரையாடலை மேற்கொள்ள வேண்டும் - உண்மையில் இந்த விஷயம் அவர்களைச் சென்றடைந்தவர்களிடம் உண்மையை தெளிவுபடுத்த விரும்புகிறேன்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Give it a week and see if it settles on its own - responding now might amplify something that would otherwise fade.', 'ஒரு வாரம் பொறுத்திருந்து அது தானாகவே சரியாகிவிடுகிறதா என்று பாருங்கள் - இப்போது பதிலளிப்பது, இல்லையெனில் மங்கிவிடும் ஒரு விஷயத்தை மேலும் பெரிதுபடுத்திவிடக்கூடும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'First establish exactly what was said and to whom before deciding how to respond - I need to understand the actual spread before I react.', 'எப்படிப் பதிலளிப்பது என்று தீர்மானிக்கும் முன், என்ன சொல்லப்பட்டது, யாரிடம் சொல்லப்பட்டது என்பதை முதலில் துல்லியமாக உறுதிப்படுத்திக் கொள்ள வேண்டும் - நான் எதிர்வினையாற்றுவதற்கு முன், உண்மையான பரவலைப் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q19
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are in a seminar and you make a point that you believe is well-founded. A batchmate who is generally regarded as one of the sharper minds in the cohort disagrees with you publicly and confidently. The room shifts toward them. You have about four seconds.', 'What matters more to you in this moment?', 'நீங்கள் ஒரு கருத்தரங்கில் இருக்கிறீர்கள். அங்கே, வலுவான ஆதாரம் இருப்பதாக நீங்கள் நம்பும் ஒரு கருத்தை முன்வைக்கிறீர்கள். உங்கள் குழுவில் பொதுவாகக் கூர்மையான புத்தி கொண்டவர்களில் ஒருவராகக் கருதப்படும் உங்கள் சக மாணவர் ஒருவர், பகிரங்கமாகவும் நம்பிக்கையுடனும் உங்கள் கருத்தை மறுக்கிறார். அறையில் உள்ளவர்களின் கவனம் அவர் பக்கம் திரும்புகிறது. உங்களுக்குச் சுமார் நான்கு வினாடிகள் மட்டுமே உள்ளன.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Peer Comparison & Competition", "dimension": "approval_need vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Holding your position clearly - the room shifting does not make them right and I am not going to fold because of social pressure.', 'உங்கள் நிலைப்பாட்டில் தெளிவாக உறுதியாக இருக்கிறேன் - அறையில் ஏற்படும் மாற்றங்கள் அவர்களைச் சரியாக்கிவிடாது, மேலும் சமூக அழுத்தத்திற்காக நான் மண்டியிடப் போவதில்லை.', 'D', '{"dimension": "approval_need vs accuracy_need"}'),
  (2, 'Staying credible in the room - how I handle the next four seconds will shape how people see me more than who wins the argument.', 'அந்த அறையில் நம்பகத்தன்மையுடன் இருப்பது - விவாதத்தில் யார் வெற்றி பெறுகிறார்கள் என்பதை விட, அடுத்த நான்கு வினாடிகளை நான் எப்படிக் கையாள்கிறேன் என்பதே மக்கள் என்னைப் பற்றி என்ன நினைக்கிறார்கள் என்பதை அதிகம் தீர்மானிக்கும்.', 'I', '{"dimension": "approval_need vs accuracy_need"}'),
  (3, 'Finding a way to acknowledge their point without fully conceding - I want to reduce the tension without losing the substance of what I said.', 'முழுமையாக ஒப்புக்கொள்ளாமல், அவர்கள் சொல்ல வந்ததை ஏற்றுக்கொள்வதற்கான ஒரு வழியைக் கண்டறிவது - நான் சொன்னதன் சாராம்சத்தை இழக்காமல், பதற்றத்தைக் குறைக்க விரும்புகிறேன்.', 'S', '{"dimension": "approval_need vs accuracy_need"}'),
  (4, 'Actually asking myself in those four seconds whether they have a point I missed - because if they are right, the intellectually honest thing is to say so.', 'உண்மையில், அந்த நான்கு வினாடிகளில், அவர்கள் சொல்வதில் நான் கவனிக்கத் தவறிய ஏதேனும் ஒரு கருத்து இருக்கிறதா என்று என்னை நானே கேட்டுக்கொள்வேன் - ஏனென்றால், அவர்கள் சொல்வது சரியாக இருந்தால், அதை வெளிப்படையாகச் சொல்வதுதான் அறிவுப்பூர்வமான நேர்மை.', 'C', '{"dimension": "approval_need vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q20
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Before you say anything - you have just found out that a peer you have quietly measured yourself against all year has been nominated for the programme''s leadership award. You were not nominated. You thought you had a stronger case. Nobody knows you expected to be considered.', 'What is actually happening inside you right now?', 'நீங்கள் எதையும் சொல்வதற்கு முன் - இந்த ஆண்டு முழுவதும் நீங்கள் யாருக்கும் தெரியாமல் உங்களை ஒப்பிட்டுப் பார்த்த உங்கள் சக போட்டியாளர் ஒருவர், அந்தத் திட்டத்தின் தலைமைத்துவ விருதுக்குப் பரிந்துரைக்கப்பட்டிருக்கிறார் என்பதை இப்போதுதான் தெரிந்துகொண்டீர்கள். நீங்கள் பரிந்துரைக்கப்படவில்லை. உங்களுக்குத்தான் வலுவான வாய்ப்பு இருப்பதாக நீங்கள் நினைத்தீர்கள். நீங்கள் பரிசீலிக்கப்படுவீர்கள் என்று எதிர்பார்த்தது யாருக்கும் தெரியாது.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Peer Comparison & Competition", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A hard, immediate redirect - I am already thinking about what I will build in year two that makes this comparison irrelevant.', 'ஒரு உறுதியான, உடனடித் திசைதிருப்பல் - இரண்டாம் ஆண்டில் நான் என்ன உருவாக்கப் போகிறேன் என்பதைப் பற்றி இப்போதே சிந்திக்கத் தொடங்கிவிட்டேன், அது இந்த ஒப்பீட்டைப் பொருத்தமற்றதாக்குகிறது.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A social awareness of how this will read to the batch - who knows you wanted it, who is watching, and what story is now being written.', 'இந்தக் குழுவினருக்கு இது எப்படிப் புரியும் என்பது குறித்த ஒரு சமூக விழிப்புணர்வு – அதாவது, நீங்கள் இதை விரும்பினீர்கள் என்பது யாருக்குத் தெரியும், யார் இதைக் கவனிக்கிறார்கள், இப்போது என்ன கதை எழுதப்படுகிறது என்பனவற்றைப் பற்றிய புரிதல்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A genuine, private sadness that has nothing to do with the award and everything to do with the feeling of being passed over by someone who was running the same race.', 'விருதுடன் எந்த சம்பந்தமும் இல்லாத, ஆனால் அதே பந்தயத்தில் ஓடிய ஒருவரால் புறக்கணிக்கப்பட்ட உணர்வினால் ஏற்பட்ட ஒரு உண்மையான, தனிப்பட்ட சோகம்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'A detached need to understand the selection criteria - because if the process was sound and they were the stronger candidate, you need to know what that means about your own gaps.', 'தேர்வுக்கான அளவுகோல்களைப் பற்றற்ற முறையில் புரிந்துகொள்ள வேண்டிய தேவை உள்ளது - ஏனெனில், அந்த செயல்முறை சரியானதாக இருந்து, அவர்களே சிறந்த வேட்பாளராக இருந்தால், அது உங்கள் சொந்தக் குறைபாடுகளைப் பற்றி என்ன சொல்கிறது என்பதை நீங்கள் தெரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q21
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'During an open-book group exam, you notice that a team from another study group is sharing answers through a group chat in a way that clearly violates the exam rules. You are in the same room. The invigilator has not noticed. The exam ends in ninety minutes.', NULL, 'புத்தகத்தைப் பார்த்து எழுதும் குழுத் தேர்வின் போது, ​​மற்றொரு படிப்புக் குழுவைச் சேர்ந்த ஒரு குழுவினர், தேர்வு விதிகளைத் தெளிவாக மீறும் வகையில் குழு அரட்டை மூலம் விடைகளைப் பகிர்வதை நீங்கள் கவனிக்கிறீர்கள். நீங்கள் அதே அறையில்தான் இருக்கிறீர்கள். தேர்வுக் கண்காணிப்பாளர் அதைக் கவனிக்கவில்லை. இன்னும் தொண்ணூறு நிமிடங்களில் தேர்வு முடிவடைகிறது.', NULL,
     '{"theme": "Ethical Pressure", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Flag it to the invigilator immediately - I am not going to sit on an integrity violation because it is uncomfortable to report.', 'இதை உடனடியாகக் கண்காணிப்பாளரிடம் தெரிவிக்கவும் - புகாரளிப்பது சங்கடமாக இருக்கிறது என்பதற்காக, ஒரு நேர்மை மீறலை நான் கண்டுகொள்ளாமல் இருக்கப் போவதில்லை.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Send a quiet message to someone I trust in that group first - give them a chance to stop before it becomes a formal issue.', 'முதலில் அந்தக் குழுவில் நான் நம்பும் ஒருவருக்கு ஒரு அமைதியான செய்தியை அனுப்பு - அது ஒரு முறையான பிரச்சனையாக மாறுவதற்கு முன்பு, அவர்கள் நிறுத்துவதற்கு ஒரு வாய்ப்பு கொடு.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Say nothing during the exam but raise it with the programme office afterwards - I want to report it without disrupting the room or creating a scene.', 'தேர்வின் போது எதுவும் சொல்லாமல், தேர்வு முடிந்த பிறகு திட்ட அலுவலகத்தில் தெரிவிக்க வேண்டும் - அறையைக் குழப்பாமலோ அல்லது எந்தக் கூச்சலையும் உருவாக்காமலோ நான் இதைப் புகாரளிக்க விரும்புகிறேன்.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Note exactly what I observed, when, and who was involved before doing anything - if I am going to report this it needs to be factual and specific.', 'எதையும் செய்வதற்கு முன், நான் என்ன கவனித்தேன், எப்போது, ​​இதில் யார் ஈடுபட்டிருந்தனர் என்பதைத் துல்லியமாகக் குறித்துக்கொள்ள வேண்டும் - நான் இதைப் பதிவு செய்வதாக இருந்தால், அது உண்மைத் தகவல்களுடனும் குறிப்பாகவும் இருக்க வேண்டும்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q22
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your team is finalising a deliverable for a real client. Under deadline pressure, one team member has filled a data gap with a figure they have described as estimated but presented in the document as verified. The client will use this report to make a resourcing decision. Submission is in three hours.', NULL, 'உங்கள் குழு ஒரு உண்மையான வாடிக்கையாளருக்கான ஒப்படைப்பை இறுதி செய்து கொண்டிருக்கிறது. காலக்கெடுவின் நெருக்கடியில், ஒரு குழு உறுப்பினர், ஒரு தரவு இடைவெளியை நிரப்புவதற்காக, மதிப்பிடப்பட்டதாகக் குறிப்பிட்ட ஒரு எண்ணை ஆவணத்தில் சரிபார்த்ததாகக் காட்டியுள்ளார். வாடிக்கையாளர், பணியாளர் ஒதுக்கீடு குறித்த முடிவை எடுக்க இந்த அறிக்கையைப் பயன்படுத்துவார். சமர்ப்பிப்பதற்கான கடைசி நேரம் மூன்று மணி நேரம்.', NULL,
     '{"theme": "Ethical Pressure", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Tell the team member directly that the figure needs to be either verified or clearly labelled as an estimate before this goes to the client. Non-negotiable.', 'வாடிக்கையாளரிடம் அனுப்புவதற்கு முன், இந்தத் தொகை சரிபார்க்கப்பட வேண்டும் அல்லது இது ஒரு மதிப்பீடு என்று தெளிவாகக் குறிப்பிடப்பட வேண்டும் என்பதை குழு உறுப்பினரிடம் நேரடியாகக் கூறுங்கள். இதில் எந்த சமரசமும் இல்லை.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Suggest to the team that we add a methodology footnote that covers all data sources and their confidence levels - frame it as quality, not accusation.', 'அனைத்துத் தரவு மூலங்களையும் அவற்றின் நம்பகத்தன்மை அளவுகளையும் உள்ளடக்கிய ஒரு வழிமுறை அடிக்குறிப்பைச் சேர்க்குமாறு குழுவிற்குப் பரிந்துரைக்கவும் - அதை ஒரு குற்றச்சாட்டாக அல்லாமல், தரத்தின் மேம்பாடாக முன்வைக்கவும்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Raise it with the team lead and let them make the call - I do not want to go over the team member''s head but I also cannot stay silent.', 'இதை அணித் தலைவரிடம் தெரிவித்து, அவரை முடிவெடுக்க விடுங்கள் - நான் அணி உறுப்பினரை மீறிச் செயல்பட விரும்பவில்லை, ஆனால் என்னால் அமைதியாகவும் இருக்க முடியாது.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Spend the next hour trying to verify or replace the figure myself - the cleanest solution is fixing the problem rather than managing the politics of it.', 'அடுத்த ஒரு மணி நேரத்தை அந்த எண்ணிக்கையை நானே சரிபார்க்க அல்லது மாற்றுவதற்குச் செலவிடுங்கள் - அதன் அரசியல் சூழ்ச்சிகளைக் கையாள்வதை விட, பிரச்சனையைச் சரிசெய்வதே மிகத் தெளிவான தீர்வாகும்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q23
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A professor has privately offered you additional flexibility on a deadline in exchange for your help recruiting students to a paid workshop they run outside the programme. The offer is framed as informal and mutually beneficial. You need the deadline extension. The workshop is not inappropriate - but the exchange feels off.', 'Two things are pulling at you. Which is stronger?', 'பாடத்திட்டத்திற்கு வெளியே அவர்கள் நடத்தும் கட்டணப் பயிலரங்கிற்கு மாணவர்களைச் சேர்க்க நீங்கள் உதவுவதற்குப் பதிலாக, ஒரு பேராசிரியர் காலக்கெடுவில் கூடுதல் நெகிழ்வுத்தன்மையை உங்களுக்குத் தனிப்பட்ட முறையில் வழங்கியுள்ளார். இந்தச் சலுகை முறைசாராததாகவும், இருவருக்கும் பரஸ்பர நன்மை பயக்கும் வகையிலும் அமைந்துள்ளது. உங்களுக்குக் காலக்கெடு நீட்டிப்பு தேவைப்படுகிறது. அந்தப் பயிலரங்கம் பொருத்தமற்றதல்ல - ஆனால் இந்த பரிமாற்றம் சரியில்லாததாகத் தோன்றுகிறது.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Ethical Pressure", "dimension": "conflict_response vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The instinct that this is a line I should not cross regardless of how it is framed - and I need to decline clearly even if it costs me the extension.', 'அது எப்படிச் சொல்லப்பட்டாலும், இது நான் தாண்டக்கூடாத ஒரு எல்லை என்ற உள்ளுணர்வு; கால அவகாசம் பறிபோனாலும் சரி, நான் இதைத் தெளிவாக மறுக்க வேண்டும்.', 'D', '{"dimension": "conflict_response vs approval_need"}'),
  (2, 'The anxiety about how declining lands with the professor and whether it quietly affects how they see you for the rest of the term.', 'நமது மதிப்பெண் குறைவது பேராசிரியருக்கு எப்படிப் படும் என்பதும், அது இந்தப் பருவத்தின் மீதமுள்ள நாட்களில் அவர் உங்களைப் பார்க்கும் விதத்தை மறைமுகமாகப் பாதிக்குமா என்பது பற்றிய கவலையும்.', 'I', '{"dimension": "conflict_response vs approval_need"}'),
  (3, 'The discomfort of being put in this position at all - you do not want to damage the relationship but you also do not want to agree to something that does not feel right.', 'இந்த நிலைக்குத் தள்ளப்படுவதே ஒரு சங்கடமான விஷயம் - நீங்கள் உறவைச் சேதப்படுத்த விரும்பவில்லை, அதே சமயம் சரியெனத் தோன்றாத ஒரு விஷயத்திற்கு ஒப்புக்கொள்ளவும் விரும்பவில்லை.', 'S', '{"dimension": "conflict_response vs approval_need"}'),
  (4, 'The need to think through exactly what is being asked and whether it technically violates any programme policy before deciding how to respond.', 'எவ்வாறு பதிலளிப்பது எனத் தீர்மானிப்பதற்கு முன், என்ன கேட்கப்படுகிறது என்பதையும், அது தொழில்நுட்ப ரீதியாக ஏதேனும் திட்டக் கொள்கையை மீறுகிறதா என்பதையும் முழுமையாகச் சிந்தித்துப் பார்க்க வேண்டிய அவசியம் உள்ளது.', 'C', '{"dimension": "conflict_response vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q24
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you signed off on a team deliverable under time pressure without reading one section carefully. That section contained a significant factual error. The client has now flagged it. The team is being asked to explain how it happened. Nobody on the team knows you did not read it.', 'What is actually happening inside you before the team call?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: நேர நெருக்கடியில், ஒரு குழுவின் ஒப்படைப்புத் திட்டத்தில் உள்ள ஒரு பகுதியை நீங்கள் கவனமாகப் படிக்காமலேயே ஒப்புதல் அளித்துவிட்டீர்கள். அந்தப் பகுதியில் ஒரு முக்கியமான உண்மைப் பிழை இருந்தது. வாடிக்கையாளர் இப்போது அதைக் குறிப்பிட்டுள்ளார். அது எப்படி நடந்தது என்று விளக்குமாறு குழுவிடம் கேட்கப்படுகிறது. நீங்கள் அதைப் படிக்கவில்லை என்பது குழுவில் உள்ள யாருக்கும் தெரியாது.', 'அணி அழைப்பிற்கு முன்பு உங்களுக்குள் உண்மையில் என்ன நடக்கிறது?',
     '{"theme": "Ethical Pressure", "dimension": "accuracy_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A clean decision already forming - I am going to own my part in this on the call. Letting the team carry something that is partly my failure is not something I can do.', 'ஒரு தெளிவான முடிவு ஏற்கனவே உருவாகி வருகிறது - இந்த அழைப்பின்போது இதில் எனது பங்கை நான் ஏற்றுக்கொள்வேன். ஓரளவிற்கு எனது தோல்வியின் சுமையை அணியின் மீது சுமத்துவதை என்னால் செய்ய முடியாது.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'A heightened awareness of how the call is going to go and how each person in the room will be reading each other''s responses.', 'அழைப்பு எவ்வாறு செல்லப் போகிறது என்பதையும், அறையில் உள்ள ஒவ்வொருவரும் ஒருவருக்கொருவரின் பதில்களை எவ்வாறு புரிந்துகொள்வார்கள் என்பதையும் பற்றிய ஒரு மேம்பட்ட விழிப்புணர்வு.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'A heavy guilt that is less about the error and more about the fact that your teammates are going into this call not knowing the full picture.', 'அந்தத் தவறைப் பற்றியதை விட, முழுமையான நிலவரம் தெரியாமல் உங்கள் சக வீரர்கள் இந்த முடிவை எடுக்கிறார்கள் என்பதே அதிக குற்றவுணர்வைத் தருகிறது.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'A precise replay of the moment you chose not to read that section - you need to understand the decision you made before you can explain or account for it.', 'நீங்கள் அந்தப் பகுதியைப் படிக்க வேண்டாம் என்று முடிவு செய்த தருணத்தின் துல்லியமான மீள்பார்வை - நீங்கள் எடுத்த முடிவை விளக்கவோ அல்லது அதற்கான காரணத்தைக் கூறவோ செய்வதற்கு முன்பு, அந்த முடிவை நீங்கள் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q25
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are pitching a student initiative to a VC panel as part of a programme competition. One of the panellists - a well-known investor - is visibly unengaged from the first slide. They are checking their phone. The rest of the panel is attentive. You have eight minutes left.', NULL, 'ஒரு நிகழ்ச்சிப் போட்டியின் ஒரு பகுதியாக, நீங்கள் ஒரு மாணவர் முன்னெடுப்பு ஒன்றை துணிகர முதலீட்டாளர் குழுவிடம் முன்வைக்கிறீர்கள். குழு உறுப்பினர்களில் ஒருவரான, நன்கு அறியப்பட்ட முதலீட்டாளர், முதல் ஸ்லைடிலிருந்தே வெளிப்படையாக ஆர்வமின்றி இருக்கிறார். அவர் தனது கைப்பேசியைப் பார்த்துக் கொண்டிருக்கிறார். குழுவின் மற்ற உறுப்பினர்கள் கவனத்துடன் இருக்கிறார்கள். உங்களுக்கு இன்னும் எட்டு நிமிடங்கள் உள்ளன.', NULL,
     '{"theme": "Communication & Influence", "dimension": "approval_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Speak directly to the disengaged panellist - make a point specifically designed to pull them back in, even if it means departing from the script.', 'ஆர்வமில்லாத குழு உறுப்பினரிடம் நேரடியாகப் பேசுங்கள் - திட்டமிடப்பட்ட உரையிலிருந்து விலக நேர்ந்தாலும், அவர்களை மீண்டும் ஈர்ப்பதற்காகவே பிரத்யேகமாக ஒரு கருத்தை முன்வையுங்கள்.', 'D', '{"dimension": "approval_need"}'),
  (2, 'Increase the energy in the room - if I lift the pitch''s momentum the whole panel will shift, including them.', 'அறையின் ஆற்றலை அதிகரியுங்கள் - நான் சுருதியின் வேகத்தை உயர்த்தினால், அவர்கள் உட்பட முழு குழுவும் நிலை குலைந்துவிடும்.', 'I', '{"dimension": "approval_need"}'),
  (3, 'Stay the course and deliver to the engaged panellists - trying to win back someone who has checked out mid-pitch risks losing the ones you already have.', 'தொடர்ந்து முயற்சி செய்து, ஆர்வமுள்ள குழு உறுப்பினர்களுக்கு வழங்குங்கள் - விளக்கக்காட்சியின் பாதியிலேயே ஆர்வம் இழந்த ஒருவரை மீண்டும் ஈர்க்க முயற்சிப்பது, உங்களிடம் ஏற்கனவே உள்ளவர்களை இழக்கும் அபாயத்தை ஏற்படுத்தும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'Move quickly to the data slide - if anything will re-engage an investor it is numbers, and I know that section is strong.', 'விரைவாகத் தரவு ஸ்லைடுக்குச் செல்லுங்கள் - ஒரு முதலீட்டாளரை மீண்டும் ஈர்க்கக்கூடிய விஷயம் எதுவென்றால், அது எண்கள்தான், மேலும் அந்தப் பிரிவு வலுவானது என்று எனக்குத் தெரியும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q26
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are delivering a town hall update to your batch on a facilities issue that has been handled poorly by the administration. You have been asked by the administration to present their position. You personally believe the administration is wrong and the batch''s grievance is legitimate.', NULL, 'நிர்வாகத்தால் மோசமாகக் கையாளப்பட்ட ஒரு வசதிகள் பிரச்சினை குறித்து, உங்கள் குழுவினருக்கு நீங்கள் ஒரு பொதுக்கூட்டம் நடத்துகிறீர்கள். அவர்களின் நிலைப்பாட்டை முன்வைக்குமாறு நிர்வாகம் உங்களைக் கேட்டுக்கொண்டுள்ளது. நிர்வாகம் தவறு செய்கிறது என்றும், உங்கள் குழுவினரின் குறை நியாயமானது என்றும் நீங்கள் தனிப்பட்ட முறையில் நம்புகிறீர்கள்.', NULL,
     '{"theme": "Communication & Influence", "dimension": "conflict_response", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Present the facts honestly and let the batch draw their own conclusions - I will not be a mouthpiece for a position I do not believe in.', 'உண்மைகளை நேர்மையாக முன்வையுங்கள், குழுவினர் தங்கள் சொந்த முடிவுகளை எடுக்கட்டும் - நான் நம்பாத ஒரு நிலைப்பாட்டிற்கு நான் குரல் கொடுக்க மாட்டேன்.', 'D', '{"dimension": "conflict_response"}'),
  (2, 'Present the administration''s position but create space in the Q&A for the batch to voice their concerns - hold the room without shutting it down.', 'நிர்வாகத்தின் நிலைப்பாட்டை முன்வையுங்கள், ஆனால் கேள்வி-பதில் அமர்வில் புதிய குழுவினர் தங்கள் கவலைகளை வெளிப்படுத்த இடம் அளியுங்கள் - சூழலை முடக்கிவிடாமல், அதில் பங்கேற்பாளர்களின் கவனத்தை ஈர்க்கவும்.', 'I', '{"dimension": "conflict_response"}'),
  (3, 'Deliver what was asked of me today and raise my own reservations with the administration privately afterwards - this is not the moment to create a public split.', 'இன்று என்னிடம் கோரப்பட்டதை நிறைவேற்றிவிட்டு, அதன் பிறகு எனது ஆட்சேபணைகளை நிர்வாகத்திடம் தனிப்பட்ட முறையில் தெரிவிக்க வேண்டும் - இது பகிரங்கப் பிளவை உருவாக்குவதற்கான தருணம் அல்ல.', 'S', '{"dimension": "conflict_response"}'),
  (4, 'Present both the administration''s position and the counterarguments explicitly - the batch deserves the complete picture to form their own view.', 'நிர்வாகத்தின் நிலைப்பாட்டையும் எதிர்வாதங்களையும் தெளிவாக முன்வையுங்கள் - அந்தத் தொகுதி மக்கள் தங்கள் சொந்தக் கருத்தை உருவாக்கிக்கொள்ள முழுமையான விவரங்களைப் பெறத் தகுதியுடையவர்கள்.', 'C', '{"dimension": "conflict_response"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q27
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You are in a high-stakes negotiation with a faculty panel over a group grade appeal. You prepared a detailed case. Midway through, the panel asks a question that reveals they have misunderstood a key element of your argument. Correcting them directly will slow the session down and may feel confrontational. Letting it pass means your case will be evaluated on a false premise.', 'What matters more to you in this moment?', 'குழு மதிப்பெண் மேல்முறையீடு தொடர்பாக, பேராசிரியர்கள் குழுவுடன் நீங்கள் ஒரு முக்கியமான பேச்சுவார்த்தையில் ஈடுபட்டுள்ளீர்கள். நீங்கள் ஒரு விரிவான வாதத்தைத் தயாரித்துள்ளீர்கள். பேச்சுவார்த்தையின் நடுவில், உங்கள் வாதத்தின் ஒரு முக்கிய அம்சத்தை அவர்கள் தவறாகப் புரிந்துகொண்டதை வெளிப்படுத்தும் ஒரு கேள்வியை அந்தக் குழு கேட்கிறது. அவர்களை நேரடியாகத் திருத்துவது அமர்வின் வேகத்தைக் குறைப்பதோடு, ஒரு மோதல் போக்கையும் ஏற்படுத்தக்கூடும். அதை அப்படியே விட்டுவிட்டால், உங்கள் வாதம் ஒரு தவறான முன்முடிவின் அடிப்படையில் மதிப்பிடப்படும்.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Communication & Influence", "dimension": "approval_need vs control_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Correcting the misunderstanding clearly and immediately - I would rather slow this down than have the outcome hinge on something they got wrong.', 'தவறான புரிதலைத் தெளிவாகவும் உடனடியாகவும் சரிசெய்வது - அவர்கள் தவறாகப் புரிந்துகொண்ட ஒரு விஷயத்தைப் பொறுத்து முடிவு அமைவதை விட, இதை மெதுவாகக் கொண்டு செல்வதே மேல்.', 'D', '{"dimension": "approval_need vs control_need"}'),
  (2, 'Finding a way to reframe the point that makes the correction feel like a natural continuation rather than a challenge to what they said.', 'அவர்கள் சொன்னதற்கு ஒரு சவாலாகத் தோன்றுவதற்குப் பதிலாக, அந்தத் திருத்தத்தை ஒரு இயல்பான தொடர்ச்சியாக உணரவைக்கும் வகையில், அந்தக் கருத்தை வேறு கோணத்தில் முன்வைப்பதற்கான ஒரு வழியைக் கண்டறிதல்.', 'I', '{"dimension": "approval_need vs control_need"}'),
  (3, 'Letting it pass for now and addressing it in a follow-up submission - pushing back on a panel mid-session risks creating friction that hurts the outcome.', 'தற்போதைக்கு இதைக் கண்டுகொள்ளாமல் விட்டுவிட்டு, அடுத்தகட்ட சமர்ப்பிப்பில் இதைக் கையாள்வது - அமர்வின் நடுவில் ஒரு குழுவை எதிர்ப்பது, முடிவைப் பாதிக்கும் உராய்வை உருவாக்கும் அபாயத்தைக் கொண்டுள்ளது.', 'S', '{"dimension": "approval_need vs control_need"}'),
  (4, 'Pausing and asking a clarifying question that draws out the misunderstanding without directly saying they got it wrong - let them arrive at the correction themselves.', 'அவர்கள் தவறு செய்துவிட்டார்கள் என்று நேரடியாகக் கூறாமல், தவறான புரிதலை வெளிக்கொணரும் ஒரு தெளிவுபடுத்தும் கேள்வியைக் கேட்டு, சற்று நிறுத்தி, அவர்களாகவே திருத்திக்கொள்ளட்டும்.', 'C', '{"dimension": "approval_need vs control_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q28
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you gave a presentation last week that you felt good about. A media outlet covering student innovation at your school ran a short piece on it, but the quote they used from you was taken slightly out of context and made your argument sound simpler than it was. Several faculty members have seen it.', 'What is actually happening inside you?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: கடந்த வாரம் நீங்கள் வழங்கிய விளக்கக்காட்சி உங்களுக்கு திருப்தியளித்தது. உங்கள் பள்ளியில் மாணவர்களின் புத்தாக்கத்தைப் பற்றி செய்தி வெளியிடும் ஒரு ஊடகம், அதுகுறித்து ஒரு சிறு செய்தியை வெளியிட்டது. ஆனால், அதில் அவர்கள் பயன்படுத்திய உங்கள் மேற்கோள், சூழலிலிருந்து சற்றே விலகி எடுக்கப்பட்டு, உங்கள் வாதத்தை இருந்ததை விட எளிமையாகக் காட்டியது. பல பேராசிரியர்கள் அதைப் பார்த்திருக்கிறார்கள்.', 'உங்களுக்குள் உண்மையில் என்னதான் நடக்கிறது?',
     '{"theme": "Communication & Influence", "dimension": "approval_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A mild irritation that you move through quickly - media simplifies things, this is not a crisis, and I have better things to focus on.', 'விரைவாகக் கடந்துசெல்லக்கூடிய ஒரு லேசான எரிச்சல் - ஊடகங்கள் விஷயங்களை எளிமைப்படுத்துகின்றன, இது ஒரு நெருக்கடி அல்ல, மேலும் கவனம் செலுத்த எனக்கு இதைவிட முக்கியமான விஷயங்கள் உள்ளன.', 'D', '{"dimension": "approval_need"}'),
  (2, 'A heightened self-consciousness about which faculty members saw it and whether it has quietly shifted how they think about the depth of your thinking.', 'பேராசிரியர்கள் அதை எப்படிப் பார்த்தார்கள் என்பது பற்றியும், அது உங்கள் சிந்தனையின் ஆழத்தைப் பற்றி அவர்கள் சிந்திக்கும் விதத்தை அமைதியாக மாற்றிவிட்டதா என்பது குறித்தும் ஒரு அதிகரித்த சுய விழிப்புணர்வு.', 'I', '{"dimension": "approval_need"}'),
  (3, 'A specific discomfort about one faculty member whose opinion matters to you and whose impression of you this article may have slightly altered.', 'உங்கள் கருத்துக்கு மதிப்பளிக்கும் ஒரு பேராசிரியர் குறித்த ஒரு குறிப்பிட்ட சங்கடம்; மேலும், இந்தக் கட்டுரை உங்களைப் பற்றிய அவரது எண்ணத்தை சற்றே மாற்றியிருக்கக்கூடும்.', 'S', '{"dimension": "approval_need"}'),
  (4, 'An almost editorial frustration - you know exactly which sentence should have been used instead and the gap between what was printed and what you actually meant is specific and rankles.', 'இது கிட்டத்தட்ட ஒரு பதிப்பாசிரியரின் விரக்தி போன்றது - அதற்குப் பதிலாக எந்த வாக்கியத்தைப் பயன்படுத்தியிருக்க வேண்டும் என்பது உங்களுக்குத் துல்லியமாகத் தெரியும், ஆனால் அச்சிடப்பட்டதற்கும் நீங்கள் உண்மையில் கூற விரும்பியதற்கும் இடையிலான வேறுபாடு மிகத் தெளிவாகவும் உறுத்தலாகவும் இருக்கும்.', 'C', '{"dimension": "approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q29
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A batchmate you respect has approached you about co-founding a startup together. The idea is early but credible. They want a commitment in principle within the next two weeks - they are talking to one other potential co-founder and want to know if you are in before they decide. You came to this MBA with a clear corporate career plan. This is not part of it.', NULL, 'நீங்கள் மதிக்கும் உங்கள் சக வகுப்பு மாணவர் ஒருவர், உங்களுடன் இணைந்து ஒரு ஸ்டார்ட்அப் நிறுவனத்தைத் தொடங்குவது குறித்துப் பேசியுள்ளார். இந்த யோசனை ஆரம்ப நிலையில் இருந்தாலும், நம்பகமானது. அடுத்த இரண்டு வாரங்களுக்குள் கொள்கை ரீதியான ஒப்புதலை அவர்கள் எதிர்பார்க்கிறார்கள். மற்றொரு சாத்தியமான இணை நிறுவனருடனும் அவர்கள் பேசி வருகிறார்கள், முடிவெடுப்பதற்கு முன்பு நீங்கள் இதில் இணைகிறீர்களா என்பதைத் தெரிந்துகொள்ள விரும்புகிறார்கள். நீங்கள் ஒரு தெளிவான கார்ப்பரேட் தொழில் திட்டத்துடன்தான் இந்த MBA-விற்கு வந்தீர்கள். இது அதன் ஒரு பகுதியல்ல.', NULL,
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Give them a clear answer within the week - either I am in or I am not, and sitting on it helps neither of us.', 'ஒரு வாரத்திற்குள் அவர்களுக்கு ஒரு தெளிவான பதிலைக் கொடுங்கள் - ஒன்று நான் பங்கேற்கிறேன் அல்லது இல்லை, தாமதிப்பதால் நம் இருவருக்கும் எந்தப் பயனும் இல்லை.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'Have a longer conversation with them first - I want to understand the vision, the dynamic, and what this would actually mean for us before I say anything.', 'முதலில் அவர்களுடன் நீண்ட நேரம் உரையாடுங்கள் - நான் எதையும் சொல்வதற்கு முன், அவர்களின் தொலைநோக்குப் பார்வை, அதன் செயல்முறை மற்றும் இது உண்மையில் நமக்கு என்னவாக அமையும் என்பதைப் புரிந்துகொள்ள விரும்புகிறேன்.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'Tell them I am seriously interested but need a bit more time to think it through - I do not want to commit to something this significant without sitting with it properly.', 'எனக்கு இதில் மிகுந்த ஆர்வம் உள்ளது, ஆனால் இதைப்பற்றி முழுமையாக யோசிக்க இன்னும் சிறிது நேரம் தேவை என்று அவர்களிடம் சொல்லுங்கள். இவ்வளவு முக்கியமான ஒரு விஷயத்தைப் பற்றி முறையாக யோசிக்காமல் நான் ஒப்புக்கொள்ள விரும்பவில்லை.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'Ask for the full picture - business model, division of responsibilities, financial projections - before I can have any meaningful conversation about being in.', 'இதில் இணைவது குறித்து அர்த்தமுள்ள உரையாடலை மேற்கொள்வதற்கு முன், வணிக மாதிரி, பொறுப்புப் பங்கீடு, நிதி முன்னறிவிப்புகள் போன்ற முழுமையான விவரங்களைக் கேளுங்கள்.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q30
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'A scholarship has come up that would fund the rest of your MBA in full. The condition is a two-year commitment to work in a geography you are uncertain about after graduation. Applications close in four days. Taking it means locking in a post-graduation path you have not yet decided you want.', NULL, 'உங்கள் MBA படிப்பின் மீதமுள்ள முழுச் செலவிற்கும் நிதியளிக்கும் ஒரு கல்வி உதவித்தொகை அறிவிக்கப்பட்டுள்ளது. பட்டப்படிப்பு முடிந்த பிறகு, நீங்கள் உறுதியாகத் தேர்ந்தெடுக்காத ஒரு புவியியல் பகுதியில் இரண்டு ஆண்டுகள் பணிபுரிய வேண்டும் என்பதே இதற்கான நிபந்தனையாகும். விண்ணப்பங்கள் நான்கு நாட்களில் முடிவடைகின்றன. இந்த உதவித்தொகையை ஏற்றுக்கொள்வதன் மூலம், நீங்கள் இன்னும் தேர்ந்தெடுக்க விரும்பாத ஒரு பட்டப்படிப்புக்குப் பிந்தைய பாதையை உறுதி செய்துகொள்ளலாம்.', NULL,
     '{"theme": "Ambiguity & Risk", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Apply now and figure out the geography question later - funding is real and opportunities are not. I can always reassess the post-graduation decision closer to the time.', 'இப்போதே விண்ணப்பியுங்கள், புவியியல் சார்ந்த விஷயத்தை பிறகு பார்த்துக்கொள்ளலாம் - நிதி உதவி என்பது உண்மையானது, ஆனால் வாய்ப்புகள் அப்படியல்ல. பட்டப்படிப்புக்குப் பிந்தைய முடிவை, உரிய நேரத்தில் நான் எப்போது வேண்டுமானாலும் மறுபரிசீலனை செய்துகொள்ளலாம்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Reach out to alumni who took similar scholarships and talk to people who know the geography before I decide anything.', 'எதையும் முடிவு செய்வதற்கு முன், இதே போன்ற கல்வி உதவித்தொகைகளைப் பெற்ற முன்னாள் மாணவர்களைத் தொடர்புகொண்டு, அப்பகுதியின் புவியியல் பற்றி அறிந்தவர்களுடன் பேச வேண்டும்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Discuss it with my family and one or two people who know me well before applying - this affects more than just me.', 'விண்ணப்பிப்பதற்கு முன் என் குடும்பத்தினருடனும், என்னை நன்கு அறிந்த ஓரிருவருடனும் இது குறித்துக் கலந்துரையாடுங்கள் - இது என்னை மட்டுமல்ல, பலரையும் பாதிக்கும்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Map out the actual implications of the two-year commitment against my career goals before touching the application - I will not apply to something I have not properly evaluated.', 'விண்ணப்பத்தைத் தொடுவதற்கு முன், இந்த இரண்டு வருட கால அர்ப்பணிப்பின் உண்மையான தாக்கங்களை எனது தொழில் இலக்குகளுடன் ஒப்பிட்டுப் பாருங்கள் - நான் முறையாக மதிப்பீடு செய்யாத ஒன்றிற்கு விண்ணப்பிக்க மாட்டேன்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q31
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'An accelerator programme has accepted you for a cohort that runs directly through placement season. The programme is prestigious and the startup opportunity is real. But participating means missing most of the structured placement process your school runs, and the outcome on the other side of the accelerator is genuinely uncertain.', 'The conflict you feel most is between:', 'வேலைவாய்ப்புப் பருவம் முடியும் வரை நேரடியாகச் செயல்படும் ஒரு குழுவிற்காக, ஒரு முடுக்கித் திட்டம் உங்களை ஏற்றுக்கொண்டுள்ளது. இந்தத் திட்டம் மதிப்புமிக்கது, மேலும் புத்தொழில் தொடங்கும் வாய்ப்பும் உண்மையானது. ஆனால் இதில் பங்கேற்பதன் மூலம், உங்கள் கல்வி நிறுவனம் நடத்தும் கட்டமைக்கப்பட்ட வேலைவாய்ப்புச் செயல்முறையின் பெரும்பகுதியை நீங்கள் தவறவிட நேரிடும். மேலும், இந்த முடுக்கித் திட்டத்தின் மறுபக்கத்தில் கிடைக்கும் முடிவு உண்மையாகவே நிச்சயமற்றது.', 'நீங்கள் மிகவும் உணரும் முரண்பாடு இவற்றுக்கு இடையே உள்ளது:',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The pull of the certain placement path versus the pull of the uncertain but potentially more meaningful accelerator - and the frustration that you cannot have both.', 'ஒரு நிச்சயமான வேலைவாய்ப்புப் பாதையின் ஈர்ப்புக்கும், நிச்சயமற்ற ஆனால் சாத்தியமான வகையில் அதிக அர்த்தமுள்ளதாக இருக்கக்கூடிய ஒரு உந்துசக்தியின் ஈர்ப்புக்கும் இடையிலான போராட்டம் - மற்றும் இரண்டையும் ஒரே நேரத்தில் பெற முடியாது என்ற விரக்தி.', 'D', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (2, 'What excites you privately and what you can confidently explain to your family and batchmates without feeling like you are justifying a gamble.', 'தனிப்பட்ட முறையில் உங்களை உற்சாகப்படுத்துவது எது, மேலும் ஒரு சூதாட்டத்தை நியாயப்படுத்துவது போன்ற உணர்வின்றி உங்கள் குடும்பத்தினரிடமும் சக மாணவர்களிடமும் நம்பிக்கையுடன் விளக்கக்கூடியது எது.', 'I', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (3, 'The security of a structured outcome and the anxiety of not knowing whether stepping off that path will leave you exposed in ways you cannot yet see.', 'ஒரு கட்டமைக்கப்பட்ட விளைவின் பாதுகாப்பு மற்றும் அந்தப் பாதையிலிருந்து விலகினால், நம்மால் இன்னும் காண முடியாத வழிகளில் அது நம்மைப் பாதிப்புக்குள்ளாக்குமா என்ற கவலை.', 'S', '{"dimension": "change_tolerance vs accuracy_need"}'),
  (4, 'The fact that the accelerator outcome is too uncertain to model - and committing to something you cannot evaluate properly goes against how you make decisions.', 'முடுக்கித் திட்டத்தின் விளைவு மாதிரியாகக் காட்ட முடியாத அளவுக்கு நிச்சயமற்றது என்பதும், உங்களால் சரியாக மதிப்பிட முடியாத ஒரு விஷயத்திற்கு உறுதியளிப்பதும், நீங்கள் முடிவெடுக்கும் முறைக்கு முரணானது.', 'C', '{"dimension": "change_tolerance vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q32
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Before you say anything - a family health situation has escalated and you may need to take a leave of absence from the programme for six to eight weeks. You are midway through the year. You have not told your study group, your faculty advisor, or your placement contact. You do not yet know how serious this will be.', 'What is actually happening inside you right now?', 'நீங்கள் எதையும் சொல்வதற்கு முன் - உங்கள் குடும்பத்தில் உடல்நலப் பிரச்சினை தீவிரமடைந்துள்ளது, அதனால் நீங்கள் இந்தப் பாடத்திட்டத்திலிருந்து ஆறு முதல் எட்டு வாரங்களுக்கு விடுப்பு எடுக்க வேண்டியிருக்கலாம். நீங்கள் ஆண்டின் பாதியில் இருக்கிறீர்கள். உங்கள் படிப்புக் குழுவிடமோ, துறை ஆலோசகரிடமோ, அல்லது உங்கள் பணி நியமனத் தொடர்பாளரிடமோ நீங்கள் இன்னும் தெரிவிக்கவில்லை. இது எவ்வளவு தீவிரமானதாக இருக்கும் என்பது உங்களுக்கு இன்னும் தெரியாது.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Ambiguity & Risk", "dimension": "change_tolerance", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A practical sequencing already forming - who needs to know first, what needs to be put in place, and how do I protect as much of this year as possible.', 'யாருக்கு முதலில் தெரியப்படுத்த வேண்டும், என்னென்ன ஏற்பாடுகளைச் செய்ய வேண்டும், இந்த ஆண்டை என்னால் முடிந்தவரை எப்படிப் பாதுகாப்பது என்பது குறித்த ஒரு நடைமுறை வரிசைமுறை ஏற்கனவே உருவாகி வருகிறது.', 'D', '{"dimension": "change_tolerance"}'),
  (2, 'An awareness of how this will land with different people and whether the relationships you have built can hold through an extended absence.', 'இது வெவ்வேறு நபர்களிடம் எவ்வாறு தாக்கத்தை ஏற்படுத்தும் என்பதையும், நீண்டகாலப் பிரிவின்போது நீங்கள் உருவாக்கிய உறவுகள் நீடிக்குமா என்பதையும் பற்றிய ஒரு விழிப்புணர்வு.', 'I', '{"dimension": "change_tolerance"}'),
  (3, 'A grief that has nothing to do with the programme - the situation at home is what it is and everything else feels very small right now.', 'நிகழ்ச்சிக்கும் இதற்கும் எந்த சம்பந்தமும் இல்லை - வீட்டில் நிலைமை அப்படித்தான் இருக்கிறது, மற்ற எல்லாமே இப்போது மிகவும் அற்பமாகத் தெரிகிறது.', 'S', '{"dimension": "change_tolerance"}'),
  (4, 'An urgent need to understand the actual timeline and implications before you tell anyone anything - you will not raise this until you know what you are actually dealing with.', 'யாரிடமும் எதையும் சொல்வதற்கு முன், உண்மையான காலவரிசை மற்றும் அதன் விளைவுகளைப் புரிந்துகொள்ள வேண்டிய அவசரத் தேவை உள்ளது - நீங்கள் உண்மையில் எதைக் கையாளுகிறீர்கள் என்பதைத் தெரிந்துகொள்ளும் வரை இதை எழுப்பக் கூடாது.', 'C', '{"dimension": "change_tolerance"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q33
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'Your faculty advisor has given you written feedback on your thesis proposal saying your research question is interesting but your methodology is not yet defensible. The proposal is due for formal submission in three weeks. Two months of framing have gone into the current approach.', NULL, 'உங்கள் ஆய்வுக் கேள்வி சுவாரஸ்யமாக உள்ளது, ஆனால் உங்கள் ஆய்வு முறை இன்னும் ஏற்றுக்கொள்ளத்தக்கதாக இல்லை என்று உங்கள் துறை ஆலோசகர் உங்கள் ஆய்வறிக்கை முன்மொழிவு குறித்து எழுத்துப்பூர்வமான கருத்தை வழங்கியுள்ளார். இந்த முன்மொழிவை இன்னும் மூன்று வாரங்களில் முறைப்படி சமர்ப்பிக்க வேண்டும். தற்போதைய அணுகுமுறையை வடிவமைப்பதற்கு இரண்டு மாதங்கள் செலவிடப்பட்டுள்ளன.', NULL,
     '{"theme": "Feedback & Failure", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Set up a meeting with the advisor within 48 hours and get a clear steer on what defensible looks like - I need direction not just a diagnosis.', '48 மணி நேரத்திற்குள் ஆலோசகருடன் ஒரு சந்திப்பை ஏற்பாடு செய்து, தற்காப்புக்கு உகந்தது எது என்பது குறித்துத் தெளிவான வழிகாட்டுதலைப் பெறுங்கள் - எனக்கு வெறும் நோயறிதல் அல்ல, வழிகாட்டுதல் தேவை.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Talk to two or three PhD students who have been through the process and find out what advisors in this department typically want to see.', 'இந்தச் செயல்முறையை ஏற்கனவே கடந்து வந்த இரண்டு அல்லது மூன்று முனைவர் பட்ட மாணவர்களிடம் பேசி, இந்தத் துறையில் உள்ள ஆலோசகர்கள் பொதுவாக என்ன எதிர்பார்க்கிறார்கள் என்பதைத் தெரிந்துகொள்ளுங்கள்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Sit with the feedback for a day before responding - I want to understand it fully rather than react immediately and go in the wrong direction.', 'பதிலளிப்பதற்கு முன், அந்தக் கருத்தை ஒரு நாள் யோசித்துப் பாருங்கள் - உடனடியாக எதிர்வினையாற்றித் தவறான திசையில் செல்வதை விட, அதை நான் முழுமையாகப் புரிந்துகொள்ள விரும்புகிறேன்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Go back through the methodology section line by line and identify every point of vulnerability before I speak to anyone - I want to come to the next conversation having done my own audit first.', 'நான் யாரிடமும் பேசுவதற்கு முன்பு, வழிமுறைப் பகுதியை வரிக்கு வரி மீண்டும் படித்து, பாதிப்புக்குள்ளாகக்கூடிய ஒவ்வொரு இடத்தையும் கண்டறியுங்கள் - நான் முதலில் எனது சொந்த தணிக்கையைச் செய்த பின்னரே அடுத்த உரையாடலுக்கு வர விரும்புகிறேன்.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q34
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You delivered a negotiation role-play in class. Your faculty observer''s feedback was that you were analytically strong but that you conceded too early under pressure and signalled your floor before you needed to. You felt you were being strategic in the moment. You did not see it as early concession.', NULL, 'நீங்கள் வகுப்பில் ஒரு பேச்சுவார்த்தை தொடர்பான பாத்திரமேற்று நடித்துக் காட்டினீர்கள். உங்கள் துறைசார் கண்காணிப்பாளரின் பின்னூட்டத்தின்படி, நீங்கள் பகுப்பாய்வுத் திறனில் வலுவாக இருந்தீர்கள், ஆனால் அழுத்தத்தின் காரணமாக மிக விரைவாக விட்டுக்கொடுத்தீர்கள், மேலும் தேவைப்படுவதற்கு முன்பே உங்கள் நிலைப்பாட்டைத் தெளிவுபடுத்திவிட்டீர்கள். அந்தத் தருணத்தில் நீங்கள் வியூகத்துடன் செயல்படுவதாக உணர்ந்தீர்கள். அதை நீங்கள் முன்கூட்டிய விட்டுக்கொடுப்பாகக் கருதவில்லை.', NULL,
     '{"theme": "Feedback & Failure", "dimension": "accuracy_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Accept the feedback and move on - one exercise is one data point and extended reflection is just delayed practice.', 'பின்னூட்டத்தை ஏற்றுக்கொண்டு அடுத்த கட்டத்திற்குச் செல்லுங்கள் - ஒரு பயிற்சி என்பது ஒரு தரவுப் புள்ளி, மேலும் விரிவான சிந்தனை என்பது தாமதப்படுத்தப்பட்ட பயிற்சியே ஆகும்.', 'D', '{"dimension": "accuracy_need"}'),
  (2, 'Talk it through with a batchmate who was watching - I want a second perspective from someone who was in the room before I decide how much weight to give this.', 'இதைப் பார்த்துக் கொண்டிருந்த உங்கள் வகுப்புத் தோழருடன் கலந்துரையாடுங்கள் - இதற்கு எவ்வளவு முக்கியத்துவம் கொடுப்பது என்று தீர்மானிப்பதற்கு முன், அந்த அறையில் இருந்த ஒருவரிடமிருந்து இரண்டாவது கண்ணோட்டத்தை நான் விரும்புகிறேன்.', 'I', '{"dimension": "accuracy_need"}'),
  (3, 'Let it sit for a day before revisiting - feedback lands differently when you are not still in the room where it happened.', 'ஒரு நாள் அப்படியே விட்டுவிட்டு மீண்டும் பார்க்கவும் - சம்பவம் நடந்த அறையில் நீங்கள் இல்லாதபோது, ​​பின்னூட்டம் வேறுவிதமாகப் புரியும்.', 'S', '{"dimension": "accuracy_need"}'),
  (4, 'Write out the exact sequence of the negotiation as I remember it and map it against the feedback - I need to know whether they are right before I change anything.', 'எனக்கு நினைவில் உள்ளபடி பேச்சுவார்த்தையின் சரியான வரிசையை எழுதி, அதை பின்னூட்டத்துடன் ஒப்பிட்டுப் பார்க்க வேண்டும் - நான் எதையும் மாற்றுவதற்கு முன் அவர்கள் சொல்வது சரியா என்பதை நான் தெரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q35
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have received anonymous peer feedback that is almost certainly from a specific batchmate - the phrasing is recognisable and the observations are too precise to be coincidental. The feedback is critical but not unfair. The batchmate does not know that you have identified them.', 'Two things are pulling at you. Which is stronger?', 'நீங்கள் அநாமதேய சக மாணவர் கருத்தைப் பெற்றுள்ளீர்கள், இது கிட்டத்தட்ட நிச்சயமாக ஒரு குறிப்பிட்ட வகுப்புத் தோழரிடமிருந்து வந்ததாகும் - அதன் சொற்கள் அடையாளம் காணக்கூடியவையாக உள்ளன, மேலும் அதில் உள்ள கருத்துகள் தற்செயலாக நிகழ்ந்திருக்க முடியாத அளவுக்குத் துல்லியமாக இருக்கின்றன. அந்தக் கருத்து விமர்சன ரீதியானது, ஆனால் நியாயமற்றது அல்ல. நீங்கள் அவர்களை அடையாளம் கண்டுகொண்டது அந்த வகுப்புத் தோழருக்குத் தெரியாது.', 'இரண்டு விஷயங்கள் உங்களை ஈர்க்கின்றன. அவற்றில் எது வலிமையானது?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need vs approval_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'The pull to use the feedback on its merits and say nothing - whether I know who wrote it is irrelevant to whether it is true.', 'கிடைத்த பின்னூட்டத்தை அதன் தகுதியின் அடிப்படையில் பயன்படுத்திக்கொண்டு, எதுவும் கூறாமல் இருந்துவிட வேண்டும் என்ற ஒரு உந்துதல் உள்ளது - அதை எழுதியவர் யார் என்பது எனக்குத் தெரிந்ததா இல்லையா என்பது, அது உண்மையா இல்லையா என்பதற்குத் தொடர்பில்லாதது.', 'D', '{"dimension": "stability_need vs approval_need"}'),
  (2, 'The social awkwardness of knowing something they do not know you know and having to interact with them normally while carrying that.', 'உங்களுக்குத் தெரியும் என்று அவர்களுக்குத் தெரியாத ஒரு விஷயம் உங்களுக்கும் தெரியும் என்பதாலும், அதைச் சுமந்துகொண்டே அவர்களுடன் இயல்பாகப் பழக வேண்டியதாலும் ஏற்படும் சமூக சங்கடம்.', 'I', '{"dimension": "stability_need vs approval_need"}'),
  (3, 'The relational question underneath the feedback - if this person felt this way, you want to know whether the relationship is in a different place than you thought.', 'பின்னூட்டத்தின் அடிப்படையிலான உறவுமுறை சார்ந்த கேள்வி இதுதான் - அந்த நபர் இப்படி உணர்ந்தால், நீங்கள் நினைத்ததை விட அந்த உறவு வேறு நிலையில் இருக்கிறதா என்பதை நீங்கள் தெரிந்துகொள்ள விரும்புகிறீர்கள்.', 'S', '{"dimension": "stability_need vs approval_need"}'),
  (4, 'The integrity question of whether to tell them you identified them - anonymous feedback is supposed to be anonymous and you are not sure what to do with the fact that it failed to be.', 'நீங்கள் அவர்களை அடையாளம் கண்டுகொண்டீர்கள் என்பதை அவர்களிடம் தெரிவிப்பதா வேண்டாமா என்பது ஒரு நேர்மை சார்ந்த கேள்வி - அநாமதேயப் பின்னூட்டம் என்பது அநாமதேயமாகத்தான் இருக்க வேண்டும், ஆனால் அது அவ்வாறு இல்லாத நிலையில் என்ன செய்வதென்று உங்களுக்குத் தெரியவில்லை.', 'C', '{"dimension": "stability_need vs approval_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q36
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you were told in a performance conversation that your communication style is perceived as exclusionary by some of your peers. Specific examples were given. You did not intend any of them the way they landed. The person giving the feedback was someone you respect and trust.', 'What is actually happening inside you three days later?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: உங்கள் சக ஊழியர்களில் சிலர், உங்களின் தகவல் தொடர்பு பாணியை மற்றவர்களை ஒதுக்குவதாகக் கருதுவதாக ஒரு செயல்திறன் கலந்துரையாடலில் உங்களிடம் கூறப்பட்டது. அதற்கான குறிப்பிட்ட உதாரணங்களும் கொடுக்கப்பட்டன. அவை வெளிப்பட்ட விதத்தில் எதையும் நீங்கள் எண்ணியிருக்கவில்லை. அந்தக் கருத்தைத் தெரிவித்தவர், நீங்கள் மதிக்கும் மற்றும் நம்பும் ஒருவராக இருந்தார்.', 'மூன்று நாட்கள் கழித்து உங்களுக்குள் உண்மையில் என்ன நடக்கிறது?',
     '{"theme": "Feedback & Failure", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A residual frustration at the gap between your intent and the impact - you know what you meant and the distance between that and what was received still bothers you.', 'உங்கள் நோக்கத்திற்கும் அதன் விளைவிற்கும் இடையிலான இடைவெளியால் ஏற்படும் தீராத விரக்தி - நீங்கள் என்ன கூற விரும்பினீர்கள் என்பது உங்களுக்குத் தெரியும், ஆனால் அதற்கும் பெறப்பட்டதற்கும் இடையிலான அந்த இடைவெளி உங்களை இன்னமும் உறுத்துகிறது.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A self-consciousness that keeps surfacing in group settings - you are now monitoring yourself in conversations in a way that feels unfamiliar and slightly exhausting.', 'குழுச் சூழல்களில் மீண்டும் மீண்டும் வெளிப்படும் ஒருவித சுய விழிப்புணர்வு - உரையாடல்களில், உங்களுக்குப் பழக்கமில்லாததாகவும் சற்றே சோர்வூட்டுவதாகவும் தோன்றும் வகையில், இப்போது உங்களை நீங்களே கண்காணித்துக் கொள்கிறீர்கள்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A heaviness that is more relational than professional - it is not the label that stays with you but the specific people who felt excluded and what that means for those relationships.', 'தொழில்ரீதியானதை விட உறவுரீதியான ஒரு பாரம் - நம்முடன் தங்கிவிடுவது அந்தப் பதவிப்பெயர் அல்ல, மாறாக ஒதுக்கப்பட்டதாக உணர்ந்த குறிப்பிட்ட நபர்களும், அது அந்த உறவுகளுக்கு என்ன அர்த்தம் தருகிறது என்பதுமே ஆகும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'An unresolved analytical loop - you have been going back through the examples given and you are still not certain you fully understand the mechanism that produced the impact.', 'தீர்க்கப்படாத பகுப்பாய்வுச் சுழல் - கொடுக்கப்பட்ட எடுத்துக்காட்டுகளை நீங்கள் மீண்டும் மீண்டும் படித்துப் பார்த்தும், அந்தத் தாக்கத்தை ஏற்படுத்திய செயல்முறையை முழுமையாகப் புரிந்துகொண்டீர்களா என்பதில் உங்களுக்கு இன்னும் உறுதியாகத் தெரியவில்லை.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q37
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You slept through your alarm and missed a core class where cold-calling is a significant part of the participation grade. The professor has a strict attendance policy. It is the first time you have missed this class. You have been running on four to five hours of sleep for eleven consecutive days.', NULL, 'நீங்கள் அலாரத்தை கவனிக்காமல் தூங்கிவிட்டதால், பங்கேற்பு மதிப்பெண்ணில் முன்பின் தெரியாதவர்களைக் கேள்வி கேட்பது ஒரு முக்கியப் பங்கு வகிக்கும் ஒரு முக்கிய வகுப்பைத் தவறவிட்டுவிட்டீர்கள். பேராசிரியருக்குக் கண்டிப்பான வருகைக் கொள்கை உள்ளது. நீங்கள் இந்த வகுப்பைத் தவறவிடுவது இதுவே முதல் முறை. தொடர்ந்து பதினொரு நாட்களாக, நீங்கள் நான்கு முதல் ஐந்து மணி நேரத் தூக்கத்துடன்தான் இருந்து வருகிறீர்கள்.', NULL,
     '{"theme": "Self-Management & Burnout", "dimension": "decision_speed", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Email the professor immediately, own it directly, and ask if there is any way to make it up - I will not hide it or over-explain it.', 'பேராசிரியருக்கு உடனடியாக மின்னஞ்சல் அனுப்புங்கள், அதை நேரடியாக ஒப்புக்கொண்டு, அதைச் சரிசெய்ய ஏதேனும் வழி இருக்கிறதா என்று கேளுங்கள் - நான் அதை மறைக்கவோ அல்லது அளவுக்கு அதிகமாக விளக்கவோ மாட்டேன்.', 'D', '{"dimension": "decision_speed"}'),
  (2, 'Reach out to two batchmates who were in the class to find out what happened and get notes before I decide how to handle the professor conversation.', 'பேராசிரியருடனான உரையாடலை எப்படிக் கையாள்வது என்று முடிவெடுப்பதற்கு முன், என்ன நடந்தது என்பதைத் தெரிந்துகொள்ளவும் குறிப்புகளைப் பெறவும் அந்த வகுப்பில் இருந்த இரண்டு வகுப்புத் தோழர்களைத் தொடர்புகொள்.', 'I', '{"dimension": "decision_speed"}'),
  (3, 'Send the professor a brief, honest note today acknowledging the absence - not asking for anything specific, just making sure I am not invisible on this.', 'நான் வராததை ஒப்புக்கொண்டு, பேராசிரியருக்கு இன்று ஒரு சுருக்கமான, நேர்மையான குறிப்பை அனுப்புங்கள் - குறிப்பாக எதையும் கேட்கவில்லை, இந்த விஷயத்தில் நான் கவனிக்கப்படாமல் போய்விடக் கூடாது என்பதை உறுதிப்படுத்திக் கொள்கிறேன்.', 'S', '{"dimension": "decision_speed"}'),
  (4, 'Review the syllabus policy on absences and understand the exact grade implications before I decide what to say and how to say it.', 'என்ன சொல்வது, எப்படிச் சொல்வது என்று தீர்மானிப்பதற்கு முன், வருகைப்பதிவின்மை தொடர்பான பாடத்திட்டக் கொள்கையை மதிப்பாய்வு செய்து, அதன் துல்லியமான மதிப்பெண் தாக்கங்களைப் புரிந்துகொள்ள வேண்டும்.', 'C', '{"dimension": "decision_speed"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q38
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have committed to three clubs this term, each with real deliverables. You are now at the point where none of the three is getting your genuine best. One club''s event is in two weeks. One has a deliverable due this Friday. One has a leadership transition you promised to support. You cannot sustain all three.', NULL, 'இந்தப் பருவத்தில் நீங்கள் மூன்று மன்றங்களுக்கு உறுதியளித்துள்ளீர்கள், ஒவ்வொன்றிலும் நிறைவேற்றப்பட வேண்டிய இலக்குகள் உள்ளன. ஆனால் இப்போது, ​​அந்த மூன்றில் எதுவுமே உங்களின் உண்மையான முழு உழைப்பையும் தராத ஒரு நிலைக்கு வந்துள்ளீர்கள். ஒரு மன்றத்தின் நிகழ்ச்சி இன்னும் இரண்டு வாரங்களில் வரவிருக்கிறது. மற்றொன்றில், இந்த வெள்ளிக்கிழமை ஒரு இலக்கை அடைய வேண்டியுள்ளது. இன்னொன்றில், நீங்கள் ஆதரவளிப்பதாக உறுதியளித்த ஒரு தலைமைப் பரிமாற்ற நிகழ்வு நடைபெறுகிறது. இந்த மூன்றையும் உங்களால் தொடர்ந்து ஒரே நேரத்தில் சமாளிக்க முடியாது.', NULL,
     '{"theme": "Self-Management & Burnout", "dimension": "stability_need", "layer": "1", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Decide today which one gets my full commitment and have honest conversations with the other two - a clean withdrawal is better than a slow fade.', 'இன்று யாருக்கு எனது முழு அர்ப்பணிப்பு தேவை என்பதை முடிவு செய்யுங்கள், மற்ற இருவருடனும் நேர்மையான உரையாடல்களை நடத்துங்கள் - மெதுவாக விலகுவதை விட, முழுமையாக விலகிக்கொள்வதே சிறந்தது.', 'D', '{"dimension": "stability_need"}'),
  (2, 'Have an informal conversation with the leads of all three clubs this week - I want to understand their actual needs before I decide what to step back from.', 'இந்த வாரம் மூன்று மன்றங்களின் தலைவர்களுடனும் ஒரு முறைசாரா உரையாடலை மேற்கொள்ளுங்கள் - எதிலிருந்து பின்வாங்க வேண்டும் என்று தீர்மானிப்பதற்கு முன், அவர்களின் உண்மையான தேவைகளை நான் புரிந்துகொள்ள விரும்புகிறேன்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'Honour the most immediate commitment first and reassess after Friday - making a big structural decision in a high-pressure week is rarely the right call.', 'முதலில் மிக உடனடியான கடமையை நிறைவேற்றி, வெள்ளிக்கிழமைக்குப் பிறகு மறுமதிப்பீடு செய்யுங்கள் - அதிக அழுத்தம் நிறைந்த வாரத்தில் ஒரு பெரிய கட்டமைப்பு முடிவை எடுப்பது அரிதாகவே சரியான முடிவாக இருக்கும்.', 'S', '{"dimension": "stability_need"}'),
  (4, 'Map out the actual time and energy requirements of each commitment for the next four weeks before making any changes - I need the full picture to make a decision I will not have to revisit.', 'எந்த மாற்றங்களையும் செய்வதற்கு முன், அடுத்த நான்கு வாரங்களுக்கு ஒவ்வொரு செயலுக்கும் தேவைப்படும் உண்மையான நேரம் மற்றும் ஆற்றல் தேவைகளைத் திட்டமிடுங்கள் - நான் மீண்டும் பரிசீலிக்கத் தேவையில்லாத ஒரு முடிவை எடுக்க, எனக்கு முழுமையான விவரம் தேவை.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q39
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'You have been the person your batch comes to when things get hard. Three people have leaned on you heavily in the last two weeks - one through a family crisis, one through placement anxiety, one through a relationship breakdown. You are genuinely glad they came to you. You are also quietly emptying out. You have placement interviews starting in five days.', 'What matters more to you in this moment?', 'உங்கள் குழுவினர் கடினமான சூழ்நிலைகளை எதிர்கொள்ளும்போது, ​​அவர்கள் நாடி வரும் நபராக நீங்கள் இருந்திருக்கிறீர்கள். கடந்த இரண்டு வாரங்களில் மூன்று பேர் உங்களை மிகவும் சார்ந்திருந்திருக்கிறார்கள் - ஒருவர் குடும்ப நெருக்கடியின்போதும், மற்றொருவர் வேலைவாய்ப்பு குறித்த பதற்றத்தின்போதும், இன்னொருவர் உறவு முறிவின்போதும். அவர்கள் உங்களிடம் வந்ததில் நீங்கள் உண்மையாகவே மகிழ்ச்சியடைகிறீர்கள். அதே சமயம், நீங்கள் மெல்ல மெல்ல உங்கள் மனச்சுமையைக் குறைத்து வருகிறீர்கள். இன்னும் ஐந்து நாட்களில் உங்களுக்கு வேலைவாய்ப்பு நேர்காணல்கள் தொடங்குகின்றன.', 'இந்தத் தருணத்தில் உங்களுக்கு மிகவும் முக்கியமானது எது?',
     '{"theme": "Self-Management & Burnout", "dimension": "decision_speed vs accuracy_need", "layer": "2", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'Being honest with yourself that you need to step back from being available right now, even though it means people who need you may feel the withdrawal.', 'உங்களைச் சார்ந்திருப்பவர்கள் அந்தப் பிரிவின் வலியை உணர்ந்தாலும், தற்போதைக்கு நீங்கள் கிடைப்பதிலிருந்து சற்று விலகிக்கொள்ள வேண்டும் என்பதை உங்களுக்கு நீங்களே நேர்மையாக ஏற்றுக்கொள்வது.', 'D', '{"dimension": "decision_speed vs accuracy_need"}'),
  (2, 'Managing this carefully so that the people who depend on you do not feel abandoned while you are also protecting yourself.', 'உங்களைச் சார்ந்திருப்பவர்கள் கைவிடப்பட்டதாக உணராதவாறும், அதே சமயம் நீங்கள் உங்களைப் பாதுகாத்துக் கொள்ளும் வகையிலும் இதை கவனமாக நிர்வகிக்க வேண்டும்.', 'I', '{"dimension": "decision_speed vs accuracy_need"}'),
  (3, 'Continuing to show up for the people who need you - stepping back feels like a betrayal of something you genuinely value about yourself.', 'உங்களுக்குத் தேவைப்படும் நபர்களுக்குத் தொடர்ந்து ஆதரவளிப்பதில் இருந்து பின்வாங்குவது, உங்களைப் பற்றி நீங்கள் உண்மையாகவே மதிக்கும் ஒரு விஷயத்திற்குச் செய்யும் துரோகம் போல் உணர்த்தும்.', 'S', '{"dimension": "decision_speed vs accuracy_need"}'),
  (4, 'Understanding what specifically is depleting you and whether there is a way to restructure the support you are giving so it costs you less - before making any decision about pulling back.', 'பின்வாங்குவது குறித்து எந்தவொரு முடிவையும் எடுப்பதற்கு முன், குறிப்பாக எது உங்களைச் சோர்வடையச் செய்கிறது என்பதையும், நீங்கள் வழங்கும் ஆதரவிற்கான செலவைக் குறைக்கும் வகையில் அதை மறுசீரமைக்க வழி உள்ளதா என்பதையும் புரிந்துகொள்ளுங்கள்.', 'C', '{"dimension": "decision_speed vs accuracy_need"}')
) AS v(ord, en, ta, fac, meta);

-- Set 3 Q40
WITH q AS (
  INSERT INTO assessment_questions
    (assessment_level_id, set_number, program_id,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ((SELECT id FROM assessment_levels WHERE level_number = 1), 3, (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT'),
     'The honest feeling underneath this: you have a health issue you have been managing quietly for six weeks. It is not critical but it is affecting your energy, your concentration, and your sleep. Your team does not know. Your placement contacts do not know. You have been performing adequately from the outside but you know the gap between what you are producing and what you are capable of.', 'What is actually happening inside you right now?', 'இதன் பின்னணியில் உள்ள உண்மையான உணர்வு இதுதான்: கடந்த ஆறு வாரங்களாக நீங்கள் ஒரு உடல்நலப் பிரச்சினையை அமைதியாகச் சமாளித்து வருகிறீர்கள். அது உயிருக்கு ஆபத்தானதல்ல, ஆனால் அது உங்கள் ஆற்றல், கவனம் மற்றும் உறக்கத்தைப் பாதிக்கிறது. உங்கள் குழுவினருக்கு இது தெரியாது. உங்கள் பணி நியமனத் தொடர்பாளர்களுக்கும் இது தெரியாது. வெளிப்படையாகப் பார்க்கும்போது உங்கள் செயல்பாடு போதுமானதாகவே இருக்கிறது, ஆனால் நீங்கள் வெளிப்படுத்தும் திறனுக்கும் உங்கள் உண்மையான திறனுக்கும் இடையிலான இடைவெளியை நீங்கள் அறிவீர்கள்.', 'உண்மையில் இப்போது உங்களுக்குள் என்ன நடந்து கொண்டிருக்கிறது?',
     '{"theme": "Self-Management & Burnout", "dimension": "stability_need", "layer": "3", "source": "mba_xlsx_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO assessment_question_options
  (question_id, display_order, option_text_en, option_text_ta,
   disc_factor, score_value, metadata, is_active, is_deleted)
SELECT q.id, v.ord, v.en, v.ta, v.fac, 1.0, v.meta::jsonb, true, false
FROM q, (VALUES
  (1, 'A functional determination to get through the next four weeks and deal with the health issue properly once placement is done - I know what I am doing and why.', 'அடுத்த நான்கு வாரங்களைக் கடந்து, பயிற்சி முடிந்தவுடன் உடல்நலப் பிரச்சினையை முறையாகச் சமாளிப்பதற்கான ஒரு செயல்மிகு உறுதிப்பாடு - நான் என்ன செய்கிறேன், ஏன் செய்கிறேன் என்பது எனக்குத் தெரியும்.', 'D', '{"dimension": "stability_need"}'),
  (2, 'A low-grade anxiety about whether anyone can tell - whether the gap between your output and your capability is visible to the people who are evaluating you.', 'உங்களை மதிப்பிடுபவர்களுக்கு உங்கள் செயல்திறனுக்கும் திறனுக்கும் இடையிலான இடைவெளி தெரிகிறதா என்பது போன்ற, யாராவது அதைக் கண்டுபிடித்துவிடுவார்களோ என்ற ஒருவித லேசான பதட்டம்.', 'I', '{"dimension": "stability_need"}'),
  (3, 'A private exhaustion that is less about the health issue itself and more about the weight of carrying something real completely alone for six weeks.', 'உடல்நலப் பிரச்சினையை விட, ஆறு வாரங்களாக ஒரு நிஜமான விஷயத்தை முற்றிலும் தனியாகச் சுமந்ததன் பாரத்தாலேயே ஏற்பட்ட ஒரு தனிப்பட்ட சோர்வு.', 'S', '{"dimension": "stability_need"}'),
  (4, 'A growing discomfort with the fact that you are making decisions about your performance and commitments on incomplete information - your own body is a variable you are not accounting for properly.', 'முழுமையற்ற தகவல்களின் அடிப்படையில் உங்கள் செயல்திறன் மற்றும் கடமைகள் குறித்த முடிவுகளை எடுக்கிறீர்கள் என்ற உண்மையால் ஏற்படும் ஒரு வளர்ந்து வரும் அசௌகரியம் - உங்கள் சொந்த உடலே நீங்கள் சரியாகக் கணக்கில் கொள்ளாத ஒரு காரணியாக உள்ளது.', 'C', '{"dimension": "stability_need"}')
) AS v(ord, en, ta, fac, meta);

-- Sanity check (optional): expected counts
-- questions = 120, options = 480
COMMIT;
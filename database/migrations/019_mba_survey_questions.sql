-- ============================================================
-- MBA SURVEY open-question import (auto-generated)
-- Source: C:\Users\Sriharan\Downloads\MBA Questions (6).xlsx [sheet: Survey Questions]
-- question_type = SURVEY | marker: mba_survey_v1
-- Re-runnable: preamble removes any prior rows with this marker.
-- Requires migration 014 (open_questions.set_number/context_text_*).
-- ============================================================
BEGIN;

-- Idempotency: clear any previous SURVEY import of THIS batch.
DELETE FROM open_question_options o
 USING open_questions q
 WHERE o.open_question_id = q.id AND q.metadata->>'source' = 'mba_survey_v1';
DELETE FROM open_questions WHERE metadata->>'source' = 'mba_survey_v1';

-- Survey set 1 #1
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'The Chief Minister of Tamil Nadu earns ₹1.7 lakh basic per month. The Governor earns ₹3.5 lakh. A Ward Councillor serving 20,000 people gets ₹4,000 to ₹12,000 with no office, no vehicle, no staff. Someone in your group says "politicians are overpaid."', 'What is your honest response?', 'தமிழக முதலமைச்சர் மாதத்திற்கு ₹1.7 லட்சம் அடிப்படை சம்பளம் பெறுகிறார். ஆளுநர் ₹3.5 லட்சம் பெறுகிறார். 20,000 மக்களுக்கு சேவை செய்யும் ஒரு வார்டு கவுன்சிலர், அலுவலகம், வாகனம், பணியாளர்கள் என எதுவும் இல்லாமல் ₹4,000 முதல் ₹12,000 வரை பெறுகிறார். உங்கள் குழுவில் உள்ள ஒருவர், "அரசியல்வாதிகளுக்கு அதிக சம்பளம் வழங்கப்படுகிறது" என்கிறார்.', 'உங்கள் நேர்மையான பதில் என்ன?',
     '{"theme": "Political Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The salary is not the issue. The perks, vehicles, staff and lifetime benefits are where the real cost sits and nobody talks about that.', 'சம்பளம் ஒரு பிரச்சனையல்ல. சலுகைகள், வாகனங்கள், பணியாளர்கள் மற்றும் வாழ்நாள் நலன்களில்தான் உண்மையான செலவு அடங்கியுள்ளது, ஆனால் அதைப்பற்றி யாரும் பேசுவதில்லை.'),
  (2, 'Compare the responsibility they carry to any private sector equivalent - they are actually underpaid. Low official salaries push people toward corruption.', 'அவர்கள் சுமக்கும் பொறுப்பை எந்தவொரு தனியார் துறையினருடனும் ஒப்பிட்டுப் பாருங்கள் - உண்மையில் அவர்களுக்குக் குறைவான ஊதியமே வழங்கப்படுகிறது. குறைந்த அதிகாரப் பதவி ஊதியங்கள் மக்களை ஊழலை நோக்கித் தள்ளுகின்றன.'),
  (3, 'The real problem is the gap between top and bottom. A CM and a Ward Councillor are both elected. The difference in support is unjustifiable.', 'உண்மையான பிரச்சினை என்பது மேல்மட்டத்தினருக்கும் கீழ்மட்டத்தினருக்கும் இடையிலான இடைவெளிதான். ஒரு முதலமைச்சரும் ஒரு வார்டு கவுன்சிலரும் தேர்ந்தெடுக்கப்படுகிறார்கள். ஆதரவில் உள்ள இந்த வேறுபாடு நியாயப்படுத்த முடியாதது.'),
  (4, 'Salary numbers mean nothing without accountability. Pay them well - but make every decision transparent.', 'பொறுப்புக்கூறல் இல்லாமல் சம்பள எண்களுக்கு அர்த்தமில்லை. அவர்களுக்கு நல்ல சம்பளம் கொடுங்கள் - ஆனால் ஒவ்வொரு முடிவையும் வெளிப்படையாக எடுங்கள்.')
) AS v(ord, en, ta);

-- Survey set 1 #2
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'In India the Governor is appointed by the President. The Chief Minister is elected by the people. Yet the Governor can withhold a bill passed by the elected legislature, recommend President''s Rule, and dismiss a state government. A classmate argues this makes democracy incomplete.', 'What is your view?', 'இந்தியாவில் ஆளுநர் குடியரசுத் தலைவரால் நியமிக்கப்படுகிறார். முதலமைச்சர் மக்களால் தேர்ந்தெடுக்கப்படுகிறார். இருந்தபோதிலும், தேர்ந்தெடுக்கப்பட்ட சட்டமன்றத்தால் நிறைவேற்றப்பட்ட ஒரு மசோதாவை ஆளுநரால் நிறுத்திவைக்க முடியும், குடியரசுத் தலைவர் ஆட்சியைப் பரிந்துரைக்க முடியும், மற்றும் ஒரு மாநில அரசைக் கலைக்க முடியும். இது ஜனநாயகத்தை முழுமையற்றதாக்குகிறது என்று ஒரு வகுப்புத் தோழன் வாதிடுகிறான்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Governance Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The Governor is a necessary check. Elected governments can be corrupt or unconstitutional. An appointed authority above politics is a design feature not a flaw.', 'ஆளுநர் ஒரு அவசியமான கட்டுப்பாடு. தேர்ந்தெடுக்கப்பட்ட அரசாங்கங்கள் ஊழல் நிறைந்தவையாகவோ அல்லது அரசியலமைப்புக்கு முரணானவையாகவோ இருக்கலாம். அரசியலுக்கு அப்பாற்பட்ட ஒரு நியமிக்கப்பட்ட அதிகாரம் என்பது ஒரு வடிவமைப்பு அம்சம், அது ஒரு குறை அல்ல.'),
  (2, 'The classmate is right. A person appointed by the ruling party at the Centre holding veto power over an elected state government is a structural conflict of interest.', 'என் வகுப்புத் தோழர் சொல்வது சரிதான். மத்தியில் ஆளும் கட்சியால் நியமிக்கப்பட்ட ஒருவர், தேர்ந்தெடுக்கப்பட்ட மாநில அரசின் மீது வீட்டோ அதிகாரம் கொண்டிருப்பது ஒரு கட்டமைப்பு ரீதியான நல முரண்பாடாகும்.'),
  (3, 'The system works when both sides act in good faith. The problem is not the design - it is the people operating it.', 'இரு தரப்பினரும் நல்லெண்ணத்துடன் செயல்படும்போது இந்த அமைப்பு இயங்குகிறது. பிரச்சனை அதன் வடிவமைப்பில் இல்லை - அதை இயக்கும் நபர்களிடம்தான் உள்ளது.'),
  (4, 'Every democracy has counter-majoritarian checks. The Supreme Court, the Election Commission, the CAG - none are elected. Appointed oversight is normal.', 'ஒவ்வொரு ஜனநாயகத்திலும் பெரும்பான்மைக்கு எதிரான கட்டுப்பாடுகள் உள்ளன. உச்ச நீதிமன்றம், தேர்தல் ஆணையம், தலைமை கணக்குத் தணிக்கையாளர் - இவை எதுவும் தேர்ந்தெடுக்கப்படுவதில்லை. நியமிக்கப்பட்ட மேற்பார்வையே இயல்பானது.')
) AS v(ord, en, ta);

-- Survey set 1 #3
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Tamil Nadu is the second largest state economy in India with a GSDP of approximately ₹22–24 lakh crore - contributing nearly 9% of national GDP. Yet it carries one of the highest state debt loads in the country at over ₹8 lakh crore.', 'Your professor asks - is this a problem or a sign of an ambitious state investing in its future?', 'தமிழ்நாடு, சுமார் ₹22–24 லட்சம் கோடி மொத்த மாநில உள்நாட்டு உற்பத்தியுடன் (GSDP) இந்தியாவின் இரண்டாவது பெரிய மாநிலப் பொருளாதாரமாகத் திகழ்கிறது. இது தேசிய மொத்த உள்நாட்டு உற்பத்தியில் கிட்டத்தட்ட 9% பங்களிக்கிறது. இருப்பினும், ₹8 லட்சம் கோடிக்கும் அதிகமான, நாட்டிலேயே மிக அதிக மாநிலக் கடன் சுமைகளில் ஒன்றை இது கொண்டுள்ளது.', 'இது ஒரு பிரச்சனையா அல்லது தனது எதிர்காலத்தில் முதலீடு செய்யும் ஒரு லட்சியமிக்க அரசின் அறிகுறியா என்று உங்கள் பேராசிரியர் கேட்கிறார்.',
     '{"theme": "Economic Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Debt is only a problem if it is unproductive. If Tamil Nadu''s borrowing is building infrastructure, education and industry - the returns will cover the cost over time.', 'கடன் என்பது ஆக்கமற்றதாக இருந்தால் மட்டுமே அது ஒரு பிரச்சனையாகும். தமிழ்நாட்டின் கடன், உள்கட்டமைப்பு, கல்வி மற்றும் தொழில்துறையை மேம்படுத்துவதற்காக வாங்கப்பட்டால், காலப்போக்கில் கிடைக்கும் வருமானம் அதற்கான செலவை ஈடு செய்துவிடும்.'),
  (2, '₹8 lakh crore in debt for a state of 7.9 crore people is ₹1 lakh per citizen. Future generations did not vote for this. It is a problem regardless of intent.', '7.9 கோடி மக்கள் தொகை கொண்ட ஒரு மாநிலத்திற்கு ₹8 லட்சம் கோடி கடன் என்பது, ஒரு குடிமகனுக்கு ₹1 லட்சம் ஆகும். வருங்கால சந்ததியினர் இதற்கு வாக்களிக்கவில்லை. நோக்கம் எதுவாக இருந்தாலும் இது ஒரு பிரச்சனையே.'),
  (3, 'The debt-to-GSDP ratio matters more than the absolute number. Tamil Nadu''s ratio is high but manageable compared to states like Punjab or Himachal Pradesh which are in genuine fiscal distress.', 'முழுமையான எண்ணை விட, கடன்-மொத்த மாநில உள்நாட்டு உற்பத்தி விகிதமே அதிக முக்கியத்துவம் வாய்ந்தது. உண்மையான நிதி நெருக்கடியில் உள்ள பஞ்சாப் அல்லது இமாச்சலப் பிரதேசம் போன்ற மாநிலங்களுடன் ஒப்பிடுகையில், தமிழ்நாட்டின் விகிதம் அதிகமாக இருந்தாலும் சமாளிக்கக்கூடியதாகவே உள்ளது.'),
  (4, 'State governments borrow because the Centre controls most tax revenue but pushes expenditure responsibility to states. The debt is a symptom of a broken fiscal federalism - not just poor state management.', 'மத்திய அரசு பெரும்பாலான வரி வருவாயைக் கட்டுப்படுத்துவதாலும், செலவினப் பொறுப்பை மாநிலங்கள் மீது தள்ளுவதாலும் மாநில அரசுகள் கடன் வாங்குகின்றன. இந்தக் கடன் என்பது வெறும் மோசமான மாநில நிர்வாகத்தின் அறிகுறி மட்டுமல்ல, அது சீர்குலைந்த நிதி கூட்டாட்சி முறையின் அறிகுறியும் ஆகும்.')
) AS v(ord, en, ta);

-- Survey set 1 #4
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Thalapathy Vijay built a political party and contested elections in Tamil Nadu. A significant voter base supported him. A batchmate says "people are foolish to vote for a film star." Another says "the people know exactly what they are doing."', 'Who do you agree with?', 'தளபதி விஜய் ஒரு அரசியல் கட்சியை உருவாக்கி தமிழ்நாட்டில் தேர்தலில் போட்டியிட்டார். கணிசமான வாக்காளர் தளம் அவருக்கு ஆதரவளித்தது. "ஒரு திரைப்பட நட்சத்திரத்திற்கு வாக்களிப்பது மக்களின் முட்டாள்தனம்" என்று அவரது சக வகுப்பு மாணவர் ஒருவர் கூறுகிறார். "மக்கள் தாங்கள் என்ன செய்கிறார்கள் என்பதை நன்கு அறிந்திருக்கிறார்கள்" என்று மற்றொருவர் கூறுகிறார்.', 'நீங்கள் யாருடன் உடன்படுகிறீர்கள்?',
     '{"theme": "Leadership Perception", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The second batchmate. When institutions fail people repeatedly they look for someone outside the system they trust. That is rational not foolish.', 'இரண்டாவது சக மாணவர். நிறுவனங்கள் மக்களை மீண்டும் மீண்டும் கைவிடும்போது, ​​அவர்கள் அந்த அமைப்புக்கு வெளியே தங்களுக்கு நம்பிக்கையான ஒருவரைத் தேடுகிறார்கள். அது பகுத்தறிவுக்கு உகந்தது, முட்டாள்தனமல்ல.'),
  (2, 'Neither fully. The emotional logic is understandable but governance needs more than trust. The proof will be in what gets delivered.', 'முழுமையாகவும் இல்லை. உணர்ச்சிப்பூர்வமான நியாயம் புரிந்துகொள்ளக்கூடியதுதான், ஆனால் ஆட்சிக்கு நம்பிக்கையை விட மேலான ஒன்று தேவை. என்ன செய்து முடிக்கப்படுகிறது என்பதில்தான் அதன் சான்று தெரியும்.'),
  (3, 'Voters are not foolish - but they are often choosing the least bad option available. That says more about the political system than about the voters.', 'வாக்காளர்கள் முட்டாள்கள் அல்ல - ஆனால் அவர்கள் பெரும்பாலும் தங்களுக்குக் கிடைக்கும் தேர்வுகளிலேயே மிகக் குறைவான தீங்கைக் கொண்டதைத் தேர்ந்தெடுக்கிறார்கள். இது வாக்காளர்களைக் காட்டிலும் அரசியல் அமைப்பைப் பற்றியே அதிகம் கூறுகிறது.'),
  (4, 'Celebrity politicians succeed when they stand for something beyond their fame. The ones who last - MGR, NTR - had a clear value proposition. Fame alone does not sustain.', 'புகழ்பெற்ற அரசியல்வாதிகள், தங்கள் புகழையும் தாண்டி ஒரு கொள்கைக்காக நிற்கும்போது வெற்றி பெறுகிறார்கள். நிலைத்து நின்ற எம்.ஜி.ஆர், என்.டி.ஆர் போன்றவர்கள் ஒரு தெளிவான கொள்கை முன்மொழிவைக் கொண்டிருந்தனர். புகழ் மட்டுமே நிலைத்து நிற்காது.')
) AS v(ord, en, ta);

-- Survey set 1 #5
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Approximately 11–17% of Tamil Nadu''s population lives below the poverty line - better than the national average but urban-rural inequality remains sharp. Chennai''s slum population alone exceeds 12 lakh people. Your MBA batch is visiting a rural district and a local officer tells you - "development reaches cities first and waits for villages."', 'As a future business leader what does that statement mean to you?', 'தமிழக மக்கள் தொகையில் ஏறக்குறைய 11–17% பேர் வறுமைக் கோட்டிற்குக் கீழ் வாழ்கின்றனர் - இது தேசிய சராசரியை விடச் சிறந்ததே, ஆனாலும் நகர்ப்புற-கிராமப்புற ஏற்றத்தாழ்வு கடுமையாக உள்ளது. சென்னையின் குடிசைப்பகுதிகளில் மட்டும் 12 லட்சத்திற்கும் அதிகமான மக்கள் வசிக்கின்றனர். உங்கள் MBA மாணவர் குழு ஒரு கிராமப்புற மாவட்டத்திற்குச் செல்கிறது, அங்குள்ள உள்ளூர் அதிகாரி ஒருவர் உங்களிடம், "வளர்ச்சி முதலில் நகரங்களைச் சென்றடைகிறது, கிராமங்களுக்காகக் காத்திருக்கிறது" என்று கூறுகிறார்.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், அந்தக் கூற்று உங்களுக்கு என்ன அர்த்தம் தருகிறது?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means the market I think I understand is only half the market. The real consumer opportunity in India is in the parts development has not yet reached.', 'இதன் பொருள், நான் புரிந்துகொண்ட சந்தை என்பது உண்மையான சந்தையில் பாதி மட்டுமே. இந்தியாவில் உண்மையான நுகர்வோர் வாய்ப்பு என்பது, மேம்பாடு இன்னும் சென்றடையாத பாகங்களில்தான் உள்ளது.'),
  (2, 'It means infrastructure investment decisions have a political logic not an economic one. Businesses need to factor that into location and supply chain decisions.', 'இதன் பொருள், உள்கட்டமைப்பு முதலீட்டு முடிவுகளுக்குப் பொருளாதாரக் காரணம் அல்ல, அரசியல் காரணமே உள்ளது. நிறுவனங்கள் தங்கள் இடத் தேர்வு மற்றும் விநியோகச் சங்கிலி தொடர்பான முடிவுகளை எடுக்கும்போது இதைக் கருத்தில் கொள்ள வேண்டும்.'),
  (3, 'It means the talent I recruit from cities is already pre-selected. The actual depth of Indian human capital is sitting in places my hiring process never reaches.', 'இதன் பொருள், நான் நகரங்களிலிருந்து ஆட்சேர்ப்பு செய்யும் திறமையாளர்கள் ஏற்கனவே முன்கூட்டியே தேர்ந்தெடுக்கப்பட்டவர்கள் என்பதாகும். இந்திய மனித மூலதனத்தின் உண்மையான ஆழம், எனது ஆட்சேர்ப்பு செயல்முறை ஒருபோதும் சென்றடையாத இடங்களில் அடங்கியுள்ளது.'),
  (4, 'It means business as usual will keep reproducing the same inequality. Choosing where to operate, who to hire, and how to price are all social decisions whether I treat them that way or not.', 'இதன் பொருள், வழக்கம் போல் செயல்படுவது அதே சமத்துவமின்மையை மீண்டும் மீண்டும் உருவாக்கும் என்பதாகும். நான் அவற்றை அவ்வாறு கருதினாலும் சரி, இல்லாவிட்டாலும் சரி, எங்கு செயல்படுவது, யாரைப் பணியமர்த்துவது, மற்றும் எப்படி விலை நிர்ணயம் செய்வது என்பன போன்ற அனைத்தும் சமூக முடிவுகளே.')
) AS v(ord, en, ta);

-- Survey set 1 #6
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Women now form the majority of registered voters in Tamil Nadu. Free bus travel, SHG credit access, increased local body reservation - these policies followed directly. A classmate says "governments are not empowering women, they are buying their votes."', 'Is he right?', 'தற்போது தமிழ்நாட்டில் பதிவு செய்யப்பட்ட வாக்காளர்களில் பெண்களே பெரும்பான்மையாக உள்ளனர். இலவசப் பேருந்துப் பயணம், சுய உதவிக் குழு கடன் வசதி, உள்ளாட்சி அமைப்புகளில் அதிகரிக்கப்பட்ட இட ஒதுக்கீடு போன்ற கொள்கைகள் நேரடியாகப் பின்பற்றப்பட்டன. ஒரு வகுப்புத் தோழி கூறுகிறாள், "அரசாங்கங்கள் பெண்களுக்கு அதிகாரம் அளிப்பதில்லை, மாறாக அவர்களின் வாக்குகளை விலைக்கு வாங்குகின்றன."', 'அவர் சொல்வது சரியா?',
     '{"theme": "Gender Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Partially. The intent may be electoral but the impact is real. A woman travelling free on a bus every day has more mobility, more economic participation, more independence - regardless of why the scheme was launched.', 'ஓரளவுதான். இதன் நோக்கம் தேர்தல் சார்ந்ததாக இருக்கலாம், ஆனால் அதன் தாக்கம் உண்மையானது. இந்தத் திட்டம் எதற்காகத் தொடங்கப்பட்டது என்பதைப் பொருட்படுத்தாமல், தினமும் பேருந்தில் இலவசமாகப் பயணம் செய்யும் ஒரு பெண்ணுக்கு அதிக நடமாடும் சுதந்திரம், அதிக பொருளாதாரப் பங்களிப்பு, அதிக சுதந்திரம் ஆகியவை கிடைக்கின்றன.'),
  (2, 'He is right and it matters. Welfare schemes create dependency. Real empowerment is economic opportunity, legal protection, and political representation - not free rides.', 'அவர் சொல்வது சரிதான், அது முக்கியமானது. நலத்திட்டங்கள் சார்புநிலையை உருவாக்குகின்றன. உண்மையான அதிகாரமளித்தல் என்பது இலவசப் பயணங்கள் அல்ல; மாறாக, பொருளாதார வாய்ப்பு, சட்டப் பாதுகாப்பு மற்றும் அரசியல் பிரதிநிதித்துவம் ஆகும்.'),
  (3, 'The distinction between vote-buying and genuine policy is less clear than he thinks. All democratic policy is shaped by electoral incentives. The question is whether the outcome serves people - and these schemes largely do.', 'வாக்கு விலைக்கு வாங்குவதற்கும் உண்மையான கொள்கைக்கும் இடையிலான வேறுபாடு அவர் நினைப்பதை விடத் தெளிவாக இல்லை. அனைத்து ஜனநாயகக் கொள்கைகளும் தேர்தல் ஊக்கங்களால் வடிவமைக்கப்படுகின்றன. அதன் விளைவு மக்களுக்குப் பயனளிக்கிறதா என்பதே கேள்வி - மேலும் இந்தத் திட்டங்கள் பெரும்பாலும் அவ்வாறே செய்கின்றன.'),
  (4, 'Both things can be true. Governments buy votes and people benefit. The cynicism about motive should not erase the acknowledgment of impact.', 'இரண்டுமே உண்மையாக இருக்கலாம். அரசாங்கங்கள் வாக்குகளை விலைக்கு வாங்குகின்றன, மக்கள் பயனடைகிறார்கள். உள்நோக்கம் குறித்த ஐயுறவு, அதன் தாக்கத்தை ஏற்றுக்கொள்வதை அழித்துவிடக் கூடாது.')
) AS v(ord, en, ta);

-- Survey set 1 #7
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Under the RTI Act any Indian citizen can request information from a government body and must receive a response within 30 days. Officials face penalties for non-compliance. Yet RTI activists face harassment and in several documented cases - threats and violence. A classmate says "a law that puts citizens at risk for using it has failed."', 'Do you agree?', 'தகவல் அறியும் உரிமைச் சட்டத்தின் கீழ், எந்தவொரு இந்தியக் குடிமகனும் ஒரு அரசு அமைப்பிடமிருந்து தகவல்களைக் கோரலாம் மற்றும் 30 நாட்களுக்குள் பதிலைப் பெற வேண்டும். விதிகளைப் பின்பற்றாத அதிகாரிகள் தண்டனைகளை எதிர்கொள்கின்றனர். இருப்பினும், தகவல் அறியும் உரிமை ஆர்வலர்கள் துன்புறுத்தலையும், ஆவணப்படுத்தப்பட்ட பல நிகழ்வுகளில் - அச்சுறுத்தல்களையும் வன்முறையையும் எதிர்கொள்கின்றனர். ஒரு வகுப்புத் தோழர், "தகவலைப் பயன்படுத்துவதால் குடிமக்களை ஆபத்தில் ஆழ்த்தும் ஒரு சட்டம் தோல்வியடைந்துவிட்டது" என்கிறார்.', 'நீங்கள் ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Legal Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes. A right that requires courage to exercise is not a right in practice - it is a privilege for the brave. Implementation has failed even if the law is sound.', 'ஆம். செயல்படுத்துவதற்குத் துணிச்சல் தேவைப்படும் ஒரு உரிமை, நடைமுறையில் உரிமையாக இருப்பதில்லை - அது துணிவுள்ளவர்களுக்கான ஒரு சிறப்புரிமையாகும். சட்டம் வலுவாக இருந்தாலும், அதனைச் செயல்படுத்துவதில் தோல்வியே ஏற்பட்டுள்ளது.'),
  (2, 'No. The law itself is strong. The failure is enforcement and political will. The solution is stronger protection for RTI users - not writing off the law.', 'இல்லை. சட்டம் வலுவானதுதான். அமலாக்கத்திலும் அரசியல் விருப்பமின்மையிலும்தான் தோல்வி உள்ளது. தகவல் அறியும் உரிமைப் பயனாளர்களுக்கு வலுவான பாதுகாப்பை வழங்குவதே தீர்வு; சட்டத்தைப் புறக்கணிப்பதல்ல.'),
  (3, 'The law has not failed - it has revealed how much the system resists transparency. Every harassment case is evidence that someone found something worth hiding.', 'சட்டம் தோல்வியடையவில்லை - மாறாக, இந்த அமைப்பு வெளிப்படைத்தன்மையை எந்த அளவிற்கு எதிர்க்கிறது என்பதை அது வெளிப்படுத்தியுள்ளது. ஒவ்வொரு துன்புறுத்தல் வழக்கும், யாரோ ஒருவர் மறைப்பதற்குத் தகுந்த ஒரு விஷயத்தைக் கண்டுபிடித்தார் என்பதற்கான சான்றாகும்.'),
  (4, 'Both the law and its implementation need reform. Thirty days is too long, penalties are too weak, and whistleblower protection is almost nonexistent. The architecture needs upgrading not dismantling.', 'சட்டமும் அதன் செயலாக்கமும் சீர்திருத்தப்பட வேண்டும். முப்பது நாட்கள் என்பது மிக நீண்ட காலம், தண்டனைகள் மிகவும் பலவீனமாக உள்ளன, மேலும் முறைகேடுகளை வெளிப்படுத்துபவர்களுக்கான பாதுகாப்பு ஏறக்குறைய இல்லை என்றே சொல்லலாம். இதன் கட்டமைப்பைத் தகர்க்காமல், மேம்படுத்த வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 1 #8
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Indian law requires companies above a threshold to spend 2% of net profit on CSR. A founder in your entrepreneurship class says - "forced generosity is not generosity. CSR should be voluntary or it means nothing."', 'What is your response?', 'இந்தியச் சட்டத்தின்படி, ஒரு குறிப்பிட்ட வரம்பிற்கு மேல் வருமானம் ஈட்டும் நிறுவனங்கள், தங்கள் நிகர இலாபத்தில் 2%-ஐ சமூகப் பொறுப்புணர்வுக்காக (CSR) செலவிட வேண்டும். உங்கள் தொழில்முனைவோர் வகுப்பில் உள்ள ஒரு நிறுவனர் கூறுகிறார் - "கட்டாயப்படுத்தப்பட்ட தாராள மனப்பான்மை, தாராள மனப்பான்மை ஆகாது. சமூகப் பொறுப்புணர்வு என்பது தன்னார்வமாக இருக்க வேண்டும், இல்லையெனில் அதற்கு அர்த்தமில்லை."', 'உங்கள் பதில் என்ன?',
     '{"theme": "Business & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'He is right philosophically but wrong practically. Without the mandate most companies would spend nothing. Imperfect compliance beats voluntary absence.', 'அவர் தத்துவ ரீதியாகச் சொல்வது சரி, ஆனால் நடைமுறையில் தவறு. அந்தக் கட்டாயம் இல்லையென்றால் பெரும்பாலான நிறுவனங்கள் எதையும் செலவு செய்யாது. தாமாக முன்வந்து விலகி இருப்பதை விட, முழுமையற்ற இணக்கமே சிறந்தது.'),
  (2, 'The mandate is the floor not the ceiling. The companies doing meaningful CSR go far beyond 2%. The law just ensures the laggards contribute something.', 'கட்டாயம் என்பது குறைந்தபட்ச அளவே தவிர உச்சவரம்பு அல்ல. அர்த்தமுள்ள பெருநிறுவன சமூகப் பொறுப்பைச் செய்யும் நிறுவனங்கள் 2%-ஐத் தாண்டிச் செல்கின்றன. பின்தங்கியவர்கள் ஏதேனும் பங்களிப்பதை மட்டுமே சட்டம் உறுதி செய்கிறது.'),
  (3, 'Forced spending without accountability produces box-ticking not impact. The 2% gets spent on events and plaques. Voluntary but well-governed CSR would do more good.', 'பொறுப்புக்கூறல் இல்லாத கட்டாயச் செலவினம், தாக்கத்தை ஏற்படுத்தாமல் சம்பிரதாயங்களையே உருவாக்குகிறது. அந்த 2% நிகழ்வுகளுக்கும் நினைவுப் பலகைகளுக்கும் செலவிடப்படுகிறது. தன்னார்வத்துடன் கூடிய, ஆனால் நன்கு நிர்வகிக்கப்படும் பெருநிறுவன சமூகப் பொறுப்புணர்வு அதிக நன்மைகளைச் செய்யும்.'),
  (4, 'The deeper issue is that if businesses were taxed fairly and governments spent efficiently - we would not need CSR at all. CSR exists partly because both systems are failing.', 'ஆழமான பிரச்சினை என்னவென்றால், வணிகங்களுக்கு நியாயமான வரி விதிக்கப்பட்டு, அரசாங்கங்கள் திறமையாகச் செலவு செய்தால், நமக்கு பெருநிறுவன சமூகப் பொறுப்பு (CSR) என்பதே தேவைப்படாது. இந்த இரண்டு அமைப்புகளுமே தோல்வியடைந்து வருவதால்தான், பெருநிறுவன சமூகப் பொறுப்பு ஓரளவிற்கு உள்ளது.')
) AS v(ord, en, ta);

-- Survey set 1 #9
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'A primary health centre in a Tamil Nadu village has had no doctor for eight months. The sanctioned doctor never reported. The district headquarters 40 km away has four doctors for one-fifth the population. The village has filed three complaints. Nothing has moved.', 'What is the core failure here?', 'தமிழ்நாட்டிலுள்ள ஒரு கிராமத்தின் ஆரம்ப சுகாதார நிலையத்தில் கடந்த எட்டு மாதங்களாக மருத்துவர் இல்லை. அனுமதிக்கப்பட்ட மருத்துவர் பணிக்கு வரவில்லை. 40 கி.மீ தொலைவில் உள்ள மாவட்டத் தலைமையகத்தில், கிராமத்தின் ஐந்தில் ஒரு பங்கு மக்களுக்கு நான்கு மருத்துவர்களே உள்ளனர். அந்தக் கிராமம் மூன்று முறை புகார் அளித்துள்ளது. ஆனால், எந்த நடவடிக்கையும் எடுக்கப்படவில்லை.', 'இங்குள்ள அடிப்படைக் குறைபாடு என்ன?',
     '{"theme": "Governance Quality", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Incentive failure - rural postings offer no reason for a qualified doctor to choose them over a city posting. Fix the incentive and the problem moves.', 'ஊக்கத்தொகைத் தோல்வி - ஒரு தகுதிவாய்ந்த மருத்துவர் நகரப் பணியிடத்தை விட கிராமப்புறப் பணியிடங்களைத் தேர்ந்தெடுப்பதற்கு எந்தக் காரணமும் இல்லை. ஊக்கத்தொகையைச் சரிசெய்தால், இந்தப் பிரச்சினையும் இடம் மாறும்.'),
  (2, 'Accountability failure - someone processed the appointment and nobody verified whether the person showed up. Zero consequence for non-compliance.', 'பொறுப்புடைமைத் தோல்வி - யாரோ ஒருவர் சந்திப்பு நேரத்தைப் பதிவுசெய்தார், ஆனால் அந்த நபர் வந்தாரா என்பதை யாரும் சரிபார்க்கவில்லை. விதிமீறலுக்கு எந்த விளைவும் ஏற்படவில்லை.'),
  (3, 'Political failure - rural constituencies have less electoral leverage than urban ones. Resources and attention follow power not need.', 'அரசியல் தோல்வி - நகர்ப்புறத் தொகுதிகளைக் காட்டிலும் கிராமப்புறத் தொகுதிகளுக்குத் தேர்தல் செல்வாக்கு குறைவாக உள்ளது. வளங்களும் கவனமும் தேவையை அல்ல, அதிகாரத்தையே பின்தொடர்கின்றன.'),
  (4, 'All three simultaneously. Treating this as one problem with one solution is why eight months have passed and nothing has changed.', 'மூன்றும் ஒரே நேரத்தில். இதை ஒரே தீர்வுள்ள ஒரே பிரச்சினையாகக் கருதுவதால்தான், எட்டு மாதங்கள் கடந்தும் எதுவும் மாறவில்லை.')
) AS v(ord, en, ta);

-- Survey set 1 #10
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Two articles cover the same government infrastructure project. One says it has transformed connectivity for three districts. The other says cost overruns have doubled the budget and two contractors have political connections to the ruling party. Both quote official sources. You need to form a view.', 'What do you do?', 'ஒரே அரசு உள்கட்டமைப்புத் திட்டம் குறித்து இரண்டு கட்டுரைகள் பேசுகின்றன. ஒன்று, அது மூன்று மாவட்டங்களுக்கான இணைப்பை மாற்றியமைத்துள்ளது என்கிறது. மற்றொன்று, செலவு மீறல்களால் நிதிநிலை இரட்டிப்பாகியுள்ளது என்றும், இரண்டு ஒப்பந்தக்காரர்களுக்கு ஆளும் கட்சியுடன் அரசியல் தொடர்புகள் உள்ளன என்றும் கூறுகிறது. இரண்டுமே அதிகாரப்பூர்வ வட்டாரங்களை மேற்கோள் காட்டுகின்றன. நீங்கள் ஒரு முடிவுக்கு வர வேண்டும்.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Media Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Find the primary source - the actual project report, the audit findings, the tender documents. Both articles are interpretations. I want the original data.', 'முதன்மை மூலத்தைக் கண்டறியுங்கள் - உண்மையான திட்ட அறிக்கை, தணிக்கை முடிவுகள், ஒப்பந்த ஆவணங்கள். இரண்டு கட்டுரைகளுமே விளக்கவுரைகளே. எனக்கு அசல் தரவுகள் வேண்டும்.'),
  (2, 'The gap between the two articles is itself information. It tells me this project is politically contested and any single-source view is unreliable.', 'இரு கட்டுரைகளுக்கும் இடையிலான இடைவெளியே ஒரு தகவல். இந்தத் திட்டம் அரசியல் ரீதியாக சர்ச்சைக்குரியது என்பதையும், எந்தவொரு ஒற்றை மூலக் கருத்தும் நம்பகமற்றது என்பதையும் அது எனக்கு உணர்த்துகிறது.'),
  (3, 'Look at who owns each outlet and their track record on government coverage. Media credibility is institutional not just story by story.', 'ஒவ்வொரு ஊடக நிறுவனத்தின் உரிமையாளர் யார் என்பதையும், அரசாங்கச் செய்திகளை வழங்குவதில் அவற்றின் முந்தைய செயல்பாடுகளையும் பாருங்கள். ஊடக நம்பகத்தன்மை என்பது வெறும் செய்தி சார்ந்ததல்ல, அது ஒரு நிறுவன ரீதியான விஷயம்.'),
  (4, 'Hold both as partially true. Large projects usually deliver some benefit and carry some corruption simultaneously. Binary judgments on complex projects are almost always wrong.', 'இரண்டையும் பகுதியளவு உண்மையாகக் கருதுங்கள். பெரிய திட்டங்கள் பொதுவாக சில நன்மைகளை அளிப்பதோடு, சில ஊழல்களையும் ஒரே நேரத்தில் கொண்டுள்ளன. சிக்கலான திட்டங்கள் மீதான இருமுனைத் தீர்ப்புகள் பெரும்பாலும் தவறானவையே.')
) AS v(ord, en, ta);

-- Survey set 1 #11
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'A senior business leader in your city is well known for two things - building one of the region''s largest employers over 30 years and routinely cutting corners on environmental compliance. He is speaking at your MBA convocation. A batchmate says "we should not celebrate people who externalise their costs onto society." Another says "he built livelihoods for 10,000 families - show some respect."', 'Where do you stand?', 'உங்கள் நகரத்தின் ஒரு மூத்த வணிகத் தலைவர் இரண்டு விஷயங்களுக்காக நன்கு அறியப்பட்டவர் - 30 ஆண்டுகளுக்கும் மேலாக இப்பகுதியின் மிகப்பெரிய வேலைவாய்ப்பு வழங்குநர்களில் ஒருவரை உருவாக்கியதும், சுற்றுச்சூழல் விதிமுறைகளுக்கு இணங்குவதில் வழக்கமாக விதிகளை மீறுவதும்தான் அது. அவர் உங்கள் MBA பட்டமளிப்பு விழாவில் பேசுகிறார். உங்கள் சக மாணவர் ஒருவர், "தங்கள் செலவுகளைச் சமூகத்தின் மீது சுமத்துபவர்களை நாம் கொண்டாடக் கூடாது" என்கிறார். மற்றொருவர், "அவர் 10,000 குடும்பங்களுக்கு வாழ்வாதாரத்தை உருவாக்கினார் - அவருக்குக் கொஞ்சம் மரியாதை கொடுங்கள்" என்கிறார்.', 'உங்கள் நிலைப்பாடு என்ன?',
     '{"theme": "Leadership & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'With the first batchmate. Celebrating someone uncritically sends a message to the next generation of leaders about what success looks like. We can acknowledge the employment without giving a platform uncritically.', 'முதல் சக குழு உறுப்பினருடன். ஒருவரை விமர்சனமின்றி கொண்டாடுவது, வெற்றி என்பது எப்படி இருக்கும் என்பது குறித்த ஒரு செய்தியை அடுத்த தலைமுறைத் தலைவர்களுக்கு அனுப்புகிறது. ஒரு மேடையை வழங்காமலேயே, வேலைவாய்ப்பை நாம் விமர்சனமின்றி அங்கீகரிக்க முடியும்.'),
  (2, 'With the second. Perfect is the enemy of good. A generation of Indian industry built employment in imperfect conditions. Judging them by 2025 standards applied to 1995 decisions is unfair.', 'இரண்டாவதாக, பரிபூரணம் என்பது நல்லதின் எதிரி. இந்தியத் தொழில்துறையின் ஒரு தலைமுறை, குறைபாடுள்ள சூழ்நிலைகளில் வேலைவாய்ப்பை உருவாக்கியது. 1995-ஆம் ஆண்டு முடிவுகளுக்கு 2025-ஆம் ஆண்டு தரநிலைகளைப் பொருத்தி அவர்களை மதிப்பிடுவது நியாயமற்றது.'),
  (3, 'Neither fully. Invite him - but use the occasion to also talk honestly about what the next generation of business leadership needs to look like. His story is the before. We are the after.', 'முழுமையாக இல்லை. அவரை அழையுங்கள் - ஆனால், அடுத்த தலைமுறை வணிகத் தலைமை எப்படி இருக்க வேண்டும் என்பது குறித்தும் நேர்மையாகப் பேசுவதற்கு இந்தச் சந்தர்ப்பத்தைப் பயன்படுத்திக்கொள்ளுங்கள். அவருடைய கதைதான் முந்தையது. நாம்தான் பிந்தையது.'),
  (4, 'The real question is what he is doing now. If he is still cutting corners today that is a live ethical failure. If he has evolved - the journey itself is worth discussing.', 'அவர் இப்போது என்ன செய்து கொண்டிருக்கிறார் என்பதுதான் உண்மையான கேள்வி. அவர் இன்றும் குறுக்கு வழிகளைக் கையாண்டால், அது ஒரு நேரடியான அறநெறித் தோல்வியாகும். அவர் பரிணாம வளர்ச்சி அடைந்திருந்தால் - அவரது அந்தப் பயணமே விவாதிக்கத் தகுந்தது.')
) AS v(ord, en, ta);

-- Survey set 1 #12
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Tamil Nadu sends 39 MPs to the Lok Sabha. Maharashtra sends 48. Uttar Pradesh sends 80. A political science professor argues that smaller southern states are systematically underrepresented in national policy because the population-based seat allocation rewards states that did not control population growth.', 'Do you think this is a legitimate grievance?', 'தமிழகம் மக்களவைக்கு 39 நாடாளுமன்ற உறுப்பினர்களை அனுப்புகிறது. மகாராஷ்டிரா 48 பேரையும், உத்தரப் பிரதேசம் 80 பேரையும் அனுப்புகின்றன. மக்கள்தொகை வளர்ச்சியைக் கட்டுப்படுத்தாத மாநிலங்களுக்கு மக்கள்தொகை அடிப்படையிலான இட ஒதுக்கீடு சாதகமாக இருப்பதால், சிறிய தென்னிந்திய மாநிலங்கள் தேசியக் கொள்கையில் திட்டமிட்டுப் போதிய பிரதிநிதித்துவம் பெறவில்லை என்று ஒரு அரசியல் அறிவியல் பேராசிரியர் வாதிடுகிறார்.', 'இது ஒரு நியாயமான குறை என்று நீங்கள் நினைக்கிறீர்களா?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - states that invested in education, healthcare and women''s empowerment controlled their populations and are now penalised for it in Parliament. That is a perverse incentive.', 'ஆம் - கல்வி, சுகாதாரம் மற்றும் பெண்கள் மேம்பாட்டில் முதலீடு செய்த மாநிலங்கள் தங்கள் மக்கள்தொகையைக் கட்டுப்படுத்தின, ஆனால் இப்போது அதற்காக நாடாளுமன்றத்தில் தண்டிக்கப்படுகின்றன. அது ஒரு தவறான ஊக்குவிப்பு.'),
  (2, 'Yes but the solution is complicated. Redistributing seats toward southern states means reducing northern representation. That is politically explosive in a democracy where numbers decide everything.', 'ஆம், ஆனால் தீர்வு சிக்கலானது. தெற்கு மாநிலங்களுக்கு இடங்களை மறுபங்கீடு செய்வது என்பது வடக்கு மாநிலங்களின் பிரதிநிதித்துவத்தைக் குறைப்பதாகும். எண்ணிக்கையே எல்லாவற்றையும் தீர்மானிக்கும் ஒரு ஜனநாயகத்தில், இது அரசியல் ரீதியாகப் பெரும் பாதிப்பை ஏற்படுத்தக்கூடியது.'),
  (3, 'The grievance is real but Parliament is not the only lever. Finance Commission allocations, GST distribution, and central scheme targeting matter as much as seat count.', 'குறை உண்மையானதுதான், ஆனால் நாடாளுமன்றம் மட்டுமே ஒரே கருவி அல்ல. இடங்களின் எண்ணிக்கையைப் போலவே, நிதி ஆணையத்தின் நிதி ஒதுக்கீடுகள், ஜிஎஸ்டி விநியோகம் மற்றும் மத்திய திட்டங்களின் இலக்கு நிர்ணயம் ஆகியவையும் முக்கியத்துவம் வாய்ந்தவை.'),
  (4, 'This is the core tension in Indian federalism and it has no clean answer. The Constitution tried to balance population with development - the balance has never fully worked.', 'இதுவே இந்தியக் கூட்டாட்சியின் மைய முரண்பாடாகும், இதற்குத் தெளிவான தீர்வு இல்லை. அரசியலமைப்புச் சட்டம், மக்கள்தொகையையும் வளர்ச்சியையும் சமநிலைப்படுத்த முயன்றது - ஆனால் அந்தச் சமநிலை ஒருபோதும் முழுமையாகச் செயல்பட்டதில்லை.')
) AS v(ord, en, ta);

-- Survey set 1 #13
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'India has more than 500 million people under 25. Tamil Nadu alone has roughly 3 crore young people entering or about to enter the workforce over the next decade. A McKinsey report estimates India needs to create 90 million non-farm jobs by 2030 to absorb this cohort.', 'As a future business leader - what does this number mean to you personally?', 'இந்தியாவில் 25 வயதுக்குட்பட்டவர்கள் 50 கோடிக்கும் அதிகமானோர் உள்ளனர். தமிழ்நாட்டில் மட்டும் அடுத்த பத்தாண்டுகளில் சுமார் 3 கோடி இளைஞர்கள் பணிக்குச் செல்ல உள்ளனர் அல்லது செல்லவிருக்கின்றனர். இந்த இளைஞர் குழுவை உள்வாங்க, 2030-ஆம் ஆண்டுக்குள் இந்தியா 9 கோடி விவசாயம் அல்லாத வேலைவாய்ப்புகளை உருவாக்க வேண்டும் என மெக்கின்சி அறிக்கை ஒன்று மதிப்பிட்டுள்ளது.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், இந்த எண் உங்களுக்குத் தனிப்பட்ட முறையில் என்ன அர்த்தம் தருகிறது?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means the talent supply is not the constraint - the job creation system is. Businesses that figure out how to deploy large numbers of young people productively will win the next decade.', 'இதன் பொருள், திறமையாளர் வழங்கல் ஒரு தடையல்ல; வேலைவாய்ப்பு உருவாக்கும் அமைப்பே தடையாக உள்ளது. அதிக எண்ணிக்கையிலான இளைஞர்களை ஆக்கப்பூர்வமாகப் பயன்படுத்துவது எப்படி என்பதைக் கண்டறியும் நிறுவனங்கள், அடுத்த பத்தாண்டுகளில் வெற்றி பெறும்.'),
  (2, 'It means the education-to-employment pipeline is broken at scale. Most of those 90 million will need jobs that do not yet exist in sectors that have not yet been built.', 'இதன் பொருள், கல்வியிலிருந்து வேலைவாய்ப்பிற்கான இணைப்புப் பாதை பெரிய அளவில் தடைபட்டுள்ளது என்பதாகும். அந்த 9 கோடி மக்களில் பெரும்பாலானோருக்கு, இன்னும் கட்டமைக்கப்படாத துறைகளில், தற்போது இல்லாத வேலைகள் தேவைப்படும்.'),
  (3, 'It means the social cost of getting this wrong is enormous. Unemployed young populations do not stay quiet. Business and political stability depend on solving this.', 'இதில் தவறு செய்வதால் ஏற்படும் சமூக விலை மிகப் பெரியது. வேலையில்லாத இளைஞர்கள் சும்மா இருப்பதில்லை. வணிக மற்றும் அரசியல் நிலைத்தன்மை இதைத் தீர்ப்பதையே சார்ந்துள்ளது.'),
  (4, 'It means I have a responsibility I did not fully feel before sitting in this classroom. The organisations I build or join will either be part of this solution or irrelevant to it.', 'இந்த வகுப்பறையில் அமர்வதற்கு முன்பு நான் முழுமையாக உணராத ஒரு பொறுப்பு எனக்கு இருக்கிறது என்பதே இதன் பொருள். நான் உருவாக்கும் அல்லது சேரும் அமைப்புகள், இந்தத் தீர்வின் ஒரு பகுதியாக இருக்கும் அல்லது அதனுடன் தொடர்பில்லாதவையாக இருக்கும்.')
) AS v(ord, en, ta);

-- Survey set 1 #14
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'A 2023 survey found that 47% of women in Indian corporate workplaces have experienced some form of gender-based bias in promotion decisions. The same survey found that companies with more than 30% women in senior leadership outperform peers on profitability by 15%. Your CEO shares both data points in a town hall and says - "diversity is good for business." A colleague whispers to you - "he only cares because of the profitability number."', 'Does that bother you?', '2023-ஆம் ஆண்டு நடத்தப்பட்ட ஒரு கணக்கெடுப்பில், இந்திய பெருநிறுவனப் பணியிடங்களில் உள்ள 47% பெண்கள், பதவி உயர்வு முடிவுகளில் ஏதேனும் ஒரு விதமான பாலின அடிப்படையிலான பாரபட்சத்தை எதிர்கொண்டிருப்பது கண்டறியப்பட்டது. அதே கணக்கெடுப்பில், உயர் தலைமைப் பதவிகளில் 30%-க்கும் அதிகமான பெண்களைக் கொண்ட நிறுவனங்கள், லாபத்தில் தங்கள் சக நிறுவனங்களை விட 15% சிறப்பாகச் செயல்படுவதாகவும் கண்டறியப்பட்டது. உங்கள் தலைமைச் செயல் அதிகாரி (CEO) இந்த இரண்டு தரவுகளையும் ஒரு பொதுக் கூட்டத்தில் பகிர்ந்து, "பல்வகைமை வணிகத்திற்கு நல்லது" என்கிறார். ஒரு சக ஊழியர் உங்களிடம், "அவர் லாபப் புள்ளிவிவரத்திற்காக மட்டுமே கவலைப்படுகிறார்" என்று கிசுகிசுக்கிறார்.', 'அது உங்களுக்குத் தொந்தரவாக இருக்கிறதா?',
     '{"theme": "Gender & Workplace", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Not really. If the outcome is more women in leadership I care less about the CEO''s motivation. Results matter more than intent at the organisational level.', 'உண்மையில் இல்லை. அதன் விளைவாக தலைமைப் பதவிகளில் அதிக பெண்கள் வந்தால், தலைமைச் செயல் அதிகாரியின் நோக்கத்தைப் பற்றி நான் கவலைப்படுவதில்லை. நிறுவன மட்டத்தில் நோக்கத்தை விட முடிவுகளே முக்கியம்.'),
  (2, 'Yes it bothers me. A leader who values diversity only when it is profitable will deprioritise it the moment the business case weakens. The foundation is wrong even if the direction is right.', 'ஆம், அது எனக்கு வருத்தமளிக்கிறது. லாபகரமானதாக இருக்கும்போது மட்டுமே பன்முகத்தன்மையை மதிக்கும் ஒரு தலைவர், அதற்கான வணிக நோக்கம் பலவீனமடையும் தருணத்தில் அதற்கு முக்கியத்துவம் கொடுப்பதை நிறுத்திவிடுவார். திசை சரியாக இருந்தாலும், அடித்தளமே தவறாக இருக்கிறது.'),
  (3, 'It is honest at least. Most DEI initiatives are driven by business case or regulatory pressure. Pretending it is purely values-driven is its own kind of dishonesty.', 'குறைந்தபட்சம் இது நேர்மையானதுதான். பெரும்பாலான பன்முகத்தன்மை, சமத்துவம் மற்றும் உள்ளடக்கம் (DEI) முன்னெடுப்புகள், வணிகத் தேவை அல்லது ஒழுங்குமுறை அழுத்தத்தால் இயக்கப்படுகின்றன. இது முற்றிலும் விழுமியங்களால் உந்தப்பட்டது என்று பாசாங்கு செய்வது, அதுவே ஒரு வகையான நேர்மையின்மையாகும்.'),
  (4, 'The more interesting question is what he will do when diversity costs something - when the most qualified candidate for a tough role is someone who makes the board uncomfortable. That is when the conviction gets tested.', 'பன்முகத்தன்மைக்கு விலை கொடுக்க நேரும்போது - அதாவது, ஒரு கடினமான பதவிக்கு மிகவும் தகுதியான வேட்பாளர், நிர்வாகக் குழுவிற்கே சங்கடத்தை ஏற்படுத்தும் ஒருவராக இருக்கும்போது - அவர் என்ன செய்வார் என்பதுதான் மிகவும் சுவாரஸ்யமான கேள்வி. அப்போதுதான் அவரது உறுதியான நம்பிக்கை சோதிக்கப்படுகிறது.')
) AS v(ord, en, ta);

-- Survey set 1 #15
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'The Supreme Court of India has described the right to a clean environment as a fundamental right derived from Article 21 - the right to life. Yet India ranks 180th out of 180 countries on the Environmental Performance Index. A classmate says - "a right that exists only in courtrooms and not in reality is just decoration."', 'What is your response?', 'இந்திய உச்ச நீதிமன்றம், தூய்மையான சுற்றுச்சூழலுக்கான உரிமையை, சட்டப்பிரிவின் 21-வது பிரிவான வாழ்வதற்கான உரிமையிலிருந்து பெறப்பட்ட ஒரு அடிப்படை உரிமை என்று விவரித்துள்ளது. இருந்தபோதிலும், சுற்றுச்சூழல் செயல்திறன் குறியீட்டில் 180 நாடுகளில் இந்தியா 180-வது இடத்தில் உள்ளது. ஒரு வகுப்புத் தோழன் கூறுகிறான் - "நீதிமன்றங்களில் மட்டுமே இருந்து, உண்மையில் இல்லாத ஒரு உரிமை என்பது வெறும் அலங்காரம்தான்."', 'உங்கள் பதில் என்ன?',
     '{"theme": "Awareness - Law & Citizens", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'He is right about the gap - but wrong to dismiss it. Constitutional rights create the legal basis for citizens to challenge violations. Without Article 21 there would be no ground to stand on at all.', 'அந்த இடைவெளி குறித்து அவர் சொல்வது சரிதான் - ஆனால் அதை நிராகரிப்பது தவறு. அரசியலமைப்பு உரிமைகள், மீறல்களை எதிர்த்து குடிமக்கள் குரல் எழுப்புவதற்கான சட்ட அடிப்படையை உருவாக்குகின்றன. சட்டப்பிரிவு 21 இல்லையென்றால், குரல் எழுப்புவதற்கு எந்த அடிப்படையும் இருக்காது.'),
  (2, 'The ranking reflects decades of industrialisation under weak enforcement - not the absence of rights. The solution is enforcement capacity and political will not more law.', 'இந்தத் தரவரிசையானது, உரிமைகள் இல்லாததைக் காட்டிலும், பலவீனமான அமலாக்கத்தின் கீழ் நடைபெற்ற பல தசாப்த கால தொழில்மயமாக்கலையே பிரதிபலிக்கிறது. இதற்கான தீர்வு என்பது அமலாக்கத் திறனும் அரசியல் உறுதியும்தான், மேலும் சட்டங்கள் அல்ல.'),
  (3, 'The gap between constitutional promise and lived reality is India''s defining governance challenge. It applies to environment, education, health - everywhere. The right is real. The delivery system is broken.', 'அரசியலமைப்பு வாக்குறுதிக்கும் நடைமுறை யதார்த்தத்திற்கும் இடையிலான இடைவெளியே இந்தியாவின் வரையறுக்கும் ஆளுகைச் சவாலாகும். இது சுற்றுச்சூழல், கல்வி, சுகாதாரம் என எல்லாத் துறைகளுக்கும் பொருந்தும். உரிமை உண்மையானது. ஆனால், அதை வழங்கும் அமைப்பு சீர்குலைந்துள்ளது.'),
  (4, 'The EPI ranking methodology itself is worth questioning. It measures outcomes against global benchmarks that do not account for where India started, what it has had to grow through, and how fast it has moved in the last 20 years.', 'EPI தரவரிசைப்படுத்தும் முறையே கேள்விக்குள்ளாக்கத்தக்கது. அது, இந்தியா எங்கிருந்து தொடங்கியது, எத்தகைய சூழல்களிலிருந்து வளர்ந்து வந்தது, மற்றும் கடந்த 20 ஆண்டுகளில் எவ்வளவு வேகமாக முன்னேறியுள்ளது என்பனவற்றைக் கணக்கில் கொள்ளாமல், உலகளாவிய அளவுகோல்களின் அடிப்படையில் விளைவுகளை அளவிடுகிறது.')
) AS v(ord, en, ta);

-- Survey set 1 #16
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'Your company wins a large government contract. A junior employee quietly tells you that the bid was successful partly because a competitor''s internal pricing was leaked to your team before submission. You were not involved. The contract is already signed.', 'What do you do?', 'உங்கள் நிறுவனம் ஒரு பெரிய அரசாங்க ஒப்பந்தத்தை வெல்கிறது. ஏலம் சமர்ப்பிக்கப்படுவதற்கு முன்பு, போட்டியாளரின் உள் விலை விவரங்கள் உங்கள் குழுவிற்கு கசிந்ததே அந்த ஒப்பந்தம் வெற்றிபெற ஒரு பகுதி காரணம் என்று ஒரு இளநிலை ஊழியர் உங்களிடம் ரகசியமாகக் கூறுகிறார். இதில் உங்களுக்கு எந்த சம்பந்தமும் இல்லை. ஒப்பந்தம் ஏற்கனவே கையெழுத்திடப்பட்டுவிட்டது.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Business Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Report it internally immediately regardless of the contract status. If this surfaces later and I knew - I am complicit. The contract may need to be returned.', 'ஒப்பந்தத்தின் நிலையைப் பொருட்படுத்தாமல், இதை உடனடியாக நிறுவனத்திற்குள் புகாரளிக்கவும். இது பின்னர் வெளிவந்து, எனக்கு இது தெரிந்திருந்தால் - நானும் உடந்தையாகிவிடுவேன். ஒப்பந்தத்தைத் திருப்பிக் கொடுக்க வேண்டியிருக்கலாம்.'),
  (2, 'Investigate first before doing anything irreversible. One employee''s account is not enough to hand back a signed contract and damage the company.', 'மீள முடியாத எதையும் செய்வதற்கு முன் முதலில் விசாரணை செய்யுங்கள். கையொப்பமிடப்பட்ட ஒப்பந்தத்தைத் திருப்பிக் கொடுப்பதற்கும் நிறுவனத்திற்குச் சேதம் விளைவிப்பதற்கும் ஒரே ஒரு ஊழியரின் வாக்குமூலம் மட்டும் போதாது.'),
  (3, 'Speak to the CEO directly and privately. This decision is above my level - but making sure leadership knows is my responsibility.', 'தலைமை நிர்வாக அதிகாரியிடம் நேரடியாகவும் தனிப்பட்ட முறையிலும் பேசுங்கள். இந்த முடிவு என் அதிகார வரம்பிற்கு அப்பாற்பட்டது - ஆனால் தலைமைக்கு இது தெரியவருவதை உறுதி செய்வது என் பொறுப்பு.'),
  (4, 'Document everything I know today with timestamps. Whatever decision gets made - I want a record that I flagged this and when.', 'இன்று எனக்குத் தெரிந்த அனைத்தையும் நேரக்குறிப்புகளுடன் ஆவணப்படுத்த வேண்டும். என்ன முடிவு எடுக்கப்பட்டாலும், நான் இதை எப்போது சுட்டிக்காட்டினேன் என்பதற்கு ஒரு பதிவு எனக்கு வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 1 #17
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'A study found that 68% of MBA graduates from top Indian schools join financial services, consulting, or technology within one year of graduation. Less than 4% join social sector organisations, government, or rural enterprise. Your professor asks - is this a problem?', 'What do you say?', 'இந்தியாவின் முன்னணி கல்வி நிறுவனங்களில் இருந்து MBA பட்டம் பெற்றவர்களில் 68% பேர், பட்டம் பெற்ற ஓராண்டுக்குள் நிதிச் சேவைகள், ஆலோசனை அல்லது தொழில்நுட்பத் துறைகளில் சேர்கின்றனர் என்று ஓர் ஆய்வு கண்டறிந்துள்ளது. 4%க்கும் குறைவானவர்களே சமூகத் துறை நிறுவனங்கள், அரசு அல்லது கிராமப்புறத் தொழில் நிறுவனங்களில் சேர்கின்றனர். இது ஒரு பிரச்சனையா என்று உங்கள் பேராசிரியர் கேட்கிறார்.', 'நீங்கள் என்ன சொல்கிறீர்கள்?',
     '{"theme": "Social Responsibility", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It is a market outcome not a moral failure. People optimise for salary, growth, and security. Blaming individuals for responding rationally to incentives misses the point.', 'இது ஒரு சந்தை விளைவு, தார்மீகத் தோல்வி அல்ல. மக்கள் சம்பளம், வளர்ச்சி மற்றும் பாதுகாப்பிற்காகவே தங்களை உகந்ததாக்கிக் கொள்கிறார்கள். ஊக்கத்தொகைகளுக்குப் பகுத்தறிவுடன் பதிலளிக்கும் தனிநபர்களைக் குறை கூறுவது, விஷயத்தின் சாராம்சத்தைத் தவறவிடுவதாகும்.'),
  (2, 'It is a problem - but the solution is making social sector careers more competitive financially. The values are there. The compensation is not.', 'இது ஒரு பிரச்சினைதான் - ஆனால், சமூகத் துறைப் பணிகளை நிதி ரீதியாக மேலும் போட்டித்தன்மை வாய்ந்ததாக மாற்றுவதே அதற்கான தீர்வு. மதிப்புகள் இருக்கின்றன. ஆனால், அதற்கான ஊதியம் இல்லை.'),
  (3, 'It reflects what business schools select for and signal during two years of education. If we want different outcomes we need different curricula, different guest speakers, different case studies.', 'வணிகப் பள்ளிகள் தங்களின் இரண்டு வருடக் கல்வியின் போது எதைத் தேர்ந்தெடுத்து, எதைச் சுட்டிக்காட்டுகின்றனவோ, அதையே இது பிரதிபலிக்கிறது. நாம் வேறுபட்ட விளைவுகளை விரும்பினால், நமக்கு வேறுபட்ட பாடத்திட்டங்கள், வேறுபட்ட சிறப்புப் பேச்சாளர்கள், வேறுபட்ட நிகழ்வு ஆய்வுகள் தேவை.'),
  (4, 'Four percent going into social impact is actually significant if they go in with genuine capability. Ten high-quality leaders in the right organisations can move more than a hundred mediocre ones.', 'உண்மையான திறமையுடன் சமூக தாக்கத் துறையில் ஈடுபடும் நான்கு சதவீதம் என்பது உண்மையில் குறிப்பிடத்தக்கதாகும். சரியான நிறுவனங்களில் உள்ள பத்து உயர்தரத் தலைவர்களால், நூறு சாதாரணத் தலைவர்களை விடப் பெரிய மாற்றத்தை ஏற்படுத்த முடியும்.')
) AS v(ord, en, ta);

-- Survey set 1 #18
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'India''s Comptroller and Auditor General - the CAG - regularly publishes reports exposing government wastage, ghost beneficiaries, and unspent allocations running into thousands of crores. Most reports disappear after a news cycle. A retired IAS officer tells your batch - "accountability without consequence is just paperwork."', 'Do you agree?', 'இந்தியாவின் தலைமை கணக்குத் தணிக்கையாளர் (CAG) அரசு விரயங்கள், போலிப் பயனாளிகள் மற்றும் ஆயிரக்கணக்கான கோடி ரூபாய் மதிப்பிலான செலவிடப்படாத நிதி ஒதுக்கீடுகளை அம்பலப்படுத்தும் அறிக்கைகளைத் தவறாமல் வெளியிடுகிறார். பெரும்பாலான அறிக்கைகள் ஒரு செய்திச் சுழற்சிக்குப் பிறகு மறைந்துவிடுகின்றன. ஓய்வுபெற்ற ஐஏஎஸ் அதிகாரி ஒருவர் உங்கள் குழுவிடம் கூறுகிறார் - "விளைவுகள் இல்லாத பொறுப்புக்கூறல் என்பது வெறும் காகித வேலைதான்."', 'நீங்கள் ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Governance & Accountability", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Completely. The CAG is one of India''s strongest institutions producing some of its most rigorous analysis - and almost nothing changes because no enforcement follows. The diagnosis is excellent. The treatment never arrives.', 'முற்றிலும். சிஏஜி இந்தியாவின் மிக வலிமையான நிறுவனங்களில் ஒன்றாகும்; அது மிகவும் கடுமையான சில பகுப்பாய்வுகளை மேற்கொள்கிறது - ஆனால், அமலாக்கம் எதுவும் இல்லாததால் கிட்டத்தட்ட எதுவும் மாறுவதில்லை. நோய் கண்டறிதல் மிகச் சிறந்தது. ஆனால், சிகிச்சை ஒருபோதும் கிடைப்பதில்லை.'),
  (2, 'Partially. CAG reports do produce consequences - through public pressure, opposition scrutiny, and occasionally judicial action. The cycle is slow but not completely broken.', 'ஓரளவிற்கு. CAG அறிக்கைகள், பொதுமக்களின் அழுத்தம், எதிர்க்கட்சிகளின் ஆய்வு, மற்றும் அவ்வப்போது நீதித்துறை நடவடிக்கை ஆகியவற்றின் மூலம் விளைவுகளை ஏற்படுத்துகின்றன. இந்தச் சுழற்சி மெதுவாக இருந்தாலும், அது முழுமையாக முறிந்துவிடவில்லை.'),
  (3, 'The problem is not the CAG - it is Parliament''s ability and willingness to act on what the CAG finds. Strengthen parliamentary oversight and the CAG becomes genuinely powerful.', 'பிரச்சனை தலைமை கணக்குத் தணிக்கையாளர் அல்ல; அவர் கண்டறியும் விஷயங்களின் மீது நடவடிக்கை எடுப்பதில் நாடாளுமன்றத்தின் திறனும் விருப்பமுமே பிரச்சனை. நாடாளுமன்றக் கண்காணிப்பை வலுப்படுத்தினால், தலைமை கணக்குத் தணிக்கையாளர் உண்மையாகவே சக்திவாய்ந்தவராக மாறுவார்.'),
  (4, 'Accountability systems work when those in power want them to work. No institution - however well designed - functions against the active resistance of the people it is meant to check.', 'அதிகாரத்தில் இருப்பவர்கள் விரும்பும்போதுதான் பொறுப்புக்கூறல் அமைப்புகள் செயல்படுகின்றன. எவ்வளவு சிறப்பாக வடிவமைக்கப்பட்டிருந்தாலும், எந்தவொரு நிறுவனமும் அது கட்டுப்படுத்த வேண்டிய மக்களின் தீவிர எதிர்ப்புக்கு எதிராகச் செயல்படுவதில்லை.')
) AS v(ord, en, ta);

-- Survey set 1 #19
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'The World Economic Forum estimates that 65% of children entering primary school today will work in jobs that do not yet exist. Automation is expected to displace 85 million jobs globally by 2025 and create 97 million new ones - but the displaced and the newly employed are not the same people.', 'As an MBA student about to enter the workforce - what does this mean for how you lead?', 'இன்று தொடக்கப் பள்ளியில் சேரும் குழந்தைகளில் 65% பேர், இன்னும் உருவாகாத வேலைகளில் பணியாற்றுவார்கள் என்று உலகப் பொருளாதார மன்றம் மதிப்பிடுகிறது. 2025-ஆம் ஆண்டுக்குள் தானியக்கமயமாக்கல் உலகளவில் 85 மில்லியன் வேலைகளைப் பறித்து, 97 மில்லியன் புதிய வேலைகளை உருவாக்கும் என்று எதிர்பார்க்கப்படுகிறது - ஆனால், வேலையிழந்தவர்களும் புதிதாக வேலை பெற்றவர்களும் ஒரே நபர்கள் அல்ல.', 'பணியில் சேரவிருக்கும் ஒரு MBA மாணவராக, இது நீங்கள் தலைமை தாங்கும் விதத்தில் என்ன தாக்கத்தை ஏற்படுத்தும்?',
     '{"theme": "Future of Work", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means the most important thing I can build in any team is learning agility - not current skill sets. The half-life of any specific skill is shrinking. Curiosity is the only durable asset.', 'இதன் பொருள், எந்தவொரு அணியிலும் நான் உருவாக்கக்கூடிய மிக முக்கியமான விஷயம், தற்போதைய திறன்களை வளர்ப்பது அல்ல, மாறாக சுறுசுறுப்பைக் கற்றுக்கொள்வதுதான். எந்தவொரு குறிப்பிட்ட திறனின் ஆயுட்காலமும் குறைந்து வருகிறது. ஆர்வம் மட்டுமே நீடித்து நிலைக்கும் ஒரே சொத்து.'),
  (2, 'It means I have a responsibility to the people I will manage who are most vulnerable to displacement - and that responsibility starts in how I design roles, not just in how I respond to automation when it arrives.', 'இதன் பொருள், நான் நிர்வகிக்கப் போகும், வேலையிழப்பால் மிகவும் பாதிக்கப்படக்கூடிய மக்களுக்கு நான் பொறுப்புள்ளவன் என்பதாகும் - மேலும் அந்தப் பொறுப்பு, தானியக்கம் வரும்போது நான் அதற்கு எவ்வாறு பதிலளிக்கிறேன் என்பதில் மட்டுமல்ல, நான் பணிகளை எவ்வாறு வடிவமைக்கிறேன் என்பதிலேயே தொடங்குகிறது.'),
  (3, 'It means the organisations that will win are the ones that treat reskilling as a core business function - not an HR afterthought. I want to lead organisations that take that seriously.', 'இதன் பொருள், மறுதிறன் மேம்பாட்டை ஒரு முக்கிய வணிகச் செயல்பாடாகக் கருதும் நிறுவனங்களே வெற்றி பெறும்; மனிதவளத் துறையை ஒரு இரண்டாம் பட்ச விஷயமாகக் கருதாது. இதைத் தீவிரமாக எடுத்துக்கொள்ளும் நிறுவனங்களை நான் வழிநடத்த விரும்புகிறேன்.'),
  (4, 'It means the social contract between employer and employee needs to be rewritten. Loyalty in exchange for security no longer works when the ground shifts every five years. Leaders who pretend otherwise will lose their best people.', 'இதன் பொருள், முதலாளிக்கும் தொழிலாளிக்கும் இடையிலான சமூக ஒப்பந்தம் திருத்தி எழுதப்பட வேண்டும் என்பதாகும். ஒவ்வொரு ஐந்தாண்டுக்கும் நிலைமை மாறும்போது, ​​பாதுகாப்பிற்கு ஈடாகக் கிடைக்கும் விசுவாசம் இனி எடுபடாது. இதற்கு மாறாகப் பாசாங்கு செய்யும் தலைவர்கள் தங்களின் சிறந்த பணியாளர்களை இழப்பார்கள்.')
) AS v(ord, en, ta);

-- Survey set 1 #20
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 1,
     'You are in the final week of your MBA. A professor asks one last question - "Tamil Nadu produces 100,000 engineering graduates a year. Less than 30% find employment matching their qualification. India produces 1,500 MBA graduates from top schools annually who will earn in their first year what most of those engineers will earn in five. You are in that 1,500."', 'What do you owe?', 'நீங்கள் உங்கள் MBA படிப்பின் இறுதி வாரத்தில் இருக்கிறீர்கள். ஒரு பேராசிரியர் உங்களிடம் ஒரு கடைசி கேள்வியைக் கேட்கிறார் - "தமிழ்நாடு ஆண்டுக்கு 100,000 பொறியியல் பட்டதாரிகளை உருவாக்குகிறது. அவர்களில் 30%க்கும் குறைவானவர்களே தங்கள் தகுதிக்கு ஏற்ற வேலையைப் பெறுகிறார்கள். இந்தியா, சிறந்த கல்வி நிறுவனங்களிலிருந்து ஆண்டுதோறும் 1,500 MBA பட்டதாரிகளை உருவாக்குகிறது. அந்தப் பொறியாளர்களில் பெரும்பாலானோர் ஐந்து ஆண்டுகளில் சம்பாதிக்கும் தொகையை, இவர்கள் தங்கள் முதல் ஆண்டிலேயே சம்பாதித்துவிடுவார்கள். அந்த 1,500 பேரில் நீங்களும் ஒருவர்."', 'நீங்கள் என்ன கடன்பட்டிருக்கிறீர்கள்?',
     '{"theme": "The MBA & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'I owe competence. The best thing I can do for society is build organisations that actually work - create real employment, pay real taxes, solve real problems. That is enough.', 'நான் திறமைக்குக் கடமைப்பட்டிருக்கிறேன். சமுதாயத்திற்கு நான் செய்யக்கூடிய மிகச் சிறந்த விஷயம், உண்மையில் செயல்படும் அமைப்புகளைக் கட்டமைப்பதுதான் - உண்மையான வேலைவாய்ப்புகளை உருவாக்குவது, உண்மையான வரிகளைச் செலுத்துவது, உண்மையான பிரச்சனைகளைத் தீர்ப்பது. அதுவே போதுமானது.'),
  (2, 'I owe more than competence. The access I have had - the network, the credential, the salary - came partly from a system that excluded most people. That creates an obligation beyond doing my job well.', 'நான் வெறும் திறமைக்கு அப்பாற்பட்ட ஒரு கடமையைக் கொண்டிருக்கிறேன். எனக்குக் கிடைத்திருந்த தொடர்புகள், தகுதிகள், சம்பளம் போன்றவை, பெரும்பாலான மக்களை ஒதுக்கிய ஒரு அமைப்பிலிருந்து ஓரளவிற்கு வந்தன. அது, என் வேலையைச் சிறப்பாகச் செய்வதையும் தாண்டிய ஒரு கடமையை உருவாக்குகிறது.'),
  (3, 'I owe honesty about what I do not yet know. I am leaving with better questions than answers. Staying genuinely curious about the world beyond my immediate career is the most I can honestly commit to right now.', 'எனக்கு இன்னும் தெரியாத விஷயங்களைப் பற்றி நான் நேர்மையாக இருக்கக் கடமைப்பட்டுள்ளேன். பதில்களை விட சிறந்த கேள்விகளுடன் நான் விடைபெறுகிறேன். எனது உடனடிப் பணிக்கு அப்பாற்பட்ட உலகத்தைப் பற்றி உண்மையான ஆர்வத்துடன் இருப்பதுதான், இந்த நேரத்தில் என்னால் நேர்மையாக உறுதியளிக்கக்கூடிய மிக உயர்ந்த விஷயம்.'),
  (4, 'I will answer that question in ten years. What I can say today is that it will stay with me - and that might be the most important thing this MBA gave me.', 'நான் அந்தக் கேள்விக்கு பத்து வருடங்களில் பதிலளிப்பேன். இன்று என்னால் சொல்ல முடிவது என்னவென்றால், அது என்னுடன் நிலைத்திருக்கும் - ஒருவேளை இந்த MBA எனக்கு அளித்த மிக முக்கியமான விஷயம் அதுவாகத்தான் இருக்கக்கூடும்.')
) AS v(ord, en, ta);

-- Survey set 2 #21
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India has 28 states and 8 Union Territories. A Union Territory is administered directly by the Centre through a Lieutenant Governor - not an elected Chief Minister. Delhi has both an elected CM and an LG and they have been in open conflict for years over who controls what. A classmate says "this dual authority structure is deliberately designed to keep states weak."', 'What is your view?', 'இந்தியாவில் 28 மாநிலங்களும் 8 யூனியன் பிரதேசங்களும் உள்ளன. ஒரு யூனியன் பிரதேசம், தேர்ந்தெடுக்கப்பட்ட முதலமைச்சரால் அல்லாமல், ஒரு துணைநிலை ஆளுநர் மூலம் மத்திய அரசால் நேரடியாக நிர்வகிக்கப்படுகிறது. டெல்லியில் தேர்ந்தெடுக்கப்பட்ட முதலமைச்சரும் ஒரு துணைநிலை ஆளுநரும் உள்ளனர், மேலும் எதை யார் கட்டுப்படுத்துவது என்பது குறித்து அவர்களுக்குள் பல ஆண்டுகளாக வெளிப்படையான மோதல் இருந்து வருகிறது. "இந்த இரட்டை அதிகார அமைப்பு, மாநிலங்களைப் பலவீனமாக வைத்திருப்பதற்காகவே வேண்டுமென்றே வடிவமைக்கப்பட்டுள்ளது" என்று ஒரு வகுப்புத் தோழன் கூறுகிறான்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Political Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'He is right. Union Territories exist partly to keep strategically important regions under Central control. Delhi''s conflict is not a bug - it is the design working as intended.', 'அவர் சொல்வது சரிதான். மூலோபாய முக்கியத்துவம் வாய்ந்த பகுதிகளை மத்திய அரசின் கட்டுப்பாட்டில் வைத்திருப்பதற்காகவே யூனியன் பிரதேசங்கள் ஓரளவு உருவாக்கப்பட்டுள்ளன. டெல்லியின் மோதல் ஒரு குறைபாடு அல்ல - அது திட்டமிட்டபடியே செயல்படும் ஒரு வடிவமைப்பு.'),
  (2, 'The design made sense at independence for administrative reasons. The problem is it has not been updated for a democratic era where citizens of UTs expect the same self-governance as state residents.', 'நிர்வாகக் காரணங்களுக்காக, சுதந்திரத்தின் போது அந்த வடிவமைப்பு பொருத்தமானதாக இருந்தது. ஆனால், மாநிலக் குடிமக்களைப் போலவே யூனியன் பிரதேசக் குடிமக்களும் அதே தன்னாட்சியை எதிர்பார்க்கும் ஜனநாயகக் காலத்திற்கு ஏற்றவாறு அது புதுப்பிக்கப்படவில்லை என்பதே சிக்கலாகும்.'),
  (3, 'The conflict in Delhi is a political conflict dressed as a constitutional one. When both sides want to cooperate the structure works fine. The problem is people not architecture.', 'டெல்லியில் நடக்கும் மோதல் என்பது, அரசியலமைப்புச் சட்டப் பிரச்சினை போல் வேடமிட்ட ஒரு அரசியல் மோதல் ஆகும். இரு தரப்பினரும் ஒத்துழைக்க விரும்பும்போது, ​​கட்டமைப்பு நன்றாகச் செயல்படுகிறது. பிரச்சினை மக்களிடம்தான் உள்ளது, கட்டிடக்கலையில் அல்ல.'),
  (4, 'Any federal system has tensions between Centre and regions. India''s version is messier than most but the solution is clearer constitutional demarcation - not restructuring the whole system.', 'எந்தவொரு கூட்டாட்சி அமைப்பிலும் மத்திய அரசுக்கும் பிராந்தியங்களுக்கும் இடையே பதற்றங்கள் நிலவுகின்றன. இந்தியாவின் அமைப்பு பெரும்பாலானவற்றை விட மிகவும் குழப்பமானது, ஆனால் அதற்கான தீர்வு முழு அமைப்பையும் மறுசீரமைப்பதல்ல, மாறாக தெளிவான அரசியலமைப்பு ரீதியான வரையறையே ஆகும்.')
) AS v(ord, en, ta);

-- Survey set 2 #22
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India''s GDP is approximately $3.5 trillion making it the fifth largest economy in the world. Yet its per capita income is around $2,500 - placing it 140th globally. A visiting economist tells your batch - "India is a rich country full of poor people."', 'What does that mean to you as a future business leader?', 'இந்தியாவின் மொத்த உள்நாட்டு உற்பத்தி சுமார் 3.5 டிரில்லியன் டாலராக உள்ளது, இது அதனை உலகின் ஐந்தாவது பெரிய பொருளாதாரமாகத் திகழ்கிறது. இருப்பினும், அதன் தனிநபர் வருமானம் சுமார் 2,500 டாலராக இருப்பதால், உலக அளவில் 140-வது இடத்தில் உள்ளது. வருகை தந்த ஒரு பொருளாதார நிபுணர் உங்கள் குழுவிடம், "இந்தியா ஏழை மக்கள் நிறைந்த ஒரு பணக்கார நாடு" என்று கூறுகிறார்.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், இதற்கு உங்களுக்கு என்ன அர்த்தம்?',
     '{"theme": "Economic Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means the aggregate numbers that make investors excited about India mask a distribution problem that should make business leaders uncomfortable.', 'இதன் பொருள் என்னவென்றால், இந்தியா மீது முதலீட்டாளர்களை உற்சாகப்படுத்தும் ஒட்டுமொத்த புள்ளிவிவரங்கள், வணிகத் தலைவர்களுக்கு அசௌகரியத்தை ஏற்படுத்தக்கூடிய ஒரு விநியோகப் பிரச்சனையை மறைக்கின்றன.'),
  (2, 'It means the domestic market is simultaneously enormous and severely underpenetrated. The opportunity and the inequality are the same fact viewed from different angles.', 'இதன் பொருள், உள்நாட்டுச் சந்தை ஒரே நேரத்தில் மிகப்பெரியதாகவும், அதே சமயம் மிகக் கடுமையாக ஊடுருவப்படாததாகவும் உள்ளது. வாய்ப்பும் சமத்துவமின்மையும் வெவ்வேறு கோணங்களில் பார்க்கப்படும் ஒரே உண்மையாகும்.'),
  (3, 'It means GDP is the wrong metric to lead with. A country''s development should be measured by median income, life expectancy, and educational attainment - not aggregate output.', 'இதன் பொருள், மொத்த உள்நாட்டு உற்பத்தி (GDP) என்பது முதன்மை அளவுகோலாகப் பயன்படுத்த வேண்டிய தவறான அளவுகோலாகும். ஒரு நாட்டின் வளர்ச்சியை அதன் ஒட்டுமொத்த உற்பத்தியைக் கொண்டு அல்ல, மாறாக சராசரி வருமானம், ஆயுட்காலம் மற்றும் கல்வித் தகுதி ஆகியவற்றைக் கொண்டே அளவிட வேண்டும்.'),
  (4, 'It means the businesses that will matter most in the next 20 years are the ones that figure out how to profitably serve people earning ₹15,000–₹30,000 a month - not the ones chasing the top 10%.', 'இதன் பொருள், அடுத்த 20 ஆண்டுகளில் மிகவும் முக்கியத்துவம் வாய்ந்த வணிகங்கள் என்பவை, மேல்தட்டு 10% பேரைத் துரத்துபவை அல்ல; மாறாக, மாதம் ₹15,000 முதல் ₹30,000 வரை சம்பாதிக்கும் மக்களுக்கு லாபகரமாக சேவை செய்வது எப்படி என்பதைக் கண்டறிபவையே ஆகும்.')
) AS v(ord, en, ta);

-- Survey set 2 #23
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India''s Election Commission is a constitutional body that conducts elections for 950 million registered voters across 28 states. It operates with a staff of roughly 300 permanent employees at the centre - relying on state machinery and temporary staff during elections. A professor says "the Election Commission is one of India''s most underrated institutions."', 'Do you agree?', 'இந்தியத் தேர்தல் ஆணையம் என்பது, 28 மாநிலங்களில் உள்ள 95 கோடி பதிவு செய்யப்பட்ட வாக்காளர்களுக்குத் தேர்தல்களை நடத்தும் ஒரு அரசியலமைப்பு அமைப்பாகும். இது மையத்தில் சுமார் 300 நிரந்தரப் பணியாளர்களுடன் இயங்குகிறது; தேர்தல்களின் போது மாநில அரசு அமைப்புகளையும் தற்காலிகப் பணியாளர்களையும் சார்ந்துள்ளது. "தேர்தல் ஆணையம் இந்தியாவின் மிகவும் குறைத்து மதிப்பிடப்பட்ட நிறுவனங்களில் ஒன்றாகும்" என்று ஒரு பேராசிரியர் கூறுகிறார்.', 'நீங்கள் ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Governance Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - conducting free and fair elections at this scale with this infrastructure is a genuine administrative achievement that gets taken for granted because it mostly works.', 'ஆம் - இந்த உள்கட்டமைப்புடன் இந்த அளவில் சுதந்திரமான மற்றும் நியாயமான தேர்தல்களை நடத்துவது ஒரு உண்மையான நிர்வாகச் சாதனையாகும், ஆனால் அது பெரும்பாலும் செயல்படுவதால் சாதாரணமாக எடுத்துக்கொள்ளப்படுகிறது.'),
  (2, 'Partially - the EC is strong on logistics but its enforcement of campaign finance rules and model code violations is inconsistent. Structural strength and enforcement strength are different things.', 'ஓரளவிற்கு - தேர்தல் ஆணையம் செயல்பாட்டு ஏற்பாடுகளில் வலுவாக உள்ளது, ஆனால் தேர்தல் நிதி விதிகள் மற்றும் மாதிரி நடத்தை விதிமீறல்களை அமல்படுத்துவதில் அது சீரற்றதாக இருக்கிறது. கட்டமைப்பு வலிமையும் அமலாக்க வலிமையும் வெவ்வேறானவை.'),
  (3, 'Its credibility depends entirely on the independence of the people who lead it. The institution is only as strong as the individuals appointed to run it - and that appointment process has been questioned recently.', 'அதன் நம்பகத்தன்மை, அதை வழிநடத்தும் நபர்களின் சுதந்திரத்தை முழுமையாகச் சார்ந்துள்ளது. ஒரு நிறுவனத்தின் வலிமை என்பது, அதை நிர்வகிக்க நியமிக்கப்படும் தனிநபர்களின் வலிமையைப் பொறுத்தே அமைகிறது - மேலும் அந்த நியமனச் செயல்முறை சமீபத்தில் கேள்விக்குள்ளாக்கப்பட்டுள்ளது.'),
  (4, 'Any institution that has peacefully transferred power through 17 general elections in the world''s most complex democracy deserves enormous respect regardless of its imperfections.', 'உலகின் மிகவும் சிக்கலான ஜனநாயகத்தில், 17 பொதுத் தேர்தல்கள் மூலம் அமைதியான முறையில் அதிகாரத்தை மாற்றிய எந்தவொரு நிறுவனமும், அதன் குறைபாடுகளைப் பொருட்படுத்தாமல் அளவற்ற மரியாதைக்கு உரியது.')
) AS v(ord, en, ta);

-- Survey set 2 #24
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India has the largest youth population in the world - 600 million people under 25. Tamil Nadu alone has a literacy rate above 82% and one of the country''s highest female literacy rates. Yet graduate unemployment in Tamil Nadu runs at nearly 30% for engineering graduates. A batchmate says "we are over-educating people for an economy that cannot absorb them."', 'Is he right?', 'உலகிலேயே அதிக இளைஞர் மக்கள்தொகையைக் கொண்ட நாடு இந்தியா - 25 வயதுக்குட்பட்ட 60 கோடி மக்கள். தமிழ்நாட்டில் மட்டும் 82%க்கும் அதிகமான எழுத்தறிவு விகிதமும், நாட்டிலேயே மிக உயர்ந்த பெண் எழுத்தறிவு விகிதங்களில் ஒன்றும் உள்ளது. இருந்தபோதிலும், தமிழ்நாட்டில் பொறியியல் பட்டதாரிகளிடையே வேலையின்மை கிட்டத்தட்ட 30% ஆக உள்ளது. ஒரு சக மாணவர் கூறுகிறார், "இவர்களை உள்வாங்க முடியாத ஒரு பொருளாதாரத்திற்காக, நாங்கள் மக்களுக்குத் தேவைக்கு அதிகமாகக் கல்வி அளிக்கிறோம்."', 'அவர் சொல்வது சரியா?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Partially - the mismatch is real but the solution is not less education. It is education that builds employable skills rather than credentials that signal nothing to employers.', 'ஓரளவிற்கு - இந்தப் பொருத்தமின்மை உண்மையானதுதான், ஆனால் அதற்கான தீர்வு கல்வியைக் குறைப்பது அல்ல. அது, வேலையளிப்பவர்களுக்கு எந்த மதிப்பையும் தராத சான்றிதழ்களை உருவாக்குவதை விடுத்து, வேலைவாய்ப்பைப் பெற்றுத்தரும் திறன்களை வளர்க்கும் கல்வியே ஆகும்.'),
  (2, 'He has the causality backwards. The economy is under-creating jobs - not over-creating graduates. The problem is on the demand side not the supply side.', 'அவர் காரண காரியத் தொடர்பைத் தலைகீழாகப் புரிந்துகொண்டுள்ளார். பொருளாதாரம் பட்டதாரிகளை அதிகமாக உருவாக்கவில்லை, மாறாக வேலைவாய்ப்புகளைக் குறைவாகவே உருவாக்குகிறது. பிரச்சினை தேவைப் பக்கத்தில்தான் உள்ளது, அளிப்புப் பக்கத்தில் அல்ல.'),
  (3, 'He is right and it is a political problem. Governments build colleges because it is visible and popular. Building the industry that would absorb those graduates is harder and slower.', 'அவர் சொல்வது சரிதான், இது ஒரு அரசியல் பிரச்சினை. கல்லூரிகள் வெளிப்படையாகத் தெரிவதாலும், அவை மக்களிடையே பிரபலமாக இருப்பதாலும் அரசாங்கங்கள் கல்லூரிகளைக் கட்டுகின்றன. ஆனால், அந்தப் பட்டதாரிகளை உள்வாங்கிக்கொள்ளும் தொழில்துறையை உருவாக்குவது கடினமானதும், மெதுவாக நடக்கக்கூடியதும் ஆகும்.'),
  (4, 'The 30% unemployment figure hides a quality distribution. The top quartile of graduates have no unemployment problem. The bottom three quartiles are the crisis - and they are not the same conversation.', '30% வேலையின்மை என்ற புள்ளிவிவரம், ஒரு தரமான பரவலை மறைக்கிறது. பட்டதாரிகளில் முதல் கால் பகுதிக்கு வேலையின்மைப் பிரச்சினை இல்லை. கடைசி மூன்று கால் பகுதிகள்தான் நெருக்கடியில் உள்ளன - மேலும் அவை ஒரே மாதிரியான உரையாடல்கள் அல்ல.')
) AS v(ord, en, ta);

-- Survey set 2 #25
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'MGR served as Chief Minister of Tamil Nadu from 1977 to 1987. He introduced the midday meal scheme, significantly expanded female literacy, and built a welfare infrastructure that outlasted him by decades. He also ran an autocratic government with little tolerance for dissent and concentrated power around his persona.', 'A leadership professor asks - can we separate the outcomes from the methods?', 'எம்.ஜி.ஆர் 1977 முதல் 1987 வரை தமிழக முதலமைச்சராகப் பணியாற்றினார். அவர் மதிய உணவுத் திட்டத்தை அறிமுகப்படுத்தினார், பெண் எழுத்தறிவை கணிசமாக விரிவுபடுத்தினார், மேலும் தனக்குப் பல பத்தாண்டுகள் கழித்தும் நீடித்த ஒரு நல உள்கட்டமைப்பை உருவாக்கினார். அதே சமயம், அவர் மாறுபட்ட கருத்துக்களைச் சகித்துக்கொள்ளாத ஒரு சர்வாதிகார அரசாங்கத்தை நடத்தி, அதிகாரத்தைத் தன் ஆளுமையைச் சுற்றி குவித்தார்.', 'தலைமைத்துவப் பேராசிரியர் ஒருவர் கேட்கிறார் - செயல்முறைகளிலிருந்து விளைவுகளை நம்மால் பிரிக்க முடியுமா?',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'In leadership we must separate them - not to excuse the methods but to understand them. Dismissing his outcomes because of his style loses the lesson. Celebrating his outcomes without examining his style loses a different lesson.', 'தலைமைத்துவத்தில் நாம் அவற்றை வேறுபடுத்திப் பார்க்க வேண்டும் - அது வழிமுறைகளை நியாயப்படுத்துவதற்காக அல்ல, மாறாக அவற்றைப் புரிந்துகொள்வதற்காகவே. அவருடைய பாணியின் காரணமாக அதன் விளைவுகளை நிராகரிப்பது, நாம் கற்றுக்கொள்ள வேண்டிய பாடத்தை இழக்கச் செய்கிறது. அவருடைய பாணியை ஆராயாமல் அதன் விளைவுகளைக் கொண்டாடுவது, வேறொரு பாடத்தை இழக்கச் செய்கிறது.'),
  (2, 'We cannot separate them because the methods shape what kind of institution you leave behind. MGR''s welfare state was real. But Tamil Nadu''s political culture of personalised power also traces partly to how he governed.', 'அவற்றை நம்மால் பிரிக்க முடியாது, ஏனெனில் நாம் விட்டுச்செல்லும் அமைப்பு எத்தகையது என்பதை அந்த வழிமுறைகளே வடிவமைக்கின்றன. எம்.ஜி.ஆரின் நல அரசு உண்மையானதாக இருந்தது. ஆனால், தமிழ்நாட்டின் தனிநபர் அதிகார அரசியல் கலாச்சாரமும் ஓரளவிற்கு அவர் ஆட்சி செய்த விதத்திலிருந்தே உருவானது.'),
  (3, 'History judges leaders by outcomes. The midday meal scheme feeds children today. The autocratic style is a historical footnote. Most citizens make this calculation instinctively and they are not wrong.', 'வரலாறு தலைவர்களை அவர்களின் விளைவுகளைக் கொண்டே மதிப்பிடுகிறது. மதிய உணவுத் திட்டம் இன்று குழந்தைகளுக்கு உணவளிக்கிறது. சர்வாதிகாரப் பாணி என்பது ஒரு வரலாற்று அடிக்குறிப்பு மட்டுமே. பெரும்பாலான குடிமக்கள் இந்தக் கணக்கீட்டை இயல்பாகவே செய்கிறார்கள், அதில் அவர்கள் தவறில்லை.'),
  (4, 'The question itself is the lesson. Every leader faces the temptation to believe the ends justify the means. MGR is a case study in how much good and how much damage that belief can produce simultaneously.', 'கேள்வியே பாடம். இலக்கை அடைய எந்த வழியையும் கையாளலாம் என்று நம்பும் சோதனையை ஒவ்வொரு தலைவரும் எதிர்கொள்கிறார். அந்த நம்பிக்கை ஒரே நேரத்தில் எவ்வளவு நன்மையையும் எவ்வளவு தீங்கையும் விளைவிக்கும் என்பதற்கு எம்.ஜி.ஆர் ஒரு சிறந்த உதாரணம்.')
) AS v(ord, en, ta);

-- Survey set 2 #26
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A 2022 study found that Indian women spend an average of 5.5 hours per day on unpaid domestic work compared to 1.5 hours for men. This unpaid labour - cooking, childcare, eldercare - does not appear in GDP calculations. A professor says "India''s economic growth story is built partly on unaccounted female labour."', 'What is your response?', '2022-ஆம் ஆண்டு ஆய்வு ஒன்றின்படி, இந்தியப் பெண்கள் ஒரு நாளைக்குச் சராசரியாக 5.5 மணிநேரம் ஊதியம் பெறாத வீட்டு வேலைகளில் செலவிடுகின்றனர்; ஆண்கள் இந்த 1.5 மணிநேரத்தையே செலவிடுகின்றனர். சமையல், குழந்தைப் பராமரிப்பு, முதியோர் பராமரிப்பு போன்ற இந்த ஊதியம் பெறாத உழைப்பு, மொத்த உள்நாட்டு உற்பத்தி (GDP) கணக்கீடுகளில் இடம்பெறுவதில்லை. "இந்தியாவின் பொருளாதார வளர்ச்சிக் கதை, ஓரளவிற்கு கணக்கில் வராத பெண் உழைப்பின் மீதுதான் கட்டமைக்கப்பட்டுள்ளது" என்று ஒரு பேராசிரியர் கூறுகிறார்.', 'உங்கள் பதில் என்ன?',
     '{"theme": "Gender Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She is right and it has policy consequences. If this labour were valued and counted it would change how we think about women''s economic contribution, taxation, social security, and retirement planning.', 'அவர் சொல்வது சரிதான், மேலும் இதற்கு கொள்கை ரீதியான விளைவுகளும் உண்டு. இந்த உழைப்பு மதிக்கப்பட்டு கணக்கிடப்பட்டால், பெண்களின் பொருளாதாரப் பங்களிப்பு, வரிவிதிப்பு, சமூகப் பாதுகாப்பு மற்றும் ஓய்வூதியத் திட்டமிடல் ஆகியவற்றைப் பற்றி நாம் சிந்திக்கும் விதத்தை அது மாற்றும்.'),
  (2, 'This is true globally not just in India. The invisibility of care work in economic measurement is a structural blind spot in how all modern economies are built - not a uniquely Indian problem.', 'இது இந்தியாவில் மட்டுமல்ல, உலகளாவிய ரீதியிலும் உண்மையாகும். பொருளாதார அளவீட்டில் பராமரிப்புப் பணிகள் கண்ணுக்குத் தெரியாமல் இருப்பது, அனைத்து நவீனப் பொருளாதாரங்களும் கட்டமைக்கப்பட்டுள்ள விதத்தில் உள்ள ஒரு கட்டமைப்பு ரீதியான குருட்டுப் புள்ளியாகும் - இது இந்தியாவிற்கு மட்டுமேயான ஒரு பிரச்சினை அல்ல.'),
  (3, 'Acknowledging unpaid labour is important but the more urgent intervention is reducing it - through affordable childcare, elder care infrastructure, and genuine workplace flexibility that allows men to share the load.', 'ஊதியம் பெறாத உழைப்பை ஏற்றுக்கொள்வது முக்கியமானதுதான், ஆனால் அதைவிட அவசரமான தலையீடு என்பது, மலிவு விலைக் குழந்தை பராமரிப்பு, முதியோர் பராமரிப்பு உள்கட்டமைப்பு, மற்றும் ஆண்கள் பணிச்சுமையைப் பகிர்ந்துகொள்ள அனுமதிக்கும் உண்மையான பணியிட நெகிழ்வுத்தன்மை ஆகியவற்றின் மூலம் அதைக் குறைப்பதாகும்.'),
  (4, 'As a future employer this data changes how I think about what I am asking of employees who are also carrying 5.5 hours of invisible work before they walk into my office.', 'வருங்கால முதலாளி என்ற முறையில், என் அலுவலகத்திற்குள் நுழைவதற்கு முன்பே 5.5 மணிநேர மறைமுகப் பணியைச் சுமந்து திரியும் ஊழியர்களிடம் நான் என்ன எதிர்பார்க்கிறேன் என்பது குறித்த என் சிந்தனை முறையை இந்தத் தரவு மாற்றுகிறது.')
) AS v(ord, en, ta);

-- Survey set 2 #27
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A well-known startup founder in your city raised ₹50 crore from investors, built a team of 200 people, and shut the company down after three years. Employees received one month''s notice. Investors lost everything. The founder has already announced his next venture. At a startup event he says "failure is the best teacher." A first-generation entrepreneur in the audience who mortgaged his house to invest quietly walks out.', 'What do you think?', 'உங்கள் நகரத்தில் உள்ள ஒரு பிரபலமான ஸ்டார்ட்அப் நிறுவனர், முதலீட்டாளர்களிடமிருந்து ₹50 கோடி திரட்டி, 200 பேர் கொண்ட குழுவை உருவாக்கி, மூன்று ஆண்டுகளுக்குப் பிறகு நிறுவனத்தை மூடிவிட்டார். ஊழியர்களுக்கு ஒரு மாத கால அவகாசம் மட்டுமே வழங்கப்பட்டது. முதலீட்டாளர்கள் அனைத்தையும் இழந்தனர். அந்த நிறுவனர் ஏற்கனவே தனது அடுத்த முயற்சியை அறிவித்துவிட்டார். ஒரு ஸ்டார்ட்அப் நிகழ்வில் அவர், "தோல்வியே சிறந்த ஆசிரியர்" என்கிறார். முதலீடு செய்வதற்காகத் தன் வீட்டை அடமானம் வைத்திருந்த, பார்வையாளர்களில் இருந்த முதல் தலைமுறை தொழில்முனைவோர் ஒருவர் அமைதியாக வெளியேறுகிறார்.', 'நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Business & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The founder has the right to speak about failure - but the room should acknowledge that failure lands very differently depending on whose capital and whose livelihood was at stake.', 'நிறுவனருக்குத் தோல்வியைப் பற்றிப் பேச உரிமை உண்டு - ஆனால், யாருடைய மூலதனமும் வாழ்வாதாரமும் ஆபத்தில் இருந்தது என்பதைப் பொறுத்து, தோல்வியின் தாக்கம் மிகவும் வித்தியாசமாக அமைகிறது என்பதை இந்த அவையில் உள்ளவர்கள் ஏற்றுக்கொள்ள வேண்டும்.'),
  (2, 'Startup culture romanticises founder resilience while systematically underweighting what failure costs employees and small investors. The "failure is learning" narrative is a privilege of people with safety nets.', 'ஸ்டார்ட்அப் கலாச்சாரம் நிறுவனர்களின் மீள்திறனைப் பெருமைப்படுத்துகிறது, அதே சமயம் தோல்வியால் ஊழியர்களுக்கும் சிறு முதலீட்டாளர்களுக்கும் ஏற்படும் இழப்புகளைத் திட்டமிட்டு குறைத்து மதிப்பிடுகிறது. "தோல்வி ஒரு பாடம்" என்ற கூற்று, பாதுகாப்பு வலைகளைக் கொண்டவர்களுக்கு மட்டுமேயான ஒரு சலுகையாகும்.'),
  (3, 'The investor who mortgaged his house made a high-risk decision with his eyes open. Personal responsibility matters. The founder did not force him to invest.', 'தன் வீட்டை அடமானம் வைத்த முதலீட்டாளர், நன்கு அறிந்தே ஒரு பெரும் அபாயகரமான முடிவை எடுத்தார். தனிப்பட்ட பொறுப்புணர்வு முக்கியமானது. நிறுவனர் அவரை முதலீடு செய்யக் கட்டாயப்படுத்தவில்லை.'),
  (4, 'Both things are true - failure is genuinely instructive and it is genuinely costly. A founder who only tells the first half of that story in a room full of aspiring entrepreneurs is being selectively honest.', 'இரண்டுமே உண்மைதான் - தோல்வி என்பது உண்மையாகவே படிப்பினை அளிக்கிறது, அது உண்மையாகவே பெரும் இழப்பையும் ஏற்படுத்துகிறது. தொழில்முனைவோராக விரும்பும் பலர் நிறைந்த ஒரு அறையில், அந்தக் கதையின் முதல் பாதியை மட்டும் சொல்லும் ஒரு நிறுவனரின் செயல், அவர் தேர்ந்தெடுத்து நேர்மையாக நடந்துகொள்வதாகும்.')
) AS v(ord, en, ta);

-- Survey set 2 #28
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'GST - the Goods and Services Tax - was introduced in 2017 to create a unified national market and simplify indirect taxation. Five years in, small traders and MSMEs consistently report that compliance costs have increased, filing requirements are complex, and the system disproportionately benefits large companies with dedicated tax teams. A small business owner in your family says "GST was designed by big business for big business."', 'Is he wrong?', 'ஜிஎஸ்டி - அதாவது சரக்கு மற்றும் சேவை வரி - ஒரு ஒருங்கிணைந்த தேசிய சந்தையை உருவாக்குவதற்கும், மறைமுக வரிவிதிப்பை எளிமையாக்குவதற்கும் 2017-ல் அறிமுகப்படுத்தப்பட்டது. ஐந்து ஆண்டுகள் கழிந்த நிலையில், இணக்கச் செலவுகள் அதிகரித்துள்ளதாகவும், தாக்கல் செய்வதற்கான தேவைகள் சிக்கலானவையாக இருப்பதாகவும், மேலும் பிரத்யேக வரிக் குழுக்களைக் கொண்ட பெரிய நிறுவனங்களுக்கு இந்த அமைப்பு சமமற்ற முறையில் பயனளிக்கிறது என்றும் சிறு வணிகர்களும் குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களும் (MSMEs) தொடர்ந்து தெரிவிக்கின்றனர். உங்கள் குடும்பத்தில் உள்ள ஒரு சிறு வணிக உரிமையாளர், "ஜிஎஸ்டி பெரிய வணிகங்களால் பெரிய வணிகங்களுக்காக வடிவமைக்கப்பட்டது" என்கிறார்.', 'அவர் சொல்வது தவறா?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'He is not entirely wrong. Any complex compliance system advantages those with resources to manage it. The design intent was good - the implementation favoured sophistication over simplicity.', 'அவர் சொல்வது முற்றிலும் தவறல்ல. எந்தவொரு சிக்கலான இணக்க அமைப்பும், அதை நிர்வகிப்பதற்கான வளங்களைக் கொண்டவர்களுக்கு நன்மை பயக்கும். வடிவமைப்பின் நோக்கம் நல்லதாக இருந்தது - ஆனால், அதன் செயலாக்கம் எளிமையைக் காட்டிலும் நுட்பத்திற்கே முன்னுரிமை அளித்தது.'),
  (2, 'He is wrong about intent but right about outcome. GST was genuinely designed to reduce cascading taxes and create efficiency. That it disadvantages small operators is a calibration failure not a conspiracy.', 'நோக்கத்தைப் பொறுத்தவரை அவர் சொல்வது தவறு, ஆனால் விளைவைப் பொறுத்தவரை அது சரி. ஜிஎஸ்டி உண்மையாகவே அடுக்கு வரிகளைக் குறைக்கவும் செயல்திறனை உருவாக்கவும் வடிவமைக்கப்பட்டது. அது சிறு வணிகர்களுக்குப் பாதகமாக இருப்பது ஒரு சீரமைப்புத் தவறு, சதியல்ல.'),
  (3, 'The real problem is that GST rate rationalisation is still incomplete and the filing system has not been simplified enough. The architecture is sound - the execution is not finished.', 'உண்மையான பிரச்சினை என்னவென்றால், ஜிஎஸ்டி விகித சீரமைப்பு இன்னும் முழுமையடையவில்லை, மேலும் தாக்கல் செய்யும் முறையும் போதுமான அளவு எளிமையாக்கப்படவில்லை. கட்டமைப்பு வலுவாக உள்ளது - ஆனால் செயல்படுத்தும் பணி இன்னும் முடியவில்லை.'),
  (4, 'This is a recurring pattern in Indian policy - national-level reforms designed at the top that impose disproportionate costs at the bottom. GST is one example. The lesson is that policy design without MSME representation produces MSME-unfriendly policy.', 'இந்தியக் கொள்கையில் இது ஒரு தொடர்ச்சியான போக்காக உள்ளது - அதாவது, உயர் மட்டத்தில் வடிவமைக்கப்பட்ட தேசிய அளவிலான சீர்திருத்தங்கள், கீழ் மட்டத்தில் உள்ளவர்கள் மீது சமமற்ற செலவுகளைச் சுமத்துகின்றன. ஜிஎஸ்டி இதற்கு ஒரு உதாரணம். இதிலிருந்து நாம் கற்றுக்கொள்ளும் பாடம் என்னவென்றால், குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களின் (MSME) பிரதிநிதித்துவம் இல்லாமல் கொள்கைகளை வடிவமைப்பது, அவற்றுக்கு உகந்ததல்லாத கொள்கைகளையே உருவாக்கும்.')
) AS v(ord, en, ta);

-- Survey set 2 #29
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India ranks 132nd out of 191 countries on the Human Development Index - below countries with significantly lower GDPs like Sri Lanka, Bangladesh, and Vietnam. A development economist visiting your campus says "India''s HDI ranking is a leadership failure not a resource failure."', 'Do you agree?', 'மனித மேம்பாட்டுக் குறியீட்டில் 191 நாடுகளில் இந்தியா 132-வது இடத்தில் உள்ளது. இது, இலங்கை, வங்கதேசம் மற்றும் வியட்நாம் போன்ற, கணிசமாகக் குறைந்த மொத்த உள்நாட்டு உற்பத்தியைக் கொண்ட நாடுகளுக்குக் கீழே அமைந்துள்ளது. உங்கள் வளாகத்திற்கு வருகை தரும் ஒரு வளர்ச்சிப் பொருளாதார நிபுணர், "இந்தியாவின் மனித மேம்பாட்டுக் குறியீட்டுத் தரவரிசையானது வளங்களின் தோல்வியல்ல, அது ஒரு தலைமைத்துவத் தோல்வியே" என்கிறார்.', 'நீங்கள் ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - India has the resources, the institutional capacity, and the democratic mandate to perform far better on health and education. The ranking reflects political priority not national poverty.', 'ஆம் - சுகாதாரம் மற்றும் கல்வித் துறைகளில் மிகச் சிறப்பாகச் செயல்படுவதற்குத் தேவையான வளங்கள், நிறுவனத் திறன் மற்றும் ஜனநாயக ஆணை இந்தியாவிடம் உள்ளன. இந்தத் தரவரிசையானது தேசிய வறுமையை அல்ல, அரசியல் முன்னுரிமையையே பிரதிபலிக்கிறது.'),
  (2, 'Partially - HDI rankings underweight the complexity of governing 1.4 billion people across 28 states with 22 languages and extreme diversity of development levels. The comparison to smaller homogeneous countries is not fully fair.', 'ஓரளவிற்கு - மனித வளர்ச்சி குறியீட்டுத் தரவரிசைகள், 28 மாநிலங்களில் 22 மொழிகளுடன் வாழும் 140 கோடி மக்களையும், அவர்களின் வளர்ச்சி நிலைகளில் நிலவும் தீவிரமான பன்முகத்தன்மையையும் நிர்வகிப்பதில் உள்ள சிக்கலான தன்மையைக் குறைத்து மதிப்பிடுகின்றன. சிறிய, ஒரே தன்மையுள்ள நாடுகளுடனான ஒப்பீடு முழுமையாக நியாயமானதல்ல.'),
  (3, 'The ranking reflects decades of underinvestment in public health and primary education while prioritising infrastructure and industrial growth. It is a strategic choice made by successive governments - not a failure of a single leader.', 'உள்கட்டமைப்பு மற்றும் தொழில்துறை வளர்ச்சிக்கு முன்னுரிமை அளித்து, பொது சுகாதாரம் மற்றும் ஆரம்பக் கல்வியில் பல தசாப்தங்களாக செய்யப்பட்ட குறைவான முதலீட்டையே இந்தத் தரவரிசை பிரதிபலிக்கிறது. இது அடுத்தடுத்து வந்த அரசாங்கங்களால் எடுக்கப்பட்ட ஒரு மூலோபாயத் தேர்வு - ஒரு தனிப்பட்ட தலைவரின் தோல்வி அல்ல.'),
  (4, 'The more important question is trajectory. If India''s HDI rank is improving year on year the absolute position matters less than the direction. Stagnation would be the real failure.', 'மிக முக்கியமான கேள்வி அதன் பயணப்பாதை பற்றியது. இந்தியாவின் மனித வளர்ச்சி குறியீட்டுத் தரவரிசை ஆண்டுதோறும் மேம்பட்டு வந்தால், அதன் தற்போதைய நிலையை விட அதன் திசையே முக்கியம். தேக்கநிலையே உண்மையான தோல்வியாக இருக்கும்.')
) AS v(ord, en, ta);

-- Survey set 2 #30
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India has over 1,500 centrally sponsored schemes running simultaneously - from MGNREGA to PM Awas Yojana to Poshan Abhiyaan. A government report found that 40% of beneficiaries in multiple schemes are either duplicated, ghost entries, or misclassified. A retired bureaucrat tells your batch - "we are very good at launching schemes and very poor at closing the ones that do not work."', 'What does this tell you about governance?', 'இந்தியாவில் மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டம் (MGNREGA), பிரதம மந்திரி ஆவாஸ் யோஜனா, போஷன் அபியான் என 1,500-க்கும் மேற்பட்ட மத்திய அரசின் திட்டங்கள் ஒரே நேரத்தில் இயங்கி வருகின்றன. பல திட்டங்களில் உள்ள பயனாளிகளில் 40% பேர், ஒன்று இரட்டைப் பதிவுகளாகவோ, போலிப் பதிவுகளாகவோ அல்லது தவறாக வகைப்படுத்தப்பட்டவர்களாகவோ உள்ளனர் என்று ஓர் அரசாங்க அறிக்கை கண்டறிந்துள்ளது. ஓய்வுபெற்ற ஒரு அரசு அதிகாரி உங்கள் குழுவிடம் கூறுகிறார் - "நாம் திட்டங்களைத் தொடங்குவதில் மிகவும் திறமையானவர்கள், ஆனால் பலனளிக்காத திட்டங்களை மூடுவதில் மிகவும் மோசமானவர்கள்."', 'ஆளுகை பற்றி இது உங்களுக்கு என்ன சொல்கிறது?',
     '{"theme": "Governance & Accountability", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It tells me that political incentives reward announcement not outcome. Launching a scheme generates visibility. Shutting a failed one generates opposition. The system is working exactly as its incentives demand.', 'அரசியல் ஊக்கங்கள் முடிவை அல்ல, அறிவிப்பையே வெகுமதி அளிக்கின்றன என்பதை இது எனக்கு உணர்த்துகிறது. ஒரு திட்டத்தைத் தொடங்குவது அதன் கவனத்தை ஈர்க்கிறது. தோல்வியுற்ற ஒன்றை மூடுவது எதிர்ப்பை உருவாக்குகிறது. இந்த அமைப்பு, அதன் ஊக்கங்கள் கோருவதைப் போலவே துல்லியமாகச் செயல்படுகிறது.'),
  (2, 'It tells me that data systems in government are still not good enough to catch duplication at scale. The solution is technology and unique identification - Aadhaar was supposed to solve this and partly has.', 'பெருமளவிலான நகல் பதிவுகளைக் கண்டறிய, அரசாங்கத்தில் உள்ள தரவு அமைப்புகள் இன்னும் போதுமானதாக இல்லை என்பதை இது எனக்கு உணர்த்துகிறது. இதற்கான தீர்வு தொழில்நுட்பமும் தனித்துவமான அடையாளமும்தான் - ஆதார் இதைத் தீர்க்கும் என்று எதிர்பார்க்கப்பட்டது, மேலும் அது ஓரளவிற்குத் தீர்த்தும் உள்ளது.'),
  (3, 'It tells me that 1,500 schemes means no scheme gets the focused attention it needs. Consolidation would improve delivery even if it reduced the political surface area.', '1,500 திட்டங்கள் இருப்பதால், எந்தவொரு திட்டத்திற்கும் தேவையான கவனம் கிடைப்பதில்லை என்பதை இது எனக்கு உணர்த்துகிறது. ஒருங்கிணைப்பு, அரசியல் செல்வாக்கைக் குறைத்தாலும் கூட, செயல் திட்டத்தை மேம்படுத்தும்.'),
  (4, 'It tells me that outcome measurement is not built into scheme design from the start. Every scheme needs a closure trigger - a condition under which it automatically sunsets - not just a launch press conference.', 'திட்ட வடிவமைப்பில் தொடக்கத்திலிருந்தே விளைவு அளவீடு உள்ளடக்கப்படவில்லை என்பதை இது எனக்கு உணர்த்துகிறது. ஒவ்வொரு திட்டத்திற்கும் ஒரு தொடக்க பத்திரிக்கையாளர் சந்திப்பு மட்டுமல்ல, அத்திட்டம் தானாகவே காலாவதியாகும் ஒரு நிறைவுத் தூண்டுதல் தேவைப்படுகிறது.')
) AS v(ord, en, ta);

-- Survey set 2 #31
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A first-generation politician from Tamil Nadu with no family political background wins a district-level election against a candidate from a long-established political family. Within two years she has built a functioning constituency office, resolved 400 grievances, and is being talked about as a future MLA candidate. A political analyst says "she succeeded because she treated governance like a startup."', 'What do you make of that framing?', 'குடும்பத்தில் அரசியல் பின்னணி இல்லாத, தமிழ்நாட்டைச் சேர்ந்த முதல் தலைமுறை அரசியல்வாதி ஒருவர், நீண்டகாலமாக அரசியல் செல்வாக்கு பெற்ற குடும்பத்தைச் சேர்ந்த வேட்பாளருக்கு எதிராக மாவட்ட அளவிலான தேர்தலில் வெற்றி பெறுகிறார். இரண்டு ஆண்டுகளுக்குள், அவர் ஒரு செயல்படும் தொகுதி அலுவலகத்தை உருவாக்கி, 400 குறைகளைத் தீர்த்து வைத்துள்ளார். மேலும், அவர் ஒரு வருங்கால சட்டமன்ற உறுப்பினர் வேட்பாளராகவும் பேசப்படுகிறார். "அவர் நிர்வாகத்தை ஒரு ஸ்டார்ட்அப் போலக் கருதியதால் வெற்றி பெற்றார்" என்று ஒரு அரசியல் ஆய்வாளர் கூறுகிறார்.', 'அந்தக் கட்டமைப்பைப் பற்றி நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Leadership & Power", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It is a useful framing - resource constraints, no legacy systems, direct accountability to users, iterate based on feedback. The startup analogy captures something real about how outsiders disrupt incumbents.', 'இது ஒரு பயனுள்ள கட்டமைப்பு - வளக் கட்டுப்பாடுகள், பழைய அமைப்புகள் இல்லாத நிலை, பயனர்களுக்கு நேரடிப் பொறுப்புக்கூறல், பின்னூட்டத்தின் அடிப்படையில் மேம்படுத்துதல். இந்த ஸ்டார்ட்அப் உவமையானது, வெளியாட்கள் எவ்வாறு ஏற்கனவே உள்ள நிறுவனங்களைச் சீர்குலைக்கிறார்கள் என்பது பற்றிய ஒரு நிஜமான விஷயத்தைப் படம்பிடித்துக் காட்டுகிறது.'),
  (2, 'It is a flattering framing for MBA audiences but governance is not a startup. You cannot pivot away from your constituents. You cannot shut down and restart. The accountability is permanent and the stakes are human lives.', 'MBA பட்டதாரிகளுக்கு இது ஒரு புகழ்ச்சியான சித்தரிப்பாகத் தோன்றலாம், ஆனால் ஆளுகை என்பது ஒரு புத்தொழில் அல்ல. உங்கள் தொகுதி மக்களை விட்டு உங்களால் விலகிச் செல்ல முடியாது. உங்களால் ஒரு வேலையை நிறுத்திவிட்டு மீண்டும் தொடங்க முடியாது. பொறுப்புக்கூறல் என்பது நிரந்தரமானது, மேலும் இதில் சம்பந்தப்பட்டிருப்பது மனித உயிர்களே.'),
  (3, 'The more important observation is that she won without a family name. That means voters can and do choose on performance when given a genuine alternative. The system is not as closed as cynics suggest.', 'மிக முக்கியமான அவதானிப்பு என்னவென்றால், அவர் தனது குடும்பப் பெயர் இல்லாமலேயே வெற்றி பெற்றார் என்பதுதான். இதன் பொருள், ஒரு உண்மையான மாற்று வழி வழங்கப்படும்போது, ​​வாக்காளர்கள் செயல்திறனின் அடிப்படையில் ஒருவரைத் தேர்ந்தெடுக்க முடியும், அவ்வாறே தேர்ந்தெடுக்கவும் செய்கிறார்கள். அவநம்பிக்கையாளர்கள் கூறுவது போல் இந்த அமைப்பு அவ்வளவு மூடியதாக இல்லை.'),
  (4, 'What she built - a functional grievance resolution system - is more valuable than any scheme announcement. The gap between what politics promises and what governance delivers is mostly a last-mile execution problem.', 'அவர் உருவாக்கிய, ஒரு செயல்பாட்டுக்கு உகந்த குறைதீர்க்கும் அமைப்பு, எந்தவொரு திட்ட அறிவிப்பையும் விட மதிப்புமிக்கது. அரசியல் வாக்குறுதி அளிப்பதற்கும் ஆளுகை வழங்குவதற்கும் இடையிலான இடைவெளி என்பது பெரும்பாலும் இறுதிக்கட்டச் செயலாக்கப் பிரச்சனையே ஆகும்.')
) AS v(ord, en, ta);

-- Survey set 2 #32
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A major Tamil news channel ran a 45-minute primetime segment on a celebrity couple''s separation on the same evening that the state government tabled a ₹500 crore supplementary budget with significant cuts to rural health infrastructure. The health story received four minutes of coverage. A media professor says "the media gives people what they want not what they need."', 'Is this an acceptable explanation?', 'மாநில அரசு, கிராமப்புற சுகாதார உள்கட்டமைப்பில் கணிசமான வெட்டுக்களுடன் ₹500 கோடி மதிப்பிலான துணை பட்ஜெட்டைத் தாக்கல் செய்த அதே மாலையில், ஒரு முன்னணி தமிழ் செய்தித் தொலைக்காட்சி, ஒரு பிரபல தம்பதியின் பிரிவு குறித்து 45 நிமிட பிரைம்டைம் நிகழ்ச்சியை ஒளிபரப்பியது. அந்த சுகாதாரச் செய்திக்கு நான்கு நிமிட ஒளிபரப்பு நேரம் மட்டுமே கிடைத்தது. "ஊடகங்கள் மக்களுக்குத் தேவையானதைக் கொடுப்பதில்லை, அவர்கள் விரும்புவதையே கொடுக்கின்றன" என்கிறார் ஒரு ஊடகப் பேராசிரியர்.', 'இந்த விளக்கம் ஏற்றுக்கொள்ளத்தக்கதா?',
     '{"theme": "Media & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'No - media shapes demand as much as it reflects it. Saying "we give people what they want" is circular. You trained them to want this and now you are using their appetite to justify the diet.', 'இல்லை - ஊடகங்கள் தேவையைப் பிரதிபலிப்பதைப் போலவே அதை வடிவமைக்கவும் செய்கின்றன. "மக்கள் விரும்புவதையே நாங்கள் அவர்களுக்குக் கொடுக்கிறோம்" என்று சொல்வது ஒரு சுழற்சி முறை. இதை விரும்புமாறு நீங்கள் அவர்களுக்குப் பழக்கிவிட்டீர்கள், இப்போது அந்த உணவுக்கட்டுப்பாட்டை நியாயப்படுத்த அவர்களின் இந்த ஆசையைப் பயன்படுத்துகிறீர்கள்.'),
  (2, 'Partially acceptable - commercial media must survive financially and audiences do drive content decisions. The solution is stronger public broadcasting - a well-funded Doordarshan-equivalent that covers what commercial media will not.', 'ஓரளவு ஏற்றுக்கொள்ளத்தக்கது - வணிக ஊடகங்கள் நிதி ரீதியாக நிலைத்திருக்க வேண்டும், மேலும் உள்ளடக்க முடிவுகளைப் பார்வையாளர்களே தீர்மானிக்கிறார்கள். இதற்கான தீர்வு, வலுவான பொது ஒளிபரப்பு ஆகும் - அதாவது, வணிக ஊடகங்கள் ஒளிபரப்பாதவற்றை உள்ளடக்கிய, நல்ல நிதி ஆதரவு பெற்ற தூர்தர்ஷனுக்கு இணையான ஒரு அமைப்பு.'),
  (3, 'The comparison is damning regardless of explanation. A democracy where citizens cannot access basic governance information through mainstream media is a democracy with a structural information failure.', 'விளக்கம் எதுவாக இருந்தாலும் இந்த ஒப்பீடு மிகவும் கண்டிக்கத்தக்கது. பிரதான ஊடகங்கள் மூலம் குடிமக்களால் அடிப்படை ஆட்சிமுறைத் தகவல்களை அணுக முடியாத ஒரு ஜனநாயகம் என்பது, கட்டமைப்பு ரீதியான தகவல் தோல்வியைக் கொண்ட ஒரு ஜனநாயகமாகும்.'),
  (4, 'This is why media literacy needs to be taught in schools. The problem is not the channel - it is an audience that has not been given tools to demand better. Both supply and demand need to change.', 'இதனால்தான் பள்ளிகளில் ஊடக எழுத்தறிவு கற்பிக்கப்பட வேண்டும். பிரச்சனை ஊடக ஊடகம் அல்ல - சிறந்ததைக் கோருவதற்கான கருவிகள் வழங்கப்படாத பார்வையாளர்களே பிரச்சனை. அளிப்பு மற்றும் தேவை ஆகிய இரண்டுமே மாற வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 2 #33
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'The gig economy employs approximately 77 lakh workers in India today - Swiggy delivery partners, Ola drivers, Urban Company technicians. They have no employment benefits, no provident fund, no health insurance, no job security. The companies that employ them are valued at billions. A classmate says "this is exploitation disguised as entrepreneurship." Another says "it is flexible work that millions chose freely."', 'Who is right?', 'இன்று இந்தியாவில் ஸ்விக்கி டெலிவரி பார்ட்னர்கள், ஓலா ஓட்டுநர்கள், அர்பன் கம்பெனி டெக்னீஷியன்கள் என சுமார் 77 லட்சம் தொழிலாளர்கள் கிக் பொருளாதாரத்தில் பணிபுரிகின்றனர். அவர்களுக்கு வேலைவாய்ப்புப் பலன்கள், வருங்கால வைப்பு நிதி, மருத்துவக் காப்பீடு, வேலைப் பாதுகாப்பு என எதுவும் இல்லை. அவர்களைப் பணியமர்த்தும் நிறுவனங்களின் மதிப்பு பில்லியன்களில் உள்ளது. ஒரு வகுப்புத் தோழன், "இது தொழில்முனைவு என வேடமிட்ட சுரண்டல்" என்கிறார். மற்றொருவர், "இது லட்சக்கணக்கானோர் சுயமாகத் தேர்ந்தெடுத்த நெகிழ்வான வேலை" என்கிறார்.', 'யார் சொல்வது சரி?',
     '{"theme": "Future of Work", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The first classmate - freedom of choice means little when the alternative is unemployment. Calling it a choice without examining the constraints of that choice is intellectually dishonest.', 'முதல் வகுப்புத் தோழரே - வேலையின்மையே மாற்று வழியாக இருக்கும்போது, ​​தேர்வு செய்வதற்கான சுதந்திரத்திற்கு அதிக அர்த்தமில்லை. அந்தத் தேர்வின் கட்டுப்பாடுகளை ஆராயாமல் அதை ஒரு தேர்வு என்று அழைப்பது அறிவுசார் நேர்மையற்ற செயலாகும்.'),
  (2, 'The second - millions of people actively prefer gig work for the flexibility. Imposing traditional employment structures on them in the name of protection may eliminate the very jobs they chose.', 'இரண்டாவது - லட்சக்கணக்கான மக்கள் நெகிழ்வுத்தன்மைக்காக பகுதிநேரப் பணிகளைத் தீவிரமாக விரும்புகிறார்கள். பாதுகாப்பு என்ற பெயரில் அவர்கள் மீது பாரம்பரிய வேலைவாய்ப்புக் கட்டமைப்புகளைத் திணிப்பது, அவர்கள் தேர்ந்தெடுத்த வேலைகளையே இல்லாமல் செய்துவிடக்கூடும்.'),
  (3, 'Both miss the real question - why are billion-dollar valuations being built on a workforce with zero social protection? The business model externalises risk onto the most vulnerable people in the chain.', 'இருவரும் உண்மையான கேள்வியைத் தவறவிடுகிறார்கள் - எந்தவிதமான சமூகப் பாதுகாப்பும் இல்லாத ஒரு தொழிலாளர் படையின் மீது ஏன் பில்லியன் டாலர் மதிப்பீடுகள் கட்டமைக்கப்படுகின்றன? இந்த வணிக மாதிரி, சங்கிலித் தொடரில் உள்ள மிகவும் பாதிக்கப்படக்கூடிய மக்கள் மீது இடரைக் கடத்துகிறது.'),
  (4, 'The solution is portable benefits - provident fund, health cover, accident insurance - that attach to the worker not the employer. You can have flexibility and protection simultaneously if the policy architecture allows it.', 'இதற்கான தீர்வு, வருங்கால வைப்பு நிதி, மருத்துவக் காப்பீடு, விபத்துக் காப்பீடு போன்ற மாற்றத்தக்க பலன்களாகும். இவை முதலாளிக்கு அல்லாமல், பணியாளருக்கே உரியதாக அமைகின்றன. காப்பீட்டுக் கொள்கையின் கட்டமைப்பு அனுமதித்தால், உங்களால் நெகிழ்வுத்தன்மையையும் பாதுகாப்பையும் ஒரே நேரத்தில் பெற முடியும்.')
) AS v(ord, en, ta);

-- Survey set 2 #34
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'Chennai faced a severe water crisis in 2019 - major reservoirs ran dry, water tankers queued for hours, IT companies sent employees home. The crisis was predicted by water experts five years earlier. A city that receives 1,400mm of rain annually ran out of water. A professor says "Chennai''s water crisis was not a climate event - it was a governance failure."', 'What is your view?', '2019-ல் சென்னை கடுமையான தண்ணீர் நெருக்கடியை எதிர்கொண்டது - முக்கிய நீர்த்தேக்கங்கள் வறண்டு போயின, தண்ணீர் டேங்கர்கள் பல மணி நேரம் வரிசையில் நின்றன, தகவல் தொழில்நுட்ப நிறுவனங்கள் ஊழியர்களைப் பணியிலிருந்து விடுவித்தன. இந்த நெருக்கடியை ஐந்து ஆண்டுகளுக்கு முன்பே நீர் வல்லுநர்கள் கணித்திருந்தனர். ஆண்டுக்கு 1,400 மி.மீ. மழைப்பொழிவைப் பெறும் ஒரு நகரத்தில் தண்ணீர் பற்றாக்குறை ஏற்பட்டது. "சென்னையின் தண்ணீர் நெருக்கடி ஒரு காலநிலை நிகழ்வு அல்ல - அது ஒரு நிர்வாகத் தோல்வி" என்று ஒரு பேராசிரியர் கூறுகிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Environment & Business", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Correct - 1,400mm of annual rainfall is more than enough. The failure was in harvesting, storage, and distribution infrastructure. The rain came. The systems were not there to catch it.', 'சரிதான் - ஆண்டுக்கு 1,400 மிமீ மழைப்பொழிவு என்பது போதுமானதை விட அதிகம். மழைநீர் சேகரிப்பு, சேமிப்பு மற்றும் விநியோகக் கட்டமைப்புகளில்தான் தோல்வி ஏற்பட்டது. மழை பெய்தது. ஆனால், அதைச் சேகரிப்பதற்கான அமைப்புகள் இருக்கவில்லை.'),
  (2, 'Both - poor governance made the city structurally vulnerable and climate variability pushed it past the breaking point. Separating the two misses how they interact.', 'மோசமான நிர்வாகம் நகரத்தின் கட்டமைப்பை பலவீனமாக்கியது, மேலும் காலநிலை மாறுபாடு அதனை உடைந்துபோகும் நிலைக்குத் தள்ளியது. இவ்விரண்டையும் பிரித்துப் பார்ப்பது, அவை எவ்வாறு ஒன்றோடொன்று தொடர்பு கொள்கின்றன என்பதைத் தவறவிடுவதாகும்.'),
  (3, 'This is the future of every Indian city that grows without investing in water infrastructure. Chennai was first. It will not be last. The lesson is not just about Chennai.', 'நீர் உள்கட்டமைப்பில் முதலீடு செய்யாமல் வளரும் ஒவ்வொரு இந்திய நகரத்தின் எதிர்காலமும் இதுதான். சென்னைதான் முதலில் இருந்தது. அது கடைசி இடமாக இருக்காது. இந்தப் பாடம் சென்னையைப் பற்றியது மட்டுமல்ல.'),
  (4, 'As a business leader this tells me that water risk is now a site selection criterion. Before I put a facility anywhere I need to understand the 10-year water security picture of that location.', 'ஒரு வணிகத் தலைவராக, நீர் அபாயம் இப்போது ஒரு இடத் தேர்வு அளவுகோலாக உள்ளது என்பதை இது எனக்கு உணர்த்துகிறது. நான் எங்கு ஒரு கட்டிடத்தை அமைப்பதற்கு முன்பும், அந்த இடத்தின் 10 ஆண்டு கால நீர் பாதுகாப்பு நிலவரத்தை நான் புரிந்துகொள்ள வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 2 #35
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A leading Indian conglomerate announces a ₹1,000 crore CSR commitment over five years - the largest in their history. Three months later an investigation reveals the same group''s factories in two states have been discharging industrial effluents into rivers serving farming communities for six years. A journalist asks their spokesperson - "how do you reconcile the two?" The spokesperson says "CSR and compliance are handled by different departments."', 'What is your response to that answer?', 'இந்தியாவின் ஒரு முன்னணி பெருநிறுவனம், தனது வரலாற்றிலேயே மிகப்பெரிய தொகையான ₹1,000 கோடி மதிப்பிலான சமூகப் பொறுப்புணர்வுத் திட்டத்தை ஐந்து ஆண்டுகளில் அறிவித்தது. மூன்று மாதங்களுக்குப் பிறகு, அதே குழுமத்தின் இரண்டு மாநிலங்களில் உள்ள தொழிற்சாலைகள், கடந்த ஆறு ஆண்டுகளாக விவசாய சமூகங்களுக்கு நீர் வழங்கும் ஆறுகளில் தொழிற் கழிவுகளை வெளியேற்றி வருவது ஒரு விசாரணையில் தெரியவந்தது. ஒரு பத்திரிகையாளர் அவர்களின் செய்தித் தொடர்பாளரிடம், "இந்த இரண்டையும் எப்படிச் சமன் செய்கிறீர்கள்?" என்று கேட்கிறார். அதற்கு அந்த செய்தித் தொடர்பாளர், "சமூகப் பொறுப்புணர்வும் விதிமுறைகளுக்கு இணங்குதலும் வெவ்வேறு துறைகளால் கையாளப்படுகின்றன" என்று பதிலளிக்கிறார்.', 'அந்தப் பதிலுக்கு உங்கள் எதிர்வினை என்ன?',
     '{"theme": "Social Responsibility", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It is the most honest dishonest answer possible. It perfectly describes how large organisations compartmentalise ethics - and why that compartmentalisation is itself the ethical failure.', 'இது சாத்தியமான பதில்களிலேயே மிகவும் நேர்மையான, நேர்மையற்ற பதிலாகும். பெரிய நிறுவனங்கள் அறநெறிகளை எவ்வாறு தனித்தனியாகப் பிரிக்கின்றன என்பதையும், அந்தப் பிரிப்பே ஏன் ஒரு அறநெறித் தோல்வியாக அமைகிறது என்பதையும் இது கச்சிதமாக விவரிக்கிறது.'),
  (2, 'The spokesperson revealed more than they intended. When CSR and compliance are genuinely separate functions with no shared accountability - the organisation has not understood what responsibility means.', 'செய்தித் தொடர்பாளர் அவர்கள் எதிர்பார்த்ததை விட அதிகமாக வெளிப்படுத்தினார். பெருநிறுவன சமூகப் பொறுப்பும் (CSR) இணக்கமும், பகிரப்பட்ட பொறுப்புக்கூறல் இல்லாமல் உண்மையாகவே தனித்தனி செயல்பாடுகளாக இருக்கும்போது - பொறுப்பு என்பதன் அர்த்தத்தை அந்த அமைப்பு புரிந்து கொள்ளவில்லை என்றே பொருள்.'),
  (3, 'This is why ESG frameworks need teeth. Voluntary CSR commitments mean nothing if the core business is causing harm. Regulation needs to connect the two or the gap will always be exploited.', 'இதனால்தான் ESG கட்டமைப்புகளுக்கு வலு தேவைப்படுகிறது. முக்கிய வணிகமே பாதிப்பை ஏற்படுத்தும்போது, ​​தன்னார்வ CSR உறுதிமொழிகளுக்கு எந்த அர்த்தமும் இல்லை. ஒழுங்குமுறை இவ்விரண்டையும் இணைக்க வேண்டும், இல்லையெனில் இந்த இடைவெளி எப்போதும் சுரண்டப்படும்.'),
  (4, 'As a future leader I want to work in and build organisations where this answer would be impossible - not because it is illegal but because the culture would not produce it.', 'ஒரு வருங்காலத் தலைவராக, இந்தப் பதில் சாத்தியமற்றதாக இருக்கும் நிறுவனங்களில் நான் பணியாற்றவும் அந்நிறுவனங்களை உருவாக்கவும் விரும்புகிறேன் - அது சட்டவிரோதமானது என்பதற்காக அல்ல, மாறாக அங்குள்ள கலாச்சாரம் அத்தகைய பதிலை உருவாக்காது என்பதால்.')
) AS v(ord, en, ta);

-- Survey set 2 #36
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India''s Finance Commission meets every five years and decides how tax revenue collected by the Centre is distributed to states. Southern states - Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana - consistently argue they receive less than they contribute because the formula rewards population size over fiscal performance. Tamil Nadu contributes roughly 9% of national tax revenue and receives approximately 4% back. A state finance minister says "we are subsidising states that have not invested in development."', 'Is this a fair characterisation?', 'இந்தியாவின் நிதி ஆணையம் ஐந்து ஆண்டுகளுக்கு ஒருமுறை கூடி, மத்திய அரசால் வசூலிக்கப்படும் வரி வருவாயை மாநிலங்களுக்கு எவ்வாறு பகிர்ந்தளிப்பது என்பதைத் தீர்மானிக்கிறது. தமிழ்நாடு, கேரளா, கர்நாடகா, ஆந்திரப் பிரதேசம், தெலங்கானா போன்ற தென்னிந்திய மாநிலங்கள், இந்த சூத்திரம் நிதிச் செயல்திறனை விட மக்கள்தொகை அளவிற்கே முன்னுரிமை அளிப்பதால், தாங்கள் பங்களிப்பதை விடக் குறைவாகவே பெறுவதாகத் தொடர்ந்து வாதிடுகின்றன. தமிழ்நாடு தேசிய வரி வருவாயில் ஏறக்குறைய 9% பங்களித்து, சுமார் 4%-ஐ மட்டுமே திரும்பப் பெறுகிறது. "வளர்ச்சியில் முதலீடு செய்யாத மாநிலங்களுக்கு நாங்கள் மானியம் வழங்குகிறோம்" என்று ஒரு மாநில நிதி அமைச்சர் கூறுகிறார்.', 'இது ஒரு நியாயமான சித்தரிப்பா?',
     '{"theme": "Political Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Factually it is largely accurate. The formula does transfer resources from fiscally stronger states to weaker ones. Whether that is subsidy or solidarity depends on how you see federal responsibility.', 'உண்மையில் அது பெரும்பாலும் துல்லியமானது. அந்த சூத்திரம், நிதி ரீதியாக வலுவான மாநிலங்களிலிருந்து பலவீனமான மாநிலங்களுக்கு வளங்களை மாற்றுகிறது. அது மானியமா அல்லது ஒருமைப்பாட்டு நடவடிக்கையா என்பது, மத்திய அரசின் பொறுப்பை நீங்கள் எவ்வாறு பார்க்கிறீர்கள் என்பதைப் பொறுத்தது.'),
  (2, 'It is fair as a grievance but not as policy. Federal systems exist precisely to redistribute from stronger to weaker regions. Tamil Nadu benefited from national integration too - markets, defence, currency, infrastructure.', 'ஒரு குறையாக இது நியாயமானதே தவிர, கொள்கையாக அல்ல. வலுவான பிராந்தியங்களிலிருந்து பலவீனமான பிராந்தியங்களுக்கு மறுபகிர்வு செய்வதற்காகவே கூட்டாட்சி அமைப்புகள் துல்லியமாக உள்ளன. தேசிய ஒருங்கிணைப்பால் தமிழ்நாடும் சந்தைகள், பாதுகாப்பு, நாணயம், உள்கட்டமைப்பு எனப் பல துறைகளில் பயனடைந்தது.'),
  (3, 'The formula needs updating - population figures used are from 2011 and states that controlled growth are being penalised for a decade-old snapshot. Reform the methodology without abandoning the redistribution principle.', 'சூத்திரத்தைப் புதுப்பிக்க வேண்டும் - இதில் பயன்படுத்தப்பட்டுள்ள மக்கள்தொகை புள்ளிவிவரங்கள் 2011-ஆம் ஆண்டைச் சேர்ந்தவை. மேலும், பத்தாண்டு காலத்திற்கு முந்தைய ஒரு தரவுப் புள்ளிக்காக, கட்டுப்படுத்தப்பட்ட வளர்ச்சி தண்டிக்கப்படுவதாகவும் இது குறிப்பிடுகிறது. மறுபங்கீட்டுக் கொள்கையைக் கைவிடாமல், இந்த வழிமுறையைச் சீர்திருத்தவும்.'),
  (4, 'This debate will define Indian federalism for the next 20 years. States that feel the system is structurally unfair will eventually demand renegotiation - and that renegotiation will be politically explosive.', 'இந்த விவாதம் அடுத்த 20 ஆண்டுகளுக்கு இந்தியக் கூட்டாட்சி முறையை வரையறுக்கும். இந்த அமைப்புமுறை கட்டமைப்பு ரீதியாக நியாயமற்றது என்று கருதும் மாநிலங்கள் இறுதியில் மறுபேச்சுவார்த்தையைக் கோரும் - மேலும் அந்த மறுபேச்சுவார்த்தை அரசியல் ரீதியாகப் பெரும் கொந்தளிப்பை ஏற்படுத்தும்.')
) AS v(ord, en, ta);

-- Survey set 2 #37
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A first-generation entrepreneur from a small town in Tamil Nadu builds a ₹200 crore business over 15 years. He employs 800 people, pays above market wages, and has never taken venture capital. He is invited to speak at an IIM convocation. In the green room before his speech he tells you quietly - "I do not belong here. These students will never work for someone like me. They want MNCs and startups."', 'What do you say to him?', 'தமிழ்நாட்டின் ஒரு சிறிய ஊரைச் சேர்ந்த முதல் தலைமுறை தொழில்முனைவோர் ஒருவர், 15 ஆண்டுகளில் ₹200 கோடி மதிப்பிலான ஒரு தொழிலை உருவாக்குகிறார். அவர் 800 பேருக்கு வேலை அளிக்கிறார், சந்தை விலையை விட அதிக ஊதியம் வழங்குகிறார், மேலும் ஒருபோதும் துணிகர மூலதனத்தைப் பெற்றதில்லை. அவர் ஒரு ஐஐஎம் பட்டமளிப்பு விழாவில் பேசுவதற்கு அழைக்கப்படுகிறார். தனது உரைக்கு முன்பு ஓய்வறையில் அவர் உங்களிடம் மெதுவாகச் சொல்கிறார் - "நான் இங்கு இருப்பதற்குத் தகுதியானவன் அல்ல. இந்த மாணவர்கள் என்னைப் போன்ற ஒருவருக்காக ஒருபோதும் வேலை செய்ய மாட்டார்கள். அவர்களுக்குப் பன்னாட்டு நிறுவனங்களும் புத்தொழில் நிறுவனங்களும்தான் வேண்டும்."', 'நீங்கள் அவரிடம் என்ன சொல்கிறீர்கள்?',
     '{"theme": "Business & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'That he has built something more valuable than most of what gets celebrated in business schools - real employment, real profitability, real community impact - and that the gap in recognition says more about what business schools value than what actually matters.', 'வணிகப் பள்ளிகளில் கொண்டாடப்படும் பெரும்பாலானவற்றைக் காட்டிலும் - அதாவது உண்மையான வேலைவாய்ப்பு, உண்மையான இலாபம், உண்மையான சமூகத் தாக்கம் - மிகவும் மதிப்புமிக்க ஒன்றை அவர் உருவாக்கியுள்ளார் என்பதும், இந்த அங்கீகார இடைவெளியானது, உண்மையில் முக்கியத்துவம் வாய்ந்ததைக் காட்டிலும் வணிகப் பள்ளிகள் எதற்கு மதிப்பளிக்கின்றன என்பதையே அதிகம் காட்டுகிறது என்பதும்தான்.'),
  (2, 'That he might be right about some students - but the ones who work for him will get something no MNC gives them. Proximity to a founder who built from nothing is an education no classroom provides.', 'சில மாணவர்களைப் பொறுத்தவரை அவர் சொல்வது சரியாக இருக்கலாம் - ஆனால் அவருக்காகப் பணிபுரிபவர்களுக்கு, எந்தப் பன்னாட்டு நிறுவனமும் வழங்காத ஒன்று கிடைக்கும். ஒன்றுமில்லாததிலிருந்து ஒரு நிறுவனத்தை உருவாக்கியவருடன் நெருக்கமாக இருப்பது, எந்த வகுப்பறையும் வழங்காத ஒரு கல்வியாகும்.'),
  (3, 'That the feeling of not belonging in elite rooms is something most first-generation builders carry - and that the students in that auditorium need to hear from someone who built without the safety net more than they need another VC success story.', 'உயர்மட்ட அறைகளில் தங்களுக்குப் பொருத்தமில்லை என்ற உணர்வு பெரும்பாலான முதல் தலைமுறை உருவாக்குநர்களிடம் உள்ளது என்பதும், அந்த அரங்கத்தில் உள்ள மாணவர்களுக்கு மற்றொரு துணிகர முதலீட்டாளரின் வெற்றிக் கதையைக் கேட்பதை விட, எந்தப் பாதுகாப்பு வலையும் இல்லாமல் உருவாக்கிய ஒருவரின் பேச்சைக் கேட்பதுதான் மிகவும் அவசியம் என்பதும் தான்.'),
  (4, 'That his instinct about the students may be correct today - but his speech has the power to change it. The right story told in the right room plants seeds that take years to grow.', 'மாணவர்களைப் பற்றிய அவரது உள்ளுணர்வு இன்று சரியாக இருக்கலாம் - ஆனால் அதை மாற்றும் சக்தி அவரது பேச்சுக்கு உண்டு. சரியான அறையில் சொல்லப்படும் சரியான கதை, வளர்வதற்குப் பல ஆண்டுகள் ஆகும் விதைகளை விதைக்கிறது.')
) AS v(ord, en, ta);

-- Survey set 2 #38
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'India''s Aadhaar system is the world''s largest biometric identity database - covering 1.3 billion people. It has enabled direct benefit transfers eliminating middlemen, saved the government an estimated ₹2.25 lakh crore in leakage, and given millions of people their first formal identity. It has also been linked to exclusion errors where genuine beneficiaries were denied food rations because of authentication failures. A technologist says "Aadhaar is the best and worst of Indian governance simultaneously."', 'Do you agree?', 'இந்தியாவின் ஆதார் அமைப்பு, 130 கோடி மக்களை உள்ளடக்கிய உலகின் மிகப்பெரிய பயோமெட்ரிக் அடையாளத் தரவுத்தளமாகும். இது இடைத்தரகர்களை நீக்கி, நேரடிப் பணப் பரிமாற்றங்களைச் சாத்தியமாக்கியுள்ளது; கசிவுகள் மூலம் அரசாங்கத்திற்கு சுமார் ₹2.25 லட்சம் கோடியைச் சேமித்துள்ளது; மேலும், லட்சக்கணக்கான மக்களுக்கு அவர்களின் முதல் முறையான அடையாளத்தை வழங்கியுள்ளது. அங்கீகாரச் சரிபார்ப்புத் தோல்விகள் காரணமாக, உண்மையான பயனாளிகளுக்கு உணவுப் பங்கீடுகள் மறுக்கப்பட்ட புறக்கணிப்புப் பிழைகளுடனும் இது தொடர்புபடுத்தப்பட்டுள்ளது. ஒரு தொழில்நுட்ப வல்லுநர், "ஆதார் என்பது ஒரே நேரத்தில் இந்திய நிர்வாகத்தின் சிறந்த மற்றும் மோசமான அம்சமாகும்" என்கிறார்.', 'நீங்கள் ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Governance & Technology", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - it is a genuine achievement at an impossible scale and a genuine risk when the failure mode is hunger. Both things are true and dismissing either one misses the lesson.', 'ஆம் - இது சாத்தியமற்ற அளவிலான ஒரு உண்மையான சாதனை; பசியே தோல்விக்கான காரணமாக இருக்கும்போது, ​​இது ஒரு உண்மையான அபாயமும் கூட. இந்த இரண்டுமே உண்மைதான், இவற்றில் எதையாவது புறக்கணிப்பது நாம் கற்றுக்கொள்ள வேண்டிய பாடத்தைத் தவறவிடுவதற்குச் சமம்.'),
  (2, 'The exclusion errors are not a technology problem - they are a last-mile implementation problem. The solution is better fallback mechanisms not dismantling the system.', 'விலக்கல் பிழைகள் ஒரு தொழில்நுட்பச் சிக்கல் அல்ல - அவை இறுதிக்கட்டச் செயலாக்கச் சிக்கலாகும். அமைப்பைக் கலைத்துவிடாமல், சிறந்த மாற்று வழிமுறைகளைக் கொண்டிருப்பதே இதற்கான தீர்வாகும்.'),
  (3, 'Any system that makes a billion-person database the single point of failure for food access has a design problem regardless of how impressive the engineering is. Resilience requires redundancy.', 'ஒரு பில்லியன் மக்கள் அடங்கிய தரவுத்தளத்தை உணவு கிடைப்பதற்கான ஒற்றைப் பிழைப் புள்ளியாக மாற்றும் எந்தவொரு அமைப்பிலும், அதன் பொறியியல் எவ்வளவு சிறப்பாக இருந்தாலும், ஒரு வடிவமைப்புச் சிக்கல் உள்ளது. மீள்திறனுக்கு மிகைப்பணி அவசியம்.'),
  (4, 'The ₹2.25 lakh crore in savings is real money that went to real people instead of middlemen. The exclusion errors are also real. Policy should fix the second without undoing the first.', '₹2.25 லட்சம் கோடி சேமிப்பானது, இடைத்தரகர்களுக்குச் செல்லாமல் உண்மையான மக்களுக்குச் சென்ற உண்மையான பணமாகும். புறக்கணிப்புப் பிழைகளும் உண்மையானவையே. கொள்கையானது முதலாவதைச் சரிசெய்யாமல் இரண்டாவதைச் சரிசெய்ய வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 2 #39
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'The Reserve Bank of India has maintained inflation within its target band, managed currency stability through global volatility, and built foreign exchange reserves exceeding $600 billion. It has also clashed publicly with the Finance Ministry on multiple occasions over interest rates and autonomy. A former RBI governor famously resigned early citing interference. A professor says "an institution''s greatest test is whether it can say no to its own government."', 'What do you think?', 'இந்திய ரிசர்வ் வங்கி, பணவீக்கத்தை அதன் இலக்கு வரம்பிற்குள் கட்டுப்படுத்தி, உலகளாவிய ஏற்ற இறக்கங்களுக்கு மத்தியிலும் நாணய நிலைத்தன்மையை நிர்வகித்து, 600 பில்லியன் டாலருக்கும் அதிகமான அந்நியச் செலாவணிக் கையிருப்பை உருவாக்கியுள்ளது. மேலும், வட்டி விகிதங்கள் மற்றும் தன்னாட்சி தொடர்பாக அது பலமுறை நிதி அமைச்சகத்துடன் பகிரங்கமாக மோதியுள்ளது. ரிசர்வ் வங்கியின் முன்னாள் ஆளுநர் ஒருவர், தலையீடுகளைக் காரணம் காட்டி முன்கூட்டியே ராஜினாமா செய்தது மிகவும் பிரசித்தி பெற்றது. "ஒரு நிறுவனத்தின் மிகப்பெரிய சோதனை என்பது, அது தனது சொந்த அரசாங்கத்திற்கே ''இல்லை'' என்று சொல்ல முடியுமா என்பதுதான்" என்கிறார் ஒரு பேராசிரியர்.', 'நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Leadership & Institutions", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She is right - institutional independence is only meaningful when it is exercised against political pressure. An RBI that always agrees with the Finance Ministry is not independent - it is an extension of it.', 'அவர் சொல்வது சரிதான் - அரசியல் அழுத்தங்களுக்கு எதிராகச் செயல்படுத்தப்படும்போதுதான் நிறுவனச் சுதந்திரத்திற்கு அர்த்தம் உண்டு. நிதி அமைச்சகத்துடன் எப்போதும் உடன்படும் ஒரு ரிசர்வ் வங்கி சுதந்திரமானதல்ல - அது அதன் ஒரு நீட்சியாகும்.'),
  (2, 'Complete independence is also a governance problem. Monetary policy and fiscal policy need coordination. An RBI that is permanently at war with the Finance Ministry produces paralysis not stability.', 'முழுமையான சுதந்திரம் என்பது ஒரு ஆளுகைப் பிரச்சினையும் கூட. பணவியல் கொள்கைக்கும் நிதிக் கொள்கைக்கும் ஒருங்கிணைப்பு தேவை. நிதி அமைச்சகத்துடன் நிரந்தரமாகப் போரிடும் ஒரு இந்திய ரிசர்வ் வங்கி, நிலைத்தன்மையை அல்ல, முடக்கத்தையே உருவாக்கும்.'),
  (3, 'The RBI''s track record speaks for itself. Inflation management, banking system stability, and reserve management are areas where institutional expertise should override political preference - and largely has.', 'இந்திய ரிசர்வ் வங்கியின் செயல்பாடுகள் அதற்கே சான்றாக அமைகின்றன. பணவீக்க மேலாண்மை, வங்கி அமைப்பின் நிலைத்தன்மை மற்றும் கையிருப்பு மேலாண்மை ஆகிய துறைகளில், அரசியல் விருப்பங்களை விட நிறுவன நிபுணத்துவமே மேலோங்க வேண்டும் - பெரும்பாலும் அவ்வாறே இருந்தும் உள்ளது.'),
  (4, 'The resignation of a governor is a signal worth taking seriously. When the person with the most information about a system''s health chooses to leave rather than continue - that tells you something about the pressure being applied.', 'ஒரு ஆளுநரின் ராஜினாமா என்பது தீவிரமாக எடுத்துக்கொள்ள வேண்டிய ஒரு அறிகுறியாகும். ஒரு அமைப்பின் ஆரோக்கியம் குறித்து அதிக தகவல்களைக் கொண்ட நபர், பதவியில் தொடர்வதற்குப் பதிலாக விலகத் தீர்மானிக்கும்போது, ​​அது அவர் மீது செலுத்தப்படும் அழுத்தத்தைப் பற்றி நமக்குத் தெரிவிக்கிறது.')
) AS v(ord, en, ta);

-- Survey set 2 #40
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 2,
     'A study found that top MBA graduates in India earn 400–600% more than the median Indian worker within five years of graduation. A professor asks - "does that gap represent value created or value captured?"', 'What is your honest answer?', 'இந்தியாவில் உள்ள தலைசிறந்த MBA பட்டதாரிகள், பட்டம் பெற்ற ஐந்து ஆண்டுகளுக்குள் சராசரி இந்திய ஊழியரை விட 400 முதல் 600% வரை அதிகமாக சம்பாதிக்கிறார்கள் என்று ஓர் ஆய்வு கண்டறிந்துள்ளது. ஒரு பேராசிரியர் கேட்கிறார் - "அந்த இடைவெளி, உருவாக்கப்பட்ட மதிப்பையா அல்லது கைப்பற்றப்பட்ட மதிப்பையா குறிக்கிறது?"', 'உங்கள் நேர்மையான பதில் என்ன?',
     '{"theme": "The MBA & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Both - and the proportion varies by individual. A consultant who helps a company cut costs by laying off workers has captured value. An entrepreneur who builds a product that serves an unmet need has created it. The credential does not determine which one you become.', 'இரண்டுமே - மேலும் இதன் விகிதம் தனிநபரைப் பொறுத்து மாறுபடும். தொழிலாளர்களைப் பணிநீக்கம் செய்வதன் மூலம் ஒரு நிறுவனத்தின் செலவுகளைக் குறைக்க உதவும் ஆலோசகர், மதிப்பை ஈட்டியுள்ளார். பூர்த்தி செய்யப்படாத ஒரு தேவையைப் பூர்த்தி செய்யும் ஒரு பொருளை உருவாக்கும் தொழில்முனைவோர், அதனை உருவாக்கியுள்ளார். நீங்கள் எந்த வகையைச் சேர்ந்தவர் ஆவீர்கள் என்பதை உங்கள் தகுதி நிர்ணயிப்பதில்லை.'),
  (2, 'Mostly captured - high salaries in consulting and finance reflect the ability to sit close to where money moves, not the ability to generate new value in the world. The gap is a market distortion not a market signal.', 'பெரும்பாலும் புரிந்துகொள்ளக்கூடியதே - ஆலோசனை மற்றும் நிதித் துறைகளில் உள்ள அதிக சம்பளங்கள், உலகில் புதிய மதிப்பை உருவாக்கும் திறனைக் காட்டிலும், பணம் புழங்கும் இடத்திற்கு அருகில் அமர்ந்திருக்கும் திறனையே பிரதிபலிக்கின்றன. இந்த இடைவெளி ஒரு சந்தைச் சிதைவு, சந்தை சமிக்ஞை அல்ல.'),
  (3, 'The question assumes a fixed pie. If the companies MBA graduates lead grow faster, export more, and employ more people - the gap reflects genuine value creation at a system level even if it looks extractive at an individual level.', 'இந்தக் கேள்வி, சந்தைப் பங்கீடு நிலையானது என்ற அனுமானத்தின் அடிப்படையில் அமைந்துள்ளது. MBA பட்டதாரிகள் தலைமை தாங்கும் நிறுவனங்கள் வேகமாக வளர்ந்து, அதிகமாக ஏற்றுமதி செய்து, மேலும் பலருக்கு வேலைவாய்ப்பு அளித்தால், அந்த இடைவெளியானது தனிநபர் அளவில் சுரண்டலாகத் தோன்றினாலும், அமைப்பு மட்டத்தில் உண்மையான மதிப்பு உருவாக்கத்தையே பிரதிபலிக்கிறது.'),
  (4, 'The honest answer is I do not know yet. I will have a clearer view in ten years when I can look back at what I actually built, who benefited, and whether the gap felt earned.', 'உண்மையைச் சொல்வதானால், எனக்கு இன்னும் தெரியவில்லை. இன்னும் பத்து ஆண்டுகளில், நான் உண்மையில் என்ன உருவாக்கினேன், யார் பயனடைந்தார்கள், அந்த இடைவெளி நியாயமானதாக உணரப்பட்டதா என்பதைத் திரும்பிப் பார்க்கும்போது எனக்கு ஒரு தெளிவான பார்வை கிடைக்கும்.')
) AS v(ord, en, ta);

-- Survey set 3 #41
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India has had 14 general elections since 1952. Voter turnout has risen from 45% in the first election to over 67% in 2019 - one of the highest among large democracies. The United States rarely crosses 60%. A classmate says "higher turnout means healthier democracy." A professor pushes back.', 'Who is right?', '1952 முதல் இந்தியாவில் 14 பொதுத் தேர்தல்கள் நடந்துள்ளன. முதல் தேர்தலில் 45% ஆக இருந்த வாக்காளர் turnout, 2019-ல் 67%-க்கும் மேலாக உயர்ந்துள்ளது - இது பெரிய ஜனநாயக நாடுகளில் மிக உயர்ந்த turnout-களில் ஒன்றாகும். அமெரிக்காவில் இது அரிதாகவே 60%-ஐத் தாண்டுகிறது. ஒரு வகுப்புத் தோழன், "அதிக turnout என்றால் ஆரோக்கியமான ஜனநாயகம்" என்கிறான். ஒரு பேராசிரியர் அதை மறுக்கிறார்.', 'யார் சொல்வது சரி?',
     '{"theme": "Political Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The professor - turnout measures participation not quality. People can vote in large numbers for ethnic, communal, or clientelist reasons. Turnout and informed democratic choice are different things.', 'பேராசிரியர் கூறுகிறார், வாக்களிப்பு விகிதம் என்பது பங்கேற்பை அளவிடுவதல்ல, தரத்தையே அளவிடுகிறது. மக்கள் இன, சமூக அல்லது ஆதரவுக் காரணங்களுக்காகப் பெருமளவில் வாக்களிக்கலாம். வாக்களிப்பு விகிதமும், தகவலறிந்த ஜனநாயகத் தேர்வும் வெவ்வேறானவை.'),
  (2, 'The classmate - a democracy where citizens do not vote is a democracy in name only. Whatever the motivation, showing up is the foundation everything else is built on.', 'என் வகுப்புத் தோழனே - குடிமக்கள் வாக்களிக்காத ஜனநாயகம் என்பது பெயரளவுக்கு மட்டுமே ஜனநாயகம். நோக்கம் எதுவாக இருந்தாலும், வருகை தருவதுதான் மற்ற அனைத்தும் கட்டியெழுப்பப்படும் அடித்தளம்.'),
  (3, 'Both are partially right. High turnout is necessary but not sufficient. The question is whether voters have access to reliable information, genuine choice, and freedom from coercion - not just access to a ballot.', 'இருவருமே ஓரளவு சொல்வது சரிதான். அதிக வாக்குப்பதிவு அவசியம், ஆனால் அது மட்டுமே போதுமானதல்ல. வாக்காளர்களுக்கு வாக்குச்சீட்டு பெறும் வாய்ப்பு மட்டுமல்ல, நம்பகமான தகவல்கள், உண்மையான தேர்வுரிமை மற்றும் நிர்ப்பந்தத்திலிருந்து விடுதலை ஆகியவற்றுக்கான அணுகல் உள்ளதா என்பதே கேள்வி.'),
  (4, 'India''s rising turnout is partly driven by increased female participation and youth voting - both of which correlate with genuine democratic deepening. The number is not meaningless - it needs to be read in context.', 'இந்தியாவில் அதிகரித்து வரும் வாக்குப்பதிவுக்கு, பெண்களின் பங்கேற்பு மற்றும் இளைஞர்களின் வாக்குப்பதிவு அதிகரிப்பு ஆகியவை ஒரு பகுதிக் காரணமாகும். இவை இரண்டுமே உண்மையான ஜனநாயகம் ஆழமடைவதோடு தொடர்புடையவை. இந்த எண்ணிக்கை அர்த்தமற்றது அல்ல - இதைச் சூழலுடன் சேர்த்துப் பார்க்க வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 3 #42
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India''s informal economy employs approximately 90% of the workforce but contributes only 50% of GDP. Formal sector workers - roughly 10% of the workforce - generate the other 50%. A development economist says "India''s formalisation challenge is the single most important economic problem nobody is talking about."', 'As a future business leader what does this mean to you?', 'இந்தியாவின் முறைசாரா பொருளாதாரம், மொத்த தொழிலாளர் சக்தியில் ஏறக்குறைய 90% பேருக்கு வேலைவாய்ப்பு அளித்தாலும், மொத்த உள்நாட்டு உற்பத்தியில் 50% மட்டுமே பங்களிக்கிறது. முறைசார் துறைப் பணியாளர்கள் - அதாவது மொத்த தொழிலாளர் சக்தியில் சுமார் 10% பேர் - மீதமுள்ள 50% பங்களிப்பை அளிக்கின்றனர். "இந்தியாவின் முறைப்படுத்தல் சவால் என்பது, யாரும் பேசாத மிக முக்கியமான பொருளாதாரப் பிரச்சினையாகும்" என்று ஒரு வளர்ச்சிப் பொருளாதார நிபுணர் கூறுகிறார்.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், இது உங்களுக்கு என்ன அர்த்தம் தருகிறது?',
     '{"theme": "Economic Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means most of the people my business will interact with - vendors, contractors, customers - operate in a system with no safety net, no credit history, and no regulatory protection. That changes how I design partnerships and supply chains.', 'இதன் பொருள், எனது வணிகம் தொடர்பு கொள்ளும் பெரும்பாலான நபர்கள் - விற்பனையாளர்கள், ஒப்பந்தக்காரர்கள், வாடிக்கையாளர்கள் - எந்தவொரு பாதுகாப்பு வலையும், கடன் வரலாறும், ஒழுங்குமுறைப் பாதுகாப்பும் இல்லாத ஒரு அமைப்பில் இயங்குகிறார்கள். அது நான் கூட்டாண்மைகளையும் விநியோகச் சங்கிலிகளையும் வடிவமைக்கும் விதத்தை மாற்றுகிறது.'),
  (2, 'It means the tax base is narrower than the economy warrants. Ten percent of workers cannot sustainably fund the public infrastructure that 100% of citizens need. Formalisation is fundamentally a fiscal problem.', 'பொருளாதாரம் அனுமதிப்பதை விட வரி அடிப்படை குறுகியதாக உள்ளது என்பதே இதன் பொருள். 100 சதவீத குடிமக்களுக்கும் தேவைப்படும் பொது உள்கட்டமைப்பிற்கு, பத்து சதவீத தொழிலாளர்களால் நிலையான முறையில் நிதியளிக்க முடியாது. முறைப்படுத்துதல் என்பது அடிப்படையில் ஒரு நிதிப் பிரச்சினையாகும்.'),
  (3, 'It means productivity gains from the formal sector are not distributing into the broader economy. The gap between formal and informal wages is where inequality is manufactured - not in boardrooms but in the absence of formalisation.', 'முறைசார் துறையிலிருந்து கிடைக்கும் உற்பத்தித்திறன் ஆதாயங்கள் பரந்த பொருளாதாரத்தில் பரவுவதில்லை என்பதே இதன் பொருள். முறைசார் மற்றும் முறைசாரா ஊதியங்களுக்கு இடையிலான இடைவெளியில்தான் சமத்துவமின்மை உருவாக்கப்படுகிறது - அது நிர்வாகக் குழுக்களில் அல்ல, மாறாக முறைப்படுத்தல் இல்லாத நிலையில்தான்.'),
  (4, 'It means there is an enormous untapped market. Formalising one crore informal businesses creates banking customers, insurance buyers, and taxpayers simultaneously. The business opportunity and the policy solution are the same thing.', 'இதன் பொருள், பயன்படுத்தப்படாத ஒரு மாபெரும் சந்தை உள்ளது என்பதாகும். ஒரு கோடி முறைசாரா வணிகங்களை முறைப்படுத்துவது, ஒரே நேரத்தில் வங்கி வாடிக்கையாளர்கள், காப்பீட்டு வாங்குபவர்கள் மற்றும் வரி செலுத்துவோரை உருவாக்குகிறது. வணிக வாய்ப்பும் கொள்கைத் தீர்வும் ஒன்றே.')
) AS v(ord, en, ta);

-- Survey set 3 #43
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'Panchayati Raj institutions - gram panchayats, panchayat samitis, and zila parishads - were constitutionally mandated in 1992 to decentralise governance to the village level. Thirty years later most gram panchayats still depend on state governments for 90% of their funding and have limited decision-making authority. A former sarpanch tells your batch - "we were given responsibility without power."', 'What does this tell you?', 'கிராமப் பஞ்சாயத்துகள், பஞ்சாயத்து சமிதிகள் மற்றும் மாவட்டப் பரிஷத்துகள் போன்ற பஞ்சாயத்து ராஜ் அமைப்புகள், ஆட்சியை கிராம அளவில் பரவலாக்குவதற்காக 1992-ல் அரசியலமைப்பு ரீதியாக உருவாக்கப்பட்டன. முப்பது ஆண்டுகள் கழிந்த பின்னரும், பெரும்பாலான கிராமப் பஞ்சாயத்துகள் தங்களின் 90% நிதிக்கு மாநில அரசுகளையே சார்ந்துள்ளன; மேலும், அவை வரையறுக்கப்பட்ட முடிவெடுக்கும் அதிகாரத்தையே கொண்டுள்ளன. ஒரு முன்னாள் சர்பஞ்ச் உங்கள் குழுவிடம் கூறுகிறார் - "எங்களுக்கு அதிகாரம் இல்லாமல் பொறுப்பு வழங்கப்பட்டது."', 'இது உங்களுக்கு என்ன சொல்கிறது?',
     '{"theme": "Governance Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It tells me that decentralisation on paper and decentralisation in practice are completely different things. Political power does not devolve willingly - it has to be structurally forced down through funding autonomy.', 'காகிதத்தில் உள்ள அதிகாரப் பரவலாக்கமும் நடைமுறையில் உள்ள அதிகாரப் பரவலாக்கமும் முற்றிலும் வெவ்வேறானவை என்பதை இது எனக்கு உணர்த்துகிறது. அரசியல் அதிகாரம் தானாக முன்வந்து கைமாறுவதில்லை - அது நிதி சுயாட்சியின் மூலம் கட்டமைப்பு ரீதியாக வலுக்கட்டாயமாகத் திணிக்கப்பட வேண்டும்.'),
  (2, 'It tells me that the 73rd Amendment was a political compromise - enough to satisfy reformers, not enough to actually threaten the state-level power structures that fund and control local bodies.', '73வது திருத்தம் ஒரு அரசியல் சமரசம் என்பதை இது எனக்கு உணர்த்துகிறது - அது சீர்திருத்தவாதிகளைத் திருப்திப்படுத்தும் அளவுக்குப் போதுமானதாக இருந்தது, ஆனால் உள்ளாட்சி அமைப்புகளுக்கு நிதியளித்து அவற்றைக் கட்டுப்படுத்தும் மாநில அளவிலான அதிகாரக் கட்டமைப்புகளை உண்மையில் அச்சுறுத்தும் அளவுக்குப் போதுமானதாக இல்லை.'),
  (3, 'It tells me that the sarpanch''s problem is also every middle manager''s problem in a poorly designed organisation. Authority without resources produces accountability without agency - which is the definition of a broken system.', 'மோசமாக வடிவமைக்கப்பட்ட ஒரு நிறுவனத்தில், சர்பஞ்சின் பிரச்சினை என்பது ஒவ்வொரு இடைநிலை மேலாளரின் பிரச்சினையும் கூட என்பதை இது எனக்கு உணர்த்துகிறது. வளங்கள் இல்லாத அதிகாரம், செயல் திறன் இல்லாத பொறுப்புடைமையை உருவாக்குகிறது - இதுவே ஒரு சீர்கெட்ட அமைப்பின் வரையறையாகும்.'),
  (4, 'The solution is direct central funding to gram panchayats bypassing state governments - similar to how Smart City funds work. Change the money flow and the power flow follows.', 'ஸ்மார்ட் சிட்டி நிதிகள் செயல்படுவதைப் போலவே, மாநில அரசுகளைத் தவிர்த்து கிராமப் பஞ்சாயத்துகளுக்கு நேரடியாக மத்திய அரசு நிதி வழங்குவதே இதற்கான தீர்வு. பணப் புழக்கத்தை மாற்றினால், மின்சாரப் புழக்கமும் தானாகவே மாறும்.')
) AS v(ord, en, ta);

-- Survey set 3 #44
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India has the highest number of road accident deaths in the world - approximately 1.5 lakh people per year. That is one person every four minutes. A 2023 report found that 70% of these deaths are preventable through better road design, speed enforcement, and helmet compliance. A transport minister says "road safety is a public awareness problem." A traffic engineer says "it is an infrastructure problem."', 'Who is closer to the truth?', 'உலகிலேயே அதிக சாலை விபத்து மரணங்கள் இந்தியாவில்தான் நிகழ்கின்றன - ஆண்டுக்குச் சுமார் 1.5 லட்சம் பேர். அதாவது, ஒவ்வொரு நான்கு நிமிடங்களுக்கும் ஒருவர். மேம்பட்ட சாலை வடிவமைப்பு, வேகக் கட்டுப்பாடு மற்றும் தலைக்கவசம் அணிவதைக் கட்டாயமாக்குதல் ஆகியவற்றின் மூலம் இந்த மரணங்களில் 70%-ஐத் தடுக்க முடியும் என்று 2023-ஆம் ஆண்டு அறிக்கை ஒன்று கண்டறிந்துள்ளது. ஒரு போக்குவரத்து அமைச்சர், "சாலைப் பாதுகாப்பு என்பது ஒரு பொது விழிப்புணர்வுப் பிரச்சினை" என்கிறார். ஒரு போக்குவரத்துப் பொறியாளர், "இது ஒரு உள்கட்டமைப்புப் பிரச்சினை" என்கிறார்.', 'உண்மைக்கு மிக நெருக்கமானவர் யார்?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The engineer - awareness campaigns without physical infrastructure changes produce almost no reduction in fatalities. Rumble strips, median barriers, and pedestrian crossings save lives. Posters do not.', 'பொறியாளர் கூறுகிறார் - பௌதீக உள்கட்டமைப்பில் மாற்றங்கள் இல்லாத விழிப்புணர்வுப் பிரச்சாரங்கள், உயிரிழப்புகளைக் கிட்டத்தட்ட குறைப்பதில்லை. அதிர்வுப் பட்டைகள், மையத் தடுப்புகள் மற்றும் பாதசாரிகள் கடக்கும் இடங்கள் உயிர்களைக் காப்பாற்றுகின்றன. சுவரொட்டிகள் அவ்வாறு செய்வதில்லை.'),
  (2, 'Both matter but sequencing matters more. Infrastructure without compliance culture produces workarounds. Awareness without infrastructure produces guilt without change. They have to move together.', 'இரண்டுமே முக்கியமானவை, ஆனால் அவற்றை வரிசைப்படுத்துவது மிகவும் முக்கியம். இணக்கப் பண்பாடு இல்லாத உள்கட்டமைப்பு, மாற்று வழிகளையே உருவாக்கும். உள்கட்டமைப்பு இல்லாத விழிப்புணர்வு, மாற்றமில்லாத குற்றவுணர்வை உருவாக்கும். அவை இரண்டும் ஒன்றிணைந்து செயல்பட வேண்டும்.'),
  (3, 'The minister''s framing is politically convenient because awareness campaigns are cheap. Infrastructure is expensive and takes time. The framing choice reveals a priority choice.', 'விழிப்புணர்வுப் பிரச்சாரங்கள் மலிவானவை என்பதால், அமைச்சரின் இந்தக் கண்ணோட்டம் அரசியல் ரீதியாக வசதியானது. உள்கட்டமைப்புச் செலவுகள் அதிகம், மேலும் அதற்குக் காலமும் ஆகும். இந்தக் கண்ணோட்டத் தேர்வு ஒரு முன்னுரிமைத் தேர்வை வெளிப்படுத்துகிறது.'),
  (4, 'As a future business leader I think about this differently. 1.5 lakh deaths annually is a supply chain risk, an employee welfare issue, and a public health cost that businesses absorb invisibly. Road safety is not just a government problem.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில் நான் இதை வேறுவிதமாகச் சிந்திக்கிறேன். ஆண்டுக்கு 1.5 லட்சம் மரணங்கள் என்பது ஒரு விநியோகச் சங்கிலி இடர், ஒரு பணியாளர் நலப் பிரச்சினை, மற்றும் வணிகங்கள் கண்ணுக்குத் தெரியாமல் தாங்கிக்கொள்ளும் ஒரு பொது சுகாதாரச் செலவு ஆகும். சாலைப் பாதுகாப்பு என்பது வெறும் அரசாங்கப் பிரச்சினை மட்டுமல்ல.')
) AS v(ord, en, ta);

-- Survey set 3 #45
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'Narayan Murthy built Infosys from ₹10,000 borrowed from his wife to a $100 billion company. He recently said that young Indians should work 70 hours a week to help the country develop. The statement divided opinion sharply - celebrated by some, criticised by many.', 'What is your honest view?', 'நாராயண மூர்த்தி, தன் மனைவியிடம் கடனாகப் பெற்ற ₹10,000-ல் இருந்து இன்ஃபோசிஸை 100 பில்லியன் டாலர் நிறுவனமாக உருவாக்கினார். நாட்டின் வளர்ச்சிக்கு உதவ, இளம் இந்தியர்கள் வாரத்திற்கு 70 மணி நேரம் உழைக்க வேண்டும் என்று அவர் சமீபத்தில் கூறினார். இந்தக் கூற்று, சிலரால் கொண்டாடப்பட்டாலும், பலரால் விமர்சிக்கப்பட்டு, கருத்து வேறுபாடுகளைக் கடுமையாகப் பிளவுபடுத்தியது.', 'உங்கள் நேர்மையான கருத்து என்ன?',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The statement reflects a builder''s mindset from a different era. What worked when Infosys was being built in the 1980s - sacrifice, intensity, nation-building urgency - is not automatically the right prescription for a generation entering a different economy.', 'இந்தக் கூற்று, வேறொரு காலகட்டத்தைச் சேர்ந்த ஒரு கட்டமைப்பாளரின் மனநிலையைப் பிரதிபலிக்கிறது. 1980-களில் இன்ஃபோசிஸ் கட்டமைக்கப்பட்டபோது பலனளித்த தியாகம், தீவிர முயற்சி, தேசத்தைக் கட்டியெழுப்பும் அவசரம் போன்றவை, வேறுபட்ட பொருளாதாரத்திற்குள் நுழையும் ஒரு தலைமுறைக்குத் தானாகவே சரியான தீர்வாக அமைந்துவிடாது.'),
  (2, 'The criticism missed the point. He was making a case for national ambition not personal exploitation. The 70-hour framing was clumsy but the underlying challenge - India needs more intensity of productive effort - is legitimate.', 'அந்த விமர்சனம் விஷயத்தின் சாராம்சத்தைத் தவறவிட்டது. அவர் தனிப்பட்ட சுரண்டலுக்காக அல்ல, தேசிய லட்சியத்திற்காகவே வாதிட்டார். அந்த 70 மணி நேர வரையறை நேர்த்தியற்றதாக இருந்தாலும், ‘இந்தியாவுக்கு ஆக்கப்பூர்வமான முயற்சிகளின் தீவிரம் இன்னும் தேவை’ என்ற அதன் அடிப்படையான சவால் நியாயமானதே.'),
  (3, 'The problem with prescribing hours is that it confuses input with output. What India needs is not more hours of mediocre work - it is fewer hours of highly focused, high-quality work. Productivity and presence are not the same thing.', 'வேலை நேரங்களை நிர்ணயிப்பதில் உள்ள சிக்கல் என்னவென்றால், அது உள்ளீட்டையும் வெளியீட்டையும் குழப்புகிறது. இந்தியாவிற்குத் தேவையானது, அதிக மணிநேர சராசரி வேலை அல்ல; மாறாக, குறைந்த மணிநேர மிகுந்த கவனம் தேவைப்படும், உயர்தரமான வேலையே ஆகும். உற்பத்தித்திறனும் வேலையில் முழுமையாக ஈடுபடுவதும் ஒன்றல்ல.'),
  (4, 'A man who built enormous wealth telling people with far fewer resources to work harder without addressing the systems that reward hard work unequally is making a partial argument. The ambition is right. The missing half is structural reform.', 'பெரும் செல்வம் ஈட்டிய ஒருவர், கடின உழைப்புக்குச் சமமற்ற வெகுமதி அளிக்கும் அமைப்புகளைக் கவனத்தில் கொள்ளாமல், மிகக் குறைவான வளங்களைக் கொண்ட மக்களிடம் இன்னும் கடினமாக உழைக்குமாறு கூறுவது ஒரு பகுதி வாதத்தையே முன்வைக்கிறது. அவரது லட்சியம் சரியானதுதான். இதில் விடுபட்ட பாதி, கட்டமைப்புச் சீர்திருத்தம் ஆகும்.')
) AS v(ord, en, ta);

-- Survey set 3 #46
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India''s female labour force participation rate is approximately 24% - one of the lowest in the world and lower than Bangladesh, Nepal, and sub-Saharan Africa. Between 2005 and 2018 it actually fell as the economy grew. An economist says "India is getting richer while women are getting more economically invisible."', 'What explains this paradox?', 'இந்தியாவின் பெண் தொழிலாளர் பங்கேற்பு விகிதம் சுமார் 24% ஆகும் - இது உலகில் மிகக் குறைந்த விகிதங்களில் ஒன்றாகும், மேலும் வங்கதேசம், நேபாளம் மற்றும் சகாராவுக்கு தெற்கே உள்ள ஆப்பிரிக்காவை விடவும் குறைவாகும். 2005 மற்றும் 2018-க்கு இடையில் பொருளாதாரம் வளர்ந்தபோது, ​​இந்த விகிதம் உண்மையில் குறைந்தது. "இந்தியா செல்வந்தராகி வரும் வேளையில், பெண்கள் பொருளாதார ரீதியாக மேலும் கண்ணுக்குத் தெரியாதவர்களாகி வருகின்றனர்" என்று ஒரு பொருளாதார நிபுணர் கூறுகிறார்.', 'இந்த முரண்பாட்டை எது விளக்குகிறது?',
     '{"theme": "Gender Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Rising household incomes allow families to withdraw women from paid work as a status signal. Economic growth and female workforce participation can move in opposite directions when social norms reward withdrawal.', 'குடும்ப வருமானம் அதிகரிக்கும்போது, ​​ஒரு சமூக அந்தஸ்தின் அடையாளமாகப் பெண்களை ஊதியப் பணிகளிலிருந்து விலக்கிக்கொள்ள குடும்பங்கள் அனுமதிக்கின்றன. சமூக நெறிமுறைகள் இந்த விலகலை ஊக்குவிக்கும்போது, ​​பொருளாதார வளர்ச்சியும் பெண்களின் பணியிடப் பங்கேற்பும் எதிர் திசைகளில் செல்லக்கூடும்.'),
  (2, 'The jobs being created are not jobs women can safely access - long commutes, night shifts, male-dominated worksites, absent creche facilities. Supply of willing workers exists. Accessible demand does not.', 'உருவாக்கப்படும் வேலைகள் பெண்கள் பாதுகாப்பாக அணுகக்கூடியவை அல்ல - நீண்ட பயணங்கள், இரவுப் பணி, ஆண்கள் ஆதிக்கம் செலுத்தும் பணியிடங்கள், குழந்தைகள் காப்பக வசதிகள் இல்லாமை போன்றவை இதற்குக் காரணங்கள். விருப்பமுள்ள தொழிலாளர்களின் வழங்கல் உள்ளது. ஆனால், அதற்கான தேவை இருப்பதில்லை.'),
  (3, 'Education levels for women have risen significantly but the formal economy has not created roles that match those education levels in locations women can reach. The pipeline is filling but the exit is blocked.', 'பெண்களின் கல்வித் தரம் கணிசமாக உயர்ந்துள்ளது, ஆனால் முறைசார் பொருளாதாரம், பெண்கள் சென்றடையக்கூடிய இடங்களில், அந்தக் கல்வித் தரத்திற்குப் பொருத்தமான வேலை வாய்ப்புகளை உருவாக்கவில்லை. வாய்ப்புகள் நிரம்பி வழிகின்றன, ஆனால் வெளியேறும் வழி தடுக்கப்பட்டுள்ளது.'),
  (4, 'All three operate simultaneously and reinforce each other. No single intervention fixes this. It requires transport safety, childcare infrastructure, workplace culture change, and social norm evolution happening in parallel.', 'இந்த மூன்றும் ஒரே நேரத்தில் செயல்பட்டு, ஒன்றை ஒன்று வலுப்படுத்துகின்றன. எந்தவொரு தனிப்பட்ட தலையீடும் இதைச் சரிசெய்யாது. இதற்குப் போக்குவரத்துப் பாதுகாப்பு, குழந்தைப் பராமரிப்பு உள்கட்டமைப்பு, பணியிடக் கலாச்சார மாற்றம் மற்றும் சமூக நெறிப் பரிணாம வளர்ச்சி ஆகியவை இணையாக நிகழ வேண்டும்.')
) AS v(ord, en, ta);

-- Survey set 3 #47
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'Your company is about to launch a product in rural Tamil Nadu. Market research shows it will sell well. A field visit reveals that the product - a packaged snack - will likely replace a cheaper, more nutritious locally produced food that small farmers in the region depend on for income. The business case is strong. The social case is complicated.', 'What do you do?', 'உங்கள் நிறுவனம் தமிழ்நாட்டின் கிராமப்புறங்களில் ஒரு பொருளை அறிமுகப்படுத்த உள்ளது. சந்தை ஆய்வின்படி அது நன்றாக விற்பனையாகும் என்று தெரிகிறது. ஒரு களப் பயணத்தின்போது, ​​அப்பகுதி சிறு விவசாயிகள் தங்கள் வருமானத்திற்காகச் சார்ந்திருக்கும், மலிவான மற்றும் அதிக சத்து நிறைந்த உள்ளூர் உணவுக்குப் பதிலாக, பொட்டலமிடப்பட்ட சிற்றுண்டியான இந்தப் பொருள் வர வாய்ப்புள்ளது என்பது தெரியவந்துள்ளது. வணிக ரீதியாக இதன் தேவை வலுவாக உள்ளது. ஆனால், சமூக ரீதியாக இதன் தேவை சிக்கலானது.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Business & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Launch with full awareness of the tradeoff and invest a portion of revenues in the local agricultural ecosystem - source some ingredients locally, fund farmer cooperatives, offset the displacement deliberately.', 'சாதக பாதகங்களை முழுமையாக உணர்ந்து திட்டத்தைத் தொடங்குங்கள்; வருவாயின் ஒரு பகுதியை உள்ளூர் வேளாண் சூழல் அமைப்பில் முதலீடு செய்யுங்கள் - சில மூலப்பொருட்களை உள்ளூரிலேயே பெறுங்கள், விவசாயக் கூட்டுறவு சங்கங்களுக்கு நிதியுதவி அளியுங்கள், திட்டமிட்டு ஏற்படும் இடப்பெயர்வை ஈடுசெய்யுங்கள்.'),
  (2, 'Do not launch. A business that knowingly displaces small farmers and degrades nutrition outcomes in the communities it enters has failed at the most basic level of do no harm.', 'தொடங்காதீர்கள். சிறு விவசாயிகளைத் தெரிந்தே இடம்பெயரச் செய்து, தான் நுழையும் சமூகங்களில் ஊட்டச்சத்து நிலையைச் சீர்குலைக்கும் ஒரு வணிகம், ''தீங்கு விளைவிக்கக் கூடாது'' என்ற மிக அடிப்படையான மட்டத்தில்கூடத் தோல்வியடைந்துவிடுகிறது.'),
  (3, 'Launch - and trust that the market will self-correct. If the local product is genuinely better value, it will survive. Businesses are not responsible for the entire competitive ecosystem they enter.', 'அறிமுகப்படுத்துங்கள் - சந்தை தானாகவே சரிசெய்துகொள்ளும் என்று நம்புங்கள். உள்ளூர் தயாரிப்பு உண்மையாகவே சிறந்த மதிப்பை அளித்தால், அது நிலைத்து நிற்கும். வணிகங்கள் தாங்கள் நுழையும் முழுமையான போட்டிச் சூழலுக்கும் பொறுப்பல்ல.'),
  (4, 'Redesign the product to incorporate the locally produced ingredient as a core component - so that the launch creates demand for local produce rather than competing with it. Turn the tradeoff into a partnership.', 'உள்ளூரில் உற்பத்தி செய்யப்படும் மூலப்பொருளை ஒரு முக்கிய அங்கமாக இணைக்கும் வகையில் தயாரிப்பை மறுவடிவமைக்கவும் - இதன்மூலம், இந்த அறிமுகம் உள்ளூர் விளைபொருட்களுடன் போட்டியிடுவதற்குப் பதிலாக, அவற்றுக்கான தேவையை உருவாக்கும். இந்த சமரசத்தை ஒரு கூட்டாண்மையாக மாற்றுங்கள்.')
) AS v(ord, en, ta);

-- Survey set 3 #48
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'In the 2024 elections Tamil Nadu voted entirely for one political alliance while neighbouring states split their votes differently. Political analysts noted that Tamil identity, Dravidian ideology, and anti-BJP sentiment created one of the most unified state-level voting patterns in the country. A political scientist says "Tamil Nadu''s political cohesion is both its strength and its limitation in national politics."', 'What do you think?', '2024 தேர்தல்களில், அண்டை மாநிலங்கள் தங்களது வாக்குகளை வெவ்வேறு விதமாகப் பிரித்தளித்த வேளையில், தமிழ்நாடு முழுவதுமாக ஒரே அரசியல் கூட்டணிக்கு வாக்களித்தது. தமிழ் அடையாளம், திராவிட சித்தாந்தம் மற்றும் பாஜக எதிர்ப்பு உணர்வு ஆகியவை நாட்டிலேயே மிகவும் ஒருங்கிணைந்த மாநில அளவிலான வாக்குப்பதிவு முறைகளில் ஒன்றை உருவாக்கியதாக அரசியல் ஆய்வாளர்கள் குறிப்பிட்டனர். "தேசிய அரசியலில் தமிழ்நாட்டின் அரசியல் ஒருங்கிணைப்பு அதன் பலமாகவும் வரம்பாகவும் உள்ளது" என்று ஒரு அரசியல் விஞ்ஞானி கூறுகிறார்.', 'நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It is a strength - a unified bloc of 39 MPs has more negotiating power than a fragmented one. Tamil Nadu punches above its population weight in coalition politics precisely because of this cohesion.', 'இது ஒரு பலம் - சிதறடிக்கப்பட்ட அணியை விட, 39 நாடாளுமன்ற உறுப்பினர்களைக் கொண்ட ஒன்றுபட்ட அணிக்கு அதிக பேரம்பேசும் சக்தி உண்டு. இந்த ஒருங்கிணைப்பின் காரணமாகவே, கூட்டணி அரசியலில் தமிழகம் தனது மக்கள் தொகை பலத்திற்கு மீறிய தாக்கத்தை ஏற்படுத்துகிறது.'),
  (2, 'It is a limitation - a state that votes predictably gives the ruling national coalition no incentive to accommodate Tamil interests. Swing states get attention. Sure states get taken for granted.', 'இது ஒரு வரம்பு - கணிக்கக்கூடிய வகையில் வாக்களிக்கும் ஒரு மாநிலம், ஆளும் தேசியக் கூட்டணிக்குத் தமிழ் நலன்களுக்கு இடமளிக்க எந்த ஊக்கத்தையும் அளிப்பதில்லை. ஊசலாடும் மாநிலங்கள் கவனம் பெறுகின்றன. உறுதியான மாநிலங்கள் சாதாரணமாக எடுத்துக்கொள்ளப்படுகின்றன.'),
  (3, 'The cohesion reflects a genuine political identity not just tactical voting. Dravidian politics built a distinctive model of welfare, language rights, and social justice that Tamil voters have consistently defended across generations.', 'இந்த ஒருங்கிணைப்பு என்பது வெறும் தந்திரோபாய வாக்கெடுப்பையல்ல, அது ஒரு உண்மையான அரசியல் அடையாளத்தைப் பிரதிபலிக்கிறது. திராவிட அரசியல், நலவாழ்வு, மொழி உரிமைகள் மற்றும் சமூக நீதி ஆகியவற்றின் ஒரு தனித்துவமான மாதிரியை உருவாக்கியது; அதனைத் தலைமுறை தலைமுறையாகத் தமிழ் வாக்காளர்கள் தொடர்ந்து பாதுகாத்து வருகின்றனர்.'),
  (4, 'Political cohesion is only valuable if it translates into policy outcomes. The relevant question is not how Tamil Nadu votes but what Tamil Nadu gets for how it votes - and that accounting is worth doing honestly.', 'அரசியல் ஒற்றுமையானது கொள்கை முடிவுகளாக வெளிப்பட்டால் மட்டுமே அதற்கு மதிப்பு உண்டு. பொருத்தமான கேள்வி, தமிழகம் எப்படி வாக்களிக்கிறது என்பதல்ல; மாறாக, அந்த வாக்களிப்பின் மூலம் தமிழகம் என்ன பெறுகிறது என்பதேயாகும் - மேலும், அந்தக் கணக்கீட்டை நேர்மையாகச் செய்வது அவசியமாகும்.')
) AS v(ord, en, ta);

-- Survey set 3 #49
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India''s public education system enrolls 250 million children in government schools. Learning outcome surveys consistently show that a significant proportion of Class 5 students cannot read a Class 2 text. India spends approximately 2.9% of GDP on education - below the global average and well below the 6% recommended by the National Education Policy. A classmate says "we built a system that gets children into school but not one that actually teaches them."', 'Is he right?', 'இந்தியாவின் பொதுக் கல்வி முறையில் 25 கோடி குழந்தைகள் அரசுப் பள்ளிகளில் பயில்கின்றனர். ஐந்தாம் வகுப்பு மாணவர்களில் கணிசமான விகிதத்தினரால் இரண்டாம் வகுப்புப் பாடத்தைப் படிக்க இயலவில்லை என்பதை கற்றல் விளைவு ஆய்வுகள் தொடர்ந்து காட்டுகின்றன. இந்தியா தனது மொத்த உள்நாட்டு உற்பத்தியில் சுமார் 2.9%-ஐ கல்விக்காகச் செலவிடுகிறது - இது உலக சராசரியை விடவும், தேசியக் கல்விக் கொள்கையால் பரிந்துரைக்கப்பட்ட 6%-ஐ விடவும் மிகவும் குறைவாகும். ஒரு வகுப்புத் தோழன் கூறுகிறான், "நாம் குழந்தைகளைப் பள்ளிக்கு வரவைக்கும் ஒரு அமைப்பை உருவாக்கியுள்ளோம், ஆனால் அவர்களுக்கு உண்மையில் கற்பிக்கும் ஒன்றை அல்ல."', 'அவர் சொல்வது சரியா?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - enrolment was the metric governments optimised for because it is visible and measurable. Learning outcomes are harder to measure and politically inconvenient. We got what we measured.', 'ஆம் - மாணவர் சேர்க்கை என்பது கண்ணுக்குப் புலப்படக்கூடிய மற்றும் அளவிடக்கூடிய ஒரு அளவுகோல் என்பதால், அரசாங்கங்கள் அதனையே முதன்மைப்படுத்தின. கற்றல் விளைவுகளை அளவிடுவது கடினமானது மற்றும் அரசியல் ரீதியாகச் சங்கடமானது. நாம் எதை அளவினோமோ அதையே பெற்றோம்.'),
  (2, 'Partially - the learning crisis is concentrated in specific states and demographics. Tamil Nadu, Kerala, and Himachal Pradesh consistently outperform on learning outcomes. The problem is real but not uniform.', 'ஓரளவிற்கு - கற்றல் நெருக்கடியானது குறிப்பிட்ட மாநிலங்கள் மற்றும் மக்கள்தொகைக் குழுக்களில் குவிந்துள்ளது. தமிழ்நாடு, கேரளா மற்றும் இமாச்சலப் பிரதேசம் ஆகியவை கற்றல் விளைவுகளில் தொடர்ந்து சிறப்பாகச் செயல்படுகின்றன. இந்தப் பிரச்சினை உண்மையானது, ஆனால் சீரானது அல்ல.'),
  (3, 'The 2.9% spending figure is the core issue. You cannot build a high-quality mass education system at this investment level. The framing failure is treating education as a cost rather than the highest-return public investment available.', '2.9% செலவினம் என்பதே மையப் பிரச்சினை. இந்த முதலீட்டு அளவில் ஒரு உயர்தரமான வெகுஜனக் கல்வி முறையை உருவாக்க முடியாது. கல்வியை, கிடைக்கக்கூடிய பொது முதலீடுகளில் அதிக வருவாய் ஈட்டக்கூடிய ஒன்றாகக் கருதாமல், ஒரு செலவாகக் கருதுவதே இங்குள்ள கட்டமைப்புத் தோல்வியாகும்.'),
  (4, 'Teacher quality and accountability is the variable that matters most above everything else. Countries that have solved mass education quality - Finland, Singapore, South Korea - did it by making teaching the highest-status profession not the last resort.', 'மற்ற எல்லாவற்றையும் விட ஆசிரியரின் தரம் மற்றும் பொறுப்புக்கூறல் என்பதே மிகவும் முக்கியமான காரணியாகும். பொதுக் கல்வித் தரச் சிக்கலைத் தீர்த்த பின்லாந்து, சிங்கப்பூர், தென் கொரியா போன்ற நாடுகள், ஆசிரியப் பணியைக் கடைசிப் புகலிடமாகக் கருதாமல், அதை மிக உயர்ந்த அந்தஸ்து கொண்ட தொழிலாக ஆக்கியதன் மூலமே அதைச் சாதித்தன.')
) AS v(ord, en, ta);

-- Survey set 3 #50
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India''s judiciary has over 50 million pending cases. The Supreme Court alone has a backlog of 70,000 cases. Average time from filing to resolution in a civil matter is 10–15 years. A retired judge tells your batch - "a justice system where the poor cannot afford to wait and the rich can afford to delay has stopped being a justice system."', 'What does this mean for the businesses you will lead?', 'இந்திய நீதித்துறையில் 5 கோடிக்கும் அதிகமான வழக்குகள் நிலுவையில் உள்ளன. உச்ச நீதிமன்றத்தில் மட்டும் 70,000 வழக்குகள் தேங்கிக் கிடக்கின்றன. ஒரு உரிமையியல் வழக்கில், வழக்குத் தாக்கல் செய்வதிலிருந்து தீர்வு காணப்படுவதற்குச் சராசரியாக 10-15 ஆண்டுகள் ஆகின்றன. ஓய்வுபெற்ற நீதிபதி ஒருவர் உங்கள் குழுவிடம் கூறுகிறார் - "ஏழைகளால் காத்திருக்க முடியாத, பணக்காரர்களால் தாமதப்படுத்தக்கூடிய ஒரு நீதி அமைப்பு, அது ஒரு நீதி அமைப்பாக இருப்பதையே நிறுத்திவிட்டது."', 'நீங்கள் வழிநடத்தவிருக்கும் வணிகங்களுக்கு இது என்ன தாக்கத்தை ஏற்படுத்தும்?',
     '{"theme": "Governance & Accountability", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means contracts are only as strong as the relationships behind them in India. Legal enforcement is so slow that businesses build trust and relationship structures as substitutes for legal recourse.', 'இதன் பொருள், இந்தியாவில் ஒப்பந்தங்களின் வலிமை என்பது அவற்றின் பின்னணியில் உள்ள உறவுகளைப் பொறுத்தே அமைகிறது. சட்ட அமலாக்கம் மிகவும் மெதுவாக இருப்பதால், வணிகங்கள் சட்டப்பூர்வ தீர்வுகளுக்கு மாற்றாக நம்பிக்கை மற்றும் உறவுக் கட்டமைப்புகளை உருவாக்குகின்றன.'),
  (2, 'It means dispute resolution mechanisms - arbitration, mediation, conciliation - are not optional add-ons. They are the actual justice system that business runs on because the formal system has effectively exited the market.', 'இதன் பொருள், தகராறு தீர்க்கும் வழிமுறைகளான நடுவர் தீர்ப்பு, சமரசம், இணக்கம் போன்றவை விருப்பத் தேர்வாகச் சேர்க்கப்படும் அம்சங்கள் அல்ல. முறையான அமைப்பு சந்தையிலிருந்து திறம்பட வெளியேறிவிட்டதால், வணிகங்கள் இயங்குவதற்கு அடிப்படையாக விளங்கும் உண்மையான நீதி அமைப்பு இதுவே ஆகும்.'),
  (3, 'It means the cost of litigation falls disproportionately on smaller counterparties. A large company can tie a vendor in court for a decade. That power asymmetry shapes every contract negotiation.', 'இதன் பொருள், வழக்குச் செலவானது சிறிய தரப்பினர் மீது சமமற்ற முறையில் விழுகிறது. ஒரு பெரிய நிறுவனம், ஒரு விற்பனையாளரைப் பத்தாண்டுகளுக்கு நீதிமன்றத்தில் கட்டிப்போட முடியும். அந்த அதிகாரச் சமச்சீரின்மையே ஒவ்வொரு ஒப்பந்தப் பேச்சுவார்த்தையையும் வடிவமைக்கிறது.'),
  (4, 'It means I need to think about access to justice as part of my CSR framework - not just environmental and social metrics. A business that exploits judicial delay to avoid obligations is extracting value from a broken system.', 'எனது பெருநிறுவன சமூகப் பொறுப்புக் கட்டமைப்பின் ஒரு பகுதியாக, சுற்றுச்சூழல் மற்றும் சமூக அளவீடுகளை மட்டும் கருத்தில் கொள்ளாமல், நீதி கிடைப்பதற்கான அணுகலையும் நான் கருத்தில் கொள்ள வேண்டும் என்பதே இதன் பொருள். கடமைகளைத் தவிர்ப்பதற்காக நீதித்துறை தாமதத்தைச் சுரண்டும் ஒரு வணிகம், சீர்கெட்ட ஓர் அமைப்பிலிருந்து மதிப்பைப் பெறுகிறது.')
) AS v(ord, en, ta);

-- Survey set 3 #51
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'Kiran Mazumdar Shaw built Biocon from a garage in Bangalore with ₹10,000 in 1978 into India''s largest biopharmaceutical company. She faced banks that would not lend to a woman entrepreneur and a male-dominated industry that did not take her seriously. She has spoken publicly about each of those barriers. A young woman entrepreneur in your batch says "I am tired of hearing about barriers - I want to hear about systems that remove them."', 'What is your response?', 'கிரண் மஜும்தார் ஷா, 1978-ல் பெங்களூருவில் ஒரு கேரேஜில் ₹10,000 முதலீட்டில் இருந்து பயோகான் நிறுவனத்தை இந்தியாவின் மிகப்பெரிய உயிர் மருந்து நிறுவனமாக உருவாக்கினார். ஒரு பெண் தொழில்முனைவோருக்குக் கடன் வழங்க மறுத்த வங்கிகளையும், தன்னை மதிக்காத ஆண்களின் ஆதிக்கம் நிறைந்த தொழில்துறையையும் அவர் எதிர்கொண்டார். அந்தத் தடைகள் ஒவ்வொன்றைப் பற்றியும் அவர் பகிரங்கமாகப் பேசியுள்ளார். உங்கள் குழுவில் உள்ள ஒரு இளம் பெண் தொழில்முனைவோர், "தடைகளைப் பற்றிக் கேட்டு நான் சோர்வடைந்துவிட்டேன் - அவற்றை அகற்றும் வழிமுறைகளைப் பற்றிக் கேட்க விரும்புகிறேன்" என்கிறார்.', 'உங்கள் பதில் என்ன?',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She is right - barrier narratives without system solutions produce inspiration without change. The story of how Kiran succeeded despite the system is less useful than the story of what the system needs to become.', 'அவள் சொல்வது சரிதான் - அமைப்பு சார்ந்த தீர்வுகள் இல்லாத தடைக்கதைகள், மாற்றமில்லாத உத்வேகத்தையே அளிக்கின்றன. அமைப்பை மீறி கிரண் எப்படி வெற்றி பெற்றார் என்ற கதையை விட, அந்த அமைப்பு எப்படி மாற வேண்டும் என்ற கதையே அதிகப் பயனுள்ளது.'),
  (2, 'Both are necessary. You cannot build the will to change systems if people do not first understand what those systems cost real people. The barrier story is the case for the system story.', 'இரண்டுமே அவசியமானவை. அமைப்புகள் சாதாரண மக்களுக்கு என்ன செலவை ஏற்படுத்துகின்றன என்பதை மக்கள் முதலில் புரிந்து கொள்ளாவிட்டால், அமைப்புகளை மாற்றுவதற்கான மன உறுதியை உங்களால் உருவாக்க முடியாது. தடை பற்றிய கதையே அமைப்பு பற்றிய கதைக்கான சான்றாகும்.'),
  (3, 'The young entrepreneur''s frustration is itself data. When the people the system is failing are tired of hearing about the failure - that is a signal that the conversation has not been connected to action for too long.', 'இளம் தொழில்முனைவோரின் விரக்தியே ஒரு தரவு. ஒரு அமைப்பு தோல்வியடையச் செய்யும் மக்கள், அந்தத் தோல்வியைப் பற்றிக் கேட்பதைக் கேட்டுச் சோர்வடைந்தால், அந்த உரையாடல் நீண்ட காலமாகச் செயலுடன் இணைக்கப்படவில்லை என்பதற்கான ஒரு சமிக்ஞை அது.'),
  (4, 'Kiran''s story is not just about barriers - it is about what quality of product and persistence can overcome even broken systems. The system needs fixing and individuals still have to navigate it while it is being fixed. Both are true simultaneously.', 'கிரணின் கதை என்பது வெறும் தடைகளைப் பற்றியது மட்டுமல்ல - ஒரு பொருளின் தரமும் விடாமுயற்சியும் சீர்கெட்ட அமைப்புகளையும்கூட எப்படி வெல்ல முடியும் என்பதைப் பற்றியது. அந்த அமைப்பைச் சரிசெய்ய வேண்டும், அது சரிசெய்யப்படும்போதும் தனிநபர்கள் அதனுள் பயணிக்க வேண்டியுள்ளது. இந்த இரண்டுமே ஒரே நேரத்தில் உண்மையாகும்.')
) AS v(ord, en, ta);

-- Survey set 3 #52
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'A major Indian newspaper runs a front-page investigation exposing that a state government''s flagship welfare scheme has 30% ghost beneficiaries - people who exist on paper but not in reality. The government calls it politically motivated. The paper stands by its methodology. Three days later the story disappears from public discourse. A media professor says "investigative journalism in India has no second act."', 'What does that mean?', 'ஒரு முக்கிய இந்திய செய்தித்தாள், ஒரு மாநில அரசின் முதன்மை நலத்திட்டத்தில் 30% போலிப் பயனாளிகள் - அதாவது, காகிதத்தில் மட்டுமே இருக்கும், ஆனால் உண்மையில் இல்லாத நபர்கள் - இருப்பதை அம்பலப்படுத்தும் ஒரு புலனாய்வுக் கட்டுரையை முதல் பக்கத்தில் வெளியிட்டது. இதை அரசாங்கம் அரசியல் உள்நோக்கம் கொண்டது என்று கூறுகிறது. அந்தப் பத்திரிகை தனது ஆய்வு முறையை நியாயப்படுத்துகிறது. மூன்று நாட்களுக்குப் பிறகு, அந்தச் செய்தி பொது விவாதத்திலிருந்து மறைந்துவிடுகிறது. "இந்தியாவில் புலனாய்வு இதழியலுக்கு இரண்டாம் அங்கம் கிடையாது" என்று ஒரு ஊடகப் பேராசிரியர் கூறுகிறார்.', 'அதற்கு என்ன அர்த்தம்?',
     '{"theme": "Media & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means the story breaks but the accountability does not follow. Journalism surfaces the problem. Institutions - courts, legislatures, audit bodies - are supposed to take it from there. When they do not the story has nowhere to go.', 'இதன் பொருள், ஒரு செய்தி வெளிவருகிறது, ஆனால் அதற்கான பொறுப்புக்கூறல் அதனைத் தொடர்வதில்லை. பத்திரிகைத் துறை இந்தப் பிரச்சனையை வெளிக்கொணர்கிறது. நீதிமன்றங்கள், சட்டமன்றங்கள், தணிக்கை அமைப்புகள் போன்ற நிறுவனங்கள் அதன்பிறகு அந்தப் பொறுப்பை ஏற்க வேண்டும். அவை அவ்வாறு செய்யாதபோது, ​​அந்தச் செய்திக்குச் செல்வதற்கு வேறு வழியே இருப்பதில்லை.'),
  (2, 'It means attention is the scarcest resource in a high-noise media environment. A story needs sustained institutional follow-through to stay alive - and that requires editorial commitment that most publications cannot sustain commercially.', 'அதிக இரைச்சல் நிறைந்த ஊடகச் சூழலில் கவனம் என்பது மிகவும் அரிதான வளம் என்பதாகும். ஒரு செய்தி தொடர்ந்து நிலைத்திருக்க, அதற்கு நிறுவன ரீதியான தொடர்ச்சியான பின்தொடர்தல் தேவைப்படுகிறது - மேலும் அதற்குத் தேவைப்படும் தலையங்க அர்ப்பணிப்பை பெரும்பாலான வெளியீடுகளால் வணிக ரீதியாகத் தக்கவைத்துக் கொள்ள முடியாது.'),
  (3, 'It means the government''s "politically motivated" counter-narrative is often effective enough to muddy the water before the truth can settle. Denial is a time-buying strategy and it works.', 'இதன் பொருள் என்னவென்றால், உண்மை நிலைபெறுவதற்கு முன்பே நிலைமையைக் குழப்புவதற்கு, அரசாங்கத்தின் ''அரசியல் உள்நோக்கம் கொண்ட'' மாற்றுப் பார்வை பெரும்பாலும் போதுமான அளவு திறம்படச் செயல்படுகிறது. மறுத்தல் என்பது காலத்தை இழுத்தடிக்கும் ஒரு உத்தி, அது பலனளிக்கவும் செய்கிறது.'),
  (4, 'It means citizens need to demand follow-through - not just consume the initial story. A journalism ecosystem that produces investigations but not accountability is doing half the job. The other half requires an active citizenry.', 'இதன் பொருள், குடிமக்கள் ஆரம்பக்கட்ட செய்தியை மட்டும் நம்பாமல், அதன் தொடர் நடவடிக்கைகளையும் கோர வேண்டும் என்பதாகும். புலனாய்வுகளை உருவாக்கி, ஆனால் பொறுப்புக்கூறலை ஏற்படுத்தாத ஒரு பத்திரிகைச் சூழலானது, பாதி வேலையை மட்டுமே செய்கிறது. மற்ற பாதி வேலைக்கு ஒரு செயலூக்கமுள்ள குடிமக்கள் சமூகம் தேவைப்படுகிறது.')
) AS v(ord, en, ta);

-- Survey set 3 #53
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'Artificial intelligence is expected to automate 30% of tasks currently performed by knowledge workers within the next decade - including tasks performed by analysts, lawyers, accountants, and junior consultants.', 'As an MBA student about to enter one of these sectors, what is your honest response to that projection?', 'அடுத்த பத்தாண்டுகளுக்குள், ஆய்வாளர்கள், வழக்கறிஞர்கள், கணக்காளர்கள் மற்றும் இளநிலை ஆலோசகர்கள் உள்ளிட்ட அறிவுசார் பணியாளர்கள் தற்போது செய்துவரும் பணிகளில் 30 சதவீதத்தை செயற்கை நுண்ணறிவு தானியக்கமாக்கும் என எதிர்பார்க்கப்படுகிறது.', 'இந்தத் துறைகளில் ஒன்றில் நுழையவிருக்கும் ஒரு MBA மாணவர் என்ற முறையில், அந்தக் கணிப்புக்கு உங்கள் நேர்மையான பதில் என்ன?',
     '{"theme": "Future of Work", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'I am not worried about AI replacing me - I am thinking about how to be the person who decides what AI does and does not do in the organisations I lead. The threat is to people who use tools. The opportunity is for people who design systems.', 'செயற்கை நுண்ணறிவு என்னை இடமாற்றம் செய்துவிடும் என்று நான் கவலைப்படவில்லை - நான் தலைமை தாங்கும் நிறுவனங்களில், செயற்கை நுண்ணறிவு என்ன செய்ய வேண்டும், என்ன செய்யக்கூடாது என்பதைத் தீர்மானிக்கும் நபராக எப்படி இருப்பது என்றுதான் யோசித்துக்கொண்டிருக்கிறேன். கருவிகளைப் பயன்படுத்துபவர்களுக்குத்தான் அச்சுறுத்தல். அமைப்புகளை வடிவமைப்பவர்களுக்கே வாய்ப்பு இருக்கிறது.'),
  (2, 'I am genuinely uncertain and I think pretending otherwise is dishonest. The projection may be wrong - but betting my career on it being wrong without a contingency plan is a risk I am not comfortable with.', 'எனக்கு உண்மையிலேயே உறுதியில்லை, மேலும் அப்படி இல்லை என்று பாசாங்கு செய்வது நேர்மையற்றது என நான் நினைக்கிறேன். அந்தக் கணிப்பு தவறாக இருக்கலாம் - ஆனால், ஒரு மாற்றுத் திட்டம் இல்லாமல், அது தவறாகும் என்று என் தொழில் வாழ்க்கையையே பணயம் வைப்பது என்பது நான் விரும்பாத ஒரு ஆபத்து.'),
  (3, 'The 30% figure refers to tasks not jobs. Every job is a bundle of tasks. AI will change what I spend my time on - not whether I have a job. The people who adapt their task mix fastest will be fine.', 'அந்த 30% என்பது பணிகளைக் குறிக்கிறது, வேலைகளை அல்ல. ஒவ்வொரு வேலையும் பல பணிகளின் தொகுப்பாகும். செயற்கை நுண்ணறிவு நான் என் நேரத்தை எதில் செலவிடுகிறேன் என்பதை மாற்றும், எனக்கு வேலை இருக்கிறதா என்பதை அல்ல. தங்கள் பணிக் கலவையை மிக வேகமாக மாற்றியமைத்துக் கொள்பவர்கள் நலமாக இருப்பார்கள்.'),
  (4, 'My response is to build skills that AI cannot replicate in the near term - judgment under ambiguity, relationship navigation, ethical reasoning, and the ability to ask the right question before trying to answer it.', 'குறுகிய காலத்தில் செயற்கை நுண்ணறிவால் பிரதிபலிக்க முடியாத திறன்களை வளர்ப்பதே எனது பதில் - அதாவது, தெளிவற்ற சூழலில் முடிவெடுக்கும் திறன், உறவுகளைக் கையாளுதல், அறநெறி சார்ந்த பகுத்தறிவு, மற்றும் ஒரு கேள்விக்குப் பதிலளிக்க முயற்சிக்கும் முன் சரியான கேள்வியைக் கேட்கும் திறன் போன்றவை.')
) AS v(ord, en, ta);

-- Survey set 3 #54
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India generates approximately 62 million tonnes of solid waste per year. Less than 20% is scientifically processed. The rest goes to open dumps, rivers, and informal settlements. A waste management entrepreneur tells your batch - "India''s garbage crisis is a ₹1 lakh crore business opportunity that nobody wants to touch because the margins are invisible until the scale is enormous."', 'What is your response?', 'இந்தியா ஆண்டுக்குச் சுமார் 62 மில்லியன் டன் திடக்கழிவுகளை உருவாக்குகிறது. அதில் 20%க்கும் குறைவாகவே அறிவியல் பூர்வமாகப் பதப்படுத்தப்படுகிறது. மீதமுள்ளவை திறந்தவெளி குப்பைக் கிடங்குகள், ஆறுகள் மற்றும் முறைசாரா குடியிருப்புகளுக்குச் செல்கின்றன. ஒரு கழிவு மேலாண்மை தொழில்முனைவோர் உங்கள் குழுவிடம் கூறுகிறார் - "இந்தியாவின் குப்பை நெருக்கடி என்பது ₹1 லட்சம் கோடி மதிப்பிலான ஒரு வணிக வாய்ப்பாகும். அதன் அளவு பிரம்மாண்டமாக மாறும் வரை லாப வரம்புகள் கண்ணுக்குத் தெரியாததால், அதை யாரும் தொட விரும்புவதில்லை."', 'உங்கள் பதில் என்ன?',
     '{"theme": "Environment & Business", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She is describing every infrastructure business in India''s history. Power, telecom, roads - all looked unattractive until someone built the scale. Waste management is the next one.', 'அவர் இந்திய வரலாற்றில் உள்ள ஒவ்வொரு உள்கட்டமைப்புத் தொழிலையும் விவரிக்கிறார். மின்சாரம், தொலைத்தொடர்பு, சாலைகள் - இவை அனைத்தும், யாரோ ஒருவர் அவற்றை பெரிய அளவில் உருவாக்கும் வரை கவர்ச்சியற்றவையாகவே தோன்றின. அடுத்ததாக வரவிருப்பது கழிவு மேலாண்மை.'),
  (2, 'The margin problem is real and it will not solve itself. This is where policy intervention - gate fees, extended producer responsibility, landfill taxes - needs to make the economics work before private capital will move.', 'இலாப வரம்புப் பிரச்சினை உண்மையானது, அது தானாகவே தீர்ந்துவிடாது. தனியார் மூலதனம் இடம்பெயர்வதற்கு முன்பு, நுழைவுக் கட்டணங்கள், விரிவுபடுத்தப்பட்ட உற்பத்தியாளர் பொறுப்பு, குப்பைக் கிடங்கு வரிகள் போன்ற கொள்கைத் தலையீடுகள் பொருளாதாரத்தைச் செயல்பட வைக்க வேண்டிய இடம் இதுதான்.'),
  (3, 'The opportunity is real but the execution risk is enormous. Waste management requires municipal contracts, land, community relations, and regulatory navigation simultaneously. It is not a startup - it is a decades-long institution-building exercise.', 'வாய்ப்பு உண்மையானது, ஆனால் அதைச் செயல்படுத்துவதில் உள்ள இடர் மிகப்பெரியது. கழிவு மேலாண்மைக்கு நகராட்சி ஒப்பந்தங்கள், நிலம், சமூக உறவுகள் மற்றும் ஒழுங்குமுறைகளை வழிநடத்துதல் ஆகியவை ஒரே நேரத்தில் தேவைப்படுகின்றன. இது புதிதாகத் தொடங்கும் ஒன்றல்ல - இது பல பத்தாண்டுகள் நீடிக்கும் ஒரு நிறுவனக் கட்டமைப்புப் பணியாகும்.'),
  (4, 'As a future business leader I think about this differently - not as a waste management business but as a resource recovery business. The framing changes the margin structure. Waste is misclassified raw material.', 'ஒரு வருங்கால வணிகத் தலைவராக, நான் இதை ஒரு கழிவு மேலாண்மை வணிகமாக அல்லாமல், ஒரு வள மீட்பு வணிகமாக வித்தியாசமாகப் பார்க்கிறேன். இந்தக் கண்ணோட்டம் லாப வரம்புக் கட்டமைப்பை மாற்றுகிறது. கழிவு என்பது தவறாக வகைப்படுத்தப்பட்ட மூலப்பொருள் ஆகும்.')
) AS v(ord, en, ta);

-- Survey set 3 #55
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India''s top 1% of earners hold approximately 40% of national wealth. The bottom 50% hold 3%. A Oxfam report noted that the combined wealth of India''s 100 richest people is enough to fund the entire Union Budget for 18 months. A classmate says "inequality at this level is not just a moral problem - it is a stability problem."', 'Do you agree?', 'இந்தியாவில் அதிக வருமானம் ஈட்டும் முதல் 1% பேர், நாட்டின் மொத்த செல்வத்தில் ஏறக்குறைய 40%-ஐக் கொண்டுள்ளனர். கீழ்மட்டத்தில் உள்ள 50% பேர் 3%-ஐக் கொண்டுள்ளனர். இந்தியாவின் 100 பெரும் பணக்காரர்களின் மொத்தச் செல்வம், 18 மாதங்களுக்கான முழு மத்திய பட்ஜெட்டிற்கும் நிதியளிக்கப் போதுமானது என்று ஆக்ஸ்பாம் அறிக்கை ஒன்று குறிப்பிட்டது. ஒரு வகுப்புத் தோழன், "இந்த அளவிலான ஏற்றத்தாழ்வு என்பது ஒரு தார்மீகப் பிரச்சினை மட்டுமல்ல - அது ஒரு நிலைத்தன்மைப் பிரச்சினை" என்று கூறுகிறான்.', 'நீங்கள் ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - extreme concentration of wealth hollows out the middle class, reduces consumer demand, and produces political instability as people without economic voice look for other ways to be heard.', 'ஆம் - செல்வம் அதீதமாகக் குவிவது நடுத்தர வர்க்கத்தைச் சிதைக்கிறது, நுகர்வோர் தேவையைக் குறைக்கிறது, மேலும் பொருளாதாரக் குரலற்ற மக்கள் தங்கள் குரல் கேட்கப்பட மற்ற வழிகளைத் தேடுவதால் அரசியல் ஸ்திரமின்மையையும் உருவாக்குகிறது.'),
  (2, 'The wealth concentration figures are real but the stability argument is overstated for India specifically. India has managed extreme inequality for decades without the political ruptures that similar distributions produced elsewhere.', 'செல்வக் குவிப்புப் புள்ளிவிவரங்கள் உண்மையானவை, ஆனால் ஸ்திரத்தன்மை குறித்த வாதம் குறிப்பாக இந்தியாவைப் பொறுத்தவரை மிகைப்படுத்தப்பட்டுள்ளது. மற்ற இடங்களில் இதே போன்ற பகிர்வுகள் உருவாக்கிய அரசியல் பிளவுகள் எதுவுமின்றி, இந்தியா பல தசாப்தங்களாகக் கடுமையான ஏற்றத்தாழ்வைச் சமாளித்து வந்துள்ளது.'),
  (3, 'The more relevant question is mobility not concentration. A society where the bottom 50% can realistically move upward tolerates inequality better than one where the distribution is fixed. India''s mobility story is more important than its snapshot.', 'மிகவும் பொருத்தமான கேள்வி குவிதல் அல்ல, நகர்வுத்தன்மையே ஆகும். சமூகப் பங்கீடு நிலையாக இருக்கும் ஒரு சமூகத்தை விட, கீழ்மட்ட 50% மக்களால் யதார்த்தமாக மேல்நோக்கி நகரக்கூடிய ஒரு சமூகம், சமத்துவமின்மையை சிறப்பாகப் பொறுத்துக்கொள்கிறது. இந்தியாவின் ஒரு கணநேரப் படத்தை விட, அதன் நகர்வுத்தன்மை குறித்த வரலாறு மிகவும் முக்கியமானது.'),
  (4, 'As a future business leader this tells me that businesses built on serving only the top 20% are building on a shrinking political foundation. The businesses of the next decade need the other 80% to work - economically and politically.', 'ஒரு வருங்கால வணிகத் தலைவராக, மேல்தட்டு 20% மக்களுக்கு மட்டுமே சேவை செய்வதன் அடிப்படையில் கட்டமைக்கப்படும் வணிகங்கள், சுருங்கிவரும் ஒரு அரசியல் அடித்தளத்தின் மீதுதான் கட்டப்படுகின்றன என்பதை இது எனக்கு உணர்த்துகிறது. அடுத்த பத்தாண்டுகளின் வணிகங்களுக்கு, பொருளாதார ரீதியாகவும் அரசியல் ரீதியாகவும் மற்ற 80% மக்களின் பங்களிப்பு தேவைப்படுகிறது.')
) AS v(ord, en, ta);

-- Survey set 3 #56
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'Your company is considering setting up a manufacturing facility in a district that ranks in the bottom 10% on human development indicators - poor health infrastructure, low literacy, high unemployment. The government is offering significant tax incentives. A board member says "we are not going there to fix the district - we are going for the incentives." Another says "if we go there we have a responsibility that goes beyond the incentives."', 'Who do you agree with?', 'மனித மேம்பாட்டுக் குறியீடுகளில் கீழ்மட்ட 10%-இல் உள்ள ஒரு மாவட்டத்தில் (மோசமான சுகாதார உள்கட்டமைப்பு, குறைந்த எழுத்தறிவு, அதிக வேலையின்மை) உங்கள் நிறுவனம் ஒரு உற்பத்தி ஆலையை அமைக்கப் பரிசீலித்து வருகிறது. அரசாங்கம் கணிசமான வரிச் சலுகைகளை வழங்குகிறது. ஒரு நிர்வாகக் குழு உறுப்பினர், "நாங்கள் அந்த மாவட்டத்தைச் சரிசெய்ய அங்கு செல்லவில்லை - சலுகைகளுக்காகவே செல்கிறோம்" என்கிறார். மற்றொருவர், "நாம் அங்கு சென்றால், அந்தச் சலுகைகளையும் தாண்டிய ஒரு பொறுப்பு நமக்கு இருக்கிறது" என்கிறார்.', 'நீங்கள் யாருடன் உடன்படுகிறீர்கள்?',
     '{"theme": "Social Responsibility", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The second board member - not because it is morally required but because it is strategically correct. A facility in a low-development district will fail if it does not invest in the ecosystem around it. Self-interest and responsibility point in the same direction.', 'இரண்டாவது நிர்வாகக் குழு உறுப்பினர் - அது தார்மீகக் கடமை என்பதற்காக அல்ல, மாறாக வியூக ரீதியாகச் சரியானது என்பதால். வளர்ச்சி குன்றிய மாவட்டத்தில் உள்ள ஒரு நிறுவனம், தன்னைச் சுற்றியுள்ள சூழல் அமைப்பில் முதலீடு செய்யாவிட்டால் தோல்வியடையும். சுயநலமும் பொறுப்புணர்வும் ஒரே திசையை நோக்கியே செல்கின்றன.'),
  (2, 'The first board member is being honest in a way the second is not. Most location decisions are driven by incentives. Pretending otherwise produces CSR theatre rather than genuine community investment.', 'இரண்டாவது உறுப்பினர் இல்லாத விதத்தில் முதல் வாரிய உறுப்பினர் நேர்மையாக இருக்கிறார். பெரும்பாலான இடத் தேர்வுகள் சலுகைகளால் உந்தப்படுகின்றன. இதற்கு மாறாகப் பாசாங்கு செய்வது, உண்மையான சமூக முதலீட்டிற்குப் பதிலாக பெருநிறுவன சமூகப் பொறுப்பு (CSR) சார்ந்த நாடகத்தையே உருவாக்குகிறது.'),
  (3, 'Both are right about different things. Go for the incentives - that is rational. But once you are there the responsibility is real and unavoidable. The question is not whether to take it seriously but how.', 'வெவ்வேறு விஷயங்களில் இருவருமே சொல்வது சரிதான். சலுகைகளை நாடுங்கள் - அது பகுத்தறிவுக்கு உகந்தது. ஆனால் ஒருமுறை அந்தப் பொறுப்பில் நுழைந்துவிட்டால், பொறுப்பு என்பது உண்மையானது மற்றும் தவிர்க்க முடியாதது. அதைச் sérieux ஆக எடுத்துக்கொள்வதா வேண்டாமா என்பதல்ல கேள்வி, எப்படி எடுத்துக்கொள்வதே என்பதுதான்.'),
  (4, 'The board conversation itself is the problem. A company that has not worked out its relationship with the communities it enters before it enters them will improvise badly under pressure. This should be a policy decision not a board debate.', 'இயக்குநர் குழுவின் உரையாடலே பிரச்சினை. ஒரு நிறுவனம், தான் நுழையும் சமூகங்களுடனான உறவை, அங்கு நுழைவதற்கு முன்பே முறையாகப் புரிந்துகொள்ளவில்லை என்றால், அது அழுத்தத்தின் கீழ் மோசமாகத் தன்னிச்சையாகச் செயல்படும். இது ஒரு கொள்கை முடிவாக இருக்க வேண்டுமே தவிர, இயக்குநர் குழு விவாதமாக இருக்கக்கூடாது.')
) AS v(ord, en, ta);

-- Survey set 3 #57
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India''s UPI processed 14,000 crore transactions worth ₹200 lakh crore in 2023 - more digital payment transactions than the United States, United Kingdom, and Germany combined. It was built by NPCI - a non-profit - in partnership with the government and is offered to users at zero cost. A tech entrepreneur says "UPI is the best product the Indian government has ever built."', 'Is he right?', 'இந்தியாவின் யுபிஐ, 2023-ஆம் ஆண்டில் ₹200 லட்சம் கோடி மதிப்புள்ள 14,000 கோடி பரிவர்த்தனைகளைச் செயல்படுத்தியது - இது அமெரிக்கா, ஐக்கிய இராச்சியம் மற்றும் ஜெர்மனி ஆகிய நாடுகளின் மொத்த பரிவர்த்தனைகளை விட அதிகமான டிஜிட்டல் பணப் பரிவர்த்தனைகளாகும். இது, ஒரு இலாப நோக்கற்ற அமைப்பான NPCI-ஆல் அரசாங்கத்துடன் இணைந்து உருவாக்கப்பட்டது மற்றும் பயனர்களுக்கு எந்தக் கட்டணமும் இன்றி வழங்கப்படுகிறது. ஒரு தொழில்நுட்ப தொழில்முனைவோர், "இந்திய அரசாங்கம் இதுவரை உருவாக்கியதிலேயே யுபிஐ தான் சிறந்த தயாரிப்பு" என்கிறார்.', 'அவர் சொல்வது சரியா?',
     '{"theme": "Governance & Technology", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'He may be right - and the model it represents is more important than the product itself. A public digital infrastructure layer offered at zero cost that private innovation builds on top of is a governance design worth studying.', 'அவர் சொல்வது சரியாக இருக்கலாம் - மேலும், அந்தப் பொருளை விட அது பிரதிநிதித்துவப்படுத்தும் மாதிரியே மிகவும் முக்கியமானது. பூஜ்ஜிய செலவில் வழங்கப்படும் ஒரு பொது டிஜிட்டல் உள்கட்டமைப்பு அடுக்கின் மீது தனியார் புத்தாக்கம் கட்டமைக்கப்படுவது, ஆய்வு செய்யத் தகுந்த ஒரு ஆளுகை வடிவமைப்பு ஆகும்.'),
  (2, 'Aadhaar, GSTN, and DigiLocker are comparable achievements. UPI is the most visible but India''s digital public infrastructure stack as a whole is the real achievement - not any single product.', 'ஆதார், ஜிஎஸ்டிஎன் மற்றும் டிஜிலாக்கர் ஆகியவை ஒப்பிடத்தக்க சாதனைகளாகும். யுபிஐ மிகவும் வெளிப்படையாகத் தெரிந்தாலும், இந்தியாவின் டிஜிட்டல் பொது உள்கட்டமைப்புக் கட்டமைப்பு ஒட்டுமொத்தமாகவே உண்மையான சாதனையாகும் – எந்தவொரு தனிப்பட்ட தயாரிப்பும் அல்ல.'),
  (3, 'The zero-cost model is also a vulnerability. UPI''s scale has made it critical infrastructure but its revenue model does not sustain the investment needed to maintain and evolve it at global scale.', 'செலவில்லா மாதிரியும் ஒரு பலவீனமாகும். யுபிஐ-யின் அளவு அதனை ஒரு முக்கிய உள்கட்டமைப்பாக மாற்றியுள்ளது, ஆனால் அதன் வருவாய் மாதிரியானது, உலகளாவிய அளவில் அதனைப் பராமரிக்கவும் மேம்படுத்தவும் தேவையான முதலீட்டைத் தாங்குவதில்லை.'),
  (4, 'The more important question is what comes next. UPI solved payments. The same model applied to health records, land registry, and credit assessment could be transformative. The product matters less than the template.', 'அடுத்து என்ன என்பதுதான் மிக முக்கியமான கேள்வி. யுபிஐ பணம் செலுத்தும் சிக்கலைத் தீர்த்தது. இதே மாதிரியை சுகாதாரப் பதிவுகள், நிலப் பதிவேடு மற்றும் கடன் மதிப்பீடு ஆகியவற்றிற்குப் பயன்படுத்தினால், அது ஒரு பெரும் மாற்றத்தை ஏற்படுத்தக்கூடும். தயாரிப்பை விட வார்ப்புருவே முக்கியமானது.')
) AS v(ord, en, ta);

-- Survey set 3 #58
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'A very successful Indian businessman is widely known in industry circles to have built his first venture using connections that gave him unfair access to government contracts in the 1990s. He has since built a legitimate and genuinely impressive conglomerate. He mentors young entrepreneurs, funds scholarships, and is generous with his time. A young entrepreneur asks you - "should I take his mentorship?"', 'What do you say?', 'மிகவும் வெற்றிகரமான ஒரு இந்திய தொழிலதிபர், 1990-களில் தனக்குக் கிடைத்த தொடர்புகளின் மூலம் அரசாங்க ஒப்பந்தங்களை முறையற்ற விதத்தில் அணுகும் வாய்ப்பை ஏற்படுத்திக் கொடுத்து, தனது முதல் தொழிலை உருவாக்கினார் என்று தொழில் வட்டாரங்களில் பரவலாக அறியப்படுகிறார். அதன் பிறகு, அவர் முறையான மற்றும் உண்மையிலேயே ஈர்க்கக்கூடிய ஒரு பெருநிறுவனத்தைக் கட்டியெழுப்பியுள்ளார். அவர் இளம் தொழில்முனைவோருக்கு வழிகாட்டுகிறார், கல்வி உதவித்தொகைகளுக்கு நிதியளிக்கிறார், மேலும் தனது நேரத்தை தாராளமாகச் செலவிடுகிறார். ஒரு இளம் தொழில்முனைவோர் உங்களிடம் கேட்கிறார் - "நான் அவருடைய வழிகாட்டுதலை ஏற்றுக்கொள்ளலாமா?"', 'நீங்கள் என்ன சொல்கிறீர்கள்?',
     '{"theme": "Leadership & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - learn everything he knows about building businesses and make your own ethical choices independently. His past does not contaminate his knowledge. Separate the lessons from the history.', 'ஆம் - வணிகங்களை உருவாக்குவது பற்றி அவருக்குத் தெரிந்த அனைத்தையும் கற்றுக்கொண்டு, உங்கள் சொந்த அறநெறி சார்ந்த தேர்வுகளைச் சுதந்திரமாக மேற்கொள்ளுங்கள். அவருடைய கடந்த காலம் அவருடைய அறிவைக் களங்கப்படுத்தாது. வரலாற்றிலிருந்து பாடங்களைப் பிரித்தறியுங்கள்.'),
  (2, 'Think carefully - mentorship is also a signal about whose network you are entering and whose legitimacy you are borrowing. In India''s business ecosystem, association is not neutral.', 'கவனமாகச் சிந்தியுங்கள் - வழிகாட்டுதல் என்பது, நீங்கள் யாருடைய வலையமைப்பிற்குள் நுழைகிறீர்கள் மற்றும் யாருடைய நம்பகத்தன்மையை நீங்கள் கடன் வாங்குகிறீர்கள் என்பதற்கான ஒரு சமிக்ஞையும் கூட. இந்தியாவின் வணிகச் சூழலில், தொடர்பு என்பது நடுநிலையானதல்ல.'),
  (3, 'The question answers itself differently depending on what you want from him. If you want business knowledge - take it. If you want a role model - look elsewhere. You do not have to collapse the two.', 'அவரிடமிருந்து நீங்கள் என்ன விரும்புகிறீர்கள் என்பதைப் பொறுத்து, இந்தக் கேள்விக்கே வெவ்வேறு பதில்கள் கிடைக்கும். உங்களுக்கு வணிக அறிவு வேண்டுமென்றால், அதை எடுத்துக்கொள்ளுங்கள். உங்களுக்கு ஒரு முன்மாதிரி வேண்டுமென்றால், வேறு இடத்தைத் தேடுங்கள். நீங்கள் இரண்டையும் ஒன்றாகக் குழப்பிக்கொள்ள வேண்டிய அவசியமில்லை.'),
  (4, 'Ask him directly about the early contracts. How he responds will tell you more about whether to trust his mentorship than anything else he has built since.', 'ஆரம்பகால ஒப்பந்தங்களைப் பற்றி அவரிடம் நேரடியாகக் கேளுங்கள். அவர் அதற்குப் பதிலளிக்கும் விதம், அதன் பிறகு அவர் உருவாக்கிய மற்ற எதையும் விட, அவரது வழிகாட்டுதலை நம்பலாமா வேண்டாமா என்பதை உங்களுக்கு அதிகமாக உணர்த்தும்.')
) AS v(ord, en, ta);

-- Survey set 3 #59
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'India has approximately 63 million MSMEs employing over 110 million people - more than any other sector including agriculture. Yet MSMEs receive less than 20% of formal credit from the banking system and pay interest rates 4–6% higher than large corporates for equivalent risk profiles. A banker says "MSMEs are too risky to lend to cheaply." An economist says "MSMEs are too important to leave underfinanced."', 'Who is right?', 'இந்தியாவில் சுமார் 63 மில்லியன் குறு, சிறு மற்றும் நடுத்தர நிறுவனங்கள் (MSMEs) உள்ளன. இவை 110 மில்லியனுக்கும் அதிகமான மக்களுக்கு வேலைவாய்ப்பு அளிக்கின்றன - இது விவசாயம் உட்பட வேறு எந்தத் துறையையும் விட அதிகம். இருந்தபோதிலும், இந்த நிறுவனங்கள் வங்கி அமைப்பிலிருந்து 20%க்கும் குறைவான முறையான கடனையே பெறுகின்றன. மேலும், சமமான இடர் சுயவிவரங்களுக்கு, பெரிய பெருநிறுவனங்களை விட 4-6% அதிக வட்டி விகிதங்களைச் செலுத்துகின்றன. ஒரு வங்கியாளர், "குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களுக்கு மலிவாகக் கடன் கொடுப்பது மிகவும் அபாயகரமானது" என்கிறார். ஒரு பொருளாதார நிபுணர், "குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களுக்குப் போதுமான நிதி இல்லாமல் விட்டுவிட முடியாத அளவுக்கு அவை மிக முக்கியமானவை" என்கிறார்.', 'யார் சொல்வது சரி?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The economist - and the banker''s risk framing is partly a self-fulfilling prophecy. MSMEs are riskier partly because they are underfinanced. Better credit access reduces the risk it claims to be responding to.', 'பொருளாதார நிபுணர் மற்றும் வங்கியாளரின் இடர் வரையறையானது, ஓரளவிற்குத் தன்னைத்தானே நிறைவேற்றிக்கொள்ளும் ஒரு முன்னறிவிப்பாகும். குறு, சிறு மற்றும் நடுத்தர நிறுவனங்கள் (MSMEs) போதிய நிதி இல்லாமல் இருப்பதால், அவை அதிக இடர் நிறைந்தவையாக இருக்கின்றன. சிறந்த கடன் அணுகல், அது நிவர்த்தி செய்வதாகக் கூறும் இடரைக் குறைக்கிறது.'),
  (2, 'Both are describing the same reality from different positions. The solution is not to argue about who is right but to build the credit infrastructure - GST data, UPI transaction history, MSME portals - that makes MSME risk genuinely assessable at lower cost.', 'இருவரும் ஒரே யதார்த்தத்தை வெவ்வேறு கோணங்களில் இருந்து விவரிக்கிறார்கள். யார் சரி என்று வாதிடுவதல்ல தீர்வு; மாறாக, குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களின் (MSME) இடர்களைக் குறைந்த செலவில் உண்மையாகவே மதிப்பிடக்கூடியதாக மாற்றும் கடன் உள்கட்டமைப்பை — அதாவது ஜிஎஸ்டி தரவுகள், யுபிஐ பரிவர்த்தனை வரலாறு, MSME இணையதளங்கள் போன்றவற்றை — உருவாக்குவதே தீர்வாகும்.'),
  (3, 'The interest rate gap is the real scandal. If large corporates and MSMEs face equivalent default rates - and the data increasingly suggests they do - charging MSMEs 4–6% more is not risk pricing. It is market power pricing.', 'வட்டி விகித இடைவெளிதான் உண்மையான ஊழல். பெரிய பெருநிறுவனங்களும் குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களும் சமமான கடன் தவணைத் தவறுகளை எதிர்கொண்டால் - தரவுகள் அவ்வாறே சுட்டிக்காட்டுகின்றன - குறு, சிறு மற்றும் நடுத்தர நிறுவனங்களிடம் 4-6% கூடுதலாகக் கட்டணம் வசூலிப்பது இடர் விலை நிர்ணயம் அல்ல. அது சந்தை ஆதிக்க விலை நிர்ணயம்.'),
  (4, 'As a future business leader I need to understand my MSME suppliers'' financing costs because I am part of the system that determines them. Late payments from large buyers are a primary driver of MSME cash flow risk. My payment terms are a financing decision.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், எனது குறு, சிறு மற்றும் நடுத்தர நிறுவன (MSME) விநியோகஸ்தர்களின் நிதிச் செலவுகளை நான் புரிந்துகொள்ள வேண்டும். ஏனெனில், அவற்றை நிர்ணயிக்கும் அமைப்பில் நானும் ஒரு அங்கம். பெரிய கொள்முதல் செய்பவர்களிடமிருந்து ஏற்படும் தாமதமான கொடுப்பனவுகள், MSME-யின் பணப்புழக்க அபாயத்திற்கான ஒரு முக்கியக் காரணியாகும். எனது கொடுப்பனவு விதிமுறைகள் ஒரு நிதி சார்ந்த முடிவாகும்.')
) AS v(ord, en, ta);

-- Survey set 3 #60
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 3,
     'You are about to graduate. A first-generation student in your batch - who worked nights to fund the first year before a scholarship came through - asks you quietly: "Do you think this MBA will mean the same thing for both of us?"', 'What do you say honestly?', 'நீங்கள் பட்டம் பெறவிருக்கிறீர்கள். உங்கள் குழுவில் உள்ள, தன் குடும்பத்தில் முதன்முறையாகப் பட்டம் பெற்று, கல்வி உதவித்தொகை கிடைக்கும் வரை முதல் வருடப் படிப்புக்கு நிதியளிக்க இரவில் உழைத்த ஒரு மாணவர், உங்களிடம் மெதுவாகக் கேட்கிறார்: "இந்த MBA படிப்பு நம் இருவருக்கும் ஒரே மாதிரியான அர்த்தத்தைத் தரும் என்று நினைக்கிறீர்களா?"', 'நீங்கள் உண்மையாக என்ன சொல்கிறீர்கள்?',
     '{"theme": "The MBA & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'No - and pretending otherwise would be dishonest. The MBA gives both of us the same credential. It does not give both of us the same network, the same family safety net, or the same ability to take risks. The starting lines after graduation are not the same.', 'இல்லை - அப்படி இல்லை என்று பாசாங்கு செய்வது நேர்மையற்றதாக இருக்கும். MBA பட்டம் நம் இருவருக்கும் ஒரே தகுதியை அளிக்கிறது. ஆனால், அது நம் இருவருக்கும் ஒரே மாதிரியான தொடர்பு வட்டத்தையோ, ஒரே மாதிரியான குடும்பப் பாதுகாப்பு வலையையோ, அல்லது இடர் எடுக்கும் ஒரே மாதிரியான திறனையோ அளிப்பதில்லை. பட்டப்படிப்புக்குப் பிறகான தொடக்க நிலைகள் ஒன்றல்ல.'),
  (2, 'The credential is the same. What you do with it is entirely yours. In five years the difference will be what each of us built - not what we started with. I genuinely believe that.', 'சான்றிதழ் ஒன்றுதான். அதை வைத்து நீங்கள் என்ன செய்கிறீர்கள் என்பது முற்றிலும் உங்களுடையது. ஐந்து ஆண்டுகளில், நாம் தொடங்கியதை வைத்து அல்ல, நம்மில் ஒவ்வொருவரும் உருவாக்கியதை வைத்துதான் வேறுபாடு காணப்படும். இதை நான் உண்மையாகவே நம்புகிறேன்.'),
  (3, 'It will mean different things and produce different outcomes in the short term. In the long term the question is whether you build something that closes that gap for the next generation - and I think you will.', 'குறுகிய காலத்தில், இதற்குப் பலவிதமான அர்த்தங்களும் விளைவுகளும் இருக்கும். நீண்ட கால நோக்கில், அடுத்த தலைமுறைக்கான அந்த இடைவெளியை நிரப்பும் ஒன்றை நீங்கள் உருவாக்குகிறீர்களா என்பதுதான் கேள்வி - நீங்கள் அதைச் செய்வீர்கள் என்றே நான் நினைக்கிறேன்.'),
  (4, 'I do not have a clean answer. What I know is that you worked harder to get here than I did. That says something about what you will build after - and I would rather bet on that than on any advantage I started with.', 'என்னிடம் தெளிவான பதில் இல்லை. எனக்குத் தெரிந்ததெல்லாம், என்னை விட நீங்கள் இங்கு வருவதற்கு மிகவும் கடினமாக உழைத்திருக்கிறீர்கள் என்பதுதான். அது, இதற்குப் பிறகு நீங்கள் எதைக் கட்டமைப்பீர்கள் என்பதைப் பற்றிச் சொல்கிறது - மேலும், நான் ஆரம்பத்தில் கொண்டிருந்த எந்தவொரு சாதகத்தையும் விட, அதன் மீதே பந்தயம் கட்ட விரும்புகிறேன்.')
) AS v(ord, en, ta);

-- Survey set 4 #61
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India''s Parliament has two houses - Lok Sabha with 543 elected members and Rajya Sabha with 245 members. A bill can be passed by Lok Sabha but blocked or amended by Rajya Sabha. A ruling party with a strong Lok Sabha majority but a weak Rajya Sabha position has found key legislation delayed for years. A classmate says "the Rajya Sabha is an obstacle to democratic mandate." A professor disagrees.', 'Who is right?', 'இந்திய நாடாளுமன்றத்தில் இரண்டு அவைகள் உள்ளன - 543 தேர்ந்தெடுக்கப்பட்ட உறுப்பினர்களைக் கொண்ட மக்களவை மற்றும் 245 உறுப்பினர்களைக் கொண்ட மாநிலங்களவை. ஒரு மசோதாவை மக்களவை நிறைவேற்ற முடியும், ஆனால் மாநிலங்களவையால் அதைத் தடுக்கவோ அல்லது திருத்தவோ முடியும். மக்களவையில் வலுவான பெரும்பான்மையையும், மாநிலங்களவையில் பலவீனமான நிலையையும் கொண்ட ஒரு ஆளும் கட்சி, முக்கிய சட்டங்கள் பல ஆண்டுகளாகத் தாமதப்படுத்தப்படுவதைக் கண்டுள்ளது. ஒரு வகுப்புத் தோழன், "மாநிலங்களவை ஜனநாயக ஆணைக்கு ஒரு தடையாக இருக்கிறது" என்று கூறுகிறான். ஒரு பேராசிரியர் இதை மறுக்கிறார்.', 'யார் சொல்வது சரி?',
     '{"theme": "Political Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The professor - Rajya Sabha exists precisely to slow down majoritarian impulse. A second chamber that reviews legislation is a feature of mature democracies not a bug. Speed is not always a virtue in lawmaking.', 'பேராசிரியர் - பெரும்பான்மையினரின் மனப்போக்கைக் குறைப்பதற்காகவே மாநிலங்களவை உள்ளது. சட்டங்களை மறுஆய்வு செய்யும் இரண்டாவது அவை என்பது முதிர்ந்த ஜனநாயகங்களின் ஒரு சிறப்பம்சமே தவிர, அது ஒரு குறையல்ல. சட்டம் இயற்றுவதில் வேகம் எப்போதும் ஒரு நற்பண்பு அல்ல.'),
  (2, 'The classmate has a point in practice. When a party wins a decisive Lok Sabha mandate and a permanent minority in the Rajya Sabha blocks every reform - the will of the electorate is being frustrated by an unelected chamber.', 'நடைமுறையில் அந்த வகுப்புத் தோழர் சொல்வதில் ஒரு நியாயம் இருக்கிறது. ஒரு கட்சி மக்களவையில் தீர்க்கமான வெற்றியைப் பெற்று, மாநிலங்களவையில் உள்ள நிரந்தர சிறுபான்மைக் கட்சி ஒவ்வொரு சீர்திருத்தத்தையும் தடுக்கும்போது - தேர்ந்தெடுக்கப்படாத ஓர் அவையால் வாக்காளர்களின் விருப்பம் முறியடிக்கப்படுகிறது என்பதே பொருள்.'),
  (3, 'The tension is by design. The founders wanted legislation to survive scrutiny from multiple angles before becoming law. The frustration is evidence the system is working - not that it is broken.', 'இந்தப் பதற்றம் திட்டமிட்டு உருவாக்கப்பட்டதே. சட்டமாவதற்கு முன்பு, ஒரு சட்டம் பல கோணங்களில் இருந்து வரும் ஆய்வுகளைத் தாங்க வேண்டும் என நிறுவனர்கள் விரும்பினர். இந்த விரக்தி, அமைப்பு செயல்படுகிறது என்பதற்கான சான்று; அது பழுதடைந்துவிட்டது என்பதற்கான சான்று அல்ல.'),
  (4, 'The real problem is that Rajya Sabha has evolved from a chamber of reflection into a chamber of political opposition by other means. Reform the function not the institution.', 'உண்மையான பிரச்சனை என்னவென்றால், மாநிலங்களவை ஒரு சிந்தனைக் கூடமாக இருந்த நிலையிலிருந்து, வேறு வழிகளில் அரசியல் எதிர்க்கட்சியின் கூடமாக உருமாறியுள்ளது. அமைப்பை அல்ல, அதன் செயல்பாட்டைச் சீர்திருத்துங்கள்.')
) AS v(ord, en, ta);

-- Survey set 4 #62
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India''s current account deficit - the gap between what it earns from exports and what it spends on imports - is persistently negative, driven largely by oil imports and gold purchases. India imports approximately $200 billion of crude oil annually and $45 billion of gold. A finance professor says "Indians are simultaneously financing the world''s energy producers and locking wealth in non-productive assets."', 'What is your response?', 'இந்தியாவின் நடப்புக் கணக்குப் பற்றாக்குறை – அதாவது, ஏற்றுமதி மூலம் கிடைக்கும் வருவாய்க்கும் இறக்குமதிக்காகச் செலவிடும் தொகைக்கும் இடையிலான இடைவெளி – பெரும்பாலும் எண்ணெய் இறக்குமதி மற்றும் தங்கக் கொள்முதல் ஆகியவற்றால் தொடர்ந்து எதிர்மறையாகவே இருந்து வருகிறது. இந்தியா ஆண்டுதோறும் சுமார் 200 பில்லியன் டாலர் மதிப்புள்ள கச்சா எண்ணெயையும், 45 பில்லியன் டாலர் மதிப்புள்ள தங்கத்தையும் இறக்குமதி செய்கிறது. "இந்தியர்கள் ஒரே நேரத்தில் உலகின் எரிசக்தி உற்பத்தியாளர்களுக்கு நிதியளித்து, அதே சமயம் செல்வத்தை உற்பத்தி செய்யாத சொத்துக்களில் முடக்கி வைக்கின்றனர்" என்று ஒரு நிதிப் பேராசிரியர் கூறுகிறார்.', 'உங்கள் பதில் என்ன?',
     '{"theme": "Economic Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The oil dependence is a strategic vulnerability that renewable energy investment directly addresses. Every solar panel installed reduces the current account deficit - energy policy and economic policy are the same conversation.', 'எண்ணெய் சார்பு என்பது ஒரு மூலோபாய பலவீனமாகும், இதை புதுப்பிக்கத்தக்க ஆற்றல் முதலீடு நேரடியாகச் சரிசெய்கிறது. நிறுவப்படும் ஒவ்வொரு சூரிய மின்தகடும் நடப்புக் கணக்குப் பற்றாக்குறையைக் குறைக்கிறது - ஆற்றல் கொள்கையும் பொருளாதாரக் கொள்கையும் ஒரே உரையாடல்தான்.'),
  (2, 'Gold purchases reflect a deep cultural savings preference that no policy will eliminate quickly. The productive use of that wealth requires financial products that match the trust and liquidity profile of gold - not lectures about non-productivity.', 'தங்கம் வாங்குவது என்பது, எந்தவொரு கொள்கையாலும் எளிதில் அகற்ற முடியாத ஒரு ஆழமான கலாச்சார சேமிப்பு விருப்பத்தைப் பிரதிபலிக்கிறது. அந்தச் செல்வத்தை ஆக்கப்பூர்வமாகப் பயன்படுத்துவதற்கு, தங்கத்தின் நம்பகத்தன்மை மற்றும் பணப்புழக்கத் தன்மையுடன் பொருந்தக்கூடிய நிதித் தயாரிப்புகளே தேவை, ஆக்கப்பூர்வமற்ற தன்மை குறித்த சொற்பொழிவுகள் அல்ல.'),
  (3, 'The current account deficit is manageable as long as capital flows finance it. The structural problem is that India has not built enough export capacity in services and manufacturing to offset the import bill. That is the real policy failure.', 'மூலதன வரவுகள் நிதியளிக்கும் வரை நடப்புக் கணக்குப் பற்றாக்குறையைச் சமாளிக்க முடியும். இறக்குமதிச் செலவை ஈடுசெய்யும் அளவுக்கு, சேவைகள் மற்றும் உற்பத்தித் துறைகளில் இந்தியா போதுமான ஏற்றுமதித் திறனை உருவாக்கவில்லை என்பதே கட்டமைப்பு ரீதியான சிக்கலாகும். அதுதான் உண்மையான கொள்கைத் தோல்வி.'),
  (4, 'Both oil and gold are symptoms of deeper structures - energy insecurity and financial system distrust respectively. Treating the symptoms without addressing the structures produces policy that looks active and achieves little.', 'எண்ணெய் மற்றும் தங்கம் ஆகிய இரண்டும் முறையே எரிசக்தி பாதுகாப்பின்மை மற்றும் நிதி அமைப்பு மீதான அவநம்பிக்கை ஆகிய ஆழமான கட்டமைப்புகளின் அறிகுறிகளாகும். கட்டமைப்புகளைச் சரிசெய்யாமல் அறிகுறிகளுக்கு மட்டும் சிகிச்சை அளிப்பது, செயல்திறன் மிக்கதாகத் தோன்றும் ஆனால் சிறிதளவே சாதிக்கும் ஒரு கொள்கையை உருவாக்குகிறது.')
) AS v(ord, en, ta);

-- Survey set 4 #63
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India''s Central Bureau of Investigation - the CBI - investigates high-profile corruption, economic offences, and special crimes. It requires state government permission to operate in most states - permission that several states have withdrawn, calling the CBI a tool of the ruling party at the Centre. A retired IPS officer tells your batch - "an anti-corruption agency that requires permission from the people it might investigate is not an anti-corruption agency."', 'What do you think?', 'இந்தியாவின் மத்திய புலனாய்வுப் பணியகம் - சிபிஐ - பெரும் ஊழல்கள், பொருளாதாரக் குற்றங்கள் மற்றும் சிறப்புக் குற்றங்களை விசாரிக்கிறது. பெரும்பாலான மாநிலங்களில் செயல்பட இதற்கு மாநில அரசின் அனுமதி தேவைப்படுகிறது. ஆனால், சிபிஐ-ஐ மத்தியில் ஆளும் கட்சியின் கருவி என்று கூறி, பல மாநிலங்கள் அந்த அனுமதியைத் திரும்பப் பெற்றுள்ளன. ஓய்வுபெற்ற ஐபிஎஸ் அதிகாரி ஒருவர் உங்கள் குழுவிடம் கூறுகிறார் - "தான் விசாரிக்கக்கூடிய நபர்களிடமே அனுமதி கேட்கும் ஒரு ஊழல் தடுப்பு அமைப்பு, உண்மையான ஊழல் தடுப்பு அமைப்பாக இருக்காது."', 'நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Governance Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'He is right - the structural design makes the CBI politically captive by definition. An effective anti-corruption agency needs operational independence and cannot depend on the cooperation of potential subjects.', 'அவர் சொல்வது சரிதான் - அதன் கட்டமைப்பு வடிவமைப்பே சிபிஐ-யை இயல்பாகவே அரசியல் ரீதியாகக் கட்டுப்படுத்துகிறது. ஒரு திறமையான ஊழல் ஒழிப்பு அமைப்புக்குச் செயல்பாட்டுச் சுதந்திரம் தேவை, அது தனக்கு எதிராக ஒத்துழைக்கக்கூடியவர்களின் ஒத்துழைப்பைச் சார்ந்திருக்க முடியாது.'),
  (2, 'The permission requirement exists because states have legitimate law and order jurisdiction. Removing it would give the Centre unchecked investigative power over state governments - which is a different kind of problem.', 'மாநிலங்களுக்கு முறையான சட்டம் மற்றும் ஒழுங்கு அதிகார வரம்பு இருப்பதால், அனுமதி தேவை என்ற நிபந்தனை உள்ளது. அதை நீக்குவது, மாநில அரசுகள் மீது மத்திய அரசுக்கு வரம்பற்ற விசாரணை அதிகாரத்தை வழங்கும் - இது வேறு வகையான சிக்கலாகும்.'),
  (3, 'The CBI''s credibility problem is less about structure and more about selective deployment. Cases that embarrass political opponents move fast. Cases that embarrass allies move slowly or not at all. That is a political problem not a legal one.', 'சிபிஐ-யின் நம்பகத்தன்மைப் பிரச்சனை என்பது அதன் கட்டமைப்பைப் பற்றியதை விட, வழக்குகளைத் தேர்ந்தெடுத்துப் பயன்படுத்துவதைப் பற்றியதுதான். அரசியல் எதிரிகளைச் சங்கடப்படுத்தும் வழக்குகள் வேகமாக நகர்கின்றன. கூட்டாளிகளைச் சங்கடப்படுத்தும் வழக்குகள் மெதுவாக நகர்கின்றன அல்லது நகர்வதே இல்லை. இது ஒரு அரசியல் பிரச்சனை, சட்டப் பிரச்சனை அல்ல.'),
  (4, 'India needs a genuinely independent anti-corruption institution - properly funded, with fixed-term leadership appointed through a multi-party process and insulated from executive direction. The CBI is not that. The question is whether there is political will to build it.', 'இந்தியாவிற்கு உண்மையான சுதந்திரமான ஒரு ஊழல் எதிர்ப்பு அமைப்பு தேவை. அதற்கு முறையான நிதி ஒதுக்கீடு இருக்க வேண்டும்; பல கட்சிகளின் ஒருங்கிணைந்த செயல்முறையின் மூலம் ஒரு குறிப்பிட்ட காலத்திற்குத் தலைமை நியமிக்கப்பட வேண்டும்; மேலும் அது நிர்வாகத்தின் வழிகாட்டுதலில் இருந்து சுதந்திரமாகச் செயல்பட வேண்டும். சிபிஐ அப்படிப்பட்ட அமைப்பாக இல்லை. அதை உருவாக்குவதற்கான அரசியல் உறுதிப்பாடு இருக்கிறதா என்பதுதான் கேள்வி.')
) AS v(ord, en, ta);

-- Survey set 4 #64
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India has approximately 18 lakh registered NGOs - one for every 800 citizens, more than any other country. Yet a government report found that less than 10% file annual returns and less than 1% can demonstrate measurable impact on the communities they serve. A development sector professional says "India''s civil society is simultaneously its greatest asset and its most unaccountable sector."', 'What is your view?', 'இந்தியாவில் ஏறத்தாழ 18 லட்சம் பதிவுசெய்யப்பட்ட தன்னார்வ தொண்டு நிறுவனங்கள் உள்ளன - அதாவது ஒவ்வொரு 800 குடிமக்களுக்கும் ஒன்று என்ற விகிதத்தில், இது வேறு எந்த நாட்டையும் விட அதிகமாகும். இருப்பினும், 10%க்கும் குறைவான நிறுவனங்களே ஆண்டு அறிக்கைகளைத் தாக்கல் செய்கின்றன என்றும், 1%க்கும் குறைவான நிறுவனங்களே தாங்கள் சேவை செய்யும் சமூகங்களில் அளவிடக்கூடிய தாக்கத்தை நிரூபிக்க முடிகிறது என்றும் ஓர் அரசாங்க அறிக்கை கண்டறிந்துள்ளது. வளர்ச்சித் துறை நிபுணர் ஒருவர், "இந்தியாவின் குடிமைச் சமூகம் ஒரே நேரத்தில் அதன் மிகப்பெரிய சொத்தாகவும், அதே சமயம் மிகவும் பொறுப்பற்ற துறையாகவும் இருக்கிறது" என்கிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The 18 lakh figure is misleading - most are dormant registrations not functioning organisations. The active civil society is much smaller and genuinely does critical work that government cannot or will not do.', '18 லட்சம் என்ற எண்ணிக்கை தவறான தகவலைத் தருகிறது - அவற்றில் பெரும்பாலானவை செயல்படும் அமைப்புகளல்ல, மாறாக செயலற்ற பதிவுகளே. செயலூக்கமுள்ள குடிமைச் சமூகம் மிகவும் சிறியது; அது, அரசாங்கத்தால் செய்ய முடியாத அல்லது செய்ய விரும்பாத மிக முக்கியமான பணிகளை உண்மையாகவே செய்கிறது.'),
  (2, 'The accountability gap is real and it has consequences. Unaccountable NGOs absorb donor funding, crowd out effective organisations, and give governments a legitimate excuse to restrict civil society broadly.', 'பொறுப்புக்கூறல் இடைவெளி என்பது உண்மையானது, மேலும் அது விளைவுகளையும் கொண்டுள்ளது. பொறுப்பற்ற தன்னார்வ தொண்டு நிறுவனங்கள் நன்கொடையாளர்களின் நிதியை உறிஞ்சிக்கொள்கின்றன, திறமையான அமைப்புகளை ஓரங்கட்டுகின்றன, மேலும் குடிமைச் சமூகத்தைப் பரவலாகக் கட்டுப்படுத்துவதற்கு அரசாங்கங்களுக்கு ஒரு நியாயமான காரணத்தையும் அளிக்கின்றன.'),
  (3, 'The solution is outcome-based funding - donors, whether government or private, should fund based on demonstrated impact not organisational existence. Money follows measurement and measurement follows money.', 'விளைவு அடிப்படையிலான நிதியுதவியே இதற்கான தீர்வு - நன்கொடையாளர்கள், அவர்கள் அரசாங்கமாகவோ அல்லது தனியாராகவோ இருந்தாலும், நிறுவனத்தின் இருப்பை அடிப்படையாகக் கொள்ளாமல், நிரூபிக்கப்பட்ட தாக்கத்தின் அடிப்படையில் நிதியளிக்க வேண்டும். பணம் அளவீட்டைப் பின்தொடர்கிறது, அளவீடு பணத்தைப் பின்தொடர்கிறது.'),
  (4, 'Civil society accountability and government accountability are connected. In contexts where government is opaque and unaccountable, civil society fills the gap imperfectly. Fix the first and the second becomes less critical.', 'குடிமைச் சமூகத்தின் பொறுப்புக்கூறலும் அரசாங்கத்தின் பொறுப்புக்கூறலும் ஒன்றோடொன்று தொடர்புடையவை. அரசாங்கம் வெளிப்படைத்தன்மையற்றதாகவும் பொறுப்புக்கூறலற்றதாகவும் இருக்கும் சூழல்களில், குடிமைச் சமூகம் அந்த இடைவெளியை முழுமையற்ற முறையில் நிரப்புகிறது. முதலாவதைச் சரிசெய்தால், இரண்டாவதன் முக்கியத்துவம் குறைந்துவிடும்.')
) AS v(ord, en, ta);

-- Survey set 4 #65
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'Ratan Tata led the Tata Group for 21 years - growing revenues from $5 billion to $100 billion, acquiring Jaguar Land Rover and Corus Steel, and building a reputation for ethical business conduct globally. He also made the Nano - a car designed for the masses that ultimately failed commercially.', 'A professor asks - what does the Nano''s failure teach us about leadership?', 'ரத்தன் டாடா 21 ஆண்டுகள் டாடா குழுமத்தை வழிநடத்தினார் - வருவாயை 5 பில்லியன் டாலரிலிருந்து 100 பில்லியன் டாலராக உயர்த்தினார், ஜாகுவார் லேண்ட் ரோவர் மற்றும் கோரஸ் ஸ்டீல் நிறுவனங்களைக் கையகப்படுத்தினார், மேலும் உலகளவில் நெறிமுறை சார்ந்த வணிக நடத்தைக்கான நற்பெயரை உருவாக்கினார். அவர் சாமானிய மக்களுக்காக வடிவமைக்கப்பட்ட நானோ காரையும் உருவாக்கினார், ஆனால் அது இறுதியில் வணிகரீதியாகத் தோல்வியடைந்தது.', 'நானோவின் தோல்வி, தலைமைத்துவம் குறித்து நமக்கு என்ன கற்பிக்கிறது என்று ஒரு பேராசிரியர் கேட்கிறார்.',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It teaches that good intent is not a business model. The Nano was designed around a social vision - affordable mobility for India - but the market did not respond to the product that vision produced. Vision and execution are separate disciplines.', 'நல்ல நோக்கம் என்பது ஒரு வணிக மாதிரி அல்ல என்பதை இது கற்பிக்கிறது. நானோ, இந்தியாவிற்கான மலிவு விலைப் போக்குவரத்து என்ற ஒரு சமூகப் பார்வையை மையமாகக் கொண்டு வடிவமைக்கப்பட்டது. ஆனால், அந்தப் பார்வை உருவாக்கிய தயாரிப்பிற்குச் சந்தை வரவேற்பு அளிக்கவில்லை. பார்வையும் அதைச் செயல்படுத்துவதும் வெவ்வேறு துறைகள்.'),
  (2, 'It teaches that positioning matters more than price. The Nano was marketed as the cheapest car in the world - which made aspirational Indian buyers feel it was a poor man''s car. The failure was in communication not in the product itself.', 'விலையை விட நிலைநிறுத்தமே முக்கியம் என்பதை இது கற்பிக்கிறது. நானோ, உலகின் மிக மலிவான கார் என்று சந்தைப்படுத்தப்பட்டது. இது, முன்னேற விரும்பும் இந்திய வாங்குபவர்களை அது ஒரு ஏழையின் கார் என்ற எண்ணத்திற்கு உள்ளாக்கியது. தோல்வியானது தயாரிப்பில் இல்லை, தகவல் தொடர்பில்தான் இருந்தது.'),
  (3, 'It teaches that leaders can be simultaneously great and wrong. Ratan Tata''s overall record is exceptional. The Nano was a miss. Holding both without collapsing into either hagiography or criticism is the mature read.', 'தலைவர்கள் ஒரே நேரத்தில் சிறந்தவர்களாகவும் தவறானவர்களாகவும் இருக்க முடியும் என்பதை இது கற்பிக்கிறது. ரத்தன் டாடாவின் ஒட்டுமொத்த சாதனை மிகச் சிறப்பானது. ''தி நானோ'' ஒரு தோல்வி. புகழ்ச்சியாகவோ அல்லது விமர்சனமாகவோ சரிந்துவிடாமல், இவ்விரண்டையும் ஒருசேரப் படிப்பதே ஒரு முதிர்ச்சியான வாசிப்பு.'),
  (4, 'It teaches that disruption from the top down rarely works. The Nano tried to create a new market by building down from existing assumptions. Successful disruption in mobility - two-wheelers, auto-rickshaws - came from within the market it served.', 'மேலிருந்து கீழ் நோக்கிய சீர்குலைவு அரிதாகவே பலனளிக்கும் என்பதை இது கற்பிக்கிறது. நானோ, ஏற்கனவே இருந்த அனுமானங்களிலிருந்து படிப்படியாகக் கட்டமைத்து ஒரு புதிய சந்தையை உருவாக்க முயன்றது. இருசக்கர வாகனங்கள், ஆட்டோ ரிக்‌ஷாக்கள் போன்ற போக்குவரத்துத் துறையில் ஏற்பட்ட வெற்றிகரமான சீர்குலைவுகள், அது சேவை செய்த சந்தைக்குள்ளிருந்தே வந்தன.')
) AS v(ord, en, ta);

-- Survey set 4 #66
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'A 2023 McKinsey report found that women in Indian corporations are promoted at a rate 18% lower than men at equivalent performance ratings. The gap widens at each level - women are well represented at entry level and almost absent at the top. An HR director says "the pipeline is full - the problem is the filter."', 'What does she mean and do you agree?', '2023 ஆம் ஆண்டு மெக்கின்சி அறிக்கை ஒன்றின்படி, இந்திய நிறுவனங்களில் சமமான செயல்திறன் மதிப்பீடுகளைக் கொண்ட ஆண்களை விட பெண்களுக்கு 18% குறைவான விகிதத்தில் பதவி உயர்வு வழங்கப்படுகிறது. இந்த இடைவெளி ஒவ்வொரு மட்டத்திலும் அதிகரிக்கிறது - நுழைவு மட்டத்தில் பெண்கள் கணிசமான அளவில் உள்ளனர், ஆனால் உயர் மட்டங்களில் அவர்கள் கிட்டத்தட்ட இல்லை. ஒரு மனிதவள இயக்குநர், "பணியாளர் வரிசை நிரம்பியுள்ளது - ஆனால் அவர்களை வடிகட்டுவதில்தான் சிக்கல் உள்ளது" என்கிறார்.', 'அவள் சொல்வதன் அர்த்தம் என்ன, நீங்கள் அதை ஒப்புக்கொள்கிறீர்களா?',
     '{"theme": "Gender Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She means that organisations are not short of qualified women - they are short of promotion systems that evaluate women without applying informal criteria men do not face. The filter is bias embedded in process.', 'நிறுவனங்களில் தகுதிவாய்ந்த பெண்களுக்குப் பற்றாக்குறை இல்லை; மாறாக, ஆண்கள் எதிர்கொள்ளாத முறைசாரா அளவுகோல்களைப் பயன்படுத்தாமல் பெண்களை மதிப்பிடும் பதவி உயர்வு முறைகளுக்கே பற்றாக்குறை உள்ளது என்று அவள் குறிப்பிடுகிறாள். அந்த வடிகட்டி என்பது, செயல்முறையிலேயே பொதிந்துள்ள ஒருதலைப்பட்சமான மனப்பான்மையே ஆகும்.'),
  (2, 'She is right about the diagnosis but the solution is harder than fixing a filter. The informal networks, sponsorship relationships, and visibility opportunities that drive promotion are not processes - they are cultures. Cultures take a generation to change.', 'நோயறிதலைப் பொறுத்தவரை அவள் சொல்வது சரிதான், ஆனால் அதற்கான தீர்வு ஒரு வடிகட்டியைச் சரிசெய்வதை விடக் கடினமானது. பதவி உயர்வை ஊக்குவிக்கும் முறைசாரா வலையமைப்புகள், ஆதரவு உறவுகள் மற்றும் வெளிச்சத்திற்கு வரும் வாய்ப்புகள் என்பவை செயல்முறைகள் அல்ல - அவை கலாச்சாரங்கள். கலாச்சாரங்கள் மாறுவதற்கு ஒரு தலைமுறை காலம் ஆகும்.'),
  (3, 'The 18% gap at equivalent performance ratings is the most important number in that report. It means the meritocracy argument - women will rise if they perform - is factually false at the organisational level. The data settles the debate.', 'சமமான செயல்திறன் மதிப்பீடுகளில் உள்ள 18% இடைவெளிதான் அந்த அறிக்கையின் மிக முக்கியமான எண். இதன் பொருள், ''பெண்கள் சிறப்பாகச் செயல்பட்டால் உயர்வார்கள்'' என்ற தகுதியாட்சி வாதம், நிறுவன மட்டத்தில் உண்மையில் தவறானது என்பதாகும். இந்தத் தரவுகளே அந்த விவாதத்திற்கு ஒரு முற்றுப்புள்ளி வைக்கின்றன.'),
  (4, 'As a future leader this tells me that my promotion decisions will carry bias I cannot fully see. The correction is not good intentions - it is structured decision-making that forces me to articulate criteria before I evaluate candidates.', 'ஒரு வருங்காலத் தலைவராக, எனது பதவி உயர்வு முடிவுகளில் என்னால் முழுமையாகப் பார்க்க முடியாத ஒரு சார்புத்தன்மை இருக்கும் என்பதை இது எனக்கு உணர்த்துகிறது. இதற்கான திருத்தம் நல்ல நோக்கங்கள் அல்ல; மாறாக, வேட்பாளர்களை மதிப்பிடுவதற்கு முன்பு அளவுகோல்களைத் தெளிவாக வரையறுக்க என்னை நிர்பந்திக்கும் ஒரு கட்டமைக்கப்பட்ட முடிவெடுக்கும் செயல்முறையாகும்.')
) AS v(ord, en, ta);

-- Survey set 4 #67
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'A food delivery platform operating in Tamil Nadu employs 50,000 delivery partners. An internal audit reveals that 30% of partners earn below minimum wage when accounting for fuel costs, waiting time, and equipment depreciation. The platform''s terms classify them as independent contractors not employees. The CEO says "they chose this work freely." A labour economist says "freedom without a floor is not freedom."', 'What is your view?', 'தமிழ்நாட்டில் செயல்படும் ஒரு உணவு விநியோகத் தளம், 50,000 விநியோகப் பங்காளர்களைப் பணியமர்த்தியுள்ளது. எரிபொருள் செலவுகள், காத்திருப்பு நேரம் மற்றும் உபகரணத் தேய்மானம் ஆகியவற்றைக் கணக்கில் கொள்ளும்போது, ​​30% பங்காளர்கள் குறைந்தபட்ச ஊதியத்திற்கும் குறைவாகச் சம்பாதிக்கிறார்கள் என்று ஓர் உள்ளகத் தணிக்கை வெளிப்படுத்துகிறது. அந்தத் தளத்தின் விதிமுறைகள் அவர்களை ஊழியர்களாக அல்லாமல், சுயாதீன ஒப்பந்தக்காரர்களாக வகைப்படுத்துகின்றன. "அவர்கள் இந்த வேலையைத் தாங்களாகவே விரும்பித் தேர்ந்தெடுத்தார்கள்" என்று தலைமைச் செயல் அதிகாரி கூறுகிறார். "அடிப்படை இல்லாத சுதந்திரம், சுதந்திரமே அல்ல" என்று ஓர் தொழிலாளர் பொருளாதார நிபுணர் கூறுகிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Business & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The economist is right. When the only alternative to gig work is unemployment the word "choice" does not carry its full meaning. A business model that depends on below-minimum-wage labour is extracting a subsidy from its workers.', 'அந்தப் பொருளாதார நிபுணர் சொல்வது சரிதான். தற்காலிகப் பணிக்கு வேலையின்மை மட்டுமே ஒரே மாற்றாக இருக்கும்போது, ​​''தேர்வு'' என்ற சொல்லுக்கு அதன் முழுமையான அர்த்தம் இருப்பதில்லை. குறைந்தபட்ச ஊதியத்திற்கும் குறைவான உழைப்பைச் சார்ந்திருக்கும் ஒரு வணிக மாதிரியானது, தனது தொழிலாளர்களிடமிருந்து ஒரு மானியத்தைப் பெறுகிறது.'),
  (2, 'The CEO is describing a real dynamic - many delivery partners do prefer flexibility over employment. The solution is not forcing employment status but mandating a minimum earnings floor per hour regardless of classification.', 'தலைமை நிர்வாக அதிகாரி ஒரு யதார்த்தமான சூழலை விவரிக்கிறார் - பல விநியோகக் கூட்டாளர்கள் வேலைவாய்ப்பை விட நெகிழ்வுத்தன்மையையே விரும்புகிறார்கள். இதற்கான தீர்வு, வேலைவாய்ப்பு நிலையைத் திணிப்பது அல்ல, மாறாக வகைப்பாட்டைப் பொருட்படுத்தாமல் ஒரு மணி நேரத்திற்கு குறைந்தபட்ச வருமானத்தைக் கட்டாயமாக்குவதே ஆகும்.'),
  (3, 'The platform benefits from the contractor classification in ways its workers do not - no PF, no ESI, no gratuity, no termination rights. That asymmetry is the problem. The classification should be neutral not systematically advantageous to one party.', 'ஒப்பந்ததாரர் வகைப்பாட்டினால் இந்தத் தளம் பெறும் நன்மைகள், அதன் தொழிலாளர்களுக்குக் கிடைப்பதில்லை - வருங்கால வைப்புநிதி இல்லை, தொழிலாளர் காப்பீட்டுப் பங்களிப்பு இல்லை, பணிக்கொடை இல்லை, பணிநீக்க உரிமைகள் இல்லை. அந்தச் சமச்சீரற்ற தன்மையே சிக்கலாகும். இந்த வகைப்பாடு நடுநிலையானதாக இருக்க வேண்டுமே தவிர, ஒரு தரப்பினருக்குத் திட்டமிட்ட முறையில் சாதகமாக இருக்கக்கூடாது.'),
  (4, 'As a future business leader this is the question I will face in every labour-intensive business I build or invest in. The test I want to apply is simple - would I be comfortable if this wage structure appeared on the front page of a newspaper next to my name?', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், நான் உருவாக்கும் அல்லது முதலீடு செய்யும் ஒவ்வொரு அதிக உழைப்பு தேவைப்படும் தொழிலிலும் இந்தக் கேள்வியைத்தான் எதிர்கொள்வேன். நான் பயன்படுத்த விரும்பும் சோதனை எளிமையானது - ஒரு செய்தித்தாள் முதல் பக்கத்தில் என் பெயருக்கு அருகில் இந்த ஊதியக் கட்டமைப்பு இடம்பெற்றால், நான் அதை ஏற்றுக்கொள்வேனா?')
) AS v(ord, en, ta);

-- Survey set 4 #68
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'Tamil Nadu has been governed alternately by the DMK and AIADMK for over 50 years. Both parties have strong welfare delivery records and both have faced corruption allegations. A political scientist says "Tamil Nadu''s two-party system produces competitive welfare - each party outbids the other on schemes to stay in power."', 'Is competitive welfare good for the state?', '50 ஆண்டுகளுக்கும் மேலாக தமிழகம் திமுக மற்றும் அதிமுகவால் மாறி மாறி ஆளப்பட்டு வருகிறது. இரு கட்சிகளும் வலுவான நலத்திட்டங்களை வழங்கியுள்ளன, மேலும் இரு கட்சிகளும் ஊழல் குற்றச்சாட்டுகளையும் எதிர்கொண்டுள்ளன. ஒரு அரசியல் விஞ்ஞானி கூறுகிறார், "தமிழகத்தின் இரு கட்சி அமைப்பு போட்டித்தன்மை வாய்ந்த நலத்திட்டங்களை உருவாக்குகிறது - ஆட்சியில் நீடிப்பதற்காக ஒவ்வொரு கட்சியும் மற்ற கட்சியை விட அதிக திட்டங்களை முன்னிறுத்துகிறது."', 'போட்டி நலத்திட்டங்கள் அரசுக்கு நல்லதா?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - competition between parties on welfare delivery has produced real outcomes. Tamil Nadu''s infant mortality, female literacy, and nutrition indicators are among India''s best. The incentive produced the result.', 'ஆம் - நலத்திட்டங்களை வழங்குவதில் கட்சிகளுக்கிடையேயான போட்டி உண்மையான பலன்களைத் தந்துள்ளது. தமிழ்நாட்டின் சிசு மரண விகிதம், பெண் கல்வியறிவு மற்றும் ஊட்டச்சத்துக் குறியீடுகள் இந்தியாவிலேயே சிறந்தவையாக உள்ளன. அந்த ஊக்கத்தொகையே இந்த விளைவை ஏற்படுத்தியது.'),
  (2, 'Partially - competitive welfare produces popular schemes but not necessarily the most effective ones. Free televisions and mixer-grinders are visible and voteable. Improving primary healthcare quality is neither. The competition optimises for visibility not impact.', 'பகுதியளவு - போட்டி நலத்திட்டங்கள் பிரபலமான திட்டங்களை உருவாக்குகின்றன, ஆனால் அவை மிகவும் பயனுள்ளவையாக இருக்க வேண்டிய அவசியமில்லை. இலவசத் தொலைக்காட்சிகளும் மிக்ஸர்-கிரைண்டர்களும் கண்ணுக்குத் தெரிகின்றன, மேலும் அவற்றுக்கு வாக்களிக்க முடியும். ஆரம்ப சுகாதாரத்தின் தரத்தை மேம்படுத்துவது இவ்விரண்டும் அல்ல. இந்தப் போட்டியானது தாக்கத்தை அல்ல, கண்ணுக்குத் தெரிவதையே உகந்ததாக்குகிறது.'),
  (3, 'The fiscal cost of competitive welfare is now a structural problem. Tamil Nadu''s debt is partly the accumulated cost of schemes that were launched electorally and proved impossible to withdraw. Today''s welfare is tomorrow''s fiscal crisis.', 'போட்டி நலத்திட்டங்களின் நிதிச் செலவு தற்போது ஒரு கட்டமைப்புப் பிரச்சனையாக உருவெடுத்துள்ளது. தமிழ்நாட்டின் கடனானது, தேர்தல் மூலம் தொடங்கப்பட்டு, பின்னர் திரும்பப் பெற இயலாதவை என நிரூபிக்கப்பட்ட திட்டங்களின் திரண்ட செலவின் ஒரு பகுதியாகும். இன்றைய நலத்திட்டமே நாளைய நிதி நெருக்கடியாகும்.'),
  (4, 'The real question is whether competitive welfare has built human capability or dependency. Schemes that transfer goods produce gratitude. Schemes that build skills produce independence. Tamil Nadu''s record on the second is more mixed than on the first.', 'போட்டி நலத்திட்டங்கள் மனித ஆற்றலை வளர்த்துள்ளனவா அல்லது சார்புநிலையை வளர்த்துள்ளனவா என்பதே உண்மையான கேள்வி. பொருட்களைப் பரிமாற்றம் செய்யும் திட்டங்கள் நன்றியுணர்வை உருவாக்குகின்றன. திறன்களை வளர்க்கும் திட்டங்கள் சுதந்திரத்தை உருவாக்குகின்றன. முதல் அம்சத்தை விட இரண்டாவது அம்சத்தில் தமிழ்நாட்டின் செயல்பாடு கலவையாகவே உள்ளது.')
) AS v(ord, en, ta);

-- Survey set 4 #69
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India has 19% of the world''s population but only 4% of the world''s fresh water resources. Tamil Nadu is classified as a water-stressed state - per capita water availability is below the national scarcity threshold. Chennai has faced three near-total water crises in the last decade. A water policy expert tells your batch - "water will be the defining resource constraint for Tamil Nadu''s economy in the next 20 years."', 'As a future business leader what do you do with that information?', 'இந்தியாவில் உலகின் மக்கள் தொகையில் 19% உள்ளது, ஆனால் உலகின் நன்னீர் வளத்தில் 4% மட்டுமே உள்ளது. தமிழ்நாடு ஒரு தண்ணீர் பற்றாக்குறை மாநிலமாக வகைப்படுத்தப்பட்டுள்ளது - தனிநபர் நீர் கிடைக்கும் அளவு தேசிய பற்றாக்குறை வரம்பிற்குக் கீழே உள்ளது. கடந்த பத்தாண்டுகளில் சென்னை மூன்று முறை கிட்டத்தட்ட முழுமையான தண்ணீர் நெருக்கடிகளைச் சந்தித்துள்ளது. ஒரு நீர் கொள்கை நிபுணர் உங்கள் குழுவிடம் கூறுகிறார் - "அடுத்த 20 ஆண்டுகளில் தமிழ்நாட்டின் பொருளாதாரத்திற்கு நீரே ஒரு முக்கிய வளத் தடையாக இருக்கும்."', 'வருங்கால வணிகத் தலைவராக அந்தத் தகவல்களைக் கொண்டு நீங்கள் என்ன செய்வீர்கள்?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'I factor water availability into every location, manufacturing, and supply chain decision I make. A facility that depends on groundwater in a water-stressed region is carrying a risk that does not appear on the balance sheet.', 'நான் எடுக்கும் ஒவ்வொரு இடம், உற்பத்தி மற்றும் விநியோகச் சங்கிலி தொடர்பான முடிவுகளிலும் நீர் கிடைப்பதை ஒரு காரணியாகக் கருதுகிறேன். நீர் பற்றாக்குறை உள்ள ஒரு பிராந்தியத்தில் நிலத்தடி நீரைச் சார்ந்திருக்கும் ஒரு நிறுவனம், அதன் இருப்புநிலைக் குறிப்பில் இடம்பெறாத ஒரு இடரைச் சுமக்கிறது.'),
  (2, 'I see an opportunity - water efficiency technology, recycling infrastructure, and alternative sourcing solutions are going to be essential services. The constraint creates a market.', 'நான் ஒரு வாய்ப்பைக் காண்கிறேன் - நீர் சிக்கனத் தொழில்நுட்பம், மறுசுழற்சி உள்கட்டமைப்பு மற்றும் மாற்று மூலத் தீர்வுகள் ஆகியவை அத்தியாவசிய சேவைகளாக மாறப்போகின்றன. இந்தத் தடையே ஒரு சந்தையை உருவாக்குகிறது.'),
  (3, 'I think about my workforce. Water scarcity affects the communities my employees live in before it affects my facility. A business that ignores its employees'' resource environment is not thinking about productivity correctly.', 'நான் எனது பணியாளர்களைப் பற்றி சிந்திக்கிறேன். தண்ணீர் பற்றாக்குறை எனது நிறுவனத்தைப் பாதிப்பதற்கு முன்பாகவே, என் ஊழியர்கள் வாழும் சமூகங்களைப் பாதிக்கிறது. தனது ஊழியர்களின் வளச் சூழலைப் புறக்கணிக்கும் ஒரு நிறுவனம், உற்பத்தித்திறனைப் பற்றிச் சரியாகச் சிந்திக்கவில்லை.'),
  (4, 'I think about policy engagement. Business leaders who understand water economics have a responsibility to participate in the policy conversations that will determine how Tamil Nadu manages this constraint. Sitting out is not neutral.', 'நான் கொள்கை ரீதியான ஈடுபாட்டைப் பற்றி சிந்திக்கிறேன். நீர் பொருளாதாரத்தைப் புரிந்துகொண்ட வணிகத் தலைவர்களுக்கு, தமிழ்நாடு இந்தத் தடையை எவ்வாறு கையாளும் என்பதைத் தீர்மானிக்கும் கொள்கை உரையாடல்களில் பங்கேற்கும் பொறுப்பு உள்ளது. ஒதுங்கி இருப்பது நடுநிலையான செயல் அல்ல.')
) AS v(ord, en, ta);

-- Survey set 4 #70
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India''s Lokpal - a national anti-corruption ombudsman - was mandated by law in 2013 after a decade of civil society pressure led by Anna Hazare. The first Lokpal was appointed in 2019 - six years after the law was passed. As of 2024 it has completed fewer than 50 investigations. A civil society activist says "India specialises in creating accountability institutions and then making sure they cannot function."', 'What is your response?', 'அண்ணா ஹசாரே தலைமையிலான குடிமைச் சமூகத்தின் பத்தாண்டு கால அழுத்தத்திற்குப் பிறகு, இந்தியாவின் தேசிய ஊழல் ஒழிப்பு குறைதீர்ப்பாளரான லோக்பால், 2013-ல் சட்டத்தின் மூலம் கட்டாயமாக்கப்பட்டது. சட்டம் இயற்றப்பட்டு ஆறு ஆண்டுகளுக்குப் பிறகு, 2019-ல் முதல் லோக்பால் நியமிக்கப்பட்டார். 2024-ஆம் ஆண்டு நிலவரப்படி, அது 50-க்கும் குறைவான விசாரணைகளையே முடித்துள்ளது. "இந்தியா பொறுப்புக்கூறல் நிறுவனங்களை உருவாக்குவதிலும், பின்னர் அவை செயல்பட முடியாதபடி செய்வதை உறுதி செய்வதிலும் நிபுணத்துவம் பெற்றது" என்று ஒரு குடிமைச் சமூக ஆர்வலர் கூறுகிறார்.', 'உங்கள் பதில் என்ன?',
     '{"theme": "Governance & Accountability", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The pattern is clear and deliberate. Institutions that threaten political power are created under public pressure and then defunded, understaffed, and procedurally constrained until they are inert. The Lokpal is one example among many.', 'இந்த முறை தெளிவானது மற்றும் திட்டமிட்டது. அரசியல் அதிகாரத்திற்கு அச்சுறுத்தலாக விளங்கும் நிறுவனங்கள், பொதுமக்களின் அழுத்தத்தின் கீழ் உருவாக்கப்பட்டு, பின்னர் நிதி ஒதுக்கீடு நிறுத்தப்பட்டு, பணியாளர் பற்றாக்குறையுடன், மற்றும் நடைமுறைக் கட்டுப்பாடுகளுக்கு உட்படுத்தப்பட்டு, இறுதியில் அவை செயலிழக்கப்படுகின்றன. லோக்பால் என்பது இது போன்ற பல உதாரணங்களில் ஒன்றாகும்.'),
  (2, 'Six years to appoint and five years of limited output is a governance failure - but institutional building takes time. The CVC, CAG, and Election Commission all took decades to develop real muscle. Patience is warranted.', 'நியமனம் செய்ய ஆறு ஆண்டுகளும், ஐந்து ஆண்டுகளில் குறைந்த அளவிலான செயல்பாடுகளுமே ஒரு நிர்வாகத் தோல்விதான் - ஆனால், நிறுவனங்களைக் கட்டமைப்பதற்கு நேரம் எடுக்கும். மத்திய தணிக்கை ஆணையம் (CVC), தலைமை கணக்குத் தணிக்கையாளர் (CAG) மற்றும் தேர்தல் ஆணையம் ஆகிய அனைத்தும் உண்மையான வலிமையைப் பெறுவதற்குப் பல பத்தாண்டுகள் எடுத்துக்கொண்டன. பொறுமை அவசியம்.'),
  (3, 'The activist is right about the pattern but wrong about the mechanism. It is not always deliberate sabotage - sometimes it is bureaucratic inertia, unclear jurisdiction, and genuine capacity constraints. Intent and outcome are different.', 'செயல்பாட்டாளர் கூறும் செயல்முறை சரியானது, ஆனால் அதன் வழிமுறை தவறானது. இது எப்போதும் வேண்டுமென்றே செய்யப்படும் நாசவேலை அல்ல - சில சமயங்களில் இது அதிகாரத்துவ மந்தநிலை, தெளிவற்ற அதிகார வரம்பு மற்றும் உண்மையான திறன் வரம்புகளாலும் ஏற்படுகிறது. நோக்கமும் விளைவும் வெவ்வேறானவை.'),
  (4, 'The lesson for future leaders is that institutional design matters more than institutional creation. A Lokpal with adequate funding, independent appointment, and clear jurisdiction would function differently. The law created a body. It did not create the conditions for the body to work.', 'வருங்காலத் தலைவர்களுக்கான பாடம் என்னவென்றால், ஒரு அமைப்பை உருவாக்குவதை விட அதன் வடிவமைப்புதான் மிகவும் முக்கியமானது. போதுமான நிதி, சுதந்திரமான நியமனம் மற்றும் தெளிவான அதிகார வரம்பு ஆகியவற்றைக் கொண்ட ஒரு லோக்பால் வித்தியாசமாகச் செயல்படும். சட்டம் ஒரு அமைப்பை உருவாக்கியது. ஆனால், அந்த அமைப்பு செயல்படுவதற்கான சூழலை அது உருவாக்கவில்லை.')
) AS v(ord, en, ta);

-- Survey set 4 #71
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'Verghese Kurien built Amul - the world''s largest dairy cooperative - by putting farmers in ownership of a supply chain that previously exploited them. He turned down multiple private sector opportunities to stay with the cooperative for 40 years.', 'A professor asks - what kind of leader does it take to build something that is not yours to own?', 'முன்னர் விவசாயிகளைச் சுரண்டி வந்த விநியோகச் சங்கிலியின் உரிமையாளர்களாக அவர்களை ஆக்கியதன் மூலம், வர்கீஸ் குரியன் உலகின் மிகப்பெரிய பால் கூட்டுறவு நிறுவனமான அமுலைக் கட்டியெழுப்பினார். அந்தக் கூட்டுறவு நிறுவனத்தில் 40 ஆண்டுகள் நீடிப்பதற்காக, அவர் தனியார் துறையிலிருந்து கிடைத்த பல வாய்ப்புகளை நிராகரித்தார்.', 'சொந்தம் கொண்டாட முடியாத ஒன்றை உருவாக்குவதற்கு எத்தகைய தலைவர் தேவை என்று ஒரு பேராசிரியர் கேட்கிறார்.',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'A leader with a clear enough vision of the outcome that personal ownership of the vehicle becomes secondary. Kurien wanted to see Indian farmers free from exploitation - Amul was the mechanism, not the goal.', 'விளைவைப் பற்றிய தெளிவான பார்வை கொண்ட ஒரு தலைவர், வாகனத்தின் மீதான தனிப்பட்ட உரிமை இரண்டாம் பட்சமாகிவிடும். இந்திய விவசாயிகள் சுரண்டலிலிருந்து விடுபட வேண்டும் என்று குரியன் விரும்பினார் - அமுல் அதற்கான கருவியாக இருந்தது, இலக்காக அல்ல.'),
  (2, 'A leader with enough security to derive satisfaction from others'' success. Most leadership ambition is about personal legacy. Kurien''s model requires subordinating personal legacy to institutional legacy - which is rarer and harder.', 'மற்றவர்களின் வெற்றியிலிருந்து திருப்தி அடையப் போதுமான பாதுகாப்பு உணர்வு கொண்ட ஒரு தலைவர். பெரும்பாலான தலைமைத்துவ லட்சியம் என்பது தனிப்பட்ட மரபுப் பெருமையை உருவாக்குவதைப் பற்றியது. குரியனின் மாதிரி, தனிப்பட்ட மரபுப் பெருமையை நிறுவன மரபுப் பெருமைக்குக் கீழ்ப்படுத்தக் கோருகிறது - இது மிகவும் அரிதானதும் கடினமானதும் ஆகும்.'),
  (3, 'An institution builder rather than an entrepreneur. The skills are different - entrepreneurs optimise for ownership and exit. Institution builders optimise for sustainability and replicability. India needs far more of the second type.', 'ஒரு தொழில்முனைவோரை விட ஒரு நிறுவனத்தை உருவாக்குபவரே சிறந்தவர். திறன்கள் வேறுபட்டவை - தொழில்முனைவோர் உரிமை மற்றும் வெளியேறுதலுக்காக உகந்ததாக்குகிறார்கள். நிறுவனத்தை உருவாக்குபவர்கள் நிலைத்தன்மை மற்றும் மீண்டும் மீண்டும் செயல்படுத்தக்கூடிய தன்மைக்காக உகந்ததாக்குகிறார்கள். இந்தியாவிற்கு இரண்டாவது வகையைச் சேர்ந்தவர்களே அதிக அளவில் தேவைப்படுகிறார்கள்.'),
  (4, 'Someone who understood that the most durable power is the power you give away. Kurien''s influence over Indian dairy policy lasted decades because it was backed by three million farmers - not because he held a title.', 'விட்டுக்கொடுக்கும் சக்தியே மிகவும் நீடித்த சக்தி என்பதைப் புரிந்துகொண்டவர். குரியன் ஒரு பதவியை வகித்ததால் அல்ல, மாறாக மூன்று மில்லியன் விவசாயிகளின் ஆதரவாலேயே இந்திய பால்வளக் கொள்கையில் அவரது செல்வாக்கு பல பத்தாண்டுகள் நீடித்தது.')
) AS v(ord, en, ta);

-- Survey set 4 #72
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'Social media platforms - Facebook, Instagram, YouTube, X - are the primary news source for approximately 60% of Indians under 35. These platforms algorithmically amplify content that generates engagement - which correlates strongly with outrage, fear, and tribal identity rather than accuracy or nuance. A digital media researcher says "we have built the most efficient misinformation distribution system in human history and called it social media."', 'What do you think?', '35 வயதுக்குட்பட்ட இந்தியர்களில் சுமார் 60% பேருக்கு, பேஸ்புக், இன்ஸ்டாகிராம், யூடியூப், எக்ஸ் போன்ற சமூக ஊடகத் தளங்களே முதன்மைச் செய்தி ஆதாரமாக உள்ளன. இந்தத் தளங்கள், ஈடுபாட்டை உருவாக்கும் உள்ளடக்கத்தை அல்காரிதம் மூலம் பெருக்கிப் பரப்புகின்றன. இந்த ஈடுபாடு, துல்லியம் அல்லது நுணுக்கத்தைக் காட்டிலும், சீற்றம், அச்சம் மற்றும் குழு அடையாளத்துடன் வலுவாகத் தொடர்புடையதாக இருக்கிறது. ஒரு டிஜிட்டல் ஊடக ஆய்வாளர், "மனித வரலாற்றிலேயே மிகவும் திறமையான தவறான தகவல் பரவல் அமைப்பை நாம் உருவாக்கி, அதற்கு சமூக ஊடகம் என்று பெயரிட்டுள்ளோம்" என்கிறார்.', 'நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Media & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The framing is accurate but incomplete. The same platforms have also given voice to movements, connected isolated communities, and distributed information that legacy media ignored. The problem is the algorithm not the medium.', 'இந்தக் கட்டமைப்பு துல்லியமானது, ஆனால் முழுமையற்றது. இதே தளங்கள் இயக்கங்களுக்குக் குரல் கொடுத்தும், தனிமைப்படுத்தப்பட்ட சமூகங்களை இணைத்தும், பாரம்பரிய ஊடகங்கள் புறக்கணித்த தகவல்களைப் பரப்பியும் உள்ளன. பிரச்சினை ஊடகத்தில் இல்லை, அல்காரிதத்தில்தான் உள்ளது.'),
  (2, 'The algorithm is not neutral - it was designed to maximise time on platform because time on platform drives advertising revenue. Misinformation is not an unintended consequence. It is an economically rational output of the business model.', 'இந்த அல்காரிதம் நடுநிலையானது அல்ல - தளத்தில் செலவிடும் நேரத்தை அதிகபட்சமாக்குவதற்காகவே இது வடிவமைக்கப்பட்டது, ஏனெனில் தளத்தில் செலவிடும் நேரமே விளம்பர வருவாயை ஈட்டுகிறது. தவறான தகவல் என்பது எதிர்பாராத விளைவு அல்ல. அது வணிக மாதிரியின் பொருளாதார ரீதியாக பகுத்தறிவுள்ள ஒரு வெளியீடாகும்.'),
  (3, 'Platform regulation is inevitable and necessary - but the design of regulation matters enormously. Poorly designed content regulation produces censorship. Well-designed algorithmic transparency requirements might actually change the incentive structure.', 'தள ஒழுங்குமுறை தவிர்க்க முடியாதது மற்றும் அவசியமானது - ஆனால், அந்த ஒழுங்குமுறையின் வடிவமைப்பு மிகவும் முக்கியத்துவம் வாய்ந்தது. மோசமாக வடிவமைக்கப்பட்ட உள்ளடக்க ஒழுங்குமுறை தணிக்கையை உருவாக்குகிறது. நன்கு வடிவமைக்கப்பட்ட நெறிமுறை வெளிப்படைத்தன்மை தேவைகள், ஊக்கக் கட்டமைப்பை உண்மையில் மாற்றக்கூடும்.'),
  (4, 'As a future business leader I think about this as a talent and culture issue. The people I will hire are being shaped by information environments I do not control. Media literacy is not a nice-to-have in my organisation - it is a capability I need to actively build.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், நான் இதை ஒரு திறமை மற்றும் கலாச்சாரப் பிரச்சினையாகக் கருதுகிறேன். நான் பணியமர்த்தும் நபர்கள், என் கட்டுப்பாட்டில் இல்லாத தகவல் சூழல்களால் வடிவமைக்கப்படுகிறார்கள். என் நிறுவனத்தில் ஊடக அறிவு என்பது இருந்தால் நல்லது என்ற ஒன்றல்ல - அது நான் முனைப்புடன் வளர்க்க வேண்டிய ஒரு திறன்.')
) AS v(ord, en, ta);

-- Survey set 4 #73
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'Remote work became normalised during the pandemic and many professionals - including MBA graduates - now expect location flexibility as a standard employment condition. Several large Indian companies have reversed remote work policies and mandated full office return. A CEO who did so says "culture cannot be built on a screen." An employee who resigned over the mandate says "trust cannot be built with surveillance."', 'Who has the stronger argument?', 'பெருந்தொற்று காலத்தில் தொலைதூர வேலை இயல்பானதாக மாறியது. மேலும், MBA பட்டதாரிகள் உட்பட பல தொழில் வல்லுநர்கள், தற்போது பணியிட நெகிழ்வுத்தன்மையை ஒரு நிலையான வேலைவாய்ப்பு நிபந்தனையாக எதிர்பார்க்கின்றனர். பல பெரிய இந்திய நிறுவனங்கள் தொலைதூர வேலைக் கொள்கைகளைத் திரும்பப் பெற்று, முழு அலுவலகப் பணிக்குத் திரும்புவதைக் கட்டாயமாக்கியுள்ளன. அவ்வாறு செய்த ஒரு தலைமைச் செயல் அதிகாரி, "ஒரு திரையின் மூலம் கலாச்சாரத்தை உருவாக்க முடியாது" என்கிறார். இந்தக் கட்டாயத்தால் ராஜினாமா செய்த ஒரு ஊழியர், "கண்காணிப்பின் மூலம் நம்பிக்கையை உருவாக்க முடியாது" என்கிறார்.', 'யாருடைய வாதம் வலுவானது?',
     '{"theme": "Future of Work", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The employee - the return-to-office mandates in most companies are driven by real estate sunk costs and manager comfort, not by evidence that in-person work produces better outcomes. The culture argument is often a proxy for control.', 'ஊழியரைப் பொறுத்தவரை, பெரும்பாலான நிறுவனங்களில் அலுவலகத்திற்குத் திரும்புவதற்கான கட்டாய உத்தரவுகள், நேரில் பணிபுரிவது சிறந்த விளைவுகளைத் தருகிறது என்பதற்கான சான்றுகளால் அல்லாமல், ஏற்கனவே செலவழிக்கப்பட்ட சொத்துக்கள் மற்றும் மேலாளரின் சௌகரியத்தின் அடிப்படையிலேயே பிறப்பிக்கப்படுகின்றன. கலாச்சாரம் குறித்த வாதம் பெரும்பாலும் கட்டுப்பாட்டிற்கான ஒரு மறைமுகப் பதிலீடாகவே உள்ளது.'),
  (2, 'The CEO - culture, mentorship, and the informal learning that happens in shared physical space are real and they are difficult to replicate digitally. The loss is invisible until you measure it five years later in leadership pipeline depth.', 'தலைமைச் செயல் அதிகாரி (CEO) கலாச்சாரம், வழிகாட்டுதல், மற்றும் பகிரப்பட்ட பொது இடத்தில் நிகழும் முறைசாரா கற்றல் ஆகியவை உண்மையானவை; அவற்றை டிஜிட்டல் முறையில் மீண்டும் உருவாக்குவது கடினம். ஐந்து ஆண்டுகளுக்குப் பிறகு தலைமைத்துவப் படிநிலையின் ஆழத்தில் நீங்கள் அதை அளவிடும் வரை, அந்த இழப்பு கண்ணுக்குத் தெரியாது.'),
  (3, 'Both are describing real things. The solution is intentional hybrid design - not defaulting to either extreme. The companies that figure out when in-person interaction is irreplaceable and when it is not will outperform both full-remote and full-office competitors.', 'இருவரும் உண்மையான விஷயங்களையே விவரிக்கிறார்கள். இதற்கான தீர்வு என்பது, எந்தவொரு தீவிர நிலைக்கும் இயல்பாகச் செல்லாமல், திட்டமிட்ட கலப்பின வடிவமைப்பாகும். நேரடித் தொடர்பு எப்போது தவிர்க்க முடியாதது, எப்போது தவிர்க்க முடியாதது அல்ல என்பதைக் கண்டறியும் நிறுவனங்கள், முழுமையாக வீட்டிலிருந்து பணிபுரியும் மற்றும் முழுமையாக அலுவலகத்தில் பணிபுரியும் போட்டியாளர்களை விடச் சிறப்பாகச் செயல்படும்.'),
  (4, 'The framing of the debate misses the actual question - what does each role actually require? A research analyst, a client-facing consultant, and a factory floor supervisor have completely different answers. Blanket policies in either direction are lazy management.', 'இந்த விவாதத்தின் கட்டமைப்பு, ஒவ்வொரு பணிக்கும் உண்மையில் என்ன தேவைப்படுகிறது என்ற உண்மையான கேள்வியைத் தவறவிடுகிறது. ஒரு ஆராய்ச்சி ஆய்வாளர், வாடிக்கையாளர்களை நேரடியாகச் சந்திக்கும் ஆலோசகர் மற்றும் ஒரு தொழிற்சாலை மேற்பார்வையாளர் ஆகியோருக்கு முற்றிலும் மாறுபட்ட பதில்கள் உள்ளன. எந்தத் திசையிலான பொதுவான கொள்கைகளும் சோம்பேறித்தனமான நிர்வாகமே.')
) AS v(ord, en, ta);

-- Survey set 4 #74
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India committed at COP26 to reaching net zero carbon emissions by 2070 - 20 years later than the global target of 2050. Developed nations - which built their economies on carbon-intensive industries for 150 years - are now asking developing nations to transition faster than they did. India''s per capita emissions are 1.9 tonnes annually compared to 14.7 tonnes for the United States. An Indian diplomat says "climate justice and climate urgency are both real - and they are in tension."', 'What is your view?', '2050-ஆம் ஆண்டுக்கான உலகளாவிய இலக்கை விட 20 ஆண்டுகள் தாமதமாக, 2070-ஆம் ஆண்டுக்குள் நிகர பூஜ்ஜிய கரியமில வாயு வெளியேற்றத்தை எட்டுவதாக COP26 மாநாட்டில் இந்தியா உறுதியளித்தது. 150 ஆண்டுகளாக கரியமில வாயுவை அதிகம் வெளியிடும் தொழில்களைக் கொண்டு தங்கள் பொருளாதாரத்தைக் கட்டியெழுப்பிய வளர்ந்த நாடுகள், தாங்கள் செய்ததை விட வேகமாக இந்த மாற்றத்தை அடையுமாறு வளரும் நாடுகளை இப்போது கேட்டுக்கொள்கின்றன. அமெரிக்காவின் தனிநபர் கரியமில வாயு வெளியேற்றம் ஆண்டுக்கு 14.7 டன்களாக இருக்கும் நிலையில், இந்தியாவின் தனிநபர் கரியமில வாயு வெளியேற்றம் 1.9 டன்களாக உள்ளது. "காலநிலை நீதியும், காலநிலை அவசரநிலையும் இரண்டுமே உண்மையானவை - மேலும் அவை ஒன்றுக்கொன்று முரண்பட்டுள்ளன" என்று ஒரு இந்திய தூதரக அதிகாரி கூறுகிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Environment & Business", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She is right and the tension is not resolvable by either side simply declaring the other wrong. The science demands urgency. The equity argument demands differentiated responsibility. Policy has to hold both.', 'அவள் சொல்வது சரிதான், மேலும் இரு தரப்பினரும் ஒருவரையொருவர் தவறு என்று கூறுவதால் மட்டும் இந்தப் பதற்றத்தைத் தீர்த்துவிட முடியாது. அறிவியல் அவசரத் தேவையை வலியுறுத்துகிறது. சமத்துவ வாதம், வேறுபட்ட பொறுப்பைக் கோருகிறது. கொள்கையானது இவ்விரண்டையும் உள்ளடக்கியதாக இருக்க வேண்டும்.'),
  (2, 'The per capita comparison is the most important number in this debate. A country at 1.9 tonnes per capita lecturing a country at 14.7 tonnes about the pace of transition is making an argument that does not survive arithmetic.', 'இந்த விவாதத்தில் தனிநபர் ஒப்பீடே மிக முக்கியமான எண்ணாகும். தனிநபர் கழிவு நுகர்வில் 1.9 டன்கள் கொண்ட ஒரு நாடு, 14.7 டன்கள் கொண்ட மற்றொரு நாட்டிற்கு மாற்றத்தின் வேகம் குறித்து அறிவுரை கூறுவது, கணக்குப் போட்டுப் பார்க்க முடியாத ஒரு வாதத்தை முன்வைப்பதாகும்.'),
  (3, 'The 2070 target is a negotiating position not a destiny. India''s renewable energy trajectory - the world''s fastest growing solar capacity - suggests the actual transition will happen faster than the official commitment implies. Targets and trends are different.', '2070ஆம் ஆண்டு இலக்கு என்பது ஒரு பேச்சுவார்த்தைக்கான நிலைப்பாடே தவிர, அது ஒரு தலைவிதி அல்ல. உலகின் அதிவேகமாக வளர்ந்து வரும் சூரிய ஆற்றல் திறனைக் கொண்ட இந்தியாவின் புதுப்பிக்கத்தக்க ஆற்றல் வளர்ச்சிப் பாதை, அதிகாரப்பூர்வ உறுதிமொழி குறிப்பிடுவதை விட உண்மையான மாற்றம் வேகமாக நிகழும் என்பதைச் சுட்டிக்காட்டுகிறது. இலக்குகளும் போக்குகளும் வெவ்வேறானவை.'),
  (4, 'As a future business leader this tells me that energy transition is not optional - it is a competitive and regulatory inevitability. The question is whether I build energy strategy around the 2070 target or around the trajectory that makes 2070 look conservative.', 'ஒரு வருங்கால வணிகத் தலைவராக, எரிசக்தி மாற்றம் என்பது ஒரு விருப்பத் தேர்வு அல்ல, அது ஒரு போட்டி மற்றும் ஒழுங்குமுறை சார்ந்த தவிர்க்க முடியாத ஒன்று என்பதை இது எனக்கு உணர்த்துகிறது. நான் எனது எரிசக்தி உத்தியை 2070 இலக்கை மையமாகக் கொண்டு உருவாக்குவதா, அல்லது 2070-ஐ ஒரு பழமைவாத இலக்காகத் தோற்றமளிக்கச் செய்யும் ஒரு பாதையை மையமாகக் கொண்டு உருவாக்குவதா என்பதே கேள்வி.')
) AS v(ord, en, ta);

-- Survey set 4 #75
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'Your company is being acquired by a larger competitor. You are part of the integration team. You discover that the acquirer plans to shut down three product lines that serve rural markets - lines that are not profitable but serve communities with no alternative provider. The acquirer says "we are a business not a charity." Your CEO says nothing.', 'What do you do?', 'உங்கள் நிறுவனம் ஒரு பெரிய போட்டியாளரால் கையகப்படுத்தப்படுகிறது. நீங்கள் அந்த ஒருங்கிணைப்புக் குழுவில் இருக்கிறீர்கள். கையகப்படுத்தும் நிறுவனம், கிராமப்புறச் சந்தைகளுக்குச் சேவை செய்யும் மூன்று தயாரிப்பு வரிசைகளை மூடத் திட்டமிட்டுள்ளது என்பதை நீங்கள் கண்டறிகிறீர்கள். அந்த வரிசைகள் இலாபமற்றவை என்றாலும், மாற்று வழங்குநர் இல்லாத சமூகங்களுக்கு அவை சேவை செய்கின்றன. கையகப்படுத்தும் நிறுவனம், "நாங்கள் ஒரு வணிக நிறுவனம், தொண்டு நிறுவனம் அல்ல" என்று கூறுகிறது. உங்கள் தலைமைச் செயல் அதிகாரி எதுவும் கூறவில்லை.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Business & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Raise it formally in the integration process - document the community impact, quantify the social cost, and present an alternative business model that makes the lines viable at smaller scale. Give the acquirer a reason to reconsider not just a moral argument.', 'ஒருங்கிணைப்புச் செயல்பாட்டின்போது இதை முறையாக முன்வையுங்கள் - சமூகத் தாக்கத்தை ஆவணப்படுத்துங்கள், சமூகச் செலவை அளவிடுங்கள், மேலும் சிறிய அளவில் உற்பத்தி வரிசைகளைச் சாத்தியமாக்கும் ஒரு மாற்று வணிக மாதிரியை முன்வையுங்கள். கையகப்படுத்துபவருக்கு வெறும் தார்மீக வாதத்தை மட்டும் முன்வைக்காமல், மறுபரிசீலனை செய்வதற்கான ஒரு காரணத்தையும் கொடுங்கள்.'),
  (2, 'Say nothing in the integration process - this decision is above my level and my job is integration not strategy. But I will use this as information about the kind of organisation I am now part of when I decide my own next move.', 'ஒருங்கிணைப்புச் செயல்பாட்டின் போது எதுவும் கூற வேண்டாம் - இந்த முடிவு என் அதிகார வரம்பிற்கு அப்பாற்பட்டது, மேலும் என் பணி ஒருங்கிணைப்புதான், வியூகம் வகுப்பதல்ல. ஆனால், எனது அடுத்தகட்ட நகர்வை நான் தீர்மானிக்கும்போது, ​​தற்போது நான் அங்கம் வகிக்கும் அமைப்பின் தன்மையைப் பற்றிய ஒரு தகவலாக இதைப் பயன்படுத்திக்கொள்வேன்.'),
  (3, 'Speak to my CEO privately first. The acquirer''s decision is theirs to make. But my CEO''s silence is a choice I want to understand before I decide whether to raise it further.', 'முதலில் எனது தலைமை நிர்வாக அதிகாரியிடம் தனிப்பட்ட முறையில் பேசுங்கள். கையகப்படுத்துபவரின் முடிவு அவர்களுடையது. ஆனால், இதை மேலும் கொண்டு செல்வதா வேண்டாமா என்று முடிவெடுப்பதற்கு முன், எனது தலைமை நிர்வாக அதிகாரியின் இந்த மௌனத்தை நான் புரிந்துகொள்ள விரும்புகிறேன்.'),
  (4, 'Accept that profitable businesses serve communities differently than social enterprises - and that expecting this acquirer to cross-subsidise rural service delivery is not a reasonable ask. Channel the concern into policy advocacy instead.', 'இலாபம் ஈட்டும் வணிகங்கள், சமூக நிறுவனங்களை விட சமூகங்களுக்கு வித்தியாசமான முறையில் சேவை செய்கின்றன என்பதையும், இந்தக் கையகப்படுத்துபவர் கிராமப்புற சேவை வழங்கலுக்குக் குறுக்கு மானியம் வழங்குவார் என்று எதிர்பார்ப்பது ஒரு நியாயமான கோரிக்கை அல்ல என்பதையும் ஏற்றுக்கொள்ளுங்கள். அதற்குப் பதிலாக, இந்தக் கவலையைக் கொள்கை ரீதியான பரிந்துரையில் செலுத்துங்கள்.')
) AS v(ord, en, ta);

-- Survey set 4 #76
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India''s direct tax base is approximately 8 crore income tax filers in a country of 140 crore people. Only 1.5 crore people pay income tax at meaningful rates. A finance minister once described India as "a country of 130 crore people where only 1.5 crore pay tax." A classmate says "the narrow tax base is India''s most underrated governance problem."', 'Is he right?', '140 கோடி மக்கள் தொகை கொண்ட இந்தியாவில், சுமார் 8 கோடி பேர் மட்டுமே வருமான வரி செலுத்துபவர்களாக உள்ளனர். இவர்களில் 1.5 கோடி பேர் மட்டுமே குறிப்பிடத்தக்க அளவில் வருமான வரி செலுத்துகின்றனர். ஒரு நிதியமைச்சர், இந்தியாவை "130 கோடி மக்கள் தொகை கொண்ட நாட்டில், 1.5 கோடி பேர் மட்டுமே வரி செலுத்துகிறார்கள்" என்று ஒருமுறை வர்ணித்தார். ஒரு வகுப்புத் தோழர், "இந்தக் குறுகிய வரி அடிப்படைதான் இந்தியாவின் மிகவும் குறைத்து மதிப்பிடப்பட்ட ஆளுகைப் பிரச்சினை" என்கிறார்.', 'அவர் சொல்வது சரியா?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - a government that depends on a tiny fraction of citizens for its revenue is not democratically accountable to the majority. The people who fund the state are not the same people who vote in the largest numbers. That misalignment shapes every policy decision.', 'ஆம் - தனது வருவாய்க்காக மிகச் சிறிய சதவீதக் குடிமக்களைச் சார்ந்திருக்கும் ஒரு அரசாங்கம், பெரும்பான்மையினருக்கு ஜனநாயக ரீதியாகப் பொறுப்புடையதாக இருப்பதில்லை. அரசுக்கு நிதி வழங்கும் மக்களும், பெருமளவில் வாக்களிக்கும் மக்களும் ஒருவரல்ல. அந்தப் பொருத்தமின்மையே ஒவ்வொரு கொள்கை முடிவையும் வடிவமைக்கிறது.'),
  (2, 'Partially - the narrow formal tax base is a symptom of the informal economy''s size. Formalisation, not tax enforcement, is the correct intervention. You cannot tax people who have no formal economic existence.', 'ஓரளவு - குறுகிய முறைசார் வரி அடிப்படை என்பது முறைசாரா பொருளாதாரத்தின் அளவின் ஓர் அறிகுறியாகும். வரி அமலாக்கம் அல்ல, முறைப்படுத்துதலே சரியான தலையீடு. முறைசார் பொருளாதார இருப்பு இல்லாதவர்களுக்கு வரி விதிக்க முடியாது.'),
  (3, 'GST has already broadened the indirect tax base to include informal economy participants. The income tax conversation is important but the indirect tax story is more encouraging than the framing suggests.', 'ஜிஎஸ்டி ஏற்கனவே முறைசாரா பொருளாதாரப் பங்கேற்பாளர்களை உள்ளடக்கி, மறைமுக வரித் தளத்தை விரிவுபடுத்தியுள்ளது. வருமான வரி குறித்த உரையாடல் முக்கியமானதுதான், ஆனால் அதன் சித்தரிப்பு குறிப்பிடுவதை விட மறைமுக வரியின் நிலை அதிக ஊக்கமளிப்பதாக உள்ளது.'),
  (4, 'The narrow base also means that those who do pay taxes pay rates that reduce their incentive to grow. A broader base at lower rates would raise more revenue and create better economic behaviour simultaneously.', 'குறுகிய வரி அடிப்படை என்பது, வரி செலுத்துவோர் தங்கள் வளர்ச்சிக்கான ஊக்கத்தைக் குறைக்கும் விகிதங்களில் வரி செலுத்துகிறார்கள் என்பதையும் குறிக்கிறது. குறைந்த விகிதங்களில் ஒரு பரந்த வரி அடிப்படை, அதிக வருவாயை ஈட்டி, அதே நேரத்தில் சிறந்த பொருளாதாரச் செயல்பாட்டையும் உருவாக்கும்.')
) AS v(ord, en, ta);

-- Survey set 4 #77
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'A classmate returns from a rural immersion visit and says - "I spent a week in a village and I realised I know nothing about India." Another classmate who grew up in a small town in Tamil Nadu says - "I am glad you had that realisation. We have been trying to tell you for two years."', 'What does this exchange reveal?', 'ஒரு வகுப்புத் தோழன் கிராமப்புறச் சுற்றுலா சென்று திரும்பி வந்து, "நான் ஒரு கிராமத்தில் ஒரு வாரம் தங்கியிருந்தேன், அப்போதுதான் இந்தியாவைப் பற்றி எனக்கு ஒன்றுமே தெரியாது என்பதை உணர்ந்தேன்" என்கிறான். தமிழ்நாட்டில் உள்ள ஒரு சிறிய ஊரில் வளர்ந்த மற்றொரு வகுப்புத் தோழன், "உனக்கு அந்த உணர்வு ஏற்பட்டதில் எனக்கு மகிழ்ச்சி. நாங்கள் இரண்டு வருடங்களாக இதைத்தான் உன்னிடம் சொல்ல முயன்றுகொண்டிருந்தோம்" என்கிறான்.', 'இந்த உரையாடல் எதை வெளிப்படுத்துகிறது?',
     '{"theme": "Social Responsibility", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It reveals that elite education creates a specific kind of blindness - not ignorance exactly, but a confidence about India built from data and case studies that substitutes for actual proximity to the India most people live in.', 'உயர்கல்வி ஒரு குறிப்பிட்ட வகையான குருட்டுத்தன்மையை உருவாக்குகிறது என்பதை இது வெளிப்படுத்துகிறது - அது துல்லியமாக அறியாமை அல்ல, மாறாக பெரும்பாலான மக்கள் வாழும் இந்தியாவுடனான உண்மையான நெருக்கத்திற்கு மாற்றாக, தரவுகள் மற்றும் நிகழ்வு ஆய்வுகளின் அடிப்படையில் இந்தியா குறித்து கட்டமைக்கப்படும் ஒருவித தன்னம்பிக்கையாகும்.'),
  (2, 'It reveals that the second classmate has been carrying knowledge that the curriculum did not value enough to surface. The immersion visit gave the first classmate a week of what the second classmate brought to every class discussion.', 'பாடத்திட்டம் வெளிக்கொணரப் போதுமான அளவு மதிக்காத அறிவை இரண்டாவது வகுப்புத் தோழர் கொண்டிருந்திருக்கிறார் என்பதை இது வெளிப்படுத்துகிறது. அந்த நேரடிப் பயிற்சிப் பயணம், இரண்டாவது வகுப்புத் தோழர் ஒவ்வொரு வகுப்பு விவாதத்திற்கும் கொண்டு வந்ததை முதல் வகுப்புத் தோழருக்கு ஒரு வார காலத்திற்கு வழங்கியது.'),
  (3, 'It reveals a design failure in MBA education. If a week-long village visit produces more insight than two years of classroom learning about India - the two years need to be redesigned not celebrated.', 'இது MBA கல்வியில் உள்ள ஒரு வடிவமைப்புத் தோல்வியை வெளிப்படுத்துகிறது. இந்தியாவைப் பற்றி இரண்டு வருட வகுப்பறைக் கற்றலை விட, ஒரு வார கால கிராமப் பயணம் அதிகப் புரிதலைத் தருகிறது என்றால், அந்த இரண்டு வருடங்களைக் கொண்டாடுவதற்குப் பதிலாக மறுவடிவமைப்பு செய்ய வேண்டும்.'),
  (4, 'It reveals something true about all of us - proximity changes understanding in ways that data cannot replicate. The honest response is not guilt about the gap but curiosity about what else we are missing.', 'இது நம் அனைவரையும் பற்றிய ஒரு உண்மையை வெளிப்படுத்துகிறது - தரவுகளால் மீண்டும் உருவாக்க முடியாத வழிகளில் நெருக்கம் புரிதலை மாற்றுகிறது. நேர்மையான பதில் என்பது அந்த இடைவெளியைப் பற்றிய குற்றவுணர்ச்சி அல்ல, மாறாக நாம் வேறு எதையெல்லாம் இழக்கிறோம் என்பது பற்றிய ஆர்வம்தான்.')
) AS v(ord, en, ta);

-- Survey set 4 #78
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'India''s Digital Personal Data Protection Act was passed in 2023. It gives citizens the right to know what data companies hold about them, the right to correction, and the right to erasure. Critics say enforcement mechanisms are weak and the government exempted itself from most provisions. A tech policy researcher says "India wrote a privacy law that protects companies from citizens more than citizens from companies."', 'What is your view?', 'இந்தியாவின் டிஜிட்டல் தனிநபர் தரவுப் பாதுகாப்புச் சட்டம் 2023-ல் நிறைவேற்றப்பட்டது. இது, நிறுவனங்கள் தங்களைப் பற்றி என்ன தரவுகளை வைத்துள்ளன என்பதை அறிந்துகொள்ளும் உரிமை, திருத்தும் உரிமை மற்றும் அழிக்கும் உரிமை ஆகியவற்றை குடிமக்களுக்கு வழங்குகிறது. அமலாக்க வழிமுறைகள் பலவீனமாக இருப்பதாகவும், பெரும்பாலான விதிகளிலிருந்து அரசாங்கம் தனக்குத்தானே விலக்கு அளித்துக்கொண்டதாகவும் விமர்சகர்கள் கூறுகின்றனர். ஒரு தொழில்நுட்பக் கொள்கை ஆய்வாளர், "இந்தியா, குடிமக்களை நிறுவனங்களிடமிருந்து பாதுகாப்பதை விட, நிறுவனங்களைக் குடிமக்களிடமிருந்து அதிகமாகப் பாதுகாக்கும் ஒரு தனியுரிமைச் சட்டத்தை இயற்றியுள்ளது" என்கிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Governance & Technology", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The criticism is valid - a privacy law that exempts the largest data collector in the country from its own provisions is structurally compromised from the start.', 'இந்த விமர்சனம் நியாயமானதே - நாட்டின் மிகப்பெரிய தரவு சேகரிப்பாளரை அதன் சொந்த விதிகளிலிருந்து விலக்கு அளிக்கும் ஒரு தனியுரிமைச் சட்டம், தொடக்கத்திலிருந்தே கட்டமைப்பு ரீதியாகச் சமரசம் செய்யப்பட்டதாகும்.'),
  (2, 'The law is a first step in a country that had no data protection framework at all. Imperfect legislation that establishes the principle is better than perfect legislation that does not exist. Reform it over time.', 'தரவுப் பாதுகாப்பு கட்டமைப்பு எதுவுமே இல்லாத ஒரு நாட்டில், இந்தச் சட்டம் ஒரு முதல் படியாகும். இல்லாத ஒரு முழுமையான சட்டத்தை விட, கொள்கையை நிலைநாட்டும் ஒரு முழுமையற்ற சட்டமே சிறந்தது. காலப்போக்கில் அதைச் சீர்திருத்துங்கள்.'),
  (3, 'The enforcement gap is the real issue - not the text of the law. GDPR in Europe has strong text and weak enforcement in several member states. Laws do not protect people. Enforcement does.', 'சட்டத்தின் வாசகம் அல்ல, அதை அமல்படுத்துவதில் உள்ள இடைவெளிதான் உண்மையான பிரச்சினை. ஐரோப்பாவில் உள்ள பல உறுப்பு நாடுகளில் GDPR வலுவான வாசகத்தைக் கொண்டிருந்தாலும், அதன் அமலாக்கம் பலவீனமாக உள்ளது. சட்டங்கள் மக்களைப் பாதுகாப்பதில்லை. அமலாக்கமே பாதுகாக்கிறது.'),
  (4, 'As a future business leader this law changes my data practices regardless of enforcement risk. Building data systems that respect user rights is increasingly a competitive differentiator - not just a compliance requirement.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில், அமலாக்க அபாயத்தைப் பொருட்படுத்தாமல் இந்தச் சட்டம் எனது தரவு நடைமுறைகளை மாற்றுகிறது. பயனர் உரிமைகளை மதிக்கும் தரவு அமைப்புகளை உருவாக்குவது, வெறும் இணக்கத் தேவை மட்டுமல்ல, அது பெருகிய முறையில் ஒரு போட்டி வேறுபடுத்திக் காட்டும் காரணியாகவும் விளங்குகிறது.')
) AS v(ord, en, ta);

-- Survey set 4 #79
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'The Indian Administrative Service - the IAS - is considered the steel frame of Indian governance. IAS officers run districts, implement schemes, and lead state and central ministries. Entry is through one of the world''s most competitive examinations. Yet surveys consistently show that IAS officers cite political interference, transfer postings used as punishment, and an inability to act on long-term priorities as their greatest frustrations. A retired collector says "we select the best people in the country and then put them in a system designed to prevent them from doing their best work."', 'What does this tell you?', 'இந்திய ஆட்சிப் பணி - ஐ.ஏ.எஸ் - இந்திய ஆட்சியின் எஃகுச் சட்டகமாகக் கருதப்படுகிறது. ஐ.ஏ.எஸ் அதிகாரிகள் மாவட்டங்களை நிர்வகிக்கிறார்கள், திட்டங்களைச் செயல்படுத்துகிறார்கள், மேலும் மாநில மற்றும் மத்திய அமைச்சகங்களை வழிநடத்துகிறார்கள். உலகின் மிகவும் போட்டி நிறைந்த தேர்வுகளில் ஒன்றின் மூலம் இதில் நுழைவு நடைபெறுகிறது. இருப்பினும், அரசியல் தலையீடு, தண்டனையாகப் பயன்படுத்தப்படும் இடமாற்றங்கள், மற்றும் நீண்டகால முன்னுரிமைகளில் செயல்பட இயலாமை ஆகியவற்றை ஐ.ஏ.எஸ் அதிகாரிகள் தங்களின் மிகப்பெரிய விரக்திகளாகக் குறிப்பிடுவதாக ஆய்வுகள் தொடர்ந்து காட்டுகின்றன. ஓய்வுபெற்ற ஒரு மாவட்ட ஆட்சியர் கூறுகிறார், "நாம் நாட்டிலேயே சிறந்தவர்களைத் தேர்ந்தெடுத்து, பின்னர் அவர்கள் தங்களின் சிறந்த பணியைச் செய்வதைத் தடுக்கும் வகையில் வடிவமைக்கப்பட்ட ஒரு அமைப்பில் அவர்களை அமர்த்துகிறோம்."', 'இது உங்களுக்கு என்ன சொல்கிறது?',
     '{"theme": "Leadership & Institutions", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It tells me that system design matters more than talent selection. The best people in a broken system produce broken outcomes. India''s governance problem is not a talent problem - it is an institutional design problem.', 'திறமையாளர் தேர்வை விட அமைப்பு வடிவமைப்புதான் முக்கியம் என்பதை இது எனக்கு உணர்த்துகிறது. சீர்கெட்ட ஓர் அமைப்பில் உள்ள சிறந்த நபர்கள், சீர்கெட்ட விளைவுகளையே ஏற்படுத்துகிறார்கள். இந்தியாவின் ஆளுகைப் பிரச்சினை என்பது திறமை சார்ந்த பிரச்சினை அல்ல - அது ஓர் நிறுவன வடிவமைப்புப் பிரச்சினை.'),
  (2, 'It tells me that the IAS model needs fundamental reform - fixed tenures, performance-based postings, reduced political control over transfers, and meaningful career consequences for poor outcomes rather than just reassignment.', 'ஐஏஎஸ் முறைக்கு அடிப்படை சீர்திருத்தம் தேவை என்பதை இது எனக்கு உணர்த்துகிறது - அதாவது, நிலையான பதவிக்காலங்கள், செயல்திறன் அடிப்படையிலான இடமாற்றங்கள், இடமாற்றங்கள் மீதான அரசியல் கட்டுப்பாட்டைக் குறைத்தல், மற்றும் மோசமான முடிவுகளுக்கு வெறும் இடமாற்றத்தைத் தவிர்த்து, அர்த்தமுள்ள பணி சார்ந்த பின்விளைவுகளை ஏற்படுத்துதல் போன்றவை.'),
  (3, 'It tells me something about organisations generally. Every institution that selects highly capable people and then prevents them from exercising capability will eventually lose them - to cynicism, to private sector, or to just going through the motions.', 'இது பொதுவாக நிறுவனங்களைப் பற்றி எனக்கு ஒரு விஷயத்தைச் சொல்கிறது. மிகவும் திறமையானவர்களைத் தேர்ந்தெடுத்து, பின்னர் அவர்கள் தங்கள் திறமையைப் பயன்படுத்துவதைத் தடுக்கும் எந்தவொரு நிறுவனமும், இறுதியில் அவர்களை இழந்துவிடும் - அது அவநம்பிக்கையாலோ, தனியார் துறைக்காலோ, அல்லது கடமைக்காக மட்டும் செயல்படுவதாலோ நிகழலாம்.'),
  (4, 'It tells me that the relationship between political leaders and administrative officers is the core variable in governance quality. Where politicians want good governance and give officers space to deliver it - the system works remarkably well. Where they do not - nothing else matters.', 'அரசியல் தலைவர்களுக்கும் நிர்வாக அதிகாரிகளுக்கும் இடையிலான உறவே ஆளுகையின் தரத்தில் மையக் காரணியாக உள்ளது என்பதை இது எனக்கு உணர்த்துகிறது. அரசியல்வாதிகள் நல்லாட்சியை விரும்பி, அதை வழங்குவதற்கு அதிகாரிகளுக்கு வாய்ப்பளிக்கும் இடங்களில், அந்த அமைப்பு மிகச் சிறப்பாகச் செயல்படுகிறது. அவர்கள் அவ்வாறு செய்யாத இடங்களில், வேறு எதுவும் பொருட்படுத்தப்படுவதில்லை.')
) AS v(ord, en, ta);

-- Survey set 4 #80
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 4,
     'You are offered two job offers on the same day. The first pays ₹40 lakh per year at a global consulting firm in Mumbai. The second pays ₹18 lakh at a social enterprise working on rural water access in Tamil Nadu - with a genuine promise of impact, ownership, and a leadership role within two years. You have ₹15 lakh in student loans.', 'What do you actually do - and what do you tell yourself about why?', 'உங்களுக்கு ஒரே நாளில் இரண்டு வேலை வாய்ப்புகள் வழங்கப்படுகின்றன. முதலாவது, மும்பையில் உள்ள ஒரு உலகளாவிய ஆலோசனை நிறுவனத்தில் ஆண்டுக்கு ₹40 லட்சம் சம்பளத்தில் கிடைக்கிறது. இரண்டாவது, தமிழ்நாட்டில் கிராமப்புற நீர் விநியோகத்திற்காகப் பணியாற்றும் ஒரு சமூக நிறுவனத்தில் ₹18 லட்சம் சம்பளத்தில் கிடைக்கிறது - மேலும் இரண்டு ஆண்டுகளுக்குள் ஒரு தாக்கத்தை ஏற்படுத்துதல், பொறுப்பேற்றல் மற்றும் ஒரு தலைமைப் பாத்திரம் ஆகியவற்றுக்கான உண்மையான வாக்குறுதியும் அளிக்கப்படுகிறது. உங்களுக்கு ₹15 லட்சம் மாணவர் கடன் உள்ளது.', 'நீங்கள் உண்மையில் என்ன செய்கிறீர்கள் - ஏன் செய்கிறீர்கள் என்பது குறித்து உங்களுக்கு நீங்களே என்ன சொல்லிக்கொள்கிறீர்கள்?',
     '{"theme": "The MBA & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'I take the consulting offer - clear the loan in three years and then make the choice I actually want to make from a position of financial security. I tell myself this is strategy not compromise. I hope I am right.', 'நான் அந்த ஆலோசனைப் பணியை ஏற்றுக்கொள்கிறேன் - மூன்று ஆண்டுகளில் கடனை அடைத்துவிட்டு, அதன் பிறகு நிதிப் பாதுகாப்புடன் நான் உண்மையிலேயே எடுக்க விரும்பும் முடிவை எடுக்க வேண்டும். இது ஒரு உத்தி, சமரசமல்ல என்று எனக்கு நானே சொல்லிக்கொள்கிறேன். நான் சொல்வது சரியாக இருக்கும் என நம்புகிறேன்.'),
  (2, 'I take the social enterprise offer. The ₹22 lakh gap is real but so is the cost of deferring the work I came here to do. I tell myself the loan can be managed. I need to believe that is true not just say it.', 'நான் அந்த சமூக நலத்திட்ட வாய்ப்பை ஏற்றுக்கொள்கிறேன். ₹22 லட்சம் இடைவெளி என்பது நிஜம்தான், ஆனால் நான் இங்கு செய்ய வந்த வேலையை ஒத்திப்போடுவதால் ஏற்படும் செலவும் நிஜம்தான். கடனைச் சமாளித்துவிடலாம் என்று எனக்கு நானே சொல்லிக்கொள்கிறேன். அது உண்மை என்று நான் நம்ப வேண்டும், வெறுமனே சொல்லக்கூடாது.'),
  (3, 'I negotiate - with the consulting firm for a rural or development practice assignment, and with the social enterprise for a structured path to the leadership role they promised. I tell myself both offers are opening positions not final terms.', 'ஆலோசனை நிறுவனத்துடன் ஒரு கிராமப்புற அல்லது மேம்பாட்டுப் பணி ஒதுக்கீட்டிற்காகவும், சமூக நிறுவனத்துடன் அவர்கள் வாக்குறுதியளித்த தலைமைப் பதவிக்கான ஒரு கட்டமைக்கப்பட்ட பாதைக்காகவும் நான் பேச்சுவார்த்தை நடத்துகிறேன். இந்த இரண்டு சலுகைகளும் ஆரம்ப நிலைகளே தவிர, இறுதி நிலைகள் அல்ல என்று எனக்கு நானே சொல்லிக்கொள்கிறேன்.'),
  (4, 'I make the decision that I can explain honestly to myself in ten years - not the one that sounds best in either direction right now. I tell myself that clarity about my own reasoning is the only honest basis for a choice this significant.', 'தற்போதைக்கு எந்தப் பக்கம் சிறந்ததாகத் தோன்றினாலும், அந்த முடிவை நான் எடுப்பதில்லை; மாறாக, பத்து வருடங்கள் கழித்து எனக்கு நானே நேர்மையாக விளக்கிக்கொள்ளக்கூடிய ஒரு முடிவை எடுக்கிறேன். இவ்வளவு முக்கியமான ஒரு முடிவிற்கு, எனது சொந்தக் காரணங்களைப் பற்றிய தெளிவுதான் ஒரே நேர்மையான அடிப்படை என்று எனக்கு நானே சொல்லிக்கொள்கிறேன்.')
) AS v(ord, en, ta);

-- Survey set 5 #81
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s Supreme Court has 34 judges including the Chief Justice. It receives approximately 60,000 new cases every year and has a backlog of over 70,000 pending matters. Collegium - a body of senior judges - appoints new judges without parliamentary confirmation or executive approval. A law professor says "India has the most powerful judiciary in the world and one of the least accountable."', 'What is your view?', 'இந்திய உச்ச நீதிமன்றத்தில் தலைமை நீதிபதி உட்பட 34 நீதிபதிகள் உள்ளனர். இது ஒவ்வொரு ஆண்டும் சுமார் 60,000 புதிய வழக்குகளைப் பெறுகிறது, மேலும் 70,000-க்கும் மேற்பட்ட வழக்குகள் நிலுவையில் உள்ளன. மூத்த நீதிபதிகள் அடங்கிய அமைப்பான கொலீஜியம், நாடாளுமன்ற ஒப்புதல் அல்லது நிர்வாக அனுமதி இல்லாமலேயே புதிய நீதிபதிகளை நியமிக்கிறது. ஒரு சட்டப் பேராசிரியர், "இந்தியா உலகின் மிகவும் சக்திவாய்ந்த நீதித்துறையைக் கொண்டுள்ளது, ஆனால் அதே சமயம் மிகக் குறைந்த பொறுப்புக்கூறல் கொண்ட நீதித்துறைகளில் ஒன்றாகவும் உள்ளது" என்கிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Political Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'She is right on both counts. Judicial review, PIL jurisdiction, and contempt powers make Indian courts extraordinarily powerful. Collegium appointments with no external scrutiny make them extraordinarily self-governing. Power without accountability is a problem regardless of who holds it.', 'இரண்டு விஷயங்களிலும் அவர் சொல்வது சரிதான். நீதித்துறை மறுஆய்வு, பொதுநல வழக்கு அதிகார வரம்பு மற்றும் நீதிமன்ற அவமதிப்பு அதிகாரங்கள் ஆகியவை இந்திய நீதிமன்றங்களை அசாதாரணமான சக்தி வாய்ந்தவையாக ஆக்குகின்றன. வெளிப்புறக் கண்காணிப்பு இல்லாத கொலீஜியம் நியமனங்கள், அவற்றை அசாதாரணமான தன்னாட்சி கொண்டவையாக ஆக்குகின்றன. பொறுப்புக்கூறல் இல்லாத அதிகாரம், அது யாரிடம் இருந்தாலும் ஒரு சிக்கலாகும்.'),
  (2, 'The collegium system exists because judicial independence requires insulation from political appointment. Every country that allows politicians to confirm judges has seen that process weaponised. The accountability problem is real - but the alternative is worse.', 'நீதித்துறை சுதந்திரத்திற்கு அரசியல் நியமனங்களிலிருந்து பாதுகாப்பு தேவைப்படுவதால், கொலீஜியம் அமைப்பு நடைமுறையில் உள்ளது. நீதிபதிகளை நியமிக்க அரசியல்வாதிகளை அனுமதிக்கும் ஒவ்வொரு நாட்டிலும், அந்த செயல்முறை ஒரு ஆயுதமாகப் பயன்படுத்தப்படுவது காணப்படுகிறது. பொறுப்புக்கூறல் பிரச்சினை உண்மையானது - ஆனால் அதற்கு மாற்று வழி இன்னும் மோசமானது.'),
  (3, 'Accountability and independence are not binary. Transparent criteria for appointments, mandatory recusal rules, and published reasoning for collegium decisions would increase accountability without compromising independence.', 'பொறுப்புடைமையும் சுதந்திரமும் இருமுனைப்பட்டவை அல்ல. நியமனங்களுக்கான வெளிப்படையான அளவுகோல்கள், கட்டாய விலகல் விதிகள், மற்றும் குழுவின் முடிவுகளுக்கான வெளியிடப்பட்ட காரணங்கள் ஆகியவை சுதந்திரத்திற்குப் பங்கம் விளைவிக்காமல் பொறுப்புடைமையை அதிகரிக்கும்.'),
  (4, 'The more urgent problem is not who appoints judges but how long cases take. A court that takes 15 years to resolve a matter is not functioning as a justice system regardless of how its judges were selected.', 'நீதிபதிகளை யார் நியமிக்கிறார்கள் என்பதல்ல அவசரமான பிரச்சினை; மாறாக, வழக்குகள் முடிவடைய எவ்வளவு காலம் ஆகிறது என்பதே. ஒரு வழக்கைத் தீர்க்க 15 ஆண்டுகள் எடுத்துக்கொள்ளும் நீதிமன்றம், அதன் நீதிபதிகள் எவ்வாறு தேர்ந்தெடுக்கப்பட்டிருந்தாலும், ஒரு நீதி அமைப்பாகச் செயல்படாது.')
) AS v(ord, en, ta);

-- Survey set 5 #82
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s manufacturing sector contributes approximately 17% of GDP - well below the 25–30% seen in China, South Korea, and Germany at comparable development stages. The Make in India initiative was launched in 2014 with a target of raising manufacturing to 25% of GDP by 2022. That target was not met. A professor says "India keeps trying to become a manufacturing powerhouse and keeps producing a services economy instead."', 'What explains this?', 'இந்தியாவின் உற்பத்தித் துறை, மொத்த உள்நாட்டு உற்பத்தியில் ஏறக்குறைய 17% பங்களிக்கிறது. இது, ஒப்பிடத்தக்க வளர்ச்சி நிலைகளில் உள்ள சீனா, தென் கொரியா மற்றும் ஜெர்மனியில் காணப்படும் 25-30% பங்களிப்பை விட மிகவும் குறைவாகும். 2022-ஆம் ஆண்டுக்குள் உற்பத்தித் துறையின் பங்களிப்பை மொத்த உள்நாட்டு உற்பத்தியில் 25% ஆக உயர்த்துவதை இலக்காகக் கொண்டு, ''மேக் இன் இந்தியா'' திட்டம் 2014-ஆம் ஆண்டில் தொடங்கப்பட்டது. அந்த இலக்கு எட்டப்படவில்லை. ஒரு பேராசிரியர் கூறுகிறார், "இந்தியா ஒரு உற்பத்தி வல்லரசாக மாற தொடர்ந்து முயற்சி செய்து, அதற்குப் பதிலாக ஒரு சேவைப் பொருளாதாரத்தையே தொடர்ந்து உருவாக்கிக் கொண்டிருக்கிறது."', 'இதற்கு என்ன காரணம்?',
     '{"theme": "Economic Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Land acquisition, labour law rigidity, and infrastructure gaps make India structurally expensive for manufacturing compared to Vietnam, Bangladesh, and Indonesia. The policy intent has been consistent - the enabling environment has not.', 'நிலம் கையகப்படுத்துதல், தொழிலாளர் சட்டங்களின் விறைப்புத்தன்மை மற்றும் உள்கட்டமைப்பு இடைவெளிகள் ஆகியவை, வியட்நாம், பங்களாதேஷ் மற்றும் இந்தோனேசியாவுடன் ஒப்பிடுகையில், இந்தியாவை உற்பத்தித் துறைக்குக் கட்டமைப்பு ரீதியாக அதிக செலவு மிக்கதாக ஆக்குகின்றன. கொள்கையின் நோக்கம் சீராக இருந்து வருகிறது - ஆனால், அதற்கு உகந்த சூழல் அமையவில்லை.'),
  (2, 'India''s comparative advantage genuinely lies in services - software, finance, healthcare, education. Forcing manufacturing growth against comparative advantage produces subsidised inefficiency not competitive industry.', 'இந்தியாவின் ஒப்பீட்டு அனுகூலம் உண்மையாகவே மென்பொருள், நிதி, சுகாதாரம், கல்வி போன்ற சேவைத் துறைகளில்தான் உள்ளது. ஒப்பீட்டு அனுகூலத்திற்கு எதிராக உற்பத்தித் துறை வளர்ச்சியைத் திணிப்பது, மானியம் சார்ந்த திறமையின்மையையே உருவாக்கும், போட்டித்தன்மை வாய்ந்த தொழில்துறையை அல்ல.'),
  (3, 'The China-plus-one opportunity is real and India is capturing some of it - in electronics, pharmaceuticals, and defence. The story is not failure - it is slower and more selective success than the target implied.', 'சீனாவுடன் இணைந்து செயல்படும் வாய்ப்பு உண்மையானது, மேலும் இந்தியா மின்னணுவியல், மருந்துத் துறை மற்றும் பாதுகாப்புத் துறைகளில் அதன் ஒரு பகுதியைக் கைப்பற்றி வருகிறது. இது ஒரு தோல்வியின் கதை அல்ல; மாறாக, இலக்கு உணர்த்தியதை விட இது ஒரு மெதுவான மற்றும் தேர்ந்தெடுக்கப்பட்ட வெற்றியாகும்.'),
  (4, 'Manufacturing requires patient capital, long-term infrastructure commitment, and stable policy over decades. India''s political cycle and coalition pressures make sustained manufacturing policy almost impossible to execute. The problem is political economy not economic potential.', 'உற்பத்தித் துறைக்கு பொறுமையான மூலதனம், நீண்ட கால உள்கட்டமைப்பு அர்ப்பணிப்பு மற்றும் பல பத்தாண்டுகளுக்கு நீடிக்கும் நிலையான கொள்கை ஆகியவை தேவைப்படுகின்றன. இந்தியாவின் அரசியல் சூழலும் கூட்டணி அழுத்தங்களும், நீடித்த உற்பத்திக் கொள்கையைச் செயல்படுத்துவதை ஏறக்குறைய சாத்தியமற்றதாக்குகின்றன. பிரச்சனை பொருளாதார ஆற்றலில் இல்லை, அரசியல் பொருளாதாரத்தில்தான் உள்ளது.')
) AS v(ord, en, ta);

-- Survey set 5 #83
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India has 29 scheduled languages and over 1,600 dialects. The three-language formula - introduced in the 1960s - recommends that students learn their regional language, Hindi, and English. Several southern states - particularly Tamil Nadu - have resisted the mandatory inclusion of Hindi, arguing it disadvantages southern students in national competition. A linguist says "India''s language policy is where federalism gets personal."', 'What is your view?', 'இந்தியாவில் 29 அட்டவணைப்படுத்தப்பட்ட மொழிகளும், 1,600-க்கும் மேற்பட்ட வட்டார மொழிகளும் உள்ளன. 1960-களில் அறிமுகப்படுத்தப்பட்ட மும்மொழிக் கொள்கையானது, மாணவர்கள் தங்கள் பிராந்திய மொழி, இந்தி மற்றும் ஆங்கிலம் ஆகியவற்றைக் கற்க வேண்டும் என்று பரிந்துரைக்கிறது. பல தென்னிந்திய மாநிலங்கள் - குறிப்பாகத் தமிழ்நாடு - இந்தியை கட்டாயமாகச் சேர்ப்பதை எதிர்த்துள்ளன; இது தேசிய அளவிலான போட்டியில் தென்னிந்திய மாணவர்களுக்குப் பாதகமாக அமையும் என்று வாதிடுகின்றன. "இந்தியாவின் மொழிக் கொள்கையில்தான் கூட்டாட்சி தனிப்பட்டதாக மாறுகிறது" என்று ஒரு மொழியியலாளர் கூறுகிறார்.', 'உங்கள் கருத்து என்ன?',
     '{"theme": "Governance Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The southern states are right to resist. A policy that requires students in Tamil Nadu to learn three languages while students in Hindi-speaking states effectively learn one - their mother tongue in two scripts - creates an asymmetric burden that has real consequences for educational equity.', 'தென்னிந்திய மாநிலங்கள் எதிர்ப்பது சரியானதே. தமிழ்நாட்டில் உள்ள மாணவர்கள் மூன்று மொழிகளைக் கற்க வேண்டிய கட்டாயமும், இந்தி பேசும் மாநிலங்களில் உள்ள மாணவர்கள் தங்கள் தாய்மொழியை இரண்டு எழுத்து வடிவங்களில் திறம்படக் கற்க வேண்டிய கட்டாயமும், கல்வி சமத்துவத்தில் உண்மையான விளைவுகளை ஏற்படுத்தக்கூடிய ஒரு சமமற்ற சுமையை உருவாக்குகிறது.'),
  (2, 'A common language is practically useful in a country of this diversity. The resistance to Hindi is partly genuine linguistic pride and partly political mobilisation. Both are real but they should not be collapsed into the same argument.', 'இத்தகைய பன்முகத்தன்மை கொண்ட ஒரு நாட்டில், ஒரு பொது மொழி நடைமுறைக்குப் பயனுள்ளதாக இருக்கிறது. இந்திக்கு எதிரான எதிர்ப்பு என்பது ஓரளவிற்கு உண்மையான மொழிப் பெருமிதத்தாலும், ஓரளவிற்கு அரசியல் அணிதிரட்டலாலும் ஏற்படுகிறது. இரண்டுமே உண்மையானவைதான், ஆனால் அவற்றை ஒரே வாதத்திற்குள் சுருக்கிவிடக் கூடாது.'),
  (3, 'English has effectively become India''s link language for professional and national purposes - making the Hindi imposition argument less practically significant than it was in 1960. The political salience of the issue has outlived its economic urgency.', 'தொழில்முறை மற்றும் தேசிய நோக்கங்களுக்காக ஆங்கிலம் இந்தியாவின் இணைப்பு மொழியாக திறம்பட மாறியுள்ளது. இதனால், இந்தி திணிப்பு வாதம் 1960-ல் இருந்ததை விட நடைமுறை முக்கியத்துவம் குறைந்துள்ளது. இப்பிரச்சனையின் அரசியல் முக்கியத்துவம் அதன் பொருளாதார அவசரத்தை கடந்துவிட்டது.'),
  (4, 'Language policy in India cannot be separated from identity. When Tamil Nadu resists Hindi imposition it is not making an argument about cognitive load - it is making an argument about whose culture gets to be national. That argument will not be resolved by linguists or economists.', 'இந்தியாவில் மொழிக் கொள்கையை அடையாளத்திலிருந்து பிரிக்க முடியாது. தமிழ்நாடு இந்தித் திணிப்பை எதிர்க்கும்போது, ​​அது அறிவாற்றல் சுமை குறித்த வாதத்தை முன்வைக்கவில்லை; மாறாக, யாருடைய கலாச்சாரம் தேசியமாகிறது என்பது குறித்த வாதத்தையே முன்வைக்கிறது. அந்த வாதத்திற்கு மொழியியலாளர்களாலோ அல்லது பொருளாதார வல்லுநர்களாலோ தீர்வு காண முடியாது.')
) AS v(ord, en, ta);

-- Survey set 5 #84
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s urban population is expected to reach 600 million by 2031 - adding the equivalent of the entire current population of the United States to Indian cities in less than a decade. Chennai, Bengaluru, Hyderabad, and Pune are growing faster than their infrastructure can absorb. A urban planning professor says "India is urbanising at Chinese speed with African infrastructure budgets."', 'What does this mean for the businesses you will lead?', '2031-ஆம் ஆண்டுக்குள் இந்தியாவின் நகர்ப்புற மக்கள்தொகை 60 கோடியை எட்டும் என எதிர்பார்க்கப்படுகிறது. இது, பத்தாண்டுக்கும் குறைவான காலத்தில், அமெரிக்காவின் தற்போதைய மொத்த மக்கள்தொகைக்கு இணையான மக்கள்தொகையை இந்திய நகரங்களில் சேர்க்கும். சென்னை, பெங்களூரு, ஹைதராபாத் மற்றும் புனே ஆகிய நகரங்கள், அவற்றின் உள்கட்டமைப்பு தாங்கிக்கொள்ளும் வேகத்தை விட வேகமாக வளர்ந்து வருகின்றன. "ஆப்பிரிக்க உள்கட்டமைப்பு நிதி ஒதுக்கீடுகளுடன், இந்தியா சீன வேகத்தில் நகரமயமாகி வருகிறது" என்று ஒரு நகரத் திட்டமிடல் பேராசிரியர் கூறுகிறார்.', 'நீங்கள் வழிநடத்தவிருக்கும் வணிகங்களுக்கு இது என்ன தாக்கத்தை ஏற்படுத்தும்?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means location decisions are more complex than they appear. A city that looks attractive today may be functionally unliveable for employees in ten years if infrastructure does not keep pace. Urbanisation risk is a real estate and talent risk simultaneously.', 'இடத் தேர்வுகள் தோற்றத்தை விட மிகவும் சிக்கலானவை என்பதே இதன் பொருள். உள்கட்டமைப்பு அதற்கேற்ப மேம்படவில்லை என்றால், இன்று கவர்ச்சிகரமாகத் தோன்றும் ஒரு நகரம், பத்து ஆண்டுகளில் ஊழியர்களுக்கு நடைமுறையில் வாழத் தகுதியற்றதாகிவிடக்கூடும். நகரமயமாக்கல் அபாயம் என்பது ஒரே நேரத்தில் ஒரு அசையாச் சொத்து மற்றும் பணியாளர் திறன் சார்ந்த அபாயமாகும்.'),
  (2, 'It means the urban infrastructure market is one of the largest investment opportunities in the world. Water, transit, housing, waste - every system is undersupplied relative to the growth curve. The constraint is capital and governance capacity not demand.', 'இதன் பொருள், நகர்ப்புற உள்கட்டமைப்புச் சந்தையானது உலகின் மிகப்பெரிய முதலீட்டு வாய்ப்புகளில் ஒன்றாகும். நீர், போக்குவரத்து, வீட்டுவசதி, கழிவு மேலாண்மை என ஒவ்வொரு அமைப்பும், வளர்ச்சி வளைகோட்டுடன் ஒப்பிடும்போது போதிய அளவு வழங்கப்படவில்லை. இதற்கான தடை என்பது தேவையல்ல, மாறாக மூலதனமும் நிர்வாகத் திறனுமே ஆகும்.'),
  (3, 'It means the businesses that figure out how to serve density efficiently - compact retail, last-mile logistics, shared services, micro-housing - will build enormous scale. Urban density is a market structure not just a planning problem.', 'இதன் பொருள், அடர்த்தியைத் திறமையாகச் சேவையாற்றுவதற்கான வழிகளைக் கண்டறியும் வணிகங்கள் - அதாவது, சிறிய சில்லறை வர்த்தகம், இறுதிநிலை தளவாடங்கள், பகிரப்பட்ட சேவைகள், குறுங்குடியிருப்பு போன்றவை - மிகப்பெரிய அளவில் வளர்ச்சி அடையும். நகர்ப்புற அடர்த்தி என்பது ஒரு திட்டமிடல் சிக்கல் மட்டுமல்ல, அது ஒரு சந்தைக் கட்டமைப்பு ஆகும்.'),
  (4, 'It means the quality of urban governance will determine the quality of the talent pool I can hire. A city that cannot manage its growth produces stressed, commute-exhausted, infrastructure-deprived workers. City quality is a human capital issue.', 'நகர்ப்புற நிர்வாகத்தின் தரமே, என்னால் பணியமர்த்தக்கூடிய திறமையாளர்களின் தரத்தைத் தீர்மானிக்கும். தனது வளர்ச்சியை நிர்வகிக்க முடியாத ஒரு நகரம், மன அழுத்தம், பயணத்தால் சோர்வு, மற்றும் உள்கட்டமைப்பு வசதிகள் அற்ற தொழிலாளர்களை உருவாக்குகிறது. நகரத்தின் தரம் என்பது ஒரு மனித மூலதனப் பிரச்சினையாகும்.')
) AS v(ord, en, ta);

-- Survey set 5 #85
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'N R Narayana Murthy, Azim Premji, and Shiv Nadar built three of India''s largest IT companies in the same era - Infosys, Wipro, and HCL respectively. All three became multi-billionaires. Premji has committed to giving away 90% of his wealth. Nadar has built one of India''s largest private philanthropic foundations. Murthy has been more restrained in public philanthropy. A student asks - "does how you give away wealth say as much about your values as how you built it?"', 'What do you think?', 'என். ஆர். நாராயண மூர்த்தி, அசிம் பிரேம்ஜி மற்றும் ஷிவ் நாடார் ஆகியோர் ஒரே காலகட்டத்தில் இந்தியாவின் மூன்று மிகப்பெரிய தகவல் தொழில்நுட்ப நிறுவனங்களான இன்ஃபோசிஸ், விப்ரோ மற்றும் எச்.சி.எல்-ஐ முறையே உருவாக்கினர். மூவருமே பல பில்லியன் டாலர் செல்வந்தர்களாக ஆனார்கள். பிரேம்ஜி தனது செல்வத்தில் 90 சதவீதத்தை தானமாக வழங்க உறுதிபூண்டுள்ளார். நாடார் இந்தியாவின் மிகப்பெரிய தனியார் தொண்டு நிறுவனங்களில் ஒன்றை உருவாக்கியுள்ளார். மூர்த்தி பொதுத் தொண்டுப் பணிகளில் மிகவும் நிதானமாக இருந்து வருகிறார். ஒரு மாணவர் கேட்கிறார் - "நீங்கள் செல்வத்தை எப்படி உருவாக்கினீர்கள் என்பதைப் போலவே, அதை நீங்கள் எப்படி தானமாக வழங்குகிறீர்கள் என்பதும் உங்கள் விழுமியங்களைப் பற்றிச் சொல்கிறதா?"', 'நீங்கள் என்ன நினைக்கிறீர்கள்?',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - philanthropy is where stated values meet actual resource allocation. A billionaire who built wealth through people and systems but retains most of it privately is making a values statement as clear as the one made by giving it away.', 'ஆம் - பரோபகாரம் என்பது, கூறப்பட்ட விழுமியங்களும் உண்மையான வள ஒதுக்கீடும் சந்திக்கும் இடமாகும். மக்கள் மற்றும் அமைப்புகள் மூலம் செல்வத்தை உருவாக்கி, அதில் பெரும்பகுதியைத் தனிப்பட்ட முறையில் தக்கவைத்துக் கொள்ளும் ஒரு கோடீஸ்வரர், அதைத் தானமாக வழங்குவதன் மூலம் வெளிப்படுத்தப்படும் விழுமியங்களைப் போலவே தெளிவான ஒரு விழுமிய அறிக்கையை வெளிப்படுத்துகிறார்.'),
  (2, 'No - how wealth is built is the primary moral question. Wealth built ethically and retained privately is more defensible than wealth built exploitatively and given away generously. Philanthropy does not retroactively validate the source.', 'இல்லை - செல்வம் எவ்வாறு உருவாக்கப்படுகிறது என்பதே முதன்மையான தார்மீகக் கேள்வி. சுரண்டல் முறையில் உருவாக்கப்பட்டு தாராளமாக வழங்கப்படும் செல்வத்தை விட, அறநெறிப்படி உருவாக்கப்பட்டு தனிப்பட்ட முறையில் தக்கவைக்கப்படும் செல்வமே அதிகப் பாதுகாப்பானது. பரோபகாரம், செல்வம் உருவான மூலத்தைப் பின்னோக்கிச் சென்று உறுதிப்படுத்துவதில்லை.'),
  (3, 'Philanthropy is a personal decision and public scorecards of giving are uncomfortable. The pressure to give publicly can produce performative philanthropy - large announcements, minimal impact. Private giving with genuine impact is worth more.', 'பரோபகாரம் என்பது ஒரு தனிப்பட்ட முடிவு, மேலும் நன்கொடைகள் குறித்த பொதுவான மதிப்பீடுகள் சங்கடமானவை. பகிரங்கமாக நன்கொடை அளிக்க வேண்டும் என்ற அழுத்தம், வெறும் வெளிவேடமான பரோபகாரத்தை உருவாக்கக்கூடும் - அதாவது, பெரிய அறிவிப்புகள், ஆனால் மிகக் குறைந்த தாக்கம். உண்மையான தாக்கத்தை ஏற்படுத்தும் தனிப்பட்ட நன்கொடையே அதிக மதிப்பு வாய்ந்தது.'),
  (4, 'The more interesting question is whether billionaire philanthropy is a substitute for the taxation and public spending that would distribute resources more democratically. Giving away wealth through foundations is not the same as paying the taxes that would let citizens decide how resources are used.', 'வளங்களை மேலும் ஜனநாயக முறையில் விநியோகிக்கும் வரிவிதிப்பு மற்றும் பொதுச் செலவினங்களுக்கு, கோடீஸ்வரர்களின் தர்மச்செயல்கள் ஒரு மாற்றாக அமையுமா என்பதே மிகவும் சுவாரஸ்யமான கேள்வியாகும். அறக்கட்டளைகள் மூலம் செல்வத்தை வழங்குவதும், வளங்கள் எவ்வாறு பயன்படுத்தப்பட வேண்டும் என்பதை குடிமக்கள் தீர்மானிக்க அனுமதிக்கும் வரிகளைச் செலுத்துவதும் ஒன்றல்ல.')
) AS v(ord, en, ta);

-- Survey set 5 #86
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s Parliament has 82 women members - approximately 15% of the total - after the 2024 elections, an all-time high. The Women''s Reservation Bill, which mandates 33% reservation for women in Parliament, was passed in 2023 but will only be implemented after the next delimitation exercise - likely not before 2029 or later. A political analyst says "passing a law you do not intend to implement immediately is a performance of progress not progress itself."', 'Is she right?', '2024 தேர்தல்களுக்குப் பிறகு, இந்திய நாடாளுமன்றத்தில் 82 பெண் உறுப்பினர்கள் உள்ளனர் - இது மொத்த உறுப்பினர்களில் ஏறக்குறைய 15% ஆகும். இது ஒரு சாதனை அளவாகும். நாடாளுமன்றத்தில் பெண்களுக்கு 33% இட ஒதுக்கீட்டைக் கட்டாயமாக்கும் மகளிர் இட ஒதுக்கீடு மசோதா, 2023-ல் நிறைவேற்றப்பட்டது. ஆனால், இது அடுத்த தொகுதி மறுவரையறைக்குப் பிறகே நடைமுறைப்படுத்தப்படும் - இது 2029-க்கு முன்னரோ அல்லது அதற்குப் பின்னரோ நடக்க வாய்ப்பில்லை. "உடனடியாக நடைமுறைப்படுத்த எண்ணாத ஒரு சட்டத்தை நிறைவேற்றுவது, முன்னேற்றத்தின் வெளிப்பாடே தவிர அதுவே முன்னேற்றம் அல்ல" என்று ஒரு அரசியல் ஆய்வாளர் கூறுகிறார்.', 'அவள் சொல்வது சரியா?',
     '{"theme": "Gender Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - a reservation law that kicks in after two more elections is a promise made to a future government. The current government gets credit for passing it without bearing the cost of implementing it. The timing is the tell.', 'ஆம் - இன்னும் இரண்டு தேர்தல்களுக்குப் பிறகு அமலுக்கு வரும் இட ஒதுக்கீடு சட்டம் என்பது, வருங்கால அரசாங்கத்திற்கு அளிக்கப்பட்ட ஒரு வாக்குறுதியாகும். அதைச் செயல்படுத்துவதற்கான செலவை ஏற்காமலேயே நிறைவேற்றியதற்காக தற்போதைய அரசாங்கத்திற்குப் பெருமை சேர்கிறது. அதன் காலமே உண்மையைக் காட்டுகிறது.'),
  (2, 'Partially - constitutional amendments require consensus that takes time to build. The delimitation linkage may be genuine administrative necessity not political evasion. Assume bad faith only when the evidence demands it.', 'ஓரளவு - அரசியலமைப்புத் திருத்தங்களுக்கு, உருவாகுவதற்கு நேரம் எடுக்கும் ஒருமித்த கருத்து தேவைப்படுகிறது. தொகுதி வரையறை தொடர்பானது, அரசியல் தந்திரமாக இல்லாமல், உண்மையான நிர்வாகத் தேவையாக இருக்கலாம். ஆதாரம் தேவைப்படும்போது மட்டுமே உள்நோக்கத்துடன் செயல்படுவதாகக் கருதவும்.'),
  (3, 'The 15% achieved without reservation is itself a data point. If political parties fielded women candidates in proportion to their voter share - roughly 49% - reservation would be unnecessary. The problem is party nomination not voter preference.', 'இட ஒதுக்கீடு இல்லாமல் பெறப்பட்ட 15% என்பதே ஒரு தரவுப் புள்ளியாகும். அரசியல் கட்சிகள் தங்களின் வாக்காளர் பங்கிற்கு ஏற்ப - அதாவது ஏறக்குறைய 49% - பெண் வேட்பாளர்களை நிறுத்தினால், இட ஒதுக்கீடு தேவையற்றதாகிவிடும். பிரச்சினை கட்சி வேட்பாளர் நியமனத்தில் உள்ளது, வாக்காளர் விருப்பத்தில் அல்ல.'),
  (4, 'Reservation alone does not produce substantive representation. Women in reserved seats who are surrogates for family members - the proxy wife or daughter phenomenon - do not advance women''s political agency. Quality of representation matters as much as quantity.', 'இட ஒதுக்கீடு மட்டுமே கணிசமான பிரதிநிதித்துவத்தை உருவாக்குவதில்லை. ஒதுக்கப்பட்ட இடங்களில் குடும்ப உறுப்பினர்களுக்குப் பதிலாகப் போட்டியிடும் பெண்கள் - அதாவது பதிலி மனைவி அல்லது மகள் போன்றவர்கள் - பெண்களின் அரசியல் அதிகார வளர்ச்சியை மேம்படுத்துவதில்லை. பிரதிநிதித்துவத்தின் அளவைப் போலவே அதன் தரமும் முக்கியமானது.')
) AS v(ord, en, ta);

-- Survey set 5 #87
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'A pharmaceutical company discovers that a drug it sells at ₹8,000 per course in India costs $800 per course in the United States - the same molecule, same efficacy, same manufacturer. The price difference is justified internally as "market-based pricing" - charging what each market can bear. A health economist says "medicines priced at market rates in poor countries are medicines priced out of reach."', 'What is your view as a future business leader?', 'ஒரு மருந்து நிறுவனம், இந்தியாவில் ஒரு வேளைக்கு ₹8,000-க்கு விற்கும் ஒரு மருந்து, அமெரிக்காவில் அதே மூலக்கூறு, அதே செயல்திறன், அதே உற்பத்தியாளர் என்ற போதிலும், அதே வேளைக்கு $800-க்கு விற்கப்படுகிறது என்பதைக் கண்டறிகிறது. இந்த விலை வேறுபாடு, ஒவ்வொரு சந்தையும் தாங்கக்கூடிய விலையை நிர்ணயிக்கும் "சந்தை அடிப்படையிலான விலை நிர்ணயம்" என்று நிறுவனத்திற்குள்ளேயே நியாயப்படுத்தப்படுகிறது. ஒரு சுகாதாரப் பொருளாதார நிபுணர், "ஏழை நாடுகளில் சந்தை விலையில் விற்கப்படும் மருந்துகள், மக்கள் வாங்க முடியாத விலையில் விற்கப்படுகின்றன" என்கிறார்.', 'வருங்கால வணிகத் தலைவர் என்ற முறையில் உங்கள் பார்வை என்ன?',
     '{"theme": "Business & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The differential pricing model is ethically defensible when the lower price actually reaches the people who need it. The question is not whether prices differ across markets - it is whether the Indian price is accessible to the Indian patient who needs this drug.', 'குறைந்த விலை உண்மையில் தேவைப்படும் மக்களைச் சென்றடையும்போது, ​​வேறுபட்ட விலை நிர்ணய மாதிரி அறநெறிப்படி நியாயப்படுத்தத்தக்கதாகிறது. சந்தைகளுக்கு இடையே விலைகள் வேறுபடுகின்றனவா என்பது கேள்வியல்ல; மாறாக, இந்த மருந்து தேவைப்படும் இந்திய நோயாளிக்கு இந்திய விலை கட்டுப்படியாகக்கூடியதா என்பதே கேள்வி.'),
  (2, 'Pharmaceutical pricing is where market logic and human rights logic collide most directly. A company that owns a patent - a government-granted monopoly - and uses it to price life-saving medicines beyond reach is extracting a public subsidy for private benefit.', 'மருந்து விலை நிர்ணயத்தில்தான் சந்தை தர்க்கமும் மனித உரிமை தர்க்கமும் மிகவும் நேரடியாக மோதுகின்றன. அரசாங்கத்தால் வழங்கப்பட்ட ஏகபோக உரிமையான காப்புரிமையை வைத்திருக்கும் ஒரு நிறுவனம், அதைப் பயன்படுத்தி உயிர்காக்கும் மருந்துகளுக்கு எட்டாத விலையை நிர்ணயித்தால், அது தனது தனிப்பட்ட நலனுக்காக பொது மானியத்தைப் பெறுகிறது.'),
  (3, 'The solution is compulsory licensing - which Indian law already allows. When a drug is essential and unaffordably priced, the government can authorise generic production. The policy tool exists. The question is political will to use it.', 'இதற்கான தீர்வு கட்டாய உரிமம் வழங்குவதே ஆகும் - இதை இந்தியச் சட்டம் ஏற்கெனவே அனுமதித்துள்ளது. ஒரு மருந்து அத்தியாவசியமானதாகவும், கட்டுப்படியாகாத விலையில் உள்ளதாகவும் இருக்கும்போது, ​​அரசாங்கம் அதன் பொதுவான மருந்து உற்பத்தியை அங்கீகரிக்கலாம். அதற்கான கொள்கைக் கருவி உள்ளது. அதைப் பயன்படுத்துவதற்கான அரசியல் விருப்பம்தான் கேள்வி.'),
  (4, 'As a future leader in any sector this case is about the gap between what markets permit and what legitimacy requires. A business can be legally correct and socially indefensible simultaneously. Managing that gap is a leadership responsibility not just a PR one.', 'எந்தவொரு துறையிலும் ஒரு எதிர்காலத் தலைவராக, சந்தைகள் அனுமதிப்பதற்கும் சட்டபூர்வத்தன்மை கோருவதற்கும் இடையிலான இடைவெளியைப் பற்றியதுதான் இந்த வழக்கு. ஒரு வணிகம் சட்டப்படி சரியானதாகவும், அதே நேரத்தில் சமூக ரீதியாக நியாயப்படுத்த முடியாததாகவும் இருக்க முடியும். அந்த இடைவெளியை நிர்வகிப்பது என்பது வெறும் மக்கள் தொடர்புப் பொறுப்பு மட்டுமல்ல, அது ஒரு தலைமைத்துவப் பொறுப்பாகும்.')
) AS v(ord, en, ta);

-- Survey set 5 #88
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s MGNREGA - the rural employment guarantee scheme - guarantees 100 days of paid work per year to rural households. It employs approximately 6–7 crore households annually at ₹200–300 per day. Economists disagree sharply - some call it India''s most successful poverty intervention, others call it a fiscal drain that crowds out productive investment. A professor asks - how do you evaluate a policy where both sides have credible evidence?', 'How do you evaluate MGNREGA?', 'இந்தியாவின் மகாத்மா காந்தி தேசிய ஊரக வேலைவாய்ப்பு உறுதித் திட்டம் (MGNREGA), கிராமப்புறக் குடும்பங்களுக்கு ஆண்டுக்கு 100 நாட்கள் ஊதியத்துடன் கூடிய வேலைக்கு உத்தரவாதம் அளிக்கிறது. இது ஆண்டுதோறும் சுமார் 6-7 கோடி குடும்பங்களுக்கு ஒரு நாளைக்கு ₹200-300 என்ற ஊதியத்தில் வேலைவாய்ப்பை வழங்குகிறது. பொருளாதார வல்லுநர்கள் இதில் கடுமையாக முரண்படுகின்றனர் - சிலர் இதை இந்தியாவின் மிகவும் வெற்றிகரமான வறுமை ஒழிப்புத் திட்டம் என்று அழைக்கின்றனர், மற்றவர்களோ இது ஆக்கப்பூர்வமான முதலீடுகளை வெளியேற்றும் ஒரு நிதிச் சுமை என்கின்றனர். இரு தரப்பிலும் நம்பகமான சான்றுகள் இருக்கும் ஒரு கொள்கையை எப்படி மதிப்பிடுவது என்று ஒரு பேராசிரியர் கேட்கிறார்.', 'MGNREGA-வை எவ்வாறு மதிப்பீடு செய்கிறீர்கள்?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Look at what it is trying to do and whether it does that. MGNREGA is a consumption floor and a drought buffer for rural households - not a development engine. Evaluating it as a growth policy is the wrong frame. On its own terms it largely works.', 'அது என்ன செய்ய முயற்சிக்கிறது என்பதையும், அதைச் செய்கிறதா என்பதையும் பாருங்கள். மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டம் (MGNREGA) என்பது கிராமப்புறக் குடும்பங்களுக்கான ஒரு நுகர்வுத் தளம் மற்றும் வறட்சிக் காலக் காப்புத் திட்டம் ஆகும்; அது ஒரு வளர்ச்சி இயந்திரம் அல்ல. அதை ஒரு வளர்ச்சிக் கொள்கையாக மதிப்பிடுவது தவறான கண்ணோட்டமாகும். அதன் சொந்த வரையறைகளின்படி, அது பெரும்பாலும் செயல்படுகிறது.'),
  (2, 'The wage rate is the critical variable. At ₹200–300 per day MGNREGA provides subsistence not mobility. A scheme that guarantees poverty-level wages guarantees poverty - not a pathway out of it. Reform the wage floor before defending the scheme.', 'ஊதிய விகிதமே மிக முக்கியமான காரணி. ஒரு நாளைக்கு ₹200–300 என்ற அளவில் மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டம் (MGNREGA) வாழ்வாதாரத்தையே வழங்குகிறது, முன்னேற்றத்தை அல்ல. வறுமை நிலைக்கு நிகரான ஊதியத்திற்கு உத்தரவாதம் அளிக்கும் ஒரு திட்டம், வறுமைக்கே உத்தரவாதம் அளிக்கிறது - அதிலிருந்து வெளியேறுவதற்கான வழியை அல்ல. இத்திட்டத்தைப் பாதுகாப்பதற்கு முன்பு, குறைந்தபட்ச ஊதிய வரம்பைச் சீர்திருத்துங்கள்.'),
  (3, 'The infrastructure created under MGNREGA - ponds, roads, watershed development - is chronically undervalued in the fiscal drain argument. Assets built through the scheme serve communities for decades. The accounting that shows it as a cost ignores the balance sheet.', 'மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டத்தின் (MGNREGA) கீழ் உருவாக்கப்பட்ட குளங்கள், சாலைகள், நீர்வள மேம்பாடு போன்ற உள்கட்டமைப்புகள், நிதிச் சுமை என்ற வாதத்தில் தொடர்ந்து குறைத்து மதிப்பிடப்படுகின்றன. இத்திட்டத்தின் மூலம் உருவாக்கப்பட்ட சொத்துக்கள், சமூகங்களுக்குப் பல பத்தாண்டுகளாகப் பயன்படுகின்றன. இதை ஒரு செலவாகக் காட்டும் கணக்கியல், இருப்புநிலைக் குறிப்பைப் புறக்கணிக்கிறது.'),
  (4, 'The honest answer is that MGNREGA works well in some states and poorly in others - and the variable is state government commitment to implementation. National policy evaluations that ignore state-level variation produce misleading conclusions in both directions.', 'நேர்மையான பதில் என்னவென்றால், மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டம் (MGNREGA) சில மாநிலங்களில் சிறப்பாகவும், மற்ற மாநிலங்களில் மோசமாகவும் செயல்படுகிறது. மேலும், இத்திட்டத்தைச் செயல்படுத்துவதில் மாநில அரசின் அர்ப்பணிப்பே இதில் உள்ள மாறுபடும் காரணியாகும். மாநில அளவிலான வேறுபாடுகளைப் புறக்கணிக்கும் தேசிய கொள்கை மதிப்பீடுகள், இரு திசைகளிலும் தவறான முடிவுகளையே அளிக்கின்றன.')
) AS v(ord, en, ta);

-- Survey set 5 #89
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India spends approximately 1.3% of GDP on public health - one of the lowest rates among G20 nations. Out-of-pocket health expenses push approximately 6 crore Indians into poverty every year. A public health professor says "India is one serious illness away from bankruptcy for most of its citizens."', 'As a future employer - what does this mean for how you design your organisation?', 'இந்தியா தனது மொத்த உள்நாட்டு உற்பத்தியில் சுமார் 1.3%-ஐ பொது சுகாதாரத்திற்காகச் செலவிடுகிறது - இது ஜி20 நாடுகளில் மிகக் குறைந்த விகிதங்களில் ஒன்றாகும். சொந்தப் பணத்தில் செய்யப்படும் சுகாதாரச் செலவுகள், ஒவ்வொரு ஆண்டும் சுமார் 6 கோடி இந்தியர்களை வறுமையில் தள்ளுகின்றன. "இந்தியாவின் பெரும்பாலான குடிமக்கள், ஒரு கடுமையான நோயால் திவாலாகிவிடுவார்கள்" என்று ஒரு பொது சுகாதாரப் பேராசிரியர் கூறுகிறார்.', 'வருங்கால முதலாளி என்ற முறையில், உங்கள் நிறுவனத்தை நீங்கள் வடிவமைக்கும் விதத்தில் இதன் தாக்கம் என்ன?',
     '{"theme": "Social Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means health benefits are not perks - they are the difference between a workforce that can absorb personal shocks and one that cannot. Employer-provided health coverage in India carries moral weight that it does not carry in countries with universal systems.', 'இதன் பொருள், சுகாதாரப் பலன்கள் என்பவை சலுகைகள் அல்ல - அவை தனிப்பட்ட அதிர்ச்சிகளைத் தாங்கிக்கொள்ளக்கூடிய ஒரு பணியாளர் குழுவிற்கும், அவ்வாறு செய்ய முடியாத ஒரு பணியாளர் குழுவிற்கும் இடையிலான வேறுபாடு ஆகும். அனைவருக்கும் பொதுவான சுகாதாரக் காப்பீட்டுத் திட்டங்களைக் கொண்ட நாடுகளில் இல்லாத ஒரு தார்மீக முக்கியத்துவத்தை, இந்தியாவில் முதலாளி வழங்கும் சுகாதாரக் காப்பீடு கொண்டுள்ளது.'),
  (2, 'It means the productivity cost of untreated illness in my workforce is invisible until it is catastrophic. Investing in preventive health - screenings, mental health support, lifestyle programmes - has a measurable return that most companies are not measuring.', 'இதன் பொருள், எனது பணியாளர்களிடையே சிகிச்சையளிக்கப்படாத நோயினால் ஏற்படும் உற்பத்தித்திறன் இழப்பு, அது பேரழிவை ஏற்படுத்தும் வரை கண்ணுக்குத் தெரியாததாகவே இருக்கிறது. தடுப்பு சுகாதாரத்தில் முதலீடு செய்வது - அதாவது பரிசோதனைகள், மனநல ஆதரவு, வாழ்க்கை முறைத் திட்டங்கள் - பெரும்பாலான நிறுவனங்கள் அளவிடாத, அளவிடக்கூடிய பலனைக் கொண்டுள்ளது.'),
  (3, 'It means the informal workforce in my supply chain - the vendors, contractors, and gig workers my business depends on - are living one illness away from defaulting on my contracts. Health risk in the supply chain is business risk.', 'இதன் பொருள், எனது விநியோகச் சங்கிலியில் உள்ள முறைசாரா தொழிலாளர்களான - எனது வணிகம் சார்ந்திருக்கும் விற்பனையாளர்கள், ஒப்பந்தக்காரர்கள் மற்றும் தற்காலிகப் பணியாளர்கள் - ஓர் உடல்நலக் குறைவால் எனது ஒப்பந்தங்களை மீறும் நிலைக்குத் தள்ளப்படும் நிலையில் உள்ளனர். விநியோகச் சங்கிலியில் உள்ள சுகாதார அபாயமே வணிக அபாயமாகும்.'),
  (4, 'It means universal health coverage is not just a government responsibility - it is a business interest. Companies that actively support public health policy, fund community health infrastructure, and design benefits that extend beyond direct employees are investing in the ecosystem they depend on.', 'இதன் பொருள், அனைவருக்கும் சுகாதாரப் பாதுகாப்பு என்பது அரசாங்கத்தின் பொறுப்பு மட்டுமல்ல - அது ஒரு வணிக நலனும் ஆகும். பொது சுகாதாரக் கொள்கையைத் தீவிரமாக ஆதரிக்கும், சமூக சுகாதார உள்கட்டமைப்பிற்கு நிதியளிக்கும், மற்றும் நேரடி ஊழியர்களைத் தாண்டியும் பலன்களை வடிவமைக்கும் நிறுவனங்கள், தாங்கள் சார்ந்திருக்கும் சூழலமைப்பில் முதலீடு செய்கின்றன.')
) AS v(ord, en, ta);

-- Survey set 5 #90
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s Chief Election Commissioner and Election Commissioners are appointed by the government - until a 2023 Supreme Court ruling mandated a three-member selection committee including the Prime Minister, the Leader of Opposition, and the Chief Justice. The government subsequently passed a law replacing the Chief Justice with a cabinet minister - effectively restoring executive dominance of the appointment. A constitutional lawyer says "the government legislated away a Supreme Court judgment in four months."', 'What does this reveal?', 'பிரதமர், எதிர்க்கட்சித் தலைவர் மற்றும் தலைமை நீதிபதி ஆகியோர் அடங்கிய மூன்று பேர் கொண்ட தேர்வுக் குழுவை அமைக்க வேண்டும் என 2023-ஆம் ஆண்டு உச்ச நீதிமன்றத் தீர்ப்பு கட்டாயப்படுத்தும் வரை, இந்தியாவின் தலைமைத் தேர்தல் ஆணையரும் தேர்தல் ஆணையர்களும் அரசாங்கத்தால் நியமிக்கப்பட்டு வந்தனர். அதனைத் தொடர்ந்து, அரசாங்கம் தலைமை நீதிபதிக்கு பதிலாக ஒரு அமைச்சரவை அமைச்சரை நியமிக்கும் சட்டத்தை இயற்றியது - இதன் மூலம், நியமனத்தில் நிர்வாகத்தின் ஆதிக்கத்தை அது திறம்பட மீட்டெடுத்தது. "நான்கு மாதங்களில் அரசாங்கம் ஒரு உச்ச நீதிமன்றத் தீர்ப்பை சட்டத்தின் மூலம் நீக்கிவிட்டது" என்று ஒரு அரசியலமைப்புச் சட்ட வழக்கறிஞர் கூறுகிறார்.', 'இது எதை வெளிப்படுத்துகிறது?',
     '{"theme": "Governance & Accountability", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It reveals that institutional independence in India is only as strong as the political cost of undermining it. When that cost is low - as it was here - independent institutions are vulnerable regardless of what courts order.', 'இந்தியாவில் நிறுவனச் சுதந்திரம் என்பது, அதைச் சீர்குலைப்பதற்கான அரசியல் விலையின் அளவுக்கு மட்டுமே வலிமையானது என்பதை இது வெளிப்படுத்துகிறது. இங்கு இருந்தது போல, அந்த விலை குறைவாக இருக்கும்போது, ​​நீதிமன்றங்கள் என்ன உத்தரவிட்டாலும் சுதந்திரமான நிறுவனங்கள் பாதிப்புக்குள்ளாகின்றன.'),
  (2, 'It reveals a genuine constitutional tension - the judiciary cannot indefinitely override the legislature on matters of appointment without creating a different kind of accountability problem. The government had a legitimate argument even if the speed of response was troubling.', 'இது ஒரு உண்மையான அரசியலமைப்புச் சட்ட முரண்பாட்டை வெளிப்படுத்துகிறது - நியமனங்கள் தொடர்பான விஷயங்களில் நீதித்துறை, சட்டமன்றத்தின் முடிவை காலவரையின்றி மீறினால், அது வேறு வகையான பொறுப்புக்கூறல் சிக்கலை உருவாக்கும். பதிலளிக்கும் வேகம் கவலையளிப்பதாக இருந்தபோதிலும், அரசாங்கத்தின் வாதம் நியாயமானதாகவே இருந்தது.'),
  (3, 'It reveals that the Election Commission''s independence is now a live political question in a way it was not before. Elections conducted by a body whose leadership is appointed by the ruling executive will face legitimacy questions regardless of how well they are actually conducted.', 'தேர்தல் ஆணையத்தின் சுதந்திரம், முன்பு இல்லாத வகையில் தற்போது ஒரு முக்கிய அரசியல் கேள்வியாக உருவெடுத்துள்ளது என்பதை இது வெளிப்படுத்துகிறது. ஆளும் நிர்வாகத்தால் தலைமை நியமிக்கப்படும் ஒரு அமைப்பால் நடத்தப்படும் தேர்தல்கள், அவை உண்மையில் எவ்வளவு சிறப்பாக நடத்தப்பட்டாலும், சட்டபூர்வமான தன்மை குறித்த கேள்விகளை எதிர்கொள்ளும்.'),
  (4, 'It reveals something about how democratic backsliding happens - not through coups or dramatic breaks but through procedural moves that individually seem arguable and cumulatively shift enormous power. The frog does not notice the water heating.', 'ஜனநாயகப் பின்னடைவு எவ்வாறு நிகழ்கிறது என்பதை இது வெளிப்படுத்துகிறது - அது ஆட்சிக்கவிழ்ப்புகள் அல்லது வியத்தகு முறிவுகள் மூலமாக அல்ல, மாறாக, தனித்தனியாகப் பார்க்கும்போது விவாதத்திற்குரியதாகத் தோன்றும் மற்றும் ஒட்டுமொத்தமாக மிகப்பெரிய அதிகாரத்தை மாற்றும் நடைமுறை நகர்வுகள் மூலமாகவே நிகழ்கிறது. தண்ணீர் சூடாவதை தவளை கவனிக்கவில்லை.')
) AS v(ord, en, ta);

-- Survey set 5 #91
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'Sam Pitroda - the architect of India''s telecom revolution in the 1980s - convinced Rajiv Gandhi to build the public telecom infrastructure that eventually enabled the mobile revolution and the IT industry. He was a non-resident Indian with no political base, no bureaucratic seniority, and no institutional authority. He succeeded because one political leader trusted him completely. A professor asks - what does Pitroda''s story tell us about how change happens in large systems?', 'How do large systems change?', '1980-களில் இந்தியாவின் தொலைத்தொடர்புப் புரட்சியின் சிற்பியான சாம் பிட்ரோடா, இறுதியில் அலைபேசிப் புரட்சிக்கும் தகவல் தொழில்நுட்பத் துறைக்கும் வழிவகுத்த பொதுத் தொலைத்தொடர்பு உள்கட்டமைப்பை உருவாக்குமாறு ராஜீவ் காந்தியைச் சம்மதிக்க வைத்தார். அவர் வெளிநாடு வாழ் இந்தியராக, எந்த அரசியல் அடித்தளமும், அதிகாரப் பதவி மூப்பும், நிறுவன அதிகாரமும் அற்றவராக இருந்தார். ஓர் அரசியல் தலைவர் அவரை முழுமையாக நம்பியதாலேயே அவர் வெற்றி பெற்றார். ஒரு பேராசிரியர் கேட்கிறார் - பெரிய அமைப்புகளில் மாற்றம் எவ்வாறு நிகழ்கிறது என்பதைப் பற்றி பிட்ரோடாவின் கதை நமக்கு என்ன சொல்கிறது?', 'பெரிய அமைப்புகள் எவ்வாறு மாறுகின்றன?',
     '{"theme": "Leadership Awareness", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It tells us that access to one decision-maker with genuine authority matters more than formal position. Pitroda had no title that should have worked - but he had the Prime Minister''s ear. In hierarchical systems proximity to power is the real resource.', 'முறையான பதவியை விட, உண்மையான அதிகாரம் கொண்ட ஒரு முடிவெடுப்பவரை அணுகுவதுதான் முக்கியம் என்பதை இது நமக்கு உணர்த்துகிறது. பிட்ரோடாவிடம் பலனளிக்கக்கூடிய எந்தப் பதவியும் இருக்கவில்லை - ஆனால் அவர் பிரதமரின் நம்பிக்கைக்குரியவராக இருந்தார். படிநிலை அமைப்புகளில், அதிகாரத்திற்கு அருகாமையில் இருப்பதே உண்மையான வளம்.'),
  (2, 'It tells us that outsiders see what insiders cannot. Pitroda came without the assumptions and institutional interests that would have made a career bureaucrat compromise the vision before it was built. Fresh eyes and protected space are what allowed something genuinely new to happen.', 'உள்ளிருப்பவர்களால் காண முடியாததை வெளியிருப்பவர்கள் காண்கிறார்கள் என்பதை இது நமக்கு உணர்த்துகிறது. ஒரு தொழில்முறை அதிகாரியை, தொலைநோக்குப் பார்வை கட்டமைக்கப்படுவதற்கு முன்பே அதில் சமரசம் செய்துகொள்ளத் தூண்டியிருக்கக்கூடிய அனுமானங்களும் நிறுவன நலன்களும் இன்றி பிட்ரோடா வந்தார். புதிய பார்வைகளும் பாதுகாக்கப்பட்ட வெளியுமே, உண்மையாகவே புதிய ஒன்று நிகழ்வதற்கு வழிவகுத்தன.'),
  (3, 'It tells us that timing is not incidental - it is structural. The political conditions of the mid-1980s, a young Prime Minister with modernisation instincts and a strong mandate, created a window. The same idea five years earlier or later would not have found the same reception. Reading windows is a leadership skill.', 'காலம் என்பது தற்செயலானது அல்ல, அது ஒரு கட்டமைப்பு சார்ந்த விஷயம் என்பதை இது நமக்கு உணர்த்துகிறது. 1980-களின் நடுப்பகுதியில் நிலவிய அரசியல் சூழல்கள், நவீனமயமாக்கல் உள்ளுணர்வு கொண்ட ஒரு இளம் பிரதமர் மற்றும் வலுவான மக்கள் ஆணை ஆகியவை ஒரு வாய்ப்பை உருவாக்கின. இதே யோசனை ஐந்து ஆண்டுகளுக்கு முன்னரோ அல்லது பின்னரோ இதே வரவேற்பைப் பெற்றிருக்காது. வாய்ப்புகளைப் புரிந்துகொள்வது ஒரு தலைமைத்துவத் திறமையாகும்.'),
  (4, 'It tells us that individual change agents operating at the top of systems can move things that institutions cannot. But it also tells us that change built on personal relationships rather than institutional foundations is fragile - it lasted while Rajiv Gandhi lasted and then had to be rebuilt by others.', 'அமைப்புகளின் உச்சத்தில் செயல்படும் தனிப்பட்ட மாற்ற முகவர்களால், நிறுவனங்களால் செய்ய முடியாத காரியங்களை நகர்த்த முடியும் என்பதை இது நமக்கு உணர்த்துகிறது. ஆனால், நிறுவன அடித்தளங்களைக் காட்டிலும் தனிப்பட்ட உறவுகளின் மீது கட்டமைக்கப்படும் மாற்றம் பலவீனமானது என்பதையும் இது நமக்கு உணர்த்துகிறது - அது ராஜீவ் காந்தி இருந்தவரை நீடித்தது, பின்னர் மற்றவர்களால் மீண்டும் கட்டமைக்கப்பட வேண்டியிருந்தது.')
) AS v(ord, en, ta);

-- Survey set 5 #92
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'Deepfake technology can now produce video of any public figure saying anything convincingly enough to fool most viewers. In the 2024 election cycle several deepfake videos of Indian politicians circulated widely before being debunked - by which time they had been viewed millions of times. A technology ethicist says "the correction never travels as far as the lie."', 'What does this mean for democracy and for you as a future leader?', 'டீப்ஃபேக் தொழில்நுட்பத்தால் இப்போது எந்தவொரு பொது நபரும் எதையாவது சொல்வது போன்ற காணொளியை, பெரும்பாலான பார்வையாளர்களை ஏமாற்றும் அளவுக்கு நம்பும்படியாக உருவாக்க முடியும். 2024 தேர்தல் காலத்தில், இந்திய அரசியல்வாதிகள் சம்பந்தப்பட்ட பல டீப்ஃபேக் காணொளிகள், அவை பொய்யென நிரூபிக்கப்படுவதற்கு முன்பே பரவலாகப் பரவின - அதற்குள் அவை மில்லியன் கணக்கான முறை பார்க்கப்பட்டிருந்தன. ஒரு தொழில்நுட்ப நெறிமுறையாளர், "பொய் சென்ற தூரம் வரை திருத்தம் ஒருபோதும் செல்வதில்லை" என்கிறார்.', 'ஜனநாயகத்திற்கும், வருங்காலத் தலைவர் என்ற முறையில் உங்களுக்கும் இது என்ன தாக்கத்தை ஏற்படுத்துகிறது?',
     '{"theme": "Media & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means the information environment that democratic decision-making depends on is structurally compromised in ways that no individual correction can fix. Regulation of synthetic media - mandatory watermarking, platform liability - is now a democratic necessity not a technology policy nicety.', 'இதன் பொருள், ஜனநாயக முடிவெடுத்தல் சார்ந்திருக்கும் தகவல் சூழலானது, எந்தவொரு தனிப்பட்ட திருத்தத்தாலும் சரிசெய்ய முடியாத வகையில் கட்டமைப்பு ரீதியாகச் சீர்குலைந்துள்ளது என்பதாகும். செயற்கை ஊடகங்களின் ஒழுங்குமுறை – அதாவது கட்டாய நீர்முத்திரையிடல், தளத்தின் பொறுப்புடைமை போன்றவை – இப்போது ஒரு தொழில்நுட்பக் கொள்கை நுணுக்கமல்ல, அது ஒரு ஜனநாயகத் தேவையாகும்.'),
  (2, 'It means reputation management for public figures and business leaders has permanently changed. I need to assume that fabricated content about me or my organisation could circulate at any time and build the trust reserves in advance that allow people to disbelieve it.', 'இதன் பொருள், பொது நபர்கள் மற்றும் வணிகத் தலைவர்களுக்கான நற்பெயர் மேலாண்மை நிரந்தரமாக மாறிவிட்டது என்பதாகும். என்னைப் பற்றியோ அல்லது எனது நிறுவனத்தைப் பற்றியோ புனையப்பட்ட தகவல்கள் எந்த நேரத்திலும் பரவக்கூடும் என்று நான் அனுமானிக்க வேண்டும்; மேலும், மக்கள் அதை நம்பாமல் இருப்பதற்குத் தேவையான நம்பிக்கையை முன்கூட்டியே உருவாக்கிக்கொள்ள வேண்டும்.'),
  (3, 'It means media literacy is now a civic survival skill - not an educational aspiration. A population that cannot distinguish synthetic from authentic media cannot make informed democratic choices. This is an education emergency.', 'இதன் பொருள், ஊடக எழுத்தறிவு என்பது இப்போது ஒரு கல்விசார் இலட்சியமாக இல்லாமல், குடிமை வாழ்வில் தப்பிப்பிழைப்பதற்கான ஒரு திறனாக மாறியுள்ளது. செயற்கையான ஊடகத்தையும் உண்மையான ஊடகத்தையும் வேறுபடுத்தி அறிய முடியாத ஒரு மக்கள் தொகையால், தகவலறிந்த ஜனநாயகத் தேர்வுகளைச் செய்ய முடியாது. இது ஒரு கல்வி அவசரநிலை.'),
  (4, 'It means the institutions we trust to arbitrate truth - courts, regulators, quality journalism - matter more than ever precisely because individual verification has become impossible for most people. Investing in those institutions is not abstract - it is self-interest.', 'பெரும்பாலான மக்களுக்குத் தனிப்பட்ட சரிபார்ப்பு சாத்தியமற்றதாகிவிட்டதாலேயே, உண்மையை நிலைநாட்ட நாம் நம்பும் நிறுவனங்களான நீதிமன்றங்கள், ஒழுங்குமுறை அமைப்புகள், தரமான இதழியல் போன்றவை முன்னெப்போதையும் விட அதிக முக்கியத்துவம் பெறுகின்றன. அந்த நிறுவனங்களில் முதலீடு செய்வது என்பது ஒரு கருத்தியலானதல்ல - அது சுயநலம்.')
) AS v(ord, en, ta);

-- Survey set 5 #93
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India produces approximately 1.5 million engineering graduates per year. Studies consistently show that fewer than 20% are immediately employable in technical roles without significant retraining. Companies spend ₹1–3 lakh per hire on training that should have been delivered by the education system. A CEO says "Indian universities are outsourcing their job to Indian employers and charging students for the privilege."', 'Is he right?', 'இந்தியா ஆண்டுதோறும் சுமார் 15 லட்சம் பொறியியல் பட்டதாரிகளை உருவாக்குகிறது. அவர்களில் 20%க்கும் குறைவானவர்களே, குறிப்பிடத்தக்க மறுபயிற்சி இல்லாமல் தொழில்நுட்பப் பணிகளில் உடனடியாக வேலைக்குச் சேர்கின்றனர் என்று ஆய்வுகள் தொடர்ந்து காட்டுகின்றன. கல்வி முறையால் வழங்கப்பட்டிருக்க வேண்டிய பயிற்சிக்காக, நிறுவனங்கள் ஒவ்வொரு பணியமர்த்தலுக்கும் ₹1 முதல் 3 லட்சம் வரை செலவிடுகின்றன. "இந்தியப் பல்கலைக்கழகங்கள் தங்கள் வேலையை இந்திய முதலாளிகளுக்கு அவுட்சோர்ஸ் செய்துவிட்டு, அந்தச் சலுகைக்காக மாணவர்களிடம் கட்டணம் வசூலிக்கின்றன" என்று ஒரு தலைமை நிர்வாக அதிகாரி கூறுகிறார்.', 'அவர் சொல்வது சரியா?',
     '{"theme": "Future of Work", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Largely yes - universities optimise for accreditation, enrolment, and rankings. Employability is an outcome they are not directly accountable for and therefore do not prioritise. The incentive structure produces exactly this result.', 'பெரும்பாலும் ஆம் - பல்கலைக்கழகங்கள் அங்கீகாரம், மாணவர் சேர்க்கை மற்றும் தரவரிசைகளை மேம்படுத்துகின்றன. வேலைவாய்ப்பு என்பது அவை நேரடியாகப் பொறுப்பேற்காத ஒரு விளைவாகும், எனவே அதற்கு அவை முன்னுரிமை அளிப்பதில்லை. ஊக்கத்தொகை கட்டமைப்பு சரியாக இந்த முடிவையே உருவாக்குகிறது.'),
  (2, 'Partially - the employability gap is also an industry failure. Companies that demand three years of experience for entry-level roles, refuse to invest in structured internships, and design recruitment processes that filter for credentials over capability are co-creators of the problem.', 'ஓரளவிற்கு - வேலைவாய்ப்பு இடைவெளி என்பது ஒரு தொழில்துறை தோல்வியும்கூட. தொடக்க நிலை பணிகளுக்கு மூன்று வருட அனுபவத்தைக் கோரும், முறையான உள்ளகப் பயிற்சிகளில் முதலீடு செய்ய மறுக்கும், மற்றும் திறமையை விட தகுதிகளுக்கு முக்கியத்துவம் கொடுத்து ஆட்சேர்ப்பு செயல்முறைகளை வடிவமைக்கும் நிறுவனங்கள், இந்தப் பிரச்சனைக்குக் காரணமாக அமைகின்றன.'),
  (3, 'The 20% employability figure masks enormous variation. The top 10% of engineering colleges produce near-fully employable graduates. The bottom 50% produce almost none. The policy problem is the bottom half - not the system as a whole.', '20% வேலைவாய்ப்பு என்ற புள்ளிவிவரம், மிகப்பெரிய வேறுபாடுகளை மறைக்கிறது. சிறந்த 10% பொறியியல் கல்லூரிகள், ஏறக்குறைய முழுமையாக வேலைக்குத் தகுதியான பட்டதாரிகளை உருவாக்குகின்றன. கீழ்மட்ட 50% கல்லூரிகள் கிட்டத்தட்ட ஒருவரையும் உருவாக்குவதில்லை. கொள்கை ரீதியான பிரச்சனை என்பது கீழ்மட்டப் பிரிவினரிடம்தான் உள்ளது - ஒட்டுமொத்த அமைப்பிடம் அல்ல.'),
  (4, 'As a future employer this tells me that the graduates I hire are arriving with theoretical knowledge and a genuine gap in applied capability. The companies that build the best onboarding and early career development will systematically outperform on talent quality within three years of hiring.', 'வருங்கால முதலாளி என்ற முறையில், நான் பணியமர்த்தும் பட்டதாரிகள் கோட்பாட்டு அறிவுடனும், அதனைச் செயல்படுத்தும் திறனில் ஒரு உண்மையான இடைவெளியுடனும் வருகிறார்கள் என்பதை இது எனக்கு உணர்த்துகிறது. சிறந்த பணியமர்வு மற்றும் ஆரம்பகால தொழில் மேம்பாட்டை உருவாக்கும் நிறுவனங்கள், பணியமர்த்தப்பட்ட மூன்று ஆண்டுகளுக்குள் திறமைத் தரத்தில் சீராக சிறந்து விளங்கும்.')
) AS v(ord, en, ta);

-- Survey set 5 #94
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India has committed to 500 gigawatts of renewable energy capacity by 2030. As of 2024 it has achieved approximately 190 gigawatts. The gap requires adding more renewable capacity in six years than it has built in the last two decades. A energy analyst says "India''s energy transition is the most ambitious infrastructure project in human history - and almost nobody is talking about it."', 'What does this mean for the businesses you will lead?', '2030-ஆம் ஆண்டுக்குள் 500 ஜிகாவாட் புதுப்பிக்கத்தக்க எரிசக்தித் திறனை எட்டுவதற்கு இந்தியா உறுதிபூண்டுள்ளது. 2024-ஆம் ஆண்டு நிலவரப்படி, அது ஏறத்தாழ 190 ஜிகாவாட் திறனை எட்டியுள்ளது. இந்த இடைவெளியை நிரப்ப, கடந்த இருபது ஆண்டுகளில் உருவாக்கப்பட்டதை விட அதிகமான புதுப்பிக்கத்தக்க எரிசக்தித் திறனை ஆறு ஆண்டுகளில் சேர்க்க வேண்டியுள்ளது. ஒரு எரிசக்தி ஆய்வாளர் கூறுகிறார், "இந்தியாவின் எரிசக்தி மாற்றம் என்பது மனித வரலாற்றிலேயே மிகவும் லட்சியமிக்க உள்கட்டமைப்புத் திட்டமாகும் - ஆனால் அதைப் பற்றி கிட்டத்தட்ட யாரும் பேசுவதில்லை."', 'நீங்கள் வழிநடத்தவிருக்கும் வணிகங்களுக்கு இது என்ன தாக்கத்தை ஏற்படுத்தும்?',
     '{"theme": "Environment & Business", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It means energy costs, energy reliability, and carbon accounting will all shift significantly within the working life of everyone in this room. Every business plan that assumes current energy economics over a ten-year horizon is making a planning error.', 'இதன் பொருள், இந்த அறையில் உள்ள அனைவரின் பணி வாழ்க்கையிலும் எரிசக்தி செலவுகள், எரிசக்தி நம்பகத்தன்மை மற்றும் கார்பன் கணக்கீடு ஆகியவை கணிசமாக மாறும் என்பதாகும். பத்து ஆண்டு காலத்திற்கு தற்போதைய எரிசக்திப் பொருளாதாரத்தை அனுமானிக்கும் ஒவ்வொரு வணிகத் திட்டமும் ஒரு திட்டமிடல் பிழையைச் செய்கிறது.'),
  (2, 'It means the supply chains for solar panels, wind turbines, battery storage, and grid infrastructure represent one of the largest procurement opportunities in the world - concentrated in a single country over a compressed timeframe.', 'இதன் பொருள் என்னவென்றால், சூரிய மின் தகடுகள், காற்றாலைகள், மின்கல சேமிப்பு மற்றும் மின்கட்டமைப்பு உள்கட்டமைப்பு ஆகியவற்றிற்கான விநியோகச் சங்கிலிகள், ஒரு குறுகிய காலக்கெடுவிற்குள் ஒரே நாட்டில் குவிந்திருக்கும் உலகின் மிகப்பெரிய கொள்முதல் வாய்ப்புகளில் ஒன்றாக விளங்குகின்றன.'),
  (3, 'It means the talent required to execute this transition - engineers, project managers, grid operators, finance professionals who understand renewable project economics - is acutely scarce. The human capital gap may limit the physical infrastructure gap.', 'இதன் பொருள், இந்த மாற்றத்தைச் செயல்படுத்தத் தேவையான திறமையாளர்கள் - அதாவது, புதுப்பிக்கத்தக்க எரிசக்தித் திட்டப் பொருளாதாரத்தைப் புரிந்துகொண்ட பொறியாளர்கள், திட்ட மேலாளர்கள், மின் கட்டமைப்பு இயக்குநர்கள், நிதி வல்லுநர்கள் - மிகவும் பற்றாக்குறையாக உள்ளனர். மனித மூலதன இடைவெளியானது, பௌதீக உள்கட்டமைப்பு இடைவெளியைக் குறைக்கக்கூடும்.'),
  (4, 'It means that businesses which get ahead of carbon accounting now - measuring, reducing, and eventually pricing their emissions internally - will face a smoother regulatory transition than those that wait for external mandates to force the calculation.', 'இதன் பொருள் என்னவென்றால், கார்பன் கணக்கீட்டை இப்போதே முன்னெடுத்துச் செல்லும் வணிகங்கள் – அதாவது, தங்கள் உமிழ்வுகளை நிறுவனத்திற்குள்ளேயே அளவிட்டு, குறைத்து, இறுதியில் அதற்கான விலையை நிர்ணயிக்கும் வணிகங்கள் – இந்தக் கணக்கீட்டைக் கட்டாயப்படுத்த வெளிப்புற ஆணைகளுக்காகக் காத்திருக்கும் நிறுவனங்களை விட, ஒரு சுமுகமான ஒழுங்குமுறை மாற்றத்தை எதிர்கொள்ளும்.')
) AS v(ord, en, ta);

-- Survey set 5 #95
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'You are a senior manager. A high-performing employee - your best analyst - comes to you and says they have been offered a role at a competitor at a 60% salary increase. They are not asking for a counteroffer. They are telling you out of respect because you have invested in them for three years. You cannot match the offer.', 'What do you do?', 'நீங்கள் ஒரு மூத்த மேலாளர். சிறப்பாகச் செயல்படும் ஒரு ஊழியர் - உங்கள் சிறந்த ஆய்வாளர் - உங்களிடம் வந்து, ஒரு போட்டி நிறுவனத்தில் தனக்கு 60% சம்பள உயர்வுடன் ஒரு பதவி வழங்கப்பட்டிருப்பதாகக் கூறுகிறார். அவர் ஒரு மாற்றுச் சலுகையைக் கேட்கவில்லை. மூன்று ஆண்டுகளாக நீங்கள் அவர்களுக்காக முதலீடு செய்திருப்பதால், மரியாதை நிமித்தமாக உங்களிடம் கூறுகிறார். உங்களால் அந்தச் சலுகைக்கு ஈடாக ஒரு சலுகையை வழங்க முடியாது.', 'நீங்கள் என்ன செய்கிறீர்கள்?',
     '{"theme": "Business & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Thank them for telling me directly, help them transition well, and spend the next month thinking hard about why my organisation cannot retain its best people. The exit is information - not just a loss.', 'என்னிடம் நேரடியாகச் சொன்னதற்காக அவர்களுக்கு நன்றி சொல்லுங்கள், அவர்கள் இந்த மாற்றத்தைச் சுமுகமாக ஏற்றுக்கொள்ள உதவுங்கள், மேலும் எனது நிறுவனத்தால் அதன் சிறந்த ஊழியர்களை ஏன் தக்கவைத்துக்கொள்ள முடியவில்லை என்பது குறித்து அடுத்த மாதம் முழுவதும் தீவிரமாகச் சிந்தியுங்கள். இந்த வெளியேற்றம் என்பது ஒரு இழப்பு மட்டுமல்ல, அது ஒரு தகவலும் கூட.'),
  (2, 'Be honest that I cannot match the offer but make clear what I can offer - the work, the learning curve, the relationship - and let them make a fully informed decision. Retention through transparency is the only retention worth having.', 'அந்தச் சலுகைக்கு ஈடாக என்னால் வழங்க முடியாது என்பதை நேர்மையாக ஒப்புக்கொள்ளுங்கள். ஆனால், என்னால் என்ன வழங்க முடியும் என்பதைத் தெளிவாகக் கூறுங்கள் - அதாவது, நான் செய்யும் வேலை, கற்றுக்கொள்ளும் விதம், மற்றும் உறவுமுறை - அதன்பின் அவர்கள் முழுமையாகத் தெரிந்துகொண்டு ஒரு முடிவை எடுக்கட்டும். வெளிப்படைத்தன்மையின் மூலமான தக்கவைப்பே, மதிப்புமிக்க ஒரே தக்கவைப்பு முறையாகும்.'),
  (3, 'Ask them what the role actually offers beyond salary - growth trajectory, culture, stability - and have an honest conversation about whether the 60% gap is worth what they might be trading. Not to retain them manipulatively but because I genuinely want them to make a good decision.', 'சம்பளத்தைத் தாண்டி அந்தப் பதவி உண்மையில் என்ன வழங்குகிறது - வளர்ச்சிப் பாதை, பணிச்சூழல், நிலைத்தன்மை - என்று அவர்களிடம் கேளுங்கள். மேலும், அவர்கள் இழக்க நேரிடும் அந்த 60% சம்பள இடைவெளிக்கு அது தகுதியானதா என்பது பற்றி நேர்மையாக உரையாடுங்கள். அவர்களைத் தந்திரமாகத் தக்கவைத்துக் கொள்வதற்காக அல்ல, மாறாக அவர்கள் ஒரு நல்ல முடிவை எடுக்க வேண்டும் என்று நான் உண்மையாகவே விரும்புவதால்தான்.'),
  (4, 'Let them go gracefully and stay connected. The best professional relationships survive employer changes. An analyst who leaves well and succeeds elsewhere is a network asset, a future client, a reference, and possibly a returning hire. How I handle this moment is the investment.', 'அவர்கள் கண்ணியமாகப் பிரியட்டும், தொடர்பில் இருங்கள். சிறந்த தொழில்முறை உறவுகள், வேலையளிப்பவர் மாறினாலும் நீடித்து நிலைத்திருக்கும். சிறப்பாகப் பணியை விட்டு விலகி, வேறு இடத்தில் வெற்றிபெறும் ஒரு ஆய்வாளர், தனது தொடர்பு வட்டத்திற்கு ஒரு சொத்தாகவும், வருங்கால வாடிக்கையாளராகவும், ஒரு பரிந்துரையாளராகவும், ஒருவேளை மீண்டும் பணியில் சேரக்கூடியவராகவும் திகழ்கிறார். இந்தத் தருணத்தை நான் எவ்வாறு கையாளுகிறேன் என்பதே இதில் உள்ள முதலீடு.')
) AS v(ord, en, ta);

-- Survey set 5 #96
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s goods exports in 2023–24 were approximately $437 billion. China''s were $3.4 trillion - nearly eight times larger. Both countries have comparable populations. A trade economist says "India and China started from similar positions in 1980 - the gap today is entirely explained by choices made in the intervening four decades."', 'What were those choices?', '2023-24 ஆம் ஆண்டில் இந்தியாவின் பொருட்கள் ஏற்றுமதி சுமார் 437 பில்லியன் டாலராக இருந்தது. சீனாவின் ஏற்றுமதி 3.4 டிரில்லியன் டாலராக இருந்தது - இது கிட்டத்தட்ட எட்டு மடங்கு அதிகம். இரு நாடுகளும் ஏறக்குறைய சமமான மக்கள்தொகையைக் கொண்டுள்ளன. ஒரு வர்த்தகப் பொருளாதார நிபுணர் கூறுகிறார், "1980-ல் இந்தியாவும் சீனாவும் ஏறக்குறைய ஒரே நிலையில் இருந்து தொடங்கின - இன்றைய இடைவெளிக்கு, இடையில் உள்ள நான்கு தசாப்தங்களில் எடுக்கப்பட்ட முடிவுகளே முழுமையாகக் காரணம்."', 'அந்தத் தேர்வுகள் என்னென்ன?',
     '{"theme": "Political Economy", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'China made a deliberate choice to integrate into global manufacturing supply chains through special economic zones, suppressed labour costs, and infrastructure investment at a scale and speed that India''s democratic system could not replicate. The gap is partly a story about the limits of democracy in development.', 'சிறப்புப் பொருளாதார மண்டலங்கள், கட்டுப்படுத்தப்பட்ட தொழிலாளர் செலவுகள் மற்றும் உள்கட்டமைப்பு முதலீடுகள் ஆகியவற்றின் மூலம் உலகளாவிய உற்பத்தி விநியோகச் சங்கிலிகளில் ஒருங்கிணைவதை, இந்தியாவின் ஜனநாயக அமைப்பால் மீண்டும் செயல்படுத்த முடியாத ஒரு அளவிலும் வேகத்திலும் சீனா திட்டமிட்டுத் தேர்ந்தெடுத்தது. இந்த இடைவெளியானது, ஓரளவிற்கு, வளர்ச்சியில் ஜனநாயகத்தின் வரம்புகளைப் பற்றிய ஒரு கதையாகும்.'),
  (2, 'India chose services over manufacturing, domestic consumption over export orientation, and regulatory protection over competitive exposure. Each choice had internal logic. The cumulative result is an export base that is a fraction of China''s despite comparable human capital.', 'இந்தியா, உற்பத்தித் துறையை விட சேவைத் துறையையும், ஏற்றுமதி நோக்குநிலையை விட உள்நாட்டு நுகர்வையும், போட்டிச் சூழலை விட ஒழுங்குமுறைப் பாதுகாப்பையும் தேர்ந்தெடுத்தது. ஒவ்வொரு தேர்விற்கும் உள்ளார்ந்த தர்க்கம் இருந்தது. இதன் ஒட்டுமொத்த விளைவாக, ஒப்பிடத்தக்க மனித மூலதனம் இருந்தபோதிலும், சீனாவின் ஏற்றுமதித் தளத்தில் ஒரு சிறு பகுதியையே இந்தியா கொண்டுள்ளது.'),
  (3, 'The comparison obscures as much as it reveals. China''s export growth came with environmental costs, labour suppression, and debt accumulation that India has not replicated. The gap in exports is real - whether the gap in overall development outcomes is as large is a different question.', 'இந்த ஒப்பீடு, பல உண்மைகளை வெளிப்படுத்துவதை விட பல உண்மைகளை மறைக்கிறது. சீனாவின் ஏற்றுமதி வளர்ச்சியானது, சுற்றுச்சூழல் பாதிப்புகள், தொழிலாளர் ஒடுக்குமுறை மற்றும் கடன் குவிப்பு ஆகியவற்றுடன் வந்தது; இவற்றை இந்தியா பின்பற்றவில்லை. ஏற்றுமதியில் உள்ள இடைவெளி உண்மையானது - ஆனால், ஒட்டுமொத்த வளர்ச்சி விளைவுகளில் உள்ள இடைவெளி அந்த அளவுக்குப் பெரியதா என்பது வேறு கேள்வி.'),
  (4, 'India still has time - China''s export dominance is facing headwinds from geopolitics, rising wages, and supply chain diversification pressure. The question is whether India can build the infrastructure, policy consistency, and manufacturing ecosystem to capture the opportunity opening up. The window exists. Whether India walks through it is a choice being made right now.', 'இந்தியாவுக்கு இன்னும் நேரம் இருக்கிறது - சீனாவின் ஏற்றுமதி ஆதிக்கம், புவிசார் அரசியல், அதிகரித்து வரும் ஊதியங்கள் மற்றும் விநியோகச் சங்கிலி பல்வகைப்படுத்தல் அழுத்தம் ஆகியவற்றால் பின்னடைவுகளைச் சந்தித்து வருகிறது. உருவாகி வரும் இந்த வாய்ப்பைப் பயன்படுத்திக்கொள்ள, இந்தியாவால் தேவையான உள்கட்டமைப்பு, கொள்கை நிலைத்தன்மை மற்றும் உற்பத்திச் சூழலமைப்பை உருவாக்க முடியுமா என்பதுதான் கேள்வி. அதற்கான வாய்ப்புக்கான சாளரம் இருக்கிறது. இந்தியா அந்த வாய்ப்பைப் பயன்படுத்திக்கொள்ளுமா என்பது இப்போதே எடுக்கப்பட்டு வரும் ஒரு முடிவாகும்.')
) AS v(ord, en, ta);

-- Survey set 5 #97
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'Your MBA batch raises ₹5 lakh for flood relief in a district of Tamil Nadu. Half the batch wants to donate it directly to an established NGO with a track record. The other half wants to go directly to the district and distribute it themselves. A development professional advising you says "good intentions plus bad delivery systems equals wasted money."', 'What do you decide?', 'உங்கள் MBA வகுப்பு, தமிழ்நாட்டின் ஒரு மாவட்டத்தில் ஏற்பட்ட வெள்ள நிவாரணத்திற்காக ₹5 லட்சம் திரட்டுகிறது. அந்த வகுப்பில் பாதிப் பேர், நற்பெயர் பெற்ற ஒரு தொண்டு நிறுவனத்திற்கு அதை நேரடியாக நன்கொடையாக வழங்க விரும்புகிறார்கள். மற்ற பாதிப் பேர், நேரடியாக மாவட்டத்திற்கே சென்று தாங்களே விநியோகிக்க விரும்புகிறார்கள். உங்களுக்கு ஆலோசனை வழங்கும் ஒரு வளர்ச்சித் துறை நிபுணர், "நல்ல நோக்கங்களும் மோசமான விநியோக முறைகளும் சேர்ந்தால், பணம் வீணாகும்" என்கிறார்.', 'நீங்கள் என்ன முடிவு செய்கிறீர்கள்?',
     '{"theme": "Social Responsibility", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Give it to the established NGO - not because the direct approach is wrong in principle but because effective disaster relief requires logistics, local knowledge, and coordination that we do not have and cannot build in the time available.', 'இதை நிறுவப்பட்ட தன்னார்வ தொண்டு நிறுவனத்திடம் கொடுங்கள் - நேரடி அணுகுமுறை கொள்கையளவில் தவறானது என்பதற்காக அல்ல, மாறாக, திறம்பட்ட பேரிடர் நிவாரணப் பணிகளுக்குத் தேவைப்படும் தளவாட ஏற்பாடுகள், உள்ளூர் அறிவு மற்றும் ஒருங்கிணைப்பு ஆகியவை நம்மிடம் இல்லை, மேலும் இருக்கும் நேரத்தில் அவற்றை நம்மால் உருவாக்கவும் முடியாது என்பதால்தான்.'),
  (2, 'Split the money - half through the NGO for immediate relief and half held for a follow-up direct intervention three months later when the acute phase is over and targeted recovery support is more valuable than generic relief.', 'பணத்தைப் பிரித்துக் கொடுங்கள் - பாதிப் பணத்தை உடனடி நிவாரணத்திற்காகத் தொண்டு நிறுவனத்திற்கும், மீதிப் பணத்தை மூன்று மாதங்களுக்குப் பிறகு, கடுமையான பாதிப்புக் காலம் முடிந்ததும், பொதுவான நிவாரணத்தை விட இலக்கு வைக்கப்பட்ட மீட்பு ஆதரவு அதிக மதிப்புள்ளதாக இருக்கும்போது, ​​தொடர் நேரடித் தலையீட்டிற்காகவும் வைத்துக் கொள்ளுங்கள்.'),
  (3, 'Go directly - but partner with the local government officer and panchayat rather than distributing independently. The institutional knowledge is there. What is missing is the resource. Combine the two rather than choosing between them.', 'நேரடியாகச் செல்லுங்கள் - ஆனால் சுயமாகப் பகிர்ந்தளிப்பதற்குப் பதிலாக, உள்ளாட்சி அலுவலர் மற்றும் பஞ்சாயத்துடன் இணைந்து செயல்படுங்கள். நிறுவன ரீதியான அறிவு இருக்கிறது. இல்லாதது அதற்கான வளம்தான். அவற்றுக்கு இடையே ஒன்றைத் தேர்ந்தெடுப்பதற்குப் பதிலாக, இரண்டையும் ஒன்றிணையுங்கள்.'),
  (4, 'Before deciding where the money goes, decide what problem we are trying to solve. Immediate food and shelter, rebuilding livelihoods, or long-term resilience require completely different delivery mechanisms. The development professional is right - method follows diagnosis.', 'பணம் எங்கே செல்கிறது என்று தீர்மானிப்பதற்கு முன், நாம் என்ன சிக்கலைத் தீர்க்க முயற்சிக்கிறோம் என்பதைத் தீர்மானிக்க வேண்டும். உடனடி உணவு மற்றும் தங்குமிடம், வாழ்வாதாரங்களை மீண்டும் கட்டியெழுப்புதல் அல்லது நீண்டகால மீள்திறன் ஆகியவற்றுக்கு முற்றிலும் மாறுபட்ட விநியோக வழிமுறைகள் தேவைப்படுகின்றன. வளர்ச்சித் துறை நிபுணர் சொல்வது சரிதான் - சிக்கலைக் கண்டறிந்த பின்னரே செயல்முறை தொடங்கும்.')
) AS v(ord, en, ta);

-- Survey set 5 #98
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'India''s COWIN platform managed the vaccination of 2.2 billion doses - the largest vaccination drive in human history - through a digital registration, slot booking, and certificate system. It worked well enough to deliver the programme at scale while simultaneously excluding elderly and rural populations without smartphone access. A public health researcher says "COWIN is both India''s greatest digital governance achievement and a case study in digital exclusion."', 'What does this tell you?', 'இந்தியாவின் கோவின் (COWIN) தளம், ஒரு டிஜிட்டல் பதிவு, நேர ஒதுக்கீடு மற்றும் சான்றிதழ் வழங்கும் முறையின் மூலம், மனித வரலாற்றிலேயே மிகப்பெரிய தடுப்பூசி இயக்கமான 220 கோடி டோஸ் தடுப்பூசிகளை வெற்றிகரமாகச் செயல்படுத்தியது. ஸ்மார்ட்போன் வசதி இல்லாத முதியவர்கள் மற்றும் கிராமப்புற மக்களை இந்தத் திட்டத்திலிருந்து விலக்கிய அதே வேளையில், இத்திட்டத்தை பெரிய அளவில் செயல்படுத்தும் அளவுக்கு அது சிறப்பாகச் செயல்பட்டது. ஒரு பொது சுகாதார ஆய்வாளர், "கோவின் என்பது இந்தியாவின் மிகப்பெரிய டிஜிட்டல் ஆளுகை சாதனையாகவும், டிஜிட்டல் விலக்கலுக்கான ஒரு சிறந்த எடுத்துக்காட்டாகத் திகழ்கிறது" என்கிறார்.', 'இது உங்களுக்கு என்ன சொல்கிறது?',
     '{"theme": "Governance & Technology", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'It tells me that digital systems scale brilliantly for the connected and fail invisibly for the unconnected. The achievement and the exclusion are the same design decision - build digital first and add offline as an afterthought.', 'டிஜிட்டல் அமைப்புகள், இணையத்துடன் இணைக்கப்பட்டவர்களுக்கு மிகச் சிறப்பாக விரிவடைகின்றன என்றும், இணைய இணைப்பு இல்லாதவர்களுக்குக் கண்ணுக்குத் தெரியாமல் தோல்வியடைகின்றன என்றும் இது எனக்கு உணர்த்துகிறது. இந்தச் சாதனையும் புறக்கணிப்பும் ஒரே வடிவமைப்பு முடிவுதான் - முதலில் டிஜிட்டலைக் கட்டமைத்து, பின்னர் ஆஃப்லைனைச் சேர்ப்பது.'),
  (2, 'It tells me that in a crisis speed matters more than perfection. COWIN was built in weeks and delivered at a scale no offline system could have matched. The exclusion was real but the counterfactual - slower vaccination for everyone - was worse.', 'ஒரு நெருக்கடியான சூழலில், செம்மையை விட வேகமே முக்கியம் என்பதை இது எனக்கு உணர்த்துகிறது. கோவின் (COWIN) சில வாரங்களிலேயே உருவாக்கப்பட்டு, எந்தவொரு ஆஃப்லைன் அமைப்பாலும் ஈடு செய்ய முடியாத ஒரு அளவில் வழங்கப்பட்டது. புறக்கணிப்பு என்பது உண்மையானதுதான், ஆனால் அதற்கு எதிரான யதார்த்தம் - அதாவது அனைவருக்கும் தடுப்பூசி போடும் வேகம் குறைவது - அதைவிட மோசமாக இருந்தது.'),
  (3, 'It tells me that every technology solution has a last-mile problem that the technology cannot solve. COWIN needed community health workers, panchayat offices, and mobile vaccination camps to reach the people the app could not. The digital layer and the human layer are complements not substitutes.', 'ஒவ்வொரு தொழில்நுட்பத் தீர்வுக்கும், அந்தத் தொழில்நுட்பத்தால் தீர்க்க முடியாத ஒரு இறுதிக்கட்டச் சிக்கல் இருக்கிறது என்பதை இது எனக்கு உணர்த்துகிறது. செயலியால் சென்றடைய முடியாத மக்களைச் சென்றடைய, கோவின் (COWIN) அமைப்புக்கு சமூக சுகாதாரப் பணியாளர்கள், பஞ்சாயத்து அலுவலகங்கள் மற்றும் நடமாடும் தடுப்பூசி முகாம்கள் தேவைப்பட்டன. டிஜிட்டல் அடுக்கு மற்றும் மனித அடுக்கு ஆகியவை ஒன்றுக்கொன்று மாற்றாக அமையாமல், நிரப்பிகளாக உள்ளன.'),
  (4, 'It tells me that when I design systems - for customers, for employees, for communities - I need to start with the hardest-to-reach user not the easiest. Systems designed for the median user exclude the margin. Systems designed for the margin work for everyone.', 'வாடிக்கையாளர்களுக்காக, ஊழியர்களுக்காக, சமூகங்களுக்காக நான் அமைப்புகளை வடிவமைக்கும்போது, ​​எளிதில் சென்றடையக்கூடிய பயனரிடமிருந்து அல்ல, மாறாக மிகவும் கடினமாகச் சென்றடையக்கூடிய பயனரிடமிருந்து தொடங்க வேண்டும் என்பதை இது எனக்கு உணர்த்துகிறது. சராசரிப் பயனருக்காக வடிவமைக்கப்பட்ட அமைப்புகள் விளிம்புநிலை மக்களைப் புறக்கணித்துவிடுகின்றன. விளிம்புநிலை மக்களுக்காக வடிவமைக்கப்பட்ட அமைப்புகள் அனைவருக்கும் பயனளிக்கின்றன.')
) AS v(ord, en, ta);

-- Survey set 5 #99
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'A founder of a well-known Indian startup is publicly celebrated for building a unicorn in five years. Privately, several former employees have described a culture of fear, public humiliation of underperformers, and 80-hour work weeks as normal expectation. No formal complaint has been filed. The company''s product genuinely helps millions of users. A classmate says "the outcome justifies the culture." Another says "the culture is the outcome."', 'Who is right?', 'புகழ்பெற்ற இந்திய ஸ்டார்ட்அப் நிறுவனம் ஒன்றின் நிறுவனர், ஐந்து ஆண்டுகளில் ஒரு யூனிகார்ன் நிறுவனத்தை உருவாக்கியதற்காகப் பொதுவெளியில் கொண்டாடப்படுகிறார். தனிப்பட்ட முறையில், பல முன்னாள் ஊழியர்கள், அங்கு நிலவிய அச்சம் நிறைந்த சூழல், திறமையற்றவர்களைப் பொதுவெளியில் அவமானப்படுத்துதல், மற்றும் வாரத்திற்கு 80 மணிநேர வேலை ஆகியவை இயல்பான எதிர்பார்ப்புகளாக இருந்ததாக விவரித்துள்ளனர். முறையான புகார் எதுவும் பதிவு செய்யப்படவில்லை. அந்த நிறுவனத்தின் தயாரிப்பு, லட்சக்கணக்கான பயனர்களுக்கு உண்மையாகவே உதவுகிறது. ஒரு சக மாணவர், "முடிவு அந்தச் சூழலை நியாயப்படுத்துகிறது" என்கிறார். மற்றொருவர், "அந்தச் சூழலே முடிவு" என்கிறார்.', 'யார் சொல்வது சரி?',
     '{"theme": "Leadership & Ethics", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'The second classmate - an organisation''s culture is not separate from its product. A culture built on fear produces a specific kind of output - fast, brittle, dependent on the founder''s presence, and unable to sustain itself when the pressure is removed.', 'இரண்டாவது வகுப்புத் தோழரே - ஒரு நிறுவனத்தின் கலாச்சாரம் அதன் தயாரிப்பிலிருந்து பிரிக்க முடியாதது. அச்சத்தின் மீது கட்டமைக்கப்பட்ட ஒரு கலாச்சாரம் ஒரு குறிப்பிட்ட வகையான வெளியீட்டை உருவாக்குகிறது - அது வேகமானது, எளிதில் உடையக்கூடியது, நிறுவனரின் இருப்பைச் சார்ந்தது, மற்றும் அழுத்தம் நீக்கப்பட்டவுடன் தன்னைத் தக்க வைத்துக் கொள்ள இயலாதது.'),
  (2, 'The first classmate is making a consequentialist argument that has some validity. Millions of users benefiting from a product is a real outcome. The employees who chose to stay in that culture made their own decisions. Paternalism about other adults'' choices has limits.', 'முதல் வகுப்புத் தோழர் முன்வைக்கும் விளைவுவாத வாதத்தில் ஓரளவு உண்மைத்தன்மை உள்ளது. ஒரு பொருளால் மில்லியன் கணக்கான பயனர்கள் பயனடைவது ஒரு உண்மையான விளைவாகும். அந்தக் கலாச்சாரத்திலேயே நீடிக்கத் தேர்ந்தெடுத்த ஊழியர்கள், தங்கள் சொந்த முடிவுகளை எடுத்தனர். மற்ற பெரியவர்களின் தேர்வுகள் மீதான தந்தைவழி ஆதிக்க மனப்பான்மைக்கு வரம்புகள் உண்டு.'),
  (3, 'Neither fully - the question is sustainability. A fear-based culture can produce extraordinary short-term output. The question is what it looks like at year ten when the founder cannot be in every room and the people who built it have left.', 'முழுமையாகவும் இல்லை - கேள்வி நிலைத்தன்மை பற்றியது. அச்சத்தை அடிப்படையாகக் கொண்ட ஒரு கலாச்சாரம், குறுகிய காலத்தில் அசாதாரணமான விளைவுகளை ஏற்படுத்தக்கூடும். நிறுவனரால் எல்லா அறைகளிலும் இருக்க முடியாதபோதும், அதைக் கட்டியெழுப்பியவர்கள் வெளியேறிய பிறகும், பத்தாவது ஆண்டில் அது எப்படி இருக்கும் என்பதுதான் கேள்வி.'),
  (4, 'As a future leader this is the question I have to answer for myself before I am in the position to answer it for others. What kind of culture am I willing to build - and what am I willing to give up to maintain it? The founder made a choice. I will make mine.', 'ஒரு வருங்காலத் தலைவனாக, மற்றவர்களுக்குப் பதிலளிக்கும் நிலையை அடைவதற்கு முன்பு, இந்தக் கேள்விக்கு நான் எனக்கே பதிலளிக்க வேண்டும். நான் எத்தகைய கலாச்சாரத்தை உருவாக்கத் தயாராக இருக்கிறேன் - மேலும், அதைப் பேணுவதற்காக எதை விட்டுக்கொடுக்கத் தயாராக இருக்கிறேன்? நிறுவனர் ஒரு முடிவை எடுத்தார். நான் என்னுடைய முடிவை எடுப்பேன்.')
) AS v(ord, en, ta);

-- Survey set 5 #100
WITH oq AS (
  INSERT INTO open_questions
    (question_type, media_type, set_number,
     context_text_en, question_text_en, context_text_ta, question_text_ta,
     metadata, is_active, is_deleted)
  VALUES ('SURVEY', 'TEXT', 5,
     'You have just answered 99 questions about India - its governance, its economy, its society, its leaders, and its future. A professor asks one final question: "After everything you have studied, everything you have seen, and everything you are about to go and do - are you optimistic about India?"', 'Are you optimistic about India?', 'நீங்கள் இப்போதுதான் இந்தியாவைப் பற்றிய 99 கேள்விகளுக்குப் பதிலளித்திருக்கிறீர்கள் - அதன் ஆட்சிமுறை, பொருளாதாரம், சமூகம், தலைவர்கள் மற்றும் அதன் எதிர்காலம் என அனைத்தும். ஒரு பேராசிரியர் இறுதியாக ஒரு கேள்வியைக் கேட்கிறார்: "நீங்கள் படித்த அனைத்திற்கும், நீங்கள் கண்ட அனைத்திற்கும், நீங்கள் செய்யப்போகும் அனைத்திற்கும் பிறகு - இந்தியாவைப் பற்றி நீங்கள் நம்பிக்கையுடன் இருக்கிறீர்களா?"', 'இந்தியா குறித்து உங்களுக்கு நம்பிக்கை உள்ளதா?',
     '{"theme": "The MBA & Society", "source": "mba_survey_v1"}'::jsonb, true, false)
  RETURNING id
)
INSERT INTO open_question_options
  (open_question_id, option_type, option_text_en, option_text_ta,
   is_valid, display_order, is_active, is_deleted)
SELECT oq.id, 'TEXT', v.en, v.ta, false, v.ord, true, false
FROM oq, (VALUES
  (1, 'Yes - not naively but structurally. A democracy of 1.4 billion people that has held together, grown its economy, expanded its middle class, and deepened its institutions over 75 years despite every prediction of failure has earned a baseline of optimism. The problems are real. So is the resilience.', 'ஆம் - அப்பாவித்தனமாக அல்ல, மாறாக கட்டமைப்பு ரீதியாக. தோல்வி குறித்த ஒவ்வொரு கணிப்பையும் மீறி, 75 ஆண்டுகளுக்கும் மேலாக ஒன்றுபட்டு, தனது பொருளாதாரத்தை வளர்த்து, நடுத்தர வர்க்கத்தை விரிவுபடுத்தி, நிறுவனங்களை ஆழப்படுத்திய 140 கோடி மக்களைக் கொண்ட ஒரு ஜனநாயகம், ஒருவித அடிப்படை நம்பிக்கையைப் பெற்றுள்ளது. பிரச்சினைகள் உண்மையானவை. மீள்திறனும் அவ்வாறே.'),
  (2, 'Cautiously - the opportunity is enormous and so is the distance between where India is and where it could be. Optimism without urgency produces complacency. I am hopeful enough to commit my energy and sceptical enough to stay honest about what needs to change.', 'எச்சரிக்கையுடன் - வாய்ப்பு மகத்தானது, அதேபோல் இந்தியா தற்போது இருக்கும் நிலைக்கும் அது இருக்கக்கூடிய நிலைக்கும் இடையிலான இடைவெளியும் மகத்தானது. அவசரம் இல்லாத நம்பிக்கை, தன்னிறைவையே உருவாக்கும். எனது ஆற்றலை அர்ப்பணிக்கும் அளவுக்கு நான் நம்பிக்கையுடனும், என்ன மாற்றப்பட வேண்டும் என்பது குறித்து நேர்மையாக இருக்கும் அளவுக்கு ஐயுறவுடனும் இருக்கிறேன்.'),
  (3, 'I am not sure optimism is the right frame. Optimism is a feeling. What India needs from the people in this room is commitment - to build well, to govern honestly, to speak when things are wrong, and to stay in the arena even when it is uncomfortable. Feeling optimistic is easy. Acting on it is the work.', '''நம்பிக்கை'' என்பது சரியான வார்த்தை என்று எனக்கு உறுதியாகத் தெரியவில்லை. நம்பிக்கை என்பது ஒரு உணர்வு. இந்த அறையில் உள்ளவர்களிடமிருந்து இந்தியாவுக்குத் தேவைப்படுவது அர்ப்பணிப்புதான் – அதாவது, சிறப்பாகக் கட்டமைப்பதற்கும், நேர்மையாக ஆட்சி செய்வதற்கும், தவறுகள் நடக்கும்போது குரல் கொடுப்பதற்கும், சங்கடமான சூழலிலும் களத்தில் நிலைத்திருப்பதற்கும் ஆன அர்ப்பணிப்பு. நம்பிக்கையுடன் இருப்பது எளிது. அதன்படி செயல்படுவதுதான் உண்மையான வேலை.'),
  (4, 'I will answer that question by what I build. Not by what I say in a classroom on the last day of my MBA.', 'நான் உருவாக்குவதைக் கொண்டே அந்தக் கேள்விக்கு பதிலளிப்பேன். எனது MBA படிப்பின் கடைசி நாளில் வகுப்பறையில் நான் சொல்வதைக் கொண்டு அல்ல.')
) AS v(ord, en, ta);

-- questions = 100, options = 400, sets = [(1, 20), (2, 20), (3, 20), (4, 20), (5, 20)]
COMMIT;
# Technical Assessment Pages and Authentication Flow

Date: 2026-04-13
Status: Proposed (MVP + Scale-ready)

## 1. Final Answer: How Many Pages

## 1.1 OriginBI Platform Pages (Host App)
1. Admin Technical Assessment Management
2. Corporate Technical Assessment Management

Total in OriginBI host app: 2 pages

## 1.2 Technical Assessment App Pages (Candidate App)
1. Login Page
2. SSO Callback Bridge Page (token handoff)
3. Dashboard Page
4. Exam Center Page (Level cards + status)
5. Assessment Level 1 Page (MCQ)
6. Assessment Level 2 Page (Coding)
7. Review and Final Submit Page
8. Submission Success Page
9. Performance Analytics Page
10. Practice Hub Page
11. Practice MCQ Quiz Page
12. Practice Coding Quiz Page
13. Learning Path Page
14. Profile and Settings Page

Total in Technical Assessment app: 14 pages

Grand total (host + technical app): 16 pages

## 2. Route Map (Recommended)

## 2.1 Host App (OriginBI)
1. /admin/technical-assessments
2. /corporate/technical-assessments

## 2.2 Technical Assessment App
1. /ta/login
2. /ta/auth/sso/callback
3. /ta/dashboard
4. /ta/exam-center
5. /ta/exam/level-1-mcq
6. /ta/exam/level-2-coding
7. /ta/exam/review-submit
8. /ta/exam/submitted
9. /ta/performance
10. /ta/practice
11. /ta/practice/mcq
12. /ta/practice/coding
13. /ta/learning-path
14. /ta/profile

## 3. Authentication: Two Login Modes

## 3.1 Mode A - SSO from OriginBI (No extra login)
Use this when user is already logged into OriginBI.

Flow:
1. User clicks Start Technical Assessment in OriginBI.
2. OriginBI backend generates one-time signed handoff token (short expiry, 60 to 120 sec).
3. Browser redirects to /ta/auth/sso/callback with token.
4. TA backend validates signature, issuer, audience, expiry, and one-time nonce.
5. TA backend upserts user identity and creates TA session.
6. TA sets secure HttpOnly cookie and redirects to /ta/dashboard.

Security checks:
1. Token must include jti (unique id) and exp.
2. jti replay check in Redis.
3. Signature verification through shared key or JWKS.
4. Strict origin and redirect whitelist.

Result:
- Existing OriginBI user enters TA app without typing credentials again.

## 3.2 Mode B - Direct Technical Assessment Login
Use this when user comes directly to TA app URL.

Flow:
1. User opens /ta/login.
2. Login via email/password or OTP.
3. TA backend authenticates and creates session.
4. Redirect to /ta/dashboard.

Recommended:
1. Add optional MFA for admin or proctored high-stakes candidates.
2. Keep session rotation and refresh-token revocation support.

## 4. Exam Experience (Two Exams)

## 4.1 Level 1 MCQ
1. Total questions: 60
2. Section distribution:
- Aptitude: 20
- Communication: 20
- Programming: 20

## 4.2 Level 2 Coding
1. Total coding problems: 2
2. Judge0 CE executes compile and run
3. Hidden test cases used for final scoring

Unlock rule:
1. Level 2 unlocks after Level 1 submitted.
2. Optional pass-threshold gating can be configured.

## 5. Performance and Practice Design

## 5.1 Dashboard
Display:
1. Exam status (not started, in progress, submitted)
2. Latest score and section-wise performance
3. Time analytics and proctor alerts
4. Practice summary

## 5.2 Performance Analytics Page
Display:
1. MCQ section accuracy trend
2. Coding pass ratio per hidden test groups
3. Time spent per section and per question
4. Attempt history comparison

## 5.3 Practice Section (Separate from official exam)
Pages:
1. /ta/practice/mcq
2. /ta/practice/coding

Rules:
1. Practice attempts must not overwrite official attempt score.
2. Practice runs can be unlimited.
3. Store practice and official attempts separately.

## 6. DB Requirements for This Page and Auth Model

## 6.1 Identity and Session
1. ta_user_identity
- maps TA user to OriginBI user and login source

2. ta_sso_handoff_log
- tracks jti, issued_at, consumed_at, status

3. ta_session
- session tokens, device info, revoke status

## 6.2 Attempt Type Separation
In ta_attempt:
1. attempt_type enum: official or practice
2. source enum: sso or local

This allows:
1. Official reports from official attempts only
2. Practice analytics from practice attempts only

## 7. Access Control Matrix
1. Candidate
- access TA app pages and own attempts only

2. Corporate admin (OriginBI)
- access corporate management page and assigned-candidate reports

3. Platform admin (OriginBI)
- full management access across assessments and organizations

## 8. Recommended MVP Build Order
1. Implement SSO callback and TA session creation
2. Implement direct login fallback
3. Build dashboard + exam-center pages
4. Build Level 1 MCQ and Level 2 coding pages
5. Add review-submit and submitted pages
6. Add performance analytics page
7. Add practice hub and practice pages

## 9. Non-Negotiable Security and Evaluation Core
1. Camera and audio permission checks for proctored mode
2. Copy-paste event restrictions and logging
3. Tab and window swap tracking
4. Strict timer on server side
5. Hidden test-case evaluation for coding
6. Time and memory limits for all code runs
7. Kill long-running execution jobs

## 10. Final Recommendation
Use a single TA app with dual-auth entry:
1. SSO path from OriginBI (no extra login)
2. Local TA login path for direct users

Both paths must converge to the same session and attempt model, so candidate experience, scoring, and analytics stay consistent.

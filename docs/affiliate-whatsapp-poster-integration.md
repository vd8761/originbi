# Affiliate WhatsApp Promo Poster Integration

## Overview
When a new affiliate registers via the admin portal, the system automatically sends them **three promotional posters via WhatsApp** (one each for School, College, and Employee audiences). These posters are generated server-side, feature the affiliate's unique QR code, and are sent using the **MSG91 WhatsApp API**. 

The entire process is a fire-and-forget mechanism to ensure it doesn't block the frontend response when adding an affiliate.

---

## Process Flow

1. **Affiliate Created**: Admin completes the affiliate creation process.
2. **Posters Generated**: The backend takes the base poster image, generates a QR code mapping to the affiliate's respective referral link (School, College, or Employee), and composites the QR code directly onto the poster at the "Scan Here" zone.
3. **Upload to R2**: The freshly generated images are immediately uploaded to a public Cloudflare R2 bucket (`affiliate-posters/{referralCode}/{audience}.png`). A presigned URL is generated with a 7-day expiry.
4. **Sent via MSG91**: The public URL, along with the affiliate's phone number and referral code, is dispatched to MSG91 using Audience-specific WhatsApp templates.
5. **WhatsApp Delivered**: Affiliate receives the marketing material directly on their registered WhatsApp number!

---

## Key Files & Logic

| Location/File | Purpose |
|---------------|---------|
| `backend/admin-service/src/affiliates/whatsapp.service.ts` | The core service containing poster generation (`sharp`, `qrcode`), R2 upload, and MSG91 API requests. |
| `backend/admin-service/src/mail/assets/*-poster-without-qr.jpeg` | The base images used for the generation process. |
| `backend/admin-service/src/r2/r2.service.ts` | Extends `uploadPosterBuffer` to upload raw buffers and return public facing signed urls. |
| `backend/admin-service/src/affiliates/affiliates.service.ts` | Triggers the WhatsApp sending asynchronously as part of the `create()` method. |

---

## MSG91 Template Configuration

The integration relies on pre-configured templates in the MSG91 Dashboard under namespace: `371d8e5e_4dfb_4ead_b9c7_55bc570d1027`.

### Templates Mapping:
* **College:** `college_platform`
* **School:** `school_platform`
* **Employee:** `employee_platform`

### Dynamic Variables Used:
* `header_1` (Image type): R2 Public URL of the generated poster.
* `body_1` (Text type): Affiliate's Referral Code.
* `button_1` (URL type): Affiliate's Referral Code (`<{{url text variable}}>`).

---

## Number Formatting Logic
The MSG91 API requires a strictly numerical number containing the Country Code without the leading `+` (e.g., `919876543210`). The `WhatsAppService` leverages a `formatPhoneNumber` method to ensure the DB-stored country code (e.g. `+91`) and mobile number are perfectly joined prior to sending.

---

## Dependencies 
The integration relies on the following npm packages:
* `sharp` - High-performance image compositing.
* `qrcode` - Rendering QR codes as PNG buffers.

## Environment Variables
Ensure the following variable is defined in your `.env.local` or production settings:
```
MSG91_WHATSAPP_AUTH_KEY=<your_auth_key_from_msg91>
```
If this key is missing, the backend will gracefully log a warning and skip the process, preventing crashes.

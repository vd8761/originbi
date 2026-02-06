export const getPaymentSuccessEmailTemplate = (
  name: string,
  paymentId: string,
  amount: string,
  credits: string,
  date: string,
  dashboardUrl: string,
  assets: { footer: string; popper: string; pattern: string; logo: string },
) => {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment Successful - OriginBI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EEEEEE; font-family: Tahoma, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #EEEEEE; width: 100%;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #0F005E; width: 100%; max-width: 600px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
          
          <!-- Header Section with Logo and Confetti -->
          <tr>
            <td style="padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Logo Area -->
                  <td style="padding: 40px 0 0 40px; vertical-align: top;">
                    <img src="${assets.logo}" alt="Origin BI" width="150" style="display: block; border: 0;" />
                  </td>
                  <!-- Confetti Image -->
                  <td align="right" style="padding: 0; vertical-align: top;">
                    <img src="${assets.popper}" alt="Celebration" width="120" style="display: block; border: 0;" />
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px 0 30px 40px;">
                    <h1 style="font-family: Tahoma; font-weight: 700; font-size: 28px; line-height: 100%; letter-spacing: 0%; color: #FFFFFF; margin: 0;">Payment Successful</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main White Content Box -->
          <tr>
            <td style="padding: 0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; border-top: 3px solid #1ED36A;">
                 <!-- Background Pattern Hack -->
                 <tr>
                    <td style="background-image: url('${assets.pattern}'); background-repeat: no-repeat; background-position: top right; background-size: contain;">
                      
                      <!-- Inner Content Padding -->
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 40px;">
                            
                            <!-- Salutation -->
                            <p style="margin: 0 0 15px; font-family: Tahoma; font-weight: 400; font-size: 16px; line-height: 100%; letter-spacing: 0%; color: #333333;">
                              Dear <span style="font-family: Tahoma; font-weight: 700; font-size: 16px; line-height: 100%; letter-spacing: 0%; color: #150089;">${name}</span>,
                            </p>
                            <p style="margin: 0 0 25px; font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">
                              Thank you for your purchase. Your credits have been successfully added to your corporate account.
                            </p>

                            <!-- Transaction Details Header -->
                            <p style="margin: 0 0 15px; font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #1ED36A;">
                              Here are your transaction details:
                            </p>

                            <!-- Details Table -->
                            <table width="100%" cellpadding="8" cellspacing="0" border="0" style="margin-bottom: 25px;">
                              <tr>
                                <td width="35%" style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #707070; vertical-align: top;">Transaction ID</td>
                                <td width="65%" style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">${paymentId}</td>
                              </tr>
                              <tr>
                                <td style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #707070; vertical-align: top;">Amount Paid</td>
                                <td style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">₹${amount}</td>
                              </tr>
                              <tr>
                                <td style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #707070; vertical-align: top;">Credits Added</td>
                                <td style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">${credits}</td>
                              </tr>
                              <tr>
                                <td style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #707070; vertical-align: top;">Date</td>
                                <td style="font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">${date}</td>
                              </tr>
                            </table>

                             <!-- Dashboard Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                              <tr>
                                <td align="left">
                                  <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 30px; background-color: #0F005E; color: #ffffff; text-decoration: none; border-radius: 4px; font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%;">Go to Dashboard</a>
                                </td>
                              </tr>
                            </table>

                            <!-- Support Text -->
                            <p style="margin: 0 0 20px; font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">
                               If you have any questions regarding this transaction, please contact our support team.
                            </p>

                            <!-- Sign Off -->
                            <p style="margin: 0; font-family: Tahoma; font-weight: 400; font-size: 14px; line-height: 100%; letter-spacing: 0%; color: #000000;">
                              Best regards,<br>
                              <strong style="font-family: Tahoma; font-weight: 700; font-size: 14px; color: #000000;">Origin BI Team</strong>
                            </p>

                          </td>
                        </tr>
                      </table>

                    </td>
                 </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Section -->
           <tr>
            <td style="padding: 30px 20px 0 20px; background-color: #0F005E;">
              <p style="margin: 0 0 5px; font-family: Tahoma; font-weight: 400; font-size: 12px; line-height: 100%; letter-spacing: 0%; color: #E9ECEF;">
                © 2024-${currentYear}. Origin BI | All Rights Reserved
              </p>
              <p style="margin: 0 0 20px; font-family: Tahoma; font-weight: 400; font-size: 12px; line-height: 100%; letter-spacing: 0%; color: #1ED36A;">
                <a href="#" style="color: #1ED36A; text-decoration: none;">Privacy Policy</a> <span style="color: #E9ECEF;">|</span> <a href="#" style="color: #1ED36A; text-decoration: none;">Terms & Conditions</a>
              </p>
            </td>
          </tr>
          <!-- Footer Pattern Image -->
          <tr>
            <td style="background-color: #0F005E; padding: 0;">
              <img src="${assets.footer}" alt="" width="600" style="display: block; width: 100%; height: auto; border: 0;" />
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

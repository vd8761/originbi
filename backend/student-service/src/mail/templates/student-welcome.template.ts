export const getStudentWelcomeEmailTemplate = (
  name: string,
  to: string,
  pass: string,
  frontendUrl: string,
  assets: { popper: string; pattern: string; footer: string; logo: string },
  startDateTime?: Date | string,
  assessmentTitle?: string,
  isDebrief?: boolean,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to OriginBI</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body { 
      margin: 0; 
      padding: 0; 
      background-color: #E9ECEF; 
      font-family: Tahoma, Arial, sans-serif;
    }
    .wrapper { width: 100%; table-layout: fixed; background-color: #E9ECEF; }
    .main-table { width: 100%; max-width: 600px; margin: 0 auto; background-color: #E9ECEF; border-spacing: 0; color: #000000; font-family: Tahoma, Arial, sans-serif; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .header-title { font-size: 24px !important; padding: 40px 20px 20px 20px !important; }
      .content-padding { padding: 20px !important; }
    }

    /* Dark Mode Styles */
    @media (prefers-color-scheme: dark) {
      body, .wrapper, .main-table {
        background-color: #121212 !important;
      }
      table[background] {
        background-image: none !important;
        background-color: #1e1e1e !important;
      }
      h1, div, td, p, span, strong {
        color: #ffffff !important;
      }
      td[style*="color: #707070"] {
        color: #aaaaaa !important;
      }
      div[style*="color: #1ED36A"] {
        color: #1ED36A !important;
      }
      a[href*="student"] {
        background-color: #1ED36A !important;
        color: #000000 !important;
      }
    }

    /* Gmail Specific Overrides */
    [data-ogsc] table[background] {
      background-image: none !important;
      background-color: #1e1e1e !important;
    }
    [data-ogsc] h1, [data-ogsc] div, [data-ogsc] td {
      color: #ffffff !important;
    }
  </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #E9ECEF; font-family: Tahoma, Arial, sans-serif;">
  <center class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; width: 100%;">
      
      <!-- HEADER ROW with Confetti Image (Foreground) -->
      <!-- HEADER ROW with Logo and Confetti -->
      <tr>
        <td style="padding: 0;">
           <table width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr>
               <!-- Logo Area -->
               <td style="padding: 40px 0 0 40px; vertical-align: top;">
                  <img src="${assets.logo}" alt="Origin BI" width="150" style="display: block; border: 0;" />
               </td>
               <!-- Confetti Image -->
               <td style="width: 150px; padding: 20px 20px 0 0; vertical-align: top; text-align: right;">
                  <img src="${assets.popper}" alt="Confetti" width="120" style="display: block; border: 0;" />
               </td>
             </tr>
             <tr>
                <td colspan="2" style="padding: 10px 0 20px 40px;">
                    <h1 style="font-family: Tahoma, Arial, sans-serif; font-weight: 700; font-size: 28px; line-height: 100%; letter-spacing: 0%; color: #000000; margin: 0;">Thank you for Registering</h1>
                </td>
             </tr>
           </table>
        </td>
      </tr>
      
      <!-- CONTENT ROW -->
      <tr>
        <td style="padding: 0 20px;">
          <!-- Card Table -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-top: 4px solid #1ED36A; ">
            <tr>
              <td class="content-padding" style="padding: 40px;">
                <!-- Hidden image hack to prevent attachment chip in Gmail -->
                
                
                <div style="font-size: 16px; color: #000000; margin-bottom: 20px; font-weight: 400;">Dear <strong style="font-weight: 700;">${name}</strong>,</div>
                
                <div style="font-size: 14px; line-height: 1.5; color: #000000; margin-bottom: 24px;">
                  Thank you for registering with OriginBI! We're excited to welcome you and inform you that an online assessment ${
                    startDateTime &&
                    new Date(startDateTime).getTime() >
                      Date.now() + 10 * 60 * 1000
                      ? 'has been scheduled for you.'
                      : 'is now available for you.'
                  }
                </div>

                <div style="color: #1ED36A; font-size: 14px; margin-bottom: 16px;">Here are your login details:</div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="font-size: 14px; color: #707070; padding: 5px 0; width: 40%;">Assessment Title</td>
                    <td style="font-size: 14px; color: #000000; padding: 5px 0;">${assessmentTitle || 'Role Match Explorer'}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #707070; padding: 5px 0;">Start Date and Time</td>
                    <td style="font-size: 14px; color: #000000; padding: 5px 0;">${
                      startDateTime
                        ? new Date(startDateTime).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata',
                            hour12: true,
                          })
                        : new Date().toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata',
                            hour12: true,
                          })
                    }</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #707070; padding: 5px 0;">Username</td>
                    <td style="font-size: 14px; color: #000000; padding: 5px 0;">${to}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #707070; padding: 5px 0;">Password</td>
                    <td style="font-size: 14px; color: #000000; padding: 5px 0;">${pass}</td>
                  </tr>
                </table>

                ${
                  isDebrief
                    ? `
                <!-- Debrief Special Container -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, #1ED36A 0%, #150089 100%); border-radius: 12px; overflow: hidden;">
                  <tr>
                    <td style="padding: 2px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="vertical-align: top; width: 40px;">
                                  <div style="background-color: #E8FFF0; border-radius: 50%; width: 32px; height: 32px; text-align: center; line-height: 32px;">
                                    <span style="color: #1ED36A; font-size: 18px;">★</span>
                                  </div>
                                </td>
                                <td style="padding-left: 12px;">
                                  <div style="font-size: 16px; font-weight: 700; color: #150089; margin-bottom: 4px;">Expert Debrief Session Included</div>
                                  <div style="font-size: 13px; line-height: 1.5; color: #4B5563;">
                                    Thank you for choosing the Expert Debrief session. After you complete your assessment, our experts will connect with you to explain your results and help you with the next steps!
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                `
                    : ''
                }


                <div style="font-size: 14px; line-height: 1.5; color: #000000; margin-bottom: 24px;">
                  ${
                    startDateTime &&
                    new Date(startDateTime).getTime() >
                      Date.now() + 10 * 60 * 1000
                      ? 'Please log in at least 15 minutes before the scheduled time to ensure everything works smoothly. The assessment is timed, so manage your time effectively to complete all the questions.'
                      : 'You can start your assessment immediately. The assessment is timed, so manage your time effectively to complete all the questions.'
                  }
                </div>

                <div style="margin-top: 10px; margin-bottom: 30px;">
                  <a href="${frontendUrl}/student" style="display: inline-block; background-color: #150089; color: #ffffff; padding: 14px 28px; border-radius: 4px; text-decoration: none; font-size: 14px;">Start your assessment</a>
                </div>

                <div style="font-size: 14px; line-height: 1.5; color: #000000; margin-bottom: 30px;">
                  If you need any assistance, our team is here to help. Welcome aboard!
                </div>

                <div style="font-size: 14px; color: #000000; margin-bottom: 10px;">
                  Best regards,<br>
                  <strong style="font-weight: 700;">Origin BI Team</strong>
                </div>

              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER ROW -->
      <tr>
        <td style="text-align: left; padding: 30px 20px 0 20px;">
           <div style="font-size: 12px; color: #808080; margin-bottom: 10px;">&copy; 2024-${new Date().getFullYear()}. Origin BI | All Rights Reserved</div>
           <div style="font-size: 12px;">
             <a href="#" style="color: #150089; text-decoration: none;">Privacy Policy</a> <span style="color: #000000;">|</span> <a href="#" style="color: #150089; text-decoration: none;">Terms & Conditions</a>
           </div>
           <!-- Footer Image -->
           <img src="${assets.footer}" alt="" draggable="false" style="width: 100%; height: auto; display: block; margin-top: 20px; border: 0; pointer-events: none; user-select: none;" />
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`;

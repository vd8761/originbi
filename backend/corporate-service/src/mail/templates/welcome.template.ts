export const getWelcomeEmailTemplate = (
    name: string,
    to: string,
    pass: string,
    frontendUrl: string,
    assets: { popper: string; pattern: string; footer: string },
    startDateTime?: Date | string,
    assessmentTitle?: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OriginBI</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      background-color: #E9ECEF; 
      font-family: Tahoma, Verdana, Segoe, sans-serif;
    }
    .wrapper { width: 100%; table-layout: fixed; background-color: #E9ECEF; }
    .main-table { width: 100%; max-width: 600px; margin: 0 auto; background-color: #E9ECEF; border-spacing: 0; color: #000000; font-family: Tahoma, sans-serif; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .header-title { font-size: 24px !important; padding: 40px 20px 20px 20px !important; }
      .content-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #E9ECEF; font-family: Tahoma, Arial, sans-serif;">
  <center class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; width: 100%;">
      
      <!-- HEADER ROW with Confetti Image (Foreground) -->
      <tr>
        <td style="padding: 0;">
           <table width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr>
               <td style="padding: 60px 0 20px 20px; vertical-align: bottom;" class="header-title">
                 <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #000000; text-align: left;">Thank you for Registering</h1>
               </td>
               <td style="width: 150px; padding: 20px 20px 0 0; vertical-align: top; text-align: right;">
                  <img src="${assets.popper}" alt="Confetti" width="120" style="display: block; border: 0;" />
               </td>
             </tr>
           </table>
        </td>
      </tr>
      
      <!-- CONTENT ROW -->
      <tr>
        <td style="padding: 0 20px;">
          <!-- Card Table -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" background="${assets.pattern}" style="background-color: #ffffff; border-top: 4px solid #1ED36A; background-image: url('${assets.pattern}'); background-repeat: no-repeat; background-position: top center; background-size: cover;">
            <tr>
              <td class="content-padding" style="padding: 40px;">
                <!-- Hidden image hack to prevent attachment chip in Gmail -->
                <img src="${assets.pattern}" alt="" width="0" height="0" style="display:none; visibility:hidden;" />
                
                <div style="font-size: 16px; color: #000000; margin-bottom: 20px; font-weight: 400;">Dear <strong style="font-weight: 700;">${name}</strong>,</div>
                
                <div style="font-size: 14px; line-height: 1.5; color: #000000; margin-bottom: 24px;">
                  Thank you for registering with OriginBI! We're excited to welcome you and inform you that an online assessment has been scheduled for you.
                </div>

                <div style="color: #1ED36A; font-size: 14px; margin-bottom: 16px;">Here are your login details:</div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="font-size: 14px; color: #707070; padding: 5px 0; width: 40%;">Assessment Title</td>
                    <td style="font-size: 14px; color: #000000; padding: 5px 0;">${assessmentTitle || 'Role Match Explorer'}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #707070; padding: 5px 0;">Start Date and Time</td>
                    <td style="font-size: 14px; color: #000000; padding: 5px 0;">${startDateTime
        ? new Date(startDateTime).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : new Date().toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

                <div style="font-size: 14px; line-height: 1.5; color: #000000; margin-bottom: 24px;">
                  Please log in at least 15 minutes before the scheduled time to ensure everything works smoothly. The assessment is timed, so manage your time effectively to complete all the questions.
                </div>

                <div style="margin-top: 10px; margin-bottom: 30px;">
                  <a href="${frontendUrl}/students" style="display: inline-block; background-color: #150089; color: #ffffff; padding: 14px 28px; border-radius: 4px; text-decoration: none; font-size: 14px;">Start your assessment</a>
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

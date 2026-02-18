export const getAssessmentCompletionEmailTemplate = (
  name: string,
  reportPassword: string,
  frontendUrl: string,
  assets: {
    logo: string;
    reportCover: string;
  },
  dateStr: string,
  reportTitle: string = 'Self Discovery Report',
  year: string = '2025',
) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${reportTitle}</title>
    <style type="text/css">
        /* Client-specific resets */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #E9ECEF; font-family: 'Tahoma', Arial, sans-serif;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #E9ECEF; padding: 20px 0;">
                
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; background-color: transparent;">
                    
                    <tr>
                        <td align="left" style="padding-bottom: 20px;">
                            <img src="https://mind.originbi.com/Origin-BI-Logo-01.png" alt="Origin BI" width="150" style="display: block; border: 0;" />
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #150089; padding: 40px 30px; border-radius: 4px 4px 0 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="60%" valign="middle" style="color: #ffffff;">
                                        <p style="margin: 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 16px; line-height: 19px; color: #1ED36A;">
                                            ${year}
                                        </p>
                                        <h1 style="margin: 10px 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 28px; line-height: 34px; color: #FFFFFF;">
                                            ${reportTitle.replace(' Report', '')} Report
                                        </h1>
                                        <p style="margin: 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 16px; line-height: 19px; color: #1ED36A;">
                                            ${dateStr}
                                        </p>
                                    </td>
                                    
                                    <td width="40%" valign="middle" align="right">
                                        <img src="https://mind.originbi.com/report-cover.jpg" alt="Report Cover" width="150" style="display: block; border: 0; transform: rotate(-5deg); -webkit-transform: rotate(-5deg);" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td height="4" style="background-color: #1ED36A; line-height: 4px; font-size: 4px;">&nbsp;</td>
                    </tr>

                    <tr>
                        <td bgcolor="#FFFFFF" style="background-color: #FFFFFF; padding: 40px 30px; border-radius: 0 0 4px 4px;">
                            
                            <p style="margin: 0 0 20px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 16px; line-height: 19px; color: #000000;">
                                Dear <strong>${name}</strong>,
                            </p>

                            <p style="margin: 0 0 15px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #000000;">
                                Thank you for completing the Origin BI <strong style="color: #150089;">Student Self-Discovery Assessment</strong>.
                            </p>

                            <p style="margin: 0 0 15px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #000000;">
                                We are excited to share your personalized report summary, which highlights your unique personality and key strengths. Based on these insights, we have created a career roadmap tailored to match your strengths and interests, helping you move closer to your goals.
                            </p>

                            <p style="margin: 0 0 15px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #000000;">
                                This report also gives you an overview of industry trends to help you strengthen your skills and prepare for the future. Origin BI wishes you the very best as you get ready for your future roles.
                            </p>

                            <p style="margin: 0 0 30px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #000000;">
                                You can download your report from the attachment. Your password for the report is <strong>${reportPassword}</strong>.
                            </p>

                            <p style="margin: 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 17px; color: #000000;">
                                Best regards,<br/>
                                <strong>Origin BI</strong>
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="50%" align="left" style="font-family: 'Tahoma', sans-serif; font-size: 12px; line-height: 14px; color: #808080;">
                                        © 2024-${year}. Origin BI | All Rights Reserved
                                    </td>
                                    <td width="50%" align="right" style="font-family: 'Tahoma', sans-serif; font-size: 12px; line-height: 14px; color: #150089;">
                                        <a href="${frontendUrl}/privacy-policy" style="color: #150089; text-decoration: none;">Privacy Policy</a> | <a href="${frontendUrl}/terms-conditions" style="color: #150089; text-decoration: none;">Terms & Conditions</a>
                                    </td>
                                </tr>
                            </table>
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

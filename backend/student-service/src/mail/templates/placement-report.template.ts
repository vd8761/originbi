export const getPlacementReportEmailTemplate = (
  studentCount: number,
  degreeType: string,
  departmentName: string,
  frontendUrl: string,
  year: string = new Date().getFullYear().toString(),
) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Students Handbook – ${degreeType} ${departmentName}</title>
    <style type="text/css">
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
                    
                    <!-- Logo -->
                    <tr>
                        <td align="left" style="padding-bottom: 20px; padding-left: 25px;">
                            <img src="https://mind.originbi.com/Origin-BI-Logo-01.png" alt="Origin BI" width="150" style="display: block; border: 0;" />
                        </td>
                    </tr>

                    <!-- Purple Banner with Handbook Info -->
                    <tr>
                        <td style="background-color: #150089; padding: 40px 30px; border-radius: 4px 4px 0 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="55%" valign="middle" style="color: #ffffff;">
                                        <p style="margin: 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 16px; line-height: 19px; color: #1ED36A;">
                                            ${year}
                                        </p>
                                        <h1 style="margin: 10px 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 28px; line-height: 34px; color: #FFFFFF;">
                                            Students<br/>Handbook
                                        </h1>
                                        <p style="margin: 5px 0 0 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 14px; line-height: 18px; color: #FFFFFF;">
                                            ${degreeType}
                                        </p>
                                        <p style="margin: 2px 0 0 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 14px; line-height: 18px; color: #1ED36A;">
                                            ${departmentName}
                                        </p>
                                    </td>
                                    
                                    <td width="45%" valign="middle" align="right">
                                        <img src="https://mind.originbi.com/students_handbook_cover_mail.jpg" alt="Handbook Cover" width="180" style="display: block; border: 0; transform: rotate(-5deg); -webkit-transform: rotate(-5deg);" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Stats Bar -->
                    <tr>
                        <td style="background-color: #E9ECEF; padding: 25px 30px; text-align: center;">
                            <p style="margin: 0 0 5px 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 22px; line-height: 28px; color: #1ED36A;">
                                ${studentCount} students' reports generated
                            </p>
                            <p style="margin: 0; font-family: 'Tahoma', sans-serif; font-weight: 700; font-size: 22px; line-height: 28px; color: #150089;">
                                80-90% accuracy in role fitment
                            </p>
                        </td>
                    </tr>

                    <!-- Green Divider -->
                    <tr>
                        <td height="4" style="background-color: #1ED36A; line-height: 4px; font-size: 4px;">&nbsp;</td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td bgcolor="#FFFFFF" style="background-color: #FFFFFF; padding: 40px 30px; border-radius: 0 0 4px 4px;">
                            
                            <p style="margin: 0 0 20px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 16px; line-height: 19px; color: #000000;">
                                Dear <strong style="color: #150089;">Placement Officer</strong>,
                            </p>

                            <p style="margin: 0 0 15px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 22px; color: #000000;">
                                The Origin BI <strong style="color: #150089;">Self-Discovery Assessment</strong> for <strong style="color: #150089;">${degreeType} ${departmentName}</strong> students provides a detailed summary of each student's unique strengths and career role fitment insights. This handbook is a valuable resource to support your guidance work, offering personalized career roadmap suggestions and an overview of current industry trends
                            </p>

                            <p style="margin: 0 0 15px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 22px; color: #000000;">
                                We encourage you to review and keep this handbook for future reference as you help students prepare for the right roles and opportunities.
                            </p>

                            <p style="margin: 0 0 30px 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 22px; color: #000000;">
                                Thank you for collaborating with Origin BI and believing in our approach. Let's work together to help students shape a brighter future.
                            </p>

                            <p style="margin: 0; font-family: 'Tahoma', sans-serif; font-weight: 400; font-size: 14px; line-height: 17px; color: #000000;">
                                Best regards,<br/>
                                <strong>Origin BI</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 0; font-family: 'Tahoma', sans-serif; font-size: 12px; line-height: 22px;">
                            <span style="color: #808080;">\u00A9 ${year}. Origin BI | All Rights Reserved</span>
                            <br/>
                            <a href="${frontendUrl}/privacy-policy" style="color: #150089; text-decoration: none;">Privacy Policy</a> 
                            <span style="color: #150089;">|</span> 
                            <a href="${frontendUrl}/terms-conditions" style="color: #150089; text-decoration: none;">Terms & Conditions</a>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

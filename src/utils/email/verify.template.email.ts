export const verifyEmail = ({ otp, title }: { otp: number; title: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
    </head>
    <body style="background-color:#f6f9fc; margin:0; font-family:Arial,sans-serif; line-height:1.6;">
      <div style="max-width:600px; margin:auto; background-color:#ffffff; border:1px solid #ddd; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:20px; background-color:#f3f3f3; border-bottom:1px solid #ddd;">
          <img width="120" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png" alt="Logo" />
        </div>

        <!-- Body -->
        <div style="padding:30px 20px; text-align:center;">
          <img width="60" height="60" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png" alt="Mail Icon" />
          <h1 style="color:#630e2b; margin-top:20px;">${title}</h1>
          <p style="font-size:16px; color:#333;">Please use the OTP below to verify your email address:</p>
          
          <h2 style="background:#f6f6f6; display:inline-block; padding:12px 24px; border-radius:6px; font-weight:bold; letter-spacing:3px; margin:20px 0; font-size:22px; color:#222;">
            ${otp}
          </h2>
        </div>

        <!-- Footer -->
        <div style="background-color:#f9f9f9; text-align:center; padding:20px; border-top:1px solid #ddd;">
          <h3 style="color:#630e2b; margin-bottom:10px;">Stay in touch</h3>
          <div>
            <a href="${process.env.facebookLink || "#"}" style="margin:0 8px;">
              <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="36" />
            </a>
            <a href="${process.env.instagram || "#"}" style="margin:0 8px;">
              <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="36" />
            </a>
            <a href="${process.env.twitterLink || "#"}" style="margin:0 8px;">
              <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="36" />
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

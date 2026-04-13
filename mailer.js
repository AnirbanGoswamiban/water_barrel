const ejs = require("ejs");
const path = require("path");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, data) {
  try {
    const templatePath = path.join(process.cwd(), "views", "success.ejs");

    const html = await ejs.renderFile(templatePath, data);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: to,
      subject: "Payment Successful",
      html: html
    });

    console.log("EMAIL SENT");
  } catch (err) {
    console.error("EMAIL ERROR:", err);
  }
}

module.exports = { sendMail };
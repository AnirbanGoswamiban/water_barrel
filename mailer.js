const ejs = require("ejs"); 
const path = require("path");

const {Resend} = require('resend')

const resend = new Resend(process.env.RESENDAPIKEY);

export async function sendMail(to, data) {
  const templatePath = path.join(process.cwd(), "views", "success.ejs");

  const html = await ejs.renderFile(templatePath, data);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: to,
    subject: "Payment Successful",
    html: html
  });
}
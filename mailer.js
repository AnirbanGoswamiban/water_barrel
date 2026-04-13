const { Resend } = require("resend");
const ejs = require("ejs");
const path = require("path");
// require('dotenv').config()

const resend = new Resend(process.env.RESENDAPIKEY);

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

// sendMail("anirbangoswami323@gmail.com",{name:"",amount:"",payment_id:"",})

module.exports = { sendMail };
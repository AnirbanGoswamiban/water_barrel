const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

async function sendMail(to, data) {
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.MAIL,
    pass: process.env.MAIL_PASS,
  },
});

  const templatePath = path.join(__dirname, "views", "success.ejs");

  const html = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: process.env.MAIL,
    to: to,
    subject: "Payment Successful",
    html: html
  };

  await transporter.sendMail(mailOptions);
}
module.exports = {sendMail};
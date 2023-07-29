const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `testsender ${process.env.EMAIL_FROM}`;
    };

    newTransport() {
        if (process.env.NODE_ENV === "production") {
            //Sendgrid
            return 1;
        } else {
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }
    };

    async send(template, subject) {
        // 1) render HTML email based on pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) define email options
        const emailOption = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html)
        };

        // 3) create transport and send the email
        await this.newTransport().sendMail(emailOption);
    };

    async sendWelcome() {
        await this.send("welcome", "Welcome to the natour family");
    };

    async sendPasswordReset() {
        await this.send("passwordReset", "Your password reset token (valid for only 10min)");
    }
}
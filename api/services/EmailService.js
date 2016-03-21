// EmailService.js - in api/services
exports.sendInviteEmail = function(options) {

    var emailMessage = "Dear Customer ,\n\nYou're in the Beta! Click the following link to verify your account \n\n\n http://localhost:1337/users/emailVerification/"+options.hashId;

    var opts = {
        "subject": "Verification email",
        "from": "uzairanwar.test@gmail.com",
        "to": options.email,
        "text": emailMessage
    };

    // myEmailSendingLibrary.send(opts);
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'uzairanwar.test@gmail.com',
            pass: '987googleaccount'
        }
    });
    transporter.sendMail(opts, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
};
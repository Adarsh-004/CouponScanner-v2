<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Ensure PHPMailer is installed (composer require phpmailer/phpmailer)

function sendOrderEmail($to, $subject, $messageHTML) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'your_email@gmail.com'; // your gmail
        $mail->Password = 'ibrs apkg shnr txwj';    // use an App Password (Google Account → Security)
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        $mail->setFrom('your_email@gmail.com', 'Busy Canvas');
        $mail->addAddress($to);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $messageHTML;

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}
?>

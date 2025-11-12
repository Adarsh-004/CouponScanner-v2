<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

include "db.php";
include "send_email.php";

$data = json_decode(file_get_contents("php://input"), true);

$name = $conn->real_escape_string($data['name']);
$email = $conn->real_escape_string($data['email']);
$phone = $conn->real_escape_string($data['phone']);
$artworkType = $conn->real_escape_string($data['artworkType']);
$frameSize = $conn->real_escape_string($data['frameSize']);
$artStyle = $conn->real_escape_string($data['artStyle']);
$colorScheme = $conn->real_escape_string($data['colorScheme']);
$urgency = $conn->real_escape_string($data['urgency']);
$specialInstructions = $conn->real_escape_string($data['specialInstructions']);
$budget = $conn->real_escape_string($data['budget']);

$sql = "INSERT INTO orders (name, email, phone, artworkType, frameSize, artStyle, colorScheme, urgency, specialInstructions, budget)
        VALUES ('$name', '$email', '$phone', '$artworkType', '$frameSize', '$artStyle', '$colorScheme', '$urgency', '$specialInstructions', '$budget')";

if ($conn->query($sql)) {
    // Email content
    $subject = "🎨 Order Confirmation - Busy Canvas";
    $message = "
        <h2>Hi $name,</h2>
        <p>Thank you for ordering your custom artwork with <strong>Busy Canvas</strong>!</p>
        <h3>Order Summary:</h3>
        <ul>
            <li><strong>Artwork Type:</strong> $artworkType</li>
            <li><strong>Canvas Size:</strong> $frameSize</li>
            <li><strong>Style:</strong> $artStyle</li>
            <li><strong>Color Scheme:</strong> $colorScheme</li>
            <li><strong>Urgency:</strong> $urgency</li>
            <li><strong>Budget:</strong> $budget</li>
        </ul>
        <p><strong>Special Instructions:</strong> $specialInstructions</p>
        <p>We’ll contact you soon at <b>$phone</b> or <b>$email</b> to finalize details.</p>
        <br>
        <p>Best Regards,<br><strong>The Busy Canvas Team</strong></p>
    ";

    if (sendOrderEmail($email, $subject, $message)) {
        echo json_encode(["success" => true, "message" => "Order placed successfully! Confirmation email sent."]);
    } else {
        echo json_encode(["success" => true, "message" => "Order saved, but email sending failed."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Database Error: " . $conn->error]);
}
?>

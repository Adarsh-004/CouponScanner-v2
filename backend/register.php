<?php
header("Content-Type: application/json");
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$fullname = $conn->real_escape_string($data['fullname']);
$username = $conn->real_escape_string($data['username']);
$email = $conn->real_escape_string($data['email']);
$password = password_hash($data['password'], PASSWORD_BCRYPT);

// Check for duplicate username or email
$check = $conn->query("SELECT * FROM users WHERE email='$email' OR username='$username'");
if ($check->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Username or Email already exists"]);
    exit;
}

// Insert user
$sql = "INSERT INTO users (fullname, username, email, password) VALUES ('$fullname', '$username', '$email', '$password')";
if ($conn->query($sql)) {
    echo json_encode(["success" => true, "message" => "Account created successfully! You can now log in."]);
} else {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
}
?>

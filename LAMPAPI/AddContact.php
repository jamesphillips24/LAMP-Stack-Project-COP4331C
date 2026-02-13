<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set("display_errors", 1);
error_reporting(E_ALL);

$inData = getRequestInfo();

$firstName = trim($inData["firstName"] ?? "");
$lastName  = trim($inData["lastName"] ?? "");
$phone     = trim($inData["phone"] ?? "");
$email     = trim($inData["email"] ?? "");
$userId    = intval($inData["userId"] ?? 0);

if ($userId <= 0) {
    returnWithError("Missing userId");
}

if ($firstName === "" && $lastName === "") {
    returnWithError("Missing name");
}

$conn = new mysqli("localhost", "contactuser", "Group21cop4331", "contactmanager");
if ($conn->connect_error) {
    returnWithError($conn->connect_error);
}

$stmt = $conn->prepare(
    "INSERT INTO Contacts (FirstName, LastName, Phone, Email, UserID)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param("ssssi", $firstName, $lastName, $phone, $email, $userId);

if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();
    returnWithError("Insert failed");
}

$id = $stmt->insert_id;

$stmt->close();
$conn->close();

sendResultInfoAsJson('{"id":' . $id . ',"error":""}');

function getRequestInfo()
{
    return json_decode(file_get_contents("php://input"), true);
}

function sendResultInfoAsJson($obj)
{
    echo $obj;
}

function returnWithError($err)
{
    sendResultInfoAsJson('{"id":0,"error":"' . $err . '"}');
    exit();
}
?>

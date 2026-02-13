<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set("display_errors", 1);
error_reporting(E_ALL);

$inData = getRequestInfo();

$id     = intval($inData["id"] ?? 0);
$userId = intval($inData["userId"] ?? 0);

$firstName = trim($inData["firstName"] ?? "");
$lastName  = trim($inData["lastName"] ?? "");
$phone     = trim($inData["phone"] ?? "");
$email     = trim($inData["email"] ?? "");

if ($userId <= 0) {
    returnWithError("Missing userId");
}

if ($id <= 0) {
    returnWithError("Missing id");
}

$conn = new mysqli("localhost", "contactuser", "Group21cop4331", "contactmanager");
if ($conn->connect_error) {
    returnWithError($conn->connect_error);
}

$stmt = $conn->prepare(
    "UPDATE Contacts
     SET FirstName = ?, LastName = ?, Phone = ?, Email = ?
     WHERE ID = ? AND UserID = ?"
);
$stmt->bind_param("ssssii", $firstName, $lastName, $phone, $email, $id, $userId);
$stmt->execute();

$ok = ($stmt->affected_rows > 0);

$stmt->close();
$conn->close();

sendResultInfoAsJson('{"success":' . ($ok ? "true" : "false") . ',"error":""}');

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
    sendResultInfoAsJson('{"success":false,"error":"' . $err . '"}');
    exit();
}
?>

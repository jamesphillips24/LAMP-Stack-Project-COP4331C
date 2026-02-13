<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set("display_errors", 1);
error_reporting(E_ALL);

$inData = getRequestInfo();

$search = trim($inData["search"] ?? "");
$userId = intval($inData["userId"] ?? 0);

if ($userId <= 0) {
    returnWithError("Missing userId");
}

$conn = new mysqli("localhost", "contactuser", "Group21cop4331", "contactmanager");
if ($conn->connect_error) {
    returnWithError($conn->connect_error);
}

$like = "%" . $search . "%";

$stmt = $conn->prepare(
    "SELECT ID, FirstName, LastName, Phone, Email
     FROM Contacts
     WHERE UserID = ?
       AND (FirstName LIKE ? OR LastName LIKE ? OR Phone LIKE ? OR Email LIKE ?)
     ORDER BY LastName, FirstName"
);
$stmt->bind_param("issss", $userId, $like, $like, $like, $like);
$stmt->execute();

$result = $stmt->get_result();

$searchResults = "";
$searchCount   = 0;

while ($row = $result->fetch_assoc()) {
    if ($searchCount > 0) {
        $searchResults .= ",";
    }

    $searchCount++;

    $searchResults .=
        '{"id":' . $row["ID"] .
        ',"firstName":"' . $row["FirstName"] .
        '","lastName":"' . $row["LastName"] .
        '","phone":"' . $row["Phone"] .
        '","email":"' . $row["Email"] . '"}';
}

$stmt->close();
$conn->close();

if ($searchCount === 0) {
    sendResultInfoAsJson('{"results":[],"error":"No Records Found"}');
    exit();
}

sendResultInfoAsJson('{"results":[' . $searchResults . '],"error":""}');

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
    sendResultInfoAsJson('{"results":[],"error":"' . $err . '"}');
    exit();
}
?>
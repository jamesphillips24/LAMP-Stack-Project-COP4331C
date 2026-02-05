<?php
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
        $inData = getRequestInfo();

        $id = -1;
        $conn = new mysqli("localhost", "contactuser", "Group21cop4331", "contactmanager");
        if( $conn->connect_error )
        {
                returnWithError( $conn->connect_error );
        }
        else
        {
                $stmt = $conn->prepare("SELECT ID FROM Users WHERE TRIM(Login)=?");
                $stmt->bind_param("s", $inData["login"]);
                $stmt->execute();
                $result = $stmt->get_result();

                if( $row = $result->fetch_assoc() )
                {
                        returnWithError("Username already exists");
                }
                else
                {
                    $stmt = $conn->prepare("INSERT INTO Users (FirstName, LastName, Login, Password) VALUES (?, ?, ?, ?)");
                    $stmt->bind_param("ssss", $inData["fname"], $inData["lname"], $inData["login"], $inData["password"]);
                    $stmt->execute();

                    $stmt = $conn->prepare("SELECT ID, FirstName, LastName FROM Users WHERE TRIM(Login)=?");
                    $stmt->bind_param("s", $inData["login"]);
                    $stmt->execute();
                    $result = $stmt->get_result();

                    if( $row = $result->fetch_assoc() )
                    {
                        returnWithInfo( $row['FirstName'], $row['LastName'], $row['ID'] );
                    }
                }

                $stmt->close();
                $conn->close();
        }

        function getRequestInfo()
        {
                return json_decode(file_get_contents('php://input'), true);
        }

        function sendResultInfoAsJson( $obj )
        {
                header('Content-type: application/json');
                echo $obj;
        }

        function returnWithError( $err )
        {
                $retValue = '{"id":-1,"firstName":"","lastName":"","error":"' . $err . '"}';
                sendResultInfoAsJson( $retValue );
        }

        function returnWithInfo( $firstName, $lastName, $id  )
        {
                $retValue = '{"id":' . $id . ',"firstName":"' . $firstName . '","lastName":"' . $lastName . '","error":""}';
                sendResultInfoAsJson( $retValue );
        }

?>
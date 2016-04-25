<?php

if(!isset($_POST['search'])){
	header("Location:index.php");
}
$search_sql="";
$search_query=mysql_query($search_sql);
$search_rs=mysql_fetch_assoc($search_query); 
 ?>

<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>Search Result</title>
</head>

<body>
</body>
</html>
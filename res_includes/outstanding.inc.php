<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>Outstanding Items</title>

<script type="text/javascript" src="build/tsw/js/jquery.js"></script>
<script type="text/javascript" src="build/tsw/js/bootstrap.js"></script>
<link rel="stylesheet" type="text/css" href="build/tsw/css/bootstrap.min.css">
<link rel="stylesheet" type="text/css" href="build/tsw/css/style.css" />
<link rel="stylesheet" type="text/css" href="build/tsw/css/styles.css" />

</head>

<body>

<div class="container">
	<?php include("navbar.inc.php") ?>

<div class="row" style="margin-top:2em;">
  <h1>Outstanding Items</h1>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>Item</th>
                <th>Date Updated</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Link</th>
                <th>Follow Up</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Typography</td>
                <td>August 6</td>
                <td>Ongoing</td>
                <td>Move the paragraph to float on top of the table</td>
                <td><a class="btn btn-md btn-success" href="../residential.php#res_typography">Typography</a></td>
            	<td>Lisa</td>
            </tr>
            <tr>
            	<td>Tabs</td>
                <td>August 6</td>
                <td>Ongoing</td>
                <td>Stacking problem, tabs should lay out on one line</td>
                <td><a class="btn btn-md btn-success" href="../residential.php#res_tabs">Tabs</a></td>
                <td>Robert</td>
            </tr>
            <tr>
            	<td>Add Lorem Ipseum under each component</td>
                <td>August 6</td>
                <td>Ongoing</td>
                <td></td>
                <td></td>
                <td>Lisa</td>
            </tr>
            <tr>
            	<td>Responsive menu on mobile</td>
                <td></td>
                <td>Ongoing</td>
                <td>August 6</td>
                <td></td>
                <td>Lisa</td>
            </tr>
            <tr>
            	<td>Add Cox logo on top left corner</td>
                <td>August 6</td>
                <td>Ongoing</td>
                <td></td>
                <td></td>
                <td>Lisa</td>
            </tr>
            <tr>
            	<td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            <tr>
            	<td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        </tbody>
        
    </table>
	</div><!--row-->
</div><!--container-->
<script>
$('table').find('td').filter(':contains("Ongoing")').css({
   'background-color' : '#33CC66',
   'font-weight' : 'bold',
   'color' : 'white'
});
</script>
</body>
</html>


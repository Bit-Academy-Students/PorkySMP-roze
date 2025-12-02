<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PorkySMP JSON</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        pre { background: #fff; padding: 15px; border-radius: 8px; overflow-x: auto; }
        h1 { margin-bottom: 20px; }
    </style>
</head>
<body>

<h1>PorkySMP Data in JSON</h1>

<pre id="json-output">
<?php 
// PHP zet direct alles als JSON in de pagina
echo json_encode($data, JSON_PRETTY_PRINT); 
?>
</pre>

</body>
</html>

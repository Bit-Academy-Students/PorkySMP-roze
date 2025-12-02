<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PorkySMP JSON</title>
    <style>
        body { font-family: monospace; background: #f5f5f5; padding: 20px; }
        pre { background: #fff; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>

<h1>PorkySMP Data in JSON</h1>

<pre id="json-output">
Loading...
</pre>

<script>
    // Zet de PHP data om naar JSON en toon het op de pagina
    const data = @json($data, JSON_PRETTY_PRINT);
    document.getElementById('json-output').textContent = JSON.stringify(data, null, 2);
</script>

</body>
</html>

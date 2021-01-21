import { editor } from "monaco-editor";
import { emmetHTML } from "emmet-monaco-es";
import { parseHTML } from "./parser";

emmetHTML(monaco);

var exampleInput = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Document</title>
</head>
<body class="page">
	<header class="header"></header>
	<main class="main">
		Hello, I'm using HTMLtoJSON!
	</main>
	<footer class="footer"></footer>
</body>
</html>
`.trim(),
  exampleOutput = "";

var inputEditor = editor.create(document.getElementById("html"), {
  value: exampleInput,
  language: "html",
  theme: "vs-dark",
  automaticLayout: true,
});

var outputEditor = editor.create(document.getElementById("json"), {
  value: exampleOutput,
  language: "json",
  theme: "vs-dark",
  automaticLayout: true,
  readOnly: true,
});

var run = document.getElementById("run");

run.addEventListener("click", function (e) {
  exampleInput = inputEditor.getValue();
  exampleOutput = JSON.stringify(parseHTML(exampleInput), undefined, 2);
  outputEditor.setValue(exampleOutput);
});

run.click();

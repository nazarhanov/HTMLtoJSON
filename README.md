# HTMLtoJSON

Fast & Tiny HTML parser (No RegExp). Module parser.js fully writed in ES5 syntax.
[Try it on git.io/htmltojson](https://git.io/htmltojson)

## Example

Input:

```
<!DOCTYPE html>
<html lang="en">
  ...

  <body class="page">
    <header class="header">header</header>
    <main class="main">hello</main>
    <input type="text" />
    <footer class="footer">footer</footer>
  </body>

  <script>
    // html inside script works (processes) too ..
    // parser excepts js comments and strings
    var popup = `<div class="popup"></div>`;

    ...
```

Output:

```
{
  type: "root",
  children: {
    type: "node",
    tagName: "!DOCTYPE",
    attrs: {
      html: true,
    },
    children: [
      {
        type: "node",
        tagName: "html",
        attrs: {
          lang: "en",
        },
        children: [
          ...

          {
            type: "node",
            tagName: "body",
            attrs: {
              class: "page",
            },
            children: [
              {
                type: "node",
                tagName: "header",
                attrs: {
                  class: "header",
                },
                children: [
                  {
                    type: "text",
                    text: "header",
                  },
                ],
              },
              {
                type: "node",
                tagName: "main",
                attrs: {
                  class: "main",
                },
                children: [
                  {
                    type: "text",
                    text: "hello",
                  },
                ],
              },
              {
                type: "node",
                tagName: "footer",
                attrs: {
                  class: "footer",
                },
                children: [
                  {
                    type: "text",
                    text: "footer",
                  },
                ],
              },
            ],
          },
          {
            type: "node",
            tagName: "script",
            children: [
              {
                type: "text",
                text:
                  '\r\n    // html inside script works (processes) too ..\r\n    // parser excepts js comments and strings\r\n    var popup = `<div class="popup"></div>`;\r\n\r\n    document.body.innerHTML += popup;\r\n  ',
          ...
```

const //
  fs = require("fs/promises"),
  parser = require("./parser");

(async () => {
  const html = await fs.readFile(`./index.html`, { encoding: "utf-8" });

  //   console.time("Execution");
  const output = parser(html);
  //   console.timeEnd("Execution");

  const result = JSON.stringify(output, undefined, 2);

  fs.writeFile("./output.json", result);
})();

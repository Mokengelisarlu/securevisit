const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const file = path.join("mobile-app","app","(kiosk)","index.tsx");
const text = fs.readFileSync(file, "utf8");
const result = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log(result.parseDiagnostics.map(d => ({code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, "\n"), line: result.getLineAndCharacterOfPosition(d.start).line+1, char: result.getLineAndCharacterOfPosition(d.start).character+1})));

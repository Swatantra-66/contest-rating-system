interface MetaParam {
  name: string;
  type: string;
}

interface MetaData {
  name: string;
  params: MetaParam[];
  return: { type: string };
}

type InputKind = "int" | "bool" | "string" | "array_int" | "matrix_int" | "json";

function parseMetaData(raw: string): MetaData | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isMatrixType(t: string): boolean {
  const lower = t.toLowerCase();
  return (
    lower.includes("[][]") ||
    lower.startsWith("list[list") ||
    lower.includes("matrix")
  );
}

function isArrayType(t: string): boolean {
  const lower = t.toLowerCase();
  return lower.includes("[]") || lower.startsWith("list[") || lower.startsWith("array");
}

function inputKindFromLcType(t: string): InputKind {
  const lower = t.toLowerCase();
  if (isMatrixType(lower)) return "matrix_int";
  if (isArrayType(lower)) return "array_int";
  if (lower === "integer" || lower === "int") return "int";
  if (lower === "boolean" || lower === "bool") return "bool";
  if (lower === "string" || lower === "str" || lower.startsWith("character")) return "string";
  return "json";
}

function parseValuePython(varName: string, lcType: string): string {
  const kind = inputKindFromLcType(lcType);
  if (kind === "int") return `${varName} = int(input())`;
  if (kind === "bool") return `${varName} = input().strip().lower() == "true"`;
  if (kind === "string") return `${varName} = input().strip().strip('"')`;
  return `${varName} = json.loads(input())`;
}

function formatReturnPython(retType: string, resultVar: string): string {
  if (inputKindFromLcType(retType) === "bool") return `print(str(${resultVar}).lower())`;
  return `print(json.dumps(${resultVar}) if isinstance(${resultVar}, (list, dict)) else ${resultVar})`;
}

export function generatePythonWrapper(
  userCode: string,
  metaRaw: string,
  _examples: string,
): string {
  void _examples;
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const params = meta.params || [];
  const parseLines = params.map((p) => parseValuePython(p.name, p.type)).join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = formatReturnPython(meta.return?.type || "any", "result");

  return `import json
${userCode}

if __name__ == "__main__":
    sol = Solution()
${parseLines
  .split("\n")
  .filter(Boolean)
  .map((l) => `    ${l}`)
  .join("\n")}
    result = sol.${meta.name}(${callArgs})
    ${returnLine}
`;
}

function parseValueJS(varName: string, lcType: string, idxExpr: string): string {
  const kind = inputKindFromLcType(lcType);
  if (kind === "int") return `const ${varName} = parseInt(${idxExpr}, 10);`;
  if (kind === "bool") return `const ${varName} = ${idxExpr}.trim().toLowerCase() === "true";`;
  if (kind === "string") return `const ${varName} = ${idxExpr}.trim().replace(/^"(.*)"$/, "$1");`;
  return `const ${varName} = JSON.parse(${idxExpr});`;
}

function formatReturnJS(retType: string, resultVar: string): string {
  if (inputKindFromLcType(retType) === "bool") return `console.log(${resultVar} ? "true" : "false");`;
  if (isArrayType(retType) || isMatrixType(retType)) return `console.log(JSON.stringify(${resultVar}));`;
  return `console.log(${resultVar});`;
}

export function generateJSWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const params = meta.params || [];
  const parseLines = params
    .map((p, i) => `  ${parseValueJS(p.name, p.type, `lines[${i}] ?? ""`)}`)
    .join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = `  ${formatReturnJS(meta.return?.type || "any", "result")}`;

  return `${userCode}

const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw.length ? raw.split("\\n") : [];
${parseLines}
const sol = new Solution();
const result = sol.${meta.name}(${callArgs});
${returnLine}
`;
}

function parseValueCpp(varName: string, lcType: string): string[] {
  const kind = inputKindFromLcType(lcType);
  if (kind === "int") return [`    int ${varName}; cin >> ${varName};`];
  if (kind === "bool")
    return [
      `    string __${varName}; cin >> __${varName};`,
      `    bool ${varName} = (__${varName} == "true");`,
    ];
  if (kind === "string") return [`    string ${varName}; cin >> ${varName};`];
  if (kind === "matrix_int")
    return [
      `    string __${varName}; getline(cin >> ws, __${varName});`,
      `    vector<vector<int>> ${varName} = parseIntMatrix(__${varName});`,
    ];
  return [
    `    string __${varName}; getline(cin >> ws, __${varName});`,
    `    vector<int> ${varName} = parseIntArray(__${varName});`,
  ];
}

function formatReturnCpp(retType: string): string {
  const kind = inputKindFromLcType(retType);
  if (kind === "bool") return `cout << (result ? "true" : "false") << endl;`;
  if (kind === "matrix_int") return `cout << toJsonMatrix(result) << endl;`;
  if (kind === "array_int") return `cout << toJsonArray(result) << endl;`;
  return `cout << result << endl;`;
}

export function generateCppWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const params = meta.params || [];
  const parseLines = params.flatMap((p) => parseValueCpp(p.name, p.type)).join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = formatReturnCpp(meta.return?.type || "any");

  return `#include <bits/stdc++.h>
using namespace std;

vector<int> parseIntArray(string s) {
    vector<int> out;
    s.erase(remove_if(s.begin(), s.end(), ::isspace), s.end());
    if (s.size() < 2) return out;
    s = s.substr(1, s.size() - 2);
    if (s.empty()) return out;
    string token;
    stringstream ss(s);
    while (getline(ss, token, ',')) out.push_back(stoi(token));
    return out;
}

vector<vector<int>> parseIntMatrix(string s) {
    vector<vector<int>> out;
    int depth = 0, start = -1;
    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] == '[') {
            if (depth == 1) start = i;
            depth++;
        } else if (s[i] == ']') {
            depth--;
            if (depth == 1 && start != -1) out.push_back(parseIntArray(s.substr(start, i - start + 1)));
        }
    }
    return out;
}

string toJsonArray(const vector<int>& v) {
    stringstream ss;
    ss << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i) ss << ",";
        ss << v[i];
    }
    ss << "]";
    return ss.str();
}

string toJsonMatrix(const vector<vector<int>>& v) {
    stringstream ss;
    ss << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i) ss << ",";
        ss << toJsonArray(v[i]);
    }
    ss << "]";
    return ss.str();
}

${userCode}

int main() {
${parseLines}
    Solution sol;
    auto result = sol.${meta.name}(${callArgs});
    ${returnLine}
    return 0;
}
`;
}

function formatReturnJava(retType: string): string {
  const kind = inputKindFromLcType(retType);
  if (kind === "bool") return `System.out.println(result ? "true" : "false");`;
  if (kind === "matrix_int") return `System.out.println(toJson(result));`;
  if (kind === "array_int") return `System.out.println(toJson(result));`;
  return `System.out.println(result);`;
}

export function generateJavaWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const params = meta.params || [];
  const parseLines = params
    .map((p, i) => {
      const kind = inputKindFromLcType(p.type);
      if (kind === "int") return `        int ${p.name} = Integer.parseInt((lines.size() > ${i} ? lines.get(${i}) : "0").trim());`;
      if (kind === "bool")
        return `        boolean ${p.name} = (lines.size() > ${i} ? lines.get(${i}) : "false").trim().equalsIgnoreCase("true");`;
      if (kind === "string")
        return `        String ${p.name} = stripQuotes(lines.size() > ${i} ? lines.get(${i}) : "");`;
      if (kind === "matrix_int")
        return `        int[][] ${p.name} = parseIntMatrix(lines.size() > ${i} ? lines.get(${i}) : "[]");`;
      return `        int[] ${p.name} = parseIntArray(lines.size() > ${i} ? lines.get(${i}) : "[]");`;
    })
    .join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = formatReturnJava(meta.return?.type || "any");

  return `import java.io.*;
import java.util.*;

${userCode}

class Main {
    static String stripQuotes(String s) {
        s = s.trim();
        if (s.length() >= 2 && s.startsWith("\\"") && s.endsWith("\\"")) return s.substring(1, s.length() - 1);
        return s;
    }

    static int[] parseIntArray(String s) {
        s = s.replaceAll("\\\\s+", "").trim();
        if (s.length() < 2) return new int[0];
        s = s.substring(1, s.length() - 1);
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i]);
        return arr;
    }

    static int[][] parseIntMatrix(String s) {
        List<int[]> rows = new ArrayList<>();
        int depth = 0, start = -1;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '[') {
                if (depth == 1) start = i;
                depth++;
            } else if (ch == ']') {
                depth--;
                if (depth == 1 && start >= 0) rows.add(parseIntArray(s.substring(start, i + 1)));
            }
        }
        return rows.toArray(new int[rows.size()][]);
    }

    static String toJson(int[] arr) {
        return Arrays.toString(arr).replace(" ", "");
    }

    static String toJson(int[][] matrix) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < matrix.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(toJson(matrix[i]));
        }
        sb.append("]");
        return sb.toString();
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) lines.add(line);
${parseLines}
        Solution sol = new Solution();
        var result = sol.${meta.name}(${callArgs});
        ${returnLine}
    }
}
`;
}

function formatReturnGo(retType: string): string {
  const kind = inputKindFromLcType(retType);
  if (kind === "bool") return `if result { fmt.Println("true") } else { fmt.Println("false") }`;
  if (kind === "array_int" || kind === "matrix_int") return `b, _ := json.Marshal(result); fmt.Println(string(b))`;
  return `fmt.Println(result)`;
}

export function generateGoWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const params = meta.params || [];
  const parseLines = params
    .map((p, i) => {
      const kind = inputKindFromLcType(p.type);
      if (kind === "int")
        return `    ${p.name}, _ := strconv.Atoi(strings.TrimSpace(getLine(lines, ${i}, "0")))`;
      if (kind === "bool")
        return `    ${p.name} := strings.EqualFold(strings.TrimSpace(getLine(lines, ${i}, "false")), "true")`;
      if (kind === "string")
        return `    ${p.name} := strings.Trim(strings.TrimSpace(getLine(lines, ${i}, "")), "\\\"")`;
      if (kind === "matrix_int")
        return `    var ${p.name} [][]int\n    _ = json.Unmarshal([]byte(getLine(lines, ${i}, "[]")), &${p.name})`;
      return `    var ${p.name} []int\n    _ = json.Unmarshal([]byte(getLine(lines, ${i}, "[]")), &${p.name})`;
    })
    .join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = formatReturnGo(meta.return?.type || "any");

  return `package main

import (
    "bufio"
    "encoding/json"
    "fmt"
    "os"
    "strconv"
    "strings"
)

${userCode}

func getLine(lines []string, idx int, fallback string) string {
    if idx >= 0 && idx < len(lines) {
        return lines[idx]
    }
    return fallback
}

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    lines := []string{}
    for scanner.Scan() {
        lines = append(lines, scanner.Text())
    }
${parseLines}
    result := ${meta.name}(${callArgs})
    ${returnLine}
}
`;
}

function formatReturnRust(retType: string): string {
  const kind = inputKindFromLcType(retType);
  if (kind === "bool") return `println!("{}", if result { "true" } else { "false" });`;
  if (kind === "matrix_int") return `println!("{}", to_matrix_json(&result));`;
  if (kind === "array_int") return `println!("{}", to_vec_json(&result));`;
  return `println!("{}", result);`;
}

export function generateRustWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const params = meta.params || [];
  const parseLines = params
    .map((p, i) => {
      const kind = inputKindFromLcType(p.type);
      if (kind === "int") return `    let ${p.name}: i32 = get_line(&lines, ${i}, "0").trim().parse().unwrap_or(0);`;
      if (kind === "bool")
        return `    let ${p.name}: bool = get_line(&lines, ${i}, "false").trim().eq_ignore_ascii_case("true");`;
      if (kind === "string")
        return `    let ${p.name}: String = trim_quotes(get_line(&lines, ${i}, ""));`;
      if (kind === "matrix_int")
        return `    let ${p.name}: Vec<Vec<i32>> = parse_matrix(get_line(&lines, ${i}, "[]"));`;
      return `    let ${p.name}: Vec<i32> = parse_vec(get_line(&lines, ${i}, "[]"));`;
    })
    .join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = formatReturnRust(meta.return?.type || "any");

  return `use std::io::{self, Read};

${userCode}

fn get_line(lines: &Vec<&str>, idx: usize, fallback: &'static str) -> &str {
    if idx < lines.len() { lines[idx] } else { fallback }
}

fn trim_quotes(s: &str) -> String {
    let t = s.trim();
    if t.len() >= 2 && t.starts_with('"') && t.ends_with('"') {
        return t[1..t.len() - 1].to_string();
    }
    t.to_string()
}

fn parse_vec(s: &str) -> Vec<i32> {
    let t = s.trim().trim_start_matches('[').trim_end_matches(']');
    if t.is_empty() {
        return vec![];
    }
    t.split(',')
        .map(|x| x.trim().parse::<i32>().unwrap_or(0))
        .collect()
}

fn parse_matrix(s: &str) -> Vec<Vec<i32>> {
    let chars: Vec<char> = s.chars().collect();
    let mut out: Vec<Vec<i32>> = Vec::new();
    let mut depth = 0usize;
    let mut start = 0usize;
    for (i, ch) in chars.iter().enumerate() {
        if *ch == '[' {
            if depth == 1 {
                start = i;
            }
            depth += 1;
        } else if *ch == ']' {
            if depth > 0 {
                depth -= 1;
            }
            if depth == 1 {
                let row: String = chars[start..=i].iter().collect();
                out.push(parse_vec(&row));
            }
        }
    }
    out
}

fn to_vec_json(v: &Vec<i32>) -> String {
    let parts: Vec<String> = v.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(","))
}

fn to_matrix_json(v: &Vec<Vec<i32>>) -> String {
    let parts: Vec<String> = v.iter().map(|row| to_vec_json(row)).collect();
    format!("[{}]", parts.join(","))
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let lines: Vec<&str> = input.lines().collect();
${parseLines}
    let result = Solution::${meta.name}(${callArgs});
    ${returnLine}
}
`;
}

export function wrapCode(
  code: string,
  language: string,
  metaRaw: string,
  examples: string,
): string {
  if (!metaRaw) return code;
  try {
    switch (language) {
      case "python":
        return generatePythonWrapper(code, metaRaw, examples);
      case "javascript":
      case "typescript":
        return generateJSWrapper(code, metaRaw);
      case "cpp":
        return generateCppWrapper(code, metaRaw);
      case "java":
        return generateJavaWrapper(code, metaRaw);
      case "golang":
        return generateGoWrapper(code, metaRaw);
      case "rust":
        return generateRustWrapper(code, metaRaw);
      default:
        return code;
    }
  } catch {
    return code;
  }
}

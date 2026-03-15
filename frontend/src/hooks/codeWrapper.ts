interface MetaParam {
  name: string;
  type: string;
}

interface MetaData {
  name: string;
  params: MetaParam[];
  return: { type: string };
}

function parseMetaData(raw: string): MetaData | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function lcTypeToPython(t: string): string {
  if (t.startsWith("List[")) return "list";
  if (t === "integer" || t === "int") return "int";
  if (t === "string" || t === "str") return "str";
  if (t === "boolean" || t === "bool") return "bool";
  if (t === "float" || t === "double") return "float";
  if (t.startsWith("TreeNode")) return "tree";
  if (t.startsWith("ListNode")) return "linked_list";
  if (t.startsWith("character")) return "str";
  if (t.includes("[][]") || t.startsWith("List[List")) return "matrix";
  return "any";
}

function parseValue(varName: string, lcType: string): string {
  const t = lcTypeToPython(lcType);
  if (t === "tree") {
    return `${varName} = build_tree(json.loads(input()))`;
  }
  if (t === "linked_list") {
    return `${varName} = build_list(json.loads(input()))`;
  }
  if (t === "int") return `${varName} = int(input())`;
  if (t === "str") return `${varName} = input().strip().strip('"')`;
  if (t === "bool") return `${varName} = input().strip().lower() == "true"`;
  if (t === "float") return `${varName} = float(input())`;
  if (t === "matrix") return `${varName} = json.loads(input())`;
  return `${varName} = json.loads(input())`;
}

const TREE_HELPERS_PYTHON = `
import json
from collections import deque
from typing import Optional, List

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(vals):
    if not vals:
        return None
    root = TreeNode(vals[0])
    q = deque([root])
    i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] is not None:
            node.left = TreeNode(vals[i])
            q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] is not None:
            node.right = TreeNode(vals[i])
            q.append(node.right)
        i += 1
    return root

def tree_to_list(root):
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        node = q.popleft()
        if node:
            res.append(node.val)
            q.append(node.left)
            q.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res
`;

const LIST_HELPERS_PYTHON = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(vals):
    dummy = ListNode(0)
    cur = dummy
    for v in vals:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next

def list_to_arr(head):
    res = []
    while head:
        res.append(head.val)
        head = head.next
    return res
`;

function needsTreeHelper(params: MetaParam[], retType: string): boolean {
  return (
    params.some((p) => p.type.startsWith("TreeNode")) ||
    retType.startsWith("TreeNode")
  );
}

function needsListHelper(params: MetaParam[], retType: string): boolean {
  return (
    params.some((p) => p.type.startsWith("ListNode")) ||
    retType.startsWith("ListNode")
  );
}

function formatReturnPython(retType: string, resultVar: string): string {
  const t = lcTypeToPython(retType);
  if (t === "tree") return `print(tree_to_list(${resultVar}))`;
  if (t === "linked_list") return `print(list_to_arr(${resultVar}))`;
  if (t === "bool") return `print(str(${resultVar}).lower())`;
  return `print(json.dumps(${resultVar}) if isinstance(${resultVar}, (list, dict)) else ${resultVar})`;
}

export function generatePythonWrapper(
  userCode: string,
  metaRaw: string,
  exampleInputs: string,
): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const retType = meta.return?.type || "any";
  const params = meta.params || [];

  const needsTree = needsTreeHelper(params, retType);
  const needsList = needsListHelper(params, retType);

  let helpers = "import json\nfrom typing import Optional, List\n";
  if (needsTree) helpers += TREE_HELPERS_PYTHON;
  else helpers += "\n";
  if (needsList) helpers += LIST_HELPERS_PYTHON;

  const parseLines = params.map((p) => parseValue(p.name, p.type)).join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = formatReturnPython(retType, "result");

  return `${helpers}
${userCode}

if __name__ == "__main__":
    sol = Solution()
${parseLines
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}
    result = sol.${meta.name}(${callArgs})
    ${returnLine}
`;
}

function lcTypeToJS(t: string): string {
  if (t.startsWith("TreeNode")) return "tree";
  if (t.startsWith("ListNode")) return "linked_list";
  if (t === "integer" || t === "int") return "int";
  if (t === "boolean" || t === "bool") return "bool";
  return "json";
}

function parseValueJS(varName: string, lcType: string): string {
  const t = lcTypeToJS(lcType);
  if (t === "tree")
    return `const ${varName} = buildTree(JSON.parse(lines[lineIdx++]));`;
  if (t === "linked_list")
    return `const ${varName} = buildList(JSON.parse(lines[lineIdx++]));`;
  if (t === "int") return `const ${varName} = parseInt(lines[lineIdx++]);`;
  if (t === "bool")
    return `const ${varName} = lines[lineIdx++].trim() === "true";`;
  return `const ${varName} = JSON.parse(lines[lineIdx++]);`;
}

function formatReturnJS(retType: string, resultVar: string): string {
  const t = lcTypeToJS(retType);
  if (t === "tree")
    return `console.log(JSON.stringify(treeToList(${resultVar})));`;
  if (t === "linked_list")
    return `console.log(JSON.stringify(listToArr(${resultVar})));`;
  if (t === "bool") return `console.log(${resultVar}.toString());`;
  return `console.log(typeof ${resultVar} === 'object' ? JSON.stringify(${resultVar}) : ${resultVar});`;
}

export function generateJSWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const retType = meta.return?.type || "any";
  const params = meta.params || [];
  const needsTree = needsTreeHelper(params, retType);
  const needsList = needsListHelper(params, retType);

  const treeHelper = needsTree
    ? `
function buildTree(vals) {
  if (!vals || !vals.length) return null;
  const root = { val: vals[0], left: null, right: null };
  const q = [root]; let i = 1;
  while (q.length && i < vals.length) {
    const node = q.shift();
    if (i < vals.length && vals[i] !== null) { node.left = { val: vals[i], left: null, right: null }; q.push(node.left); } i++;
    if (i < vals.length && vals[i] !== null) { node.right = { val: vals[i], left: null, right: null }; q.push(node.right); } i++;
  }
  return root;
}
function treeToList(root) {
  if (!root) return [];
  const res = [], q = [root];
  while (q.length) { const n = q.shift(); if (n) { res.push(n.val); q.push(n.left); q.push(n.right); } else res.push(null); }
  while (res.length && res[res.length-1] === null) res.pop();
  return res;
}`
    : "";

  const listHelper = needsList
    ? `
function buildList(vals) {
  let dummy = { val: 0, next: null }, cur = dummy;
  for (const v of vals) { cur.next = { val: v, next: null }; cur = cur.next; }
  return dummy.next;
}
function listToArr(head) {
  const res = [];
  while (head) { res.push(head.val); head = head.next; }
  return res;
}`
    : "";

  const parseLines = params
    .map((p) => "  " + parseValueJS(p.name, p.type))
    .join("\n");
  const callArgs = params.map((p) => p.name).join(", ");
  const returnLine = "  " + formatReturnJS(retType, "result");

  return `${treeHelper}${listHelper}

${userCode}

const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
let lineIdx = 0;
${parseLines}
const sol = new Solution();
const result = sol.${meta.name}(${callArgs});
${returnLine}
`;
}

export function generateCppWrapper(userCode: string, metaRaw: string): string {
  const meta = parseMetaData(metaRaw);
  if (!meta) return userCode;

  const retType = meta.return?.type || "void";
  const params = meta.params || [];

  const needsTree = needsTreeHelper(params, retType);
  const needsList = needsListHelper(params, retType);

  const treeHelper = needsTree
    ? `
struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
TreeNode* buildTree(vector<string>& vals, int i) {
    if (i >= vals.size() || vals[i] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(vals[i]));
    root->left  = buildTree(vals, 2*i+1);
    root->right = buildTree(vals, 2*i+2);
    return root;
}`
    : "";

  const listHelper = needsList
    ? `
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};
ListNode* buildList(vector<int>& v) {
    ListNode dummy(0); ListNode* cur = &dummy;
    for (int x : v) { cur->next = new ListNode(x); cur = cur->next; }
    return dummy.next;
}`
    : "";

  const parseLines: string[] = [];
  const callArgs: string[] = [];

  for (const p of params) {
    const t = lcTypeToPython(p.type);
    if (t === "int") {
      parseLines.push(`    int ${p.name}; cin >> ${p.name};`);
    } else if (t === "str") {
      parseLines.push(`    string ${p.name}; cin >> ${p.name};`);
    } else if (t === "bool") {
      parseLines.push(
        `    string _${p.name}_s; cin >> _${p.name}_s; bool ${p.name} = (_${p.name}_s == "true");`,
      );
    } else {
      parseLines.push(
        `    string _${p.name}_raw; getline(cin, _${p.name}_raw);`,
      );
      parseLines.push(
        `    vector<int> ${p.name}_arr = parseIntArray(_${p.name}_raw);`,
      );
      if (t === "linked_list") {
        parseLines.push(`    ListNode* ${p.name} = buildList(${p.name}_arr);`);
      } else {
        parseLines.push(`    auto ${p.name} = ${p.name}_arr;`);
      }
    }
    callArgs.push(p.name);
  }

  const retPrint =
    retType === "boolean" || retType === "bool"
      ? `cout << (result ? "true" : "false") << endl;`
      : retType === "string"
        ? `cout << result << endl;`
        : retType.includes("vector") || retType.includes("List")
          ? `for(auto x : result) cout << x << " "; cout << endl;`
          : `cout << result << endl;`;

  return `#include <bits/stdc++.h>
using namespace std;
${treeHelper}${listHelper}

vector<int> parseIntArray(string s) {
    vector<int> res;
    s.erase(remove(s.begin(), s.end(), '['), s.end());
    s.erase(remove(s.begin(), s.end(), ']'), s.end());
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        token.erase(remove(token.begin(), token.end(), ' '), token.end());
        if (!token.empty() && token != "null") res.push_back(stoi(token));
    }
    return res;
}

${userCode}

int main() {
${parseLines.join("\n")}
    Solution sol;
    auto result = sol.${meta.name}(${callArgs.join(", ")});
    ${retPrint}
    return 0;
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
        return generateJSWrapper(code, metaRaw);
      case "typescript":
        return generateJSWrapper(code, metaRaw);
      case "cpp":
        return generateCppWrapper(code, metaRaw);
      default:
        return code;
    }
  } catch {
    return code;
  }
}

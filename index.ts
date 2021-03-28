import * as esprima from "esprima";
import * as estree from "estree";
import * as traverse from "estraverse";
import { generate } from "astring";
import { inspect } from "util";

const l = (...args) => console.log(inspect(args, false, null, true));

const input = "character.account.score > 50";

l("input", input);

const ast = esprima.parseScript(input);

const locals = {
  character: {
    account: {
      score: 100,
    },
  },
};

const lookup = (node: estree.Node) => {
  const identifiers: string[] = [];
  let parent = node;

  do {
    if (parent.type === "Identifier") {
      identifiers.unshift(parent.name);
    }
    if (parent.type === "MemberExpression") {
      if (parent.property.type === "Identifier") {
        identifiers.unshift(parent.property.name);
      }
    }
  } while (parent.type === "MemberExpression" && (parent = parent.object));

  return identifiers;
};

const newAst = traverse.replace(ast, {
  enter(node) {
    if (node.type === "MemberExpression") {
      const idents = lookup(node);
      const result = idents.slice(1).reduce((memo, cur) => {
        return memo[cur];
      }, locals[idents[0]]);

      return {
        type: "Literal",
        value: result,
      };
    }
  },
});

l("generate", generate(newAst));

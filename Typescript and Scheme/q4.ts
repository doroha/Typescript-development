import {Exp, Program, isProgram, isBoolExp, isNumExp, isVarRef, isPrimOp, isDefineExp, isProcExp, isIfExp, isAppExp, CExp, PrimOp} from '../imp/L2-ast';
import { Result, makeOk, makeFailure } from '../imp/result';
import  { map } from 'ramda';

/*          
Purpose: The procedure gets an L2 AST and returns a string of the equivalent JavaScript program
Signature: l2ToJS(exp)
Type:[Exp | Program -> Result<string>]
*/
export const l2ToJS = (exp: Exp | Program): Result<string> => {  
let ans: string 
isProgram(exp) && exp.exps.length > 1 ?  ans = map(makeConvertToJs,exp.exps.slice(0,exp.exps.length-1)).join(";\n") + ";\nconsole.log(" + makeConvertToJs(exp.exps[exp.exps.length-1]) + ");" :
isProgram(exp) ? ans =  makeConvertToJs(exp.exps[0]) + ";" : 
ans = makeConvertToJs(exp)

if(ans.includes("Invalid input expression"))  
return makeFailure(ans); 
 else  return makeOk(ans);
}

/*  
Purpose: The procedure gets an L2 Expression and returns a string of the equivalent JavaScript Expression
Signature: makeConvertToJs(exp)
Type: [Exp  -> string]
*/
export const makeConvertToJs = (exp: Exp): string => 

isBoolExp(exp) ? (exp.val ? 'true' : 'false') :
isNumExp(exp) ? exp.val.toString() :
isVarRef(exp) ? exp.var :

isDefineExp(exp) ? "const " + exp.var.var + " = " + makeConvertToJs(exp.val) :
isProcExp(exp) ? "((" + map((v) => v.var, exp.args).join(",") + ")" + " => " + makeConvertProcExp(exp.body) + ")" :
isIfExp(exp) ? "(" + makeConvertToJs(exp.test) + " ? " + makeConvertToJs(exp.then) + " : " + makeConvertToJs(exp.alt) + ")" :

isAppExp(exp) ? (isPrimOp(exp.rator) ? makeConvertPrimOp(exp.rator, exp.rands) : 
makeConvertToJs(exp.rator) + "(" + map(makeConvertToJs, exp.rands).join(",") + ")") :
"Invalid input expression: " + exp.tag

/* 
Purpose: The procedure gets the body of ProcExp and returns a string of the equivalent JavaScript Expression 
Signature: makeConvertProcExp(body)
Type: [CExp[] -> string] 
*/
export const makeConvertProcExp = (body: CExp[]): string =>  
body.length===1 ? makeConvertToJs(body[0]) : "{" + map(makeConvertToJs,body.slice(0,body.length-1)).join("; ") + ";" +  " return " +  makeConvertToJs(body[body.length-1]) + ";}"

/*  
Purpose: The procedure gets the rator and the rands of AppExp and returns a string of the equivalent JavaScript Expression 
Signature: makeConvertPrimOp(rator,rands)
Type: [PrimOp * CExp[] -> string] 
*/ 
const makeConvertPrimOp = (rator : PrimOp, rands : CExp[]) : string =>
rator.op === "eq?" ? "(" + makeConvertToJs(rands[0]) + " === " + makeConvertToJs(rands[1]) + ")" :
rator.op === "number?" ? "(" + "typeof " + map(makeConvertToJs,rands) + " === " + "\"number\"" + ")" : 
rator.op === "boolean?" ? "(" + "typeof " + map(makeConvertToJs,rands) + " === " + "\"boolean\"" + ")" :  

rator.op === "not" ? "(!" + map(makeConvertToJs,rands) + ")" : 
rator.op === "and" ? "(" + map(makeConvertToJs,rands).join(" && ") + ")" :
rator.op === "or" ? "(" + map(makeConvertToJs,rands).join(" || ") + ")" : 

rator.op === "=" ? "(" +  makeConvertToJs(rands[0]) + " === " +  makeConvertToJs(rands[1]) + ")" :
"(" + map(makeConvertToJs,rands).join(" " + rator.op + " ") + ")"   
 

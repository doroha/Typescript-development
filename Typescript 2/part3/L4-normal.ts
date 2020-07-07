// ========================================================
// L4 normal eval
import { Sexp } from "s-expression";
import { filter, map, zip } from "ramda";
import { CExp, Exp, IfExp, Program, parseL4Exp, Binding, LetExp, PrimOp, VarDecl, isLetExp, AppExp, makeLetExp, makeBinding } from "./L4-ast";
import { isAppExp, isBoolExp, isCExp, isDefineExp, isIfExp, isLitExp, isNumExp,
         isPrimOp, isProcExp, isStrExp, isVarRef ,VarRef ,ProcExp} from "./L4-ast";
import { applyEnv, makeEmptyEnv, Env, makeExtEnv, ExtEnv, isEmptyEnv } from './L4-env-normal';
import { applyPrimitive } from "./evalPrimitive";
import { isClosure, makeClosure, Value} from "./L4-value";
import { first, rest, isEmpty } from '../shared/list';
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";

export const normalEval = (exp: CExp, env: Env): Result<Value> =>
    isBoolExp(exp) ? makeOk(exp.val) :
    isNumExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isLitExp(exp) ? makeOk(exp.val) :
    isVarRef(exp) ? evalRef(exp,env) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp,env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isAppExp(exp) ? evalApp(exp,env) :
    makeFailure(`Bad L4 Ast: ${exp}`);

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalApp = (exp: AppExp, env: Env): Result<Value> =>
    bind(normalEval(exp.rator, env), p => applyProcedure(p, exp.rands, env))

const evalProc = (exp: ProcExp, env: Env): Result<Value> =>
        makeOk(makeClosure(exp.args, exp.body, env)) 

const evalRef = (exp: VarRef, env: Env): Result<Value> =>
    bind(applyEnv(env, exp.var), (e: CExp) => normalEval(e, env))

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(normalEval(exp.test, env),
         (test: Value) => isTrueValue(test) ? normalEval(exp.then, env) : normalEval(exp.alt, env));


const applyProcedure = (proc: Value, args: CExp[],env :Env): Result<Value> =>
    isPrimOp(proc) ? bind(mapResult((arg) => normalEval(arg, env), args), (args: Value[]) => applyPrimitive(proc, args)) :
    isClosure(proc) ? evalExps(proc.body,makeExtEnv(map((p) => p.var, proc.params),args,proc.env)) :
    makeFailure(`Bad procedure ${JSON.stringify(proc)}`);  


// Evaluate a sequence of expressions (in a program)
export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty sequence") :
    isDefineExp(first(exps)) ? evalDefineExps(first(exps), rest(exps), env) :
    evalCExps(first(exps), rest(exps), env);

const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isCExp(first) && isEmpty(rest) ? normalEval(first, env) :
    isCExp(first) ? bind(normalEval(first, env), _ => evalExps(rest, env)) :
    makeFailure("Never");

const evalDefineExps = (def: Exp, exps: Exp[], env: Env): Result<Value> =>
    isDefineExp(def) ? evalExps(exps, makeExtEnv([def.var.var], [def.val], env)) :
    makeFailure("Unexpected " + def);

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
        (parsed: Sexp) => bind(parseL4Exp(parsed),
            (exp: Exp) => evalExps([exp], makeEmptyEnv())));

const evalLet = (exp: LetExp, env: Env): Result<Value> => 
    evalExps(exp.body, makeExtEnv(exp.bindings.map((b)=>b.var.var), exp.bindings.map((b)=>b.val), env));
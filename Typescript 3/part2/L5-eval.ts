// L5-eval-box

import { map, repeat, zipWith, chain, identity } from "ramda";
import { CExp, Exp, IfExp, LetrecExp, LetExp, ProcExp, Program, SetExp, isCExp, isLetValuesExp, isValuesExp, ValuesExp, LetValuesExp, ValuesBindings } from './L5-ast';
import { Binding, VarDecl } from "./L5-ast";
import { isBoolExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef } from "./L5-ast";
import { parseL5Exp } from "./L5-ast";
import { isAppExp, isDefineExp, isIfExp, isLetrecExp, isLetExp,
         isProcExp, isSetExp } from "./L5-ast";
import { applyEnv, applyEnvBdg, globalEnvAddBinding, makeExtEnv, setFBinding,
         theGlobalEnv, Env, FBinding } from "./L5-env";
import { isClosure, makeClosure, Closure, Value, Tuple, makeTuple, SExpValue, isTuple } from "./L5-value";
import { isEmpty, first, rest, allT } from '../shared/list';
import { Result, makeOk, makeFailure, mapResult, safe2, bind, isOk } from "../shared/result";
import { parse as p } from "../shared/parser";
import { applyPrimitive } from "./evalPrimitive";

// ========================================================
// Eval functions

export const applicativeEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? applyEnv(env, exp.var) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isLetrecExp(exp) ? evalLetrec(exp, env) :
    isSetExp(exp) ? evalSet(exp, env) :
    isValuesExp(exp) ? evalValues(exp,env) : 
    isLetValuesExp(exp) ? evalLetValues(exp,env) :
    isAppExp(exp) ? safe2((proc: Value, args: Value[]) => applyProcedure(proc, args))
                        (applicativeEval(exp.rator, env), mapResult(rand => applicativeEval(rand, env), exp.rands)) :
    makeFailure(`Bad L5 AST ${exp}`);


const flatten = <T>(lls: T[][]): T[] => chain(identity, lls);  

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(applicativeEval(exp.test, env),
         (test: Value) => isTrueValue(test) ? applicativeEval(exp.then, env) : applicativeEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosure(exp.args, exp.body, env));

const evalValues = (exp: ValuesExp, env:Env): Result<Value> =>
     bind(mapResult(vals => applicativeEval(vals, env), exp.vals),
                 (vals: SExpValue[]) => 
                        makeOk(makeTuple(vals))) 
    

// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
const applyProcedure = (proc: Value, args: Value[]): Result<Value> =>
    isPrimOp(proc) ? applyPrimitive(proc, args) :
    isClosure(proc) ? applyClosure(proc, args) :
    makeFailure(`Bad procedure ${JSON.stringify(proc)}`);

const applyClosure = (proc: Closure, args: Value[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalSequence(proc.body, makeExtEnv(vars, args, proc.env));
}

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    isEmpty(seq) ? makeFailure("Empty sequence") :
    isDefineExp(first(seq)) ? evalDefineExps(first(seq), rest(seq)) :
    evalCExps(first(seq), rest(seq), env);
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isCExp(first) && isEmpty(rest) ? applicativeEval(first, env) :
    isCExp(first) ? bind(applicativeEval(first, env), _ => evalSequence(rest, env)) :
    makeFailure("Never");
    
// define always updates theGlobalEnv
// We also only expect defineExps at the top level.
// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const evalDefineExps = (def: Exp, exps: Exp[]): Result<Value> =>
    isDefineExp(def) ? bind(applicativeEval(def.val, theGlobalEnv),
                            (rhs: Value) => { globalEnvAddBinding(def.var.var, rhs);
                                              return evalSequence(exps, theGlobalEnv); }) :
    makeFailure("Unexpected " + def);

// Main program
export const evalProgram = (program: Program): Result<Value> =>
    evalSequence(program.exps, theGlobalEnv);

export const evalParse = (s: string): Result<Value> =>
    bind(bind(p(s), parseL5Exp), (exp: Exp) => evalSequence([exp], theGlobalEnv));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals = mapResult((v : CExp) => applicativeEval(v, env), map((b : Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: Value[]) => evalSequence(exp.body, makeExtEnv(vars, vals, env)));
}

// LETREC: Direct evaluation rule without syntax expansion
// 1. extend the env with vars initialized to void (temporary value)
// 2. compute the vals in the new extended env
// 3. update the bindings of the vars to the computed vals
// 4. compute body in extended env
const evalLetrec = (exp: LetrecExp, env: Env): Result<Value> => {
    const vars = map((b) => b.var.var, exp.bindings);
    const vals = map((b) => b.val, exp.bindings);
    const extEnv = makeExtEnv(vars, repeat(undefined, vars.length), env);
    // @@ Compute the vals in the extended env
    const cvalsResult = mapResult((v: CExp) => applicativeEval(v, extEnv), vals);
    const result = bind(cvalsResult,
                        (cvals: Value[]) => makeOk(zipWith((bdg, cval) => setFBinding(bdg, cval), extEnv.frame.fbindings, cvals)));
    return bind(result, _ => evalSequence(exp.body, extEnv));
};

const evalLetValues = (exp: LetValuesExp, env: Env): Result<Value> =>{   
    const vals =  mapResult((v : CExp) => 
                        applicativeEval(v, env),
                            map((vb : ValuesBindings) => vb.rightSide, exp.bindings)) 
     
    const vars = map((vb: ValuesBindings) => vb.leftSide, exp.bindings); 
    
    const validateSize = (vals: SExpValue[][] , vars:VarDecl[][]): Result<boolean> => {

        const checkEquality = (vars: VarDecl[][] , vals: SExpValue[][] , index: number) : Result<boolean> => 
        index == -1 ? makeFailure("false") : 
        index == vars.length ? makeOk(true) :  
        vars[index].length == vals[index].length ? checkEquality(vars,vals,index+1) : makeFailure("false") 

        return checkEquality(vars,vals, vars.length == vals.length ? vars.length : -1);  
    } 

    const validateTuples = (vals: SExpValue[]) : Result<SExpValue[][]> =>  {

        const checkTuples = (vals: SExpValue[]) : Result<SExpValue[]> => 
        vals.every(isTuple) ?  makeOk(vals) : makeFailure("Unexpected Values") 

        const extractVals = (valuesExp: SExpValue) : Result<SExpValue[]> =>
        isTuple(valuesExp) ? makeOk(valuesExp.vals) : makeFailure("Unexpected Values")

        return bind(checkTuples(vals), (values: SExpValue[]) => mapResult(extractVals, values))
    } 

    const computeVals =  (vals: Value[]): Result<Value> =>  evalSequence(exp.body, makeExtEnv(map((v) => v.var, flatten(vars)) , vals, env))
    
    const goodVals = bind(vals, validateTuples);  

    const chainsVals = (vals: SExpValue[][]): Result<SExpValue[]> => makeOk(flatten(vals));  

    const validation = bind(goodVals, 
                                (vals: SExpValue[][]) => 
                                        validateSize(vals,vars))   

    return isOk(validation) ? bind(bind(goodVals , chainsVals),computeVals) : makeFailure("Error")
    }

// L4-eval-box: Handling of mutation with set!
const evalSet = (exp: SetExp, env: Env): Result<void> =>
    safe2((val: Value, bdg: FBinding) => makeOk(setFBinding(bdg, val)))
        (applicativeEval(exp.val, env), applyEnvBdg(env, exp.var.var));
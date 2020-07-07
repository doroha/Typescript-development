import {isCExp, makeNumExp , ForExp, AppExp, Exp, CExp , Program ,makeProcExp ,makeAppExp, isForExp, isProgram , makeProgram,isIfExp, isAppExp, isProcExp ,makeIfExp, isDefineExp ,makeDefineExp } from "./L21-ast";
import { Result, makeOk, makeFailure } from "../imp/result";
import { range } from "ramda";

/*
Purpose: Syntactic transformation from a ForExp to an equivalent AppExp
Signature: for2app(exp)
Type:  [ForExp -> AppExp]
*/
export const for2app = (fExp: ForExp): AppExp => {  
 let app_arr: CExp[] 
 let body : CExp;   
      body = makeConvertCExp(fExp.body) 
          app_arr =  range(fExp.start.val,fExp.end.val+1).map((a) => makeAppExp(makeProcExp([fExp.var],[body]), [makeNumExp(a)]))
   return makeAppExp(makeProcExp([],app_arr),[]);
} 

/*
Purpose: Gets an L21 AST and returns an equivalent L2 AST
Signature: L21ToL2(exp)
Type: [Exp | Program -> Result<Exp | Program>]
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp | Program> =>
   isProgram(exp) ? makeOk(makeProgram(exp.exps.map((e)=>makeConvertExp(e)))) : 
   isCExp(exp) ? makeOk(makeConvertCExp(exp)) :  isDefineExp(exp) ? makeOk(makeDefineExp(exp.var,makeConvertCExp(exp.val))) : makeFailure("Invalid input")   

/*  helper function 1
Purpose: Gets an Exp and return acording to his type -> Exp: CExp | DefineExp converted 
Signature: makeConvertExp(exp)
Type: [Exp  -> Exp]
*/
export const makeConvertExp = (exp: Exp): Exp => 
   isCExp(exp) ? makeConvertCExp(exp) : 
   makeDefineExp(exp.var,makeConvertCExp(exp.val))

/*  helper function 2
Purpose: Gets an CExp and return acording to his CExp(IfExp,AppExp,ProcExp,ForExp - covereted to AppExp) type CExp converted
Signature: makeConvertCExp(exp)
Type: [CExp  -> CExp]
*/  
export const makeConvertCExp = (cexp: CExp): CExp => 
   isIfExp(cexp)  ? makeIfExp(makeConvertCExp(cexp.test),makeConvertCExp(cexp.then),makeConvertCExp(cexp.alt)) :
   isAppExp(cexp) ? makeAppExp(makeConvertCExp(cexp.rator),cexp.rands.map((e)=>makeConvertCExp(e))) :
   isProcExp(cexp) ? makeProcExp(cexp.args,cexp.body.map((e)=>makeConvertCExp(e))) : 
   isForExp(cexp) ? for2app(cexp) :
   cexp
   
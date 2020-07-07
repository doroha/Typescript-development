import { map, zipWith, is, filter, chain } from "ramda";
import { Identifier, isNumber, isString } from "../shared/type-predicates";
import { LetExp, LitExp,IfExp, ProcExp, Binding,Parsed, BoolExp, VarRef, VarDecl, AppExp, Exp, DefineExp, isLetrecExp, isSetExp ,isDefineExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isVarDecl, isAppExp, isIfExp, isProcExp, isBinding, isLetExp, isLitExp, NumExp, StrExp, PrimOp, LetrecExp, SetExp, isExp, Program, parseL4, unparse, parseL4Exp, isAtomicExp } from "./L4-ast";
import { Result, makeOk, isOk, bind, mapResult, makeFailure } from "../shared/result";
import { makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp, valueToString, isClosure, isSymbolSExp, isEmptySExp, EmptySExp, SymbolSExp, Closure, CompoundSExp, isCompoundSExp } from './L4-value'
import { Graph, AtomicGraph, isAtomicGraph, unparseMermaid, GraphContent, Edge, isCompoundGraph, CompoundGraph, makeGraph, makeAtomicGraph, makeNodeDecl, NodeDecl, makeEdge, makeCompoundGraph, Node, NodeRef, makeNodeRef, makeHeader, makeDirection, parseL4Expression } from "./mermaid-ast";
import { type } from "os";
import { isCompoundExp } from "../L3/L3-ast";

export const makeVarGen = (): (v: string) => string => {
    let count: number = 0;
    return (v: string) => {
        count++;
        return `${v}_${count}`;
    };
};

interface VarsGen {
    programVarGen: (s:string)=>string 
    defineVarGen: (s:string)=>string
    numExpVarGen: (s:string)=>string
    boolExpVarGen: (s:string)=>string
    strExpVarGen: (s:string)=>string
    primOpVarGen: (s:string)=>string
    varRefVarGen: (s:string)=>string
    varDeclVarGen: (s:string)=>string
    appExpVarGen: (s:string)=>string
    ifExpVarGen: (s:string)=>string
    procExpVarGen: (s:string)=>string
    bindingVarGen: (s:string)=>string
    bindingsVarGen: (s:string)=>string
    letExpVarGen: (s:string)=>string
    litExpVarGen: (s:string)=>string
    letrecExpVarGen: (s:string)=>string
    expsVarGen: (s:string)=>string
    setExpVarGen: (s:string)=>string
    randsVarGen: (s:string)=>string
    paramsVarGen: (s:string)=>string
    bodyVarGen: (s:string)=>string
    emptySExpVarGen: (s:string)=>string
    numberVarGen: (s:string)=>string
    booleanVarGen: (s:string)=>string
    stringVarGen: (s:string)=>string
    symbolSExpVarGen: (s:string)=>string
    compoundSExpVarGen: (s:string)=>string
}

const makeVarsGen = (): VarsGen => 
({
    programVarGen: makeVarGen(),
    defineVarGen: makeVarGen(),
    numExpVarGen: makeVarGen(),
    boolExpVarGen: makeVarGen(),
    strExpVarGen: makeVarGen(),
    primOpVarGen: makeVarGen(),
    varRefVarGen: makeVarGen(),
    varDeclVarGen: makeVarGen(),
    appExpVarGen: makeVarGen(),
    ifExpVarGen: makeVarGen(),
    procExpVarGen: makeVarGen(),
    bindingVarGen: makeVarGen(),
    bindingsVarGen : makeVarGen(),
    letExpVarGen: makeVarGen(),
    litExpVarGen: makeVarGen(),
    letrecExpVarGen: makeVarGen(),
    expsVarGen: makeVarGen(),
    setExpVarGen: makeVarGen(),
    randsVarGen: makeVarGen(),
    paramsVarGen: makeVarGen(),
    bodyVarGen: makeVarGen(),
    emptySExpVarGen: makeVarGen(),
    numberVarGen: makeVarGen(),
    booleanVarGen: makeVarGen(),
    stringVarGen: makeVarGen(),
    symbolSExpVarGen: makeVarGen(),
    compoundSExpVarGen: makeVarGen()
});

const varsGen : VarsGen = makeVarsGen(); 

export const L4toMermaid = (concrete: string): Result<string> => 
concrete.includes("L4") ?
     (bind(parseL4(concrete),
        (program: Program): Result<string> =>
            bind(mapL4toMermaid(program), unparseMermaid))) :       
                (bind(parseL4Expression(concrete),
                    (exp: Exp): Result<string> =>
                        bind(mapL4toMermaid(exp), unparseMermaid))) 


export const getRoot = (content:GraphContent) : Node =>
isAtomicGraph(content) ? content.node : content.edges[0].from  

export const compoundSGraphEdges = (g:GraphContent) : Edge[] =>
isCompoundGraph(g) ? g.edges : [] 
//chain( (x) => x , (<CompoundGraph[]>nodes.filter( g => isCompoundGraph(g))).map((n) => n.edges))

export const getEdges = (graphs:Graph[], nodeRef : NodeRef) : Edge[] =>
graphs.map((g)=> makeEdge(nodeRef,getRoot(g.content))).concat(chain(x => x ,graphs.map((g)=> compoundSGraphEdges(g.content))))

export const seperateEdges = (firstEdge: Edge , secondEdge: Edge , edges1: Edge[] , edges2: Edge[]) : Edge[] =>
[firstEdge].concat(edges1).concat([secondEdge]).concat(edges2)

export const mapL4toMermaid = (exp: Parsed): Result<Graph> => 
isExp(exp) ? makeOk(makeConvertToMermaid(exp)) : 
makeOk(mapL4Program(exp)) 

export const makeConvertToMermaid = (exp: Exp | VarDecl | Binding): Graph =>  
isAtomicExp(exp) || isVarDecl(exp) ? makeConvertAtomicExp(exp) : 
makeConvertCompoundExpAndDefineAndBinding(exp)  

export const makeConvertToMermaidSExpValue = (sxValue : SExpValue) : Graph =>
isNumber(sxValue) ?  makeConvertNumber(sxValue) :
isEmptySExp(sxValue) ? makeConvertEmptySExp(sxValue) :
isString(sxValue) ?  makeConvertString(sxValue) :
isPrimOp(sxValue) ? makeConverPrimOpExp(sxValue) :
isSymbolSExp(sxValue) ? makeConvertSymbolSExp(sxValue) :  
isCompoundSExp(sxValue) ? makeConvertCompoundSExp(sxValue) : 
makeConvertBoolean(<boolean>sxValue) 


export const makeConvertCompoundExpAndDefineAndBinding = (exp: AppExp | IfExp | ProcExp | LetExp | LitExp | LetrecExp | SetExp | DefineExp | Binding): Graph => 
isAppExp(exp) ? makeConvertAppExp(exp) : 
isIfExp(exp) ?  makeConvertIfExp(exp) : 
isProcExp(exp) ? makeConvertProcExp(exp) : 
isLitExp(exp) ? makeConvertLitExp(exp) : 
isLetExp(exp) ? makeConvertLetOrLetRecExp(exp,varsGen.letExpVarGen) : 
isLetrecExp(exp) ? makeConvertLetOrLetRecExp(exp,varsGen.letrecExpVarGen) :
isSetExp(exp) ? makeConvertDefineBindingSetExp(exp,varsGen.setExpVarGen): 
isDefineExp(exp) ? makeConvertDefineBindingSetExp(exp,varsGen.defineVarGen) : 
makeConvertDefineBindingSetExp(exp,varsGen.bindingVarGen) 

export const makeConvertAtomicExp = (exp: NumExp | BoolExp | StrExp | PrimOp | VarRef | VarDecl): Graph =>  
isNumExp(exp) ? makeConvertNumExp(exp) : 
isBoolExp(exp) ? makeConvertBoolExp(exp) : 
isStrExp(exp) ? makeConvertStrExp(exp) : 
isPrimOp(exp) ? makeConverPrimOpExp(exp) : 
isVarRef(exp) ? makeConverVarRefExp(exp) : 
makeConverVarDec1Exp(exp) 


//         Convert SExpValue          // 

export const makeConvertNumber = (numValue : number) : Graph =>
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.numberVarGen("number"),"\"" +  "number" + "(" + numValue + ")" + "\"")))  

export const makeConvertString = (strValue : string) : Graph =>
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.stringVarGen("string"),"\"" + "string" + "(" + strValue + ")" + "\"")))  

export const makeConvertBoolean = (boolValue : boolean) : Graph =>
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.booleanVarGen("boolean"),"\"" +  "boolean" + "(" + boolValue + ")" + "\"")))  

export const makeConvertEmptySExp = (emptyValue : EmptySExp) : Graph =>
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.emptySExpVarGen(emptyValue.tag), "\"" +  emptyValue.tag + "\""))) 

export const makeConvertSymbolSExp = (symbolSExp : SymbolSExp) : Graph =>
makeGraph(makeHeader(makeDirection("TD")),
            makeCompoundGraph([makeEdge(
                                makeNodeDecl(varsGen.symbolSExpVarGen(symbolSExp.tag),"\"" + symbolSExp.tag + "\""),
                                    getRoot(makeConvertString(symbolSExp.val).content))]));


export const makeConvertCompoundSExp = (compound : CompoundSExp) : Graph =>
{
const root: NodeDecl = makeNodeDecl(varsGen.compoundSExpVarGen(compound.tag),"\"" + "CompoundSExp" + "\"" ); 
const rootRef: NodeRef = makeNodeRef(root.id); 

const val1 : Graph = makeConvertToMermaidSExpValue(compound.val1);
const val2 : Graph = makeConvertToMermaidSExpValue(compound.val2);

const leftE : Edge = makeEdge(root,getRoot(val1.content),"val1");  
const rightE : Edge = makeEdge(rootRef,getRoot(val2.content),"val2");  

return makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph(seperateEdges(leftE,rightE,compoundSGraphEdges(val1.content),compoundSGraphEdges(val2.content)))); 
}

//         Convert Exp           // 

export const mapL4Program = (program: Program): Graph => 
{
const root: NodeDecl = makeNodeDecl(varsGen.programVarGen(program.tag),program.tag); 
const node : NodeDecl = makeNodeDecl(varsGen.expsVarGen("Exps"),":"); 
const nodeRef : NodeRef = makeNodeRef(node.id);  
const edge : Edge = makeEdge(root,node,"exps");
const arrNodesExp: Graph[] = program.exps.map((r) => makeConvertToMermaid(r));
return makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph([edge].concat(getEdges(arrNodesExp,nodeRef))));  
}
                              
export const makeConvertNumExp = (num: NumExp): Graph => 
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.numExpVarGen(num.tag),"\"" + num.tag + "(" + num.val + ")" + "\""))) 

export const makeConvertStrExp = (string: StrExp): Graph => 
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.strExpVarGen(string.tag),"\"" + string.tag + "(" + string.val + ")" + "\""))) 

export const makeConverPrimOpExp = (primOP: PrimOp): Graph => 
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.primOpVarGen(primOP.tag),"\"" + primOP.tag + "(" + primOP.op + ")" + "\""))) 

export const makeConverVarRefExp = (varRef: VarRef): Graph => 
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.varRefVarGen(varRef.tag),"\"" + varRef.tag + "(" + varRef.var + ")" + "\"")))

export const makeConverVarDec1Exp = (varDec: VarDecl): Graph => 
makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.varDeclVarGen(varDec.tag),"\"" + varDec.tag + "(" + varDec.var + ")" + "\""))) 

export const makeConvertBoolExp = (bool: BoolExp): Graph =>  
{
const val : string = bool.val ? "#t" : "#f"; 
return makeGraph(makeHeader(makeDirection("TD")),makeAtomicGraph(makeNodeDecl(varsGen.boolExpVarGen(bool.tag),"\"" +  bool.tag + "(" + val + ")" + "\""))) 
}

export const makeConvertLitExp = (lit: LitExp): Graph => 
{
const root: NodeDecl = makeNodeDecl(varsGen.litExpVarGen(lit.tag),lit.tag); 
const nodeVal:Graph =  makeConvertToMermaidSExpValue(lit.val) 
const edge : Edge = makeEdge(root,getRoot(nodeVal.content),"val");
return makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph([edge].concat(compoundSGraphEdges(nodeVal.content))));  
}; 

export const makeConvertIfExp = (ifExp: IfExp): Graph => 
{
const root: NodeDecl = makeNodeDecl(varsGen.ifExpVarGen(ifExp.tag),ifExp.tag); 
const ifRef : NodeRef = makeNodeRef(root.id); 
const nodeTest:Graph = makeConvertToMermaid(ifExp.test);
const nodeThen:Graph = makeConvertToMermaid(ifExp.then);
const nodeAlt:Graph = makeConvertToMermaid(ifExp.alt);  
const leftE : Edge = makeEdge(root,getRoot(nodeTest.content),"test");  
const midE : Edge = makeEdge(ifRef,getRoot(nodeThen.content),"then");  
const rightE : Edge = makeEdge(ifRef,getRoot(nodeAlt.content),"alt"); 
const allEdges : Edge[] = [leftE].concat(compoundSGraphEdges(nodeTest.content)).concat([midE]).concat(compoundSGraphEdges(nodeThen.content)).concat([rightE]).concat(compoundSGraphEdges(nodeAlt.content));
return  makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph(allEdges));
}; 

export const makeConvertAppExp = (app: AppExp): Graph => 
{
const root: NodeDecl = makeNodeDecl(varsGen.appExpVarGen(app.tag),app.tag); 
const rootRef : NodeRef = makeNodeRef(root.id); 
const nodeRator:Graph = makeConvertToMermaid(app.rator);

const nodeRands : NodeDecl = makeNodeDecl(varsGen.randsVarGen("Rands"),":"); 
const nodeRandsRef : NodeRef = makeNodeRef(nodeRands.id); 

const arrRands: Graph[] = app.rands.map((r) => makeConvertToMermaid(r));

const leftE : Edge = makeEdge(root,getRoot(nodeRator.content),"rator");  
const rightE : Edge = makeEdge(rootRef,nodeRands,"rands");

return makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph(seperateEdges(leftE,rightE,compoundSGraphEdges(nodeRator.content),getEdges(arrRands,nodeRandsRef)))); 
};

export const makeConvertProcExp = (proc: ProcExp): Graph => 
{
const root: NodeDecl = makeNodeDecl(varsGen.procExpVarGen(proc.tag),proc.tag); 
const rootRef : NodeRef = makeNodeRef(root.id); 

const nodeParams : NodeDecl = makeNodeDecl(varsGen.paramsVarGen("Params"),":"); 
const nodePrmRef : NodeRef = makeNodeRef(nodeParams.id); 

const arrNodesDecels: Graph[] = proc.args.map((arg) => makeConvertToMermaid(arg));
const argsGraph:Graph =  makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph(arrNodesDecels.map((at)=>makeEdge(nodePrmRef,getRoot(at.content)))));


const nodeBody : NodeDecl = makeNodeDecl(varsGen.bodyVarGen("Body"),":"); 
const nodeBodyRef : NodeRef = makeNodeRef(nodeBody.id); 

const arrBody: Graph[] = proc.body.map((b) => makeConvertToMermaid(b));
 
const leftE : Edge = makeEdge(root,nodeParams,"args");  
const rightE : Edge = makeEdge(rootRef,nodeBody,"body"); 

return makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph(seperateEdges(leftE,rightE,compoundSGraphEdges(argsGraph.content),getEdges(arrBody,nodeBodyRef)))); 
}; 

export const makeConvertLetOrLetRecExp =  (exp: LetrecExp | LetExp , varGen: (s:string)=>string ): Graph => 
{
    const root: NodeDecl = makeNodeDecl(varGen(exp.tag),exp.tag); 
    const rootRef : NodeRef = makeNodeRef(root.id); 
    const nodeBindings: NodeDecl =  makeNodeDecl(varsGen.bindingVarGen("Binding"),":"); 
    const nodeBindingsRef : NodeRef = makeNodeRef(nodeBindings.id); 
    const arrBindings: Graph[] = exp.bindings.map((b) => makeConvertToMermaid(b)); 
    const nodeBody: NodeDecl = makeNodeDecl(varsGen.bodyVarGen("Body"),":"); 
    const nodeBodyRef : NodeRef = makeNodeRef(nodeBody.id);  
    const arrBody: Graph[] = exp.body.map((b) => makeConvertToMermaid(b)); 
    const leftE : Edge = makeEdge(root,nodeBindings,"bindings");   
    const rightE : Edge = makeEdge(rootRef,nodeBody,"body"); 
    return makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph(seperateEdges(leftE,rightE,getEdges(arrBindings,nodeBindingsRef),getEdges(arrBody,nodeBodyRef)))); 
}; 


export const makeConvertDefineBindingSetExp = (exp: DefineExp | Binding | SetExp , varGen: (s:string)=>string ): Graph => 
{
const root: NodeDecl = makeNodeDecl(varGen(exp.tag),exp.tag); 
const rootRef: NodeRef = makeNodeRef(root.id); 
const nodeVar:Graph = makeConvertToMermaid(exp.var);
const nodeVal:Graph = makeConvertToMermaid(exp.val); 
const leftE : Edge = makeEdge(root,getRoot(nodeVar.content),"var");   
const rightE : Edge = makeEdge(rootRef,getRoot(nodeVal.content),"val"); 
return  makeGraph(makeHeader(makeDirection("TD")),makeCompoundGraph([leftE].concat(compoundSGraphEdges(nodeVal.content)).concat([rightE])));   
}; 

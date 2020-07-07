import { map, zipWith, is, filter, chain } from "ramda";
import { Identifier, isNumber, isString } from "../shared/type-predicates";
import { LetExp, LitExp,IfExp, ProcExp, Binding,Parsed, BoolExp, VarRef, VarDecl, AppExp, Exp, DefineExp, isLetrecExp, isSetExp ,isDefineExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isVarDecl, isAppExp, isIfExp, isProcExp, isBinding, isLetExp, isLitExp, NumExp, StrExp, PrimOp, LetrecExp, SetExp, isExp, Program, parseL4, parseL4Exp } from "./L4-ast";
import { Result, makeOk, isOk, bind, makeFailure } from "../shared/result";
import { makeVarGen } from "../L3/substitute";
import { makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp, valueToString, isClosure, isSymbolSExp, isEmptySExp, EmptySExp, SymbolSExp, Closure, CompoundSExp, isCompoundSExp } from './L4-value'
import { isBoolean } from "util";
import { parse as p} from "../shared/parser";

/*
<graph> ::= <header> <graphContent> // Graph(dir: Dir, content: GraphContent)
<header> ::= graph (TD|LR)<newline> // Direction can be TD or LR
<graphContent> ::= <atomicGraph> | <compoundGraph>
<atomicGraph> ::= <nodeDecl>
<compoundGraph> ::= <edge>+
<edge> ::= <node> --><edgeLabel>? <node><newline> // <edgeLabel> is optional
// Edge(from: Node, to: Node, label?: string)
<node> ::= <nodeDecl> | <nodeRef>
<nodeDecl> ::= <identifier>["<string>"] // NodeDecl(id: string, label: string)
<nodeRef> ::= <identifier> // NodeRef(id: string)
<edgeLabel> ::= |<identifier>| // string
*/

export type GraphContent = AtomicGraph | CompoundGraph
export type Node = NodeDecl | NodeRef  

export interface Header {tag: "Header"; direction: Direction;}
export interface Direction {tag: "Direction"; val: string;}
export interface Graph {tag: "Graph"; header: Header , content: GraphContent} 
export interface AtomicGraph {tag: "AtomicGraph"; node: NodeDecl} 
export interface CompoundGraph {tag: "CompoundGraph"; edges: Edge[]}  
export interface Edge {tag:"Edge", from: Node, to: Node, label?: string}
export interface NodeDecl {tag:"NodeDecl", id: Identifier, label: string} 
export interface NodeRef {tag:"NodeRef",  id: Identifier}
export interface EdgeLabel {tag:"EdgeLabel", label: string}  

export const makeHeader = (dir: Direction): Header => ({tag: "Header", direction: dir});
export const makeDirection = (str: string): Direction => ({tag: "Direction", val: str});

export const makeGraph = (hdr: Header , cont: GraphContent): Graph => ({tag: "Graph",header: hdr , content: cont});
export const makeAtomicGraph = (nd: NodeDecl): AtomicGraph => ({tag: "AtomicGraph", node: nd});
export const makeCompoundGraph = (edges: Edge[]): CompoundGraph => ({tag: "CompoundGraph", edges: edges});  
export const makeEdge = (f: Node, t: Node, lbl?: string): Edge => ({tag:"Edge", from: f, to: t, label: lbl});   
export const makeNodeDecl = (id:Identifier, lbl: string ):NodeDecl => ({tag:"NodeDecl", id: id, label: lbl});  
export const makeNodeRef = (id:Identifier ): NodeRef => ({tag:"NodeRef",id: id});  
export const makeEdgeLabel = (lbl:string ): EdgeLabel => ({tag:"EdgeLabel",label: lbl});  


export const isAtomicGraph = (x: any): x is AtomicGraph => x.tag === "AtomicGraph"; 
export const isCompoundGraph = (x: any): x is CompoundGraph => x.tag === "CompoundGraph"; 
export const isEdge = (x: any): x is Edge => x.tag === "Edge";     
export const isNodeDecl = (x: any): x is NodeDecl => x.tag === "NodeDecl";     
export const isNodeRef = (x: any): x is NodeRef => x.tag === "NodeRef";     
export const isEdgeLabel = (x: any): x is EdgeLabel => x.tag === "EdgeLabel";     
export const isHeader = (x: any): x is Header => x.tag === "Header";
export const isDirection = (x: any): x is Direction => x.tag === "Direction";

export const isGraphContent = (x: any): x is GraphContent => isAtomicGraph(x) || isCompoundGraph(x);
export const isNode = (x: any): x is Node =>  isNodeDecl(x) || isNodeRef(x);

export const parseL4Expression = (x: string): Result<Exp> =>
    x !== "" ? bind(p(x), parseL4Exp) : makeFailure("Exp cannot be an empty list") ;  

const unparseFirstEdge = (e: Edge): string =>
e.label !== undefined ? `${unparseNodeDecl(<NodeDecl>e.from)} -->|${e.label}| ${unparseNode(e.to)}`:
`${unparseNodeDecl(<NodeDecl>e.from)} --> ${unparseNode(e.to)}` 

const unparseNodeRef = (nodeRef: Node): string =>
    `${nodeRef.id}`

const unparseNodeDecl = (nodeDecl: NodeDecl): string =>
    `${nodeDecl.id}[${nodeDecl.label}]`

const unparseEdge= (e: Edge) : string => 
    e.label !== undefined ? `${unparseNodeRef(e.from)} -->|${e.label}| ${unparseNode(e.to)}`:
    `${unparseNodeRef(e.from)} --> ${unparseNode(e.to)}`   
    
const unparseCompoundGraph = (compound: CompoundGraph): string => 
    `${unparseFirstEdge(compound.edges[0])}\n${map(unparseEdge,compound.edges.slice(1)).join("\n")}` 
             
export const unparseMermaid = (exp: Graph): Result<string> =>
    makeOk(`graph ${exp.header.direction.val}\n${unparseContent(exp.content)}`)

export const unparseContent = (content: GraphContent): string =>
isCompoundGraph(content) ? unparseCompoundGraph(content) : 
unparseNode(content.node) 

export const unparseNode = (node: Node): string =>
isNodeDecl(node) ? unparseNodeDecl(node) : 
unparseNodeRef(node)


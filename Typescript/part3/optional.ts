import * as R from 'ramda'

/* Question 1 */

export type Optional<T> = Some<T> |  None ;

interface Some<T> {
    tag: "Some";
    value: T;
}

interface None {
    tag: "None";
}

export const makeSome = <T>(value: T): Some<T> => ({ tag: "Some", value: value});
export const makeNone = (): None => ({ tag: "None"}); 

export const isSome = <T>(x: any): x is Some<T> => x.tag === "Some";
export const isNone = <T>(x: any): x is None => x.tag === "None";


/* Question 2 */

export const bind = <T, U>(opt: Optional<T>, f: (x: T) => Optional<U>): Optional<U>=> {
    let newOpt:Optional<U>;
    isNone(opt) ? newOpt=makeNone() : newOpt = f(opt.value); 
    return newOpt;
    } 
     
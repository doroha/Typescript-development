import * as R from 'ramda'

/* Question 1 */
export const partition= function<T>(predicate: (x:T) => boolean, arr: T[]) { return [arr.filter(predicate),arr.filter((x) => !predicate(x))];}

/* Question 2 */
export const mapMat : <T1,T2>(f: (x:T1) => T2, mat: T1[][])=>T2[][]=
    function<T1,T2>(f:(x:T1)=>T2,mat:T1[][]): T2[][] {   
     return mat.map(m => m.map(f));
}    

/* Question 3 */

export const composeMany : <T>(arr: ((x:T) => T)[]) => ((x:T)=> T) = 
    function <T>(arr: ((x:T) => T)[]) : ((x:T)=> T) {
       return arr.reduce((acc, curr) => R.compose(acc,curr), (x:T) => x);
}      


/* Question 4 */
interface Languages {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
}

interface Stats {
    HP: number;
    Attack: number;
    Defense: number;
    "Sp. Attack": number;
    "Sp. Defense": number;
    Speed: number;
}

interface Pokemon {
    id: number;
    name: Languages;
    type: string[];
    base: Stats;
}


export const maxSpeed : (pokemons:Pokemon[]) => Pokemon[] =
    function (pokemons:Pokemon[]): Pokemon[] { 

    let max=pokemons.reduce((acc, curr) => Math.max(acc,curr.base.Speed), pokemons[0].base.Speed);
    return pokemons.filter(p =>  p.base.Speed === max); 
}  


export const grassTypes : (pokemons:Pokemon[]) => String[] =
function (pokemons:Pokemon[]): String[] {  
    const grassType = (t:string) => t === "Grass"; 
    return ((pokemons.filter((p) => p.type.some(grassType))).map(p => p.name.english)).sort() 
  }   

   
export const uniqueTypes: (pokemons:Pokemon[])=> String[] =
function (pokemons:Pokemon[]): String[] {  
    let res:String[] = R.chain( (x) => x , pokemons.map(p => p.type));
    return res.filter ((item, index) => res.indexOf(item)===index).sort();    
}   
 

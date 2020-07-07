
export function* braid(generator1: Generator, generator2: Generator) {
  const firstGen = generator1;
  const secondGen = generator2;
  let first;
  let second;

  do{
    first = firstGen.next();
    second = secondGen.next();
    if(first.value != undefined)
        yield first.value
    if(second.value != undefined)
        yield second.value
  }while(!((first.value === undefined) && (second.value === undefined)))
  return first.value 
}


export function* biased(generator1: Generator, generator2: Generator) {
  const firstGen = generator1;
  const secondGen = generator2;
  let first;
  let second;

  do{
    first = firstGen.next();
    second = secondGen.next();
    if(first.value != undefined)
        yield first.value
    first = firstGen.next();
    if(first.value != undefined)
        yield first.value
    if(second.value != undefined)
        yield second.value
  }while(!((first.value === undefined) && (second.value === undefined)))
  return first.value 
}




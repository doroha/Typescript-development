
export function f(x: number): Promise<number>  {
  return new Promise<number>((resolve, reject) => {
    if(x === 0)
      reject("Division By Zero")
    else resolve(1/x)
  });
}

export function g (x: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    resolve(x*x)
  });  
}
 
export function h(x: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    g(x).then((x) => f(x)).then((x) => resolve(x)) 
      .catch((err) => reject(err))
  });
}

export function slower (promise_arr: Promise<any>[]) : Promise<any> {
  return new Promise((resolve, reject) => {  
      const counter_func = (index: number) => (value: any) => {
        count++;
        if (count==2) resolve([index,`${value}`]) 
          else null 
      }
    var count = 0;

    promise_arr[0].then(counter_func(0)).catch(() => reject(new Error("Error")))
    promise_arr[1].then(counter_func(1)).catch(() => reject(new Error("Error"))) 
   }); 
  }
  
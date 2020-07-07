import * as R from 'ramda'

/* Question 3 */

export type Result<T> = Ok<T> | Failure;

interface Ok<T> {
    tag: "Ok";
    value: T;
}

interface Failure {
    tag: "Failure";
    message: String; 
}   

export const makeOk = <T>(value: T): Ok<T> => ({ tag: "Ok", value: value});
export const makeFailure = (msg: String): Failure => ({ tag: "Failure" , message: msg});

export const isOk =  <T>(x: any): x is Ok<T> => x.tag === "Ok";
export const isFailure = <T>(x: any): x is Failure => x.tag === "Failure";


/* Question 4 */

export const bind = <T, U>(res: Result<T>, f: (x: T) => Result<U>): Result<U>=> {
    let newRes:Result<T> | Result<U>;
    isFailure(res) ? newRes=makeFailure(res.message) : newRes = f(res.value); 
    return newRes;
    } 

/* Question 5 */
interface User {
    name: string;
    email: string;
    handle: string;
}

const validateName = (user: User): Result<User> =>
    user.name.length === 0 ? makeFailure("Name cannot be empty") :
    user.name === "Bananas" ? makeFailure("Bananas is not a name") :
    makeOk(user);

const validateEmail = (user: User): Result<User> =>
    user.email.length === 0 ? makeFailure("Email cannot be empty") :
    user.email.endsWith("bananas.com") ? makeFailure("Domain bananas.com is not allowed") :
    makeOk(user);

const validateHandle = (user: User): Result<User> =>
    user.handle.length === 0 ? makeFailure("Handle cannot be empty") :
    user.handle.startsWith("@") ? makeFailure("This isn't Twitter") :
    makeOk(user);

export const naiveValidateUser = (user: User): Result<User> => {
    let res1:Result<User>=validateName(user)
    let res2:Result<User>=validateEmail(user)
    let res3:Result<User>=validateHandle(user)
    let res:Result<User>

   isFailure(res1) ? res=res1 : isFailure(res2) ?  res=res2:  isFailure(res3) ? res=res3 : res=makeOk(user) 
   return res;
}

/* Question 6 */
export const monadicValidateUser = (user: User): Result<User> =>
     bind(bind(bind(makeOk(user),validateHandle),validateEmail),validateName);      
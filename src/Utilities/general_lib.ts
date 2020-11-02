/** 
 * This function generates unique uuids
 */
export function guid(): string {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);        
    }
    
    return (
        s4() +
        s4() +
        "_" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        s4() +
        s4()
    );
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  
/**
 * This is a deep copy
 */
export function clone(obj, recursionTest?) {
    let copy;
    let attr;
    let i;

    if (recursionTest === undefined) {
        // set default function to recursively drilldown
        recursionTest = () => {
            return true;
        };
    }

    // handle simple types
    if (obj === undefined || obj === null || "object" !== typeof obj) {
        return obj;
    }

    // handle date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // handle array
    if (obj instanceof Array) {
        copy = [];
        const len = obj.length;
        for (i = 0; i < len; i++) {
            copy[i] = recursionTest(obj[i]) ? clone(obj[i], recursionTest) : obj[i];
        }
        return copy;
    }

    // fallback for objects with no clone function implemented
    if (obj instanceof Object) {
        copy = {};
        for (attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = recursionTest(obj[attr])
                ? clone(obj[attr], recursionTest)
                : obj[attr];
            }
        }
        return copy;
    }

    throw new Error (
        "Unable to copy object.  It's type is not supported. Please implement clone function."
    );
}
